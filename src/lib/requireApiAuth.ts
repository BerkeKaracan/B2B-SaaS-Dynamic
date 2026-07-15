import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient, type User } from '@supabase/supabase-js';

type AuthSuccess = { user: User; token: string; error?: undefined };
type AuthFailure = { user?: undefined; token?: undefined; error: NextResponse };

/**
 * Require a valid Supabase session for Next.js BFF routes
 * (send-email, notion-export, etc.).
 *
 * Accepts Bearer token or the same-origin `token` cookie used by the app.
 */
export async function requireApiAuth(
  request: Request
): Promise<AuthSuccess | AuthFailure> {
  const authHeader = request.headers.get('authorization');
  let token =
    authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get('token')?.value?.trim() || '';
    } catch {
      token = '';
    }
  }

  if (!token) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      ),
    };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Auth is not configured' },
        { status: 500 }
      ),
    };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      ),
    };
  }

  return { user: data.user, token };
}
