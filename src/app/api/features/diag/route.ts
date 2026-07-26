import { NextRequest, NextResponse } from 'next/server';
import { normalizeTier, resolveFeatureEnabled } from '@/lib/featureGate';
import {
  resolveFeatureFlagsApiKey,
  resolveFeatureFlagsUrl,
} from '@/lib/featureFlagsEnv';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Safe connection probe for Pulse Flag (no secrets in response).
 * GET /api/features/diag?key=ai.canvas_generator&tenant_id=...&tier=basic
 */
export async function GET(request: NextRequest) {
  const key =
    request.nextUrl.searchParams.get('key')?.trim() || 'ai.canvas_generator';
  const tenantId = request.nextUrl.searchParams.get('tenant_id')?.trim();
  const tier = normalizeTier(request.nextUrl.searchParams.get('tier'));

  const { url: base, from: urlFrom, present: urlEnvPresent } =
    resolveFeatureFlagsUrl();
  const apiKey = resolveFeatureFlagsApiKey();
  const keyPrefix = apiKey ? `${apiKey.slice(0, 6)}…` : null;

  const relatedEnvNames = Object.keys(process.env)
    .filter((name) => /FEATURE|FLAGS|PULSE/i.test(name))
    .sort();

  const result: Record<string, unknown> = {
    ok: false,
    hasUrl: Boolean(base),
    hasKey: Boolean(apiKey),
    keyPrefix,
    urlFrom,
    urlEnvPresent,
    relatedEnvNames,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    urlHost: base
      ? (() => {
          try {
            return new URL(base).host;
          } catch {
            return 'invalid_url';
          }
        })()
      : null,
    key,
    tenantId: tenantId || null,
    tier,
    remoteStatus: null as number | null,
    remoteEnabled: null as boolean | null,
    resolvedEnabled: null as boolean | null,
    source: null as string | null,
    detail: null as string | null,
  };

  if (!base) {
    const resolved = resolveFeatureEnabled(key, tier, { status: 'unset' });
    result.resolvedEnabled = resolved.enabled;
    result.source = resolved.source;
    result.detail =
      'FEATURE_FLAGS_URL missing on this Vercel deployment. Add it and Redeploy.';
    result.ok = resolved.enabled;
    return NextResponse.json(result);
  }
  if (!apiKey) {
    const resolved = resolveFeatureEnabled(key, tier, { status: 'error' });
    result.resolvedEnabled = resolved.enabled;
    result.source = resolved.source;
    result.detail =
      'FEATURE_FLAGS_API_KEY missing (must be Pulse project delivery key)';
    result.ok = resolved.enabled;
    return NextResponse.json(result);
  }
  if (!tenantId) {
    result.detail = 'tenant_id query param required for probe';
    return NextResponse.json(result);
  }

  const qs = new URLSearchParams({ key, tenant_id: tenantId, tier });
  try {
    const res = await fetch(`${base}/evaluate?${qs}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'User-Agent': 'saas-engine-ff-diag',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(2500),
    });
    result.remoteStatus = res.status;
    const bodyText = await res.text();
    let enabled: boolean | null = null;
    try {
      const json = JSON.parse(bodyText) as {
        enabled?: unknown;
        detail?: unknown;
      };
      if (typeof json.enabled === 'boolean') enabled = json.enabled;
      if (typeof json.detail === 'string') result.detail = json.detail;
    } catch {
      result.detail = bodyText.slice(0, 120);
    }
    result.remoteEnabled = enabled;

    if (res.ok && typeof enabled === 'boolean') {
      const resolved = resolveFeatureEnabled(key, tier, {
        status: 'ok',
        enabled,
      });
      result.resolvedEnabled = resolved.enabled;
      result.source = resolved.source;
      result.ok = resolved.enabled;
    } else {
      const resolved = resolveFeatureEnabled(key, tier, { status: 'error' });
      result.resolvedEnabled = resolved.enabled;
      result.source = resolved.source;
      result.ok = resolved.enabled;
      if (!result.detail) result.detail = `remote_${res.status}`;
    }
    return NextResponse.json(result);
  } catch (err) {
    const resolved = resolveFeatureEnabled(key, tier, { status: 'error' });
    result.resolvedEnabled = resolved.enabled;
    result.source = resolved.source;
    result.ok = resolved.enabled;
    result.detail = err instanceof Error ? err.message : 'unreachable';
    return NextResponse.json(result);
  }
}
