'use client';

import { CircleHelp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { isCurrentPage } from '@/shell/menu';
import { tourStore } from './tour';

/** "? Tour" in the menu (spec 5.5). On another page it opens the simulator, which then starts the tour. */
export function TourButton() {
  const t = useTranslations('tour');
  const pathname = usePathname();
  const router = useRouter();

  const open = () => {
    tourStore.getState().request();
    if (!isCurrentPage(pathname, '/simulator')) router.push('/simulator');
  };

  return (
    <button
      type="button"
      onClick={open}
      data-tour-button
      className="inline-flex h-9 items-center gap-1.5 border-2 border-ink bg-cell px-2.5 font-semibold text-ink"
    >
      <CircleHelp aria-hidden className="size-[18px] shrink-0" strokeWidth={1.8} />
      {t('button')}
    </button>
  );
}
