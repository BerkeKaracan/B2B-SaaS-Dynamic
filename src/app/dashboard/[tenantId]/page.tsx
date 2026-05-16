import { redirect } from "next/navigation";

export default async function TenantRootPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const resolvedParams = await params;
  redirect(`/dashboard/${resolvedParams.tenantId}/projects`);
}
