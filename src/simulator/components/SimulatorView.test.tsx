// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SimulatorView } from './SimulatorView';
import { renderSimulator } from './test-utils';

afterEach(cleanup);

const clickStep = (times = 1) => {
  for (let i = 0; i < times; i++) act(() => fireEvent.click(screen.getByRole('button', { name: 'Step' })));
};

describe('the simulator page', () => {
  it('opens on Binary +1 with its name as the title', () => {
    renderSimulator(<SimulatorView />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Binary +1');
    expect(screen.getByRole<HTMLInputElement>('textbox', { name: 'Input' }).value).toBe('1011');
  });

  it('explains the step in the sentence under the tape after Step', () => {
    renderSimulator(<SimulatorView />);
    clickStep();
    expect(screen.getByTestId('step-sentence').textContent).toBe('In q0 reading 1: write 1, move right, go to q0.');
  });

  it('marks the rule row of the last step after Step', () => {
    renderSimulator(<SimulatorView />);
    clickStep(6);
    const row = screen.getByRole('row', { current: true });
    expect([...row.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select')].map((field) => field.value)).toEqual([
      'q1',
      '1',
      '0',
      'L',
      'q1',
    ]);
  });

  it('shows the result line when Binary +1 accepts after 8 steps', () => {
    renderSimulator(<SimulatorView />);
    clickStep(8);
    expect(screen.getByTestId('result-line').textContent).toBe('Accepted after 8 steps. The tape now reads 1100.');
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Step' }).disabled).toBe(true);
  });

  it('keeps the shortcuts off while typing in the Input field', () => {
    const { store } = renderSimulator(<SimulatorView />);
    const input = screen.getByRole('textbox', { name: 'Input' });
    input.focus();
    act(() => fireEvent.keyDown(input, { key: 'ArrowRight' }));
    act(() => fireEvent.keyDown(input, { key: 'r' }));
    expect(store.getState().run?.steps).toBe(0);
    act(() => fireEvent.keyDown(document.body, { key: 'ArrowRight' }));
    expect(store.getState().run?.steps).toBe(1);
  });

  it('loads an example from the picker and a new input from the field', () => {
    const { store } = renderSimulator(<SimulatorView />);
    act(() => fireEvent.change(screen.getByRole('combobox', { name: 'Example' }), { target: { value: 'palindrome' } }));
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Palindrome checker');
    act(() => fireEvent.change(screen.getByRole('textbox', { name: 'Input' }), { target: { value: '101' } }));
    expect(store.getState().run?.tape.toString()).toBe('101');
  });
});
