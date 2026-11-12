'use client';

import { Keyboard, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import type { SimulatorState } from '../store';
import { Kbd } from './Controls';
import { useSimulatorStore } from './store-context';

type Action = 'toggleRun' | 'stepForward' | 'stepBack' | 'reset' | 'faster' | 'slower' | 'startTapeEdit' | 'help';

/** Spec 5.4. */
const KEYS: Record<string, Action> = {
  ' ': 'toggleRun',
  ArrowRight: 'stepForward',
  ArrowLeft: 'stepBack',
  r: 'reset',
  R: 'reset',
  '+': 'faster',
  '-': 'slower',
  e: 'startTapeEdit',
  E: 'startTapeEdit',
  '?': 'help',
};

/** The list in the dialog: the key as shown, and the message key of what it does. */
const LIST = [
  ['Space', 'toggleRun'],
  ['→', 'stepForward'],
  ['←', 'stepBack'],
  ['R', 'reset'],
  ['+', 'faster'],
  ['-', 'slower'],
  ['E', 'startTapeEdit'],
  ['?', 'help'],
] as const;

/** Holding these keys must not repeat them: a held Space would run and pause many times a second. */
const NO_REPEAT: ReadonlySet<Action> = new Set(['toggleRun', 'reset', 'startTapeEdit', 'help']);

/** True for fields where keys type text or change a value: shortcuts stay off there. */
function isField(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || target.matches('input, textarea, select'));
}

/** True for controls that Space already presses, so Space must not also run the machine. */
function isPressable(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.matches('button, a[href], summary');
}

function runAction(state: SimulatorState, action: Exclude<Action, 'help'>) {
  state[action]();
}

/** The keyboard shortcuts, the "?" dialog that lists them, and a button that opens it. */
export function KeyboardShortcuts() {
  const t = useTranslations('simulator.shortcuts');
  const store = useSimulatorStore();
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.defaultPrevented) return;
      if (dialog.current?.open || isField(event.target)) return;
      const action = KEYS[event.key];
      if (action === undefined || (event.key === ' ' && isPressable(event.target))) return;
      event.preventDefault();
      if (event.repeat && NO_REPEAT.has(action)) return;
      if (action === 'help') dialog.current?.showModal();
      else runAction(store.getState(), action);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [store]);

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        aria-keyshortcuts="?"
        className="inline-flex items-center gap-2 px-2 py-1 text-sm font-semibold text-muted underline underline-offset-4"
      >
        <Keyboard aria-hidden className="size-4" />
        {t('open')}
        <Kbd>?</Kbd>
      </button>
      <dialog
        ref={dialog}
        aria-labelledby="shortcuts-title"
        className="m-auto w-[min(26rem,calc(100vw-2rem))] border-2 border-ink bg-cell p-5 text-ink backdrop:bg-ink/50"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="shortcuts-title" className="font-display text-xl font-semibold">
            {t('title')}
          </h2>
          <button type="button" onClick={() => dialog.current?.close()} aria-label={t('close')} className="p-1">
            <X aria-hidden className="size-5" />
          </button>
        </div>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
          {LIST.map(([key, action]) => (
            <div key={action} className="contents">
              <dt>
                <kbd className="border border-ink px-1.5 font-mono text-sm">{key}</kbd>
              </dt>
              <dd>{t(action)}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-sm text-muted">{t('off')}</p>
      </dialog>
    </>
  );
}
