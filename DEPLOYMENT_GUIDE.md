# 📱 Guía de Despliegue - UniTracker

## 🤖 Android (Google Play Store)

### 1. Generar Keystore para Firma

```bash
# Crear keystore (usa una contraseña de al menos 6 caracteres)
keytool -genkey -v -keystore android/keystores/unitracker-release.keystore \
    -alias unitracker \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000
```

**Datos requeridos:**
- Contraseña del keystore (mínimo 6 caracteres)
- Nombre y apellido
- Unidad organizacional
- Organización
- Ciudad/Localidad
- Estado/Provincia
- Código de país (ES para España)

### 2. Configurar key.properties

Copia `android/key.properties.template` a `android/key.properties` y completa:

```properties
storePassword=TU_PASSWORD_DEL_KEYSTORE
keyPassword=TU_PASSWORD_DE_LA_KEY
keyAlias=unitracker
storeFile=keystores/unitracker-release.keystore
```

### 3. Generar AAB para Google Play

```bash
# Construir el Android App Bundle
cd android
./gradlew bundleRelease

# El archivo se generará en:
# android/app/build/outputs/bundle/release/app-release.aab
```

### 4. Subir a Google Play Console

1. Ve a [Google Play Console](https://play.google.com/console)
2. Crea una nueva aplicación
3. Completa la información de la tienda:
   - Título de la app
   - Descripción corta y larga
   - Capturas de pantalla
   - Icono de la aplicación
   - Gráfico de funciones
4. Sube el archivo AAB en "Versiones de la app" → "Producción"
5. Completa el cuestionario de contenido
6. Configura precios y distribución
7. Envía para revisión

---

## 🍎 iOS (App Store)

### 1. Configurar en Xcode (requiere Mac)

```bash
# Abrir proyecto en Xcode
open ios/App/App.xcworkspace
```

### 2. Configuración en Xcode

**Bundle Identifier:**
- Cambiar de `com.example.unitracker` a `com.tudominio.unitracker`
- Debe ser único en toda la App Store

**Versioning:**
- Version: 1.0.0
- Build: 1

**App Icons:**
- Agregar iconos en todos los tamaños requeridos
- Usar herramientas como [App Icon Generator](https://appicon.co/)

**Launch Screen:**
- Configurar pantalla de carga

### 3. Certificados y Perfiles

1. **Apple Developer Account** ($99/año)
2. **Certificados de distribución**
3. **Provisioning Profiles**

### 4. Archivar y Distribuir

```bash
# En Xcode:
# 1. Product → Archive
# 2. Organizer → Distribute App
# 3. App Store Connect
# 4. Upload
```

### 5. App Store Connect

1. Ve a [App Store Connect](https://appstoreconnect.apple.com)
2. Crea nueva app
3. Completa metadata:
   - Nombre de la app
   - Subtítulo
   - Descripción
   - Palabras clave
   - Capturas de pantalla
   - Información de contacto
4. Configura precios y disponibilidad
5. Envía para revisión

---

## 📋 Checklist Pre-Lanzamiento

### Ambas Plataformas:
- [ ] Cambiar Bundle ID/Application ID de `com.example.unitracker`
- [ ] Actualizar versión y build number
- [ ] Crear iconos de app en todos los tamaños
- [ ] Preparar capturas de pantalla
- [ ] Escribir descripción de la app
- [ ] Configurar política de privacidad (si es necesario)
- [ ] Probar la app en dispositivos reales

### Solo Android:
- [ ] Generar keystore y guardarlo seguro
- [ ] Configurar key.properties
- [ ] Generar AAB firmado
- [ ] Completar cuestionario de contenido de Google Play

### Solo iOS:
- [ ] Cuenta de Apple Developer activa
- [ ] Certificados y perfiles configurados
- [ ] Archivar en Xcode
- [ ] Subir a App Store Connect

---

## 🚨 Notas Importantes

1. **Keystore Android**: ¡NUNCA pierdas el keystore! Sin él no podrás actualizar la app
2. **Bundle ID**: Debe ser único y no se puede cambiar después de subir
3. **Iconos**: Cada plataforma tiene requisitos específicos de tamaño
4. **Tiempo de revisión**: 
   - Google Play: 1-3 días
   - App Store: 1-7 días
5. **Política de privacidad**: Requerida si recopilas datos de usuarios
