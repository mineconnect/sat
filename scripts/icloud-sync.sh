#!/usr/bin/env bash
# icloud-sync.sh — Mantiene un snapshot del repo en iCloud Drive.
#
# Por qué snapshot y no symlink/clone directo:
#   - iCloud Drive sincroniza CADA archivo, incluyendo `.git/objects` (miles
#     de archivos pequeños) y `node_modules` (cientos de miles). Eso rompe
#     iCloud o lo hace inservible.
#   - Un snapshot limpio (sin .git ni node_modules) es navegable desde la
#     app Archivos del iPhone y sirve como backup. La fuente de verdad
#     sigue siendo GitHub.
#
# Ejecutar SOLO en la Mac:
#   bash scripts/icloud-sync.sh
#
# Opcional: agendarlo cada hora con launchd (ver bloque al final del script).

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ICLOUD_BASE="$HOME/Library/Mobile Documents/com~apple~CloudDocs"
DEST="$ICLOUD_BASE/MineConnect-SAT"

# Sanity checks
if [[ "$(uname -s)" != "Darwin" ]]; then
    echo "✗ Este script solo corre en macOS. Estás en: $(uname -s)"
    exit 1
fi

if [[ ! -d "$ICLOUD_BASE" ]]; then
    echo "✗ iCloud Drive no está activado en esta Mac."
    echo "  Habilítalo en: Ajustes del Sistema → Apple ID → iCloud → iCloud Drive"
    exit 1
fi

if ! command -v rsync >/dev/null 2>&1; then
    echo "✗ rsync no está instalado."
    exit 1
fi

mkdir -p "$DEST"

echo "→ Repo origen: $REPO_ROOT"
echo "→ iCloud dest: $DEST"
echo ""
echo "→ Sincronizando (excluye .git, node_modules, dist, .vite)..."

rsync -av --delete \
    --exclude='.git/' \
    --exclude='node_modules/' \
    --exclude='dist/' \
    --exclude='.vite/' \
    --exclude='.DS_Store' \
    --exclude='*.zip' \
    --exclude='.env' \
    --exclude='.env.*' \
    "$REPO_ROOT/" "$DEST/"

# Marcador con el commit actual para saber qué versión hay en iCloud
if git -C "$REPO_ROOT" rev-parse HEAD >/dev/null 2>&1; then
    {
        echo "Snapshot generado: $(date -Iseconds)"
        echo "Branch: $(git -C "$REPO_ROOT" branch --show-current)"
        echo "Commit: $(git -C "$REPO_ROOT" rev-parse HEAD)"
        echo "Estado: $(git -C "$REPO_ROOT" status --porcelain | wc -l | tr -d ' ') archivos modificados sin commitear"
    } > "$DEST/.snapshot-info.txt"
fi

echo ""
echo "✓ Snapshot listo en: $DEST"
echo "  Tamaño: $(du -sh "$DEST" | cut -f1)"
echo ""
echo "Para agendar cada hora con launchd, guarda este plist en"
echo "  ~/Library/LaunchAgents/com.mineconnect.icloud-sync.plist"
echo "y cargalo con: launchctl load ~/Library/LaunchAgents/com.mineconnect.icloud-sync.plist"
echo ""
cat <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.mineconnect.icloud-sync</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>${REPO_ROOT}/scripts/icloud-sync.sh</string>
    </array>
    <key>StartInterval</key>
    <integer>3600</integer>
    <key>StandardOutPath</key>
    <string>/tmp/icloud-sync.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/icloud-sync.err</string>
</dict>
</plist>
PLIST
