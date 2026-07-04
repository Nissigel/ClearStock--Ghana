
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

  const getFontFamily = () => {
    if (display) {
      switch (weight) {
        case 'bold': return fontFamily.displayBold;
        case 'semiBold': return fontFamily.displaySemiBold;
        case 'medium': return fontFamily.displayMedium;
        default: return fontFamily.displayRegular;
      }
    }
    switch (weight) {
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


