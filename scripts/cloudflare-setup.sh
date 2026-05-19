#!/usr/bin/env bash
# cloudflare-setup.sh — aplica WAF + Rate Limit + Security settings a la zona
# vía la API de Cloudflare. Idempotente.
#
# Compatibilidad: bash 3.2+ (macOS default). Sin associative arrays.
# Compatibilidad: plan FREE — sin operador `matches` (regex), sin period/timeout
#                 customizados en Rate Limit (free force period=10, timeout=10).
#
# Requisitos:
#   - jq, curl
#   - CF_API_TOKEN  (perms: Zone:Read, Zone WAF:Edit, Zone Settings:Edit)
#                   Generar en: https://dash.cloudflare.com/profile/api-tokens
#   - CF_ZONE_ID    (en la página de overview de la zona, panel derecho "API")
#
# Uso:
#   export CF_API_TOKEN="xxx"
#   export CF_ZONE_ID="yyy"
#   ./scripts/cloudflare-setup.sh
#
set -eo pipefail

: "${CF_API_TOKEN:?Falta CF_API_TOKEN}"
: "${CF_ZONE_ID:?Falta CF_ZONE_ID}"

API="https://api.cloudflare.com/client/v4"
GREEN='\033[32m'; YEL='\033[33m'; RED='\033[31m'; NC='\033[0m'
pass(){ printf "${GREEN}OK${NC}   %s\n" "$1"; }
skip(){ printf "${YEL}SKIP${NC} %s\n" "$1"; }
fail(){ printf "${RED}ERR${NC}  %s\n" "$1"; }

cf() {
  local method=$1; shift
  local path=$1; shift
  curl -sS -X "$method" "$API$path" \
       -H "Authorization: Bearer $CF_API_TOKEN" \
       -H "Content-Type: application/json" \
       "$@"
}

echo "== Verificando token y zona =="
ZONE_INFO=$(cf GET "/zones/$CF_ZONE_ID")
if [ "$(echo "$ZONE_INFO" | jq -r '.success')" != "true" ]; then
  fail "Token o zone_id inválido"; echo "$ZONE_INFO" | jq '.errors'; exit 1
fi
ZONE_NAME=$(echo "$ZONE_INFO" | jq -r '.result.name')
pass "Zona: $ZONE_NAME"

# ------------------------------------------------------------------
# Security settings (zone-level). Lista pares clave:valor sin
# associative array (compat bash 3.2 / macOS).
# ------------------------------------------------------------------
echo ""
echo "== Configurando 13 security settings =="
SETTINGS='
security_level "medium"
browser_check "on"
challenge_ttl 1800
min_tls_version "1.3"
tls_1_3 "on"
always_use_https "on"
automatic_https_rewrites "on"
opportunistic_encryption "on"
brotli "on"
http3 "on"
websockets "on"
0rtt "on"
early_hints "on"
'
echo "$SETTINGS" | while read key value; do
  [ -z "$key" ] && continue
  resp=$(cf PATCH "/zones/$CF_ZONE_ID/settings/$key" --data "{\"value\":$value}")
  if [ "$(echo "$resp" | jq -r '.success')" = "true" ]; then
    pass "$key = $value"
  else
    fail "$key: $(echo "$resp" | jq -c '.errors')"
  fi
done

# ------------------------------------------------------------------
# WAF Custom Rules (free permite 5, sin operador `matches`).
# ------------------------------------------------------------------
echo ""
echo "== WAF Custom Rules (5, free tier) =="

RULESET_ID=$(cf GET "/zones/$CF_ZONE_ID/rulesets" \
  | jq -r '.result[] | select(.phase=="http_request_firewall_custom") | .id' | head -1)

if [ -z "$RULESET_ID" ] || [ "$RULESET_ID" = "null" ]; then
  RULESET_ID=$(cf POST "/zones/$CF_ZONE_ID/rulesets" --data '{
    "name": "MineConnect WAF","kind":"zone","phase":"http_request_firewall_custom","rules":[]
  }' | jq -r '.result.id')
  pass "Ruleset creado: $RULESET_ID"
else
  pass "Ruleset existente: $RULESET_ID"
fi

