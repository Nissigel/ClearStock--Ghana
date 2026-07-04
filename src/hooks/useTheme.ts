import { useThemeStore } from '@/store/themeStore';
import {
  FontFamily,
  FontSize,
  FontWeight,
  Spacing,
  Radius,
  Shadow,
} from '@/constants/theme';

export const useTheme = () => {
  const { colors, isDark, colorScheme, setColorScheme } = useThemeStore();

  return {
    colors,
    isDark,
    colorScheme,
    setColorScheme,
    fontFamily: FontFamily,
    fontSize: FontSize,
    fontWeight: FontWeight,
    spacing: Spacing,
    radius: Radius,
    shadow: Shadow,
  };
};