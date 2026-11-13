import { createStore } from 'zustand/vanilla';

/**
 * The tour's steps, in order (spec 5.5). Each one spotlights the element of the simulator marked
 * with the same `data-tour` value. "keys" is the keyboard and the examples.
 */
export const TOUR_STEPS = ['tape', 'head', 'sentence', 'controls', 'rules', 'diagram', 'keys'] as const;
export type TourStepId = (typeof TOUR_STEPS)[number];

/** The browser storage key that remembers that the visitor took the tour or said no to it. */
export const TOUR_KEY = 'computable.tour';

/**
 * Runs in <head> before the first paint. On the first visit it marks <html>, and the CSS then shows
 * "New here? Take the 1-minute tour" on the simulator, so the prompt never moves the page.
 */
export const TOUR_PROMPT_SCRIPT = `(function(){try{if(localStorage.getItem(${JSON.stringify(TOUR_KEY)})===null)document.documentElement.dataset.tourNew=""}catch(e){}})()`;

export interface TourState {
  /** The index of the open step in TOUR_STEPS, or null while the tour is closed. */
  step: number | null;
  /** True after the menu's Tour button asked for the tour from another page, until the simulator starts it. */
  requested: boolean;
  request(): void;
  start(): void;
  /** The next step. After the last step, the tour closes. */
  next(): void;
  back(): void;
  close(): void;
}

export function createTourStore() {
  return createStore<TourState>()((set, get) => ({
    step: null,
    requested: false,
    request: () => set({ requested: true }),
    start: () => set({ step: 0, requested: false }),
    next: () => {
      const { step } = get();
      if (step !== null) set({ step: step + 1 < TOUR_STEPS.length ? step + 1 : null });
    },
    back: () => {
      const { step } = get();
      if (step !== null && step > 0) set({ step: step - 1 });
    },
    close: () => set({ step: null, requested: false }),
  }));
}

/** One store for the whole site: the menu's Tour button and the tour on the simulator page share it. */
export const tourStore = createTourStore();

/** Remembers that the visitor took the tour or said no, so the first-visit prompt never shows again. */
export function markTourSeen() {
  try {
    localStorage.setItem(TOUR_KEY, 'seen');
  } catch {
    // The browser blocks storage: the prompt is hidden until the page reloads.
  }
  delete document.documentElement.dataset.tourNew;
}
