import { RecordResponse, RecordBase } from '@/types/record';
import { getApiBaseUrl } from '@/lib/apiBase';

/** @deprecated Prefer getApiBaseUrl() — kept for existing imports. */
export const API_BASE_URL = getApiBaseUrl();

/**
 * Browser → same-origin BFF (`/api/backend/...`) which attaches HttpOnly JWT.
 * Server → direct FastAPI with cookie token as Authorization.
 */
function toBrowserProxyUrl(endpoint: string): string {
  const clean = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (clean.startsWith('/api/')) {
    return `/api/backend/${clean.slice('/api/'.length)}`;
  }
  return `/api/backend${clean}`;
}

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Browser never attaches Authorization — HttpOnly cookie is read by BFF.
  if (typeof window !== 'undefined') {
    delete headers['Authorization'];
    delete headers['authorization'];

    const url = toBrowserProxyUrl(endpoint);
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'same-origin',
    });

    if (response.status === 401) {
      console.warn('Token expired or unauthorized request!');
    }

    if (response.status === 429) {
      console.error(
        'Too many requests were sent. System crashing was prevented.'
      );
      alert("You've tried too many times. Please wait a minute and try again.");
      throw new Error('Rate limit exceeded');
    }

    return response;
  }

  // Server-side: attach token from HttpOnly cookie when present
  let token: string | undefined;
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    token = cookieStore.get('token')?.value;
  } catch {
    console.warn('fetchAPI: Could not read cookies in this server context.');
  }

  if (token && !headers['Authorization'] && !headers['authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const base = getApiBaseUrl();
  const response = await fetch(`${base}${cleanEndpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    console.warn('Token expired or unauthorized request!');
  }

  if (response.status === 429) {
    console.error(
      'Too many requests were sent. System crashing was prevented.'
    );
    throw new Error('Rate limit exceeded');
  }

  return response;
}

export const recordService = {
  async getRecords(
    tenantId: string,
    moduleName?: string
  ): Promise<RecordResponse[]> {
    const url = moduleName
      ? `/api/records?tenant_id=${tenantId}&module_name=${moduleName}`
      : `/api/records?tenant_id=${tenantId}`;
    const response = await fetchAPI(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch records: ${response.statusText}`);
    }

    return response.json();
  },

  async createRecord(data: RecordBase): Promise<RecordResponse> {
    const response = await fetchAPI('/api/records/', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create record: ${response.statusText}`);
    }

    return response.json();
  },

  async updateRecord(
    id: string,
    data: Partial<RecordBase>
  ): Promise<RecordResponse> {
    const response = await fetchAPI(`/api/records/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update record: ${response.statusText}`);
    }

    return response.json();
  },

  async deleteRecord(id: string): Promise<void> {
    const response = await fetchAPI(`/api/records/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete record: ${response.statusText}`);
    }
  },
};

export const authService = {
  async completeOnboarding(data: {
    usage_type: string;
    workspace_name?: string;
  }): Promise<Response> {
    return await fetchAPI('/api/auth/onboarding', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
