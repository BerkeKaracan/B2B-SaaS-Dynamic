/** Debug-session ingest helper (keeps Date.now out of React render purity checks). */
export function agentDebugLog(
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown> = {}
): void {
  const timestamp = Date.now();
  fetch('http://127.0.0.1:7725/ingest/f46a9baf-e920-4d62-ad1c-9c4edc6d6c4b', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': '2f4cc5',
    },
    body: JSON.stringify({
      sessionId: '2f4cc5',
      hypothesisId,
      location,
      message,
      data,
      timestamp,
    }),
  }).catch(() => {});
}
