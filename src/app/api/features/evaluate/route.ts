import { NextRequest, NextResponse } from 'next/server';
import {
  isFeatureEnabledLocal,
  normalizeTier,
} from '@/lib/featureGate';
import {
  resolveFeatureFlagsApiKey,
  resolveFeatureFlagsUrl,
} from '@/lib/featureFlagsEnv';
import { requireApiAuth } from '@/lib/requireApiAuth';
import { getApiBaseUrl } from '@/lib/apiBase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EVALUATE_TIMEOUT_MS = 2500;

/**
 * Browser-safe proxy to the remote Feature Flag Delivery API.
 * Keeps FEATURE_FLAGS_API_KEY on the server only.
 *
 * Requires a valid session. Tier is derived server-side from the tenant
 * membership when possible — client-supplied `tier` is ignored for remote
 * evaluation and only used as a last-resort local fallback label.
 *
 * GET /api/features/evaluate?key=&tenant_id=
 * → { enabled: boolean, source: "remote" | "fallback" | "error" }
 */
export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request);
  if (auth.error) return auth.error;

  const key = request.nextUrl.searchParams.get('key')?.trim();
  const tenantId = request.nextUrl.searchParams.get('tenant_id')?.trim();

  if (!key || !tenantId) {
    return NextResponse.json(
      { error: 'key and tenant_id are required' },
      { status: 400 }
    );
  }

  // Prove membership + resolve tier from backend (do not trust client tier)
  let tier = 'basic';
  try {
    const tenantRes = await fetch(
      `${getApiBaseUrl().replace(/\/$/, '')}/api/tenants/${tenantId}`,
      {
        headers: {
          Authorization: `Bearer ${auth.token}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(EVALUATE_TIMEOUT_MS),
      }
    );
    if (!tenantRes.ok) {
      return NextResponse.json(
        { success: false, error: 'Workspace access denied' },
        { status: 403 }
      );
    }
    const tenantData = (await tenantRes.json()) as { tier?: string };
    tier = normalizeTier(tenantData.tier);
  } catch {
    return NextResponse.json(
      { enabled: false, source: 'error', detail: 'tenant_lookup_failed' },
      { status: 503 }
    );
  }

  const { url: base } = resolveFeatureFlagsUrl();
  const apiKey = resolveFeatureFlagsApiKey();

  if (!base && apiKey) {
    return NextResponse.json({
      enabled: false,
      source: 'error',
      detail: 'FEATURE_FLAGS_URL missing',
    });
  }

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
