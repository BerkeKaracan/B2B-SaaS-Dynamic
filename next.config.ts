import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/**
 * CSP connect-src for canvas LIVE WebSockets.
 *
 * Prod (Vercel / CSP_STRICT): never allow ws://localhost.
 *   - Scheme sources `https:` / `wss:` cover Cloud Run + any TLS API host.
 *   - NEXT_PUBLIC_WS_URL / NEXT_PUBLIC_API_URL origins are also listed explicitly
 *     so a future tightening that drops bare `wss:` still keeps the API host.
 *
 * Local/Docker: add http(s)/ws(s) localhost for compose (:3000 → :8000).
 */
function isStrictCsp(): boolean {
  return (
    process.env.VERCEL === '1' ||
    process.env.CSP_STRICT === 'true' ||
    process.env.CSP_ALLOW_LOCALHOST === 'false'
  );
}

function wsOriginFromEnv(raw: string | undefined): string | null {
  const trimmed = (raw || '').trim().replace(/\/$/, '');
  if (!trimmed) return null;
  try {
    if (trimmed.startsWith('wss://') || trimmed.startsWith('ws://')) {
      const u = new URL(trimmed);
      return `${u.protocol}//${u.host}`;
    }
    const u = new URL(trimmed);
    if (u.protocol === 'https:') return `wss://${u.host}`;
    if (u.protocol === 'http:') return `ws://${u.host}`;
  } catch {
    return null;
  }
  return null;
}

function getExplicitWsConnectSrc(): string {
  const origins = new Set<string>();
  for (const raw of [
    process.env.NEXT_PUBLIC_WS_URL,
    process.env.NEXT_PUBLIC_API_URL,
    process.env.CSP_CONNECT_WS_ORIGINS, // space-separated extra wss:// hosts
  ]) {
    if (!raw) continue;
    for (const part of raw.split(/[\s,]+/)) {
      const origin = wsOriginFromEnv(part);
      if (origin) origins.add(origin);
    }
  }
  if (origins.size === 0) return '';
  return ` ${[...origins].join(' ')}`;
}

function getLocalConnectSrc(): string {
  if (isStrictCsp()) return '';
  // http for BFF/API; ws for canvas live cursors → backend :8000
  return (
    ' http://localhost:* http://127.0.0.1:*' +
    ' ws://localhost:* ws://127.0.0.1:*'
  );
}

function buildContentSecurityPolicy(): string {
  // `https:` + `wss:` = any TLS / WebSocket TLS host (Cloud Run, custom API domain).
  // Explicit WS origins from env are defense-in-depth for the LIVE canvas socket.
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    `connect-src 'self' https: wss:${getExplicitWsConnectSrc()}${getLocalConnectSrc()}`,
  ].join('; ');
}

/** FastAPI route prefixes proxied through Next (same-origin for the browser). */
const BACKEND_API_PREFIXES = [
  'auth',
  'records',
  'tenants',
  'public',
  'public-ai',
  'notifications',
  'ai',
  'github',
  'chat',
  'tasks',
  'fx',
  'storage',
] as const;

function getBackendOrigin(): string {
  return (
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://127.0.0.1:8000'
  ).replace(/\/$/, '');
}

function buildBackendRewrites() {
  const backend = getBackendOrigin();
  // NOTE: Do NOT rewrite /api/session or /api/realtime-token — those are
  // Next.js HttpOnly session handlers (must not hit FastAPI).
  // /api/backend/* is also a Next BFF route (not listed here).
  return BACKEND_API_PREFIXES.flatMap((prefix) => [
    // Always hit the trailing-slash collection URL so FastAPI does not 307
    // to http://backend:8000/... (unreachable from the browser).
    {
      source: `/api/${prefix}`,
      destination: `${backend}/api/${prefix}/`,
    },
    {
      source: `/api/${prefix}/`,
      destination: `${backend}/api/${prefix}/`,
    },
    {
      source: `/api/${prefix}/:path*`,
      destination: `${backend}/api/${prefix}/:path*`,
    },
  ]);
}

const nextConfig: NextConfig = {
  cleanDistDir: true,

  output: 'standalone',
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    // Block common env-file probe paths (scanners / false-positive noise).
    return [
      { source: '/.env', destination: '/404', permanent: false },
      { source: '/.env.:path*', destination: '/404', permanent: false },
    ];
  },
  async rewrites() {
    return buildBackendRewrites();
  },
  async headers() {
    const marketingCache = {
      key: 'Cache-Control',
      value: 'public, s-maxage=60, stale-while-revalidate=300',
    };

    // Locale-prefixed public marketing pages only — never dashboard/auth.
    const marketingSources = [
      '/:locale(en|tr)',
      '/:locale(en|tr)/demo',
      '/:locale(en|tr)/pricing',
      '/:locale(en|tr)/docs',
      '/:locale(en|tr)/changelog',
      '/:locale(en|tr)/blog',
      '/:locale(en|tr)/community',
      '/:locale(en|tr)/integrations',
      '/:locale(en|tr)/about',
      '/:locale(en|tr)/careers',
      '/:locale(en|tr)/contact',
      '/:locale(en|tr)/privacy',
      '/:locale(en|tr)/terms',
      '/:locale(en|tr)/features',
      '/:locale(en|tr)/templates',
      '/:locale(en|tr)/solutions/:path*',
      '/:locale(en|tr)/platform/:path*',
    ];

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: buildContentSecurityPolicy(),
          },
          {
            key: 'Permissions-Policy',
            value:
              'camera=(), microphone=(), geolocation=(), browsing-topics=()',
          },
        ],
      },
      ...marketingSources.map((source) => ({
        source,
        headers: [marketingCache],
      })),
    ];
  },
};

export default withSentryConfig(withNextIntl(nextConfig), {
  org: 'freelancer-y9',
  project: 'python-fastapi',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  webpack: {
    automaticVercelMonitors: true,
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
