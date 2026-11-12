// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import en from '../../../messages/en.json';
import { shareUrl } from '@/share/share-link';
import { examples } from '../examples';
import { Simulator } from './Simulator';

const PAGE = '/en/simulator';

const linkHash = (id: keyof typeof examples) => {
  const link = shareUrl('https://x.example/en/simulator', examples[id].machine);
  if (!link.ok) throw new Error('expected a link');
  return new URL(link.url).hash;
};

const renderPage = () =>
  render(
    <StrictMode>
      <NextIntlClientProvider locale="en" messages={en}>
        <Simulator />
      </NextIntlClientProvider>
    </StrictMode>,
  );

const title = () => screen.getByRole('heading', { level: 1 }).textContent;

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, '', `${PAGE}?x=1`);
});

afterEach(cleanup);

describe('Simulator', () => {
  it('opens a share link pasted into an open tab, then goes back, so the next Back leaves the page', async () => {
    window.history.replaceState({ entry: 'before the link' }, '', `${PAGE}?x=1`);
    renderPage();
    expect(title()).toBe('Binary +1');
    // Pasting a link into the address bar adds a history entry with the hash.
    window.history.pushState(null, '', `${PAGE}?x=1${linkHash('palindrome')}`);
    act(() => {
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(title()).toBe('Palindrome checker');
    // The page is back on the entry from before the paste, so the next Back leaves the page.
    await waitFor(() => expect(window.history.state).toEqual({ entry: 'before the link' }));
    expect(`${window.location.pathname}${window.location.search}${window.location.hash}`).toBe(`${PAGE}?x=1`);
    expect(title()).toBe('Palindrome checker');
  });

  it('shows the bad-link note when React runs the effect twice, as StrictMode does in dev', () => {
    window.history.replaceState(null, '', `${PAGE}#m=broken`);
    renderPage();
    expect(screen.getByText(en.simulator.notes.badLink)).toBeTruthy();
    expect(window.location.hash).toBe('');
  });
});
