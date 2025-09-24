#!/bin/bash

# Script para generar builds de release para ambas plataformas
echo "🚀 Generando builds de release para UniTracker..."

# Verificar que existe el keystore
if [ ! -f "android/keystores/unitracker-release.keystore" ]; then
    echo "❌ Error: No se encontró el keystore. Ejecuta primero:"
    echo "   keytool -genkey -v -keystore android/keystores/unitracker-release.keystore -alias unitracker -keyalg RSA -keysize 2048 -validity 10000"
    exit 1
fi

# Verificar que existe key.properties
if [ ! -f "android/key.properties" ]; then
    echo "❌ Error: No se encontró android/key.properties"
    echo "   Copia android/key.properties.template a android/key.properties y completa los datos"
    exit 1
fi

echo "📦 Construyendo web app..."
npm run build:mobile

echo "🔄 Sincronizando plataformas..."
npx cap sync

echo "🤖 Generando Android App Bundle (AAB)..."
cd android
./gradlew bundleRelease
cd ..

echo "✅ Build completado!"
echo ""
echo "📁 Archivos generados:"
echo "   Android AAB: android/app/build/outputs/bundle/release/app-release.aab"
echo ""
echo "📝 Próximos pasos:"
echo "   1. Para Android: Sube el AAB a Google Play Console"
echo "   2. Para iOS: Abre ios/App/App.xcworkspace en Xcode y archiva"
