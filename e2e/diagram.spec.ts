import { expect, test, type Page } from '@playwright/test';
import { diagramEdge, diagramState, diagramZoom, openSimulator, pickExample, statesCutOff } from './helpers';

/** The on-screen size of the text of the arrow that the last step used: its font size times the zoom. */
async function currentArrowTextPx(page: Page) {
  const fontSize = await page.locator('[data-edge][data-current] text').first().evaluate((text) => parseFloat(getComputedStyle(text).fontSize));
  return fontSize * (await diagramZoom(page));
}

/** The view of the diagram after two animation frames: React Flow has drawn the last change by then. */
async function viewSoon(page: Page) {
  return page.evaluate(
    () =>
      new Promise<string>((resolve) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => resolve(getComputedStyle(document.querySelector('.react-flow__viewport') ?? document.body).transform)),
        ),
      ),
  );
}

test.describe('the state diagram of the 2016 machine at 1440 px', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openSimulator(page);
    await pickExample(page, 'TCC machine (2016)');
  });

  test('follows the run, and the arrow text of the last step is at least 11 px on screen', async ({ page }) => {
    const follow = page.getByRole('button', { name: 'Follow the run' });
    await expect(follow).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Step', exact: true }).click();
    await expect.poll(() => currentArrowTextPx(page)).toBeGreaterThanOrEqual(11);
    // The arrow and the current state are inside the panel.
    const panel = await page.getByTestId('state-diagram').boundingBox();
    const label = await page.locator('[data-edge][data-current] text').first().boundingBox();
    if (panel === null || label === null) throw new Error('the panel or the arrow text is not on the page');
    expect(label.x).toBeGreaterThanOrEqual(panel.x);
    expect(label.x + label.width).toBeLessThanOrEqual(panel.x + panel.width);
    expect(await statesCutOff(page, 'q1')).toBe(0);
  });

  test('Whole machine shows all 15 states inside the panel, and "Follow the run" follows again', async ({ page }) => {
    const follow = page.getByRole('button', { name: 'Follow the run' });
    await page.getByRole('button', { name: 'Whole machine' }).click();
    await expect(follow).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('.react-flow__node')).toHaveCount(15);
    await expect.poll(() => statesCutOff(page)).toBe(0);
    await follow.click();
    await expect(follow).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => diagramZoom(page)).toBeCloseTo(1.1, 2);
  });

  test('Zoom in and Zoom out change the zoom and stop following; Reset follows again', async ({ page }) => {
    const follow = page.getByRole('button', { name: 'Follow the run' });
    await expect.poll(() => diagramZoom(page)).toBeCloseTo(1.1, 2);
    await page.getByRole('button', { name: 'Zoom out' }).click();
    await expect(follow).toHaveAttribute('aria-pressed', 'false');
    await expect.poll(() => diagramZoom(page)).toBeCloseTo(1.1 / 1.2, 2);
    await page.getByRole('button', { name: 'Zoom in' }).click();
    await expect.poll(() => diagramZoom(page)).toBeCloseTo(1.1, 2);
    await page.getByRole('button', { name: 'Zoom in' }).click();
    await expect.poll(() => diagramZoom(page)).toBeCloseTo(1.1 * 1.2, 2);
    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(follow).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => diagramZoom(page)).toBeCloseTo(1.1, 2);
  });

  test('while the machine has errors, it shows the whole machine with every arrow and its text; then it follows again', async ({ page }) => {
    const follow = page.getByRole('button', { name: 'Follow the run' });
    await expect(follow).toHaveAttribute('aria-pressed', 'true');
    // An empty read and write is an error, so the machine has no run and no current state.
    await page.getByRole('button', { name: 'Add a rule' }).click();
    await expect(page.locator('[data-faded]')).toHaveCount(0);
    await expect(page.locator('[data-edge] text')).toHaveCount(await page.locator('[data-edge]').count());
    await expect(page.locator('.react-flow__node')).toHaveCount(15);
    await expect.poll(() => statesCutOff(page)).toBe(0);
    // "Follow the run" hides, as for a machine that never follows: there is nothing to follow.
    await expect(follow).toHaveCount(0);

    await page.getByRole('button', { name: /^Delete rule \d+$/ }).last().click();
    await expect(follow).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => page.locator('[data-faded]').count()).toBeGreaterThan(20);
    await expect.poll(() => diagramZoom(page)).toBeCloseTo(1.1, 2);
  });

  test('with reduced motion, the view jumps to the next state instead of sliding', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const before = await viewSoon(page);
    await page.getByRole('button', { name: 'Step', exact: true }).click();
    const soon = await viewSoon(page);
    await page.waitForTimeout(500);
    expect(soon).not.toBe(before);
    expect(soon).toBe(await viewSoon(page));
  });
});

test('Binary +1 shows the whole machine as today, with no "Follow the run"', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openSimulator(page);
  await expect(page.getByRole('button', { name: 'Whole machine' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Follow the run' })).toHaveCount(0);
  await expect.poll(() => diagramZoom(page)).toBeCloseTo(1.1, 2);
  expect(await statesCutOff(page)).toBe(0);
  // Rules that write what they read and share a move join into one label.
  await expect(diagramEdge(page, 'q0', 'q0')).toContainText('0 1 → R');
});

test('at 390 px, the arrow of the last step is drawn over the others, and its text is inside the panel', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await openSimulator(page);
  await pickExample(page, 'TCC machine (2016)');
  await page.getByRole('button', { name: 'Step', exact: true }).click();
  // React Flow draws the edges in their order, so the last one is on top.
  await expect(page.locator('[data-edge]').last()).toHaveAttribute('data-current', 'true');
  const textInside = () =>
    page.getByTestId('state-diagram').evaluate((panel) => {
      const box = panel.getBoundingClientRect();
      const text = panel.querySelector('[data-edge][data-current] text')?.getBoundingClientRect();
      return text !== undefined && text.left >= box.left && text.right <= box.right && text.top >= box.top && text.bottom <= box.bottom;
    });
  await expect.poll(textInside).toBe(true);
  // While the view slides, the zoom passes below its end value, so wait for the end.
  await expect.poll(() => currentArrowTextPx(page)).toBeGreaterThanOrEqual(11);
});

test('while following, only the arrows that leave the current state keep their text; Whole machine shows it all', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openSimulator(page);
  await pickExample(page, 'TCC machine (2016)');
  await page.getByRole('button', { name: 'Step', exact: true }).click();
  await expect(diagramState(page, 'q1').locator('[data-current]')).toHaveCount(1);
  // q1 has 7 arrows that leave it. The arrow of the last step, q0→q1, keeps its red text too.
  await expect(page.locator('[data-edge^="q1→"] text')).toHaveCount(7);
  await expect(page.locator('[data-edge][data-current] text')).toHaveCount(1);
  const others = page.locator('[data-edge]:not([data-edge^="q1→"]):not([data-current])');
  expect(await others.count()).toBeGreaterThan(20);
  await expect(others.locator('text')).toHaveCount(0);
  await expect(others.first()).toHaveAttribute('data-faded', 'true');

  await page.getByRole('button', { name: 'Whole machine' }).click();
  await expect(page.locator('[data-faded]')).toHaveCount(0);
  await expect(page.locator('[data-edge] text')).toHaveCount(await page.locator('[data-edge]').count());
});
