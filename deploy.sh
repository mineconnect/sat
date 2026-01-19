#!/bin/bash

# Configuración - ¡REVISÁ ESTO!
REPO_URL="https://github.com/mineconnect/mineconnect.github.io.git"
DIST_PATH="./dist"
TEMP_DIR="../temp_hosting"
SUBFOLDER="sat"

echo "🚀 Iniciando despliegue de SAT..."

# 1. Build del proyecto
echo "📦 Compilando aplicación..."
npm run build

# 2. Limpieza de carpeta temporal
rm -rf $TEMP_DIR
mkdir $TEMP_DIR

# 3. Clonar el repositorio de hosting
echo "📥 Clonando repositorio de hosting..."
git clone $REPO_URL $TEMP_DIR

# 4. Preparar la carpeta destino
echo "🧹 Limpiando carpeta /$SUBFOLDER anterior..."
mkdir -p "$TEMP_DIR/$SUBFOLDER"
rm -rf "$TEMP_DIR/$SUBFOLDER"/*

# 5. Copiar archivos nuevos (incluyendo assets)
echo "📂 Copiando archivos de dist a /$SUBFOLDER..."
cp -r $DIST_PATH/* "$TEMP_DIR/$SUBFOLDER/"

# 6. Push a GitHub
echo "📤 Subiendo cambios a GitHub..."
cd $TEMP_DIR
git add .
git commit -m "feat: SAT Platform V1 - Update desde script automático"
git push origin main

# 7. Cleanup
cd -
rm -rf $TEMP_DIR

echo "✅ ¡SAT Desplegado con éxito en mineconnect.com.ar/sat!"