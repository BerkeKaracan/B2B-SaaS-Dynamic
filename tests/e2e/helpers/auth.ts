import { expect, type Page } from '@playwright/test';
import type { E2ECredentials } from './env';

/**
 * Login via BFF, establish HttpOnly session cookie, open dashboard.
 * Avoids `/login` — that page subdomain-hops and breaks on Windows (*.localhost).
 */
export async function loginViaUi(
  page: Page,
  { email, password }: E2ECredentials,
  tenantId: string
): Promise<void> {
  const res = await page.request.post('/api/backend/auth/login', {
    data: { email, password },
  });

  if (!res.ok()) {
    const detail = await res.text();
    throw new Error(
      `Login API failed for ${email} (${res.status()}): ${detail.slice(0, 300)}`
    );
  }

  const body = (await res.json()) as {
    mfa_required?: boolean;
    tenant_id?: string;
    access_token?: string;
  };

  if (body.mfa_required) {
    throw new Error(
      `Account ${email} requires MFA — re-run npm run test:e2e:setup with MFA-off users.`
    );
  }

  if (!body.access_token) {
    throw new Error(`Login response missing access_token for ${email}`);
  }

  const targetTenant = body.tenant_id || tenantId;

  const sessionRes = await page.request.post('/api/session', {
    data: { access_token: body.access_token },
  });
  if (!sessionRes.ok()) {
    const err = await sessionRes.text();
    throw new Error(`POST /api/session failed: ${err}`);
  }

  const baseUrl = (process.env.E2E_BASE_URL || 'http://localhost:3000').replace(
    /\/$/,
    ''
  );
  await page.context().addCookies([
    {
      name: 'tenant_id',
      value: targetTenant,
      url: baseUrl,
      sameSite: 'Lax',
    },
  ]);

  await page.goto(`/dashboard/${targetTenant}/projects`);
  await expect(page).toHaveURL(new RegExp(`/dashboard/${targetTenant}`), {
    timeout: 45_000,
  });
}

export async function openTeamFromSettings(
  page: Page,
  tenantId: string
): Promise<void> {
  await page.goto(`/dashboard/${tenantId}/team`);
  await expect(page).toHaveURL(new RegExp(`/dashboard/${tenantId}/team`));
  await expect(page.getByRole('heading', { name: 'Team', level: 1 })).toBeVisible();
}
