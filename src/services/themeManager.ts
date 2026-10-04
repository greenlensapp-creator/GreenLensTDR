import { ThemeMode } from '../types';

const THEME_STORAGE_KEY = 'greenlens_theme_mode';

export function getStoredThemeMode(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
  } catch (e) {
    console.warn('Error reading theme from storage:', e);
  }
  return 'system';
}

export function applyTheme(mode: ThemeMode): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch (e) {
    // Ignore storage issues
  }

  const root = document.documentElement;
  const isDark =
    mode === 'dark' ||
    (mode === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export function initTheme(): ThemeMode {
  const mode = getStoredThemeMode();
  applyTheme(mode);
  return mode;
}

// Escuchar cambios automáticos del sistema operativo si está en modo 'system'
if (typeof window !== 'undefined' && window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const currentMode = getStoredThemeMode();
    if (currentMode === 'system') {
      applyTheme('system');
    }
  });
}
