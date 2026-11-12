import { useTranslations } from 'next-intl';
import { REPO_URL } from '@/config/links';
import { Link } from '@/i18n/navigation';

const link = 'underline decoration-1 underline-offset-4 hover:decoration-2';

/** The footer on every page: the pages outside the menu, the source code and the licenses (spec 3). */
export function SiteFooter() {
  const t = useTranslations('shell.footer');
  const tMenu = useTranslations('shell.menu');
  return (
    <footer className="mt-16 border-t-2 border-ink bg-cell">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-3 px-4 py-6 text-sm sm:px-7 md:flex-row md:items-baseline md:justify-between">
        <p>
          <span className="font-display text-base font-extrabold">{tMenu('wordmark')}</span>{' '}
          <span className="text-muted">{t('tagline')}</span>
        </p>
        <nav aria-label={t('label')}>
          <ul className="flex flex-wrap gap-x-5 gap-y-1">
            <li>
              <Link href="/about" className={link}>
                {t('about')}
              </Link>
            </li>
            <li>
              <Link href="/privacy" className={link}>
                {t('privacy')}
              </Link>
            </li>
            <li>
              <Link href="/support" className={link}>
                {tMenu('support')}
              </Link>
            </li>
            <li>
              <a href={REPO_URL} className={link}>
                {t('source')}
              </a>
            </li>
          </ul>
        </nav>
      </div>
      <p className="mx-auto max-w-[1200px] px-4 pb-6 text-xs text-muted sm:px-7">{t('license')}</p>
    </footer>
  );
}
