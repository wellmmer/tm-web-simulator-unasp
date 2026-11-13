// @vitest-environment jsdom
import { cleanup, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/intl';
import { SiteHeader } from './SiteHeader';

const navigation = vi.hoisted(() => ({ pathname: '/simulator' }));

// The real Link and usePathname need the Next.js router, which screen tests do not have.
vi.mock('@/i18n/navigation', () => ({
  usePathname: () => navigation.pathname,
  Link: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

afterEach(cleanup);

describe('SiteHeader', () => {
  it('marks the current page, links Home and Support, and holds the theme switch', () => {
    navigation.pathname = '/simulator';
    renderWithIntl(<SiteHeader />);
    expect(screen.getByRole('link', { name: 'Computable' }).getAttribute('href')).toBe('/');
    const menu = screen.getByRole('navigation', { name: 'Main menu' });
    const simulator = within(menu).getByRole('link', { name: 'Simulator' });
    expect(simulator.getAttribute('aria-current')).toBe('page');
    expect(simulator.querySelector('svg')?.getAttribute('class')).toContain('text-pencil');
    const support = screen.getByRole('link', { name: 'Support the dev' });
    expect(support.getAttribute('href')).toBe('/support');
    expect(support.getAttribute('aria-current')).toBeNull();
    expect(screen.getByRole('button', { name: 'Night paper' })).toBeTruthy();
  });

  it('shows Learn, Enigma and Bombe as coming soon, without a link', () => {
    navigation.pathname = '/';
    renderWithIntl(<SiteHeader />);
    const menu = screen.getByRole('navigation', { name: 'Main menu' });
    expect(within(menu).getAllByRole('link').map((link) => link.textContent)).toEqual(['Simulator']);
    for (const name of ['Learn', 'Enigma', 'Bombe']) {
      expect(within(menu).getByText(name).textContent).toBe(`${name}, coming soon`);
    }
  });

  it('draws the cup in pencil red on the Support page', () => {
    navigation.pathname = '/support';
    renderWithIntl(<SiteHeader />);
    const support = screen.getByRole('link', { name: 'Support the dev' });
    expect(support.getAttribute('aria-current')).toBe('page');
    expect(support.querySelector('svg')?.getAttribute('class')).toContain('text-pencil');
    expect(within(screen.getByRole('navigation', { name: 'Main menu' })).getByRole('link', { name: 'Simulator' }).getAttribute('aria-current')).toBeNull();
  });
});
