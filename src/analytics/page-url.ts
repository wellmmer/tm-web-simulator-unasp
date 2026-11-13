import type { BeforeSendEvent } from '@vercel/analytics/next';

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
