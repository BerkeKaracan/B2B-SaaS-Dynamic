import { test, expect } from '@playwright/test';
import { authStorage } from './helpers/storage';
import { EMPLOYEE_ENV_KEYS, loadEmployeeConfig, missingEnvVars } from './helpers/env';
import {
  myTasks,
  projectCanvas,
  projectCardLink,
  projectsList,
} from './helpers/routes';
import { dismissCookieBanner, gotoApp } from './helpers/ui';

test.describe('Employee RBAC — projects, timeline, task sync', () => {
  test.use({ storageState: authStorage('employee') });

  test.beforeEach(({ }, testInfo) => {
    const missing = missingEnvVars([...EMPLOYEE_ENV_KEYS]);
    if (missing.length) {
      testInfo.skip(
        true,
        `Set env vars: ${missing.join(', ')} (see .env.example E2E section)`
      );
    }
  });

  test('employee sees allowed projects, timeline, and synced tasks', async ({
    page,
  }) => {
    const cfg = loadEmployeeConfig()!;
    const reauth = { credentials: cfg.employee, tenantId: cfg.tenantId };

    await gotoApp(page, projectsList(cfg.tenantId), { reauth });
    await expect(page.locator(projectCardLink(cfg.privateProjectId))).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.locator(projectCardLink(cfg.openProjectId))).toBeVisible();

    // --- Timeline board loads (standalone template) ---
    await gotoApp(page, projectCanvas(cfg.tenantId, cfg.timelineProjectId), { reauth });
    await expect(page.getByRole('button', { name: 'Add Event' }).first()).toBeVisible({
      timeout: 60_000,
    });

    // --- Kanban: create task → backend sync ---
    const taskTitle = `E2E task ${Date.now()}`;

    await gotoApp(page, projectCanvas(cfg.tenantId, cfg.kanbanProjectId), { reauth });
    await expect(
      page.getByRole('heading', { name: 'TO DO', level: 3 })
    ).toBeVisible({ timeout: 45_000 });

    await page.getByRole('button', { name: 'Add Task' }).first().click();
    await expect(page.getByRole('heading', { name: 'Add New Task' })).toBeVisible();

    await page.locator('form input[type="text"]').first().fill(taskTitle);
    await page.getByPlaceholder('Search user...').fill(cfg.employee.email);

    const [syncResponse] = await Promise.all([
      page.waitForResponse(
        (res) =>
          res.url().includes('/tasks/sync') &&
          res.request().method() === 'POST',
        { timeout: 45_000 }
      ),
      page.getByRole('button', { name: 'Create' }).click(),
    ]);
    expect(
      syncResponse.ok(),
      `Task sync failed (${syncResponse.status()}): ${await syncResponse.text()}`
    ).toBeTruthy();

    await expect(page.getByRole('heading', { name: taskTitle, level: 4 })).toBeVisible({
      timeout: 15_000,
    });

    // --- My Tasks reflects the synced row ---
    await gotoApp(page, myTasks(cfg.tenantId), { reauth });
    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 30_000 });
  });
});
