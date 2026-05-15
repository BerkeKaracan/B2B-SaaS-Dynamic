import React from "react";
import DashboardClientWrapper from "@/components/layout/DashboardClientWrapper";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ tenantId: string }>;
}

export default async function DashboardLayout({
  children,
  params,
}: LayoutProps) {
  const resolvedParams = await params;

  return (
    <DashboardClientWrapper tenantId={resolvedParams.tenantId}>
      {children}
    </DashboardClientWrapper>
  );
}
