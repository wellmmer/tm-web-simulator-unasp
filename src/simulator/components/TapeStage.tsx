'use client';

import { useTranslations } from 'next-intl';
import { Tape } from '@/engines/turing';
import { SPEEDS } from '../speed';
import { useSimulator } from './store-context';

/** The distance between two cell centres: 58px cells that overlap by their 2px border. */
const CELL_PX = 56;
/** Cells drawn on each side of the head. 15 fill a 1440px screen; a phone shows about 6. */
const CELLS_EACH_SIDE = 15;

/** The tape on the stage, with the red pencil head and its state tag (spec 5.1). */
export function TapeStage() {
  const t = useTranslations('simulator.tape');
  const run = useSimulator((s) => s.run);
  const machine = useSimulator((s) => s.machine);
  const speed = useSimulator((s) => s.speed);
  // The engine changes the run in place; reading `version` re-renders this component after each step.
  useSimulator((s) => s.version);

  const tape = run?.tape ?? new Tape(machine.blank, machine.input);
  const head = run?.head ?? 0;
  const first = machine.tape === 'one-sided' ? Math.max(0, head - CELLS_EACH_SIDE) : head - CELLS_EACH_SIDE;
  // Fraktur letters have a small x-height, so 1936 state names are drawn larger.
  const fraktur = machine.notation === 'turing1936';
  const cells = Array.from({ length: head + CELLS_EACH_SIDE - first + 1 }, (_, i) => first + i);

  return (
    <section aria-label={t('label')} className="relative mt-6 h-[170px] overflow-hidden">
      {run !== null && (
        <>
          <p className="sr-only">{t('summary', { cell: head, state: run.state, symbol: tape.read(head) })}</p>
          <div aria-hidden className="pointer-events-none absolute top-4 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center">
            <span
              data-testid="head-state"
              className={`bg-pencil px-2.5 py-0.5 font-mono font-semibold text-on-pencil ${fraktur ? 'text-xl/6' : 'text-[15px]/6'}`}
            >
              {run.state}
            </span>
            <span className="mt-1.5 size-[82px] rounded-full border-4 border-pencil" />
          </div>
        </>
      )}
      <ol
        aria-hidden
        data-testid="tape-strip"
        className="absolute top-[58px] left-1/2 transition-transform ease-[cubic-bezier(.2,.7,.2,1)] motion-reduce:transition-none"
        style={{ transform: `translateX(${-head * CELL_PX - CELL_PX / 2}px)`, transitionDuration: `${SPEEDS[speed].slideMs}ms` }}
      >
        {cells.map((cell) => {
          const symbol = tape.read(cell);
          return (
            <li key={cell} className="absolute flex w-[58px] flex-col items-center" style={{ left: cell * CELL_PX }}>
              <span
                data-testid="cell-symbol"
                className={`grid size-[58px] place-items-center border-2 border-ink bg-cell font-mono text-[26px] font-bold ${
                  symbol === machine.blank ? 'text-blank-ink' : 'text-ink'
                }`}
              >
                {symbol}
              </span>
              <span data-testid="cell-number" className="mt-1 text-xs font-medium text-muted">
                {cell}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
