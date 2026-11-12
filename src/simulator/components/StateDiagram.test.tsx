// @vitest-environment jsdom
import { act, cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addRule, deleteRule } from '../rule-edit';
import StateDiagram from './StateDiagram';
import { renderSimulator } from './test-utils';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// jsdom measures nothing. React Flow reads the panel's size from these, so the panel is 503 × 320 px, as at 1440 px.
// jsdom cannot measure the state circles either, so React Flow draws no arrows and fits no view here: e2e/diagram.spec.ts checks those.
beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(503);
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(320);
});

describe('StateDiagram', () => {
  it('hides "Follow the run" while the machine has errors, and follows again once the machine has a run', () => {
    const { store } = renderSimulator(<StateDiagram />);
    act(() => store.getState().loadExample('tcc-2016'));
    expect(screen.getByRole('button', { name: 'Follow the run' }).getAttribute('aria-pressed')).toBe('true');

    // "Add a rule": an empty read and write is an error, so there is no run and no current state to follow.
    const fine = store.getState().machine;
    act(() => store.getState().editMachine(addRule(fine)));
    expect(store.getState().run).toBeNull();
    expect(screen.queryByRole('button', { name: 'Follow the run' })).toBeNull();

    act(() => store.getState().editMachine(deleteRule(store.getState().machine, fine.rules.length)));
    expect(screen.getByRole('button', { name: 'Follow the run' }).getAttribute('aria-pressed')).toBe('true');
  });
});
