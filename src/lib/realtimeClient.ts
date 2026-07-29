'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { fetchRealtimeAccessToken } from '@/lib/authCookies';

const REALTIME_STORAGE_KEY = 'b2b-saas-realtime';
/** Refresh cached token this many seconds before JWT exp. */
const TOKEN_REFRESH_SKEW_SEC = 60;

let sharedClient: SupabaseClient<Database> | null = null;
let sharedToken: string | null = null;
let inflight: Promise<SupabaseClient<Database> | null> | null = null;

function jwtExpUnix(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const json = JSON.parse(
      atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    ) as { exp?: number };
    return typeof json.exp === 'number' ? json.exp : null;
  } catch {
    return null;
  }
}

function cachedTokenStillValid(token: string): boolean {
  const exp = jwtExpUnix(token);
  if (exp == null) return true; // opaque — keep using until Realtime fails
  const now = Math.floor(Date.now() / 1000);
  return exp - TOKEN_REFRESH_SKEW_SEC > now;
}

async function applyRealtimeAuth(
  client: SupabaseClient<Database>,
  accessToken: string
): Promise<void> {
  try {
    await client.realtime.setAuth(accessToken);
  } catch {
    /* ignore — subscribe path still surfaces auth failures */
  }
}

async function buildRealtimeClient(
  accessToken: string
): Promise<SupabaseClient<Database> | null> {
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

  await applyRealtimeAuth(client, accessToken);
  return client;
}

/** Sync peek — never hits /api/realtime-token or setAuth. Use for cleanup. */
export function peekSharedRealtimeClient(): SupabaseClient<Database> | null {
  return sharedClient;
}

/**
 * One shared browser Realtime client for chat, notifications, and canvas collab.
 * Reuses the instance without re-fetching the token or re-calling setAuth
 * (setAuth reconnects the socket and kills live channels).
 */
export async function getSharedRealtimeClient(): Promise<SupabaseClient<Database> | null> {
  if (typeof window === 'undefined') return null;

  // Hot path: keep socket stable — no network, no setAuth
  if (sharedClient && sharedToken && cachedTokenStillValid(sharedToken)) {
    return sharedClient;
  }

  if (inflight) return inflight;

  inflight = (async () => {
    // Re-check after waiting on another caller
    if (sharedClient && sharedToken && cachedTokenStillValid(sharedToken)) {
      return sharedClient;
    }

    const token = await fetchRealtimeAccessToken();
    if (!token) {
      sharedClient = null;
      sharedToken = null;
      return null;
    }

    // Same token string → keep client; do NOT setAuth again
    if (sharedClient && sharedToken === token) {
      return sharedClient;
    }

    // Token missing/rotated/expired — rebuild (channels must re-subscribe)
    sharedClient = null;
    sharedToken = null;

    const client = await buildRealtimeClient(token);
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

  if (
    sharedClient &&
    sharedToken &&
    cachedTokenStillValid(sharedToken) &&
    sharedToken === accessToken
  ) {
    return sharedClient;
  }

  sharedClient = null;
  sharedToken = null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!supabaseUrl || !anonKey) return null;

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
      storageKey: REALTIME_STORAGE_KEY,
    },
  });

  void applyRealtimeAuth(client, accessToken);
  sharedClient = client;
  sharedToken = accessToken;
  return client;
}
