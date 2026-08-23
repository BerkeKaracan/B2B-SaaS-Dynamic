import { test, expect } from '@playwright/test';
import { authStorage } from './helpers/storage';
import {
  CANVAS_ENV_KEYS,
  loadCanvasConfig,
  missingEnvVars,
} from './helpers/env';
import { projectCanvas } from './helpers/routes';

test.describe('Canvas — editor vs viewer (dual browser context)', () => {
  test.beforeEach(({}, testInfo) => {
    const missing = missingEnvVars([...CANVAS_ENV_KEYS]);
    if (missing.length) {
      testInfo.skip(
        true,
        `Set env vars: ${missing.join(', ')} (see .env.example E2E section)`
      );
    }
  });

  test('editor can edit; viewer cannot write on the same canvas project', async ({
    browser,
  }) => {
    const cfg = loadCanvasConfig()!;
    const projectUrl = projectCanvas(cfg.tenantId, cfg.collabCanvasProjectId);

    const editorContext = await browser.newContext({
      storageState: authStorage('editor'),
    });
    const viewerContext = await browser.newContext({
      storageState: authStorage('viewer'),
    });

    const editorPage = await editorContext.newPage();
    const viewerPage = await viewerContext.newPage();

    try {
      // --- Editor: design mode shows write affordances ---
      await editorPage.goto(projectUrl);
      await editorPage.getByRole('button', { name: 'Edit' }).click();
      await expect(editorPage.getByTitle('Undo')).toBeVisible({
        timeout: 45_000,
      });

      // --- Viewer: may open for VIEW but has no write toolbar in View mode ---
      await viewerPage.goto(projectUrl);
      await viewerPage
        .getByRole('button', { name: 'View', exact: true })
        .click();
      await expect(viewerPage.getByTitle('Undo')).toHaveCount(0);

      // Server RBAC must reject viewer PATCH (use BFF path + authed request context).
      const patchRes = await viewerPage.request.patch(
        `/api/backend/records/${cfg.collabCanvasProjectId}`,
        {
          data: {
            record_data: { name: `viewer-probe-${Date.now()}` },
          },
        }
      );
      expect(patchRes.status()).toBe(403);

      await viewerPage
        .getByRole('button', { name: 'View', exact: true })
        .click();
      await expect(viewerPage.getByTitle('Undo')).toHaveCount(0);
    } finally {
      await editorContext.close();
      await viewerContext.close();
    }
  });

  test('viewer without grant gets 403 on private project API', async ({
    browser,
  }) => {
    const cfg = loadCanvasConfig()!;
    test.skip(
      !cfg.viewerDeniedProjectId,
      'Set E2E_VIEWER_DENIED_PROJECT_ID for denied-access check'
    );

    const viewerContext = await browser.newContext({
      storageState: authStorage('viewer'),
    });
    const viewerPage = await viewerContext.newPage();

    try {
      const getRes = await viewerPage.request.get(
        `/api/backend/records/${cfg.viewerDeniedProjectId}`
      );
      expect(getRes.status()).toBe(403);

      await viewerPage.goto(
        projectCanvas(cfg.tenantId, cfg.viewerDeniedProjectId!)
      );
      await expect(
        viewerPage.getByText(
          'You do not have permission to access this project.'
        )
      ).toBeVisible({ timeout: 30_000 });
    } finally {
      await viewerContext.close();
    }
  });
});
