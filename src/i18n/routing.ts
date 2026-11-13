import { defineRouting } from 'next-intl/routing';

/** One year, in seconds: how long the NEXT_LOCALE cookie keeps the visitor's language. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * The languages (spec 1). English is the default and the source of every text. To add a language:
 * add its code here and `messages/<code>.json` with the same keys as `en.json`.
 */
export const routing = defineRouting({
  locales: ['en', 'pt-BR', 'es', 'fr', 'de'],
  defaultLocale: 'en',
  // URLs stay in lower case, like /en: /pt-br/simulator. A link to /pt-BR/... redirects there.
  localePrefix: { mode: 'always', prefixes: { 'pt-BR': '/pt-br' } },
  // next-intl keeps the cookie only until the browser closes. A year remembers the choice (spec 3).
  localeCookie: { maxAge: LOCALE_COOKIE_MAX_AGE },
});
