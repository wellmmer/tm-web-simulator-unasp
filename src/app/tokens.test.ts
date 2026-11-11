import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8');

/** The `--name: #rrggbb;` tokens inside the first block that starts with `selector {`. */
function tokensOf(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`no block for ${selector}`);
  const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)].map((m) => [m[1], m[2]]));
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** The WCAG 2 contrast ratio of two colors. */
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** [text or mark, background, minimum ratio]. 4.5 for text, 3 for large text and focus marks. */
const pairs: Array<[string, string, number]> = [
  ['ink', 'paper', 4.5],
  ['ink', 'cell', 4.5],
  ['ink', 'soft', 4.5],
  ['ink', 'row-now', 4.5],
  ['muted', 'paper', 4.5],
  ['muted', 'cell', 4.5],
  ['muted', 'soft', 4.5],
  ['pencil', 'paper', 4.5],
  ['pencil', 'cell', 4.5],
  ['on-pencil', 'pencil', 4.5],
  ['paper', 'ink', 4.5],
  ['blank-ink', 'cell', 3],
];

const themes = {
  'squared paper': tokensOf(':root'),
  'night paper (system setting)': tokensOf(':root:not([data-theme="light"])'),
  'night paper (switch)': tokensOf(':root[data-theme="dark"]'),
};

describe('design tokens', () => {
  it('defines night paper the same way for the system setting and the switch', () => {
    expect(themes['night paper (switch)']).toEqual(themes['night paper (system setting)']);
  });

  describe.each(Object.entries(themes))('%s', (_name, tokens) => {
    it.each(pairs)('%s on %s reaches %s:1', (front, back, minimum) => {
      expect(contrast(tokens[front], tokens[back])).toBeGreaterThanOrEqual(minimum);
    });
  });
});
