'use client';

import { useTranslations } from 'next-intl';
import { EXAMPLE_IDS } from '../examples';
import { ShareButton } from './ShareButton';
import { useSimulator } from './store-context';

const field = 'border-2 border-ink bg-cell px-2.5 py-1.5 font-medium text-ink';

/** The machine's name, the example picker, the input field and the share link (spec 5.1). */
export function MachineHeader() {
  const t = useTranslations('simulator.header');
  const tExamples = useTranslations('simulator.examples');
  const machine = useSimulator((s) => s.machine);
  const exampleId = useSimulator((s) => s.exampleId);
  const loadExample = useSimulator((s) => s.loadExample);
  const setInput = useSimulator((s) => s.setInput);

  return (
    <header className="flex flex-wrap items-end justify-between gap-5">
      <h1 className="font-display text-[34px]/none font-extrabold tracking-tight break-words">{machine.name}</h1>
      <div className="flex flex-wrap items-center gap-2.5">
        <label className="flex items-center gap-2">
          {t('example')}
          <select
            value={exampleId ?? ''}
            onChange={(event) => {
              const id = EXAMPLE_IDS.find((example) => example === event.target.value);
              if (id !== undefined) loadExample(id);
            }}
            className={field}
          >
            {exampleId === null && (
              <option value="" disabled>
                {t('yourMachine')}
              </option>
            )}
            {EXAMPLE_IDS.map((id) => (
              <option key={id} value={id}>
                {tExamples(id)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          {t('input')}
          <input
            value={machine.input}
            onChange={(event) => setInput(event.target.value)}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            className={`${field} w-32 font-mono`}
          />
        </label>
        <ShareButton />
      </div>
    </header>
  );
}
