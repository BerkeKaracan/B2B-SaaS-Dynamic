'use client';

import { useEffect } from 'react';
import { getApiBaseUrl } from '@/lib/apiBase';

export default function WakeUpBackend() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    fetch(`${getApiBaseUrl()}/api/public/ping`, {
      method: 'GET',
      cache: 'no-store',
    })
      .then(() => console.log('Wake up backend signal is sent'))
      .catch(() => {});
  }, []);

  return null;
}
