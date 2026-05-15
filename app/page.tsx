"use client";

import { useEffect, useState } from "react";
import { apiService, DynamicRecord } from "@/services/api";
import DynamicTable from "@/app/components/dashboard/DynamicTable";
/**
 * Interface representing our specific test module data structure.
 * Adding [key: string]: unknown satisfies the 'Record<string, unknown>' constraint
 * required by the Generic DynamicTable, as JSONB data is inherently dynamic.
 */
interface FleetVehicle {
  license_plate: string;
  vehicle_brand: string;
  driver_name: string;
  insurance_expiry: string;
  status: string;
  // Index signature: Allows string indexing while keeping type safety for known fields.
  [key: string]: unknown; 
}

export default function DashboardPage() {
  const [records, setRecords] = useState<DynamicRecord<FleetVehicle>[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const TEST_TENANT_ID = "550e8400-e29b-41d4-a716-446655440000";

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await apiService.getRecords<FleetVehicle>(
          TEST_TENANT_ID,
          "fleet_vehicles",
        );
        setRecords(data);
      } catch (error) {
        console.error("Dashboard Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          Fleet Inventory Data
        </h2>
      </div>
      <DynamicTable<FleetVehicle> data={records} isLoading={loading} />
    </div>
  );
}
