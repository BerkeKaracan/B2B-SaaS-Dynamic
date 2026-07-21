function isLocalBrowserHost(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

/** Debug-session ingest helper (client-safe — no Node fs). */
export function agentDebugLog(
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown> = {}
): void {
  // Production (Vercel) CSP blocks 127.0.0.1 — skip client ingest off localhost.
  if (!isLocalBrowserHost()) return;

  const timestamp = Date.now();
  const payload = {
    sessionId: '2f4cc5',
    hypothesisId,
    location,
    message,
    data,
    timestamp,
  };

  fetch('http://127.0.0.1:7725/ingest/f46a9baf-e920-4d62-ad1c-9c4edc6d6c4b', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': '2f4cc5',
    },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

/** Parse Cookie header into name list only (no values). */
export function cookieNamesFromHeader(cookieHeader: string | null): string[] {
  if (!cookieHeader) return [];
  return cookieHeader
    .split(';')
    .map((part) => part.trim().split('=')[0])
    .filter(Boolean);
}
