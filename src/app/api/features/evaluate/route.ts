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

/** Tenant IDs are UUIDs — reject anything else before it touches a fetch URL. */
const TENANT_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Feature keys are dotted identifiers, never path/host material. */
const FEATURE_KEY_RE = /^[a-z0-9][a-z0-9._-]{0,127}$/i;

function buildTrustedTenantLookupUrl(tenantId: string): URL | null {
  if (!TENANT_UUID_RE.test(tenantId)) return null;
  try {
    const base = getApiBaseUrl().replace(/\/$/, '');
    const url = new URL(`${base}/api/tenants/${tenantId}`);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    // UUID has no `/` / `@` / `:`, so pathname must be exact — blocks path injection.
    if (url.pathname !== `/api/tenants/${tenantId}`) return null;
    return url;
  } catch {
    return null;
  }
}

function buildTrustedRemoteEvaluateUrl(
  base: string,
  key: string,
  tenantId: string,
  tier: string
): URL | null {
  try {
    const url = new URL(`${base.replace(/\/$/, '')}/evaluate`);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    url.searchParams.set('key', key);
    url.searchParams.set('tenant_id', tenantId);
    url.searchParams.set('tier', tier);
    return url;
  } catch {
    return null;
  }
}

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

  if (!TENANT_UUID_RE.test(tenantId) || !FEATURE_KEY_RE.test(key)) {
    return NextResponse.json(
      { error: 'invalid key or tenant_id' },
      { status: 400 }
    );
  }

  const tenantLookupUrl = buildTrustedTenantLookupUrl(tenantId);
  if (!tenantLookupUrl) {
    return NextResponse.json(
      { error: 'invalid key or tenant_id' },
      { status: 400 }
    );
  }

  // Prove membership + resolve tier from backend (do not trust client tier)
  let tier = 'basic';
  try {
    const tenantRes = await fetch(tenantLookupUrl, {
      headers: {
        Authorization: `Bearer ${auth.token}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(EVALUATE_TIMEOUT_MS),
    });
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

  const remoteUrl = buildTrustedRemoteEvaluateUrl(base, key, tenantId, tier);
  if (!remoteUrl) {
    return NextResponse.json({
      enabled: false,
      source: 'error',
      detail: 'invalid_FEATURE_FLAGS_URL',
    });
  }

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
