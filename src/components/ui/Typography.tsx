
import { Text as RNText, StyleSheet, type TextProps, type TextStyle } from 'react-native';
import { useThemeStore } from '@/store/themeStore';
import { FontSize, FontFamily } from '@/constants/theme';


type StyleProp = TextStyle | TextStyle[] | (TextStyle | undefined | null | false)[];

interface AppTextProps extends TextProps {
  size?: keyof typeof FontSize;
  weight?: 'regular' | 'medium' | 'semiBold' | 'bold';
  display?: boolean;
  color?: string;
  style?: StyleProp;
}

export function Text({
  size = 'base',
  weight = 'regular',
  display = false,
  color,
  style,
  children,
  ...props
}: AppTextProps) {
  const { colors } = useThemeStore();
const fontFamily = FontFamily;

  // A custom font carries no weights of its own — each weight is a separate
  // file — so a `fontWeight` in a caller's style has to be translated into the
  // matching font. Without this it was dropped and everything rendered
  // regular, however bold the style said it was.
  const flat = (StyleSheet.flatten(style) ?? {}) as {
    fontWeight?: string | number;
  };
  const weightFromStyle = ((): AppTextProps['weight'] | null => {
    switch (String(flat.fontWeight)) {
      case '700':
      case '800':
      case '900':
      case 'bold':
        return 'bold';
      case '600':
        return 'semiBold';
      case '500':
        return 'medium';
      case '400':
      case 'normal':
        return 'regular';
      default:
        return null;
    }
  })();

  // An explicit style wins over the prop — it's the more specific instruction.
  const resolvedWeight = weightFromStyle ?? weight;

  const getFontFamily = () => {
    if (display) {
      switch (resolvedWeight) {
        case 'bold': return fontFamily.displayBold;
        case 'semiBold': return fontFamily.displaySemiBold;
        case 'medium': return fontFamily.displayMedium;
        default: return fontFamily.displayRegular;
      }
    }
    switch (resolvedWeight) {
      case 'bold': return fontFamily.bold;
      case 'semiBold': return fontFamily.semiBold;
      case 'medium': return fontFamily.medium;
      default: return fontFamily.regular;
    }
  };

  return (
    <RNText
      {...props}
      style={[
        {
          fontFamily: getFontFamily(),
          fontSize: FontSize[size],
          color: color ?? colors.foreground,
        },
        // Applied last so a caller's style actually wins. It used to be
        // destructured and then dropped, which silently discarded every colour,
        // size and weight passed in — leaving whole screens on the defaults.
        style,
        // The weight is expressed by the font file chosen above, so clear it
        // here rather than let the platform synthesise a second bold on top.
        { fontWeight: undefined },
      ]}
    >
      {children}
    </RNText>
  );
}

export function Heading({ children, style, color, ...props }: AppTextProps) {
  return (
    <Text
      display
      weight="bold"
      size="xl"
      color={color}
      style={style}
      {...props}
    >
      {children}
    </Text>
  );
}

export function SubHeading({ children, style, color, ...props }: AppTextProps) {
  return (
    <Text
      display
      weight="semiBold"
      size="md"
      color={color}
      style={style}
      {...props}
    >
      {children}
    </Text>
  );
}

export function Body({ children, style, color, ...props }: AppTextProps) {
  return (
    <Text weight="regular" size="base" color={color} style={style} {...props}>
      {children}
    </Text>
  );
}

export function Label({ children, style, color, ...props }: AppTextProps) {
  return (
    <Text weight="medium" size="sm" color={color} style={style} {...props}>
      {children}
    </Text>
  );
}

export function Caption({ children, style, color, ...props }: AppTextProps) {
  const { colors } = useThemeStore();
  return (
    <Text
      weight="regular"
      size="xs"
      color={color ?? colors.mutedForeground}
      style={style}
      {...props}
    >
      {children}
    </Text>
  );
}

export function Price({ children, style, color, ...props }: AppTextProps) {
  return (
    <Text weight="bold" size="md" color={color} style={style} {...props}>
      {children}
    </Text>
  );
}


