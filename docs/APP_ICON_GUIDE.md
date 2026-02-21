# ProFish App Icon Generation

## Design Spec

### Icon Concept

- **Primary**: Stylized fish silhouette (bass/pike profile) with dorsal fin
- **Background**: Deep ocean blue gradient (`#0060CC` → `#003D80`)
- **Accent**: Fish outlined in ProFish orange (`#FF9800`)
- **Shape**: Android adaptive icon (safe zone circle + full bleed background)

### Colors

| Element        | Color     |
| -------------- | --------- |
| Background top | `#0080FF` |
| Background bot | `#003D80` |
| Fish outline   | `#FFFFFF` |
| Fish accent    | `#FF9800` |

### Sizes Required

#### Android (place in `android/app/src/main/res/`)

| Folder         | Size    |
| -------------- | ------- |
| mipmap-mdpi    | 48×48   |
| mipmap-hdpi    | 72×72   |
| mipmap-xhdpi   | 96×96   |
| mipmap-xxhdpi  | 144×144 |
| mipmap-xxxhdpi | 192×192 |

#### Adaptive Icon (Android 8+)

- `ic_launcher_foreground.png` — 108dp (432×432 at xxxhdpi)
- `ic_launcher_background.png` — 108dp solid color or gradient

#### iOS (place in `ios/ProFish/Images.xcassets/AppIcon.appiconset/`)

| Size   | Scale | Filename |
| ------ | ----- | -------- |
| 20pt   | 2x    | 40.png   |
| 20pt   | 3x    | 60.png   |
| 29pt   | 2x    | 58.png   |
| 29pt   | 3x    | 87.png   |
| 40pt   | 2x    | 80.png   |
| 40pt   | 3x    | 120.png  |
| 60pt   | 2x    | 120.png  |
| 60pt   | 3x    | 180.png  |
| 1024pt | 1x    | 1024.png |

### Quick Generation with `react-native-make`

```bash
npx react-native set-icon --path ./assets/icon-1024.png
```

### Manual Generation

Use https://icon.kitchen or https://makeappicon.com with a 1024×1024 source PNG.

## Splash Screen

### Android

Already configured in `styles.xml` with `SplashTheme`.
The splash background is `#0a0a1a` (ProFish dark).

For a proper splash with logo, install `react-native-bootsplash`:

```bash
npx react-native-bootsplash generate assets/logo.png --background=#0a0a1a --logo-width=120
```

### iOS

Configure via Xcode → LaunchScreen.storyboard or use bootsplash.
