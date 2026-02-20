export type UiTheme = 'light' | 'dark';

export const UI_THEME_STORAGE_KEY = 'uiTheme';

export const getInitialTheme = (): UiTheme => {
  if (typeof window === 'undefined') return 'light';

  const stored = window.localStorage.getItem(UI_THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const applyThemeToDocument = (theme: UiTheme) => {
  if (typeof document === 'undefined') return;

  const isDark = theme === 'dark';
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
};
