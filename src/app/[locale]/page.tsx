import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { HomeMachine } from '@/home/HomeMachine';
import { Link } from '@/i18n/navigation';

/** Home until R3 (spec 4.2): the title, one sentence, Turing's first machine running, and one button. */
export default function HomePage() {
  const t = useTranslations('home');
  return (
    <main className="py-12 sm:py-20">
      <div className="mx-auto max-w-[1200px] px-4 text-center sm:px-7">
        <h1 className="font-display text-[48px]/none font-extrabold tracking-tight sm:text-[76px]/none">{t('title')}</h1>
        <p className="mx-auto mt-5 max-w-[36ch] text-lg/snug sm:text-xl/snug">{t('lead')}</p>
      </div>
      <div className="mt-6 sm:mt-10">
        <HomeMachine />
      </div>
      <p className="mt-10 text-center">
        <Link
          href="/simulator"
          className="inline-flex items-center gap-2 border-2 border-ink bg-ink px-6 py-3 text-lg font-semibold text-paper active:translate-y-px"
        >
          {t('openSimulator')}
          <ArrowRight aria-hidden className="size-5" />
        </Link>
      </p>
    </main>
  );
}
