// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SiteAnalytics } from './SiteAnalytics';

vi.mock('next/navigation', () => ({ usePathname: () => '/pt-br/simulator' }));

afterEach(() => {
  cleanup();
  delete window.va;
  delete window.vaq;
  document.head.querySelectorAll('script').forEach((script) => script.remove());
});

describe('SiteAnalytics', () => {
  it("gives Vercel's script a beforeSend that drops the machine from a share link", () => {
    render(<SiteAnalytics />);

    // The package queues ["beforeSend", fn] in window.vaq until Vercel's script loads and reads it.
    const queued = window.vaq?.find(([name]) => name === 'beforeSend');
    expect(queued).toBeDefined();
    const beforeSend = queued?.[1] as (event: { type: 'pageview'; url: string }) => { url: string };
    expect(beforeSend({ type: 'pageview', url: 'https://computable.example/en/simulator#m=N4IgLgpg' })).toEqual({
      type: 'pageview',
      url: 'https://computable.example/en/simulator',
    });
  });

  it('sends the page view of a Portuguese page under the same route as the other languages', () => {
    render(<SiteAnalytics />);

    expect(window.vaq).toContainEqual(['pageview', { route: '/[locale]/simulator', path: '/pt-br/simulator' }]);
  });

  it('queues beforeSend before the first page view, so no page view leaves without it', () => {
    render(<SiteAnalytics />);

    const names = (window.vaq ?? []).map(([name]) => name);
    expect(names.indexOf('beforeSend')).toBeGreaterThanOrEqual(0);
    expect(names.indexOf('beforeSend')).toBeLessThan(names.indexOf('pageview'));
  });

  it("adds Vercel's script to the page, with automatic page views off", () => {
    render(<SiteAnalytics />);
    // Vitest sets NODE_ENV to "test", so the package picks its debug script, which sends nothing.
    const script = document.head.querySelector<HTMLScriptElement>('script[src="https://va.vercel-scripts.com/v1/script.debug.js"]');
    expect(script).not.toBeNull();
    // The site sends each page view itself, with its route, so the script must not send its own.
    expect(script?.dataset.disableAutoTrack).toBe('1');
    expect(script?.dataset.sdkn).toBe('@vercel/analytics/next');
  });
});
