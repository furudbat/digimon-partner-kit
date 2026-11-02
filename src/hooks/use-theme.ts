'use client';

import { useSyncExternalStore } from 'react';

import { type Theme, THEME_STORAGE_KEY } from '@/lib/theme';

const DARK_QUERY = '(prefers-color-scheme: dark)';
const listeners = new Set<() => void>();

const subscribe = (onChange: () => void) => {
  listeners.add(onChange);
  const mql = window.matchMedia(DARK_QUERY);
  mql.addEventListener('change', onChange);

  return () => {
    listeners.delete(onChange);
    mql.removeEventListener('change', onChange);
  };
};

const getSnapshot = (): Theme => {
  const saved = document.documentElement.dataset.theme;
  if (saved === 'light' || saved === 'dark') {
    return saved;
  }

  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
};

// unknown on the server (static export)
const getServerSnapshot = (): Theme | undefined => undefined;

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // storage unavailable (private mode etc.) – theme still applies for this page view
  }
  listeners.forEach((listener) => listener());
}

/** Current theme (saved choice, else OS setting); `undefined` during SSR/hydration. */
export function useTheme(): Theme | undefined {
  return useSyncExternalStore<Theme | undefined>(subscribe, getSnapshot, getServerSnapshot);
}
