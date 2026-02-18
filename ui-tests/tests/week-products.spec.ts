import { expect, test } from '@playwright/test';

test('week products block is visible', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByTestId('week-products')).toBeVisible();
});
