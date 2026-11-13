'use client';

import { useTranslations } from 'next-intl';
import { useId } from 'react';
import { markTourSeen, tourStore } from './tour';

/**
 * "New here? Take the 1-minute tour" on the simulator (spec 5.5). The server always renders it; CSS
 * shows it only on the first visit, when the script in <head> marks <html>. Either answer hides it for good.
 */
export function TourPrompt() {
  const t = useTranslations('tour.prompt');
  const textId = useId();
  return (
    <section aria-labelledby={textId} className="tour-prompt mb-5 border-2 border-ink bg-cell px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <p id={textId} className="font-display text-lg/snug">
          {t('text')}
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => tourStore.getState().request()} className="border-2 border-ink bg-ink px-3 py-1 font-semibold text-paper">
            {t('take')}
          </button>
          <button type="button" onClick={markTourSeen} className="border-2 border-ink bg-cell px-3 py-1 font-semibold text-ink">
            {t('dismiss')}
          </button>
        </div>
      </div>
    </section>
  );
}
