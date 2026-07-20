import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/requireApiAuth';
import { isPlatformAdmin, internalApiOrigin } from '@/lib/platformAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Platform-admin only: list all workspaces (proxied to FastAPI internal API). */
export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request);
  if (auth.error) return auth.error;

  if (!isPlatformAdmin(auth.user.email)) {
    return NextResponse.json({ detail: 'Not found' }, { status: 404 });
  }

  const secret = process.env.INTERNAL_API_SECRET || '';
  if (!secret) {
    return NextResponse.json(
      { detail: 'INTERNAL_API_SECRET is not configured' },
      { status: 500 }
    );
  }

  const res = await fetch(`${internalApiOrigin()}/api/internal/tenants`, {
    headers: { 'X-Internal-Secret': secret },
    cache: 'no-store',
  });

  const body = await res.json().catch(() => null);
  return NextResponse.json(body ?? [], { status: res.status });
}
