import { create } from 'zustand';
import type { ColorScheme } from '@/constants/theme';
import { DarkColors, LightColors } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';

interface ThemeState {
  colorScheme: ColorScheme;
  isDark: boolean;
  colors: ThemeColors;

  // Actions
  setColorScheme: (scheme: ColorScheme) => void;
  applySystemScheme: (systemIsDark: boolean) => void;
}

const getColors = (isDark: boolean): ThemeColors => {
  return (isDark ? DarkColors : LightColors) as ThemeColors;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  // Default to light regardless of the device setting. Users can switch to
  // dark or system from Settings.
  colorScheme: 'light',
  isDark: false,
  colors: LightColors,

  setColorScheme: (scheme) => {
    if (scheme === 'system') {
      set({
        colorScheme: scheme,
      });
      return;
    }
    const isDark = scheme === 'dark';
    set({
      colorScheme: scheme,
      isDark,
      colors: getColors(isDark),
    });
  },

  applySystemScheme: (systemIsDark) => {
    const { colorScheme } = get();
    if (colorScheme === 'system') {
      set({
        isDark: systemIsDark,
        colors: getColors(systemIsDark),
      });
    }
  },
}));