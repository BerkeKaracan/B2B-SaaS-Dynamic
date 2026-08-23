/**
 * E2E fixture IDs and credentials — set in shell or `.env.e2e` (see `.env.example`).
 * Tests skip automatically when required vars for that file are missing.
 */

export type E2ECredentials = {
  email: string;
  password: string;
};

export type E2EConfig = {
  tenantId: string;
  employee: E2ECredentials;
  editor: E2ECredentials;
  viewer: E2ECredentials;
  admin: E2ECredentials;
  privateProjectId: string;
  openProjectId: string;
  timelineProjectId: string;
  kanbanProjectId: string;
  collabCanvasProjectId: string;
  viewerDeniedProjectId?: string;
  publicShareProjectId: string;
  inviteTargetEmail: string;
};

function cred(prefix: string): E2ECredentials | null {
  const email = process.env[`E2E_${prefix}_EMAIL`];
  const password = process.env[`E2E_${prefix}_PASSWORD`];
  if (!email || !password) return null;
  return { email, password };
}

export function missingEnvVars(keys: string[]): string[] {
  return keys.filter((k) => !process.env[k]?.trim());
}

export function loadEmployeeConfig(): Pick<
  E2EConfig,
  | 'tenantId'
  | 'employee'
  | 'privateProjectId'
  | 'openProjectId'
  | 'timelineProjectId'
  | 'kanbanProjectId'
> | null {
  const missing = missingEnvVars([...EMPLOYEE_ENV_KEYS]);
  if (missing.length) return null;
  const employee = cred('EMPLOYEE');
  if (!employee) return null;
  return {
    tenantId: process.env.E2E_TENANT_ID!,
    employee,
    privateProjectId: process.env.E2E_PRIVATE_PROJECT_ID!,
    openProjectId: process.env.E2E_OPEN_PROJECT_ID!,
    timelineProjectId: process.env.E2E_TIMELINE_PROJECT_ID!,
    kanbanProjectId: process.env.E2E_KANBAN_PROJECT_ID!,
  };
}

export function loadCanvasConfig(): Pick<
  E2EConfig,
  'tenantId' | 'editor' | 'viewer' | 'collabCanvasProjectId' | 'viewerDeniedProjectId'
> | null {
  const missing = missingEnvVars([...CANVAS_ENV_KEYS]);
  if (missing.length) return null;
  const editor = cred('EDITOR');
  const viewer = cred('VIEWER');
  if (!editor || !viewer) return null;
  return {
    tenantId: process.env.E2E_TENANT_ID!,
    editor,
    viewer,
    collabCanvasProjectId: process.env.E2E_COLLAB_CANVAS_PROJECT_ID!,
    viewerDeniedProjectId: process.env.E2E_VIEWER_DENIED_PROJECT_ID,
  };
}

export function loadPublicShareConfig(): Pick<E2EConfig, 'publicShareProjectId'> | null {
  if (missingEnvVars([...PUBLIC_SHARE_ENV_KEYS]).length) return null;
  return { publicShareProjectId: process.env.E2E_PUBLIC_SHARE_PROJECT_ID! };
}

export type TeamInviteE2EConfig = Pick<
  E2EConfig,
  'tenantId' | 'admin' | 'inviteTargetEmail'
>;

export function loadTeamInviteConfig(): TeamInviteE2EConfig | null {
  const missing = missingEnvVars([...TEAM_INVITE_ENV_KEYS]);
  if (missing.length) return null;
  const admin = cred('ADMIN');
  if (!admin) return null;
  return {
    tenantId: process.env.E2E_TENANT_ID!,
    admin,
    inviteTargetEmail: process.env.E2E_INVITE_TARGET_EMAIL!,
  };
}

export const EMPLOYEE_ENV_KEYS = [
  'E2E_TENANT_ID',
  'E2E_EMPLOYEE_EMAIL',
  'E2E_EMPLOYEE_PASSWORD',
  'E2E_PRIVATE_PROJECT_ID',
  'E2E_OPEN_PROJECT_ID',
  'E2E_TIMELINE_PROJECT_ID',
  'E2E_KANBAN_PROJECT_ID',
] as const;

export const CANVAS_ENV_KEYS = [
  'E2E_TENANT_ID',
  'E2E_EDITOR_EMAIL',
  'E2E_EDITOR_PASSWORD',
  'E2E_VIEWER_EMAIL',
  'E2E_VIEWER_PASSWORD',
  'E2E_COLLAB_CANVAS_PROJECT_ID',
] as const;

export const PUBLIC_SHARE_ENV_KEYS = ['E2E_PUBLIC_SHARE_PROJECT_ID'] as const;

export const TEAM_INVITE_ENV_KEYS = [
  'E2E_TENANT_ID',
  'E2E_ADMIN_EMAIL',
  'E2E_ADMIN_PASSWORD',
  'E2E_INVITE_TARGET_EMAIL',
] as const;
