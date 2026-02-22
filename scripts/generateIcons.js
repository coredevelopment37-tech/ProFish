#!/usr/bin/env node
/**
 * generateIcons.js — Resize master icon to all Android + iOS sizes
 *
 * Usage: node scripts/generateIcons.js [path-to-master-icon]
 * Default: assets/icons/ic_master.png
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const masterPath =
  process.argv[2] ||
  path.join(__dirname, '..', 'assets', 'icons', 'ic_master.png');

if (!fs.existsSync(masterPath)) {
  console.error(`❌ Master icon not found: ${masterPath}`);
  console.error('   Save your 1024×1024 PNG there and re-run.');
  process.exit(1);
}

const androidResDir = path.join(
  __dirname,
  '..',
  'android',
  'app',
  'src',
  'main',
  'res',
);
const iosIconDir = path.join(
  __dirname,
  '..',
  'ios',
  'ProFish',
  'Images.xcassets',
  'AppIcon.appiconset',
);

// Android mipmap sizes
const androidSizes = [
  { density: 'mipmap-mdpi', size: 48 },
  { density: 'mipmap-hdpi', size: 72 },
  { density: 'mipmap-xhdpi', size: 96 },
  { density: 'mipmap-xxhdpi', size: 144 },
  { density: 'mipmap-xxxhdpi', size: 192 },
];

// iOS icon sizes
const iosSizes = [
  { size: 40, scale: 2, filename: 'Icon-20@2x.png' },
  { size: 60, scale: 3, filename: 'Icon-20@3x.png' },
  { size: 58, scale: 2, filename: 'Icon-29@2x.png' },
  { size: 87, scale: 3, filename: 'Icon-29@3x.png' },
  { size: 80, scale: 2, filename: 'Icon-40@2x.png' },
  { size: 120, scale: 3, filename: 'Icon-40@3x.png' },
  { size: 120, scale: 2, filename: 'Icon-60@2x.png' },
  { size: 180, scale: 3, filename: 'Icon-60@3x.png' },
  { size: 152, scale: 2, filename: 'Icon-76@2x.png' },
  { size: 167, scale: 2, filename: 'Icon-83.5@2x.png' },
  { size: 1024, scale: 1, filename: 'Icon-1024.png' },
];

// iOS Contents.json
const contentsJson = {
  images: [
    { idiom: 'iphone', size: '20x20', scale: '2x', filename: 'Icon-20@2x.png' },
    { idiom: 'iphone', size: '20x20', scale: '3x', filename: 'Icon-20@3x.png' },
    { idiom: 'iphone', size: '29x29', scale: '2x', filename: 'Icon-29@2x.png' },
    { idiom: 'iphone', size: '29x29', scale: '3x', filename: 'Icon-29@3x.png' },
    { idiom: 'iphone', size: '40x40', scale: '2x', filename: 'Icon-40@2x.png' },
    { idiom: 'iphone', size: '40x40', scale: '3x', filename: 'Icon-40@3x.png' },
    { idiom: 'iphone', size: '60x60', scale: '2x', filename: 'Icon-60@2x.png' },
    { idiom: 'iphone', size: '60x60', scale: '3x', filename: 'Icon-60@3x.png' },
    { idiom: 'ipad', size: '76x76', scale: '2x', filename: 'Icon-76@2x.png' },
    {
      idiom: 'ipad',
      size: '83.5x83.5',
      scale: '2x',
      filename: 'Icon-83.5@2x.png',
    },
    {
      idiom: 'ios-marketing',
      size: '1024x1024',
      scale: '1x',
      filename: 'Icon-1024.png',
    },
  ],
  info: { version: 1, author: 'ProFish generateIcons.js' },
};

async function generate() {
  console.log(`📱 Master icon: ${masterPath}`);
  const meta = await sharp(masterPath).metadata();
  console.log(`   Size: ${meta.width}×${meta.height}, Format: ${meta.format}`);

  // ── Android ──
  console.log('\n🤖 Android icons:');
  for (const { density, size } of androidSizes) {
    const dir = path.join(androidResDir, density);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // Standard icon
    const outPath = path.join(dir, 'ic_launcher.png');
    await sharp(masterPath)
      .resize(size, size, { fit: 'cover' })
      .png()
      .toFile(outPath);
    console.log(`   ✅ ${density}/ic_launcher.png (${size}×${size})`);

    // Round icon
    const roundPath = path.join(dir, 'ic_launcher_round.png');
    const roundedBuf = await sharp(masterPath)
      .resize(size, size, { fit: 'cover' })
      .png()
      .toBuffer();

    // Create circular mask
    const mask = Buffer.from(
      `<svg width="${size}" height="${size}">
        <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/>
      </svg>`,
    );

    await sharp(roundedBuf)
      .composite([{ input: mask, blend: 'dest-in' }])
      .png()
      .toFile(roundPath);
    console.log(
      `   ✅ ${density}/ic_launcher_round.png (${size}×${size} round)`,
    );
  }

  // ── iOS ──
  console.log('\n🍎 iOS icons:');
  if (!fs.existsSync(iosIconDir)) fs.mkdirSync(iosIconDir, { recursive: true });

  for (const { size, filename } of iosSizes) {
    const outPath = path.join(iosIconDir, filename);
    await sharp(masterPath)
      .resize(size, size, { fit: 'cover' })
      .png()
      .toFile(outPath);
    console.log(`   ✅ ${filename} (${size}×${size})`);
  }

  // Write Contents.json
  fs.writeFileSync(
    path.join(iosIconDir, 'Contents.json'),
    JSON.stringify(contentsJson, null, 2),
  );
  console.log('   ✅ Contents.json');

  // ── Splash logo ──
  console.log('\n💦 Splash logo:');
  const splashDir = path.join(__dirname, '..', 'assets', 'icons');
  await sharp(masterPath)
    .resize(512, 512, { fit: 'cover' })
    .png()
    .toFile(path.join(splashDir, 'splash_logo.png'));
  console.log('   ✅ splash_logo.png (512×512)');

  console.log('\n🎉 All icons generated! Rebuild the app to see the new icon.');
}

generate().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
