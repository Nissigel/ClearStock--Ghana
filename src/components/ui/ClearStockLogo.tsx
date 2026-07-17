import Svg, { Path } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';

interface ClearStockLogoProps {
  size?: number;
  /** Override the C colour; defaults to a theme-aware green. */
  faceColor?: string;
  /** Override the swoosh / arrow colour; defaults to gold. */
  accentColor?: string;
}

export const LOGO_VIEWBOX = '0 0 512 512';

/** The C. */
export const LOGO_PATH_C = 'M362 150 A 150 150 0 1 0 362 362';
/** The swoosh curving through the C. */
export const LOGO_PATH_SWOOSH =
  'M336 116 C 452 96, 516 196, 452 268 C 404 322, 322 330, 288 392';
/** The arrowhead the swoosh falls into. */
export const LOGO_PATH_ARROW = 'M288 470 L 240 386 L 336 386 Z';

export const LOGO_STROKE_C = 66;
export const LOGO_STROKE_SWOOSH = 52;

/**
 * The ClearStock mark: a bold C with a swoosh curving through it and falling
 * away as an arrow — the price-drop cue the brand is built around.
 *
 * Vector rather than an image file, so it stays crisp at any size and follows
 * the theme. The launcher and splash PNGs are generated from these same paths
 * by scripts/generate-icons.js — if the shape changes here, re-run that script
 * so the app icon doesn't drift away from the logo drawn inside the app.
 */
export function ClearStockLogo({
  size = 120,
  faceColor,
  accentColor,
}: ClearStockLogoProps) {
  const { colors, isDark } = useTheme();
  // On near-black dark surfaces the deep brand green disappears, so use the
  // vivid primary green there; keep the deep green on light backgrounds.
  const accent = accentColor ?? colors.gold;
  const face = faceColor ?? (isDark ? colors.primary : '#005d33');

  return (
    <Svg width={size} height={size} viewBox={LOGO_VIEWBOX}>
      <Path
        d={LOGO_PATH_C}
        fill="none"
        stroke={face}
        strokeWidth={LOGO_STROKE_C}
        strokeLinecap="round"
      />
      <Path
        d={LOGO_PATH_SWOOSH}
        fill="none"
        stroke={accent}
        strokeWidth={LOGO_STROKE_SWOOSH}
        strokeLinecap="round"
      />
      <Path d={LOGO_PATH_ARROW} fill={accent} />
    </Svg>
  );
}
