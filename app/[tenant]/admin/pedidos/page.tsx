import { notFound } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PedidosTable } from "@/components/admin/PedidosTable";
import { getAllOrdersAdmin, getTenantBySlug } from "@/lib/queries";

export default async function PedidosPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) notFound();

  const { orders, itemsByOrder } = await getAllOrdersAdmin(tenant.id);

  return (
    <AdminLayout
      title="Pedidos"
      subtitle="Histórico completo — corrija o status manualmente se necessário."
    >
      <PedidosTable orders={orders} itemsByOrder={itemsByOrder} />
    </AdminLayout>
  );
}
