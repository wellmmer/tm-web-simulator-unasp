import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { parseMachine, type Machine } from '@/engines/turing';

/** Longer links break in some chat apps and browsers, so the app offers a file instead (spec 5.6). */
export const SHARE_URL_LIMIT = 8000;

const HASH_PREFIX = '#m=';

export type ShareUrlResult = { ok: true; url: string } | { ok: false; reason: 'too-long'; length: number };

/** Builds a link to `pageUrl` that holds the whole machine, compressed, in the hash. */
export function shareUrl(pageUrl: string, machine: Machine): ShareUrlResult {
  const url = `${pageUrl}${HASH_PREFIX}${compressToEncodedURIComponent(JSON.stringify(machine))}`;
  return url.length > SHARE_URL_LIMIT ? { ok: false, reason: 'too-long', length: url.length } : { ok: true, url };
}

export type HashMachine = { kind: 'none' } | { kind: 'machine'; machine: Machine } | { kind: 'bad' };

/** Reads the machine from a location hash such as "#m=N4Ig…". */
export function machineFromHash(hash: string): HashMachine {
  if (!hash.startsWith(HASH_PREFIX)) return { kind: 'none' };
  const text = decompressFromEncodedURIComponent(hash.slice(HASH_PREFIX.length));
  if (!text) return { kind: 'bad' };
  const result = parseMachine(text);
  return result.ok ? { kind: 'machine', machine: result.machine } : { kind: 'bad' };
}
