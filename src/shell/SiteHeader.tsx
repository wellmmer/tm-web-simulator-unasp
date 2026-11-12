'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { ThemeSwitch } from '@/theme/ThemeSwitch';
import { BombeIcon, BookIcon, CupIcon, RotorIcon, TapeIcon } from './icons';
import { isCurrentPage, MENU_ITEMS, type MenuId, type MenuItem } from './menu';

const ICONS: Record<MenuId, typeof BookIcon> = { learn: BookIcon, simulator: TapeIcon, enigma: RotorIcon, bombe: BombeIcon };

/** On phones the icon sits above its name. From 640px they sit side by side. */
const entry = 'flex flex-col items-center gap-1 py-1 text-[13px]/tight sm:flex-row sm:gap-2 sm:text-[15px]/tight';

function MenuEntry({ item, pathname }: { item: MenuItem; pathname: string }) {
  const t = useTranslations('shell.menu');
  const Icon = ICONS[item.id];
  if (item.href === null) {
    return (
      <span className={`${entry} text-muted`}>
        <Icon className="size-[19px] shrink-0" />
        <span>
          {t(item.id)}
          <span className="sr-only">, {t('comingSoon')}</span>
        </span>
        <span aria-hidden className="font-display text-[12px] italic sm:text-[13px]">
          {t('soon')}
        </span>
      </span>
    );
  }
  const current = isCurrentPage(pathname, item.href);
  return (
    <Link
      href={item.href}
      aria-current={current ? 'page' : undefined}
      className={`${entry} ${current ? 'font-semibold text-ink' : 'text-muted hover:text-ink'}`}
    >
      <Icon className={`size-[19px] shrink-0 ${current ? 'text-pencil' : ''}`} />
      {t(item.id)}
    </Link>
  );
}

/**
 * The menu bar from the approved mockup (simulator-v4.html): the wordmark, the four sections,
 * Support the dev and the theme switch. One row from 1024px; below, the sections get a row of their own.
 */
export function SiteHeader() {
  const t = useTranslations('shell.menu');
  const pathname = usePathname();
  const supportCurrent = isCurrentPage(pathname, '/support');

  return (
    <header className="border-b-2 border-ink bg-cell">
      <div className="mx-auto grid max-w-[1200px] grid-cols-[1fr_auto] items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-7 lg:grid-cols-[auto_1fr_auto]">
        <Link href="/" className="justify-self-start font-display text-[22px]/none font-extrabold tracking-tight text-ink">
          {t('wordmark')}
        </Link>
        <nav aria-label={t('label')} className="col-span-2 row-start-2 lg:col-span-1 lg:col-start-2 lg:row-start-1">
          <ul className="grid grid-cols-4 gap-1 sm:flex sm:gap-7">
            {MENU_ITEMS.map((item) => (
              <li key={item.id}>
                <MenuEntry item={item} pathname={pathname} />
              </li>
            ))}
          </ul>
        </nav>
        <div className="col-start-2 row-start-1 flex items-center gap-4 lg:col-start-3">
          <Link
            href="/support"
            aria-current={supportCurrent ? 'page' : undefined}
            className="inline-flex items-center gap-2 py-1 font-semibold text-ink"
          >
            <CupIcon className={`size-[19px] shrink-0 ${supportCurrent ? 'text-pencil' : 'text-coffee'}`} />
            {t('support')}
          </Link>
          <ThemeSwitch />
        </div>
      </div>
    </header>
  );
}
