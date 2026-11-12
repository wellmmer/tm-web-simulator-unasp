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
  await page.getByRole('button', { name: 'Run' }).click();
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
