const palette = {
  // Brand Greens
  green900: '#005d33',
  green700: '#006d3b',
  green600: '#008a4a',
  green500: '#16a34a',
  green200: '#bbf7d0',
  green100: '#e8f2e5',
  green50: '#dff0e8',

  // Gold
  gold400: '#e0af3b',
  gold300: '#f0c85a',
  gold900: '#241803',

  // Blue (Info)
  blue500: '#3b82f6',
  blue400: '#60a5fa',

  // Neutrals
  white: '#ffffff',
  offWhite: '#fbfaf6',
  warmGray50: '#f9f8f4',
  warmGray100: '#f0efe7',
  warmGray200: '#dedfd7',
  warmGray300: '#e8e8e1',
  warmGray500: '#5c675d',
  warmGray700: '#3a4a3b',
  warmGray800: '#1e2d1f',
  warmGray900: '#091a11',

  // Dark mode surfaces
  dark50: '#1a2e1b',
  dark100: '#152415',
  dark200: '#0f1a10',
  dark300: '#0a120a',

  // Semantic
  red500: '#e62c2c',
  red400: '#f05252',
  red50: '#f8f8f8',
  orange500: '#ff572c',
  orange400: '#ff7043',
  amber500: '#f4a437',
  amber400: '#fbbf24',
  amber900: '#072918',
} as const;

export const LightColors = {
  // --- Primary ---
  primary: palette.green700,
  primaryDark: palette.green900,
  primaryLight: palette.green600,
  primaryForeground: palette.offWhite,

  // --- Gold Accent ---
  gold: palette.gold400,
  goldForeground: palette.gold900,

  // --- Backgrounds ---
  background: palette.offWhite,
  card: palette.white,
  secondary: palette.green100,
  muted: palette.warmGray100,
  accent: '#f5ebce',

  // --- Foregrounds / Text ---
  foreground: palette.warmGray900,
  cardForeground: palette.warmGray900,
  secondaryForeground: palette.amber900,
  mutedForeground: palette.warmGray500,
  accentForeground: '#06321d',

  // --- Semantic States ---
  success: palette.green500,
  successForeground: palette.white,
  warning: palette.amber500,
  warningForeground: palette.warmGray900,
  info: palette.blue500,
  infoForeground: palette.white,
  destructive: palette.red500,
  destructiveForeground: palette.red50,
  flame: palette.orange500,

  // --- Borders & Inputs ---
  border: palette.warmGray200,
  input: palette.warmGray300,
  ring: palette.green700,

  // --- Tab Bar ---
  tabBar: palette.white,
  tabBarBorder: palette.warmGray200,
} as const;

export const DarkColors = {
  // --- Primary ---
  primary: palette.green600,
  primaryDark: palette.green700,
  primaryLight: palette.green500,
  primaryForeground: palette.white,

  // --- Gold Accent ---
  gold: palette.gold300,
  goldForeground: palette.warmGray900,

  // --- Backgrounds ---
  background: palette.dark300,
  card: palette.dark200,
  secondary: palette.dark100,
  muted: palette.dark50,
  accent: '#2a1f0a',

  // --- Foregrounds / Text ---
  foreground: palette.offWhite,
  cardForeground: palette.offWhite,
  secondaryForeground: palette.amber400,
  mutedForeground: palette.warmGray500,
  accentForeground: palette.gold300,

  // --- Semantic States ---
  success: palette.green500,
  successForeground: palette.white,
  warning: palette.amber400,
  warningForeground: palette.warmGray900,
  info: palette.blue400,
  infoForeground: palette.white,
  destructive: palette.red400,
  destructiveForeground: palette.white,
  flame: palette.orange400,

  // --- Borders & Inputs ---
  border: palette.warmGray700,
  input: palette.warmGray800,
  ring: palette.green600,

  // --- Tab Bar ---
  tabBar: palette.dark200,
  tabBarBorder: palette.warmGray700,
} as const;

export const Colors = LightColors;

export const FontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  displayRegular: 'PlusJakartaSans_400Regular',
  displayMedium: 'PlusJakartaSans_500Medium',
  displaySemiBold: 'PlusJakartaSans_600SemiBold',
  displayBold: 'PlusJakartaSans_700Bold',
} as const;

export const FontSize = {
  xs: 12,
  sm: 14,
  base: 15,
  md: 18,
  lg: 17,
  xl: 17,
  '2xl': 24,
  '3xl': 28,
  '4xl': 34,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

export const Radius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
} as const;

export const Shadow = {
  sm: {
    shadowColor: palette.warmGray900,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: palette.warmGray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: palette.warmGray900,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
} as const;

export const Theme = {
  colors: Colors,
  fontFamily: FontFamily,
  fontSize: FontSize,
  fontWeight: FontWeight,
  spacing: Spacing,
  radius: Radius,
  shadow: Shadow,
} as const;

export type ThemeColors = typeof LightColors;
export type ThemeSpacing = typeof Spacing;
export type ThemeRadius = typeof Radius;
export type ColorScheme = 'light' | 'dark' | 'system';