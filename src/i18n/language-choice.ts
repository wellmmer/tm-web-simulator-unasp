import { LOCALE_COOKIE_MAX_AGE, routing } from './routing';

/** The browser storage key for the language the visitor chose, in the language bar or in the menu. */
export const LANGUAGE_KEY = 'computable.language';

/**
 * Runs in <head> before the first paint, on pages that are not in English. It marks <html> while the
 * visitor has not chosen the language on screen, and the CSS then shows the language bar. So the bar
 * never moves the page after it loads. Blocked storage throws, so the script catches every error.
 */
export function languageBarScript(locale: string): string {
  return `(function(){try{if(localStorage.getItem(${JSON.stringify(LANGUAGE_KEY)})!==${JSON.stringify(locale)})document.documentElement.dataset.languageBar=""}catch(e){}})()`;
}

/** The same rule as the script, for React. */
export function wantsLanguageBar(locale: string): boolean {
  if (locale === routing.defaultLocale) return false;
  try {
    return localStorage.getItem(LANGUAGE_KEY) !== locale;
  } catch {
    return false;
  }
}

/**
 * Remembers the visitor's choice: in browser storage for the bar, and in the NEXT_LOCALE cookie,
 * so that "/" opens this language next time (src/proxy.ts reads the cookie).
 */
export function saveLanguageChoice(locale: string) {
  try {
    localStorage.setItem(LANGUAGE_KEY, locale);
  } catch {
    // The browser blocks storage: the bar stays hidden until the page reloads.
  }
  document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
}

export function setLanguageBarShown(shown: boolean) {
  if (shown) document.documentElement.dataset.languageBar = '';
  else delete document.documentElement.dataset.languageBar;
}
