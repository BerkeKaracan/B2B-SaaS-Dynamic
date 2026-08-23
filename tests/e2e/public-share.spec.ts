import { test, expect } from '@playwright/test';
import {
  loadPublicShareConfig,
  missingEnvVars,
  PUBLIC_SHARE_ENV_KEYS,
} from './helpers/env';
import { publicShare } from './helpers/routes';

test.describe('Public share — logged-out visitor', () => {
  test.beforeEach(({ }, testInfo) => {
    const missing = missingEnvVars([...PUBLIC_SHARE_ENV_KEYS]);
    if (missing.length) {
      testInfo.skip(
        true,
        `Set env vars: ${missing.join(', ')} (see .env.example E2E section)`
      );
    }
  });

  test('anonymous user opens share link and sees readonly canvas shell', async ({
    browser,
  }) => {
    const cfg = loadPublicShareConfig()!;

    // Fresh context: no cookies, no localStorage session.
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      const publicApi = page.waitForResponse(
        (res) =>
          res.url().includes(`public/records/${cfg.publicShareProjectId}`) &&
          res.request().method() === 'GET' &&
          res.ok(),
        { timeout: 45_000 }
      );

      await page.goto(publicShare(cfg.publicShareProjectId));

      await publicApi;

      await expect(page.getByText('Public share', { exact: true })).toBeVisible({
        timeout: 30_000,
      });
      await expect(page.getByText('View Only')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Log in to Clone' })).toBeVisible();
      await expect(page.getByText('Access Restricted')).toHaveCount(0);

      // Canvas toolbar: zoom control renders when the project loaded.
      await expect(page.getByText(/\d+%/)).toBeVisible({ timeout: 45_000 });
    } finally {
      await context.close();
    }
  });
});
