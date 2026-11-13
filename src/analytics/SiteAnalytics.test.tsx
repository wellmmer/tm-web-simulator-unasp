// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SiteAnalytics } from './SiteAnalytics';

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

  it("adds Vercel's script to the page", () => {
    render(<SiteAnalytics />);
    // Vitest sets NODE_ENV to "test", so the package picks its debug script, which sends nothing.
    expect(document.head.querySelector('script[src="https://va.vercel-scripts.com/v1/script.debug.js"]')).not.toBeNull();
  });
});
