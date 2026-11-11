import { defineRouting } from 'next-intl/routing';

/** To add a language: add its code here and add `messages/<code>.json` with the same keys as `en.json`. */
export const routing = defineRouting({
  locales: ['en'],
  defaultLocale: 'en',
});
