import { create } from "zustand";
import { persist } from "zustand/middleware";
import { fetchAPI } from "@/services/api";

export interface Tenant {
  id: string;
  name: string;
  tier?: string;
  logo_url?: string;
  usage_type?: string;
  timezone?: string;
  date_format?: string;
  currency?: string;
}

interface TenantState {
  tenant: Tenant | null;
  fetchTenant: (tenantId: string) => Promise<void>;
  updateTenantState: (updates: Partial<Tenant>) => void;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      tenant: null,

      fetchTenant: async (tenantId: string) => {
        try {
          const res = await fetchAPI(`/api/tenants/${tenantId}`);
          if (res.ok) {
            const data = await res.json();
            set({ tenant: data });
          }
        } catch (error) {
          console.error("Failed to fetch tenant data:", error);
        }
      },

      updateTenantState: (updates: Partial<Tenant>) => {
        set((state) => ({
          tenant: state.tenant ? { ...state.tenant, ...updates } : null,
        }));
      },
    }),
    {
      name: "tenant-storage",
    },
  ),
);
