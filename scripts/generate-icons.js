/*
 * Renders the launcher, splash and web icons from the ClearStock mark — the
 * same shapes drawn by src/components/ui/ClearStockLogo.tsx — so the icon and
 * the in-app logo stay in step.
 *
 *   node scripts/generate-icons.js
 *
 * The PNGs it writes into assets/ are committed, so this only needs re-running
 * when the logo changes, not on a normal build.
 */

const path = require('path');
const sharp = require('sharp');

const ASSETS = path.join(__dirname, '..', 'assets');

// Kept in sync by hand with ClearStockLogo.tsx (viewBox 0 0 44 44).
const MARK = `
  <circle cx="22" cy="22" r="18" fill="none" stroke="#1e4d7b" stroke-width="3" stroke-dasharray="90 22" stroke-linecap="round"/>
  <circle cx="22" cy="22" r="12" fill="none" stroke="#4ade80" stroke-width="2.5" stroke-dasharray="58 16" stroke-dashoffset="-8" stroke-linecap="round"/>
  <circle cx="22" cy="22" r="5" fill="none" stroke="#4ade80" stroke-width="2"/>
  <circle cx="22" cy="22" r="2" fill="#4ade80"/>
  <path d="M24 20 L30 14" stroke="#4ade80" stroke-width="2" stroke-linecap="round" fill="none"/>
  <polyline points="26,14 30,14 30,18" stroke="#4ade80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M20 24 L14 30" stroke="#1e6b9e" stroke-width="2" stroke-linecap="round" fill="none"/>
  <polyline points="18,30 14,30 14,26" stroke="#1e6b9e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;

// Place the 44-unit mark centred in a 512 canvas at the given display size.
const markGroup = (displaySize) => {
  const scale = displaySize / 44;
  const offset = 256 - 22 * scale;
  return `<g transform="translate(${offset} ${offset}) scale(${scale})">${MARK}</g>`;
};

// The rounded tile: a navy-to-green gradient with a faint green edge, matching
// the splash's logo container.
const withTile = (displaySize) => `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs><linearGradient id="t" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#0a1f2e"/><stop offset="1" stop-color="#0a2a1a"/>
  </linearGradient></defs>
  <rect x="0" y="0" width="512" height="512" rx="140" fill="url(#t)" stroke="#4ade80" stroke-width="3" stroke-opacity="0.2"/>
  ${markGroup(displaySize)}
</svg>`;

// Just the mark on transparency — for Android, which paints its own background.
const markOnly = (displaySize) => `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  ${markGroup(displaySize)}
</svg>`;

const targets = [
  // Home-screen icon (iOS composites no background, so the tile is baked in).
  { file: 'icon.png', size: 1024, svg: withTile(300) },
  // Splash mark: tile on transparency, sits on the splash background colour.
  { file: 'splash-icon.png', size: 1024, svg: withTile(300) },
  // Android foreground: mark only, inset so the circular mask can't clip it.
  { file: 'adaptive-icon.png', size: 1024, svg: markOnly(250) },
  { file: 'android-icon-foreground.png', size: 1024, svg: markOnly(250) },
  { file: 'favicon.png', size: 48, svg: withTile(320) },
];

(async () => {
  for (const { file, size, svg } of targets) {
    await sharp(Buffer.from(svg), { density: 512 })
      .resize(size, size)
      .png()
      .toFile(path.join(ASSETS, file));
    console.log(`wrote assets/${file} (${size}x${size})`);
  }
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
