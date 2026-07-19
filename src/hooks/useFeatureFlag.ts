'use client';

import { useEffect, useState } from 'react';
import { useTenantStore } from '@/store/useTenantStore';
import { isFeatureEnabledLocal } from '@/lib/featureGate';

type FeatureFlagState = {
  enabled: boolean;
  isLoading: boolean;
};

/**
 * Evaluates a feature via the Next.js server proxy (never exposes Delivery API key).
 * While loading, enabled is false so gated UI stays hidden until we know.
 */
export function useFeatureFlag(
  key: string,
  tenantId?: string | null
): FeatureFlagState {
  const storeTenant = useTenantStore((s) => s.tenant);
  const resolvedTenantId = tenantId || storeTenant?.id || null;
  const tier = storeTenant?.tier;

  const [enabled, setEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!resolvedTenantId || !key) {
      setEnabled(false);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const run = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          key,
          tenant_id: resolvedTenantId,
          tier: tier || 'basic',
        });
        const res = await fetch(`/api/features/evaluate?${params}`, {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error(`evaluate ${res.status}`);
        }
        const data = (await res.json()) as { enabled?: boolean };
        if (!cancelled) {
          setEnabled(Boolean(data.enabled));
        }
      } catch {
        if (!cancelled) {
          // Client-side last resort if proxy itself fails.
          setEnabled(isFeatureEnabledLocal(key, tier));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [key, resolvedTenantId, tier]);

  return { enabled, isLoading };
}
