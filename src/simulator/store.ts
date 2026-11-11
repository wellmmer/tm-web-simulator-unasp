import { createStore } from 'zustand/vanilla';
import {
  compileMachine,
  createRun,
  DEFAULT_STEP_LIMIT,
  step,
  stepBack,
  type CompileResult,
  type LegacyWarning,
  type Machine,
  type Run,
} from '@/engines/turing';
import { machineFromHash } from '@/share/share-link';
import type { MachineStorage } from '@/storage/machine-storage';
import { createAnnouncer } from './announcer';
import { describeResult, describeStep, type LastStep, type SimMessage, type StepEvent } from './describe';
import { DEFAULT_EXAMPLE_ID, examples, findExampleId, type ExampleId } from './examples';
import { DEFAULT_SPEED, faster, slower, SPEEDS, type SpeedLevel } from './speed';

/** idle: not running. running: the run loop is stepping. limit: paused at the step limit. */
export type LoopStatus = 'idle' | 'running' | 'limit';

export interface SimulatorState {
  machine: Machine;
  /** The example the machine came from, or null for any other machine. */
  exampleId: ExampleId | null;
  compile: CompileResult;
  /** Warnings from a 2016 import, shown with the compile warnings. */
  importWarnings: LegacyWarning[];
  /** Null when the machine has compile issues. */
  run: Run | null;
  /** Goes up after every change to `run`. The engine changes a Run in place, so React needs this to re-render. */
  version: number;
  /** What the step sentence describes. */
  event: StepEvent;
  speed: SpeedLevel;
  loop: LoopStatus;
  /** True after the first move off the left edge of a one-sided tape, until dismissed (spec 5.2). */
  leftEdgeNote: boolean;
  /** True when the browser will not keep the machine after the tab closes. */
  storageBlocked: boolean;
  /** True when the page opened with a share link that holds no machine. */
  badLink: boolean;
  /** What the live region says. `id` changes every time, so the same text is spoken again. */
  announcement: { messages: SimMessage[]; id: number } | null;

  boot(hash: string): void;
  loadExample(id: ExampleId): void;
  loadMachine(machine: Machine, importWarnings?: LegacyWarning[]): void;
  setInput(input: string): void;
  stepForward(): void;
  stepBack(): void;
  reset(): void;
  /** Run, or pause while running. Run on a halted machine starts again from the input. */
  toggleRun(): void;
  /** After the step limit: run the next `stepLimit` steps. */
  continueRun(): void;
  pause(): void;
  setSpeed(speed: SpeedLevel): void;
  faster(): void;
  slower(): void;
  dismissLeftEdgeNote(): void;
}

export interface StoreOptions {
  storage: MachineStorage;
  /** Steps per Run press before the loop pauses (spec 5.2). */
  stepLimit?: number;
}

/** The index of the rule the last step applied, for the highlighted row; null before the first step. */
export function currentRuleIndex(state: Pick<SimulatorState, 'run'>): number | null {
  return state.run?.history.at(-1)?.ruleIndex ?? null;
}

function machineState(machine: Machine, importWarnings: LegacyWarning[]) {
  const compile = compileMachine(machine);
  const run = compile.ok ? createRun(compile.compiled, machine.input) : null;
  const event: StepEvent = { kind: 'ready', state: machine.start, cell: 0 };
  return { machine, exampleId: findExampleId(machine), compile, importWarnings, run, event, leftEdgeNote: false };
}

