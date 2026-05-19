#!/usr/bin/env bash
# build-dist.sh — empaqueta el sitio listo para deploy en cualquier host.
# Salida: dist/ con site/* + headers/htaccess + manifests.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/dist"

echo "→ Limpiando $OUT"
rm -rf "$OUT"
mkdir -p "$OUT"

echo "→ Copiando site/ a dist/"
cp -R "$ROOT/site/." "$OUT/"

# Auto cache-busting: reemplaza ?v=YYYYMMDDHHMM por el timestamp del build.
# Garantiza que cada deploy invalida CSS/JS cacheados en browsers.
NEW_VER=$(date +%Y%m%d%H%M)
echo "→ Cache-busting → v=$NEW_VER"
find "$OUT" -name "*.html" -type f -exec \
  perl -i -pe "s/\?v=\d+/?v=$NEW_VER/g" {} +

# Asegurar que los archivos de hosting están en raíz del dist
echo "→ Copiando configs de hosting"
[ -f "$ROOT/netlify.toml" ] && cp "$ROOT/netlify.toml" "$OUT/" || true
[ -f "$ROOT/vercel.json"  ] && cp "$ROOT/vercel.json"  "$OUT/" || true

# Generar checksum manifest para auditoría
echo "→ Generando checksums.sha256"
( cd "$OUT" && find . -type f -not -name "checksums.sha256" -print0 \
  | xargs -0 shasum -a 256 | sort -k 2 > checksums.sha256 )

# Validación: confirmar que los headers están en _headers
echo "→ Verificando _headers"
for h in Strict-Transport-Security X-Content-Type-Options X-Frame-Options \
         Content-Security-Policy Referrer-Policy Permissions-Policy; do
  if ! grep -q "$h" "$OUT/_headers" 2>/dev/null; then
    echo "::warning::$h no encontrado en _headers"
  fi
done

# Validación: CSP hashes deben matchear los del HTML
echo "→ Validando CSP hashes sync"
"$ROOT/scripts/compute-csp-hashes.sh" "$OUT" | sort -u > /tmp/dist-computed.txt
grep -oE "'sha256-[A-Za-z0-9+/=]+'" "$OUT/_headers" | sort -u > /tmp/dist-in-backend.txt
if ! diff -q /tmp/dist-computed.txt /tmp/dist-in-backend.txt >/dev/null; then
  echo "::error::Drift CSP↔HTML en dist/. Corré scripts/compute-csp-hashes.sh y actualizá _headers."
  diff /tmp/dist-computed.txt /tmp/dist-in-backend.txt || true
  exit 1
fi

# Estadísticas
echo ""
echo "===================== DIST READY ====================="
echo "Carpeta:  $OUT"
echo "Archivos: $(find "$OUT" -type f | wc -l | tr -d ' ')"
echo "Tamaño:   $(du -sh "$OUT" | cut -f1)"
echo ""
echo "Deploy targets soportados (lee el archivo correspondiente):"
echo "  - Cloudflare Pages / Netlify:  _headers      (en raíz)"
echo "  - Vercel:                      vercel.json   (en raíz)"
echo "  - Netlify (alt):               netlify.toml  (en raíz)"
echo "  - Apache (cPanel/shared):      .htaccess     (en raíz)"
echo "  - GitHub Pages:                NO soporta headers"
echo ""
echo "Subir contenido de $OUT a la raíz del hosting."
echo "======================================================"
