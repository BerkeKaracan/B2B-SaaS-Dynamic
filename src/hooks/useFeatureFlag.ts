'use client';

import { useEffect, useState } from 'react';
import { useTenantStore } from '@/store/useTenantStore';
import { normalizeTier } from '@/lib/featureGate';

type FeatureFlagState = {
  enabled: boolean;
  isLoading: boolean;
};

type RemoteFlag = {
  key: string;
  tenantId: string;
  tier: string;
  enabled: boolean;
};

/**
 * Evaluates a feature via the Next.js server proxy (never exposes Delivery API key).
 * While loading, enabled is false so gated UI stays hidden until we know.
 * Re-runs whenever the zustand tenant tier changes (e.g. billing demo switch).
 */
export function useFeatureFlag(
  key: string,
  tenantId?: string | null
): FeatureFlagState {
  const storeTenant = useTenantStore((s) => s.tenant);
  const resolvedTenantId = tenantId || storeTenant?.id || null;
  const tier = normalizeTier(storeTenant?.tier);
  const canEvaluate = Boolean(resolvedTenantId && key);

  const [remote, setRemote] = useState<RemoteFlag | null>(null);

  useEffect(() => {
    if (!canEvaluate || !resolvedTenantId) {
      return;
    }

    const requestKey = key;
    const requestTenantId = resolvedTenantId;
    const requestTier = tier;
    const controller = new AbortController();
    let cancelled = false;

    void (async () => {
      try {
        const params = new URLSearchParams({
          key: requestKey,
          tenant_id: requestTenantId,
          tier: requestTier,
        });
        const res = await fetch(`/api/features/evaluate?${params}`, {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error(`evaluate ${res.status}`);
        }
        const data = (await res.json()) as {
          enabled?: boolean;
          source?: string;
          detail?: string;
        };
        // #region agent log
        fetch('http://127.0.0.1:7739/ingest/0fa71273-4aa1-451c-a3ab-36e36806b194', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Debug-Session-Id': '85388b',
          },
          body: JSON.stringify({
            sessionId: '85388b',
            hypothesisId: 'E',
            location: 'useFeatureFlag.ts:response',
            message: 'client evaluate response',
            data: {
              enabled: Boolean(data.enabled),
              source: data.source ?? null,
              detail: data.detail ?? null,
              key: requestKey,
              tier: requestTier,
              tenantPrefix: requestTenantId.slice(0, 8),
              httpStatus: res.status,
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
        if (!cancelled) {
          setRemote({
            key: requestKey,
            tenantId: requestTenantId,
            tier: requestTier,
            enabled: Boolean(data.enabled),
          });
        }
      } catch (err) {
        // #region agent log
        fetch('http://127.0.0.1:7739/ingest/0fa71273-4aa1-451c-a3ab-36e36806b194', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Debug-Session-Id': '85388b',
          },
          body: JSON.stringify({
            sessionId: '85388b',
            hypothesisId: 'E',
            location: 'useFeatureFlag.ts:catch',
            message: 'client evaluate failed',
            data: {
              err: err instanceof Error ? err.message : 'unknown',
              key: requestKey,
              tier: requestTier,
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
        if (!cancelled && !controller.signal.aborted) {
          // Fail closed — do not apply local advanced/pro matrix here.
          // That would ignore Pulse Flag rules whenever the proxy errors.
          setRemote({
            key: requestKey,
            tenantId: requestTenantId,
            tier: requestTier,
            enabled: false,
          });
        }
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [canEvaluate, key, resolvedTenantId, tier]);

  if (!canEvaluate) {
    return { enabled: false, isLoading: false };
  }

  const matches =
    remote?.key === key &&
    remote?.tenantId === resolvedTenantId &&
    remote?.tier === tier;

  return {
    enabled: matches ? remote.enabled : false,
    isLoading: !matches,
  };
}
