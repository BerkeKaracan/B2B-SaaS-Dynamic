'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { fetchRealtimeAccessToken } from '@/lib/authCookies';

const REALTIME_STORAGE_KEY = 'b2b-saas-realtime';

let sharedClient: SupabaseClient<Database> | null = null;
let sharedToken: string | null = null;
let inflight: Promise<SupabaseClient<Database> | null> | null = null;

function buildRealtimeClient(
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
      // Avoid clashing with the default GoTrue storage key used by supabaseClient.ts
      storageKey: REALTIME_STORAGE_KEY,
    },
  });

  try {
    client.realtime.setAuth(accessToken);
  } catch {
    /* ignore */
  }

  return client;
}

/**
 * One shared browser Realtime client for chat, notifications, and canvas collab.
 * Reuses the instance when the access token is unchanged.
 */
export async function getSharedRealtimeClient(): Promise<SupabaseClient<Database> | null> {
  if (typeof window === 'undefined') return null;

  if (inflight) return inflight;

  inflight = (async () => {
    const token = await fetchRealtimeAccessToken();
    if (!token) {
      sharedClient = null;
      sharedToken = null;
      return null;
    }

    if (sharedClient && sharedToken === token) {
      return sharedClient;
    }

    // Token rotated — drop old client (channels must re-subscribe)
    sharedClient = null;
    sharedToken = null;

    const client = buildRealtimeClient(token);
    if (!client) return null;

    sharedClient = client;
    sharedToken = token;
    return client;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

/** Sync helper when a token is already in hand (same singleton semantics). */
export function getOrCreateRealtimeClientWithToken(
  accessToken: string
): SupabaseClient<Database> | null {
  if (typeof window === 'undefined') return null;
  if (!accessToken) return null;

  if (sharedClient && sharedToken === accessToken) {
    return sharedClient;
  }

  sharedClient = null;
  sharedToken = null;
  const client = buildRealtimeClient(accessToken);
  if (!client) return null;
  sharedClient = client;
  sharedToken = accessToken;
  return client;
}
