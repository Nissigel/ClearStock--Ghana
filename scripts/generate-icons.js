/*
 * Renders the app's launcher, splash and web icons from the ClearStock tag
 * logo — the very same paths drawn by src/components/ui/ClearStockLogo.tsx, so
 * the home-screen icon and the in-app logo can never drift apart.
 *
 *   node scripts/generate-icons.js
 *
 * The PNGs it writes into assets/ are committed, so this only needs re-running
 * when the logo shape or colours change — not as part of a normal build.
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ASSETS = path.join(__dirname, '..', 'assets');
const LOGO_SOURCE = path.join(
  __dirname,
  '..',
  'src',
  'components',
  'ui',
  'ClearStockLogo.tsx'
);

// The mark's dark-surface colours (constants/theme.ts): the splash is dark, so
// the icons match what the app renders there — vivid green + light gold.
const GREEN = '#22c55e';
const GOLD = '#f0c85a';
const DARK_BG = '#0c0f0c';

// Pull the paths (and which fill each uses) straight from the component instead
// of copying them here, so the icons always match the logo the app draws.
const source = fs.readFileSync(LOGO_SOURCE, 'utf8');
const viewBox = (source.match(/viewBox="([^"]+)"/) || [])[1] || '0 0 1024 600';
const paths = [];
const re = /fill=\{(gold|darkGreen)\}\s*d="([^"]+)"/g;
let m;
while ((m = re.exec(source)) !== null) {
  paths.push({ fill: m[1] === 'gold' ? GOLD : GREEN, d: m[2] });
}
if (paths.length === 0) {
  console.error('Found no logo paths in ClearStockLogo.tsx — did it change?');
  process.exit(1);
}

const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">
${paths.map((p) => `  <path fill="${p.fill}" d="${p.d}"/>`).join('\n')}
</svg>`;

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

/**
 * @param background  A hex fill, or null for transparency.
 * @param inset       Fraction of the canvas left as padding. Android masks
 *                    adaptive icons to roughly the middle two thirds, so its
 *                    foreground needs room to survive the crop.
 */
const render = async ({ file, size, background, inset }) => {
  const inner = Math.round(size * (1 - inset * 2));

  // Render large, then trim the transparent margin so the logo's real bounds —
  // not the non-square viewBox — decide the centring.
  const logo = await sharp(Buffer.from(LOGO_SVG), { density: 900 })
    .png()
    .trim()
    .resize(inner, inner, { fit: 'contain', background: TRANSPARENT })
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: background ?? TRANSPARENT,
    },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(path.join(ASSETS, file));
};

const targets = [
  // Home-screen icon. iOS adds no background of its own, so bake one in.
  { file: 'icon.png', size: 1024, background: DARK_BG, inset: 0.16 },
  // Android foreground: transparent, inset so the circular mask doesn't clip it.
  { file: 'adaptive-icon.png', size: 1024, background: null, inset: 0.26 },
  { file: 'android-icon-foreground.png', size: 1024, background: null, inset: 0.26 },
  // Splash: app.json paints the background, so keep the mark transparent.
  { file: 'splash-icon.png', size: 1024, background: null, inset: 0.14 },
  { file: 'favicon.png', size: 48, background: DARK_BG, inset: 0.12 },
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
