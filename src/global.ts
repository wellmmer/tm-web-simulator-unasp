import type { routing } from '@/i18n/routing';
import type messages from '../messages/en.json';

// Typed messages: a key that is not in messages/en.json fails the type check.
declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
