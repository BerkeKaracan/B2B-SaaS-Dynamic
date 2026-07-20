/** Debug-session ingest helper (keeps Date.now out of React render purity checks). */
export function agentDebugLog(
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown> = {}
): void {
  const timestamp = Date.now();
  const payload = {
    sessionId: '2f4cc5',
    hypothesisId,
    location,
    message,
    data,
    timestamp,
  };

  // #region agent log
  // Browser / edge: ingest only (mixed-content may block on https production)
  fetch('http://127.0.0.1:7725/ingest/f46a9baf-e920-4d62-ad1c-9c4edc6d6c4b', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': '2f4cc5',
    },
    body: JSON.stringify(payload),
  }).catch(() => {});
  // #endregion
}

/**
 * Server route handler logger — NDJSON file + ingest.
 * Never log token/secret values.
 */
export function agentDebugLogServer(
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown> = {}
): void {
  const timestamp = Date.now();
  const payload = {
    sessionId: '2f4cc5',
    hypothesisId,
    location,
    message,
    data,
    timestamp,
  };

  // #region agent log
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs') as typeof import('fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path') as typeof import('path');
    const logPath = path.join(process.cwd(), 'debug-2f4cc5.log');
    fs.appendFileSync(logPath, `${JSON.stringify(payload)}\n`, 'utf8');
  } catch {
    /* ignore — Vercel read-only fs, etc. */
  }

  fetch('http://127.0.0.1:7725/ingest/f46a9baf-e920-4d62-ad1c-9c4edc6d6c4b', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': '2f4cc5',
    },
    body: JSON.stringify(payload),
  }).catch(() => {});
  // #endregion
}

/** Parse Cookie header into name list only (no values). */
export function cookieNamesFromHeader(cookieHeader: string | null): string[] {
  if (!cookieHeader) return [];
  return cookieHeader
    .split(';')
    .map((part) => part.trim().split('=')[0])
    .filter(Boolean);
}
