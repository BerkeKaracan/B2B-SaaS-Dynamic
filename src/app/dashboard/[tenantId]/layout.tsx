import React from "react";
import DashboardClientWrapper from "@/components/layout/DashboardClientWrapper";

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;

  return (
    <DashboardClientWrapper tenantId={tenantId}>
      {children}
    </DashboardClientWrapper>
  );
}
