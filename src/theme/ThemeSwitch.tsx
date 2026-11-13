'use client';

import { Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useLayoutEffect, useSyncExternalStore } from 'react';
import { otherTheme, THEME_KEY, themeOf, toTheme, type Theme } from './theme';

const DARK_QUERY = '(prefers-color-scheme: dark)';

function systemDark(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(DARK_QUERY).matches;
}

function themeNow(): Theme {
  return themeOf(document.documentElement.dataset.theme, systemDark());
}

/** Calls `onChange` when <html data-theme> or the system setting changes. */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  const query = typeof window.matchMedia === 'function' ? window.matchMedia(DARK_QUERY) : null;
  query?.addEventListener('change', onChange);
  return () => {
    observer.disconnect();
    query?.removeEventListener('change', onChange);
  };
}

function readChoice(): Theme | null {
  try {
    return toTheme(localStorage.getItem(THEME_KEY));
  } catch {
    return null;
  }
}

function saveChoice(theme: Theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // The browser blocks storage: the choice lasts until the tab closes.
  }
}

/**
 * The menu's switch between squared paper and night paper (spec 6). It overrides the system
 * setting and remembers the choice. The moon and the sun swap by CSS, so they are right before React loads.
 */
export function ThemeSwitch() {
  const t = useTranslations('shell.theme');
  // Null on the server, which cannot know the theme. aria-pressed appears after hydration.
  const theme = useSyncExternalStore(subscribe, themeNow, () => null);

  // In development, React's second mount clears <html data-theme>. This puts the choice back. Production does not need it.
  useLayoutEffect(() => {
    const chosen = readChoice();
    if (chosen !== null) document.documentElement.dataset.theme = chosen;
  }, []);

  const toggle = () => {
    const next = otherTheme(themeNow());
    document.documentElement.dataset.theme = next;
    saveChoice(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={theme === null ? undefined : theme === 'dark'}
      title={t('label')}
      className="grid size-9 shrink-0 place-items-center border-2 border-ink bg-cell text-ink"
    >
      <span className="sr-only">{t('label')}</span>
      <Moon aria-hidden className="on-paper size-[18px]" strokeWidth={1.8} />
      <Sun aria-hidden className="on-night size-[18px]" strokeWidth={1.8} />
    </button>
  );
}
