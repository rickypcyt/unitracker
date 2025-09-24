#!/bin/bash

# Script para configurar Bundle ID y nombre de la app
echo "⚙️  Configurando UniTracker para distribución..."

# Solicitar información al usuario
read -p "🏷️  Ingresa tu Bundle ID (ej: com.tudominio.unitracker): " BUNDLE_ID
read -p "📱 Ingresa el nombre de la app (ej: UniTracker): " APP_NAME
read -p "🔢 Ingresa la versión (ej: 1.0.0): " VERSION
read -p "🏗️  Ingresa el build number (ej: 1): " BUILD_NUMBER

# Validar que no estén vacíos
if [ -z "$BUNDLE_ID" ] || [ -z "$APP_NAME" ] || [ -z "$VERSION" ] || [ -z "$BUILD_NUMBER" ]; then
    echo "❌ Error: Todos los campos son requeridos"
    exit 1
fi

echo "📝 Actualizando configuraciones..."

# Actualizar Capacitor config
sed -i "s/appId: process.env.BUNDLE_ID || 'com.example.unitracker'/appId: '$BUNDLE_ID'/g" capacitor.config.ts
sed -i "s/appName: process.env.APP_NAME || 'UniTracker'/appName: '$APP_NAME'/g" capacitor.config.ts

# Actualizar Android build.gradle
sed -i "s/applicationId \"com.example.unitracker\"/applicationId \"$BUNDLE_ID\"/g" android/app/build.gradle
sed -i "s/namespace \"com.example.unitracker\"/namespace \"$BUNDLE_ID\"/g" android/app/build.gradle
sed -i "s/versionName \"1.0\"/versionName \"$VERSION\"/g" android/app/build.gradle
sed -i "s/versionCode 1/versionCode $BUILD_NUMBER/g" android/app/build.gradle

# Actualizar strings.xml de Android
if [ -f "android/app/src/main/res/values/strings.xml" ]; then
    sed -i "s/<string name=\"app_name\">.*<\/string>/<string name=\"app_name\">$APP_NAME<\/string>/g" android/app/src/main/res/values/strings.xml
fi

echo "✅ Configuración completada!"
echo ""
echo "📋 Resumen de cambios:"
echo "   Bundle ID: $BUNDLE_ID"
echo "   Nombre: $APP_NAME"
echo "   Versión: $VERSION"
echo "   Build: $BUILD_NUMBER"
echo ""
echo "🔄 Ejecuta 'npx cap sync' para aplicar los cambios"
