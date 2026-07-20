'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { createAuthedSupabaseClient } from '@/lib/supabaseAuthedClient';
import { fetchRealtimeAccessToken } from '@/lib/authCookies';

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
    let client: ReturnType<typeof createAuthedSupabaseClient> = null;
    let channel: ReturnType<
      NonNullable<ReturnType<typeof createAuthedSupabaseClient>>['channel']
    > | null = null;

    const subscribe = async () => {
      const token = await fetchRealtimeAccessToken();
      if (cancelled || !token) return;

      client = createAuthedSupabaseClient(token);
      if (!client) return;

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
              // Explicit colors — var(--background)/--foreground are not defined
              // in globals.css, which rendered text invisible on the toast.
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
      if (client && channel) {
        client.removeChannel(channel);
      }
    };
  }, [userEmail]);

  return null;
}
