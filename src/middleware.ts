import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const handleI18nRouting = createIntlMiddleware(routing);

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

  const publicPaths = [
    '/login',
    '/register',
    '/forgot',
    '/onboarding',
    '/accept-invite',
    '/demo',
    '/share',
    '/pricing',
    '/docs',
    '/changelog',
    '/solutions',
    '/platform',
    '/features',
    '/templates',
    '/blog',
    '/community',
    '/integrations',
    '/about',
    '/careers',
    '/contact',
    '/privacy',
    '/terms',
    '/auth/callback',
    '/auth',
    // SEO / social preview assets (must stay public for crawlers)
    '/opengraph-image',
    '/twitter-image',
    '/icon',
    '/apple-icon',
  ];

  const isPublicPath = publicPaths.some(
    (path) => basePath.startsWith(path) || basePath === path
  );
  const token = request.cookies.get('token')?.value;

  if (!isPublicPath && basePath !== '/' && !token) {
    url.pathname = localeMatch ? `/${localeMatch}/login` : '/login';
    return NextResponse.redirect(url);
  }

  if (subdomain && subdomain !== 'www' && !basePath.startsWith('/dashboard')) {
    try {
      const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const res = await fetch(`${apiUrl}/api/tenants/by-slug/${subdomain}`, {
        next: { revalidate: 3600 },
      });

      if (res.ok) {
        const data = await res.json();
        const realTenantId = data.id;
        url.pathname = `/${localeMatch || routing.defaultLocale}/dashboard/${realTenantId}${basePath === '/' ? '' : basePath}`;
        return NextResponse.rewrite(url);
      } else {
        url.pathname = localeMatch ? `/${localeMatch}/login` : '/login';
        return NextResponse.redirect(url);
      }
    } catch (error) {
      console.error('Proxy fetch error:', error);
    }
  }

  return handleI18nRouting(request);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api|.*\\.).*)'],
};
