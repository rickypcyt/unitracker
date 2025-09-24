# 🎨 Guía de Iconos - UniTracker

## 📱 Iconos Requeridos

### Android (Google Play)
- **App Icon**: 512x512 px (PNG, sin transparencia)
- **Adaptive Icon**: 
  - Foreground: 108x108 dp
  - Background: 108x108 dp
- **Notification Icon**: 24x24 dp (blanco con transparencia)

### iOS (App Store)
- **App Store Icon**: 1024x1024 px
- **App Icons** (varios tamaños):
  - 180x180 px (iPhone)
  - 167x167 px (iPad Pro)
  - 152x152 px (iPad)
  - 120x120 px (iPhone)
  - 87x87 px (iPhone)
  - 80x80 px (iPad)
  - 76x76 px (iPad)
  - 58x58 px (iPhone/iPad)
  - 40x40 px (iPhone/iPad)
  - 29x29 px (iPhone/iPad)
  - 20x20 px (iPhone/iPad)

## 🛠️ Herramientas Recomendadas

1. **[App Icon Generator](https://appicon.co/)** - Genera todos los tamaños automáticamente
2. **[Figma](https://figma.com)** - Para diseñar el icono
3. **[Canva](https://canva.com)** - Templates de iconos de app

## 📐 Mejores Prácticas

### Diseño
- **Simple y reconocible** a tamaños pequeños
- **Sin texto** (será ilegible en tamaños pequeños)
- **Colores contrastantes**
- **Esquinas redondeadas** (iOS las aplica automáticamente)

### Técnico
- **Formato PNG** para todos los iconos
- **Sin transparencia** en iconos principales
- **Fondo sólido** recomendado
- **Probar en dispositivos reales**

## 📂 Ubicaciones de Archivos

### Android
```
android/app/src/main/res/
├── mipmap-hdpi/ic_launcher.png (72x72)
├── mipmap-mdpi/ic_launcher.png (48x48)
├── mipmap-xhdpi/ic_launcher.png (96x96)
├── mipmap-xxhdpi/ic_launcher.png (144x144)
└── mipmap-xxxhdpi/ic_launcher.png (192x192)
```

### iOS
```
ios/App/App/Assets.xcassets/AppIcon.appiconset/
├── Icon-App-20x20@1x.png
├── Icon-App-20x20@2x.png
├── Icon-App-20x20@3x.png
├── Icon-App-29x29@1x.png
├── Icon-App-29x29@2x.png
├── Icon-App-29x29@3x.png
└── ... (más tamaños)
```

## ✅ Checklist de Iconos

- [ ] Diseño del icono principal creado
- [ ] Iconos Android generados y colocados
- [ ] Iconos iOS generados y colocados
- [ ] Icono de 1024x1024 para App Store listo
- [ ] Icono de 512x512 para Google Play listo
- [ ] Probado en dispositivos reales
- [ ] Colores y contraste verificados
