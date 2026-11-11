import fc from 'fast-check';
import { compressToEncodedURIComponent } from 'lz-string';
import { describe, expect, it } from 'vitest';
import binaryPlusOne from '../../examples/binary-plus-one.json';
import { fromJson, machine } from '@/engines/turing/test-helpers';
import { machineFromHash, SHARE_URL_LIMIT, shareUrl } from './share-link';

const page = 'https://computable.example/en/simulator';
const binary = fromJson(binaryPlusOne);

// Random-looking state names compress badly, so 600 rules give a link far over the limit.
const bigRules = Array.from({ length: 600 }, (_, i) => ({
  state: `s${(i * 7919).toString(36)}`,
  read: String.fromCodePoint(0x4e00 + i),
  write: '1',
  move: 'R' as const,
  next: `t${(i * 104729).toString(36)}`,
}));

/** The characters lz-string puts in a link, so random text looks like a real link body. */
const LINK_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$%'.split('');

describe('shareUrl', () => {
  it('puts the compressed machine in the hash after #m=', () => {
    const result = shareUrl(page, binary);
    if (!result.ok) throw new Error('expected a link');
    expect(result.url.startsWith(`${page}#m=`)).toBe(true);
    expect(result.url.length).toBeLessThan(SHARE_URL_LIMIT);
  });

  it('refuses a link longer than 8,000 characters', () => {
    const result = shareUrl(page, machine(bigRules));
    expect(result).toMatchObject({ ok: false, reason: 'too-long' });
    if (result.ok) return;
    expect(result.length).toBeGreaterThan(SHARE_URL_LIMIT);
  });
});

describe('machineFromHash', () => {
  it('opens the same machine that the link was made from', () => {
    const result = shareUrl(page, binary);
    if (!result.ok) throw new Error('expected a link');
    const hash = new URL(result.url).hash;
    expect(machineFromHash(hash)).toEqual({ kind: 'machine', machine: binary });
  });

  it('finds nothing in an empty hash or a hash without m=', () => {
    expect(machineFromHash('')).toEqual({ kind: 'none' });
    expect(machineFromHash('#rules')).toEqual({ kind: 'none' });
  });

  it('reports a link that does not hold a machine', () => {
    expect(machineFromHash('#m=not-lz-data')).toEqual({ kind: 'bad' });
    expect(machineFromHash(`#m=${compressToEncodedURIComponent('{"format":"other"}')}`)).toEqual({ kind: 'bad' });
  });
  it('reports a damaged link instead of throwing', () => {
    // lz-string throws "Cannot read properties of undefined (reading 'charAt')" on this one.
    expect(machineFromHash('#m=ynPW3cs--d3z04')).toEqual({ kind: 'bad' });
  });

  it('reports a link longer than the share link limit, even when it holds a machine', () => {
    const big = machine(bigRules);
    const hash = `#m=${compressToEncodedURIComponent(JSON.stringify(big))}`;
    expect(hash.length).toBeGreaterThan(SHARE_URL_LIMIT);
    expect(machineFromHash(hash)).toEqual({ kind: 'bad' });
  });

  it('opens a link where a chat app turned + into %2B', () => {
    const plus = shareUrl(page, { ...binary, name: 'a'.repeat(40) });
    if (!plus.ok) throw new Error('expected a link');
    const hash = new URL(plus.url).hash;
    expect(hash).toContain('+');
    expect(machineFromHash(hash.replaceAll('+', '%2B'))).toEqual({ kind: 'machine', machine: { ...binary, name: 'a'.repeat(40) } });
  });

  it('reports a link with a broken % escape', () => {
    expect(machineFromHash('#m=%E0%A4%A')).toEqual({ kind: 'bad' });
  });

  it('never throws, whatever follows #m=', () => {
    fc.assert(
      fc.property(fc.oneof(fc.string({ unit: fc.constantFrom(...LINK_CHARS), maxLength: 60 }), fc.string({ unit: 'binary', maxLength: 200 })), (text) => {
        expect(() => machineFromHash(`#m=${text}`)).not.toThrow();
      }),
      { numRuns: 500 },
    );
  });

  it('never throws on a one-character edit of a real link', () => {
    const result = shareUrl(page, binary);
    if (!result.ok) throw new Error('expected a link');
    const body = new URL(result.url).hash.slice('#m='.length);
    const edit = fc.record({
      at: fc.nat({ max: body.length }),
      kind: fc.constantFrom('replace', 'insert', 'delete'),
      char: fc.string({ unit: 'binary', minLength: 1, maxLength: 1 }),
    });
    fc.assert(
      fc.property(edit, ({ at, kind, char }) => {
        const edited =
          kind === 'insert'
            ? body.slice(0, at) + char + body.slice(at)
            : body.slice(0, at) + (kind === 'replace' ? char : '') + body.slice(at + 1);
        expect(() => machineFromHash(`#m=${edited}`)).not.toThrow();
      }),
      { numRuns: 500 },
    );
  });
});
