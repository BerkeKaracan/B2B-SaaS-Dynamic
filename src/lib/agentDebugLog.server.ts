/**
 * Server-only debug logger (uses Node fs). Do not import from client components.
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

  // Local ingest only — never required for production.
  if (process.env.NODE_ENV === 'development') {
    fetch('http://127.0.0.1:7725/ingest/f46a9baf-e920-4d62-ad1c-9c4edc6d6c4b', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': '2f4cc5',
      },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }
}
