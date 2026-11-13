/**
 * The visitor counting that the Privacy page describes (spec 3: cookieless analytics). This file
 * and the `privacy.analytics` texts in messages/*.json are the only places to change if the site
 * moves to another service.
 */
export const ANALYTICS = {
  service: 'Vercel Web Analytics',
  privacyUrl: 'https://vercel.com/docs/analytics/privacy-policy',
} as const;

/**
 * Counts visits on Vercel's production site only. Vercel sets VERCEL_ENV at build and run time:
 * "production", "preview" or "development". `next dev`, `npm test`, `npm run e2e` and GitHub
 * Actions run outside Vercel, where it is not set.
 */
export function analyticsOn(vercelEnv: string | undefined): boolean {
  return vercelEnv === 'production';
}
