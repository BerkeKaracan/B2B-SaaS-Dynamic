'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { getSharedRealtimeClient, peekSharedRealtimeClient } from '@/lib/realtimeClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface NotificationPayload {
  new: {
    id: string;
    title: string;
    message: string;
    target_email: string;
    type?: string;
  };
}

export default function RealtimeNotifier({ userEmail }: { userEmail: string }) {
  useEffect(() => {
    if (!userEmail) return;

    let cancelled = false;
    let channel: RealtimeChannel | null = null;

    const subscribe = async () => {
      const client = await getSharedRealtimeClient();
      if (cancelled || !client) return;

      channel = client
        .channel('realtime-in-app-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `target_email=eq.${userEmail}`,
          },
          (payload: NotificationPayload) => {
            toast(payload.new.title, {
              description: payload.new.message,
              duration: 6000,
              position: 'bottom-right',
              icon: '🔔',
              action: {
                label: 'Close',
                onClick: () => undefined,
              },
              style: {
                background: '#18181b',
                color: '#fafafa',
                border: '1px solid #3f3f46',
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
              },
            });
          }
        )
        .subscribe();
    };

    void subscribe();

    return () => {
      cancelled = true;
      const client = peekSharedRealtimeClient();
      if (client && channel) {
        void client.removeChannel(channel).catch(() => undefined);
      }
    };
  }, [userEmail]);

  return null;
}
