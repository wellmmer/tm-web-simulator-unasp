'use client';

import { Copy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import type { SupportHandles } from '@/config/support';
import { pixCode } from './pix';
import { PixQr } from './PixQr';

type CopyStatus = 'copied' | 'copyFailed';

/**
 * Pix (spec 7): the QR code and the copy-paste code. `amount` is in reais, and `amountLabel` is the
 * same amount as the page writes it. With no amount (US dollars, or a wrong "Other" amount), the
 * code holds none, and the donor types it in the bank app.
 */
export function PixPanel({ pix, amount, amountLabel }: { pix: SupportHandles['pix']; amount: number | null; amountLabel: string }) {
  const t = useTranslations('support');
  const [status, setStatus] = useState<CopyStatus | null>(null);
  const code = pixCode(pix, amount ?? undefined);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setStatus('copied');
    } catch {
      setStatus('copyFailed');
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <PixQr code={code} label={t('pixQr')} />
      <div className="min-w-0 flex-1 space-y-2 text-sm">
        <p>{amount === null ? t('pixHint') : t('pixHintAmount', { amount: amountLabel })}</p>
        <p className="break-all text-muted">{t('pixKey', { key: pix.key })}</p>
        <label className="block">
          <span className="sr-only">{t('pixCode')}</span>
          <input
            readOnly
            value={code}
            onFocus={(event) => event.target.select()}
            className="w-full border-2 border-ink bg-cell px-2 py-1.5 font-mono text-xs text-ink"
          />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={copy} className="inline-flex items-center gap-2 border-2 border-ink bg-cell px-3 py-1.5 font-semibold text-ink">
            <Copy aria-hidden className="size-4" />
            {t('copyPix')}
          </button>
          <span role="status" className="text-muted">
            {status !== null && t(status)}
          </span>
        </div>
      </div>
    </div>
  );
}
