'use client';

import { useTranslations } from 'next-intl';
import { isTuringRule, type Rule } from '@/engines/turing';
import { currentRuleIndex } from '../store';
import { useSimulator } from './store-context';

/** A rule's operations as Turing wrote them: "P0, R". A modern rule becomes "P1, R". */
function opsText(rule: Rule): string {
  if (isTuringRule(rule)) return rule.ops.join(', ');
  return rule.move === 'S' ? `P${rule.write}` : `P${rule.write}, ${rule.move}`;
}

/** The read-only rule table (spec 5.1). The row the last step applied is marked in pencil red. */
export function RuleTable() {
  const t = useTranslations('simulator.table');
  const machine = useSimulator((s) => s.machine);
  const current = useSimulator(currentRuleIndex);
  useSimulator((s) => s.version);

  const turing = machine.rules.some(isTuringRule);
  // Fraktur letters have a small x-height, so 1936 state names are drawn larger.
  const stateText = machine.notation === 'turing1936' ? 'text-[1.3em]/none' : '';
  const readText = (read: Rule['read']) => (typeof read === 'string' ? read : t(read.match === 'any' ? 'any' : 'blank'));
  const th = 'bg-soft px-2 py-1.5 text-left text-[13px] font-semibold text-muted';
  const td = 'border-b border-soft px-2 py-1.5';

  return (
    <section aria-labelledby="rules-title" className="bg-cell px-4 pt-4 pb-5">
      <h2 id="rules-title" className="font-display text-xl font-semibold">
        {t('title')}
      </h2>
      <p className="mb-3 text-sm text-muted">{t('hint')}</p>
      {machine.rules.length === 0 ? (
        <p>{t('empty')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse font-mono text-[15px] font-medium">
            <thead>
              <tr>
                <th scope="col" className={th}>{t('state')}</th>
                <th scope="col" className={th}>{t('read')}</th>
                {turing ? (
                  <th scope="col" className={th}>{t('ops')}</th>
                ) : (
                  <>
                    <th scope="col" className={th}>{t('write')}</th>
                    <th scope="col" className={th}>{t('move')}</th>
                  </>
                )}
                <th scope="col" className={th}>{t('next')}</th>
              </tr>
            </thead>
            <tbody>
              {machine.rules.map((rule, index) => {
                const now = index === current;
                return (
                  <tr key={index} aria-current={now ? 'true' : undefined} className={now ? 'bg-row-now' : undefined}>
                    <td className={`${td} ${now ? 'shadow-[inset_4px_0_0_var(--pencil)]' : ''}`}>
                      <span className={stateText}>{rule.state}</span>
                    </td>
                    <td className={td}>{readText(rule.read)}</td>
                    {turing || isTuringRule(rule) ? (
                      <td className={td}>{opsText(rule)}</td>
                    ) : (
                      <>
                        <td className={td}>{rule.write}</td>
                        <td className={td}>{rule.move}</td>
                      </>
                    )}
                    <td className={td}>
                      <span className={stateText}>{rule.next}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
