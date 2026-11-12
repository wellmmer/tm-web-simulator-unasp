'use client';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { DEFAULT_EXAMPLE_ID } from '../examples';
import { addRule, deleteRule, isTuringTable, ruleProblems, updateRule } from '../rule-edit';
import { currentRuleIndex } from '../store';
import { RuleRow } from './RuleRow';
import { useSimulator, useSimulatorStore } from './store-context';

/** Where focus goes after a rule is added or deleted, or an example opens, so it is never lost. */
type FocusTarget = { kind: 'field'; rule: number } | { kind: 'delete'; rule: number } | { kind: 'add' } | null;

const textButton = 'inline-flex items-center gap-1.5 py-1 text-sm font-semibold text-ink underline underline-offset-4';

/** The editable rule table (spec 5.1). Every edit goes through compileMachine in the store. */
export function RuleTable() {
  const t = useTranslations('simulator.table');
  const store = useSimulatorStore();
  const machine = useSimulator((s) => s.machine);
  const compile = useSimulator((s) => s.compile);
  const current = useSimulator(currentRuleIndex);
  useSimulator((s) => s.version);
  const tableRef = useRef<HTMLDivElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const [focusTarget, setFocusTarget] = useState<FocusTarget>(null);

  useEffect(() => {
    if (focusTarget === null) return;
    const row = (rule: number) => tableRef.current?.querySelector(`tr[data-rule="${rule + 1}"]`);
    if (focusTarget.kind === 'add') addRef.current?.focus();
    else if (focusTarget.kind === 'field') row(focusTarget.rule)?.querySelector<HTMLElement>('input, select')?.focus();
    else row(focusTarget.rule)?.querySelector<HTMLElement>('button')?.focus();
  }, [focusTarget]);

  const edit = store.getState().editMachine;
  const turing = isTuringTable(machine);
  const problems = compile.ok ? new Map() : ruleProblems(compile.issues);
  // Fraktur letters have a small x-height, so 1936 state names are drawn larger.
  const stateClass = machine.notation === 'turing1936' ? 'text-[1.3em]/none' : '';
  const th = 'bg-soft px-1 py-1.5 sm:px-2 text-left font-sans text-[13px] font-semibold text-muted';

  const add = () => {
    edit(addRule(machine));
    setFocusTarget({ kind: 'field', rule: machine.rules.length });
  };
  const remove = (index: number) => {
    edit(deleteRule(machine, index));
    const left = machine.rules.length - 1;
    setFocusTarget(left === 0 ? { kind: 'add' } : { kind: 'delete', rule: Math.min(index, left - 1) });
  };
  const openExample = () => {
    store.getState().loadExample(DEFAULT_EXAMPLE_ID);
    // The button goes away with the empty table, so focus moves to the first field of the example.
    setFocusTarget({ kind: 'field', rule: 0 });
  };

  if (machine.rules.length === 0) {
    return (
      <div className="flex flex-col items-start gap-2">
        <p>{t('empty')}</p>
        <div className="flex flex-wrap gap-4">
          <button ref={addRef} type="button" onClick={add} className={textButton}>
            <Plus aria-hidden className="size-4" />
            {t('addFirst')}
          </button>
          <button type="button" onClick={openExample} className={textButton}>
            {t('openExample')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={tableRef}>
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
              <th scope="col" className={th}>
                <span className="sr-only">{t('deleteColumn')}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {machine.rules.map((rule, index) => (
              <RuleRow
                key={index}
                rule={rule}
                index={index}
                turing={turing}
                problem={problems.get(index)}
                current={index === current}
                stateClass={stateClass}
                onChange={(changed) => edit(updateRule(machine, index, changed))}
                onDelete={() => remove(index)}
              />
            ))}
          </tbody>
        </table>
      </div>
      <button ref={addRef} type="button" onClick={add} className={`${textButton} mt-2.5`}>
        <Plus aria-hidden className="size-4" />
        {t('add')}
      </button>
    </div>
  );
}
