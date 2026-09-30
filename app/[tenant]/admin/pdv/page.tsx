import { notFound } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PdvLinksManager } from "@/components/admin/PdvLinksManager";
import { getPdvLinks, getTenantBySlug } from "@/lib/queries";

export default async function PdvPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) notFound();

  const pdvLinks = await getPdvLinks(tenant.id);

  return (
    <AdminLayout
      title="PDVs"
      subtitle="Gere links de acesso ao ponto de venda — sem precisar criar login para quem vai operar."
    >
      <PdvLinksManager tenant={tenantSlug} pdvLinks={pdvLinks} />
    </AdminLayout>
  );
}
