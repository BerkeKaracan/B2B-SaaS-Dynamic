/**
 * Browser WebSocket origin for live canvas cursors (FastAPI `/ws/canvas/...`).
 *
 * Resolution order:
 * 1. NEXT_PUBLIC_WS_URL (e.g. wss://api.your-domain.com) — preferred in prod
 * 2. Derive from NEXT_PUBLIC_API_URL (https→wss, http→ws)
 * 3. Local only: ws(s)://localhost|127.0.0.1:8000
 *
 * On a production hostname without (1)/(2), returns null — never guess :8000
 * on the Vercel frontend host (CSP would allow it; the socket would still die).
 */

export function httpUrlToWsBase(apiOrWsUrl: string): string | null {
  const trimmed = apiOrWsUrl.trim().replace(/\/$/, '');
  if (!trimmed) return null;
  try {
    if (trimmed.startsWith('wss://') || trimmed.startsWith('ws://')) {
      const u = new URL(trimmed);
      return `${u.protocol}//${u.host}`;
    }
    const u = new URL(trimmed);
    if (u.protocol === 'https:') return `wss://${u.host}`;
    if (u.protocol === 'http:') return `ws://${u.host}`;
  } catch {
    return null;
  }
  return null;
}

export function resolveCanvasCollabWsBase(opts: {
  explicitWsUrl?: string | null;
  apiUrl?: string | null;
  protocol: string;
  hostname: string;
}): string | null {
  const fromExplicit = httpUrlToWsBase(opts.explicitWsUrl || '');
  if (fromExplicit) return fromExplicit;

  const fromApi = httpUrlToWsBase(opts.apiUrl || '');
  if (fromApi) return fromApi;

  const host = (opts.hostname || '').trim() || 'localhost';
  const isLocal = host === 'localhost' || host === '127.0.0.1';
  if (!isLocal) return null;

  const proto = opts.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${host}:8000`;
}

export function getCanvasCollabWsBase(): string | null {
  if (typeof window === 'undefined') return null;

  return resolveCanvasCollabWsBase({
    explicitWsUrl: process.env.NEXT_PUBLIC_WS_URL,
    apiUrl: process.env.NEXT_PUBLIC_API_URL,
    protocol: window.location.protocol,
    hostname: window.location.hostname || 'localhost',
  });
}

export function getCanvasCollabWsUrl(roomId: string): string | null {
  const base = getCanvasCollabWsBase();
  if (!base || !roomId) return null;
  return `${base}/ws/canvas/${encodeURIComponent(roomId)}`;
}
