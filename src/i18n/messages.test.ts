import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { routing } from './routing';

type Messages = { [key: string]: string | Messages };

function readMessages(locale: string): Messages {
  return JSON.parse(readFileSync(join(process.cwd(), 'messages', `${locale}.json`), 'utf8'));
}

/** Every text in a messages file, by its key path, such as "home.title". */
function textsOf(messages: Messages, prefix = ''): Map<string, string> {
  const texts = new Map<string, string>();
  for (const [key, value] of Object.entries(messages)) {
    const path = prefix === '' ? key : `${prefix}.${key}`;
    if (typeof value === 'string') texts.set(path, value);
    else for (const [childPath, text] of textsOf(value, path)) texts.set(childPath, text);
  }
  return texts;
}

/**
 * A value for each argument of an English text: a number for `{n, plural}` and `{n, number}`,
 * "other" for `{x, select}`, a word for the rest. A tag such as <b> gets a function that keeps its text.
 */
function valuesFor(english: string): Record<string, string | number | ((chunks: string) => string)> {
  const values: Record<string, string | number | ((chunks: string) => string)> = {};
  for (const [, name, kind] of english.matchAll(/\{\s*(\w+)\s*(?:,\s*(\w+))?/g)) {
    values[name] = kind === 'plural' || kind === 'number' ? 1 : kind === 'select' ? 'other' : 'x';
  }
  for (const [, tag] of english.matchAll(/<(\w+)>/g)) values[tag] = (chunks) => chunks;
  return values;
}

const english = textsOf(readMessages('en'));

describe('messages (spec 10: every UI string exists in every language)', () => {
  it.each(routing.locales)('messages/%s.json has exactly the keys of messages/en.json', (locale) => {
    expect([...textsOf(readMessages(locale)).keys()].sort()).toEqual([...english.keys()].sort());
  });

  it.each(routing.locales)('messages/%s.json has no empty text', (locale) => {
    const empty = [...textsOf(readMessages(locale))].filter(([, text]) => text.trim() === '').map(([key]) => key);
    expect(empty).toEqual([]);
  });

  it.each(routing.locales)('every text in messages/%s.json formats with the arguments and tags of the English text', (locale) => {
    const errors: string[] = [];
    const messages = readMessages(locale);
    const t = createTranslator({ locale, messages, onError: (error) => errors.push(error.message) });
    for (const key of textsOf(messages).keys()) {
      const values = valuesFor(english.get(key) ?? '');
      // Formats every text, so a broken text fails here and not on a page.
      // @ts-expect-error -- the keys come from the file, so TypeScript cannot check them.
      t.markup(key, values);
    }
    expect(errors).toEqual([]);
  });
});
