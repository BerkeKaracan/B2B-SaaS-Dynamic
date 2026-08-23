import { test, expect } from '@playwright/test';

test.describe('Production smoke (optional)', () => {
  test.beforeEach(({ }, testInfo) => {
    const url = process.env.E2E_PRODUCTION_URL?.trim();
    if (!url || url.includes('your-app.vercel.app')) {
      testInfo.skip(true, 'Set E2E_PRODUCTION_URL to a real deployed app URL');
    }
  });

  test('login page renders on deployed app', async ({ page }) => {
    const url = process.env.E2E_PRODUCTION_URL!.replace(/\/$/, '');

    await page.goto(`${url}/login`);
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByPlaceholder('name@company.com')).toBeVisible();
  });
});
