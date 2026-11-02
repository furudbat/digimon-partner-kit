'use client';

import { setTheme, useTheme } from '@/hooks/use-theme';

import { MoonIcon, SunIcon } from './icons';
import styles from './theme-toggle.module.css';

export function ThemeToggle() {
  const theme = useTheme();
  const next = theme === 'dark' ? 'light' : 'dark';
  const label = `Switch to ${next} mode`;

  return (
    <button type="button" className={styles.toggle} onClick={() => setTheme(next)} title={label} aria-label={label}>
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
