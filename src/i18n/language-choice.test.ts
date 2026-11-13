// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { LANGUAGE_KEY, languageBarScript, saveLanguageChoice, setLanguageBarShown, wantsLanguageBar } from './language-choice';

/** Runs the <head> script against a fake page and a fake storage, as the browser does before the first paint. */
function runScript(locale: string, getItem: (key: string) => string | null) {
  const root = { dataset: {} as Record<string, string> };
  new Function('localStorage', 'document', languageBarScript(locale))({ getItem }, { documentElement: root });
  return root.dataset.languageBar;
}

afterEach(() => {
  localStorage.clear();
  document.cookie = 'NEXT_LOCALE=; path=/; max-age=0';
  delete document.documentElement.dataset.languageBar;
});

describe('languageBarScript (spec 3, "Language on first visit")', () => {
  it('marks <html> while the visitor has not chosen the language on screen', () => {
    expect(runScript('pt-BR', () => null)).toBe('');
    expect(runScript('pt-BR', (key) => (key === LANGUAGE_KEY ? 'en' : null))).toBe('');
  });

  it('leaves <html> alone once the visitor chose this language', () => {
    expect(runScript('pt-BR', () => 'pt-BR')).toBeUndefined();
  });

  it('does nothing when the browser blocks storage, so a bar that cannot be dismissed for good never shows', () => {
    expect(
      runScript('pt-BR', () => {
        throw new Error('SecurityError');
      }),
    ).toBeUndefined();
  });
});

describe('wantsLanguageBar', () => {
  it('agrees with the script, and never shows the bar in English', () => {
    expect(wantsLanguageBar('pt-BR')).toBe(true);
    localStorage.setItem(LANGUAGE_KEY, 'pt-BR');
    expect(wantsLanguageBar('pt-BR')).toBe(false);
    expect(wantsLanguageBar('es')).toBe(true);
    expect(wantsLanguageBar('en')).toBe(false);
  });
});

describe('saveLanguageChoice', () => {
  it('keeps the language in browser storage and in the NEXT_LOCALE cookie, which "/" reads', () => {
    saveLanguageChoice('pt-BR');
    expect(localStorage.getItem(LANGUAGE_KEY)).toBe('pt-BR');
    expect(document.cookie).toBe('NEXT_LOCALE=pt-BR');
  });
});

describe('setLanguageBarShown', () => {
  it('marks and unmarks <html>, which the CSS reads', () => {
    setLanguageBarShown(true);
    expect(document.documentElement.dataset.languageBar).toBe('');
    setLanguageBarShown(false);
    expect(document.documentElement.dataset.languageBar).toBeUndefined();
  });
});
