import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('patterns page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('lists the patterns', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Patterns' })).toBeVisible();
    await expect(page.locator('pb-pattern-card')).toHaveCount(2);
  });

  test('has no WCAG 2.1 AA violations', async ({ page }) => {
    await expect(page.locator('pb-pattern-card').first()).toBeVisible();
    const scan = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(scan.violations).toStrictEqual([]);
  });
});
