import { describe, expect, it } from 'vitest';
import { otherTheme, THEME_KEY, THEME_SCRIPT, themeOf, toTheme } from './theme';

/** Runs the <head> script against a fake page and a fake storage, as the browser does before the first paint. */
function runScript(getItem: (key: string) => string | null) {
  const root = { dataset: {} as Record<string, string> };
  new Function('localStorage', 'document', THEME_SCRIPT)({ getItem }, { documentElement: root });
  return root.dataset.theme;
}

describe('toTheme', () => {
  it('accepts only "light" and "dark"', () => {
    expect(toTheme('light')).toBe('light');
    expect(toTheme('dark')).toBe('dark');
    expect(toTheme('sepia')).toBeNull();
    expect(toTheme(null)).toBeNull();
    expect(toTheme(undefined)).toBeNull();
  });
});

describe('otherTheme', () => {
  it('swaps squared paper and night paper', () => {
    expect(otherTheme('light')).toBe('dark');
    expect(otherTheme('dark')).toBe('light');
  });
});

describe('themeOf', () => {
  it('uses the saved choice first, then the system setting', () => {
    expect(themeOf('dark', false)).toBe('dark');
    expect(themeOf('light', true)).toBe('light');
    expect(themeOf(undefined, true)).toBe('dark');
    expect(themeOf('sepia', false)).toBe('light');
  });
});

describe('THEME_SCRIPT', () => {
  it('sets data-theme on <html> from the saved choice', () => {
    expect(runScript((key) => (key === THEME_KEY ? 'dark' : null))).toBe('dark');
    expect(runScript(() => 'light')).toBe('light');
  });

  it('leaves <html> alone without a valid choice, so the system setting applies', () => {
    expect(runScript(() => null)).toBeUndefined();
    expect(runScript(() => 'sepia')).toBeUndefined();
  });

  it('does nothing when the browser blocks storage', () => {
    expect(
      runScript(() => {
        throw new Error('SecurityError');
      }),
    ).toBeUndefined();
  });
});
