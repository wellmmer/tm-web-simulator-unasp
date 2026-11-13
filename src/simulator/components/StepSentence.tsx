'use client';

import { describeIssue, describeStep } from '../describe';
import { useSimulator } from './store-context';
import { useSimText } from './use-sim-text';

/** One line on a wide screen, two below 768 px, so what is under the sentence does not jump at each step. */
const SENTENCE_CLASS = 'mx-auto mt-3.5 min-h-[2lh] max-w-[60ch] md:min-h-7 text-center font-display text-xl/snug';

/**
 * The sentence under the tape that explains the last step (spec 5.1). When the machine cannot run,
 * it says why (spec 8): the buttons are grey, and the list of problems above the rule table is far
 * below on a phone.
 */
export function StepSentence() {
  const machine = useSimulator((s) => s.machine);
  const event = useSimulator((s) => s.event);
  const compile = useSimulator((s) => s.compile);
  const canRun = useSimulator((s) => s.run !== null);
  const { plain, rich } = useSimText();
  if (!canRun) {
    if (compile.ok || compile.issues.length === 0) return null;
    return (
      <p data-testid="step-sentence" className={`${SENTENCE_CLASS} text-pencil`}>
        {plain(describeIssue(compile.issues[0]))}
      </p>
    );
  }
  return (
    <p data-testid="step-sentence" data-tour="sentence" className={SENTENCE_CLASS}>
      {rich(describeStep(machine, event))}
    </p>
  );
}
