import { test, expect } from '@playwright/test';
import { authStorage } from './helpers/storage';
import { gotoApp } from './helpers/ui';
import {
  loadTeamInviteConfig,
  missingEnvVars,
  TEAM_INVITE_ENV_KEYS,
} from './helpers/env';

test.describe('Settings → Team invite flow', () => {
  test.use({ storageState: authStorage('admin') });

  test.beforeEach(({ }, testInfo) => {
    const missing = missingEnvVars([...TEAM_INVITE_ENV_KEYS]);
    if (missing.length) {
      testInfo.skip(
        true,
        `Set env vars: ${missing.join(', ')} (see .env.example E2E section)`
      );
    }
  });

  test('admin invites a teammate from the Team UI', async ({ page }) => {
    const cfg = loadTeamInviteConfig()!;
    const inviteEmail = cfg.inviteTargetEmail;

    await gotoApp(page, `/dashboard/${cfg.tenantId}/team`);
    await expect(page.getByRole('heading', { name: 'Team', level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Invite a teammate' })).toBeVisible();

    await page.getByPlaceholder('colleague@company.com').fill(inviteEmail);
    await page.getByPlaceholder('Add a personal message...').fill(
      'Playwright E2E invite probe'
    );

    const [inviteResponse] = await Promise.all([
      page.waitForResponse(
        (res) =>
          res.url().includes(`tenants/${cfg.tenantId}/team`) &&
          res.request().method() === 'POST',
        { timeout: 60_000 }
      ),
      page.getByRole('button', { name: 'Send invite' }).click(),
    ]);

    expect(
      inviteResponse.ok(),
      `Invite failed (${inviteResponse.status()}): ${await inviteResponse.text()}`
    ).toBeTruthy();

    // Success toast clears after 4s; form reset + roster refresh are stable signals.
    await expect(page.getByPlaceholder('colleague@company.com')).toHaveValue('');
    await expect(page.getByText(inviteEmail, { exact: false })).toBeVisible({
      timeout: 20_000,
    });
  });
});
