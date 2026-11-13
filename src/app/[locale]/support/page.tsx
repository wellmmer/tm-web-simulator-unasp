import type { Metadata } from 'next';
import { useLocale, useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { supportHandles } from '@/config/support';
import { pageLead, pageMain, pageTitle } from '@/shell/page-styles';
import { SupportView } from '@/support/SupportView';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('support');
  return { title: t('pageTitle') };
}

/** Support the dev (spec 7). The payment handles live in src/config/support.ts. */
export default function SupportPage() {
  const t = useTranslations('support');
  const locale = useLocale();
  return (
    <main className={pageMain}>
      <h1 className={pageTitle}>{t('title')}</h1>
      <p className={pageLead}>{t('lead')}</p>
      {/* Another language may ask for another currency, so the chosen amount starts again. */}
      <SupportView key={locale} handles={supportHandles} />
    </main>
  );
}
