import { compressToEncodedURIComponent } from 'lz-string';
import { describe, expect, it } from 'vitest';
import binaryPlusOne from '../../examples/binary-plus-one.json';
import { fromJson, machine } from '@/engines/turing/test-helpers';
import { machineFromHash, SHARE_URL_LIMIT, shareUrl } from './share-link';

const page = 'https://computable.example/en/simulator';
const binary = fromJson(binaryPlusOne);

describe('shareUrl', () => {
  it('puts the compressed machine in the hash after #m=', () => {
    const result = shareUrl(page, binary);
    if (!result.ok) throw new Error('expected a link');
    expect(result.url.startsWith(`${page}#m=`)).toBe(true);
    expect(result.url.length).toBeLessThan(SHARE_URL_LIMIT);
  });

  it('refuses a link longer than 8,000 characters', () => {
    // Random-looking state names compress badly, so 600 rules give a link far over the limit.
    const rules = Array.from({ length: 600 }, (_, i) => ({
      state: `s${(i * 7919).toString(36)}`,
      read: String.fromCodePoint(0x4e00 + i),
      write: '1',
      move: 'R' as const,
      next: `t${(i * 104729).toString(36)}`,
    }));
    const result = shareUrl(page, machine(rules));
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
});
