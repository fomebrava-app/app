import { notFound } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { FinanceClient } from "@/components/admin/FinanceClient";
import { getFinanceLedger, getTenantBySlug } from "@/lib/queries";

export default async function FinanceiroPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) notFound();

  const ledger = await getFinanceLedger(tenant.id);

  return (
    <AdminLayout
      title="Financeiro"
      subtitle="Entradas geradas automaticamente pelos pedidos pagos + despesas manuais."
    >
      <FinanceClient tenantId={tenant.id} ledger={ledger} />
    </AdminLayout>
  );
}
