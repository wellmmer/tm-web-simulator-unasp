import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { machine } from '@/engines/turing/test-helpers';
import { shareUrl } from '@/share/share-link';
import { createMemoryStorage, type MachineStorage } from '@/storage/machine-storage';
import { describeStep } from './describe';
import { examples } from './examples';
import { updateRule } from './rule-edit';
import { createSimulatorStore, currentRuleIndex } from './store';

let storage: MachineStorage;

beforeEach(() => {
  vi.useFakeTimers();
  storage = createMemoryStorage();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('the simulator store', () => {
  it('starts with Binary +1, ready on cell 0', () => {
    const store = createSimulatorStore({ storage });
    const state = store.getState();
    expect(state.machine.name).toBe('Binary +1');
    expect(state.exampleId).toBe('binary-plus-one');
    expect(state.event).toEqual({ kind: 'ready', state: 'q0', cell: 0 });
    expect(state.loop).toBe('idle');
    expect(state.version).toBe(0);
  });

  it('bumps the version on every step, because the engine changes the run in place', () => {
    const store = createSimulatorStore({ storage });
    const run = store.getState().run;
    store.getState().stepForward();
    expect(store.getState().run).toBe(run);
    expect(store.getState().version).toBe(1);
    expect(currentRuleIndex(store.getState())).toBe(1);
  });

  it('accepts Binary +1 after 8 steps and announces the step and the result', () => {
    const store = createSimulatorStore({ storage });
    for (let i = 0; i < 8; i++) store.getState().stepForward();
    const state = store.getState();
    expect(state.run?.status).toBe('accepted');
    expect(state.announcement?.messages.map((m) => m.key)).toEqual(['step.write', 'result.accepted']);
  });

  it('steps back to the previous rule', () => {
    const store = createSimulatorStore({ storage });
    store.getState().stepForward();
    store.getState().stepForward();
    store.getState().stepBack();
    const state = store.getState();
    expect(state.event).toEqual({ kind: 'back', state: 'q0', cell: 1 });
    expect(currentRuleIndex(state)).toBe(1);
    expect(state.version).toBe(3);
  });

  it('runs one step every 700 ms at the default speed and stops when the machine halts', () => {
    const store = createSimulatorStore({ storage });
    store.getState().toggleRun();
    expect(store.getState().run?.steps).toBe(1);
    vi.advanceTimersByTime(700 * 7);
    expect(store.getState().run?.status).toBe('accepted');
    expect(store.getState().loop).toBe('idle');
  });

  it('uses a new speed for the next step at once, without waiting out the old delay', () => {
    const store = createSimulatorStore({ storage });
    store.getState().setSpeed(1);
    store.getState().toggleRun();
    vi.advanceTimersByTime(100);
    store.getState().faster();
    store.getState().setSpeed(4);
    vi.advanceTimersByTime(150);
    expect(store.getState().run?.steps).toBe(2);
    store.getState().slower();
    vi.advanceTimersByTime(699);
    expect(store.getState().run?.steps).toBe(2);
    vi.advanceTimersByTime(1);
    expect(store.getState().run?.steps).toBe(3);
    store.getState().pause();
  });

  it('pauses and resumes with the same action', () => {
    const store = createSimulatorStore({ storage });
    store.getState().toggleRun();
    store.getState().toggleRun();
    vi.advanceTimersByTime(5000);
    expect(store.getState()).toMatchObject({ loop: 'idle', run: { steps: 1 } });
  });

  it('starts again from the input when Run is pressed after the machine halted', () => {
    const store = createSimulatorStore({ storage });
    for (let i = 0; i < 8; i++) store.getState().stepForward();
    store.getState().toggleRun();
    expect(store.getState().run?.steps).toBe(1);
  });

  it('pauses after 10,000 steps per Run press, and Continue runs 10,000 more', () => {
    const store = createSimulatorStore({ storage });
    store.getState().loadExample('turing-1936');
    store.getState().setSpeed(5);
    store.getState().toggleRun();
    vi.advanceTimersByTime(10_000);
    expect(store.getState()).toMatchObject({ loop: 'limit', run: { steps: 10_000, status: 'running' } });
    expect(store.getState().announcement?.messages.at(-1)?.key).toBe('result.limit');
    store.getState().continueRun();
    vi.advanceTimersByTime(10_000);
    expect(store.getState()).toMatchObject({ loop: 'limit', run: { steps: 20_000 } });
  });

  it('announces at most once per second while running, and always the final result', () => {
    const store = createSimulatorStore({ storage });
    store.getState().setSpeed(4);
    const ids = new Set<number>();
    store.subscribe((state) => {
      if (state.announcement !== null) ids.add(state.announcement.id);
    });
    // 1111111111 + 1 takes 22 steps: about 3.2 seconds at 150 ms per step.
    store.getState().setInput('1'.repeat(10));
    store.getState().toggleRun();
    vi.advanceTimersByTime(150 * 25);
    expect(store.getState().run?.status).toBe('accepted');
    // Spoken at 0 s, 1.05 s and 2.1 s while running, then the result at 3.15 s: 4 times for 22 steps.
    expect(ids.size).toBe(4);
    expect(store.getState().announcement?.messages.at(-1)?.key).toBe('result.accepted');
  });

  it('announces the current step at once after Pause, even inside the one-second gap', () => {
    const store = createSimulatorStore({ storage });
    store.getState().setSpeed(4);
    store.getState().toggleRun();
    vi.advanceTimersByTime(150);
    const before = store.getState().announcement;
    // Step 1 read 1 and was spoken; step 2 read 0 and was held back by the one-second gap.
    expect(store.getState().run?.steps).toBe(2);
    store.getState().toggleRun();
    const { announcement, machine: current, event } = store.getState();
    expect(announcement?.id).not.toBe(before?.id);
    expect(announcement?.messages).toEqual([describeStep(current, event)]);
    expect(announcement?.messages).not.toEqual(before?.messages);
  });

  it('shows the left-edge note the first time only, in this browser', () => {
    const edge = machine([{ state: 'q0', read: '_', write: '_', move: 'L', next: 'q0' }]);
    const first = createSimulatorStore({ storage });
    first.getState().loadMachine(edge);
    first.getState().stepForward();
    expect(first.getState().leftEdgeNote).toBe(true);
    first.getState().dismissLeftEdgeNote();
    expect(first.getState().leftEdgeNote).toBe(false);

    const second = createSimulatorStore({ storage });
    second.getState().loadMachine(edge);
    second.getState().stepForward();
    expect(second.getState().leftEdgeNote).toBe(false);
  });

  it('saves the machine after every change', () => {
    const store = createSimulatorStore({ storage });
    store.getState().loadExample('palindrome');
    store.getState().setInput('101');
    expect(storage.loadMachine()).toEqual({ ...examples.palindrome.machine, input: '101' });
    expect(store.getState().exampleId).toBe('palindrome');
    expect(store.getState().run?.tape.toString()).toBe('101');
  });

  it('opens the machine from a share link before the saved machine', () => {
    storage.saveMachine(examples.palindrome.machine);
    const link = shareUrl('https://x.example/en/simulator', examples['turing-1936'].machine);
    if (!link.ok) throw new Error('expected a link');
    const store = createSimulatorStore({ storage });
    store.getState().boot(new URL(link.url).hash);
    expect(store.getState().exampleId).toBe('turing-1936');
  });

  it('opens the saved machine when the link is bad, and says so', () => {
    storage.saveMachine(examples.palindrome.machine);
    const store = createSimulatorStore({ storage });
    store.getState().boot('#m=broken');
    expect(store.getState()).toMatchObject({ exampleId: 'palindrome', badLink: true });
  });

  it('keeps the bad-link note when boot runs again without a hash, as in a second effect run', () => {
    const store = createSimulatorStore({ storage });
    store.getState().boot('#m=broken');
    store.getState().boot('');
    expect(store.getState().badLink).toBe(true);
  });

  it('opens a share link in a tab that is already open, and ignores a hash without a link', () => {
    const store = createSimulatorStore({ storage });
    store.getState().boot('');
    store.getState().openLink('#rules');
    expect(store.getState().exampleId).toBe('binary-plus-one');
    const link = shareUrl('https://x.example/en/simulator', examples.palindrome.machine);
    if (!link.ok) throw new Error('expected a link');
    store.getState().openLink(new URL(link.url).hash);
    expect(store.getState()).toMatchObject({ exampleId: 'palindrome', badLink: false });
    store.getState().openLink('#m=broken');
    expect(store.getState()).toMatchObject({ exampleId: 'palindrome', badLink: true });
  });

  it('keeps the bad-link note when boot opens the saved machine instead', () => {
    storage.saveMachine(examples.palindrome.machine);
    const store = createSimulatorStore({ storage });
    store.getState().boot('#m=broken');
    store.getState().boot('');
    expect(store.getState()).toMatchObject({ exampleId: 'palindrome', badLink: true });
  });

  it('clears the bad-link note when any machine loads', () => {
    const store = createSimulatorStore({ storage });
    store.getState().boot('#m=broken');
    store.getState().loadExample('palindrome');
    expect(store.getState().badLink).toBe(false);
    store.getState().openLink('#m=broken');
    store.getState().loadMachine(machine([]));
    expect(store.getState().badLink).toBe(false);
  });

  it('says when the browser will not keep the machine', () => {
    const store = createSimulatorStore({ storage });
    store.getState().boot('');
    expect(store.getState().storageBlocked).toBe(true);
  });

  it('has no run when the machine has issues, and lists them', () => {
    const store = createSimulatorStore({ storage });
    store.getState().loadMachine(machine([], { accept: ['q0'], reject: ['q0'] }));
    const state = store.getState();
    expect(state.run).toBeNull();
    expect(state.compile).toMatchObject({ ok: false, issues: [{ code: 'accept-and-reject', state: 'q0' }] });
  });

  it('stops the run, compiles the edited machine and saves it after an edit', () => {
    const store = createSimulatorStore({ storage });
    store.getState().toggleRun();
    const edited = updateRule(store.getState().machine, 0, { state: 'q0', read: '0', write: '1', move: 'R', next: 'q0' });
    store.getState().editMachine(edited);
    expect(store.getState()).toMatchObject({ loop: 'idle', exampleId: null, run: { steps: 0 }, event: { kind: 'ready' } });
    vi.advanceTimersByTime(5000);
    expect(store.getState().run?.steps).toBe(0);
    expect(storage.loadMachine()).toEqual(edited);
  });

  it('renames the machine and saves it, without sending the run back to the start', () => {
    const store = createSimulatorStore({ storage });
    store.getState().loadExample('tcc-2016');
    for (let i = 0; i < 3; i++) store.getState().stepForward();
    const run = store.getState().run;
    store.getState().renameMachine('My TCC machine');
    const state = store.getState();
    expect(state.machine).toEqual({ ...examples['tcc-2016'].machine, name: 'My TCC machine' });
    expect(state.run).toBe(run);
    expect(state.run?.steps).toBe(3);
    expect(state.run?.history).toHaveLength(3);
    expect(state.event.kind).toBe('step');
    expect(state.importWarnings).toEqual(examples['tcc-2016'].warnings);
    expect(state.exampleId).toBeNull();
    expect(storage.loadMachine()).toEqual(state.machine);
  });

  it('has no run while an edit leaves an issue, and runs again once it is fixed', () => {
    const store = createSimulatorStore({ storage });
    const rule = { state: 'q0', read: '', write: '0', move: 'R', next: 'q0' } as const;
    store.getState().editMachine(updateRule(store.getState().machine, 0, rule));
    expect(store.getState().run).toBeNull();
    store.getState().editMachine(updateRule(store.getState().machine, 0, { ...rule, read: '0' }));
    expect(store.getState().run?.status).toBe('running');
  });

  it('edits the tape from cell 0 when the run has not started', () => {
    const store = createSimulatorStore({ storage });
    store.getState().startTapeEdit();
    expect(store.getState().tapeEdit).toEqual({ cell: 0, resetRun: false });
    store.getState().moveTapeCursor(3);
    store.getState().setInput('1010');
    expect(store.getState().tapeEdit).toEqual({ cell: 3, resetRun: false });
    store.getState().endTapeEdit();
    expect(store.getState().tapeEdit).toBeNull();
  });

  it('goes back to the start before editing the tape of a run that has started, and says so', () => {
    const store = createSimulatorStore({ storage });
    store.getState().toggleRun();
    store.getState().startTapeEdit(2);
    expect(store.getState()).toMatchObject({ loop: 'idle', run: { steps: 0 }, tapeEdit: { cell: 2, resetRun: true } });
    store.getState().moveTapeCursor(-1);
    expect(store.getState().tapeEdit?.cell).toBe(0);
  });

  it('stops editing the tape when another machine loads', () => {
    const store = createSimulatorStore({ storage });
    store.getState().startTapeEdit();
    store.getState().loadExample('palindrome');
    expect(store.getState().tapeEdit).toBeNull();
  });

  it('keeps the 2016 import warnings of the TCC example', () => {
    const store = createSimulatorStore({ storage });
    store.getState().loadExample('tcc-2016');
    expect(store.getState().importWarnings).toEqual(examples['tcc-2016'].warnings);
  });
});
