// shared by the server layout (inline script) and the client theme hook – keep this module free of 'use client'

export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'theme';

/**
 * Runs in <head> before first paint (see app/layout.tsx) so a saved theme is applied without a flash.
 * No saved theme → no data-theme attribute → CSS follows the OS setting.
 */
export const themeInitScript = `try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;
