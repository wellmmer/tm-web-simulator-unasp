'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useLayoutEffect } from 'react';
import { saveLanguageChoice, setLanguageBarShown, wantsLanguageBar } from '@/i18n/language-choice';
import { LANGUAGE_NAMES } from '@/i18n/languages';
import { Link, usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

/**
 * The bar above the menu on a page that is not in English (spec 3): "Showing in Português. Switch to
 * English?". The page is static, so the server always renders the bar; CSS shows it only while the
 * script in <head> marks <html>. Either answer hides the bar for good.
 */
export function LanguageBar() {
  const t = useTranslations('shell.languageBar');
  const locale = useLocale();
  const pathname = usePathname();

  // After a change of language without a reload, or React's second mount in development, the mark
  // on <html> must follow the visitor's choice again.
  useLayoutEffect(() => setLanguageBarShown(wantsLanguageBar(locale)), [locale]);

  if (locale === routing.defaultLocale) return null;
  const language = LANGUAGE_NAMES[locale];
  const choose = (choice: string) => {
    saveLanguageChoice(choice);
    setLanguageBarShown(false);
  };
  const button = 'border-2 border-paper px-3 py-1 font-semibold';

  return (
    <section aria-label={t('label')} className="language-bar border-b-2 border-ink bg-ink text-paper">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5 sm:px-7">
        <p>{t('showing', { language })}</p>
        <div className="flex flex-wrap gap-2">
          <Link href={pathname} locale="en" lang="en" onClick={() => choose('en')} className={`${button} bg-paper text-ink`}>
            {LANGUAGE_NAMES.en}
          </Link>
          <button type="button" onClick={() => choose(locale)} className={button}>
            {t('keep', { language })}
          </button>
        </div>
      </div>
    </section>
  );
}
