import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

/** A temporary Home page until plan R1c. */
export default function HomePage() {
  const t = useTranslations('home');
  return (
    <main className="mx-auto max-w-2xl px-4 py-24">
      <h1 className="text-4xl font-semibold">{t('title')}</h1>
      <p className="mt-4 text-lg">{t('lead')}</p>
      <p className="mt-8">
        <Link href="/simulator" className="underline underline-offset-4">
          {t('openSimulator')}
        </Link>
      </p>
    </main>
  );
}
