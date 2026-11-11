'use client';

import { useTranslations } from 'next-intl';
import { describeResult } from '../describe';
import { useSimulator } from './store-context';
import { useSimText } from './use-sim-text';

/** "Accepted after 8 steps. The tape now reads 1100." Empty while the machine can still run. */
export function ResultLine() {
  const t = useTranslations('simulator.controls');
  const run = useSimulator((s) => s.run);
  const loop = useSimulator((s) => s.loop);
  const continueRun = useSimulator((s) => s.continueRun);
  useSimulator((s) => s.version);
  const { plain } = useSimText();

  const result = run === null ? null : describeResult(run, loop === 'limit');
  if (result === null || run === null) return null;
  const tone =
    run.status === 'accepted'
      ? 'bg-ink text-paper'
      : run.status === 'rejected'
        ? 'border-2 border-pencil bg-cell text-pencil'
        : 'border-2 border-ink bg-cell text-ink';

  return (
    <div className={`mx-auto mt-4 flex max-w-[640px] flex-wrap items-center justify-center gap-3 px-4 py-3 text-center font-semibold ${tone}`}>
      <p data-testid="result-line">{plain(result)}</p>
      {loop === 'limit' && (
        <button type="button" onClick={continueRun} className="border-2 border-ink bg-ink px-3 py-1 text-paper">
          {t('continue')}
        </button>
      )}
    </div>
  );
}
