#!/bin/bash

# Script para generar keystore para firmar APK de Android
# Ejecuta este script para crear tu keystore de producción

echo "🔑 Generando keystore para UniTracker..."
echo "⚠️  IMPORTANTE: Guarda bien la contraseña y el archivo keystore, los necesitarás para futuras actualizaciones"
echo ""

# Crear directorio para keystores si no existe
mkdir -p android/keystores

# Generar keystore
keytool -genkey -v -keystore android/keystores/unitracker-release.keystore \
    -alias unitracker \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000

echo ""
echo "✅ Keystore generado en: android/keystores/unitracker-release.keystore"
echo ""
echo "📝 Próximos pasos:"
echo "1. Configura el archivo android/key.properties con los datos del keystore"
echo "2. Actualiza android/app/build.gradle para usar el keystore"
echo "3. Ejecuta './gradlew bundleRelease' para generar el AAB"
