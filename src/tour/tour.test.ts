// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { createTourStore, markTourSeen, TOUR_KEY, TOUR_PROMPT_SCRIPT, TOUR_STEPS } from './tour';

/** Runs the <head> script against a fake page and a fake storage, as the browser does before the first paint. */
function runScript(getItem: (key: string) => string | null) {
  const root = { dataset: {} as Record<string, string> };
  new Function('localStorage', 'document', TOUR_PROMPT_SCRIPT)({ getItem }, { documentElement: root });
  return root.dataset.tourNew;
}

afterEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.tourNew;
});

describe('the tour steps (spec 5.5)', () => {
  it('shows 7 parts in order: tape, head, step sentence, controls, rule table, state diagram, keyboard and examples', () => {
    expect(TOUR_STEPS).toEqual(['tape', 'head', 'sentence', 'controls', 'rules', 'diagram', 'keys']);
  });
});

describe('the tour store', () => {
  it('starts at the first step, goes forward and back, and closes after the last step', () => {
    const store = createTourStore();
    expect(store.getState().step).toBeNull();
    store.getState().start();
    expect(store.getState().step).toBe(0);
    store.getState().back();
    expect(store.getState().step).toBe(0);
    store.getState().next();
    store.getState().back();
    expect(store.getState().step).toBe(0);
    for (let i = 1; i < TOUR_STEPS.length; i++) store.getState().next();
    expect(store.getState().step).toBe(6);
    store.getState().next();
    expect(store.getState().step).toBeNull();
  });

  it('keeps a request from another page until the simulator starts the tour', () => {
    const store = createTourStore();
    store.getState().request();
    expect(store.getState().requested).toBe(true);
    store.getState().start();
    expect(store.getState()).toMatchObject({ step: 0, requested: false });
    store.getState().close();
    expect(store.getState().step).toBeNull();
  });
});

describe('TOUR_PROMPT_SCRIPT', () => {
  it('marks <html> on the first visit, so the CSS shows "New here? Take the 1-minute tour"', () => {
    expect(runScript(() => null)).toBe('');
  });

  it('leaves <html> alone once the visitor answered, and when the browser blocks storage', () => {
    expect(runScript((key) => (key === TOUR_KEY ? 'seen' : null))).toBeUndefined();
    expect(
      runScript(() => {
        throw new Error('SecurityError');
      }),
    ).toBeUndefined();
  });
});

describe('markTourSeen', () => {
  it('remembers the answer and hides the prompt', () => {
    document.documentElement.dataset.tourNew = '';
    markTourSeen();
    expect(localStorage.getItem(TOUR_KEY)).toBe('seen');
    expect(document.documentElement.dataset.tourNew).toBeUndefined();
  });
});
