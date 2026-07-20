import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import {
  agentDebugLogServer,
  cookieNamesFromHeader,
} from '@/lib/agentDebugLog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TOKEN_COOKIE = 'token';
const MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 days

function cookieOptions(request: NextRequest, domain?: string) {
  const xfProto = request.headers.get('x-forwarded-proto');
  const isHttps =
    request.nextUrl.protocol === 'https:' ||
    xfProto === 'https' ||
    process.env.COOKIE_SECURE === 'true';

  return {
    httpOnly: true,
    // Never force Secure on plain http://localhost (Docker / local prod image)
    secure: isHttps,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: MAX_AGE_SEC,
    ...(domain ? { domain } : {}),
  };
}

async function verifyAccessToken(token: string): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey || token.length < 20) return false;

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
    return res.ok;
  } catch {
    return false;
  }
}

/** Cookie-only session probe — does not call FastAPI. */
export async function GET(request: NextRequest) {
  const jar = await cookies();
  const token = jar.get(TOKEN_COOKIE)?.value;
  const cookieHeader = request.headers.get('cookie');
  const cookieNamesPresent = cookieNamesFromHeader(cookieHeader);
  const authenticated = !!token;

  // #region agent log
  agentDebugLogServer('C', 'session/route.ts:GET', 'session probe', {
    hasCookieHeader: !!cookieHeader,
    cookieNamesPresent,
    hasTokenCookie: !!token,
    authenticated,
    hypothesisIds: ['C', 'D'],
  });
  // #endregion

  // Cookie probe: always 200 — missing cookie is unauthenticated, not unauthorized.
  return NextResponse.json(
    { authenticated },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        'X-Debug-Session': token ? 'ok' : 'no-token-cookie',
      },
    }
  );
}

/** Establish HttpOnly session cookie (browser must not store JWT in JS). */
export async function POST(request: NextRequest) {
  let body: { access_token?: string; domain?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: 'Invalid JSON' }, { status: 400 });
  }

  const accessToken = (body.access_token || '').trim();
  if (!accessToken || accessToken.split('.').length !== 3) {
    // #region agent log
    agentDebugLogServer(
      'A',
      'session/route.ts:POST',
      'reject bad access_token shape',
      {
        hasToken: !!accessToken,
        parts: accessToken ? accessToken.split('.').length : 0,
        setCookieAttempted: false,
      }
    );
    // #endregion
    return NextResponse.json({ detail: 'access_token required' }, { status: 400 });
  }

  // Soft-verify with Supabase when reachable; do not block session if Auth API
  // is briefly unavailable (login already validated this JWT seconds ago).
  const valid = await verifyAccessToken(accessToken);
  if (!valid) {
    console.warn(
      'session: Supabase token verify failed or unreachable; setting cookie anyway'
    );
  }

  const opts = cookieOptions(request, body.domain || undefined);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(TOKEN_COOKIE, accessToken, opts);

  // #region agent log
  agentDebugLogServer(
    'A',
    'session/route.ts:POST',
    'Set-Cookie attempted',
    {
      setCookieAttempted: true,
      cookieName: TOKEN_COOKIE,
      secure: opts.secure,
      sameSite: opts.sameSite,
      path: opts.path,
      httpOnly: opts.httpOnly,
      hasDomain: !!body.domain,
      softVerifyOk: valid,
      xfProto: request.headers.get('x-forwarded-proto'),
      urlProtocol: request.nextUrl.protocol,
      hypothesisIds: ['A', 'B'],
    }
  );
  // #endregion

  response.headers.set('X-Debug-Session', 'cookie-set');
  return response;
}

/** Clear HttpOnly session cookie. */
export async function DELETE(request: NextRequest) {
  // #region agent log
  agentDebugLogServer(
    'D',
    'session/route.ts:DELETE',
    'clear session cookie',
    {
      cookieNamesPresent: cookieNamesFromHeader(request.headers.get('cookie')),
      hypothesisIds: ['D'],
    }
  );
  // #endregion

  const response = NextResponse.json({ ok: true });
  response.cookies.set(TOKEN_COOKIE, '', {
    ...cookieOptions(request),
    maxAge: 0,
  });

  try {
    const jar = await cookies();
    if (jar.get(TOKEN_COOKIE)) {
      response.cookies.delete(TOKEN_COOKIE);
    }
  } catch {
    /* ignore */
  }

  return response;
}
