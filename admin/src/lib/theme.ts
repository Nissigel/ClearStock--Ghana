const KEY = 'clearstock_admin_theme';

export type Theme = 'light' | 'dark';

export const getTheme = (): Theme =>
  (localStorage.getItem(KEY) as Theme | null) ?? 'light';

/**
 * Stamped on <html> rather than held in React state, so the whole page —
 * including anything rendered outside the app root — follows it, and it
 * survives a reload.
 */
export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(KEY, theme);
}
