// @vitest-environment jsdom
import { act, cleanup, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { machine } from '@/engines/turing/test-helpers';
import { MachineMessages } from './MachineMessages';
import { RuleTable } from './RuleTable';
import { renderSimulator } from './test-utils';

afterEach(cleanup);

const headers = () => screen.getAllByRole('columnheader').map((h) => h.textContent);
const cellsOf = (row: HTMLElement) => within(row).getAllByRole('cell').map((c) => c.textContent);

describe('RuleTable', () => {
  it('uses the spec headers for modern rules', () => {
    renderSimulator(<RuleTable />);
    expect(headers()).toEqual(['If in state', 'and reading', 'write', 'move', 'then go to']);
    expect(cellsOf(screen.getAllByRole('row')[1])).toEqual(['q0', '0', '0', 'R', 'q0']);
  });

  it('marks the rule the last step applied, and clears the mark after stepping back to the start', () => {
    const { store } = renderSimulator(<RuleTable />);
    expect(screen.queryByRole('row', { current: true })).toBeNull();
    act(() => store.getState().stepForward());
    expect(cellsOf(screen.getByRole('row', { current: true }))).toEqual(['q0', '1', '1', 'R', 'q0']);
    act(() => store.getState().stepBack());
    expect(screen.queryByRole('row', { current: true })).toBeNull();
  });

  it('shows an operations column for a Turing 1936 machine', () => {
    const { store } = renderSimulator(<RuleTable />);
    act(() => store.getState().loadExample('turing-1936'));
    expect(headers()).toEqual(['If in state', 'and reading', 'operations', 'then go to']);
    expect(cellsOf(screen.getAllByRole('row')[1])).toEqual(['𝔟', 'blank', 'P0, R', '𝔠']);
  });

  it('says when the machine has no rules', () => {
    const { store } = renderSimulator(<RuleTable />);
    act(() => store.getState().loadMachine(machine([])));
    expect(screen.getByText('Your machine has no rules yet.')).toBeTruthy();
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
