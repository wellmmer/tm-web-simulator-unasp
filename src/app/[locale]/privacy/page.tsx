import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { ANALYTICS } from '@/config/analytics';
import { ISSUES_URL } from '@/config/links';
import { pageLead, pageMain, pageTitle, sectionTitle, sheet, textLink } from '@/shell/page-styles';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('privacy');
  return { title: t('pageTitle') };
}

/** Privacy (spec 4.2): what stays in the browser, the one language cookie, what the cookieless analytics counts, and donations. */
export default function PrivacyPage() {
  const t = useTranslations('privacy');
  return (
    <main className={pageMain}>
      <h1 className={pageTitle}>{t('title')}</h1>
      <p className={pageLead}>{t('lead')}</p>

      <div className={`mt-10 space-y-8 ${sheet}`}>
        <section aria-labelledby="browser-title" className="space-y-3">
          <h2 id="browser-title" className={sectionTitle}>
            {t('browserTitle')}
          </h2>
          <p>{t('browser')}</p>
          <p>{t('language')}</p>
          <p>{t('shareLink')}</p>
        </section>

        <section aria-labelledby="analytics-title" className="space-y-3">
          <h2 id="analytics-title" className={sectionTitle}>
            {t('analytics.title')}
          </h2>
          <p>{t('analytics.summary', { service: ANALYTICS.service })}</p>
          <p>{t('analytics.counted')}</p>
          <p>{t('analytics.address')}</p>
          <p>{t('analytics.visitor')}</p>
          <p>
            <a href={ANALYTICS.privacyUrl} className={textLink}>
              {t('analytics.source', { service: ANALYTICS.service })}
            </a>
          </p>
        </section>

        <section aria-labelledby="donations-title" className="space-y-3">
          <h2 id="donations-title" className={sectionTitle}>
            {t('donationsTitle')}
          </h2>
          <p>{t('donations')}</p>
        </section>
      </div>

      <p className="mt-8">
        {t.rich('questions', {
          link: (chunks) => (
            <a href={ISSUES_URL} className={textLink}>
              {chunks}
            </a>
          ),
        })}
      </p>
    </main>
  );
}
