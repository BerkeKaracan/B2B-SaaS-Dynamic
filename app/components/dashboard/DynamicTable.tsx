"use client";

import React from "react";
import { DynamicRecord } from "@/services/api";

/**
 * Generic Dynamic Table Component.
 * T represents the structure of the JSONB record_data.
 */
interface DynamicTableProps<T extends Record<string, unknown>> {
  data: DynamicRecord<T>[];
  isLoading: boolean;
}

export default function DynamicTable<T extends Record<string, unknown>>({
  data,
  isLoading,
}: DynamicTableProps<T>) {
  if (isLoading)
    return <div className="p-4 text-slate-500 italic">Loading records...</div>;
  if (!data || data.length === 0)
    return <div className="p-4 text-slate-500 italic">No records found.</div>;

  // Extract keys safely from the first record's record_data
  const columns = Object.keys(data[0].record_data) as Array<keyof T>;

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
      <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
        <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-900 dark:text-slate-300">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col)}
                className="px-6 py-3 font-bold border-b dark:border-slate-800"
              >
                {String(col).replace("_", " ")}
              </th>
            ))}
            <th className="px-6 py-3 border-b dark:border-slate-800">
              Created At
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr
              key={item.id}
              className="bg-white dark:bg-black border-b dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
            >
              {columns.map((col) => (
                <td
                  key={String(col)}
                  className="px-6 py-4 text-slate-900 dark:text-slate-100 font-medium"
                >
                  {String(item.record_data[col] ?? "")}
                </td>
              ))}
              <td className="px-6 py-4 text-xs">
                {new Date(item.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
