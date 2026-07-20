/**
 * Platform-level admin (site owner) — distinct from workspace admin/owner roles.
 * PLATFORM_ADMIN_EMAILS: comma-separated allow-list (server env, not NEXT_PUBLIC).
 */
const DEFAULT_ADMIN_EMAILS = 'berkekaracan1113@gmail.com';

export function platformAdminEmails(): string[] {
  return (process.env.PLATFORM_ADMIN_EMAILS || DEFAULT_ADMIN_EMAILS)
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isPlatformAdmin(email?: string | null): boolean {
  if (!email) return false;
  return platformAdminEmails().includes(email.trim().toLowerCase());
}

export function internalApiOrigin(): string {
  return (
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://127.0.0.1:8000'
  ).replace(/\/$/, '');
}
