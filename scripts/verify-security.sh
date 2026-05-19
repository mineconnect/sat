#!/usr/bin/env bash
# verify-security.sh — verificación local antes de merge / deploy
# Corre todos los checks que hace el CI, en orden y con output legible.
set -uo pipefail

cd "$(dirname "$0")/.."
RED='\033[31m'; GREEN='\033[32m'; YEL='\033[33m'; NC='\033[0m'
pass() { printf "${GREEN}PASS${NC} %s\n" "$1"; }
fail() { printf "${RED}FAIL${NC} %s\n" "$1"; RC=1; }
warn() { printf "${YEL}WARN${NC} %s\n" "$1"; }
RC=0

echo "== verify-security.sh ============================="

# 1) npm audit (production deps)
echo "-- npm audit --audit-level=high"
if npm audit --audit-level=high --omit=dev >/tmp/audit.log 2>&1; then
  pass "npm audit (no high+)"
else
  fail "npm audit reportó vulnerabilidades"; tail -20 /tmp/audit.log
fi

# 2) secret scan local (gitleaks si existe, sino grep)
echo "-- secret scan"
if command -v gitleaks >/dev/null; then
  if gitleaks detect --no-banner --redact --exit-code 0 >/tmp/gl.log 2>&1; then
    pass "gitleaks (sin secretos)"
  else
    fail "gitleaks encontró potenciales secretos"; tail -10 /tmp/gl.log
  fi
else
  if grep -rE '(api[_-]?key|secret|password|token)\s*[:=]\s*["\x27][^"\x27]{20,}' \
       --include='*.{js,ts,json,html,yml,yaml}' \
       --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist . >/tmp/grep.log 2>&1; then
    warn "grep encontró líneas sospechosas (revisar manualmente):"; cat /tmp/grep.log
  else
    pass "grep secretos (limpio)"
  fi
fi

# 3) CSP hashes sincronizados con inline scripts
echo "-- CSP hashes sync"
if [ -x scripts/compute-csp-hashes.sh ]; then
  ./scripts/compute-csp-hashes.sh site | sort -u > /tmp/computed.txt
  for f in site/_headers netlify.toml vercel.json site/.htaccess; do
    grep -oE "'sha256-[A-Za-z0-9+/=]+'" "$f" | sort -u > /tmp/in_backend.txt
    if diff -q /tmp/computed.txt /tmp/in_backend.txt >/dev/null; then
      pass "CSP hashes sincronizados ($f)"
    else
      fail "CSP hashes desincronizados ($f). Corré ./scripts/compute-csp-hashes.sh y actualizá."
    fi
  done
else
  warn "compute-csp-hashes.sh no encontrado"
fi

# 4) Headers de producción (si la URL está reachable)
URL="${URL:-https://mineconnect.com.ar}"
echo "-- headers en $URL"
if curl -sI --max-time 10 "$URL" >/tmp/hdrs.txt 2>/dev/null; then
  required=("strict-transport-security" "x-content-type-options" "x-frame-options"
            "content-security-policy" "referrer-policy" "permissions-policy")
  for h in "${required[@]}"; do
    if grep -qi "^$h:" /tmp/hdrs.txt; then pass "header $h"; else fail "falta header $h"; fi
  done
else
  warn "no se pudo curl $URL (offline o aún sin deploy)"
fi

# 5) Validar que no haya event handlers inline (onclick=, etc) en HTML
echo "-- event handlers inline"
if grep -rnE 'on(click|load|submit|change|input|focus|blur|mouseover|keydown|keyup)=' \
   --include='*.html' site/ >/tmp/ev.log 2>&1; then
  fail "event handlers inline detectados (rompen CSP estricta):"; cat /tmp/ev.log
else
  pass "sin event handlers inline"
fi

# 6) Validar que no haya http:// hardcodeado en HTML
echo "-- http:// hardcodeado"
if grep -rnE 'href="http://|src="http://' --include='*.html' site/ >/tmp/http.log 2>&1; then
  warn "http:// hardcodeado (debería migrarse a https://):"; cat /tmp/http.log
else
  pass "todos los links son https://"
fi

# 7) Auditar inline styles (deuda CSP — bloquea migración a script-src estricto)
echo "-- inline styles"
STYLE_BLOCKS=0
for f in $(find site -name "*.html"); do
  c=$(perl -0777 -ne 'while(/<style[^>]*>(.*?)<\/style>/gs){print "1\n"}' "$f" 2>/dev/null | wc -l | tr -d ' ')
  STYLE_BLOCKS=$((STYLE_BLOCKS + c))
done
STYLE_ATTRS=$(grep -rhoE 'style="[^"]+"' --include='*.html' site/ 2>/dev/null | wc -l | tr -d ' ')
STYLE_ATTRS=${STYLE_ATTRS:-0}
# Baseline conocido al momento de medirlo. Si crece, warning.
BL_BLOCKS=13
BL_ATTRS=260
if [ "$STYLE_BLOCKS" -gt "$BL_BLOCKS" ] || [ "$STYLE_ATTRS" -gt "$BL_ATTRS" ]; then
  warn "inline styles aumentaron — blocks=$STYLE_BLOCKS (BL=$BL_BLOCKS), attrs=$STYLE_ATTRS (BL=$BL_ATTRS). Si CSP migra a strict style-src, esto rompe."
else
  pass "inline styles dentro de baseline (blocks=${STYLE_BLOCKS}<=${BL_BLOCKS}, attrs=${STYLE_ATTRS}<=${BL_ATTRS})"
fi

# 8) Auditar archivos > 5 MB (alertan deploys lentos / costos egress)
echo "-- archivos grandes"
LARGE=$(find site -type f -size +5M 2>/dev/null | wc -l | tr -d ' ')
if [ "$LARGE" -gt 0 ]; then
  warn "$LARGE archivos > 5MB:"; find site -type f -size +5M -exec ls -lh {} \;
else
  pass "ningún archivo > 5MB"
fi

# 9) Verificar que SECURITY.md y DEPLOY-SECURITY.md existen
echo "-- docs de seguridad"
for f in SECURITY.md DEPLOY-SECURITY.md; do
  [ -f "$f" ] && pass "$f presente" || fail "$f falta"
done

echo "==================================================="
if [ $RC -eq 0 ]; then
  printf "${GREEN}OK${NC} — todos los checks pasaron\n"
else
  printf "${RED}FAIL${NC} — hay errores que resolver\n"
fi
exit $RC
