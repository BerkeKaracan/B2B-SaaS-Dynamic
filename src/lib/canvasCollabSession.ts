/**
 * Module-level canvas collab WebSocket — survives React remounts.
 * One socket per roomId per browser tab.
 */

import { fetchRealtimeAccessToken } from '@/lib/authCookies';
import { getCanvasCollabWsUrl } from '@/lib/collabWsUrl';

export type CollabConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'subscribed'
  | 'error'
  | 'no-token';

export type CursorState = {
  user: string;
  color: string;
  cursor: { x: number; y: number } | null;
};

type Handlers = {
  onStatus: (s: CollabConnectionStatus) => void;
  onCursors: (c: Record<string, CursorState>) => void;
  onMessage: (msg: Record<string, unknown>) => void;
};

type RoomSession = {
  roomId: string;
  selfKey: string;
  user: { name: string; color: string };
  ws: WebSocket | null;
  ready: boolean;
  refs: number;
  handlers: Set<Handlers>;
  status: CollabConnectionStatus;
  cursors: Record<string, CursorState>;
  closeTimer: ReturnType<typeof setTimeout> | null;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  attempt: number;
};

const sessions = new Map<string, RoomSession>();

function createSecureClientKey(): string {
  if (typeof crypto.randomUUID === 'function') {
    return `client-${crypto.randomUUID()}`;
  }
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return `client-${Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('')}`;
}

function tabKey(): string {
  try {
    const k = 'b2b-collab-tab-key';
    let v = sessionStorage.getItem(k);
    if (!v) {
      v = createSecureClientKey();
      sessionStorage.setItem(k, v);
    }
    return v;
  } catch {
    return createSecureClientKey();
  }
}

function emitStatus(s: RoomSession, status: CollabConnectionStatus) {
  s.status = status;
  for (const h of s.handlers) h.onStatus(status);
}

function emitCursors(s: RoomSession) {
  for (const h of s.handlers) h.onCursors({ ...s.cursors });
}

function clearTimers(s: RoomSession) {
  if (s.closeTimer) {
    clearTimeout(s.closeTimer);
    s.closeTimer = null;
  }
  if (s.reconnectTimer) {
    clearTimeout(s.reconnectTimer);
    s.reconnectTimer = null;
  }
}

async function openSocket(s: RoomSession) {
  const url = getCanvasCollabWsUrl(s.roomId);
  if (!url) {
    emitStatus(s, 'error');
    return;
  }

  emitStatus(s, 'connecting');

  // Prefer real JWT; local Docker may allow empty token (backend insecure mode)
  const token = (await fetchRealtimeAccessToken()) || 'local-dev';

  let ws: WebSocket;
  try {
    ws = new WebSocket(url);
  } catch {
    emitStatus(s, 'error');
    return;
  }

  s.ws = ws;

  ws.onopen = () => {
    ws.send(
      JSON.stringify({
        type: 'auth',
        token,
        selfKey: s.selfKey,
        user: s.user.name,
        color: s.user.color,
      })
    );
  };

  ws.onmessage = (ev) => {
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(String(ev.data)) as Record<string, unknown>;
    } catch {
      return;
    }

    if (msg.type === 'ready') {
      s.ready = true;
      s.attempt = 0;
      const peers = Array.isArray(msg.peers) ? msg.peers : [];
      const next: Record<string, CursorState> = {};
      for (const p of peers as Array<Record<string, unknown>>) {
        const key = typeof p.selfKey === 'string' ? p.selfKey : '';
        if (!key || key === s.selfKey) continue;
        next[key] = {
          user: (typeof p.user === 'string' && p.user) || key,
          color: (typeof p.color === 'string' && p.color) || '#6366f1',
          cursor: (p.cursor as CursorState['cursor']) ?? null,
        };
      }
      s.cursors = next;
      emitCursors(s);
      emitStatus(s, 'subscribed');
      for (const h of s.handlers) h.onMessage(msg);
      return;
    }

    if (msg.type === 'cursor' || msg.type === 'join') {
      const key = typeof msg.selfKey === 'string' ? msg.selfKey : '';
      if (!key || key === s.selfKey) return;
      s.cursors = {
        ...s.cursors,
        [key]: {
          user:
            (typeof msg.user === 'string' && msg.user) ||
            s.cursors[key]?.user ||
            key,
          color:
            (typeof msg.color === 'string' && msg.color) ||
            s.cursors[key]?.color ||
            '#6366f1',
          cursor:
            msg.cursor &&
            typeof msg.cursor === 'object' &&
            msg.cursor !== null &&
            'x' in (msg.cursor as object)
              ? {
                  x: Number((msg.cursor as { x: number }).x),
                  y: Number((msg.cursor as { y: number }).y),
                }
              : msg.type === 'join'
                ? null
                : (s.cursors[key]?.cursor ?? null),
        },
      };
      emitCursors(s);
      return;
    }

    if (msg.type === 'leave') {
      const key = typeof msg.selfKey === 'string' ? msg.selfKey : '';
      if (!key) return;
      const { [key]: _, ...rest } = s.cursors;
      s.cursors = rest;
      emitCursors(s);
      return;
    }

    for (const h of s.handlers) h.onMessage(msg);
  };

  ws.onclose = () => {
    // Ignore a socket deliberately superseded by an identity refresh.
    if (s.ws !== ws) return;
    s.ready = false;
    s.ws = null;
    if (s.refs <= 0) return;

    s.attempt += 1;
    if (s.attempt > 10) {
      emitStatus(s, 'error');
      return;
    }
    emitStatus(s, 'connecting');
    s.reconnectTimer = setTimeout(() => {
      s.reconnectTimer = null;
      if (s.refs > 0) void openSocket(s);
    }, Math.min(400 * s.attempt, 3000));
  };
}

