/**
 * App Icon Configuration — ProFish
 * #503-505 — Custom app icon generation spec
 *
 * This config defines the master icon and all platform-specific sizes.
 * Use with react-native-bootsplash or a manual asset pipeline.
 *
 * Design spec:
 * - Primary color: #0080FF (ocean blue)
 * - Background: gradient #0a0a1a → #1A1A2E (dark navy)
 * - Foreground: stylized fish silhouette + hook + compass rose
 * - Style: modern, flat, bold — visible at 29px and 1024px
 */

export const APP_ICON = {
  masterSize: 1024,
  backgroundColor: '#0A0A1A',
  foregroundColor: '#0080FF',
  accentColor: '#00D4AA',

  // Android adaptive icon layers
  android: {
    foreground: 'assets/icons/ic_launcher_foreground.png', // 432×432 centered in 108dp safe zone
    background: 'assets/icons/ic_launcher_background.png', // solid gradient or color
    sizes: [
      { density: 'mdpi', size: 48 },
      { density: 'hdpi', size: 72 },
      { density: 'xhdpi', size: 96 },
      { density: 'xxhdpi', size: 144 },
      { density: 'xxxhdpi', size: 192 },
    ],
    adaptiveIconXml: `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`,
  },

  // iOS app icon set
  ios: {
    sizes: [
      { size: 20, scale: '2x', filename: 'Icon-20@2x.png' },
      { size: 20, scale: '3x', filename: 'Icon-20@3x.png' },
      { size: 29, scale: '2x', filename: 'Icon-29@2x.png' },
      { size: 29, scale: '3x', filename: 'Icon-29@3x.png' },
      { size: 40, scale: '2x', filename: 'Icon-40@2x.png' },
      { size: 40, scale: '3x', filename: 'Icon-40@3x.png' },
      { size: 60, scale: '2x', filename: 'Icon-60@2x.png' },
      { size: 60, scale: '3x', filename: 'Icon-60@3x.png' },
      { size: 76, scale: '2x', filename: 'Icon-76@2x.png' },
      { size: 83.5, scale: '2x', filename: 'Icon-83.5@2x.png' },
      { size: 1024, scale: '1x', filename: 'Icon-1024.png' },
    ],
  },

  // Splash screen spec
  splash: {
    backgroundColor: '#0A0A1A',
    logoSize: 200,
    logo: 'assets/icons/splash_logo.png',
    animationDuration: 1500,
    fadeInDuration: 600,
    scaleFrom: 0.8,
    scaleTo: 1.0,
  },
};

/**
 * Generate Contents.json for iOS AppIcon.appiconset
 * Run: node -e "require('./src/config/appIconConfig').generateContentsJson()"
 */
export function generateContentsJson() {
  const images = APP_ICON.ios.sizes.map(({ size, scale, filename }) => ({
    idiom: size === 76 || size === 83.5 ? 'ipad' : 'iphone',
    size: `${size}x${size}`,
    scale,
    filename,
  }));

  // Add marketing icon
  images.push({
    idiom: 'ios-marketing',
    size: '1024x1024',
    scale: '1x',
    filename: 'Icon-1024.png',
  });

  return JSON.stringify(
    { images, info: { version: 1, author: 'profish' } },
    null,
    2,
  );
}
