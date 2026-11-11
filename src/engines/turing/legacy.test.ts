import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LEGACY_BLANK, parseLegacy } from './legacy';
import { createRun, runUntilHalt } from './run';
import { compiled } from './test-helpers';

const exampleText = readFileSync(join(process.cwd(), 'examples/example.txt'), 'utf8');

describe('parseLegacy', () => {
  it('reads the start state, the input and every rule', () => {
    const result = parseLegacy('0\n1 1\n0,1,0,A,>,\n0, ,1,R,<,\n', 'Old');
    expect(result).toEqual({
      ok: true,
      machine: {
        format: 'computable/machine@1',
        name: 'Old',
        tape: 'one-sided',
        leftEdge: 'reject',
        blank: LEGACY_BLANK,
        start: 'q0',
        accept: ['qA'],
        reject: ['qR'],
        input: `1${LEGACY_BLANK}1`,
        rules: [
          { state: 'q0', read: '1', write: '0', next: 'qA', move: 'R' },
          { state: 'q0', read: LEGACY_BLANK, write: '1', next: 'qR', move: 'L' },
        ],
      },
    });
  });

  it('accepts Windows line endings', () => {
    expect(parseLegacy('0\r\n1\r\n0,1,1,A,>,\r\n', 'Old').ok).toBe(true);
  });

  it('gives the line number of a bad row', () => {
    expect(parseLegacy('0\n1\n0,1,1,A,>,\n0,1\n', 'Old')).toEqual({ ok: false, error: { code: 'legacy-bad-row', row: 4 } });
  });

  it('rejects a file without a start state', () => {
    expect(parseLegacy('', 'Old')).toEqual({ ok: false, error: { code: 'legacy-too-short' } });
  });
});

/**
 * Expected results come from running the 2016 engine (js/libs/lib-tm-machine.js, tag v1.0-tcc-2016)
 * on the same file. The 2016 engine counts the same 71 rule applications for the accepted input.
 */
describe('the 2016 example.txt gives the same results as the 2016 app', () => {
  const imported = parseLegacy(exampleText, 'example.txt');
  if (!imported.ok) throw new Error('example.txt must import');
  const machineFrom2016 = compiled(imported.machine);

  it.each([
    { input: '_wyzx_wyzx_', status: 'accepted', tape: '_WYZX_WYZX_', steps: 71 },
    { input: '_wy_wy_', status: 'accepted', tape: '_WY_WY_', steps: 25 },
    { input: '_wyzx_wyzy_', status: 'rejected', tape: '_WYZX_WYZ__' },
    { input: '_w_x_', status: 'rejected', tape: '_W___' },
  ])('$input is $status', ({ input, status, tape, steps }) => {
    const run = createRun(machineFrom2016, input);
    expect(runUntilHalt(run)).toBe('halted');
    expect(run.status).toBe(status);
    expect(run.tape.toString()).toBe(tape);
    if (steps !== undefined) expect(run.steps).toBe(steps);
  });
});
