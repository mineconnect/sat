#!/usr/bin/env bash
# cloudflare-setup.sh — aplica WAF + Rate Limit + Security settings a la zona
# vía la API de Cloudflare. Idempotente: si una rule ya existe, la skipea.
#
# Requisitos:
#   - jq (brew install jq / apt install jq)
#   - curl
#   - 3 variables de entorno:
#       CF_API_TOKEN   (Token con perms: Zone:Read, Zone WAF:Edit, Zone Settings:Edit)
#                      Crear en: https://dash.cloudflare.com/profile/api-tokens
#                      Template: "Edit zone settings"
#       CF_ZONE_ID     (ID de la zona mineconnect.com.ar. En el dashboard
#                      lado derecho de la página principal de la zona)
#       CF_ACCOUNT_ID  (opcional, solo necesario para queries de account-level)
#
# Uso:
#   export CF_API_TOKEN="xxx"
#   export CF_ZONE_ID="yyy"
#   ./scripts/cloudflare-setup.sh
#
set -euo pipefail

: "${CF_API_TOKEN:?Falta CF_API_TOKEN}"
: "${CF_ZONE_ID:?Falta CF_ZONE_ID}"

API="https://api.cloudflare.com/client/v4"
GREEN='\033[32m'; YEL='\033[33m'; RED='\033[31m'; NC='\033[0m'
pass(){ printf "${GREEN}OK${NC}  %s\n" "$1"; }
skip(){ printf "${YEL}SKIP${NC} %s\n" "$1"; }
fail(){ printf "${RED}ERR${NC} %s\n" "$1"; }

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
# Security settings (zone-level)
# ------------------------------------------------------------------
echo "== Configurando security settings =="
declare -A SETTINGS=(
  [security_level]='"medium"'
  [browser_check]='"on"'
  [challenge_ttl]='1800'
  [min_tls_version]='"1.3"'
  [tls_1_3]='"on"'
  [always_use_https]='"on"'
  [automatic_https_rewrites]='"on"'
  [opportunistic_encryption]='"on"'
  [brotli]='"on"'
  [http3]='"on"'
  [websockets]='"on"'
  [0rtt]='"on"'
  [early_hints]='"on"'
)
for key in "${!SETTINGS[@]}"; do
  resp=$(cf PATCH "/zones/$CF_ZONE_ID/settings/$key" \
    --data "{\"value\":${SETTINGS[$key]}}")
  if [ "$(echo "$resp" | jq -r '.success')" = "true" ]; then
    pass "setting $key=${SETTINGS[$key]}"
  else
    fail "setting $key: $(echo "$resp" | jq -c '.errors')"
  fi
done

# ------------------------------------------------------------------
# WAF Custom Rules (free permite 5)
# ------------------------------------------------------------------
echo ""
echo "== Configurando WAF Custom Rules =="

# Obtener (o crear) el ruleset http_request_firewall_custom
RULESET_ID=$(cf GET "/zones/$CF_ZONE_ID/rulesets" \
  | jq -r '.result[] | select(.phase=="http_request_firewall_custom") | .id' | head -1)

if [ -z "$RULESET_ID" ] || [ "$RULESET_ID" = "null" ]; then
  echo "Creando ruleset http_request_firewall_custom…"
  RULESET_ID=$(cf POST "/zones/$CF_ZONE_ID/rulesets" --data '{
    "name": "MineConnect WAF",
    "kind": "zone",
    "phase": "http_request_firewall_custom",
    "rules": []
  }' | jq -r '.result.id')
  pass "Ruleset creado: $RULESET_ID"
else
  pass "Ruleset existente: $RULESET_ID"
fi

