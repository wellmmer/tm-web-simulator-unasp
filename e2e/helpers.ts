import { expect, type Page } from '@playwright/test';

/**
 * Opens the simulator and waits until the page is interactive. The state diagram draws in the
 * browser only, after hydration, so its first state means the buttons work.
 */
export async function openSimulator(page: Page, hash = '') {
  await page.goto(`/en/simulator${hash}`);
  await expect(page.locator('.react-flow__node').first()).toBeVisible();
}

/** Picks an example in the Example list. */
export async function pickExample(page: Page, name: string) {
  await page.getByRole('combobox', { name: 'Example' }).selectOption({ label: name });
}

/** Sets the fastest speed and presses Run. Returns the result line. */
export async function runFast(page: Page) {
  await page.getByRole('slider', { name: 'Speed' }).fill('5');
  await page.getByRole('button', { name: 'Run', exact: true }).click();
  return page.getByTestId('result-line');
}

/** The diagram's edge from one state to another, as drawn by StateDiagram. */
export function diagramEdge(page: Page, from: string, to: string) {
  return page.locator(`[data-edge="${from}→${to}"]`);
}

/** The diagram's circle for a state. */
export function diagramState(page: Page, state: string) {
  return page.locator(`.react-flow__node[data-id="${state}"]`);
}

/** The zoom of the state diagram: the scale of React Flow's viewport. */
export function diagramZoom(page: Page) {
  return page.locator('.react-flow__viewport').evaluate((viewport) => new DOMMatrix(getComputedStyle(viewport).transform).a);
}

/** How many state circles stick out of the diagram panel, so part of them is cut off. Only `state` when it is given. */
export function statesCutOff(page: Page, state?: string) {
  return page.getByTestId('state-diagram').evaluate((panel, only) => {
    const box = panel.getBoundingClientRect();
    return [...panel.querySelectorAll('.react-flow__node')]
      .filter((node) => only === null || node.getAttribute('data-id') === only)
      .map((node) => node.getBoundingClientRect())
      .filter((circle) => circle.left < box.left || circle.right > box.right || circle.top < box.top || circle.bottom > box.bottom).length;
  }, state ?? null);
}

/** The pages from plan R1c-1, with the heading each one shows. */
export const PAGES = [
  { name: 'home', path: '/en', heading: 'Computable' },
  { name: 'about', path: '/en/about', heading: 'About Computable' },
  { name: 'support', path: '/en/support', heading: 'Buy the dev a coffee' },
  { name: 'privacy', path: '/en/privacy', heading: 'Privacy' },
] as const;

/**
 * Opens a page and waits until React has hydrated it: the theme switch gets aria-pressed only then.
 * The switch's name changes with the language, so this finds it by aria-pressed in the menu bar.
 */
export async function openPage(page: Page, path: string) {
  await page.goto(path);
  await expect(page.getByRole('banner').locator('button[aria-pressed]')).toHaveAttribute('aria-pressed', /^(true|false)$/);
}

/** The URL prefix of each language. Brazilian Portuguese is in lower case in URLs. */
export const LOCALE_PATHS = ['/en', '/pt-br', '/es', '/fr', '/de'] as const;
