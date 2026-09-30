import { notFound } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PricingAssistant } from "@/components/admin/PricingAssistant";
import { getPricingCatalog, getRecentPricingScenarios, getTenantBySlug } from "@/lib/queries";

export default async function PrecificacaoPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) notFound();

  const [catalog, recentScenarios] = await Promise.all([
    getPricingCatalog(),
    getRecentPricingScenarios(tenant.id),
  ]);

  return (
    <AdminLayout
      title="Precificação solidária"
      subtitle="Planeje custos e defina preços sustentáveis sem perder de vista a missão da organização."
    >
      <PricingAssistant
        regions={catalog.regions}
        templates={catalog.products}
        recentScenarios={recentScenarios}
      />
    </AdminLayout>
  );
}

