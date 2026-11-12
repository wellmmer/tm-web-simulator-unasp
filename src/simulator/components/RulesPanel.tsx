'use client';

import { useTranslations } from 'next-intl';
import { MachineMessages } from './MachineMessages';
import { MachineSettings } from './MachineSettings';
import { RuleTable } from './RuleTable';

/** The left panel of the bench: compile messages, the machine settings and the rule table. */
export function RulesPanel() {
  const t = useTranslations('simulator.table');
  return (
    <section aria-labelledby="rules-title" className="min-w-0 bg-cell px-4 pt-4 pb-5">
      <h2 id="rules-title" className="font-display text-xl font-semibold">
        {t('title')}
      </h2>
      <p className="mb-3 text-sm text-muted">{t('hint')}</p>
      <MachineMessages />
      <MachineSettings />
      <RuleTable />
    </section>
  );
}
