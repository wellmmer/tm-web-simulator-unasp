'use client';

import { Pause, Play } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { StepSentence } from '@/simulator/components/StepSentence';
import { SimulatorStoreProvider } from '@/simulator/components/store-context';
import { TapeStage } from '@/simulator/components/TapeStage';
import { useReducedMotion } from '@/simulator/components/use-reduced-motion';
import { createSimulatorStore } from '@/simulator/store';
import { createMemoryStorage } from '@/storage/machine-storage';

/**
 * With reduced motion, the tape shows the machine after this many steps: 0 1 0 1 0 1 printed, and
 * the head on cell 11, right after printing a 1. A phone shows two printed cells beside the head.
 */
export const STILL_STEPS = 11;

/** A store of its own that keeps nothing, so Home never replaces the machine the visitor saved in the simulator. */
function createHomeStore() {
  const store = createSimulatorStore({ storage: createMemoryStorage() });
  store.getState().loadExample('turing-1936');
  return store;
}

/**
 * Turing's 1936 first machine, running on the tape (spec 4.2). It is the one moving element on Home
 * (spec 6). With reduced motion it starts still, after STILL_STEPS steps. Pause and Play let the
 * visitor stop it, because it never halts (WCAG 2.2.2).
 */
export function HomeMachine() {
  const t = useTranslations('home');
  const reducedMotion = useReducedMotion();
  const [store] = useState(createHomeStore);
  // Null until the visitor presses Pause or Play. Until then, the machine runs unless motion is reduced.
  const [choice, setChoice] = useState<boolean | null>(null);
  const playing = choice ?? !reducedMotion;

  useEffect(() => {
    const state = store.getState();
    if (playing) {
      if (state.loop !== 'running') state.toggleRun();
      return () => store.getState().pause();
    }
    state.pause();
    // Still because of reduced motion, not because of Pause: show the machine after STILL_STEPS steps.
    // The page learns about reduced motion after hydration, when the machine may have made its first step.
    if (choice === null) {
      state.reset();
      for (let i = 0; i < STILL_STEPS; i++) state.stepForward();
    }
  }, [store, playing, choice]);

  return (
    <SimulatorStoreProvider store={store}>
      <TapeStage editable={false} />
      <StepSentence />
      <div className="mx-auto mt-3 flex max-w-[60ch] flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 text-center text-sm text-muted">
        <p>{t('caption')}</p>
        <button
          type="button"
          onClick={() => setChoice(!playing)}
          className="inline-flex items-center gap-1.5 border-2 border-ink bg-cell px-2.5 py-1 font-semibold text-ink"
        >
          {playing ? <Pause aria-hidden className="size-3.5" /> : <Play aria-hidden className="size-3.5" />}
          {playing ? t('pause') : t('play')}
        </button>
      </div>
    </SimulatorStoreProvider>
  );
}
