import Svg, { Circle, Path, Polyline } from 'react-native-svg';

interface ClearStockLogoProps {
  /** Rendered width and height in px. The mark is square. */
  size?: number;
}

/**
 * The ClearStock mark: a navy "C" (the marketplace boundary) around an offset
 * broken green ring (goods in motion), a green dot with a ring at the centre
 * (the exchange point), and two arrows — a green one out (value recovered) and
 * a blue one in (surplus arriving).
 *
 * Just the mark, no tile — callers that want the rounded-square container add
 * it themselves (see the splash screen). The launcher/splash PNGs are generated
 * from these same shapes by scripts/generate-icons.js, so the icon and the
 * in-app logo can't drift apart.
 */
export function ClearStockLogo({ size = 120 }: ClearStockLogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 44 44" fill="none">
      {/* Outer navy ring with a gap on the right — the "C". */}
      <Circle
        cx="22"
        cy="22"
        r="18"
        stroke="#1e4d7b"
        strokeWidth={3}
        strokeDasharray="90 22"
        strokeLinecap="round"
        fill="none"
      />
      {/* Inner green ring, broken and offset. */}
      <Circle
        cx="22"
        cy="22"
        r="12"
        stroke="#4ade80"
        strokeWidth={2.5}
        strokeDasharray="58 16"
        strokeDashoffset={-8}
        strokeLinecap="round"
        fill="none"
      />
      {/* Centre: ring + solid dot — the exchange point. */}
      <Circle cx="22" cy="22" r="5" stroke="#4ade80" strokeWidth={2} fill="none" />
      <Circle cx="22" cy="22" r="2" fill="#4ade80" />
      {/* Green arrow up-and-right — value recovered. */}
      <Path d="M24 20 L30 14" stroke="#4ade80" strokeWidth={2} strokeLinecap="round" />
      <Polyline
        points="26,14 30,14 30,18"
        stroke="#4ade80"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Blue arrow down-and-left — surplus arriving. */}
      <Path d="M20 24 L14 30" stroke="#1e6b9e" strokeWidth={2} strokeLinecap="round" />
      <Polyline
        points="18,30 14,30 14,26"
        stroke="#1e6b9e"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
