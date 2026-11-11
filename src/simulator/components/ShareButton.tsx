'use client';

import { Link2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { shareUrl } from '@/share/share-link';
import { useSimulatorStore } from './store-context';

type ShareStatus = 'copied' | 'tooLong' | 'copyFailed';

/** Copies a link that holds the whole machine (spec 5.6). Download for big machines comes in plan R1b-2. */
export function ShareButton() {
  const t = useTranslations('simulator.share');
  const store = useSimulatorStore();
  const [status, setStatus] = useState<ShareStatus | null>(null);

  const share = async () => {
    const page = `${window.location.origin}${window.location.pathname}`;
    const result = shareUrl(page, store.getState().machine);
    if (!result.ok) {
      setStatus('tooLong');
      return;
    }
    try {
      await navigator.clipboard.writeText(result.url);
      setStatus('copied');
    } catch {
      // Copying needs permission in some browsers. The address bar then holds the link instead.
      window.history.replaceState(null, '', result.url);
      setStatus('copyFailed');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={share} className="inline-flex items-center gap-2 border-2 border-ink bg-cell px-3 py-1.5 font-medium">
        <Link2 aria-hidden className="size-4" />
        {t('copy')}
      </button>
      <span role="status" className="text-sm text-muted">
        {status !== null && t(status)}
      </span>
    </div>
  );
}
