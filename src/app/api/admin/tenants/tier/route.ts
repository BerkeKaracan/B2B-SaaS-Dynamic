import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/requireApiAuth';
import { isPlatformAdmin, internalApiOrigin } from '@/lib/platformAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Platform-admin only: set a workspace tier via the FastAPI internal API. */
export async function POST(request: NextRequest) {
  const auth = await requireApiAuth(request);
  if (auth.error) return auth.error;

  if (!isPlatformAdmin(auth.user.email)) {
    return NextResponse.json({ detail: 'Not found' }, { status: 404 });
  }

  let body: { tenant_id?: string; tier?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: 'Invalid JSON' }, { status: 400 });
  }

  const tenantId = (body.tenant_id || '').trim();
  const tier = (body.tier || '').toLowerCase().trim();
  if (!tenantId || !['basic', 'advanced', 'pro'].includes(tier)) {
    return NextResponse.json(
      { detail: 'tenant_id and a valid tier are required' },
      { status: 400 }
    );
  }

  const secret = process.env.INTERNAL_API_SECRET || '';
  if (!secret) {
    return NextResponse.json(
      { detail: 'INTERNAL_API_SECRET is not configured' },
      { status: 500 }
    );
  }

  const res = await fetch(
    `${internalApiOrigin()}/api/internal/tenants/${encodeURIComponent(tenantId)}/tier`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': secret,
      },
      body: JSON.stringify({ tier }),
      cache: 'no-store',
    }
  );

  const resBody = await res.json().catch(() => null);
  return NextResponse.json(resBody ?? {}, { status: res.status });
}
