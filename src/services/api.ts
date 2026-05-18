import { RecordResponse, RecordBase } from "@/types/record";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    console.warn("Token expired or unauthorized request!");
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
    const response = await fetchAPI(`/api/records/`, {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create record: ${response.statusText}`);
    }

    return response.json();
  },
};
