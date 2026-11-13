import { expect, test, type Page } from '@playwright/test';
import { LOCALE_PATHS } from './helpers';

/** The part each step spotlights, by its data-tour mark, in the order of the tour. */
const TARGETS = ['tape', 'head', 'sentence', 'controls', 'rules', 'diagram', 'keys'];

/** The control on the page that a step asks the visitor to use: Run on "The controls", the Example list on "Keyboard and examples". */
const CONTROLS: Record<string, string> = {
  controls: '[data-tour="controls"] button[aria-keyshortcuts="Space"]',
  keys: '[data-tour="keys"] select',
};

/**
 * What the visitor sees of a step: "ok" when the spotlighted part sits fully above the tour panel.
 * A part taller than the space above the panel must start at the top of the window, with the
 * control to press fully above the panel. Anything else says where the part and the panel are.
 */
function visibility(page: Page, target: string) {
  return page.evaluate(
    ({ target, control }) => {
      const panel = document.querySelector('[role="dialog"]')?.getBoundingClientRect();
      const part = (document.querySelector(`[data-tour="${target}"]`) ?? document.querySelector('[data-tour="tape"]'))?.getBoundingClientRect();
      if (panel === undefined || part === undefined) return 'no panel or no part';
      const button = control === undefined ? undefined : document.querySelector(control)?.getBoundingClientRect();
      const controlShown = button === undefined || (button.top >= 0 && button.bottom <= panel.top);
      const fits = part.top >= 0 && part.bottom <= panel.top;
      const tall = part.height > panel.top && part.top >= -1 && part.top < panel.top;
      if ((fits || tall) && controlShown) return 'ok';
      return `part ${Math.round(part.top)}–${Math.round(part.bottom)}, control ${button === undefined ? 'none' : `${Math.round(button.top)}–${Math.round(button.bottom)}`}, panel from ${Math.round(panel.top)}`;
    },
    { target, control: CONTROLS[target] },
  );
}

test.describe('the tour on a phone (spec 5.5)', () => {
  test.use({ viewport: { width: 390, height: 664 } });

  for (const locale of LOCALE_PATHS) {
    test(`in ${locale}, the panel never covers the spotlighted part or the control to press`, async ({ page }) => {
      await page.goto(`${locale}/simulator`);
      await expect(page.locator('.react-flow__node').first()).toBeVisible();
      await page.locator('[data-tour-button]').click();
      const panel = page.locator('[role="dialog"]');
      const title = panel.getByRole('heading', { level: 2 });
      for (const [index, target] of TARGETS.entries()) {
        await expect.poll(() => visibility(page, target), { message: `step ${index + 1}, ${target}` }).toBe('ok');
        if (index === TARGETS.length - 1) break;
        // The last button of the panel is Next. Wait for the next step's title.
        const shown = await title.textContent();
        await panel.locator('button').last().click();
        await expect(title).not.toHaveText(shown ?? '');
      }
    });
  }
});
