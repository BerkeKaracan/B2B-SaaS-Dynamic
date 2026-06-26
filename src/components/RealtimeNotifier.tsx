'use client';

import { useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'sonner';

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

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const channel = supabase
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
            duration: 5000,
            position: 'bottom-right',
            icon: '🔔',
            action: {
              label: 'Kapat',
              onClick: () => console.log('Notification Closed.'),
            },
            style: {
              background: 'var(--background)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            },
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userEmail]);

  return null;
}
