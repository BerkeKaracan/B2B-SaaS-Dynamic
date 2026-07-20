/**
 * Server-side Supabase access-token validation (signature + expiry).
 * Uses Auth REST /user — does not trust cookie presence alone.
 */
export type VerifiedSupabaseUser = {
  id: string;
  email?: string;
};

export async function verifySupabaseAccessToken(
  token: string | undefined | null
): Promise<VerifiedSupabaseUser | null> {
  if (!token || token.length < 20) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return null;

  try {
    const res = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: anonKey,
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as { id?: string; email?: string };
    if (!data?.id) return null;
    return { id: data.id, email: data.email };
  } catch {
    return null;
  }
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function extractDashboardTenantId(basePath: string): string | null {
  const match = basePath.match(/^\/dashboard\/([^/]+)/);
  if (!match) return null;
  const tenantId = match[1];
  return UUID_RE.test(tenantId) ? tenantId : null;
}

/** Lightweight membership probe via FastAPI (uses get_user_role + tenant_roles). */
export async function verifyTenantMembership(
  token: string,
  tenantId: string
): Promise<boolean> {
  const apiUrl =
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://127.0.0.1:8000';

  try {
    const res = await fetch(`${apiUrl.replace(/\/$/, '')}/api/tenants/${tenantId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    // Fail closed on membership check errors for dashboard tenant routes
    return false;
  }
}
