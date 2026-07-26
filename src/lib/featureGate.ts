/**
 * Feature-flag helpers shared by the Next.js evaluate proxy and UI.
 * Delivery API key never belongs in the browser — only on the server proxy.
 *
 * ai.canvas_generator:
 * - Workspace tier advanced|pro unlocks (managed in /admin).
 * - Pulse Flag can additionally enable (e.g. basic trials).
 * - If Pulse is unset/unreachable → tier matrix only.
 */

export const AI_CANVAS_GENERATOR = 'ai.canvas_generator';

const LOCAL_TIER_FLAGS: Record<string, ReadonlySet<string>> = {
  [AI_CANVAS_GENERATOR]: new Set(['advanced', 'pro']),
};

export function normalizeTier(raw?: string | null): string {
  const tier = (raw || 'basic').trim().toLowerCase();
  return tier === 'free' ? 'basic' : tier;
}

export function hasLocalTierEntitlement(key: string): boolean {
  return Boolean(LOCAL_TIER_FLAGS[key]);
}

/** Legacy local check — used when remote FF is unset or unreachable. */
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
  /** remote = Pulse only; tier = local plan; fallback = Pulse down; combined = both */
  source: 'remote' | 'tier' | 'fallback' | 'combined';
};

/**
 * Merge Pulse evaluate result with local tier entitlements.
 * Known keys (AI canvas generator): advanced/pro always unlock; Pulse can also grant.
 */
export function resolveFeatureEnabled(
  key: string,
  tier: string | null | undefined,
  remote: { status: RemoteFlagStatus; enabled?: boolean }
): ResolveFeatureResult {
  const local = isFeatureEnabledLocal(key, tier);
  const hasLocal = Boolean(LOCAL_TIER_FLAGS[key]);

  if (remote.status === 'unset' || remote.status === 'error') {
    return { enabled: local, source: 'fallback' };
  }

  const pulseOn = Boolean(remote.enabled);

  if (hasLocal) {
    const enabled = local || pulseOn;
    if (local && pulseOn) return { enabled, source: 'combined' };
    if (local) return { enabled, source: 'tier' };
    return { enabled, source: 'remote' };
  }

  return { enabled: pulseOn, source: 'remote' };
}
