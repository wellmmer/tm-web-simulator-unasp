import { describe, expect, it } from 'vitest';
import { compileMachine, createRun, runUntilHalt } from '@/engines/turing';
import { EXAMPLE_IDS, examples, findExampleId } from './examples';

describe('examples', () => {
  it('ships the four R1 examples in picker order', () => {
    expect(EXAMPLE_IDS).toEqual(['binary-plus-one', 'palindrome', 'turing-1936', 'tcc-2016']);
  });

  it.each(EXAMPLE_IDS)('%s compiles without issues', (id) => {
    expect(compileMachine(examples[id].machine).ok).toBe(true);
  });

  it('imports the 2016 example.txt from its raw text and accepts its own input', () => {
    const { machine } = examples['tcc-2016'];
    expect(machine).toMatchObject({ start: 'q0', input: '_wyzx_wyzx_', leftEdge: 'reject' });
    const result = compileMachine(machine);
    if (!result.ok) throw new Error('expected ok');
    const run = createRun(result.compiled);
    runUntilHalt(run);
    expect(run).toMatchObject({ status: 'accepted', steps: 71 });
  });

  it('finds the example a machine came from, even with a different input', () => {
    const machine = { ...examples.palindrome.machine, input: '101' };
    expect(findExampleId(machine)).toBe('palindrome');
    expect(findExampleId({ ...machine, name: 'Mine' })).toBeNull();
  });
});
