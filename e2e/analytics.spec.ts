import { expect, test } from '@playwright/test';
import { openPage, openSimulator } from './helpers';

/** Requests to Vercel Web Analytics: its script and its intake, on the site or on Vercel's own host. */
const ANALYTICS_URL = /\/_vercel\/insights\/|va\.vercel-scripts\.com/;

test.describe('Analytics (spec 3, "Analytics")', () => {
  test('loads nothing outside Vercel production, so test runs are never counted', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (request) => {
      if (ANALYTICS_URL.test(request.url())) requests.push(request.url());
    });

    await openPage(page, '/en');
    await openSimulator(page, '#m=N4IgLgpgziBcIDsCuAbJAVAhgcwNYQBsBjAQwBM4QAHAT0IA');
    await openPage(page, '/pt-br/privacy');

    expect(requests).toEqual([]);
    await expect(page.locator('script[src*="/_vercel/insights/"], script[src*="va.vercel-scripts.com"]')).toHaveCount(0);
  });
});
