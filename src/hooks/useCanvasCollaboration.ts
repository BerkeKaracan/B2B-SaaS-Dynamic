import { useEffect, useState } from 'react';
import * as Y from 'yjs';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

export type CursorState = {
  user: string;
  color: string;
  cursor: { x: number; y: number } | null;
};

export function useCanvasCollaboration(
  roomId: string,
  user: { name: string; color: string }
) {
  const [doc, setDoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<RealtimeChannel | null>(null);
  const [isSynced, setIsSynced] = useState<boolean>(false);
  const [cursors, setCursors] = useState<Record<string, CursorState>>({});

  useEffect(() => {
    const ydoc = new Y.Doc();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDoc(ydoc);

    const channel = supabase.channel(`canvas-${roomId}`, {
      config: {
        broadcast: { ack: false },
        presence: { key: user.name },
      },
    });

    ydoc.on('update', (update: Uint8Array) => {
      channel.send({
        type: 'broadcast',
        event: 'update',
        payload: { update: Array.from(update) },
      });
    });

    channel.on('broadcast', { event: 'cursor-move' }, ({ payload }) => {
      setCursors((prev) => {
        if (!prev[payload.userKey]) return prev;

        return {
          ...prev,
          [payload.userKey]: {
            ...prev[payload.userKey],
            cursor: payload.cursor, 
          },
        };
      });
    });

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const activeCursors: Record<string, CursorState> = {};

      Object.keys(state).forEach((key) => {
        const presenceData = state[key][0] as unknown as CursorState;
        if (presenceData && presenceData.cursor) {
          activeCursors[key] = presenceData;
        }
      });

      setCursors(activeCursors);
    });

    channel.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        setIsSynced(true);
        channel.track({
          user: user.name,
          color: user.color,
          cursor: { x: 0, y: 0 },
        });
      }
    });

    setProvider(channel);

    return () => {
      channel.unsubscribe();
      ydoc.destroy();
    };
  }, [roomId, user.name, user.color]);

  return { doc, provider, isSynced, cursors };
}
