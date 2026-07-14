import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/**
 * Localhost in connect-src only for local/Docker builds.
 * Vercel sets VERCEL=1 at build time → strict CSP without localhost.
 */
function getLocalConnectSrc(): string {
  if (process.env.VERCEL === '1' || process.env.CSP_STRICT === 'true') {
    return '';
  }
  return ' http://localhost:* http://127.0.0.1:*';
}

function buildContentSecurityPolicy(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    `connect-src 'self' https: wss:${getLocalConnectSrc()}`,
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
    ],
  },
  async rewrites() {
    return buildBackendRewrites();
  },
  async headers() {
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
