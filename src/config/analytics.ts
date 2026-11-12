/**
 * The visitor counting that the Privacy page describes (spec 3: cookieless analytics). This file
 * and the `privacy.analytics` texts in messages/en.json are the only places to change if plan
 * R1c-3 picks another service. R1c-1 adds no analytics code.
 */
export const ANALYTICS = {
  service: 'Vercel Web Analytics',
  privacyUrl: 'https://vercel.com/docs/analytics/privacy-policy',
} as const;
