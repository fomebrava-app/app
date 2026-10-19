import { notFound } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { CampaignPanel } from "@/components/admin/CampaignPanel";
import { getCampaigns, getEventSettings, getTenantBySlug } from "@/lib/queries";

export default async function ConfiguracoesPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) notFound();

  const [settings, campaigns] = await Promise.all([
    getEventSettings(tenant.id),
    getCampaigns(tenant.id),
  ]);
  const openCampaign = campaigns.find((campaign) => campaign.status === "aberta") ?? null;

  return (
    <AdminLayout
      title="Configurações"
      subtitle="Dados gerais do evento."
      campaignName={openCampaign?.nome ?? "Nenhuma campanha aberta"}
    >
      <div className="max-w-2xl space-y-5">
        <CampaignPanel tenantSlug={tenant.slug} openCampaign={openCampaign} />
        <SettingsForm tenant={tenant} settings={settings} />
      </div>
    </AdminLayout>
  );
}
