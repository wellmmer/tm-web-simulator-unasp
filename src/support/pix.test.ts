import { describe, expect, it } from 'vitest';
import { crc16, pixCode } from './pix';

/** The static Pix example from the Banco Central do Brasil's manual, "Manual de Padrões para Iniciação do Pix". */
const EXAMPLE =
  '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D';

describe('crc16', () => {
  it('is CRC-16/CCITT-FALSE, which gives 29B1 for "123456789"', () => {
    expect(crc16('123456789')).toBe('29B1');
  });

  it('pads to four hex digits', () => {
    expect(crc16('')).toBe('FFFF');
  });
});

describe('pixCode', () => {
  const payee = { key: '123e4567-e12b-12d1-a456-426655440000', name: 'Fulano de Tal', city: 'BRASILIA' };

  it("builds the manual's example, checksum included", () => {
    expect(pixCode(payee)).toBe(EXAMPLE);
  });

  it('puts an amount in field 54, with two decimals', () => {
    const code = pixCode(payee, 10.5);
    // Field 53 (currency 986, the real), then field 54 (amount, 5 characters), then field 58 (country).
    expect(code).toContain('5303986' + '540510.50' + '5802BR');
    expect(code.slice(-4)).toBe(crc16(code.slice(0, -4)));
  });

  it('writes names and cities without accents and cuts them to 25 and 15 characters', () => {
    const code = pixCode({ key: 'a@b.co', name: 'Wellmmer Lucas de Oliveira Pinto', city: 'São Paulo do Potengi' });
    expect(code).toContain('5925Wellmmer Lucas de Oliveir' + '6015Sao Paulo do Po');
  });
});
