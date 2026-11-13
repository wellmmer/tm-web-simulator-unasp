'use client';

import { CircleHelp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { isCurrentPage } from '@/shell/menu';
import { tourStore } from './tour';

/** "? Tour" in the menu (spec 5.5). On another page it opens the simulator, which then starts the tour. */
export function TourButton() {
  const t = useTranslations('tour');
  const pathname = usePathname();
  const router = useRouter();
  const onSimulator = isCurrentPage(pathname, '/simulator');

  // Leaving the simulator ends the tour. The menu is on every page, so it sees the visitor leave.
  // The simulator page stays alive while hidden, so without this its tour would come back with it.
  useEffect(() => {
    if (!onSimulator && tourStore.getState().step !== null) tourStore.getState().close();
  }, [onSimulator]);

  const open = () => {
    tourStore.getState().request();
    if (!onSimulator) router.push('/simulator');
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
