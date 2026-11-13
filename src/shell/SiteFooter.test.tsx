// @vitest-environment jsdom
import { cleanup, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/intl';
import { SiteFooter } from './SiteFooter';

// The real Link needs the Next.js router, which screen tests do not have.
vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

afterEach(cleanup);

describe('SiteFooter', () => {
  it('links About, Privacy, Support the dev and the source code, and names both licenses', () => {
    renderWithIntl(<SiteFooter />);
    const links = within(screen.getByRole('navigation', { name: 'Site' })).getAllByRole('link');
    expect(links.map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['About', '/about'],
      ['Privacy', '/privacy'],
      ['Support the dev', '/support'],
      ['Source code', 'https://github.com/wellmmer/computable'],
    ]);
    expect(screen.getByText('Code under the MIT license. Texts under CC BY 4.0.')).toBeTruthy();
  });

  it('asks for help with the translation on pages that an AI translated (spec 3)', () => {
    for (const locale of ['es', 'fr', 'de'] as const) {
      renderWithIntl(<SiteFooter />, locale);
      expect(screen.getByRole('link', { name: 'Help improve the translation' }).getAttribute('href')).toBe(
        `https://github.com/wellmmer/computable/edit/master/messages/${locale}.json`,
      );
      cleanup();
    }
  });

  it('says nothing about translation in English and in the checked Brazilian Portuguese', () => {
    for (const locale of ['en', 'pt-BR'] as const) {
      renderWithIntl(<SiteFooter />, locale);
      expect(screen.queryByRole('link', { name: 'Help improve the translation' })).toBeNull();
      cleanup();
    }
  });
});
