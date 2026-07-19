import { NextRequest, NextResponse } from 'next/server';
import {
  isFeatureEnabledLocal,
  normalizeTier,
} from '@/lib/featureGate';
import {
  resolveFeatureFlagsApiKey,
  resolveFeatureFlagsUrl,
} from '@/lib/featureFlagsEnv';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EVALUATE_TIMEOUT_MS = 2500;

/**
 * Browser-safe proxy to the remote Feature Flag Delivery API.
 * Keeps FEATURE_FLAGS_API_KEY on the server only.
 *
 * GET /api/features/evaluate?key=&tenant_id=&tier=
 * → { enabled: boolean, source: "remote" | "fallback" | "error" }
 *
 * When FEATURE_FLAGS_URL is set, Pulse Flag is the source of truth.
 * Local advanced/pro fallback is used ONLY if the URL is unset.
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

  const { url: base } = resolveFeatureFlagsUrl();
  const apiKey = resolveFeatureFlagsApiKey();

  // Key without URL = misconfigured production (do not silently use local matrix).
  if (!base && apiKey) {
    return NextResponse.json({
      enabled: false,
      source: 'error',
      detail: 'FEATURE_FLAGS_URL missing',
    });
  }

  // No remote configured → legacy local tier matrix (local dev only).
  if (!base) {
    return NextResponse.json({
      enabled: isFeatureEnabledLocal(key, tier),
      source: 'fallback',
    });
  }

  if (!apiKey) {
    console.error(
      '[features/evaluate] FEATURE_FLAGS_URL is set but FEATURE_FLAGS_API_KEY is missing'
    );
    return NextResponse.json({
      enabled: false,
      source: 'error',
      detail: 'FEATURE_FLAGS_API_KEY missing',
    });
  }

  const qs = new URLSearchParams({
    key,
    tenant_id: tenantId,
    tier,
  });
  const remoteUrl = `${base}/evaluate?${qs.toString()}`;

  try {
    const res = await fetch(remoteUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'User-Agent': 'saas-engine-ff-proxy',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(EVALUATE_TIMEOUT_MS),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(
        `[features/evaluate] remote ${res.status} for ${key}: ${body.slice(0, 200)}`
      );
      return NextResponse.json({
        enabled: false,
        source: 'error',
        detail: `remote_${res.status}`,
      });
    }

    const payload = (await res.json()) as { enabled?: unknown };
    if (typeof payload?.enabled !== 'boolean') {
      return NextResponse.json({
        enabled: false,
        source: 'error',
        detail: 'invalid_payload',
      });
    }

    return NextResponse.json({
      enabled: payload.enabled,
      source: 'remote',
    });
  } catch (err) {
    console.error('[features/evaluate] remote failed', err);
    return NextResponse.json({
      enabled: false,
      source: 'error',
      detail: 'unreachable',
    });
  }
}
