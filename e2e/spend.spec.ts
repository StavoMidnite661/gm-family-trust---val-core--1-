import { test, expect } from '@playwright/test';

test('spend button creates a successful transaction', async ({ page }) => {
  // Navigate to the frontend application
  await page.goto('http://localhost:5173/');

  // Fill out the form
  await page.fill('input[name="amount"]', '100');
  await page.fill('input[name="description"]', 'E2E Test');

  // Click the spend button
  await page.click('button:has-text("Spend")');

  // Wait for the success message to appear
  const successLocator = page.locator('text=Success');
  await successLocator.waitFor({ state: 'visible', timeout: 10000 });

  // Assert that the success message is visible
  await expect(successLocator).toBeVisible();
});
