import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

/** Next.js links and redirects that keep the current language in the URL. */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
