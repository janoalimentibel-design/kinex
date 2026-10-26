export type Appearance = 'auto' | 'light' | 'dark';
export const APPEARANCE_KEY = 'kinex-appearance';

export function readAppearance(): Appearance {
  try {
    const stored = localStorage.getItem(APPEARANCE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch { /* The system preference still works when storage is unavailable. */ }
  return 'auto';
}

export function applyAppearance(preference: Appearance, systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches) {
  const theme = preference === 'auto' ? (systemDark ? 'dark' : 'light') : preference;
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0a0c10' : '#f5f5ed');
}