export function createSimulatorStore({ storage, stepLimit = DEFAULT_STEP_LIMIT }: StoreOptions) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let stepsThisPress = 0;
  let announcementId = 0;
  const announcer = createAnnouncer();
  const initial = examples[DEFAULT_EXAMPLE_ID];

  const store = createStore<SimulatorState>()((set, get) => {
    const stopTimer = () => {
      if (timer !== null) clearTimeout(timer);
      timer = null;
    };

    /** Runs one step and returns it, or null when the run has halted. Does not call set(). */
    const applyStep = (run: Run): LastStep | null => {
      const from = run.state;
      const read = run.tape.read(run.head);
      const outcome = step(run);
      return outcome === null ? null : { from, read, outcome };
    };

    /** The live region text for a step: the step sentence, plus the result once the machine stops. */
    const announce = (event: StepEvent, run: Run, throttle: boolean, atLimit: boolean) => {
      const result = describeResult(run, atLimit, stepLimit);
      const final = result !== null;
      if (!announcer.shouldAnnounce(throttle && !final)) return {};
      const messages = [describeStep(get().machine, event), ...(final ? [result] : [])];
      announcementId += 1;
      return { announcement: { messages, id: announcementId } };
    };

    /** Shows the left-edge note on the first move off cell 0 with Sipser's rule, once per browser. */
    const leftEdgeNoteAfter = (last: LastStep): boolean => {
      const { machine, leftEdgeNote } = get();
      if (!last.outcome.hitLeftEdge || (machine.leftEdge ?? 'stay') !== 'stay' || storage.hasSeen('left-edge')) {
        return leftEdgeNote;
      }
      storage.markSeen('left-edge');
      return true;
    };

    const tick = () => {
      timer = null;
      const { run, speed } = get();
      if (run === null) return;
      let last: LastStep | null = null;
      let leftEdgeNote = get().leftEdgeNote;
      for (let i = 0; i < SPEEDS[speed].stepsPerTick && run.status === 'running' && stepsThisPress < stepLimit; i++) {
        last = applyStep(run);
        if (last === null) break;
        stepsThisPress += 1;
        if (last.outcome.hitLeftEdge) leftEdgeNote = leftEdgeNoteAfter(last);
      }
      const atLimit = run.status === 'running' && stepsThisPress >= stepLimit;
      const loop: LoopStatus = run.status !== 'running' ? 'idle' : atLimit ? 'limit' : 'running';
      const event: StepEvent = last === null ? get().event : { kind: 'step', last };
      set((state) => ({
        version: state.version + 1,
        event,
        loop,
        leftEdgeNote,
        ...announce(event, run, loop === 'running', atLimit),
      }));
      if (loop === 'running') timer = setTimeout(tick, SPEEDS[get().speed].delayMs);
    };

    const startLoop = () => {
      stopTimer();
      stepsThisPress = 0;
      set({ loop: 'running' });
      tick();
    };

    return {
      ...machineState(initial.machine, initial.warnings),
      version: 0,
      speed: DEFAULT_SPEED,
      loop: 'idle',
      storageBlocked: false,
      badLink: false,
      announcement: null,

      boot(hash) {
        const fromLink = machineFromHash(hash);
        set({ storageBlocked: !storage.persistent, badLink: fromLink.kind === 'bad' });
        const machine = fromLink.kind === 'machine' ? fromLink.machine : storage.loadMachine();
        if (machine !== null) get().loadMachine(machine);
      },

      loadExample(id) {
        get().loadMachine(examples[id].machine, examples[id].warnings);
      },

      loadMachine(machine, importWarnings) {
        get().pause();
        const next = machineState(machine, importWarnings ?? []);
        const exampleWarnings = next.exampleId === null ? [] : examples[next.exampleId].warnings;
        set((state) => ({ ...next, importWarnings: importWarnings ?? exampleWarnings, version: state.version + 1 }));
      },

      setInput(input) {
        get().pause();
        const machine = { ...get().machine, input };
        const { compile } = get();
        set((state) => ({
          machine,
          run: compile.ok ? createRun(compile.compiled, input) : null,
          event: { kind: 'ready', state: machine.start, cell: 0 },
          version: state.version + 1,
        }));
      },

      stepForward() {
        get().pause();
        const { run } = get();
        if (run === null) return;
        const last = applyStep(run);
        if (last === null) return;
        const event: StepEvent = { kind: 'step', last };
        set((state) => ({
          version: state.version + 1,
          event,
          leftEdgeNote: leftEdgeNoteAfter(last),
          ...announce(event, run, false, false),
        }));
      },

      stepBack() {
        get().pause();
        const { run } = get();
        if (run === null || !stepBack(run)) return;
        const event: StepEvent = { kind: 'back', state: run.state, cell: run.head };
        set((state) => ({ version: state.version + 1, event, ...announce(event, run, false, false) }));
      },

      reset() {
        get().pause();
        const { compile, machine } = get();
        set((state) => ({
          run: compile.ok ? createRun(compile.compiled, machine.input) : null,
          event: { kind: 'ready', state: machine.start, cell: 0 },
          version: state.version + 1,
        }));
      },

      toggleRun() {
        if (get().loop === 'running') {
          get().pause();
          return;
        }
        const { run } = get();
        if (run === null) return;
        if (run.status !== 'running') get().reset();
        startLoop();
      },

      continueRun() {
        if (get().loop === 'limit') startLoop();
      },

      pause() {
        stopTimer();
        if (get().loop !== 'idle') set({ loop: 'idle' });
      },

      setSpeed(speed) {
        set({ speed });
      },

      faster() {
        set((state) => ({ speed: faster(state.speed) }));
      },

      slower() {
        set((state) => ({ speed: slower(state.speed) }));
      },

      dismissLeftEdgeNote() {
        set({ leftEdgeNote: false });
      },
    };
  });

  // Save after every change to the machine (spec 5.6).
  store.subscribe((state, previous) => {
    if (state.machine === previous.machine) return;
    storage.saveMachine(state.machine);
    if (!storage.persistent && !state.storageBlocked) store.setState({ storageBlocked: true });
  });

  return store;
}

export type SimulatorStore = ReturnType<typeof createSimulatorStore>;
