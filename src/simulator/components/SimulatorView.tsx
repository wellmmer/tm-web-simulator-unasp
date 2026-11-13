'use client';

import { TourPanel } from '@/tour/TourPanel';
import { TourPrompt } from '@/tour/TourPrompt';
import { Controls } from './Controls';
import { DiagramPanel } from './DiagramPanel';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { LiveRegion } from './LiveRegion';
import { MachineFile } from './MachineFile';
import { MachineHeader } from './MachineHeader';
import { Notices } from './Notices';
import { ResultLine } from './ResultLine';
import { RulesPanel } from './RulesPanel';
import { StepSentence } from './StepSentence';
import { EditTapeButton } from './TapeEditor';
import { TapeStage } from './TapeStage';

/**
 * The simulator page layout from the approved mockup (simulator-v4.html): the rule table and the
 * state diagram side by side. The first-visit prompt sits on top, and the tour opens over the page.
 */
export function SimulatorView() {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-7">
      <TourPrompt />
      <MachineHeader />
      <TapeStage />
      <StepSentence />
      <Notices />
      <Controls />
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <EditTapeButton />
        <KeyboardShortcuts />
      </div>
      <ResultLine />
      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <RulesPanel />
        <DiagramPanel />
      </div>
      <MachineFile />
      <LiveRegion />
      <TourPanel />
    </main>
  );
}
