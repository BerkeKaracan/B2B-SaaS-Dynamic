/**
 * Compact encoding + size guards for canvas Yjs Realtime payloads.
 * Keep under Supabase broadcast limits; drop oversized updates (no retry storm).
 */

/** Soft cap — well below typical Realtime ~256KB hard limit. */
export const MAX_Y_UPDATE_BYTES = 50_000;

export function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function base64ToUint8(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

export type SizedPayload =
  | { ok: true; base64: string; byteLength: number }
  | { ok: false; byteLength: number; reason: 'too_large' | 'empty' };

/** Encode for broadcast; refuse payloads that would melt Realtime. */
export function encodeYUpdateForBroadcast(
  update: Uint8Array,
  maxBytes: number = MAX_Y_UPDATE_BYTES
): SizedPayload {
  if (!update || update.byteLength === 0) {
    return { ok: false, byteLength: 0, reason: 'empty' };
  }
  if (update.byteLength > maxBytes) {
    return {
      ok: false,
      byteLength: update.byteLength,
      reason: 'too_large',
    };
  }
  return {
    ok: true,
    base64: uint8ToBase64(update),
    byteLength: update.byteLength,
  };
}

export function decodeYUpdateFromBroadcast(
  base64: unknown,
  maxBytes: number = MAX_Y_UPDATE_BYTES
): Uint8Array | null {
  if (typeof base64 !== 'string' || !base64) return null;
  try {
    const bytes = base64ToUint8(base64);
    if (bytes.byteLength === 0 || bytes.byteLength > maxBytes) return null;
    return bytes;
  } catch {
    return null;
  }
}
