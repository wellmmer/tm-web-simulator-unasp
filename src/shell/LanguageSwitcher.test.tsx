// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/intl';
import { LanguageSwitcher } from './LanguageSwitcher';

// The real Link and usePathname need the Next.js router, which screen tests do not have.
vi.mock('@/i18n/navigation', () => ({
  usePathname: () => '/support',
  Link: ({ href, locale, children, ...props }: { href: string; locale?: string; children: ReactNode }) => (
    <a href={locale === undefined ? href : `/${locale}${href}`} {...props}>
      {children}
    </a>
  ),
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const toggle = () => screen.getByRole('button', { name: 'Language: English' });

describe('LanguageSwitcher (spec 4.2)', () => {
  it('lists the five languages by their own names, each to the same page', () => {
    renderWithIntl(<LanguageSwitcher />);
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('link')).toBeNull();
    fireEvent.click(toggle());
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    const links = screen.getAllByRole('link');
    expect(links.map((link) => [link.textContent, link.getAttribute('href'), link.getAttribute('lang')])).toEqual([
      ['English', '/en/support', 'en'],
      ['Português', '/pt-BR/support', 'pt-BR'],
      ['Español', '/es/support', 'es'],
      ['Français', '/fr/support', 'fr'],
      ['Deutsch', '/de/support', 'de'],
    ]);
    expect(screen.getByRole('link', { name: 'English' }).getAttribute('aria-current')).toBe('true');
  });

  it('remembers the language the visitor picks, and closes', () => {
    renderWithIntl(<LanguageSwitcher />);
    fireEvent.click(toggle());
    fireEvent.click(screen.getByRole('link', { name: 'Português' }));
    expect(localStorage.getItem('computable.language')).toBe('pt-BR');
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
  });

  it('closes with Esc and gives the focus back to its button', () => {
    renderWithIntl(<LanguageSwitcher />);
    fireEvent.click(toggle());
    screen.getByRole('link', { name: 'Deutsch' }).focus();
    fireEvent.keyDown(screen.getByRole('link', { name: 'Deutsch' }), { key: 'Escape' });
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(toggle());
  });

  it('closes on a click outside it', () => {
    renderWithIntl(
      <>
        <LanguageSwitcher />
        <p>Outside</p>
      </>,
    );
    fireEvent.click(toggle());
    fireEvent.pointerDown(screen.getByText('Outside'));
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
  });
});
