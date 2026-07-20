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
): void {
  if (status < 200 || status >= 300) return;
  if (!AUTH_COOKIE_PATHS.has(path)) return;

  try {
    const data = JSON.parse(bodyText) as {
      access_token?: string;
      mfa_required?: boolean;
    };
    // MFA challenge returns a temporary token; wait for mfa/verify
    if (data.mfa_required) return;
    const accessToken = (data.access_token || '').trim();
    if (!accessToken || accessToken.split('.').length !== 3) return;

    response.cookies.set(
      TOKEN_COOKIE,
      accessToken,
      sessionCookieOptions(request)
    );
  } catch {
    /* non-JSON body — ignore */
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
  maybeAttachSessionCookie(
    request,
    pathSegments.join('/'),
    upstream.status,
    bodyText,
    response
  );

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
