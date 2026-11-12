// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MachineSettings } from './MachineSettings';
import { renderSimulator } from './test-utils';

afterEach(cleanup);

const field = (name: string) => screen.getByRole<HTMLInputElement>('textbox', { name });
const type = (element: Element, value: string) => act(() => fireEvent.change(element, { target: { value } }));
const descriptionOf = (element: Element) =>
  (element.getAttribute('aria-describedby') ?? '')
    .split(' ')
    .map((id) => document.getElementById(id)?.textContent)
    .join(' ');

describe('MachineSettings', () => {
  it('shows the start, accept and reject states, the blank and the tape', () => {
    renderSimulator(<MachineSettings />);
    expect(field('Start state').value).toBe('q0');
    expect(field('Accept states').value).toBe('qA');
    expect(field('Reject states').value).toBe('qR');
    expect(field('Blank').value).toBe('_');
    expect(screen.getByRole<HTMLSelectElement>('combobox', { name: 'Tape' }).value).toBe('two-way');
  });

  it('marks an empty start state and stops the machine until it is fixed', () => {
    const { store } = renderSimulator(<MachineSettings />);
    type(field('Start state'), '');
    expect(field('Start state').getAttribute('aria-invalid')).toBe('true');
    expect(descriptionOf(field('Start state'))).toBe('Type a state.');
    expect(store.getState().run).toBeNull();
    type(field('Start state'), 'q0');
    expect(store.getState().run).not.toBeNull();
  });

  it('reads a list of accept states, and keeps the text as typed while the field has focus', () => {
    const { store } = renderSimulator(<MachineSettings />);
    const accept = field('Accept states');
    act(() => accept.focus());
    type(accept, 'qA, ');
    expect(accept.value).toBe('qA, ');
    type(accept, 'qA, qR');
    expect(store.getState().machine.accept).toEqual(['qA', 'qR']);
    expect(descriptionOf(accept)).toBe('A state cannot both accept and reject. Separate states with commas.');
  });

  it('changes the blank and the tape kind', () => {
    const { store } = renderSimulator(<MachineSettings />);
    type(field('Blank'), '__');
    expect(descriptionOf(field('Blank'))).toBe('Type exactly one symbol.');
    type(field('Blank'), 'B');
    act(() => fireEvent.change(screen.getByRole('combobox', { name: 'Tape' }), { target: { value: 'one-sided' } }));
    expect(store.getState().machine).toMatchObject({ blank: 'B', tape: 'one-sided' });
  });

  it('says when a 2016 machine rejects a move left of cell 0', () => {
    const { store } = renderSimulator(<MachineSettings />);
    expect(screen.queryByText('On this tape, a move left of cell 0 rejects, as in the 2016 app.')).toBeNull();
    act(() => store.getState().loadExample('tcc-2016'));
    expect(screen.getByText('On this tape, a move left of cell 0 rejects, as in the 2016 app.')).toBeTruthy();
  });
});
