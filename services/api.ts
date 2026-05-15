/**
 * Generic interface for the dynamic record structure.
 * T represents the flexible JSON payload stored in record_data.
 * Defaults to a standard key-value object if no specific type is provided.
 */
export interface DynamicRecord<T = Record<string, unknown>> {
  id: string;
  tenant_id: string;
  module_name: string;
  record_data: T;
  created_at: string;
}

/**
 * Payload for creating a new record.
 */
export interface CreateRecordPayload<T = Record<string, unknown>> {
  tenant_id: string;
  module_name: string;
  record_data: T;
}

const BASE_URL = "http://127.0.0.1:8000";

/**
 * Global API service with strict type definitions.
 * Using Generics <T> allows us to pass specific interfaces for different modules
 * (e.g., FleetVehicle, Employee) while maintaining a reusable base.
 */
export const apiService = {
  /**
   * Fetches dynamic records. Returns an array of DynamicRecord with type T.
   */
  getRecords: async <T = Record<string, unknown>>(
    tenantId: string,
    moduleName?: string,
  ): Promise<DynamicRecord<T>[]> => {
    const url = new URL(`${BASE_URL}/api/records/`);
    url.searchParams.append("tenant_id", tenantId);
    if (moduleName) url.searchParams.append("module_name", moduleName);

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  },

  /**
   * Creates a new record with type-safe payload.
   */
  createRecord: async <T = Record<string, unknown>>(
    payload: CreateRecordPayload<T>,
  ): Promise<DynamicRecord<T>> => {
    const response = await fetch(`${BASE_URL}/api/records/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  },
};
