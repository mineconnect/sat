#!/usr/bin/env bash
# Computa SHA256 (base64) de cada <script ...> inline en site/*.html
# Emite la lista 'sha256-...' para usar en CSP script-src.
set -euo pipefail
ROOT="${1:-site}"
declare -a hashes
while IFS= read -r f; do
  perl -0777 -ne '
    while (/<script(?![^>]*\bsrc=)[^>]*>(.*?)<\/script>/gs) {
      print $1, "\x00";
    }
  ' "$f" | while IFS= read -r -d '' body; do
    h=$(printf '%s' "$body" | openssl dgst -sha256 -binary | openssl base64)
    echo "'sha256-$h'"
  done
done < <(find "$ROOT" -name "*.html")
