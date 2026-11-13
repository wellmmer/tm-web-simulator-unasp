import { defineRouting } from 'next-intl/routing';

/**
 * The languages (spec 1). English is the default and the source of every text. To add a language:
 * add its code here and `messages/<code>.json` with the same keys as `en.json`.
 */
export const routing = defineRouting({
  locales: ['en', 'pt-BR', 'es'],
  defaultLocale: 'en',
  // URLs stay in lower case, like /en: /pt-br/simulator. A link to /pt-BR/... redirects there.
  localePrefix: { mode: 'always', prefixes: { 'pt-BR': '/pt-br' } },
});
