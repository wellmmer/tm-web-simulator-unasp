/** Squared paper or night paper (spec 6). */
export type Theme = 'light' | 'dark';

/** The browser storage key that keeps the visitor's choice. Without it, the page follows the system setting. */
export const THEME_KEY = 'computable.theme';

export function toTheme(value: unknown): Theme | null {
  return value === 'light' || value === 'dark' ? value : null;
}

export function otherTheme(theme: Theme): Theme {
  return theme === 'dark' ? 'light' : 'dark';
}

/** The theme on screen: the saved choice on <html> wins over the system setting. */
export function themeOf(chosen: unknown, systemDark: boolean): Theme {
  return toTheme(chosen) ?? (systemDark ? 'dark' : 'light');
}

/**
 * Runs in <head> before the first paint. It copies the saved choice onto <html data-theme>, so
 * the page never shows the wrong paper first. Without a choice it does nothing, and the CSS
 * follows the system setting. Blocked storage throws, so the script catches every error.
 */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}})()`;
