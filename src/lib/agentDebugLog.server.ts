/**
 * Server-only debug logger stub. Do not import from client components.
 * Former file/ingest logging was session-scoped and is intentionally disabled.
 */
export function agentDebugLogServer(
  _hypothesisId: string,
  _location: string,
  _message: string,
  _data: Record<string, unknown> = {}
): void {
  // no-op
}
