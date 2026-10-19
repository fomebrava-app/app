import { notFound } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PedidosTable } from "@/components/admin/PedidosTable";
import { CampaignSelect } from "@/components/admin/CampaignSelect";
import { getAllOrdersAdmin, getCampaigns, getTenantBySlug, pickCampaign } from "@/lib/queries";

export default async function PedidosPage({
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
  const { orders, itemsByOrder, contactsByOrder } = selected
    ? await getAllOrdersAdmin(tenant.id, selected.id)
    : { orders: [], itemsByOrder: {}, contactsByOrder: {} };

  return (
    <AdminLayout
      title="Pedidos"
      subtitle={
        selected?.status === "encerrada"
          ? "Campanha encerrada — consulta sem alteração."
          : "Histórico completo — corrija o status manualmente se necessário."
      }
      campaignName={selected?.nome ?? "Nenhuma campanha aberta"}
      actions={
        selected ? <CampaignSelect campaigns={campaigns} selectedId={selected.id} /> : undefined
      }
    >
      <PedidosTable
        orders={orders}
        itemsByOrder={itemsByOrder}
        contactsByOrder={contactsByOrder}
        readOnly={selected?.status === "encerrada"}
        recebimento={selected?.recebimento ?? "infinitepay"}
        pixChave={selected?.pix_chave ?? null}
      />
    </AdminLayout>
  );
}
