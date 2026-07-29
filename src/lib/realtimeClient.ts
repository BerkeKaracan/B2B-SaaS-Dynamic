'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { fetchRealtimeAccessToken } from '@/lib/authCookies';

const REALTIME_STORAGE_KEY = 'b2b-saas-realtime';
const COLLAB_STORAGE_KEY = 'b2b-saas-canvas-collab';
/** Refresh cached user token this many seconds before JWT exp. */
const TOKEN_REFRESH_SKEW_SEC = 60;

let sharedClient: SupabaseClient<Database> | null = null;
let sharedToken: string | null = null;
let inflight: Promise<SupabaseClient<Database> | null> | null = null;

/** Anon-only client for public presence/broadcast (live cursors). Never setAuth. */
let collabClient: SupabaseClient<Database> | null = null;

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
  if (exp == null) return true;
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
    /* ignore */
  }
}

async function buildAuthedRealtimeClient(
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
      storageKey: REALTIME_STORAGE_KEY,
    },
    realtime: {
      params: { eventsPerSecond: 10 },
      // Keep JWT stable across removeChannel / resubscribe (supabase-js #1904)
      accessToken: async () => sharedToken || accessToken,
    },
  });

  await applyRealtimeAuth(client, accessToken);
  return client;
}

/**
 * Public Realtime client for canvas cursors / optional Yjs broadcast.
 * Anon key only — no user JWT, no setAuth, no /api/realtime-token.
 * Presence + public broadcast do not need a logged-in JWT; mixing JWT/setAuth
 * on this path was causing CHANNEL_ERROR and token spam on every reconnect.
 */
export function getCanvasCollabClient(): SupabaseClient<Database> | null {
  if (typeof window === 'undefined') return null;

  if (collabClient) return collabClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!supabaseUrl || !anonKey) {
    console.warn(
      '[collab] NEXT_PUBLIC_SUPABASE_URL / ANON_KEY missing — Live disabled'
    );
    return null;
  }

  collabClient = createClient<Database>(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: COLLAB_STORAGE_KEY,
    },
    realtime: {
      params: { eventsPerSecond: 8 },
    },
  });

  return collabClient;
}

/** Sync peek for authed client cleanup — never hits /api/realtime-token. */
export function peekSharedRealtimeClient(): SupabaseClient<Database> | null {
  return sharedClient;
}

/**
 * Authed Realtime client for postgres_changes (chat, notifications).
 * Not used for canvas presence — see getCanvasCollabClient().
 */
export async function getSharedRealtimeClient(): Promise<SupabaseClient<Database> | null> {
  if (typeof window === 'undefined') return null;

  if (sharedClient && sharedToken && cachedTokenStillValid(sharedToken)) {
    return sharedClient;
  }

  if (inflight) return inflight;

  inflight = (async () => {
    if (sharedClient && sharedToken && cachedTokenStillValid(sharedToken)) {
      return sharedClient;
    }

    const token = await fetchRealtimeAccessToken();
    if (!token) {
      sharedClient = null;
      sharedToken = null;
      return null;
    }

    if (sharedClient && sharedToken === token) {
      return sharedClient;
    }

    sharedClient = null;
    sharedToken = null;

    const client = await buildAuthedRealtimeClient(token);
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
    realtime: {
      params: { eventsPerSecond: 10 },
      accessToken: async () => sharedToken || accessToken,
    },
  });

  void applyRealtimeAuth(client, accessToken);
  sharedClient = client;
  sharedToken = accessToken;
  return client;
}
