import { NextRequest, NextResponse } from 'next/server';
import {
  agentDebugLog,
  agentDebugLogServer,
  cookieNamesFromHeader,
} from '@/lib/agentDebugLog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TOKEN_COOKIE = 'token';
const MAX_AGE_SEC = 60 * 60 * 24 * 7;

function backendOrigin(): string {
  return (
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://127.0.0.1:8000'
  ).replace(/\/$/, '');
}

/** Headers that must not be forwarded request → upstream or upstream → client. */
const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
  // Node fetch auto-decompresses; forwarding these breaks the browser
  // (net::ERR_CONTENT_DECODING_FAILED).
  'content-encoding',
  'accept-encoding',
]);

const AUTH_COOKIE_PATHS = new Set(['auth/login', 'auth/mfa/verify']);

function sessionCookieOptions(request: NextRequest) {
  const xfProto = request.headers.get('x-forwarded-proto');
  const isHttps =
    request.nextUrl.protocol === 'https:' ||
    xfProto === 'https' ||
    process.env.COOKIE_SECURE === 'true';

  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: MAX_AGE_SEC,
  };
}

function maybeAttachSessionCookie(
  request: NextRequest,
  path: string,
  status: number,
  bodyText: string,
  response: NextResponse
): string {
  if (status < 200 || status >= 300) {
    response.headers.set('X-Debug-Auth', `skip-status:${status}`);
    // #region agent log
    if (AUTH_COOKIE_PATHS.has(path) || path.includes('auth/login')) {
      agentDebugLogServer(
        'A',
        'backend/[...path]/route.ts:maybeAttach',
        'skip cookie — non-2xx',
        { requestPath: path, status, setCookieAttempted: false }
      );
    }
    // #endregion
    return `skip-status:${status}`;
  }
  if (!AUTH_COOKIE_PATHS.has(path)) {
    // #region agent log
    if (path.includes('auth/login') || path.includes('auth/mfa')) {
      agentDebugLogServer(
        'E',
        'backend/[...path]/route.ts:maybeAttach',
        'skip cookie — path not in AUTH_COOKIE_PATHS',
        {
          requestPath: path,
          status,
          setCookieAttempted: false,
          authCookiePaths: [...AUTH_COOKIE_PATHS],
        }
      );
    }
    // #endregion
    return 'skip-path';
  }

  try {
    const data = JSON.parse(bodyText) as {
      access_token?: string;
      mfa_required?: boolean;
    };
    // MFA challenge returns a temporary token; wait for mfa/verify
    if (data.mfa_required) {
      response.headers.set('X-Debug-Auth', 'skip-mfa');
      // #region agent log
      agentDebugLogServer(
        'A',
        'backend/[...path]/route.ts:maybeAttach',
        'skip cookie — mfa_required',
        { requestPath: path, status, setCookieAttempted: false }
      );
      // #endregion
      return 'skip-mfa';
    }
    const accessToken = (data.access_token || '').trim();
    if (!accessToken || accessToken.split('.').length !== 3) {
      response.headers.set('X-Debug-Auth', 'skip-no-jwt');
      // #region agent log
      agentDebugLogServer(
        'A',
        'backend/[...path]/route.ts:maybeAttach',
        'skip cookie — no jwt',
        {
          requestPath: path,
          status,
          setCookieAttempted: false,
          hasAccessToken: !!accessToken,
          parts: accessToken ? accessToken.split('.').length : 0,
        }
      );
      // #endregion
      return 'skip-no-jwt';
    }

    const opts = sessionCookieOptions(request);
    // Expire host-only + Domain= copies before set (subdomain hop leftovers)
    response.cookies.set(TOKEN_COOKIE, '', { ...opts, maxAge: 0 });
    const root = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || '')
      .replace(/^www\./, '')
      .trim();
    if (root && !root.includes('localhost') && root.includes('.')) {
      response.cookies.set(TOKEN_COOKIE, '', {
        ...opts,
        maxAge: 0,
        domain: `.${root}`,
      });
    }
    response.cookies.set(TOKEN_COOKIE, accessToken, opts);
    response.headers.set('X-Debug-Auth', 'cookie-set');
    // #region agent log
    agentDebugLog(
      'A',
      'backend/[...path]/route.ts:maybeAttach',
      'session cookie attached',
      {
        path,
        status,
        secure: opts.secure,
        https: request.nextUrl.protocol,
      }
    );
    agentDebugLogServer(
      'A',
      'backend/[...path]/route.ts:maybeAttach',
      'Set-Cookie attempted on BFF login/mfa',
      {
        setCookieAttempted: true,
        cookieName: TOKEN_COOKIE,
        requestPath: path,
        status,
        secure: opts.secure,
        sameSite: opts.sameSite,
        pathFlag: opts.path,
        httpOnly: opts.httpOnly,
        xfProto: request.headers.get('x-forwarded-proto'),
        urlProtocol: request.nextUrl.protocol,
        hypothesisIds: ['A', 'B', 'E'],
      }
    );
    // #endregion
    return 'cookie-set';
  } catch {
    response.headers.set('X-Debug-Auth', 'skip-parse');
    // #region agent log
    agentDebugLogServer(
      'A',
      'backend/[...path]/route.ts:maybeAttach',
      'cookie attach parse failed',
      { requestPath: path, status, setCookieAttempted: false }
    );
    // #endregion
    return 'skip-parse';
  }
}

