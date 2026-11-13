// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { machine } from '@/engines/turing/test-helpers';
import { renderSimulator } from './test-utils';
import { TapeStage } from './TapeStage';

afterEach(cleanup);

const cellNumbers = () => within(screen.getByTestId('tape-strip')).getAllByTestId('cell-number').map((n) => Number(n.textContent));

describe('TapeStage', () => {
  it('shows the state above the head and dims blank cells', () => {
    const { store } = renderSimulator(<TapeStage />);
    expect(screen.getByTestId('head-state').textContent).toBe('q0');
    const blank = screen.getAllByTestId('cell-symbol').find((cell) => cell.textContent === '_');
    expect(blank?.className).toContain('text-blank-ink');
    act(() => store.getState().stepForward());
    expect(screen.getByText('Head on cell 1, in state q0, reading 0.')).toBeTruthy();
  });

  it('shows negative cells on a two-way tape only', () => {
    const { store } = renderSimulator(<TapeStage />);
    expect(Math.min(...cellNumbers())).toBeLessThan(0);
    act(() => store.getState().loadExample('palindrome'));
    expect(Math.min(...cellNumbers())).toBe(0);
  });

  it("shows Turing's Fraktur state letters in the head tag", () => {
    const { store } = renderSimulator(<TapeStage />);
    act(() => store.getState().loadExample('turing-1936'));
    expect(screen.getByTestId('head-state').textContent).toBe('𝔟');
  });

  it('shows the input when the machine has issues and cannot run', () => {
    const { store } = renderSimulator(<TapeStage />);
    act(() => store.getState().loadMachine(machine([], { accept: ['q0'], reject: ['q0'], input: '10' })));
    expect(screen.queryByTestId('head-state')).toBeNull();
    expect(screen.getAllByTestId('cell-symbol').slice(0, 2).map((c) => c.textContent)).toEqual(['1', '0']);
  });

  it('ignores clicks on the cells when the tape is not editable, as on Home', () => {
    const { store } = renderSimulator(<TapeStage editable={false} />);
    fireEvent.click(screen.getAllByTestId('cell-symbol')[20]);
    expect(store.getState().tapeEdit).toBeNull();
    expect(screen.getAllByTestId('cell-symbol')[20].parentElement?.className).not.toContain('cursor-text');
  });
});
