'use client';

import { Controls } from './Controls';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { LiveRegion } from './LiveRegion';
import { MachineHeader } from './MachineHeader';
import { Notices } from './Notices';
import { ResultLine } from './ResultLine';
import { RulesPanel } from './RulesPanel';
import { StepSentence } from './StepSentence';
import { TapeStage } from './TapeStage';

/** The simulator page layout from the approved mockup (simulator-v4.html). The state diagram comes in plan R1b-2. */
export function SimulatorView() {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-7">
      <MachineHeader />
      <TapeStage />
      <StepSentence />
      <Notices />
      <Controls />
      <div className="mt-2 flex justify-center">
        <KeyboardShortcuts />
      </div>
      <ResultLine />
      <div className="mt-6">
        <RulesPanel />
      </div>
      <LiveRegion />
    </main>
  );
}
