'use client';

import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import type { Machine } from '@/engines/turing';
import { parseStateList } from '../rule-edit';
import { DraftInput, FieldHintText, fieldClass, plainTextProps } from './fields';
import { useSimulator } from './store-context';

interface SettingProps {
  label: string;
  /** The hint under the field when it has a mistake, or null. */
  hint: string | null;
  id: string;
  /** Extra words for screen readers, such as how to type a list. */
  note?: string;
  className?: string;
  children: (props: { id: string; 'aria-invalid'?: true; 'aria-describedby'?: string; className: string }) => ReactNode;
}

/** One labelled field. A mistake marks the field and shows the hint under it (spec 8). */
function Setting({ label, hint, id, note, className = '', children }: SettingProps) {
  const hintId = `${id}-hint`;
  const noteId = `${id}-note`;
  const describedBy = [hint === null ? '' : hintId, note === undefined ? '' : noteId].filter(Boolean).join(' ');
  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <label htmlFor={id} className="text-[13px] font-semibold text-muted">
        {label}
      </label>
      {children({
        id,
        'aria-invalid': hint === null ? undefined : true,
        'aria-describedby': describedBy === '' ? undefined : describedBy,
        className: fieldClass(hint !== null),
      })}
      {hint !== null && <FieldHintText id={hintId} text={hint} />}
      {note !== undefined && (
        <span id={noteId} className="sr-only">
          {note}
        </span>
      )}
    </div>
  );
}

/** The start, accept and reject states, the blank and the tape kind, above the rule table. */
export function MachineSettings() {
  const t = useTranslations('simulator.settings');
  const tHint = useTranslations('simulator.table.fieldHint');
  const machine = useSimulator((s) => s.machine);
  const compile = useSimulator((s) => s.compile);
  const editMachine = useSimulator((s) => s.editMachine);

  const issues = compile.ok ? [] : compile.issues;
  const has = (code: string) => issues.some((issue) => issue.code === code);
  const bothHint = has('accept-and-reject') ? t('acceptAndReject') : null;
  const edit = (change: Partial<Machine>) => editMachine({ ...machine, ...change });

  return (
    <fieldset className="mb-4 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-[repeat(3,minmax(0,1fr))_4.5rem_minmax(8rem,1fr)]">
      <legend className="sr-only">{t('legend')}</legend>
      <Setting label={t('start')} id="setting-start" hint={has('empty-start') ? tHint('emptyState') : null}>
        {(props) => <input {...props} {...plainTextProps} value={machine.start} onChange={(event) => edit({ start: event.target.value })} />}
      </Setting>
      <Setting label={t('accept')} id="setting-accept" hint={bothHint} note={t('listHint')}>
        {(props) => <DraftInput {...props} {...plainTextProps} value={machine.accept.join(', ')} onText={(text) => edit({ accept: parseStateList(text) })} />}
      </Setting>
      <Setting label={t('reject')} id="setting-reject" hint={bothHint} note={t('listHint')}>
        {(props) => <DraftInput {...props} {...plainTextProps} value={machine.reject.join(', ')} onText={(text) => edit({ reject: parseStateList(text) })} />}
      </Setting>
      <Setting label={t('blank')} id="setting-blank" hint={has('bad-blank') ? tHint('badSymbol') : null}>
        {(props) => <input {...props} {...plainTextProps} value={machine.blank} onChange={(event) => edit({ blank: event.target.value })} />}
      </Setting>
      <Setting label={t('tape')} id="setting-tape" hint={null}>
        {(props) => (
          <select {...props} className={`${props.className} font-sans`} value={machine.tape} onChange={(event) => edit({ tape: event.target.value === 'two-way' ? 'two-way' : 'one-sided' })}>
            <option value="one-sided">{t('oneSided')}</option>
            <option value="two-way">{t('twoWay')}</option>
          </select>
        )}
      </Setting>
      {machine.tape === 'one-sided' && machine.leftEdge === 'reject' && <p className="col-span-full text-sm text-muted">{t('leftEdgeReject')}</p>}
    </fieldset>
  );
}
