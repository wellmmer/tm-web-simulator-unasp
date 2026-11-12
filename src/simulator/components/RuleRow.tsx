'use client';

import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { isTuringRule, type Move, type ReadMatcher, type Rule } from '@/engines/turing';
import { opsText, parseOps, type RuleField, type RuleProblem } from '../rule-edit';
import { DraftInput, FieldHintText, fieldClass, plainTextProps } from './fields';

const MOVES: Move[] = ['L', 'R', 'S'];
type ReadKind = 'symbol' | ReadMatcher['match'];

interface RuleRowProps {
  rule: Rule;
  index: number;
  /** True when the table shows Turing's operations column instead of write and move. */
  turing: boolean;
  problem: RuleProblem | undefined;
  /** True when the last step applied this rule. */
  current: boolean;
  /** Fraktur state letters are drawn larger. */
  stateClass: string;
  onChange: (rule: Rule) => void;
  onDelete: () => void;
}

const td = 'border-b border-soft px-1 py-1 align-top sm:px-1.5';

/** One editable rule (spec 5.1). A field with a mistake is marked, with a short hint under it (spec 8). */
export function RuleRow({ rule, index, turing, problem, current, stateClass, onChange, onDelete }: RuleRowProps) {
  const t = useTranslations('simulator.table');
  const number = index + 1;
  const duplicateId = `rule-${number}-duplicate`;
  const hintId = (field: string) => `rule-${number}-${field}-hint`;

  const duplicate = problem?.duplicate ?? null;
  // The duplicate-rule message sits under the later of the two rows.
  const duplicateMessage = duplicate !== null && !duplicate.isFirst;

  /** The props that name a field, mark it, and link it to its hint and to the duplicate-rule message. */
  const fieldProps = (field: RuleField | 'move', column: string, extraClass = '') => {
    const hint = field === 'move' ? undefined : problem?.fields[field];
    const invalid = hint !== undefined || (duplicate !== null && field !== 'move');
    const describedBy = [hint === undefined ? '' : hintId(field), duplicateMessage ? duplicateId : ''].filter(Boolean).join(' ');
    return {
      'aria-label': t('cell', { rule: number, column }),
      'aria-invalid': invalid ? true : undefined,
      'aria-describedby': describedBy === '' ? undefined : describedBy,
      className: `${fieldClass(invalid)} ${extraClass}`,
    };
  };
  const hint = (field: RuleField) => {
    const key = problem?.fields[field];
    return key === undefined ? null : <FieldHintText id={hintId(field)} text={t(`fieldHint.${key}`)} />;
  };

  const readKind: ReadKind = typeof rule.read === 'string' ? 'symbol' : rule.read.match;
  const setRead = (read: Rule['read']) => onChange(isTuringRule(rule) ? { ...rule, read } : { ...rule, read: typeof read === 'string' ? read : '' });
  const columns = turing ? 5 : 6;
  const marked = current || duplicate !== null;

  return (
    <>
      <tr data-rule={number} aria-current={current ? 'true' : undefined} className={marked ? 'bg-row-now' : undefined}>
        <td className={`${td} ${marked ? 'shadow-[inset_4px_0_0_var(--pencil)]' : ''}`}>
          <input
            {...fieldProps('state', t('state'), stateClass)}
            {...plainTextProps}
            value={rule.state}
            onChange={(event) => onChange({ ...rule, state: event.target.value })}
          />
          {hint('state')}
        </td>
        <td className={td}>
          {turing ? (
            <div className="flex gap-1">
              <select
                {...fieldProps('read', t('read'))}
                value={readKind}
                onChange={(event) => {
                  const kind = event.target.value;
                  setRead(kind === 'any' || kind === 'blank' ? { match: kind } : '');
                }}
              >
                <option value="symbol">{t('symbol')}</option>
                <option value="any">{t('any')}</option>
                <option value="blank">{t('blank')}</option>
              </select>
              {typeof rule.read === 'string' && (
                <input
                  {...fieldProps('read', t('read'))}
                  {...plainTextProps}
                  aria-label={t('readSymbol', { rule: number })}
                  value={rule.read}
                  onChange={(event) => setRead(event.target.value)}
                />
              )}
            </div>
          ) : (
            <input {...fieldProps('read', t('read'))} {...plainTextProps} value={typeof rule.read === 'string' ? rule.read : ''} onChange={(event) => setRead(event.target.value)} />
          )}
          {hint('read')}
        </td>
        {turing ? (
          <td className={td}>
            <DraftInput
              {...fieldProps('ops', t('ops'))}
              {...plainTextProps}
              value={opsText(rule)}
              onText={(text) => onChange({ state: rule.state, read: rule.read, ops: parseOps(text), next: rule.next })}
            />
            {hint('ops')}
          </td>
        ) : (
          !isTuringRule(rule) && (
            <>
              <td className={td}>
                <input {...fieldProps('write', t('write'))} {...plainTextProps} value={rule.write} onChange={(event) => onChange({ ...rule, write: event.target.value })} />
                {hint('write')}
              </td>
              <td className={td}>
                {/* 48 px shows the letter next to the arrow. A narrower field puts the arrow over the letter. */}
                <select
                  {...fieldProps('move', t('move'), 'min-w-12')}
                  value={rule.move}
                  onChange={(event) => onChange({ ...rule, move: MOVES.find((move) => move === event.target.value) ?? rule.move })}
                >
                  {MOVES.map((move) => (
                    <option key={move} value={move}>
                      {move}
                    </option>
                  ))}
                </select>
              </td>
            </>
          )
        )}
        <td className={td}>
          <input {...fieldProps('next', t('next'), stateClass)} {...plainTextProps} value={rule.next} onChange={(event) => onChange({ ...rule, next: event.target.value })} />
          {hint('next')}
        </td>
        <td className={`${td} w-9 text-center`}>
          <button type="button" onClick={onDelete} aria-label={t('delete', { rule: number })} className="p-1.5 text-muted hover:text-pencil">
            <Trash2 aria-hidden className="size-4" />
          </button>
        </td>
      </tr>
      {duplicate !== null && !duplicate.isFirst && (
        <tr className="bg-row-now">
          <td colSpan={columns} className="border-b border-soft px-3 py-1.5 font-sans text-sm font-semibold text-pencil" id={duplicateId}>
            {t('duplicate', { state: duplicate.state, symbol: duplicate.symbol })}
          </td>
        </tr>
      )}
    </>
  );
}
