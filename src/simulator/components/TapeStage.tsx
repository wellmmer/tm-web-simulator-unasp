'use client';

import { useTranslations } from 'next-intl';
import type { MouseEvent } from 'react';
import { Tape } from '@/engines/turing';
import { SPEEDS } from '../speed';
import { useSimulator, useSimulatorStore } from './store-context';
import { TapeEditor } from './TapeEditor';

/** The distance between two cell centres: 58px cells that overlap by their 2px border. */
const CELL_PX = 56;
/** Cells drawn on each side of the head. 15 fill a 1440px screen; a phone shows about 6. */
const CELLS_EACH_SIDE = 15;

/**
 * The tape on the stage, with the red pencil head and its state tag (spec 5.1). While the visitor
 * edits the tape (spec 5.4), the tape shows the input, the cursor sits in the middle, and the head is hidden.
 */
export function TapeStage() {
  const t = useTranslations('simulator.tape');
  const store = useSimulatorStore();
  const run = useSimulator((s) => s.run);
  const machine = useSimulator((s) => s.machine);
  const speed = useSimulator((s) => s.speed);
  const tapeEdit = useSimulator((s) => s.tapeEdit);
  // The engine changes the run in place; reading `version` re-renders this component after each step.
  useSimulator((s) => s.version);

  const tape = run?.tape ?? new Tape(machine.blank, machine.input);
  const head = run?.head ?? 0;
  const centre = tapeEdit?.cell ?? head;
  const first = machine.tape === 'one-sided' ? Math.max(0, centre - CELLS_EACH_SIDE) : centre - CELLS_EACH_SIDE;
  // Fraktur letters have a small x-height, so 1936 state names are drawn larger.
  const fraktur = machine.notation === 'turing1936';
  const cells = Array.from({ length: centre + CELLS_EACH_SIDE - first + 1 }, (_, i) => first + i);

  /** A click on a cell edits the tape there. The input starts on cell 0, so cells left of it do nothing. */
  const onClick = (event: MouseEvent<HTMLElement>) => {
    const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-cell]') : null;
    const cell = Number(target?.dataset.cell);
    if (Number.isInteger(cell) && cell >= 0) store.getState().startTapeEdit(cell);
  };

  return (
    <section aria-label={t('label')} onClick={onClick} className="relative mt-6 h-[170px] overflow-hidden">
      {tapeEdit !== null && <TapeEditor cell={tapeEdit.cell} />}
      {run !== null && tapeEdit === null && (
        <>
          <p className="sr-only">{t('summary', { cell: head, state: run.state, symbol: tape.read(head) })}</p>
          <div aria-hidden className="pointer-events-none absolute top-4 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center">
            <span
              data-testid="head-state"
              className={`bg-pencil px-2.5 py-0.5 font-mono font-semibold text-on-pencil ${fraktur ? 'text-xl/6' : 'text-[15px]/6'}`}
            >
              {run.state}
            </span>
            <span data-testid="head-ring" className="mt-1.5 size-[82px] rounded-full border-4 border-pencil" />
          </div>
        </>
      )}
      <ol
        aria-hidden
        data-testid="tape-strip"
        className="absolute top-[58px] left-1/2 transition-transform ease-[cubic-bezier(.2,.7,.2,1)] motion-reduce:transition-none"
        style={{ transform: `translateX(${-centre * CELL_PX - CELL_PX / 2}px)`, transitionDuration: `${SPEEDS[speed].slideMs}ms` }}
      >
        {cells.map((cell) => {
          const symbol = tape.read(cell);
          const cursor = tapeEdit?.cell === cell;
          return (
            <li key={cell} data-cell={cell} className="absolute flex w-[58px] cursor-text flex-col items-center" style={{ left: cell * CELL_PX }}>
              <span
                data-testid="cell-symbol"
                data-cursor={cursor || undefined}
                className={`grid size-[58px] place-items-center border-2 border-ink bg-cell font-mono text-[26px] font-bold ${
                  symbol === machine.blank ? 'text-blank-ink' : 'text-ink'
                } ${cursor ? 'relative z-10 outline-4 outline-offset-[-2px] outline-pencil outline-dashed' : ''}`}
              >
                {symbol}
              </span>
              <span data-testid="cell-number" className="mt-[18px] text-xs font-medium text-muted">
                {cell}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
