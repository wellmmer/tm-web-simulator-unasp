import { expect, test } from '@playwright/test';
import { diagramEdge, diagramState, openSimulator, runFast } from './helpers';

test.describe('editing', () => {
  test('lights the same rule in the table, the diagram and the head', async ({ page }) => {
    await openSimulator(page);
    await page.getByRole('button', { name: 'Step', exact: true }).click();
    await expect(page.locator('tr[aria-current="true"]')).toHaveAttribute('data-rule', '2');
    await expect(diagramEdge(page, 'q0', 'q0')).toHaveAttribute('data-current', 'true');
    await expect(diagramState(page, 'q0').locator('[data-current]')).toHaveCount(1);
    await expect(page.getByTestId('head-state')).toHaveText('q0');
  });

  test('an edited rule changes the diagram and the result', async ({ page }) => {
    await openSimulator(page);
    await expect(diagramEdge(page, 'q1', 'qA')).toContainText('0→1,S');
    await page.getByRole('textbox', { name: 'Rule 5: then go to' }).fill('qR');
    await expect(diagramEdge(page, 'q1', 'qR')).toContainText('0→1,S');
    await expect(diagramEdge(page, 'q1', 'qA')).not.toContainText('0→1,S');
    await expect(diagramState(page, 'qR')).toBeVisible();
    await expect(await runFast(page)).toHaveText('Rejected: the machine reached qR after 8 steps.');
  });

  test('a duplicate rule turns red and turns off Run until it is fixed', async ({ page }) => {
    await openSimulator(page);
    await page.getByRole('textbox', { name: 'Rule 2: and reading' }).fill('0');
    await expect(page.getByText('Two rules for q0 reading 0. A Turing machine needs exactly one.', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Run' })).toBeDisabled();
    await page.getByRole('textbox', { name: 'Rule 2: and reading' }).fill('1');
    await expect(page.getByRole('button', { name: 'Run' })).toBeEnabled();
  });

  test('opens a 2016 .txt file and runs it', async ({ page }) => {
    await openSimulator(page);
    await page.locator('summary', { hasText: 'Machine file' }).click();
    await page.getByTestId('open-file').setInputFiles('examples/example.txt');
    await expect(page.getByText('Opened example.')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('example');
    await expect(await runFast(page)).toHaveText('Accepted after 71 steps. The tape now reads _WYZX_WYZX_.');
  });

  test('downloads the machine as <name>.json', async ({ page }) => {
    await openSimulator(page);
    await page.locator('summary', { hasText: 'Machine file' }).click();
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download' }).click();
    expect((await download).suggestedFilename()).toBe('Binary +1.json');
  });
});
