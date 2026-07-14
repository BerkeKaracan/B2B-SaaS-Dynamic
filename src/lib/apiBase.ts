/**
 * Resolve the API origin for server vs browser.
 *
 * Browser → same-origin "" so requests hit Next.js `/api/*` rewrites
 * (CSP connect-src 'self' only — no localhost needed).
 *
 * Server / Docker → INTERNAL_API_URL (e.g. http://backend:8000).
 * Production cloud → https NEXT_PUBLIC_API_URL when set.
 */
export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return (
      process.env.INTERNAL_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://127.0.0.1:8000'
    ).replace(/\/$/, '');
  }

  const pub = process.env.NEXT_PUBLIC_API_URL;
  if (pub && /^https:\/\//i.test(pub)) {
    return pub.replace(/\/$/, '');
  }

  return '';
}
