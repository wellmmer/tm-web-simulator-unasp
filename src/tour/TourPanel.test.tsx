// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { renderSimulator } from '@/simulator/components/test-utils';
import { SimulatorView } from '@/simulator/components/SimulatorView';
import { TOUR_KEY, tourStore } from './tour';

beforeAll(() => {
  // jsdom does not scroll.
  window.scrollTo = () => {};
});

afterEach(() => {
  act(() => tourStore.getState().close());
  cleanup();
  localStorage.clear();
});

/** Opens the tour as the menu's Tour button does, with the focus on that button. */
function openTour() {
  const opener = document.createElement('button');
  opener.textContent = 'Tour';
  document.body.append(opener);
  opener.focus();
  act(() => tourStore.getState().request());
  return opener;
}

const panel = () => screen.getByRole('dialog', { name: 'Tour of the simulator' });
const press = (name: string) => act(() => fireEvent.click(within(panel()).getByRole('button', { name })));

describe('the tour (spec 5.5)', () => {
  it('opens on the tape, with its title focused and "Skip tour" visible', () => {
    renderSimulator(<SimulatorView />);
    openTour();
    expect(within(panel()).getByText('Step 1 of 7')).toBeTruthy();
    expect(document.activeElement).toBe(within(panel()).getByRole('heading', { name: 'The tape' }));
    expect(within(panel()).getByRole('button', { name: 'Back' })).toHaveProperty('disabled', true);
    expect(within(panel()).getByRole('button', { name: 'Skip tour' })).toBeTruthy();
    expect(localStorage.getItem(TOUR_KEY)).toBe('seen');
  });

  it('goes through the 7 parts, lets the visitor step the machine, and gives the focus back at the end', () => {
    const { store } = renderSimulator(<SimulatorView />);
    const opener = openTour();
    const titles = [screen.getByRole('heading', { name: 'The tape' }).textContent];
    for (let i = 1; i < 7; i++) {
      press('Next');
      titles.push(within(panel()).getByRole('heading', { level: 2 }).textContent);
      expect(within(panel()).getByRole('button', { name: 'Skip tour' })).toBeTruthy();
    }
    expect(titles).toEqual([
      'The tape',
      'The head and its state',
      'The step sentence',
      'The controls',
      'The rule table',
      'The state diagram',
      'Keyboard and examples',
    ]);

    press('Back');
    press('Back');
    expect(within(panel()).getByRole('heading', { level: 2 }).textContent).toBe('The rule table');
    expect(within(panel()).getByText('Press Step and watch which row lights up.')).toBeTruthy();
    press('Step');
    expect(store.getState().run?.history).toHaveLength(1);
    expect(screen.getByRole('row', { current: true })).toBeTruthy();

    press('Next');
    press('Next');
    press('Finish');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });

  it('starts the run again, so Step shows a step even after the machine stopped', () => {
    const { store } = renderSimulator(<SimulatorView />);
    act(() => {
      for (let i = 0; i < 8; i++) store.getState().stepForward();
    });
    expect(store.getState().run?.status).toBe('accepted');
    openTour();
    expect(store.getState().run?.history).toHaveLength(0);
    press('Next');
    act(() => {
      for (let i = 0; i < 8; i++) store.getState().stepForward();
    });
    press('Step');
    expect(store.getState().run?.history).toHaveLength(1);
  });

  it('closes with Esc or "Skip tour"', () => {
    renderSimulator(<SimulatorView />);
    openTour();
    act(() => fireEvent.keyDown(within(panel()).getByRole('heading', { level: 2 }), { key: 'Escape' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    openTour();
    press('Skip tour');
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('the first-visit prompt (spec 5.5)', () => {
  it('starts the tour', () => {
    renderSimulator(<SimulatorView />);
    const prompt = screen.getByRole('region', { name: 'New here? Take the 1-minute tour.' });
    act(() => fireEvent.click(within(prompt).getByRole('button', { name: 'Take the tour' })));
    expect(panel()).toBeTruthy();
    expect(localStorage.getItem(TOUR_KEY)).toBe('seen');
  });

  it('can be dismissed for good', () => {
    document.documentElement.dataset.tourNew = '';
    renderSimulator(<SimulatorView />);
    fireEvent.click(screen.getByRole('button', { name: 'No, thanks' }));
    expect(localStorage.getItem(TOUR_KEY)).toBe('seen');
    expect(document.documentElement.dataset.tourNew).toBeUndefined();
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
