import binaryPlusOne from '../../examples/binary-plus-one.json';
import tcc2016Text from '../../examples/example.txt?raw';
import palindrome from '../../examples/palindrome.json';
import turingFirst from '../../examples/turing-1936-first.json';
import { parseLegacy, parseMachine, type LegacyWarning, type Machine } from '@/engines/turing';

export const EXAMPLE_IDS = ['binary-plus-one', 'palindrome', 'turing-1936', 'tcc-2016'] as const;
export type ExampleId = (typeof EXAMPLE_IDS)[number];

export interface Example {
  machine: Machine;
  /** Warnings from the 2016 import; empty for the JSON examples. */
  warnings: LegacyWarning[];
}

function fromJson(data: unknown): Example {
  const result = parseMachine(JSON.stringify(data));
  if (!result.ok) throw new Error(`bad example: ${JSON.stringify(result.error)}`);
  return { machine: result.machine, warnings: [] };
}

function fromLegacy(text: string, name: string): Example {
  const result = parseLegacy(text, name);
  if (!result.ok) throw new Error(`bad example: ${JSON.stringify(result.error)}`);
  return { machine: result.machine, warnings: result.warnings };
}

export const examples: Record<ExampleId, Example> = {
  'binary-plus-one': fromJson(binaryPlusOne),
  palindrome: fromJson(palindrome),
  'turing-1936': fromJson(turingFirst),
  'tcc-2016': fromLegacy(tcc2016Text, 'TCC machine (2016)'),
};

export const DEFAULT_EXAMPLE_ID: ExampleId = 'binary-plus-one';

/** The example a machine came from, ignoring its input, or null for any other machine. */
export function findExampleId(machine: Machine): ExampleId | null {
  const key = JSON.stringify({ ...machine, input: '' });
  return EXAMPLE_IDS.find((id) => JSON.stringify({ ...examples[id].machine, input: '' }) === key) ?? null;
}
