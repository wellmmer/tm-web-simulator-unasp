import type { SupportHandles } from '@/config/support';
import { amountText } from './amount';

export type ProviderId = 'pix' | 'paypal' | 'kofi' | 'revolut' | 'wise' | 'github';

/** The providers Support the dev shows, in order: `first` in full, `more` under "More ways to pay". */
export interface SupportOptions {
  first: ProviderId[];
  more: ProviderId[];
}

export interface ProviderLink {
  href: string;
  /** True when the link fills in the amount. Otherwise the donor types it on the provider's page. */
  carriesAmount: boolean;
}

/** Spec 7: Brazilian Portuguese visitors see Pix first, everyone else PayPal and Ko-fi. */
function isBrazilian(locale: string): boolean {
  return /^pt(-br)?$/i.test(locale);
}

const filled = (text: string) => text.trim() !== '';
const isHttps = (link: string) => link.trim().startsWith('https://');

function isReady(id: ProviderId, handles: SupportHandles): boolean {
  switch (id) {
    case 'pix':
      return filled(handles.pix.key) && filled(handles.pix.name) && filled(handles.pix.city);
    case 'paypal':
      return filled(handles.paypal);
    case 'kofi':
      return filled(handles.kofi);
    case 'revolut':
      return isHttps(handles.revolutLink);
    case 'wise':
      return isHttps(handles.wiseLink);
    case 'github':
      return isHttps(handles.githubSponsorsLink);
  }
}

/**
 * Which providers to show for a language, without the ones that have no handle yet. When nothing
 * is left to show first, "More ways to pay" moves up. Both lists are empty when no handle is filled in.
 */
export function supportOptions(locale: string, handles: SupportHandles): SupportOptions {
  const order: SupportOptions = isBrazilian(locale)
    ? { first: ['pix', 'paypal', 'kofi'], more: ['revolut', 'wise', 'github'] }
    : { first: ['paypal', 'kofi'], more: ['pix', 'revolut', 'wise', 'github'] };
  const first = order.first.filter((id) => isReady(id, handles));
  const more = order.more.filter((id) => isReady(id, handles));
  return first.length === 0 ? { first: more, more: [] } : { first, more };
}

/**
 * The link to pay `amount` US dollars. Only PayPal.me takes the amount in the link (checked:
 * PayPal's PayPal.Me help page, "PayPal.Me/DiaRusso/25AUD"). Pix shows a QR code instead.
 */
export function providerLink(id: Exclude<ProviderId, 'pix'>, handles: SupportHandles, amount: number): ProviderLink {
  switch (id) {
    case 'paypal':
      return { href: `https://paypal.me/${encodeURIComponent(handles.paypal.trim())}/${amountText(amount)}USD`, carriesAmount: true };
    case 'kofi':
      return { href: `https://ko-fi.com/${encodeURIComponent(handles.kofi.trim())}`, carriesAmount: false };
    case 'revolut':
      return { href: handles.revolutLink.trim(), carriesAmount: false };
    case 'wise':
      return { href: handles.wiseLink.trim(), carriesAmount: false };
    case 'github':
      return { href: handles.githubSponsorsLink.trim(), carriesAmount: false };
  }
}
