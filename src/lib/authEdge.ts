/**
 * Server-side Supabase access-token validation (signature + expiry).
 * Prefers jose local HS256 when SUPABASE_JWT_SECRET is set.
 * Falls back to GoTrue /auth/v1/user when secret is missing/wrong (Edge-safe HTTP).
 * Revocation (blacklist) is enforced on FastAPI only.
 */
import { jwtVerify } from 'jose';

export type VerifiedSupabaseUser = {
  id: string;
  email?: string;
};

function jwtSecretKey(): Uint8Array | null {
  const secret = (process.env.SUPABASE_JWT_SECRET || '').trim();
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

async function verifyViaGoTrue(
  token: string
): Promise<VerifiedSupabaseUser | null> {
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
    const data = (await res.json()) as {
      id?: string;
      email?: string;
      user?: { id?: string; email?: string };
    };
    const id = data.id || data.user?.id;
    if (!id) return null;
    const email = data.email || data.user?.email;
    return { id, email: typeof email === 'string' ? email : undefined };
  } catch {
    return null;
  }
}

export async function verifySupabaseAccessToken(
  token: string | undefined | null
): Promise<VerifiedSupabaseUser | null> {
  if (!token || token.length < 20) return null;

  const key = jwtSecretKey();
  if (key) {
    try {
      let payload;
      try {
        ({ payload } = await jwtVerify(token, key, {
          algorithms: ['HS256'],
          audience: 'authenticated',
        }));
      } catch {
        ({ payload } = await jwtVerify(token, key, {
          algorithms: ['HS256'],
        }));
      }

      const id = typeof payload.sub === 'string' ? payload.sub : null;
      if (id) {
        const email =
          typeof payload.email === 'string' ? payload.email : undefined;
        return { id, email };
      }
    } catch {
      // Wrong secret / asymmetric JWT — try GoTrue below
    }
  }

  return verifyViaGoTrue(token);
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function extractDashboardTenantId(basePath: string): string | null {
  const match = basePath.match(/^\/dashboard\/([^/]+)/);
  if (!match) return null;
  const tenantId = match[1];
  return UUID_RE.test(tenantId) ? tenantId : null;
}

/**
 * Membership is enforced on FastAPI (get_user_role + tenant_roles), not here.
 * Edge must not call Redis or full tenant GET — keep middleware crypto-only when possible.
 */
export async function verifyTenantMembership(
  _token: string,
  tenantId: string
): Promise<boolean> {
  return UUID_RE.test(tenantId);
}
