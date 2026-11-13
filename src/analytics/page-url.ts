import type { BeforeSendEvent } from '@vercel/analytics/react';
import { LOCALE_PREFIXES, routing } from '@/i18n/routing';

/**
 * The address without the part after "?" or "#". A share link holds the whole machine after "#"
 * (spec 5.6), and Vercel's script sends `location.href` with it, so the counter must drop it.
 */
export function pageUrlOnly(url: string): string {
  const end = url.search(/[?#]/);
  return end === -1 ? url : url.slice(0, end);
}

/** The analytics `beforeSend`: every page view and event leaves without the machine. */
export function withoutMachine(event: BeforeSendEvent): BeforeSendEvent {
  return { ...event, url: pageUrlOnly(event.url) };
}

/** The first part of every page's address, one per language: "/en", "/pt-br", "/es" and so on. */
const customPrefixes: Partial<Record<string, string>> = LOCALE_PREFIXES;
const languagePrefixes: readonly string[] = routing.locales.map((locale) => customPrefixes[locale] ?? `/${locale}`);

/**
 * The route the Vercel dashboard groups a page view under: "/pt-br/simulator" and
 * "/en/simulator" both become "/[locale]/simulator". Vercel's own Next.js component cannot do
 * this for Portuguese: it looks for the code "pt-BR" in the address, and the address has "pt-br".
 */
export function pageRoute(pathname: string): string {
  const prefix = languagePrefixes.find((candidate) => pathname === candidate || pathname.startsWith(`${candidate}/`));
  return prefix === undefined ? pathname : `/[locale]${pathname.slice(prefix.length)}`;
}
