import { AdminLayout } from "@/components/admin/AdminLayout";
import { PedidosTable } from "@/components/admin/PedidosTable";
import { getAllOrdersAdmin } from "@/lib/queries";

export default async function PedidosPage() {
  const { orders, itemsByOrder } = await getAllOrdersAdmin();

  return (
    <AdminLayout
      title="Pedidos"
      subtitle="Histórico completo — corrija o status manualmente se necessário."
    >
      <PedidosTable orders={orders} itemsByOrder={itemsByOrder} />
    </AdminLayout>
  );
}
