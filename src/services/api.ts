import { RecordResponse, RecordBase } from "@/types/record";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const response = await fetch(`${API_BASE_URL}${cleanEndpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    console.warn("Token expired or unauthorized request!");
  }

  if (response.status === 429) {
    console.error(
      "Too many requests were sent. System crashing was prevented.",
    );
    if (typeof window !== "undefined") {
      alert("You've tried too many times. Please wait a minute and try again.");
    }
    throw new Error("Rate limit exceeded");
  }

  return response;
}

export const recordService = {
  async getRecords(
    tenantId: string,
    moduleName?: string,
  ): Promise<RecordResponse[]> {
    const params = new URLSearchParams({ tenant_id: tenantId });
    if (moduleName) {
      params.append("module_name", moduleName);
    }

    const response = await fetchAPI(`/api/records/?${params.toString()}`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch records: ${response.statusText}`);
    }

    return response.json();
  },

  async createRecord(data: RecordBase): Promise<RecordResponse> {
    const response = await fetchAPI("/api/records/", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create record: ${response.statusText}`);
    }

    return response.json();
  },

  async updateRecord(
    id: string,
    data: Partial<RecordBase>,
  ): Promise<RecordResponse> {
    const response = await fetchAPI(`/api/records/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update record: ${response.statusText}`);
    }

    return response.json();
  },

  async deleteRecord(id: string): Promise<void> {
    const response = await fetchAPI(`/api/records/${id}`, {
      method: "DELETE",
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
  }) {
    const response = await fetchAPI("/api/auth/onboarding", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(
        errData.detail || `Onboarding failed: ${response.statusText}`,
      );
    }

    return response.json();
  },
};
