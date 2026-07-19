import { NextRequest, NextResponse } from 'next/server';
import {
  isFeatureEnabledLocal,
  normalizeTier,
} from '@/lib/featureGate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EVALUATE_TIMEOUT_MS = 2500;

/**
 * Browser-safe proxy to the remote Feature Flag Delivery API.
 * Keeps FEATURE_FLAGS_API_KEY on the server only.
 *
 * GET /api/features/evaluate?key=&tenant_id=&tier=
 * → { enabled: boolean, source: "remote" | "fallback" }
 */
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key')?.trim();
  const tenantId = request.nextUrl.searchParams.get('tenant_id')?.trim();
  const tier = normalizeTier(request.nextUrl.searchParams.get('tier'));

  if (!key || !tenantId) {
    return NextResponse.json(
      { error: 'key and tenant_id are required' },
      { status: 400 }
    );
  }

  const base = (process.env.FEATURE_FLAGS_URL || '').trim().replace(/\/$/, '');
  const apiKey = (process.env.FEATURE_FLAGS_API_KEY || '').trim();

  if (base) {
    const qs = new URLSearchParams({
      key,
      tenant_id: tenantId,
      tier,
    });
    const remoteUrl = `${base}/evaluate?${qs.toString()}`;

    try {
      const headers: HeadersInit = {
        Accept: 'application/json',
        'User-Agent': 'saas-engine-ff-proxy',
      };
      if (apiKey) {
        headers.Authorization = `Bearer ${apiKey}`;
      }

      const res = await fetch(remoteUrl, {
        method: 'GET',
        headers,
        cache: 'no-store',
        signal: AbortSignal.timeout(EVALUATE_TIMEOUT_MS),
      });

      if (res.ok) {
        const payload = (await res.json()) as { enabled?: unknown };
        if (typeof payload?.enabled === 'boolean') {
          return NextResponse.json({
            enabled: payload.enabled,
            source: 'remote',
          });
        }
      }
    } catch {
      // Fall through to legacy tier check.
    }
  }

  return NextResponse.json({
    enabled: isFeatureEnabledLocal(key, tier),
    source: 'fallback',
  });
}
