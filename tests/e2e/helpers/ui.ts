import type { Page } from '@playwright/test';
import type { E2ECredentials } from './env';
import { loginViaUi } from './auth';

export type GotoAppOptions = {
  reauth?: { credentials: E2ECredentials; tenantId: string };
};

/** Dismiss cookie consent banner when it blocks interactions. */
export async function dismissCookieBanner(page: Page): Promise<void> {
  const accept = page.getByRole('button', { name: 'Accept All' });
  for (let i = 0; i < 3; i++) {
    if (!(await accept.isVisible({ timeout: 1_500 }).catch(() => false))) {
      return;
    }
    await accept.click();
    await page.waitForTimeout(300);
  }
}

/** Navigate and clear cookie overlay so clicks reach the app. */
export async function gotoApp(
  page: Page,
  url: string,
  options?: GotoAppOptions
): Promise<void> {
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  if (page.url().includes('/login') && options?.reauth) {
    const { credentials, tenantId } = options.reauth;
    await loginViaUi(page, credentials, tenantId);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  await dismissCookieBanner(page);
}
