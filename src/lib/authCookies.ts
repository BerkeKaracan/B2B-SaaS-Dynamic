import Cookies from 'js-cookie';

/**
 * Non-secret client cookies (tenant_id only).
 * Access tokens are HttpOnly via /api/auth/session — never store JWT in JS.
 */

export function tenantCookieOptions(domain?: string): Cookies.CookieAttributes {
  const secure =
    typeof window !== 'undefined' && window.location.protocol === 'https:';

  return {
    expires: 7,
    path: '/',
    sameSite: 'lax',
    secure,
    ...(domain ? { domain } : {}),
  };
}

/** @deprecated Use establishClientSession — tokens must not be JS-readable. */
export function authCookieOptions(domain?: string): Cookies.CookieAttributes {
  return tenantCookieOptions(domain);
}

/** Establish HttpOnly session cookie via same-origin BFF. */
export async function establishClientSession(
  accessToken: string,
  domain?: string
): Promise<void> {
  const res = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({
      access_token: accessToken,
      ...(domain ? { domain } : {}),
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(
      typeof err?.detail === 'string' ? err.detail : 'Failed to establish session'
    );
  }
}

/** Clear HttpOnly session cookie. */
export async function clearClientSession(): Promise<void> {
  try {
    await fetch('/api/auth/session', {
      method: 'DELETE',
      credentials: 'same-origin',
    });
  } catch {
    /* ignore */
  }
}

/**
 * @deprecated Prefer establishClientSession. Kept as async-compatible no-op
 * wrapper name used by older call sites during migration.
 */
export function setClientAuthToken(token: string, domain?: string) {
  void establishClientSession(token, domain);
}

export function setClientTenantId(tenantId: string, domain?: string) {
  Cookies.set('tenant_id', tenantId, tenantCookieOptions(domain));
  try {
    localStorage.setItem('tenant_id', tenantId);
  } catch {
    /* ignore */
  }
}

/** Fetch access token for Realtime only (memory use — do not persist). */
export async function fetchRealtimeAccessToken(): Promise<string | null> {
  try {
    const res = await fetch('/api/auth/realtime-token', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { access_token?: string };
    return data.access_token || null;
  } catch {
    return null;
  }
}

/** Clear auth + tenant persist keys (logout / account switch). */
export function clearClientAuthStorage() {
  // Best-effort clear of legacy JS-readable token remnants
  Cookies.remove('token');
  Cookies.remove('tenant_id');

  try {
    const host = window.location.hostname;
    const parts = host.split('.');
    if (parts.length >= 2) {
      const root = parts.slice(-2).join('.');
      Cookies.remove('token', { domain: `.${root}` });
      Cookies.remove('tenant_id', { domain: `.${root}` });
    }
  } catch {
    /* ignore */
  }

  try {
    localStorage.removeItem('token');
    localStorage.removeItem('tenant_id');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('tenant-storage');
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('canvas_zoom_')) keysToRemove.push(key);
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }

  try {
    sessionStorage.clear();
  } catch {
    /* ignore */
  }
}
