// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/intl';
import { LanguageBar } from './LanguageBar';

// The real Link and usePathname need the Next.js router, which screen tests do not have.
vi.mock('@/i18n/navigation', () => ({
  usePathname: () => '/simulator',
  Link: ({ href, locale, children, ...props }: { href: string; locale?: string; children: ReactNode }) => (
    <a href={locale === undefined ? href : `/${locale}${href}`} {...props}>
      {children}
    </a>
  ),
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
  delete document.documentElement.dataset.languageBar;
});

describe('LanguageBar (spec 3, "Language on first visit")', () => {
  it('names the language on screen and offers English, on the same page', () => {
    renderWithIntl(<LanguageBar />, 'pt-BR');
    const bar = screen.getByRole('region', { name: 'Language' });
    expect(bar.textContent).toContain('Showing in Português. Switch to English?');
    const english = screen.getByRole('link', { name: 'English' });
    expect(english.getAttribute('href')).toBe('/en/simulator');
    expect(english.getAttribute('lang')).toBe('en');
    expect(document.documentElement.dataset.languageBar).toBe('');
  });

  it('hides for good when the visitor keeps the language', () => {
    renderWithIntl(<LanguageBar />, 'pt-BR');
    fireEvent.click(screen.getByRole('button', { name: 'Keep Português' }));
    expect(localStorage.getItem('computable.language')).toBe('pt-BR');
    expect(document.cookie).toContain('NEXT_LOCALE=pt-BR');
    expect(document.documentElement.dataset.languageBar).toBeUndefined();
  });

  it('remembers English when the visitor switches', () => {
    renderWithIntl(<LanguageBar />, 'es');
    fireEvent.click(screen.getByRole('link', { name: 'English' }));
    expect(localStorage.getItem('computable.language')).toBe('en');
    expect(document.documentElement.dataset.languageBar).toBeUndefined();
  });

  it('stays hidden after the visitor chose the language before', () => {
    localStorage.setItem('computable.language', 'fr');
    document.documentElement.dataset.languageBar = '';
    renderWithIntl(<LanguageBar />, 'fr');
    expect(document.documentElement.dataset.languageBar).toBeUndefined();
  });

  it('does not exist in English', () => {
    renderWithIntl(<LanguageBar />, 'en');
    expect(screen.queryByRole('region')).toBeNull();
  });
});