/**
 * FastAPI uses redirect_slashes=False (Docker-safe). Collection routes registered
 * as `@router.get("/")` only match `/api/records/` — not `/api/records`.
 * Next rewrites add the slash; the BFF must do the same.
 */
function toUpstreamPath(pathSegments: string[]): string {
  const segments = pathSegments.filter((s) => s.length > 0);
  let path = segments.map(encodeURIComponent).join('/');
  if (segments.length === 1 && segments[0] === 'records') {
    path = `${path}/`;
  }
  return path;
}

async function proxy(
  request: NextRequest,
  pathSegments: string[]
): Promise<NextResponse> {
  const token = request.cookies.get('token')?.value;
  const search = request.nextUrl.search || '';
  const path = toUpstreamPath(pathSegments);
  const targetUrl = `${backendOrigin()}/api/${path}${search}`;

  // #region agent log
  if (path.includes('auth/me') || path.includes('auth/login')) {
    agentDebugLog('C', 'backend/[...path]/route.ts:proxy', 'BFF proxy request', {
      path,
      hasCookie: !!token,
      method: request.method,
      originHost: new URL(backendOrigin()).host,
    });
  }
  // #endregion

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP.has(lower)) return;
    if (lower === 'cookie') return;
    if (lower === 'authorization') return;
    headers.set(key, value);
  });

  // Ask upstream for uncompressed body so we never mismatch encoding
  headers.set('Accept-Encoding', 'identity');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: 'manual',
    cache: 'no-store',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const body = await request.arrayBuffer();
    if (body.byteLength > 0) {
      init.body = body;
    }
  }

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, init);
  } catch (error) {
    console.error('BFF proxy error:', error);
    return NextResponse.json(
      { detail: 'Upstream unavailable' },
      { status: 502 }
    );
  }

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP.has(lower)) return;
    if (lower === 'set-cookie') return;
    responseHeaders.set(key, value);
  });

  // Buffer the (already-decoded) body so Content-Encoding cannot confuse clients
  const buf = await upstream.arrayBuffer();
  const bodyText = new TextDecoder().decode(buf);

  const response = new NextResponse(buf, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });

  // Atomic session: set HttpOnly cookie on successful login / MFA verify
  const attachResult = maybeAttachSessionCookie(
    request,
    pathSegments.join('/'),
    upstream.status,
    bodyText,
    response
  );

  // #region agent log
  if (
    path.includes('auth/login') ||
    path.includes('auth/me') ||
    path.includes('auth/mfa')
  ) {
    const inboundNames = cookieNamesFromHeader(
      request.headers.get('cookie')
    );
    agentDebugLog(
      'B',
      'backend/[...path]/route.ts:proxy-end',
      'BFF upstream done',
      {
        path,
        upstreamStatus: upstream.status,
        attachResult,
        hadInboundCookie: !!token,
      }
    );
    agentDebugLogServer(
      'E',
      'backend/[...path]/route.ts:proxy-end',
      'BFF auth proxy completed',
      {
        requestPath: pathSegments.join('/'),
        upstreamStatus: upstream.status,
        attachResult,
        setCookieAttempted: attachResult === 'cookie-set',
        cookieName: TOKEN_COOKIE,
        hadInboundCookie: !!token,
        inboundCookieNames: inboundNames,
        viaBff: true,
        hypothesisIds: ['A', 'E'],
      }
    );
  }
  // #endregion

  return response;
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(request, path);
}

export async function POST(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(request, path);
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(request, path);
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(request, path);
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(request, path);
}

export async function OPTIONS(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(request, path);
}
