/**
 * Feature-flag helpers shared by the Next.js evaluate proxy and UI.
 * Delivery API key never belongs in the browser — only on the server proxy.
 *
 * ai.canvas_generator:
 * - Pulse OK → Pulse is source of truth (project delivery key scoped).
 * - Pulse unset/error → local tier fallback (advanced|pro).
 *
 * collab.canvas_sync:
 * - Default OFF for every tier (no local grant).
 * - Pulse kill-switch: set enabled=false on the Pulse project to stop Yjs
 *   Realtime sync instantly without redeploy. Cursors stay separate/light.
 */

export const AI_CANVAS_GENERATOR = 'ai.canvas_generator';
/** Blank-canvas CRDT sync over Supabase Realtime — default off everywhere. */
export const COLLAB_CANVAS_SYNC = 'collab.canvas_sync';

const LOCAL_TIER_FLAGS: Record<string, ReadonlySet<string>> = {
  [AI_CANVAS_GENERATOR]: new Set(['advanced', 'pro']),
  // Intentionally empty / omitted: collab.canvas_sync never auto-enables via tier.
};

export function normalizeTier(raw?: string | null): string {
  const tier = (raw || 'basic').trim().toLowerCase();
  return tier === 'free' ? 'basic' : tier;
}

/** Local check — used when remote FF is unset or unreachable. */
export function isFeatureEnabledLocal(
  key: string,
  tier?: string | null
): boolean {
  const allowed = LOCAL_TIER_FLAGS[key];
  if (!allowed) return false;
  return allowed.has(normalizeTier(tier));
}

export type RemoteFlagStatus = 'unset' | 'ok' | 'error';

export type ResolveFeatureResult = {
  enabled: boolean;
  /** remote = Pulse SoT; fallback = Pulse down / unset */
  source: 'remote' | 'fallback';
};

/**
 * Pulse SoT when reachable; tier matrix only as safety net when Pulse is down.
 */
export function resolveFeatureEnabled(
  key: string,
  tier: string | null | undefined,
  remote: { status: RemoteFlagStatus; enabled?: boolean }
): ResolveFeatureResult {
  const local = isFeatureEnabledLocal(key, tier);

  if (remote.status === 'ok') {
    return { enabled: Boolean(remote.enabled), source: 'remote' };
  }

  // unset | error → do not invent grants for unknown keys
  if (!LOCAL_TIER_FLAGS[key]) {
    return { enabled: false, source: 'fallback' };
  }
  return { enabled: local, source: 'fallback' };
}
