import { describe, expect, it } from 'vitest';
import { analyticsOn } from './analytics';

describe('analyticsOn', () => {
  it("counts visits on Vercel's production site only", () => {
    expect(analyticsOn('production')).toBe(true);
  });

  it('counts nothing on a preview link, in `next dev`, in tests or in Playwright runs', () => {
    expect(analyticsOn('preview')).toBe(false);
    expect(analyticsOn('development')).toBe(false);
    // `npm test`, `npm run e2e` and GitHub Actions run outside Vercel, so VERCEL_ENV is not set.
    expect(analyticsOn(undefined)).toBe(false);
  });
});
