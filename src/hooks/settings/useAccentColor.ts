import { useSyncExternalStore } from 'react';

const subscribeAccent = (onChange: () => void) => {
  window.addEventListener('accentPaletteChange', onChange);
  return () => window.removeEventListener('accentPaletteChange', onChange);
};

const getAccentColor = () =>
  getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#0A84FF';

/**
 * Reactive accent color — re-renders when the user changes the accent palette.
 * Reads the resolved CSS var so it also reflects direct --accent-primary changes.
 */
export const useAccentColor = () =>
  useSyncExternalStore(subscribeAccent, getAccentColor, () => '#0A84FF');
