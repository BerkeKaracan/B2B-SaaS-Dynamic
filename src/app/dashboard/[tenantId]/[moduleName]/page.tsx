import { redirect } from "next/navigation";

export default async function LegacyModulePage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  redirect(`/dashboard/${tenantId}/projects`);
}
