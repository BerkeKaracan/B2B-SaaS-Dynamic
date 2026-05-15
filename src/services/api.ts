import { RecordResponse, RecordBase } from "@/types/record";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export const recordService = {
  async getRecords(
    tenantId: string,
    moduleName?: string,
  ): Promise<RecordResponse[]> {
    const url = new URL(`${API_BASE_URL}/records/`);
    url.searchParams.append("tenant_id", tenantId);
    if (moduleName) {
      url.searchParams.append("module_name", moduleName);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch records: ${response.statusText}`);
    }

    return response.json();
  },
  async createRecord(data: RecordBase): Promise<RecordResponse> {
    const response = await fetch(`${API_BASE_URL}/records/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create record: ${response.statusText}`);
    }

    return response.json();
  },
};
