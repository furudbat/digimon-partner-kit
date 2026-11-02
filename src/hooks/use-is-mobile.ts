'use client';

import { useSyncExternalStore } from 'react';

import { MediaQueryMobileBreakpoint } from '@/components/constants';

const MOBILE_QUERY = `(max-width: ${MediaQueryMobileBreakpoint}px)`;

const subscribe = (onChange: () => void) => {
  const mql = window.matchMedia(MOBILE_QUERY);
  mql.addEventListener('change', onChange);

  return () => mql.removeEventListener('change', onChange);
};

const getSnapshot = () => window.matchMedia(MOBILE_QUERY).matches;

// no window on the server (static export): render as desktop, React re-renders with the real value after hydration
const getServerSnapshot = () => false;

/** `true` when the viewport is at most `MediaQueryMobileBreakpoint` px wide. SSR/hydration-safe. */
export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
