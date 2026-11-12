// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SimulatorView } from './SimulatorView';
import { renderSimulator } from './test-utils';

afterEach(cleanup);

const press = (key: string, target: Element = document.activeElement ?? document.body) => act(() => fireEvent.keyDown(target, { key }));
const cursorCell = () => screen.getAllByTestId('cell-symbol').find((cell) => cell.dataset.cursor !== undefined)?.parentElement?.dataset.cell;
const help = 'Editing the tape. Arrows move the cursor. Type a symbol to write it. Backspace writes the blank. Esc ends editing.';

describe('the tape editor (spec 5.4)', () => {
  it('opens with E, writes the input, and ends with Esc', () => {
    const { store } = renderSimulator(<SimulatorView />);
    press('e', document.body);
    const editor = screen.getByRole('textbox', { name: 'Tape input' });
    expect(document.activeElement).toBe(editor);
    expect(screen.getByText(help)).toBeTruthy();
    press('0');
    press('ArrowRight');
    expect(store.getState().machine.input).toBe('0011');
    expect(cursorCell()).toBe('2');
    press('Backspace');
    expect(store.getState().machine.input).toBe('0_11');
    expect(cursorCell()).toBe('1');
    expect(store.getState().run?.steps).toBe(0);
    press('Escape');
    expect(screen.queryByRole('textbox', { name: 'Tape input' })).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Edit the tape' }));
    press('ArrowRight', document.body);
    expect(store.getState().run?.steps).toBe(1);
  });

  it('goes back to the start and says so when a cell is clicked after the run started', () => {
    const { store } = renderSimulator(<SimulatorView />);
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Step' })));
    act(() => fireEvent.click(screen.getAllByTestId('cell-symbol').find((cell) => cell.parentElement?.dataset.cell === '2')!));
    expect(store.getState().run?.steps).toBe(0);
    expect(cursorCell()).toBe('2');
    expect(screen.getByText(`The run went back to the start, so you edit the input on the tape. ${help}`)).toBeTruthy();
  });

  it('ends editing when the focus leaves the tape', () => {
    const { store } = renderSimulator(<SimulatorView />);
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Edit the tape' })));
    act(() => screen.getByRole('textbox', { name: 'Input' }).focus());
    expect(store.getState().tapeEdit).toBeNull();
  });
});
