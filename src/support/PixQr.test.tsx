import { renderToStaticMarkup } from 'react-dom/server';
import { encode } from 'uqr';
import { describe, expect, it } from 'vitest';
import { PixQr } from './PixQr';

const CODE = '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D';

describe('PixQr', () => {
  it('draws one black square per dark module, on white, with a quiet zone of 4 modules', () => {
    const svg = renderToStaticMarkup(<PixQr code={CODE} label="Pix QR code" />);
    const { data, size } = encode(CODE, { ecc: 'M', border: 4 });
    const dark = data.flat().filter(Boolean).length;
    expect(svg).toContain(`viewBox="0 0 ${size} ${size}"`);
    expect(svg.match(/h1v1h-1z/g)).toHaveLength(dark);
    expect(data[0].some(Boolean)).toBe(false);
    expect(svg).toContain('fill="#ffffff"');
    expect(svg).toContain('fill="#000000"');
  });

  it('is one image with a name for screen readers', () => {
    const svg = renderToStaticMarkup(<PixQr code={CODE} label="Pix QR code" />);
    expect(svg).toMatch(/^<svg role="img" aria-label="Pix QR code"/);
  });
});
