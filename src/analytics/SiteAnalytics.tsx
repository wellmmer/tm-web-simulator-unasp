'use client';

import { Analytics } from '@vercel/analytics/react';
import { usePathname } from 'next/navigation';
import { pageRoute, withoutMachine } from './page-url';

/**
 * Vercel Web Analytics. Each page view leaves without the part after "?" or "#", and with a route
 * that groups the 5 languages of a page. The path comes from `usePathname()`, which never holds
 * "?" or "#". Setting a route turns off the script's own page views, so only these are sent.
 */
export function SiteAnalytics() {
  const path = usePathname();
  return (
    <Analytics
      framework="next"
      route={pageRoute(path)}
      path={path}
      beforeSend={withoutMachine}
      basePath={process.env.NEXT_PUBLIC_VERCEL_OBSERVABILITY_BASEPATH}
      configString={process.env.NEXT_PUBLIC_VERCEL_OBSERVABILITY_CLIENT_CONFIG}
    />
  );
}
