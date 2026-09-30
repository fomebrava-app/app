import { notFound } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { getEventSettings, getTenantBySlug } from "@/lib/queries";

export default async function ConfiguracoesPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) notFound();

  const settings = await getEventSettings(tenant.id);

  return (
    <AdminLayout title="Configurações" subtitle="Dados gerais do evento.">
      <SettingsForm tenant={tenant} settings={settings} />
    </AdminLayout>
  );
}
