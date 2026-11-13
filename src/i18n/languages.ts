import type { Locale } from 'next-intl';

/** Each language by its own name. The language switcher and the language bar show these. */
export const LANGUAGE_NAMES: Record<Locale, string> = {
  en: 'English',
  'pt-BR': 'Português',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
};

/** Languages that an AI translated and no native speaker has checked yet (spec 3, "Translations"). */
export const MACHINE_TRANSLATED: readonly Locale[] = ['es', 'fr', 'de'];
