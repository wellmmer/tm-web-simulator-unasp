import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void) {
  if (typeof window.matchMedia !== 'function') return () => {};
  const query = window.matchMedia(QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function reducedMotionNow(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(QUERY).matches;
}

/** True while the visitor asks the system for reduced motion. False on the server and in jsdom, which has no matchMedia. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, reducedMotionNow, () => false);
}
