import { NextRequest, NextResponse } from 'next/server';

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
    return `skip-status:${status}`;
  }
  if (!AUTH_COOKIE_PATHS.has(path)) {
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
      return 'skip-mfa';
    }
    const accessToken = (data.access_token || '').trim();
    if (!accessToken || accessToken.split('.').length !== 3) {
      response.headers.set('X-Debug-Auth', 'skip-no-jwt');
      return 'skip-no-jwt';
    }

    response.cookies.set(
      TOKEN_COOKIE,
      accessToken,
      sessionCookieOptions(request)
    );
    response.headers.set('X-Debug-Auth', 'cookie-set');
    // #region agent log
    fetch('http://127.0.0.1:7725/ingest/f46a9baf-e920-4d62-ad1c-9c4edc6d6c4b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'2f4cc5'},body:JSON.stringify({sessionId:'2f4cc5',hypothesisId:'A',location:'backend/[...path]/route.ts:maybeAttach',message:'session cookie attached',data:{path,status,secure:sessionCookieOptions(request).secure,https:request.nextUrl.protocol},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return 'cookie-set';
  } catch {
    response.headers.set('X-Debug-Auth', 'skip-parse');
    return 'skip-parse';
  }
}

async function proxy(
  request: NextRequest,
  pathSegments: string[]
): Promise<NextResponse> {
  const token = request.cookies.get('token')?.value;
  const search = request.nextUrl.search || '';
  const path = pathSegments.map(encodeURIComponent).join('/');
  const targetUrl = `${backendOrigin()}/api/${path}${search}`;

  // #region agent log
  if (path.includes('auth/me') || path.includes('auth/login')) {
    fetch('http://127.0.0.1:7725/ingest/f46a9baf-e920-4d62-ad1c-9c4edc6d6c4b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'2f4cc5'},body:JSON.stringify({sessionId:'2f4cc5',hypothesisId:'C',location:'backend/[...path]/route.ts:proxy',message:'BFF proxy request',data:{path,hasCookie:!!token,method:request.method,originHost:new URL(backendOrigin()).host},timestamp:Date.now()})}).catch(()=>{});
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
  if (path.includes('auth/login') || path.includes('auth/me') || path.includes('auth/mfa')) {
    fetch('http://127.0.0.1:7725/ingest/f46a9baf-e920-4d62-ad1c-9c4edc6d6c4b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'2f4cc5'},body:JSON.stringify({sessionId:'2f4cc5',hypothesisId:'B',location:'backend/[...path]/route.ts:proxy-end',message:'BFF upstream done',data:{path,upstreamStatus:upstream.status,attachResult,hadInboundCookie:!!token},timestamp:Date.now()})}).catch(()=>{});
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
