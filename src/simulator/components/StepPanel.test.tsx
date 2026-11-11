// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { machine } from '@/engines/turing/test-helpers';
import { LiveRegion } from './LiveRegion';
import { Notices } from './Notices';
import { ResultLine } from './ResultLine';
import { StepSentence } from './StepSentence';
import { renderSimulator } from './test-utils';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('StepSentence', () => {
  it('starts with the ready sentence and explains each step', () => {
    const { store } = renderSimulator(<StepSentence />);
    expect(screen.getByTestId('step-sentence').textContent).toBe('Ready. The head starts on cell 0 in state q0.');
    act(() => store.getState().stepForward());
    expect(screen.getByTestId('step-sentence').textContent).toBe('In q0 reading 1: write 1, move right, go to q0.');
  });
});

describe('ResultLine', () => {
  it('stays empty until the machine halts', () => {
    const { store } = renderSimulator(<ResultLine />);
    expect(screen.queryByTestId('result-line')).toBeNull();
    act(() => {
      for (let i = 0; i < 8; i++) store.getState().stepForward();
    });
    expect(screen.getByTestId('result-line').textContent).toBe('Accepted after 8 steps. The tape now reads 1100.');
  });

  it('offers Continue at the step limit', () => {
    vi.useFakeTimers();
    const { store } = renderSimulator(<ResultLine />);
    act(() => {
      store.getState().loadExample('turing-1936');
      store.getState().setSpeed(5);
      store.getState().toggleRun();
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.getByTestId('result-line').textContent).toContain('Paused after 10,000 steps.');
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Continue' })));
    expect(store.getState().loop).toBe('running');
    act(() => store.getState().pause());
  });
});

describe('LiveRegion', () => {
  it('reads out the step and the result in a polite live region', () => {
    const { store } = renderSimulator(<LiveRegion />);
    act(() => {
      for (let i = 0; i < 8; i++) store.getState().stepForward();
    });
    expect(screen.getByRole('status').textContent).toBe(
      'In q1 reading 0: write 1, stay, go to qA. Accepted after 8 steps. The tape now reads 1100.',
    );
  });
});

describe('Notices', () => {
  it('says when the browser will not keep the machine', () => {
    const { store } = renderSimulator(<Notices />);
    act(() => store.getState().boot(''));
    expect(screen.getByText("This browser won't keep your machine after you close it.")).toBeTruthy();
  });

  it('explains the left edge once, until dismissed', () => {
    const { store } = renderSimulator(<Notices />);
    act(() => {
      store.getState().loadMachine(machine([{ state: 'q0', read: '_', write: '_', move: 'L', next: 'q0' }]));
      store.getState().stepForward();
    });
    expect(screen.getByText(/stays on cell 0/)).toBeTruthy();
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Got it' })));
    expect(screen.queryByText(/stays on cell 0/)).toBeNull();
  });
});
