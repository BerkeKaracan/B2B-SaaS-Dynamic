import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { fetchRealtimeAccessToken } from '@/lib/authCookies';

/**
 * Browser Supabase client authenticated with a short-lived access token
 * from /api/auth/realtime-token (HttpOnly session → memory only).
 */
export function createAuthedSupabaseClient(
  accessToken: string
): SupabaseClient<Database> | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!supabaseUrl || !anonKey || !accessToken) return null;

  const client = createClient<Database>(supabaseUrl, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  try {
    client.realtime.setAuth(accessToken);
  } catch {
    /* ignore */
  }

  return client;
}

export async function createRealtimeSupabaseClient(): Promise<SupabaseClient<Database> | null> {
  const token = await fetchRealtimeAccessToken();
  if (!token) return null;
  return createAuthedSupabaseClient(token);
}
