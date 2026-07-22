import { Image, StyleSheet, type ImageStyle } from 'react-native';

interface ClearStockLogoProps {
  /** Rendered width and height in px. The mark is square. */
  size?: number;
  /** Corner rounding, so it can read as a tile. Defaults to a soft radius. */
  radius?: number;
  style?: ImageStyle;
}

/**
 * The ClearStock mark — the shopping bag and price tag, from the brand
 * artwork in assets/logo-source.png.
 *
 * It's a real image rather than drawn in code: the artwork has gradients and
 * layered shapes that wouldn't survive being traced by hand. The icons in
 * assets/ are generated from the same source by scripts/generate-icons.js, so
 * the launcher icon and the in-app logo can't drift apart.
 *
 * The artwork is designed on white, and white is load-bearing in it (the
 * outline around the tag, the hole punched in it), so it's kept on a white
 * tile rather than made transparent.
 */
export function ClearStockLogo({
  size = 120,
  radius,
  style,
}: ClearStockLogoProps) {
  return (
    <Image
      source={require('../../../assets/logo-mark.png')}
      style={[
        styles.logo,
        { width: size, height: size, borderRadius: radius ?? size * 0.22 },
        style,
      ]}
      resizeMode="cover"
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    backgroundColor: '#ffffff',
  },
});
