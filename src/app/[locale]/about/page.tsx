import { ArrowUpRight } from 'lucide-react';
import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { TCC_PAPER_URL, TCC_TAG_URL } from '@/config/links';
import { pageLead, pageMain, pageTitle, sectionTitle, sheet, textLink } from '@/shell/page-styles';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('about');
  return { title: t('pageTitle') };
}

const FACTS = ['school', 'year', 'author', 'advisor'] as const;

/** About (spec 4.2): the 2016 capstone project behind Computable, with links to its paper and its code. */
export default function AboutPage() {
  const t = useTranslations('about');
  return (
    <main className={pageMain}>
      <h1 className={pageTitle}>{t('title')}</h1>
      <p className={pageLead}>{t('lead')}</p>
      <p className="mt-4">{t('rebuilt')}</p>

      {/* The red rule on top makes the facts look like an index card in a library drawer. */}
      <section aria-labelledby="record-title" className={`mt-10 border-t-4 border-pencil ${sheet}`}>
        <h2 id="record-title" className={sectionTitle}>
          {t('record')}
        </h2>
        <dl className="mt-4 grid gap-x-6 gap-y-1 sm:grid-cols-[7rem_1fr] sm:gap-y-3">
          <dt className="text-sm text-muted sm:pt-0.5">{t('projectLabel')}</dt>
          <dd>
            <span lang="pt-BR" className="font-display text-lg/snug italic">
              {t('project')}
            </span>
            <span className="block text-sm text-muted">{t('projectEnglish')}</span>
          </dd>
          {FACTS.map((fact) => (
            <div key={fact} className="contents">
              <dt className="mt-3 text-sm text-muted sm:mt-0 sm:pt-0.5">{t(`${fact}Label`)}</dt>
              <dd className="font-medium">{t(fact)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <ul className="mt-8 space-y-3">
        <li>
          <a href={TCC_PAPER_URL} className={`inline-flex items-center gap-1.5 ${textLink}`}>
            {t('paper')}
            <ArrowUpRight aria-hidden className="size-4" />
          </a>
        </li>
        <li>
          <a href={TCC_TAG_URL} className={`inline-flex items-center gap-1.5 ${textLink}`}>
            <span>{t.rich('tag', { code: (chunks) => <code className="font-mono text-[0.92em] whitespace-nowrap">{chunks}</code> })}</span>
            <ArrowUpRight aria-hidden className="size-4" />
          </a>
        </li>
      </ul>
    </main>
  );
}
