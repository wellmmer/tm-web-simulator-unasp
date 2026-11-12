/**
 * A static Pix code ("Pix copia e cola"), as the QR code on Support the dev holds it. The format is
 * the Banco Central do Brasil's BR Code: EMV fields written as id, two-digit length and value,
 * closed by a CRC-16 checksum.
 */

export interface PixPayee {
  /** The Pix key: an email, a phone number, a CPF or a random key. */
  key: string;
  /** The name the payer's bank shows. */
  name: string;
  city: string;
}

/** One EMV field: the id, the length of the value in two digits, then the value. */
function field(id: string, value: string): string {
  return `${id}${String(value.length).padStart(2, '0')}${value}`;
}

/** Names and cities take plain ASCII only: accents go, and the text is cut to `max` characters. */
function plain(text: string, max: number): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .trim()
    .slice(0, max);
}

/** CRC-16/CCITT-FALSE (polynomial 0x1021, start 0xFFFF), as four upper-case hex digits. */
export function crc16(text: string): string {
  let crc = 0xffff;
  for (const byte of new TextEncoder().encode(text)) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/** The Pix code for `payee`. With an amount in reais, the payer's bank fills it in. */
export function pixCode(payee: PixPayee, amount?: number): string {
  const account = field('00', 'br.gov.bcb.pix') + field('01', payee.key);
  const payload = [
    field('00', '01'),
    field('26', account),
    field('52', '0000'),
    field('53', '986'),
    amount === undefined ? '' : field('54', amount.toFixed(2)),
    field('58', 'BR'),
    field('59', plain(payee.name, 25)),
    field('60', plain(payee.city, 15)),
    field('62', field('05', '***')),
    // The checksum covers its own id and length.
    '6304',
  ].join('');
  return payload + crc16(payload);
}
