import { AdminLayout } from "@/components/admin/AdminLayout";
import { FinanceClient } from "@/components/admin/FinanceClient";
import { getFinanceLedger } from "@/lib/queries";

export default async function FinanceiroPage() {
  const ledger = await getFinanceLedger();

  return (
    <AdminLayout
      title="Financeiro"
      subtitle="Entradas geradas automaticamente pelos pedidos pagos + despesas manuais."
    >
      <FinanceClient ledger={ledger} />
    </AdminLayout>
  );
}
