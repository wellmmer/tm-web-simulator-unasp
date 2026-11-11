import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

/** Sends a visitor without a language in the URL to one, for example "/" to "/en". */
export default createMiddleware(routing);

export const config = {
  // Every path except API routes, Next.js internals and files with a dot (favicon.ico).
  matcher: '/((?!api|_next|_vercel|.*\\..*).*)',
};
