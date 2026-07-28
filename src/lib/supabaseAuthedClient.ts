'use client';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { fetchRealtimeAccessToken } from '@/lib/authCookies';
import {
  getOrCreateRealtimeClientWithToken,
  getSharedRealtimeClient,
} from '@/lib/realtimeClient';

/**
 * Returns the shared Realtime Supabase client for the given access token.
 * Prefer `getSharedRealtimeClient()` — this exists for call sites that already fetched a token.
 */
export function createAuthedSupabaseClient(
  accessToken: string
): SupabaseClient<Database> | null {
  return getOrCreateRealtimeClientWithToken(accessToken);
}

export async function createRealtimeSupabaseClient(): Promise<SupabaseClient<Database> | null> {
  return getSharedRealtimeClient();
}

/** @deprecated Use getSharedRealtimeClient — kept for clarity at call sites. */
export { getSharedRealtimeClient, fetchRealtimeAccessToken };
