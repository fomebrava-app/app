import { notFound } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { FinanceClient } from "@/components/admin/FinanceClient";
import { CampaignSelect } from "@/components/admin/CampaignSelect";
import { getCampaigns, getFinanceLedger, getTenantBySlug, pickCampaign } from "@/lib/queries";

export default async function FinanceiroPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ campanha?: string }>;
}) {
  const { tenant: tenantSlug } = await params;
  const { campanha } = await searchParams;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) notFound();

  const campaigns = await getCampaigns(tenant.id);
  const selected = pickCampaign(campaigns, campanha);
  const ledger = selected ? await getFinanceLedger(tenant.id, selected.id) : [];

  return (
    <AdminLayout
      title="Financeiro"
      subtitle="Entradas geradas automaticamente pelos pedidos pagos + despesas manuais."
      campaignName={selected?.nome ?? "Nenhuma campanha aberta"}
      actions={
        selected ? <CampaignSelect campaigns={campaigns} selectedId={selected.id} /> : undefined
      }
    >
      <FinanceClient
        tenantId={tenant.id}
        ledger={ledger}
        readOnly={selected?.status !== "aberta"}
      />
    </AdminLayout>
  );
}
