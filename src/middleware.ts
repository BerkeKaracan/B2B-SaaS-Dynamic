import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import {
  extractDashboardTenantId,
  verifySupabaseAccessToken,
  verifyTenantMembership,
} from './lib/authEdge';

const handleI18nRouting = createIntlMiddleware(routing);

/** next-intl supports `secure` via localeCookie; harden with HttpOnly for scanners. */
function hardenLocaleCookie(response: NextResponse) {
  const locale = response.cookies.get('NEXT_LOCALE')?.value;
  if (!locale) return response;

  response.cookies.set('NEXT_LOCALE', locale, {
    path: '/',
    sameSite: 'lax',
    secure: true,
    httpOnly: true,
  });
  return response;
}

function loginRedirect(request: NextRequest, localeMatch?: string) {
  const url = request.nextUrl.clone();
  url.pathname = localeMatch ? `/${localeMatch}/login` : '/login';
  // Preserve OAuth PKCE callback params — wiping ?code= breaks Google/GitHub return.
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  url.search = '';
  if (code) url.searchParams.set('code', code);
  if (state) url.searchParams.set('state', state);
  url.hash = '';
  return NextResponse.redirect(url);
}

/** Exact public paths + safe prefixes (marketing). Avoid broad /auth/* wildcard. */
const PUBLIC_EXACT = new Set([
  '/login',
  '/register',
  '/forgot',
  '/onboarding',
  '/accept-invite',
  '/demo',
  '/pricing',
  '/docs',
  '/changelog',
  '/blog',
  '/community',
  '/integrations',
  '/about',
  '/careers',
  '/contact',
  '/privacy',
  '/terms',
  '/auth/callback',
  '/opengraph-image',
  '/twitter-image',
  '/icon',
  '/apple-icon',
]);

const PUBLIC_PREFIXES = [
  '/share',
  '/solutions',
  '/platform',
  '/features',
  '/templates',
];

function isPublicPath(basePath: string): boolean {
  if (PUBLIC_EXACT.has(basePath)) return true;
  return PUBLIC_PREFIXES.some(
    (prefix) => basePath === prefix || basePath.startsWith(`${prefix}/`)
  );
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';

  let subdomain = '';
  if (hostname.endsWith(rootDomain) && hostname !== rootDomain) {
    subdomain = hostname.replace(`.${rootDomain}`, '');
  }

  const localeMatch = routing.locales.find(
    (locale) =>
      url.pathname.startsWith(`/${locale}/`) || url.pathname === `/${locale}`
  );
  const basePath = localeMatch
    ? url.pathname.replace(`/${localeMatch}`, '') || '/'
    : url.pathname;

  const publicPath = isPublicPath(basePath);
  const token = request.cookies.get('token')?.value;

  // Protected app routes: require a *valid* Supabase JWT (not mere cookie presence)
  if (!publicPath && basePath !== '/') {
    if (!token) {
      return loginRedirect(request, localeMatch);
    }

    const verified = await verifySupabaseAccessToken(token);
    if (!verified) {
      const redirect = loginRedirect(request, localeMatch);
      redirect.cookies.delete('token');
      return redirect;
    }

    const dashboardTenantId = extractDashboardTenantId(basePath);
    if (dashboardTenantId) {
      const allowed = await verifyTenantMembership(token, dashboardTenantId);
      if (!allowed) {
        const safe = request.nextUrl.clone();
        safe.pathname = localeMatch ? `/${localeMatch}/onboarding` : '/onboarding';
        safe.search = '';
        return NextResponse.redirect(safe);
      }
    }
  }

  if (subdomain && subdomain !== 'www' && !basePath.startsWith('/dashboard')) {
    try {
      const apiUrl =
        process.env.INTERNAL_API_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        'http://127.0.0.1:8000';
      const internalSecret = process.env.INTERNAL_API_SECRET || '';
      const res = await fetch(`${apiUrl}/api/tenants/by-slug/${subdomain}`, {
        next: { revalidate: 3600 },
        headers: internalSecret
          ? { 'X-Internal-Secret': internalSecret }
          : {},
      });

      if (res.ok) {
        const data = await res.json();
        const realTenantId = data.id;
        url.pathname = `/${localeMatch || routing.defaultLocale}/dashboard/${realTenantId}${basePath === '/' ? '' : basePath}`;
        return NextResponse.rewrite(url);
      } else {
        return loginRedirect(request, localeMatch);
      }
    } catch (error) {
      console.error('Proxy fetch error:', error);
    }
  }

  return hardenLocaleCookie(handleI18nRouting(request));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api|.*\\.).*)'],
};
