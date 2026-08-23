import { chromium, type FullConfig } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { loginViaUi } from './helpers/auth';
import {
  loadCanvasConfig,
  loadEmployeeConfig,
  loadTeamInviteConfig,
} from './helpers/env';

const AUTH_DIR = path.join(__dirname, '.auth');

async function saveSession(
  role: string,
  email: string,
  password: string,
  tenantId: string,
  baseURL: string
): Promise<void> {
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();
  try {
    await loginViaUi(page, { email, password }, tenantId);
    const base = baseURL.replace(/\/$/, '');
    await context.addCookies([
      {
        name: 'cookie_consent',
        value: 'true',
        url: base,
        sameSite: 'Lax',
      },
    ]);
    fs.mkdirSync(AUTH_DIR, { recursive: true });
    await context.storageState({ path: path.join(AUTH_DIR, `${role}.json`) });
  } finally {
    await browser.close();
  }
}

export default async function globalSetup(_config: FullConfig): Promise<void> {
  const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';
  process.env.E2E_BASE_URL = baseURL;

  const employeeCfg = loadEmployeeConfig();
  const canvasCfg = loadCanvasConfig();
  const adminCfg = loadTeamInviteConfig();

  if (!employeeCfg) {
    console.warn('[e2e] Skipping auth bootstrap — run npm run test:e2e:setup first.');
    return;
  }

  const tenantId = employeeCfg.tenantId;
  const password = employeeCfg.employee.password;

  const sessions: Array<{ role: string; email: string }> = [
    { role: 'employee', email: employeeCfg.employee.email },
  ];

  if (canvasCfg) {
    sessions.push(
      { role: 'editor', email: canvasCfg.editor.email },
      { role: 'viewer', email: canvasCfg.viewer.email }
    );
  }

  if (adminCfg) {
    sessions.push({ role: 'admin', email: adminCfg.admin.email });
  }

  for (const { role, email } of sessions) {
    const out = path.join(AUTH_DIR, `${role}.json`);
    if (fs.existsSync(out)) {
      fs.unlinkSync(out);
    }
    console.log(`[e2e] Bootstrapping session ${role}…`);
    await saveSession(role, email, password, tenantId, baseURL);
    // Backend login limiter is 5/minute — stay under when seeding 4 users.
    await new Promise((r) => setTimeout(r, 13_000));
  }
}
