import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import { languageBarScript } from '@/i18n/language-choice';
import { routing } from '@/i18n/routing';
import { LanguageBar } from '@/shell/LanguageBar';
import { SiteFooter } from '@/shell/SiteFooter';
import { SiteHeader } from '@/shell/SiteHeader';
import { THEME_SCRIPT } from '@/theme/theme';
import { fontVariables } from '../fonts';
import '../globals.css';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return { title: { default: t('title'), template: t('titleTemplate') }, description: t('description') };
}

export default async function LocaleLayout({ children }: LayoutProps<'/[locale]'>) {
  const locale = await getLocale();
  const t = await getTranslations('shell');
  return (
    // The theme script sets data-theme on <html> before React loads, so React must not undo it.
    <html lang={locale} className={`${fontVariables} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        {locale !== routing.defaultLocale && <script dangerouslySetInnerHTML={{ __html: languageBarScript(locale) }} />}
      </head>
      <body className="font-sans">
        <NextIntlClientProvider>
          {/* The footer stays at the bottom of short pages. <body> itself stays a block, like every page expects. */}
          <div className="flex min-h-dvh flex-col">
            <a
              href="#main"
              className="sr-only z-50 bg-ink px-3 py-2 font-semibold text-paper focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
            >
              {t('skip')}
            </a>
            <LanguageBar />
            <SiteHeader />
            <div id="main" className="flex-1">
              {children}
            </div>
            <SiteFooter />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
