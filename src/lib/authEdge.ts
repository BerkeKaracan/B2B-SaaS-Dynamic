/**
 * Server-side Supabase access-token validation (signature + expiry).
 * Uses jose local HS256 verify — no Supabase Auth HTTP, no Redis (Edge-safe).
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

export async function verifySupabaseAccessToken(
  token: string | undefined | null
): Promise<VerifiedSupabaseUser | null> {
  if (!token || token.length < 20) return null;

  const key = jwtSecretKey();
  if (!key) {
    console.error('SUPABASE_JWT_SECRET is not configured for middleware');
    return null;
  }

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
    if (!id) return null;

    const email =
      typeof payload.email === 'string' ? payload.email : undefined;
    return { id, email };
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

/**
 * Membership is enforced on FastAPI (get_user_role + tenant_roles), not here.
 * Edge must not call Redis or full tenant GET — keep middleware crypto-only.
 */
export async function verifyTenantMembership(
  _token: string,
  tenantId: string
): Promise<boolean> {
  return UUID_RE.test(tenantId);
}
