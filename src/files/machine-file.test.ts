import { describe, expect, it } from 'vitest';
import tcc2016Text from '../../examples/example.txt?raw';
import { serializeMachine } from '@/engines/turing';
import { examples } from '@/simulator/examples';
import { machineFileName, readMachineFile } from './machine-file';

describe('machineFileName', () => {
  it('names the file after the machine, without characters that file systems refuse', () => {
    expect(machineFileName('Binary +1')).toBe('Binary +1.json');
    expect(machineFileName('a/b:c*?"<>|d')).toBe('a-b-c------d.json');
    expect(machineFileName('   ')).toBe('machine.json');
  });
});

describe('readMachineFile', () => {
  it('reads a machine file saved by Download', () => {
    const machine = examples.palindrome.machine;
    expect(readMachineFile('palindrome.json', serializeMachine(machine))).toEqual({ ok: true, machine, warnings: [] });
  });

  it('reads a 2016 .txt file and names the machine after the file', () => {
    const result = readMachineFile('example.txt', tcc2016Text);
    expect(result).toMatchObject({ ok: true, machine: { name: 'example', start: 'q0', leftEdge: 'reject' } });
  });

  it('gives the field path for a bad machine file, and the line for a bad 2016 file', () => {
    expect(readMachineFile('x.json', '{"format": "computable/machine@1"}')).toEqual({
      ok: false,
      error: { code: 'missing-field', field: 'name' },
    });
    expect(readMachineFile('x.json', 'not json')).toEqual({ ok: false, error: { code: 'not-json' } });
    expect(readMachineFile('old.TXT', 'q0\n1\n0,1\n')).toEqual({ ok: false, error: { code: 'legacy-bad-row', row: 3 } });
  });
});
