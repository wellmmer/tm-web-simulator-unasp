// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { machine } from '@/engines/turing/test-helpers';
import { MachineMessages } from './MachineMessages';
import { RuleTable } from './RuleTable';
import { renderSimulator } from './test-utils';

afterEach(cleanup);

const headers = () => screen.getAllByRole('columnheader').map((h) => h.textContent);
/** The values of the fields in a row, in column order. */
const valuesOf = (row: Element) => [...row.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select')].map((field) => field.value);
const ruleRow = (rule: number) => {
  const row = document.querySelector(`tr[data-rule="${rule}"]`);
  if (row === null) throw new Error(`no row for rule ${rule}`);
  return row;
};
const field = (name: string) => screen.getByRole<HTMLInputElement>('textbox', { name });
/** The text of the elements that aria-describedby points to. */
const descriptionOf = (element: Element) =>
  (element.getAttribute('aria-describedby') ?? '')
    .split(' ')
    .map((id) => document.getElementById(id)?.textContent)
    .join(' ');
const type = (element: Element, value: string) => act(() => fireEvent.change(element, { target: { value } }));

describe('RuleTable', () => {
  it('uses the spec headers and shows each rule in fields', () => {
    renderSimulator(<RuleTable />);
    expect(headers()).toEqual(['If in state', 'and reading', 'write', 'move', 'then go to', 'Delete']);
    expect(valuesOf(ruleRow(1))).toEqual(['q0', '0', '0', 'R', 'q0']);
  });

  it('marks the rule the last step applied, and clears the mark after stepping back to the start', () => {
    const { store } = renderSimulator(<RuleTable />);
    expect(screen.queryByRole('row', { current: true })).toBeNull();
    act(() => store.getState().stepForward());
    expect(valuesOf(screen.getByRole('row', { current: true }))).toEqual(['q0', '1', '1', 'R', 'q0']);
    act(() => store.getState().stepBack());
    expect(screen.queryByRole('row', { current: true })).toBeNull();
  });

  it('changes the machine when a field changes, and starts the run again', () => {
    const { store } = renderSimulator(<RuleTable />);
    act(() => store.getState().stepForward());
    type(screen.getByRole('combobox', { name: 'Rule 3: move' }), 'R');
    expect(store.getState().machine.rules[2]).toMatchObject({ move: 'R' });
    expect(store.getState().run?.steps).toBe(0);
  });

  it('turns both rows red when two rules share a state and symbol, and stops the machine', () => {
    const { store } = renderSimulator(<RuleTable />);
    type(field('Rule 2: and reading'), '0');
    const message = 'Two rules for q0 reading 0. A Turing machine needs exactly one.';
    expect(screen.getByText(message)).toBeTruthy();
    expect(ruleRow(1).className).toContain('bg-row-now');
    expect(ruleRow(2).className).toContain('bg-row-now');
    expect(field('Rule 2: and reading').getAttribute('aria-invalid')).toBe('true');
    expect(descriptionOf(field('Rule 2: and reading'))).toBe(message);
    expect(store.getState().run).toBeNull();
  });

  it('marks an empty field with a short hint', () => {
    renderSimulator(<RuleTable />);
    type(field('Rule 1: write'), '');
    type(field('Rule 1: then go to'), '');
    expect(field('Rule 1: write').getAttribute('aria-invalid')).toBe('true');
    expect(descriptionOf(field('Rule 1: write'))).toBe('Type exactly one symbol.');
    expect(descriptionOf(field('Rule 1: then go to'))).toBe('Type a state.');
    expect(field('Rule 1: If in state').getAttribute('aria-invalid')).toBeNull();
  });

  it('adds a rule from the start state and puts the focus in it', () => {
    renderSimulator(<RuleTable />);
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Add a rule' })));
    expect(valuesOf(ruleRow(7))).toEqual(['q0', '', '', 'R', 'q0']);
    expect(document.activeElement).toBe(field('Rule 7: If in state'));
  });

  it('deletes a rule and moves the focus to the next delete button', () => {
    const { store } = renderSimulator(<RuleTable />);
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Delete rule 1' })));
    expect(store.getState().machine.rules).toHaveLength(5);
    expect(valuesOf(ruleRow(1))).toEqual(['q0', '1', '1', 'R', 'q0']);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Delete rule 1' }));
  });

  it("edits Turing's operations, and keeps the text as typed while the field has focus", () => {
    const { store } = renderSimulator(<RuleTable />);
    act(() => store.getState().loadExample('turing-1936'));
    expect(headers()).toEqual(['If in state', 'and reading', 'operations', 'then go to', 'Delete']);
    expect(valuesOf(ruleRow(1))).toEqual(['𝔟', 'blank', 'P0, R', '𝔠']);
    const ops = field('Rule 1: operations');
    act(() => ops.focus());
    type(ops, 'P1, ');
    expect(ops.value).toBe('P1, ');
    expect(store.getState().machine.rules[0]).toMatchObject({ ops: ['P1'] });
    act(() => ops.blur());
    expect(ops.value).toBe('P1');
  });

  it("reads a symbol, any symbol or the blank in Turing's notation", () => {
    const { store } = renderSimulator(<RuleTable />);
    act(() => store.getState().loadExample('turing-1936'));
    type(screen.getByRole('combobox', { name: 'Rule 1: and reading' }), 'symbol');
    type(field('Rule 1: symbol read'), 'x');
    expect(store.getState().machine.rules[0]).toMatchObject({ read: 'x' });
    type(screen.getByRole('combobox', { name: 'Rule 1: and reading' }), 'any');
    expect(store.getState().machine.rules[0]).toMatchObject({ read: { match: 'any' } });
    type(field('Rule 2: operations'), 'X');
    expect(descriptionOf(field('Rule 2: operations'))).toBe('Use P and a symbol, E, L or R.');
  });

  it('offers the first rule or an example when the machine has no rules (spec 8)', () => {
    const { store } = renderSimulator(<RuleTable />);
    act(() => store.getState().loadMachine(machine([])));
    expect(screen.getByText('Your machine has no rules yet. Add the first rule, or start from an example.')).toBeTruthy();
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Add the first rule' })));
    expect(store.getState().machine.rules).toHaveLength(1);
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Delete rule 1' })));
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Add the first rule' }));
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Open an example' })));
    expect(store.getState().exampleId).toBe('binary-plus-one');
    expect(document.activeElement).toBe(field('Rule 1: If in state'));
  });
});

describe('MachineMessages', () => {
  it('lists compile issues and warnings as text', () => {
    const { store } = renderSimulator(<MachineMessages />);
    act(() =>
      store.getState().loadMachine(
        machine(
          [
            { state: 'q1', read: '1', write: '0', move: 'L', next: 'q5' },
            { state: 'q1', read: '1', write: '1', move: 'R', next: 'qA' },
          ],
          { start: 'q1' },
        ),
      ),
    );
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Rules 1 and 2: two rules for q1 reading 1. A Turing machine needs exactly one.',
      'q5 has no rules yet. The machine will stop there and reject.',
    ]);
  });

  it('shows nothing for a machine without issues or warnings', () => {
    renderSimulator(<MachineMessages />);
    expect(screen.queryByRole('list')).toBeNull();
  });
});
