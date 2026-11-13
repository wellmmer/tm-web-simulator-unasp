'use client';

import { describeStep } from '../describe';
import { useSimulator } from './store-context';
import { useSimText } from './use-sim-text';

/**
 * The sentence under the tape that explains the last step (spec 5.1). Below 768 px a sentence takes
 * one line or two, so the sentence keeps room for two: what is under it does not jump at each step.
 */
export function StepSentence() {
  const machine = useSimulator((s) => s.machine);
  const event = useSimulator((s) => s.event);
  const canRun = useSimulator((s) => s.run !== null);
  const { rich } = useSimText();
  if (!canRun) return null;
  return (
    <p data-testid="step-sentence" data-tour="sentence" className="mx-auto mt-3.5 min-h-[2lh] max-w-[60ch] md:min-h-7 text-center font-display text-xl/snug">
      {rich(describeStep(machine, event))}
    </p>
  );
}
