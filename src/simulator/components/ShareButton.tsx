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
  /** The link to copy by hand when the browser does not allow copying. */
  const [manualLink, setManualLink] = useState<string | null>(null);

  const share = async () => {
    const page = `${window.location.origin}${window.location.pathname}`;
    const result = shareUrl(page, store.getState().machine);
    setManualLink(null);
    if (!result.ok) {
      setStatus('tooLong');
      return;
    }
    try {
      await navigator.clipboard.writeText(result.url);
      setStatus('copied');
    } catch {
      // Copying needs permission in some browsers. A field then shows the link to copy by hand.
      // The link stays out of the address bar: a reload would open it over later changes.
      setManualLink(result.url);
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
      {manualLink !== null && (
        <input
          type="text"
          readOnly
          value={manualLink}
          aria-label={t('link')}
          onFocus={(event) => event.currentTarget.select()}
          className="w-full min-w-0 border-2 border-ink bg-cell px-2 py-1 font-mono text-sm"
        />
      )}
    </div>
  );
}
