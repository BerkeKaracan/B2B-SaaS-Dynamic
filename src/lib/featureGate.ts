/**
 * Feature-flag helpers shared by the Next.js evaluate proxy and UI.
 * Delivery API key never belongs in the browser — only on the server proxy.
 */

export const AI_CANVAS_GENERATOR = 'ai.canvas_generator';

const LOCAL_TIER_FLAGS: Record<string, ReadonlySet<string>> = {
  [AI_CANVAS_GENERATOR]: new Set(['advanced', 'pro']),
};

export function normalizeTier(raw?: string | null): string {
  const tier = (raw || 'basic').trim().toLowerCase();
  return tier === 'free' ? 'basic' : tier;
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
