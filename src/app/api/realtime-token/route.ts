import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Return the HttpOnly access token for Realtime / Supabase JS only.
 * Caller must keep it in memory — do not persist to localStorage.
 */
export async function GET() {
  const jar = await cookies();
  const token = jar.get('token')?.value;
  if (!token) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(
    { access_token: token },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
