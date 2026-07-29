/**
 * Browser WebSocket origin for live canvas cursors (our FastAPI backend).
 * Local Docker: ws://localhost:8000 (backend port publish).
 * Prod: NEXT_PUBLIC_WS_URL=wss://api.example.com when set.
 */
export function getCanvasCollabWsBase(): string | null {
  if (typeof window === 'undefined') return null;

  const explicit = (process.env.NEXT_PUBLIC_WS_URL || '').trim().replace(/\/$/, '');
  if (explicit) return explicit;

  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.hostname || 'localhost';
  // Backend is published on 8000 in docker-compose / local uvicorn
  return `${proto}//${host}:8000`;
}

export function getCanvasCollabWsUrl(roomId: string): string | null {
  const base = getCanvasCollabWsBase();
  if (!base || !roomId) return null;
  return `${base}/ws/canvas/${encodeURIComponent(roomId)}`;
}
