/*
 * Builds the app icons and the in-app logo from the ClearStock artwork.
 *
 *   node scripts/generate-icons.js
 *
 * Source is assets/logo-source.png — the supplied logo with the wordmark
 * cropped away, leaving just the bag-and-tag mark.
 *
 * The mark is composed onto white rather than made transparent: the artwork
 * uses white as part of its design (the outline around the tag, the hole in
 * it), so keying white out would punch holes through the logo itself.
 *
 * Everything written into assets/ is committed, so this only needs re-running
 * when the artwork changes.
 */

const path = require('path');
const sharp = require('sharp');

const ASSETS = path.join(__dirname, '..', 'assets');
const SOURCE = path.join(ASSETS, 'logo-source.png');

const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

/**
 * @param size   Output canvas, square.
 * @param inset  Fraction of the canvas kept as breathing room. Android masks
 *               adaptive icons to a circle, so its foreground needs more.
 */
const render = async ({ file, size, inset, roundedTile }) => {
  const inner = Math.round(size * (1 - inset * 2));

  const mark = await sharp(SOURCE)
    .resize(inner, inner, { fit: 'contain', background: WHITE })
    .toBuffer();

  // The native splash sits on the brand green, so its mark is a rounded white
  // tile on transparency — matching the tile the app's own splash draws,
  // instead of flashing a full white square first.
  if (roundedTile) {
    const r = Math.round(size * 0.22);
    const maskSvg = Buffer.from(
      `<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="#fff"/></svg>`
    );
    const tile = await sharp({
      create: { width: size, height: size, channels: 4, background: WHITE },
    })
      .composite([{ input: mark, gravity: 'center' }])
      .png()
      .toBuffer();

    await sharp(tile)
      .composite([{ input: maskSvg, blend: 'dest-in' }])
      .png()
      .toFile(path.join(ASSETS, file));
    return;
  }

  await sharp({
    create: { width: size, height: size, channels: 4, background: WHITE },
  })
    .composite([{ input: mark, gravity: 'center' }])
    .png()
    .toFile(path.join(ASSETS, file));
};

const targets = [
  // Home-screen icon.
  { file: 'icon.png', size: 1024, inset: 0.1 },
  // Shown on the native splash, which sits on the brand green.
  { file: 'splash-icon.png', size: 1024, inset: 0.1, roundedTile: true },
  // Android composites these over adaptiveIcon.backgroundColor (also white).
  { file: 'adaptive-icon.png', size: 1024, inset: 0.22 },
  { file: 'android-icon-foreground.png', size: 1024, inset: 0.22 },
  { file: 'favicon.png', size: 48, inset: 0.08 },
  // Used by the ClearStockLogo component inside the app.
  { file: 'logo-mark.png', size: 512, inset: 0.06 },
];

(async () => {
  for (const target of targets) {
    await render(target);
    console.log(`wrote assets/${target.file} (${target.size}x${target.size})`);
  }
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
