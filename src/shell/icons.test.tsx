import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BombeIcon, BookIcon, CupIcon, RotorIcon, TapeIcon } from './icons';

describe('drawn icons (spec 6)', () => {
  it.each([
    ['book', BookIcon],
    ['tape', TapeIcon],
    ['rotor', RotorIcon],
    ['bombe', BombeIcon],
    ['cup', CupIcon],
  ])('the %s icon is a 24px drawing with a 1.8px line that screen readers skip', (_name, Icon) => {
    const svg = renderToStaticMarkup(<Icon className="size-5" />);
    expect(svg).toMatch(/^<svg /);
    expect(svg).toContain('viewBox="0 0 24 24"');
    expect(svg).toContain('stroke-width="1.8"');
    expect(svg).toContain('stroke="currentColor"');
    expect(svg).toContain('aria-hidden="true"');
    expect(svg).toContain('class="size-5"');
  });
});
