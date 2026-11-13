// @vitest-environment jsdom
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/intl';
import { tourStore } from '@/tour/tour';
import { SiteHeader } from './SiteHeader';

const navigation = vi.hoisted(() => ({ pathname: '/simulator', push: vi.fn() }));

// The real Link, usePathname and useRouter need the Next.js router, which screen tests do not have.
vi.mock('@/i18n/navigation', () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ push: navigation.push }),
  Link: ({ href, locale, children, ...props }: { href: string; locale?: string; children: ReactNode }) => (
    <a href={locale === undefined ? href : `/${locale}${href}`} {...props}>
      {children}
    </a>
  ),
}));

afterEach(() => {
  cleanup();
  navigation.push.mockClear();
  tourStore.getState().close();
});

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

  it('holds the language switcher and the Tour button (spec 4.2)', () => {
    navigation.pathname = '/about';
    renderWithIntl(<SiteHeader />);
    expect(screen.getByRole('button', { name: 'Language: English' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Tour' })).toBeTruthy();
  });

  it('asks for the tour, and opens the simulator from another page', () => {
    navigation.pathname = '/about';
    renderWithIntl(<SiteHeader />);
    fireEvent.click(screen.getByRole('button', { name: 'Tour' }));
    expect(tourStore.getState().requested).toBe(true);
    expect(navigation.push).toHaveBeenCalledWith('/simulator');
  });

  it('asks for the tour without leaving the simulator', () => {
    navigation.pathname = '/simulator';
    renderWithIntl(<SiteHeader />);
    fireEvent.click(screen.getByRole('button', { name: 'Tour' }));
    expect(tourStore.getState().requested).toBe(true);
    expect(navigation.push).not.toHaveBeenCalled();
  });
});
