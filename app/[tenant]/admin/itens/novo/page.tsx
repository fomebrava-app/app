import { notFound } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ItemForm } from "@/components/admin/ItemForm";
import { getMenuCategories, getTenantBySlug } from "@/lib/queries";

export default async function NovoItemPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) notFound();

  const categories = await getMenuCategories(tenant.id);

  return (
    <AdminLayout title="Novo item" subtitle="Cadastre um item no cardápio.">
      <ItemForm tenant={tenant} categories={categories} />
    </AdminLayout>
  );
}
