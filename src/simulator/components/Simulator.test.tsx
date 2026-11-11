// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
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
  it('opens a share link pasted into the address bar of an open tab, then drops it from the URL', () => {
    renderPage();
    expect(title()).toBe('Binary +1');
    window.history.replaceState(null, '', `${PAGE}?x=1${linkHash('palindrome')}`);
    act(() => {
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(title()).toBe('Palindrome checker');
    expect(`${window.location.pathname}${window.location.search}${window.location.hash}`).toBe(`${PAGE}?x=1`);
  });

  it('shows the bad-link note when React runs the effect twice, as StrictMode does in dev', () => {
    window.history.replaceState(null, '', `${PAGE}#m=broken`);
    renderPage();
    expect(screen.getByText(en.simulator.notes.badLink)).toBeTruthy();
    expect(window.location.hash).toBe('');
  });
});