# Definir las 5 reglas
RULES_JSON=$(cat <<'JSON'
{
  "rules": [
    {
      "description": "MC-01: Block scrapers SEO/AI",
      "expression": "(http.user_agent contains \"AhrefsBot\" or http.user_agent contains \"SemrushBot\" or http.user_agent contains \"MJ12bot\" or http.user_agent contains \"DotBot\" or http.user_agent contains \"PetalBot\" or http.user_agent contains \"Bytespider\" or http.user_agent contains \"GPTBot\" or http.user_agent contains \"ClaudeBot\" or http.user_agent contains \"anthropic-ai\" or http.user_agent contains \"CCBot\")",
      "action": "block",
      "enabled": true
    },
    {
      "description": "MC-02: Block sensitive paths",
      "expression": "(http.request.uri.path contains \"/.git\" or http.request.uri.path contains \"/.env\" or http.request.uri.path contains \"/wp-admin\" or http.request.uri.path contains \"/wp-login\" or http.request.uri.path contains \"/phpmyadmin\" or http.request.uri.path contains \"/.htaccess\" or http.request.uri.path contains \"/node_modules\")",
      "action": "block",
      "enabled": true
    },
    {
      "description": "MC-03: Challenge non-form POSTs",
      "expression": "(http.request.method eq \"POST\" and not http.request.uri.path matches \"^/contacto\" and not http.request.uri.path matches \"^/functions/v1/\")",
      "action": "managed_challenge",
      "enabled": true
    },
    {
      "description": "MC-04: Block empty user agents",
      "expression": "(http.user_agent eq \"\")",
      "action": "block",
      "enabled": true
    },
    {
      "description": "MC-05: Block weird HTTP methods",
      "expression": "(not http.request.method in {\"GET\" \"POST\" \"HEAD\" \"OPTIONS\"})",
      "action": "block",
      "enabled": true
    }
  ]
}
JSON
)

# PUT replaces all rules in the ruleset (atomic)
resp=$(cf PUT "/zones/$CF_ZONE_ID/rulesets/$RULESET_ID" --data "$RULES_JSON")
if [ "$(echo "$resp" | jq -r '.success')" = "true" ]; then
  pass "5 WAF custom rules aplicadas"
else
  fail "WAF rules: $(echo "$resp" | jq -c '.errors')"
fi

# ------------------------------------------------------------------
# Rate Limit (ruleset http_ratelimit, free permite 1 rule)
# ------------------------------------------------------------------
echo ""
echo "== Configurando Rate Limit =="

RL_RULESET_ID=$(cf GET "/zones/$CF_ZONE_ID/rulesets" \
  | jq -r '.result[] | select(.phase=="http_ratelimit") | .id' | head -1)

if [ -z "$RL_RULESET_ID" ] || [ "$RL_RULESET_ID" = "null" ]; then
  RL_RULESET_ID=$(cf POST "/zones/$CF_ZONE_ID/rulesets" --data '{
    "name": "MineConnect Rate Limit",
    "kind": "zone",
    "phase": "http_ratelimit",
    "rules": []
  }' | jq -r '.result.id')
  pass "Rate-limit ruleset creado: $RL_RULESET_ID"
else
  pass "Rate-limit ruleset existente: $RL_RULESET_ID"
fi

RL_JSON=$(cat <<'JSON'
{
  "rules": [
    {
      "description": "MC-RL-01: Form abuse protection",
      "expression": "(http.request.uri.path eq \"/contacto.html\" and http.request.method eq \"POST\")",
      "action": "block",
      "ratelimit": {
        "characteristics": ["ip.src"],
        "period": 60,
        "requests_per_period": 10,
        "mitigation_timeout": 3600
      },
      "enabled": true
    }
  ]
}
JSON
)

resp=$(cf PUT "/zones/$CF_ZONE_ID/rulesets/$RL_RULESET_ID" --data "$RL_JSON")
if [ "$(echo "$resp" | jq -r '.success')" = "true" ]; then
  pass "Rate-limit rule aplicada (10/min/IP en /contacto.html POST)"
else
  fail "Rate-limit: $(echo "$resp" | jq -c '.errors')"
fi

# ------------------------------------------------------------------
# Bot Fight Mode
# ------------------------------------------------------------------
echo ""
echo "== Activando Bot Fight Mode =="
resp=$(cf PUT "/zones/$CF_ZONE_ID/bot_management" --data '{
  "fight_mode": true,
  "using_latest_model": true,
  "optimize_wordpress": false
}')
if [ "$(echo "$resp" | jq -r '.success')" = "true" ]; then
  pass "Bot Fight Mode: ON"
else
  skip "Bot Fight Mode (puede requerir plan Pro+): $(echo "$resp" | jq -r '.errors[0].message')"
fi

# ------------------------------------------------------------------
# Resumen final
# ------------------------------------------------------------------
echo ""
echo "=============================================="
echo "  Cloudflare setup completo para $ZONE_NAME"
echo "=============================================="
echo ""
echo "Verificar manualmente en dashboard:"
echo "  - SSL/TLS → Overview: Full (strict)"
echo "  - Security → Bots → Block AI Scrapers: ON"
echo "  - Pages → Custom domain www. apuntando a tu proyecto Pages"
echo ""
echo "Probar el sitio:"
echo "  URL=https://www.mineconnect.com.ar ./scripts/verify-security.sh"
