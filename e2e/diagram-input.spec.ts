import { expect, test, type CDPSession, type Page } from '@playwright/test';
import { diagramZoom, openSimulator, pickExample } from './helpers';

const scrollTop = (page: Page) => page.evaluate(() => window.scrollY);
const view = (page: Page) => page.locator('.react-flow__viewport').evaluate((viewport) => getComputedStyle(viewport).transform);

/** The diagram panel on screen and its middle. */
async function panel(page: Page) {
  const box = await page.getByTestId('state-diagram').boundingBox();
  if (box === null) throw new Error('the diagram is not on the page');
  return { ...box, middleX: box.x + box.width / 2, middleY: box.y + box.height / 2 };
}

/** Waits one animation frame, so React has drawn the last key press. */
const nextFrame = (page: Page) => page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));

test.describe('mouse and wheel over the 2016 machine at 1440 px', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openSimulator(page);
    await pickExample(page, 'TCC machine (2016)');
    await expect.poll(() => diagramZoom(page)).toBeCloseTo(1.1, 2);
  });

  test('the plain wheel over the diagram scrolls the page and keeps the zoom', async ({ page }) => {
    const { middleX, middleY } = await panel(page);
    await page.mouse.move(middleX, middleY);
    await page.mouse.wheel(0, 300);
    await expect.poll(() => scrollTop(page)).toBeGreaterThan(0);
    expect(await diagramZoom(page)).toBeCloseTo(1.1, 2);
    await expect(page.getByRole('button', { name: 'Follow the run' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('Ctrl and the wheel zoom the diagram, stop following, and do not scroll the page', async ({ page }) => {
    const { middleX, middleY } = await panel(page);
    await page.mouse.move(middleX, middleY);
    await page.keyboard.down('Control');
    await page.mouse.wheel(0, -200);
    await page.keyboard.up('Control');
    await expect.poll(() => diagramZoom(page)).toBeGreaterThan(1.2);
    await expect(page.getByRole('button', { name: 'Follow the run' })).toHaveAttribute('aria-pressed', 'false');
    expect(await scrollTop(page)).toBe(0);
  });

  test('⌘ and the wheel zoom the diagram', async ({ page }) => {
    const { middleX, middleY } = await panel(page);
    await page.mouse.move(middleX, middleY);
    await page.keyboard.down('Meta');
    await nextFrame(page);
    await page.mouse.wheel(0, -200);
    await page.keyboard.up('Meta');
    await expect.poll(() => diagramZoom(page)).toBeGreaterThan(1.2);
    expect(await scrollTop(page)).toBe(0);
  });

  test('a drag moves the diagram and stops following, and a click does not', async ({ page }) => {
    const follow = page.getByRole('button', { name: 'Follow the run' });
    const { x, y } = await panel(page);
    await page.mouse.click(x + 20, y + 20);
    await expect(follow).toHaveAttribute('aria-pressed', 'true');
    const before = await view(page);
    await page.mouse.move(x + 20, y + 20);
    await page.mouse.down();
    await page.mouse.move(x + 120, y + 70, { steps: 5 });
    await page.mouse.up();
    await expect(follow).toHaveAttribute('aria-pressed', 'false');
    expect(await view(page)).not.toBe(before);
  });
});

test.describe('touch over the 2016 machine at 390 px', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  /** Sends one touch event with a finger at each point. Playwright has no multi-touch, so this uses the Chrome DevTools Protocol. */
  const touch = (cdp: CDPSession, type: 'touchStart' | 'touchMove' | 'touchEnd', points: [number, number][]) =>
    cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points.map(([x, y], id) => ({ x, y, id })) });

  test.beforeEach(async ({ page }) => {
    await openSimulator(page);
    await pickExample(page, 'TCC machine (2016)');
    // The diagram in the middle of the screen, so the page can scroll both ways.
    await page.getByTestId('state-diagram').evaluate((diagram) => diagram.scrollIntoView({ block: 'center' }));
    await expect(page.getByRole('button', { name: 'Follow the run' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('one finger on the diagram scrolls the page and leaves the diagram where it is', async ({ page, context }) => {
    const cdp = await context.newCDPSession(page);
    const { x, y } = await panel(page);
    const top = await scrollTop(page);
    const before = await view(page);
    await touch(cdp, 'touchStart', [[x + 15, y + 30]]);
    for (let i = 1; i <= 10; i++) await touch(cdp, 'touchMove', [[x + 15, y + 30 + 15 * i]]);
    await touch(cdp, 'touchEnd', []);
    await expect.poll(() => scrollTop(page)).toBeLessThan(top - 100);
    expect(await view(page)).toBe(before);
    await expect(page.getByRole('button', { name: 'Follow the run' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('two fingers zoom and move the diagram, stop following, and the page stays where it is', async ({ page, context }) => {
    const cdp = await context.newCDPSession(page);
    const { middleX, middleY } = await panel(page);
    const top = await scrollTop(page);
    const zoom = await diagramZoom(page);
    await touch(cdp, 'touchStart', [
      [middleX - 20, middleY],
      [middleX + 20, middleY],
    ]);
    for (let i = 1; i <= 10; i++) {
      await touch(cdp, 'touchMove', [
        [middleX - 20 - 6 * i, middleY + 3 * i],
        [middleX + 20 + 6 * i, middleY + 3 * i],
      ]);
    }
    await touch(cdp, 'touchEnd', []);
    await expect.poll(() => diagramZoom(page)).toBeGreaterThan(zoom * 1.5);
    await expect(page.getByRole('button', { name: 'Follow the run' })).toHaveAttribute('aria-pressed', 'false');
    expect(await scrollTop(page)).toBe(top);
  });
});
