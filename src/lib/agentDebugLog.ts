/** Debug-session ingest helper (client-safe — no Node fs). */
export function agentDebugLog(
  _hypothesisId: string,
  _location: string,
  _message: string,
  _data: Record<string, unknown> = {}
): void {
  // Former local ingest (:7725) left connection-refused noise; keep as no-op.
}

/** Parse Cookie header into name list only (no values). */
export function cookieNamesFromHeader(cookieHeader: string | null): string[] {
  if (!cookieHeader) return [];
  return cookieHeader
    .split(';')
    .map((part) => part.trim().split('=')[0])
    .filter(Boolean);
}
