// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/intl';
import { HomeMachine, STILL_STEPS } from './HomeMachine';

/** The symbols in tape cells 0 to 4. */
const firstCells = () =>
  [0, 1, 2, 3, 4].map((cell) => document.querySelector(`[data-cell="${cell}"] [data-testid="cell-symbol"]`)?.textContent);

/** jsdom has no matchMedia. This one answers the reduced-motion question. */
function setReducedMotion(reduce: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduce && query === '(prefers-reduced-motion: reduce)',
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

beforeEach(() => vi.useFakeTimers());

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(window, 'matchMedia');
});

describe('HomeMachine', () => {
  it("runs Turing's first machine, which prints 0 and 1 on every other cell", () => {
    setReducedMotion(false);
    renderWithIntl(<HomeMachine />);
    // The first step comes at once, then one step every 700 ms (speed 3).
    expect(screen.getByTestId('step-sentence').textContent).toBe('In 𝔟 reading _: print 0, move right, go to 𝔠.');
    act(() => vi.advanceTimersByTime(3 * 700));
    expect(firstCells()).toEqual(['0', '_', '1', '_', '_']);
    expect(screen.getByTestId('step-sentence').textContent).toBe('In 𝔨 reading _: move right, go to 𝔟.');
  });

  it('stops and goes on with the Pause and Play button', () => {
    setReducedMotion(false);
    renderWithIntl(<HomeMachine />);
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    const head = screen.getByTestId('head-state').textContent;
    act(() => vi.advanceTimersByTime(10 * 700));
    expect(screen.getByTestId('head-state').textContent).toBe(head);
    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    act(() => vi.advanceTimersByTime(700));
    expect(screen.getByTestId('head-state').textContent).not.toBe(head);
  });

  it(`with reduced motion, shows the tape after ${STILL_STEPS} steps and does not move`, () => {
    setReducedMotion(true);
    renderWithIntl(<HomeMachine />);
    act(() => vi.advanceTimersByTime(10 * 700));
    expect(firstCells()).toEqual(['0', '_', '1', '_', '0']);
    expect(screen.getByText(`Head on cell ${STILL_STEPS}, in state 𝔨, reading _.`)).toBeTruthy();
    expect(screen.getByTestId('step-sentence').textContent).toBe('In 𝔢 reading _: print 1, move right, go to 𝔨.');
    expect(screen.getByRole('button', { name: 'Play' })).toBeTruthy();
  });
});