# MC-03 usa starts_with() en lugar de regex matches (free no permite regex).
RULES_JSON=$(cat <<'JSON'
{
  "rules": [
    {
      "description": "MC-01: Block scrapers SEO/AI",
      "expression": "(http.user_agent contains \"AhrefsBot\" or http.user_agent contains \"SemrushBot\" or http.user_agent contains \"MJ12bot\" or http.user_agent contains \"DotBot\" or http.user_agent contains \"PetalBot\" or http.user_agent contains \"Bytespider\" or http.user_agent contains \"GPTBot\" or http.user_agent contains \"ClaudeBot\" or http.user_agent contains \"anthropic-ai\" or http.user_agent contains \"CCBot\")",
      "action": "block", "enabled": true
    },
    {
      "description": "MC-02: Block sensitive paths",
      "expression": "(http.request.uri.path contains \"/.git\" or http.request.uri.path contains \"/.env\" or http.request.uri.path contains \"/wp-admin\" or http.request.uri.path contains \"/wp-login\" or http.request.uri.path contains \"/phpmyadmin\" or http.request.uri.path contains \"/.htaccess\" or http.request.uri.path contains \"/node_modules\")",
      "action": "block", "enabled": true
    },
    {
      "description": "MC-03: Challenge non-form POSTs",
      "expression": "(http.request.method eq \"POST\" and not http.request.uri.path eq \"/contacto.html\" and not starts_with(http.request.uri.path, \"/functions/v1/\"))",
      "action": "managed_challenge", "enabled": true
    },
    {
      "description": "MC-04: Block empty user agents",
      "expression": "(http.user_agent eq \"\")",
      "action": "block", "enabled": true
    },
    {
      "description": "MC-05: Block weird HTTP methods",
      "expression": "(not http.request.method in {\"GET\" \"POST\" \"HEAD\" \"OPTIONS\"})",
      "action": "block", "enabled": true
    }
  ]
}
JSON
)

resp=$(cf PUT "/zones/$CF_ZONE_ID/rulesets/$RULESET_ID" --data "$RULES_JSON")
if [ "$(echo "$resp" | jq -r '.success')" = "true" ]; then
  pass "5 WAF custom rules aplicadas"
  echo "$resp" | jq -r '.result.rules[] | "       • " + .description + " → " + .action'
else
  fail "WAF: $(echo "$resp" | jq -c '.errors')"
fi

# ------------------------------------------------------------------
# Rate Limit — free tier: period=10, mitigation_timeout=10, requiere cf.colo.id
# ------------------------------------------------------------------
echo ""
echo "== Rate Limit (free tier: period 10s, ban 10s) =="

RL_ID=$(cf GET "/zones/$CF_ZONE_ID/rulesets" \
  | jq -r '.result[] | select(.phase=="http_ratelimit") | .id' | head -1)

if [ -z "$RL_ID" ] || [ "$RL_ID" = "null" ]; then
  RL_ID=$(cf POST "/zones/$CF_ZONE_ID/rulesets" --data '{
    "name":"MineConnect Rate Limit","kind":"zone","phase":"http_ratelimit","rules":[]
  }' | jq -r '.result.id')
  pass "Ruleset RL creado: $RL_ID"
else
  pass "Ruleset RL existente: $RL_ID"
fi

RL_JSON=$(cat <<'JSON'
{
  "rules": [
    {
      "description": "MC-RL-01: Form abuse (free: 2req/10s/IP, ban 10s)",
      "expression": "(http.request.uri.path eq \"/contacto.html\" and http.request.method eq \"POST\")",
      "action": "block",
      "ratelimit": {
        "characteristics": ["ip.src", "cf.colo.id"],
        "period": 10,
        "requests_per_period": 2,
        "mitigation_timeout": 10
      },
      "enabled": true
    }
  ]
}
JSON
)

resp=$(cf PUT "/zones/$CF_ZONE_ID/rulesets/$RL_ID" --data "$RL_JSON")
if [ "$(echo "$resp" | jq -r '.success')" = "true" ]; then
  pass "Rate Limit: 2 req / 10s / IP / colo en /contacto.html POST"
else
  fail "Rate Limit: $(echo "$resp" | jq -c '.errors')"
fi

# ------------------------------------------------------------------
# Bot Fight Mode — endpoint requiere permission Bot Management que el token
# Zone WAF no incluye. Se debe activar manualmente en Dashboard.
# ------------------------------------------------------------------
echo ""
skip "Bot Fight Mode: activar manualmente en Dashboard → Security → Bots"

# ------------------------------------------------------------------
# Resumen final
# ------------------------------------------------------------------
echo ""
echo "============================================================"
echo "  Cloudflare hardening aplicado en zona: $ZONE_NAME"
echo "============================================================"
echo ""
echo "Acciones manuales pendientes en Dashboard:"
echo "  • Security → Bots → Bot Fight Mode = ON"
echo "  • Security → Bots → Block AI Scrapers = ON"
echo "  • SSL/TLS → Overview → modo = Full (strict)"
echo "  • Workers & Pages → Pages → conectar repo mineconnect/sat"
echo "  • CF Pages → Custom domains → www.mineconnect.com.ar"
echo ""
echo "Verificar tras deploy:"
echo "  URL=https://www.mineconnect.com.ar ./scripts/verify-security.sh"
