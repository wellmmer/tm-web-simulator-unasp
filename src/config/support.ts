/**
 * The payment handles for Support the dev (spec 3, "Payment handles"). They all start empty.
 * The page hides each provider until its handle is filled in, so it can ship before every handle
 * is known. Wellmmer confirms every handle before launch (spec 10).
 */
export interface SupportHandles {
  /** The PayPal.me name: "name" in https://paypal.me/name. */
  paypal: string;
  /** The Ko-fi page name: "name" in https://ko-fi.com/name. */
  kofi: string;
  /**
   * Pix needs all three: the key, and the name and city that the payer's bank shows.
   * The key is public: the page shows it, and the QR code holds it. So use a random key
   * (chave aleatória) or an e-mail, never a CPF or a phone number.
   */
  pix: { key: string; name: string; city: string };
  /** The whole Revolut link, copied from the Revolut app. It must start with https://. */
  revolutLink: string;
  /** The whole Wise link, copied from the Wise app. It must start with https://. */
  wiseLink: string;
  /** The whole GitHub Sponsors link. It must start with https://. */
  githubSponsorsLink: string;
}

export const supportHandles: SupportHandles = {
  paypal: '',
  kofi: '',
  pix: { key: '', name: '', city: '' },
  revolutLink: '',
  wiseLink: '',
  githubSponsorsLink: '',
};