/**
 * Acquire shared room socket. release() after a short delay so React remounts
 * do not tear down the socket.
 */
export function acquireCanvasCollab(
  roomId: string,
  user: { name: string; color: string },
  handlers: Handlers
): {
  selfKey: string;
  publishCursor: (cursor: { x: number; y: number } | null) => void;
  send: (payload: Record<string, unknown>) => void;
  release: () => void;
} {
  let s = sessions.get(roomId);
  const identityChanged =
    !!s && (s.user.name !== user.name || s.user.color !== user.color);
  if (!s) {
    s = {
      roomId,
      selfKey: tabKey(),
      user,
      ws: null,
      ready: false,
      refs: 0,
      handlers: new Set(),
      status: 'idle',
      cursors: {},
      closeTimer: null,
      reconnectTimer: null,
      attempt: 0,
    };
    sessions.set(roomId, s);
  }

  clearTimers(s);
  s.user = user;
  s.refs += 1;
  s.handlers.add(handlers);
  handlers.onStatus(s.status);
  handlers.onCursors({ ...s.cursors });

  if (identityChanged && s.ws) {
    const previousSocket = s.ws;
    s.ws = null;
    s.ready = false;
    try {
      previousSocket.close(1000, 'identity-change');
    } catch {
      /* ignore */
    }
  }

  if (!s.ws || s.ws.readyState === WebSocket.CLOSED) {
    void openSocket(s);
  } else if (s.ready) {
    emitStatus(s, 'subscribed');
  }

  const publishCursor = (cursor: { x: number; y: number } | null) => {
    const sock = s!.ws;
    if (!sock || sock.readyState !== WebSocket.OPEN || !s!.ready) return;
    try {
      sock.send(JSON.stringify({ type: 'cursor', cursor }));
    } catch {
      /* ignore */
    }
  };

  const send = (payload: Record<string, unknown>) => {
    const sock = s!.ws;
    if (!sock || sock.readyState !== WebSocket.OPEN || !s!.ready) return;
    try {
      sock.send(JSON.stringify(payload));
    } catch {
      /* ignore */
    }
  };

  const release = () => {
    s!.handlers.delete(handlers);
    s!.refs = Math.max(0, s!.refs - 1);
    if (s!.refs > 0) return;

    // Debounce teardown — survives Strict Mode remount
    s!.closeTimer = setTimeout(() => {
      s!.closeTimer = null;
      if (s!.refs > 0) return;
      clearTimers(s!);
      try {
        s!.ws?.close(1000, 'release');
      } catch {
        /* ignore */
      }
      s!.ws = null;
      sessions.delete(roomId);
    }, 600);
  };

  return { selfKey: s.selfKey, publishCursor, send, release };
}
