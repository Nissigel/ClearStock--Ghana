/*
 * Renders the app's launcher, splash and web icons from the ClearStock logo.
 *
 * The logo lives as vector paths in src/components/ui/ClearStockLogo.tsx so the
 * in-app mark and the icons can never drift apart. Change the shape there, then:
 *
 *   node scripts/generate-icons.js
 *
 * Everything it writes into assets/ is committed, so this only needs running
 * when the logo itself changes — not as part of a normal build.
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

// Read the paths straight from the component rather than duplicating them here,
// so the icons are always generated from the same shape the app renders.
const readExport = (source, name) => {
  const match = source.match(
    new RegExp(`export const ${name} =\\s*\\n?\\s*'([^']*)'`)
  );
  if (!match) {
    throw new Error(
      `Could not find ${name} in ClearStockLogo.tsx — did the export change?`
    );
  }
  return match[1];
};

const source = fs.readFileSync(LOGO_SOURCE, 'utf8');
const PATH_C = readExport(source, 'LOGO_PATH_C');
const PATH_SWOOSH = readExport(source, 'LOGO_PATH_SWOOSH');
const PATH_ARROW = readExport(source, 'LOGO_PATH_ARROW');

// Matches the dark theme the app ships with (see constants/theme.ts).
const GREEN = '#16a34a';
const GOLD = '#e0af3b';
const DARK_BG = '#0c0f0c';

// The mark isn't centred within its own viewBox — the swoosh reaches right and
// the arrow hangs low — so it gets trimmed to its true bounds and centred
// below, rather than trusting the drawing to be balanced.
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <path d="${PATH_C}" fill="none" stroke="${GREEN}" stroke-width="66" stroke-linecap="round"/>
  <path d="${PATH_SWOOSH}" fill="none" stroke="${GOLD}" stroke-width="52" stroke-linecap="round"/>
  <path d="${PATH_ARROW}" fill="${GOLD}"/>
</svg>`;

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

/**
 * @param background  A hex fill, or null for transparency.
 * @param inset       Fraction of the canvas left as padding. Android masks
 *                    adaptive icons down to roughly the middle two thirds, so
 *                    its foreground needs room to survive the crop.
 */
const render = async ({ file, size, background, inset }) => {
  const inner = Math.round(size * (1 - inset * 2));

  // Render large, then trim the transparent margin so the logo's real bounds —
  // not the viewBox — decide the centring.
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
  // Home-screen icon. iOS composites no background of its own, so bake one in.
  { file: 'icon.png', size: 1024, background: DARK_BG, inset: 0.12 },
  // Android foreground: transparent, and inset so the launcher's circular mask
  // doesn't clip the arrow.
  { file: 'adaptive-icon.png', size: 1024, background: null, inset: 0.22 },
  { file: 'android-icon-foreground.png', size: 1024, background: null, inset: 0.22 },
  // Splash: app.json paints the background, so keep the mark transparent.
  { file: 'splash-icon.png', size: 1024, background: null, inset: 0.1 },
  { file: 'favicon.png', size: 48, background: DARK_BG, inset: 0.1 },
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
