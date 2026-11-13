// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderWithIntl } from '@/test/intl';
import { THEME_KEY } from './theme';
import { ThemeSwitch } from './ThemeSwitch';

afterEach(() => {
  cleanup();
  delete document.documentElement.dataset.theme;
  localStorage.clear();
});

describe('ThemeSwitch', () => {
  it('switches to night paper and back, and remembers the choice', async () => {
    renderWithIntl(<ThemeSwitch />);
    const button = screen.getByRole('button', { name: 'Night paper' });
    expect(button.getAttribute('aria-pressed')).toBe('false');

    // The switch hears the change of <html data-theme> from a MutationObserver, which reports after a microtask.
    await act(async () => fireEvent.click(button));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');
    expect(button.getAttribute('aria-pressed')).toBe('true');

    await act(async () => fireEvent.click(button));
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem(THEME_KEY)).toBe('light');
    expect(button.getAttribute('aria-pressed')).toBe('false');
  });

  it('shows the theme that the head script set before React loaded', () => {
    document.documentElement.dataset.theme = 'dark';
    renderWithIntl(<ThemeSwitch />);
    expect(screen.getByRole('button', { name: 'Night paper' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('follows a change to <html data-theme> made elsewhere, such as another switch', async () => {
    renderWithIntl(<ThemeSwitch />);
    await act(async () => {
      document.documentElement.dataset.theme = 'dark';
    });
    expect(screen.getByRole('button', { name: 'Night paper' }).getAttribute('aria-pressed')).toBe('true');
  });
});
