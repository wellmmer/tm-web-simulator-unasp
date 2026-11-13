'use client';

import { Analytics } from '@vercel/analytics/next';
import { withoutMachine } from './page-url';

/** Vercel Web Analytics, which sends each page view without the part after "?" or "#". */
export function SiteAnalytics() {
  return <Analytics beforeSend={withoutMachine} />;
}
