import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { routing } from './routing';

function readMessages(locale: string): unknown {
  return JSON.parse(readFileSync(join(process.cwd(), 'messages', `${locale}.json`), 'utf8'));
}

/** Every key path in a messages file, such as "home.title". */
function keysOf(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) => keysOf(child, prefix === '' ? key : `${prefix}.${key}`));
}

describe('messages', () => {
  it.each(routing.locales)('messages/%s.json has exactly the keys of messages/en.json', (locale) => {
    expect(keysOf(readMessages(locale)).sort()).toEqual(keysOf(readMessages('en')).sort());
  });
});
