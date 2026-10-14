import { notFound } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ItemForm } from "@/components/admin/ItemForm";
import {
  getMenuCategories,
  getMenuItemById,
  getMenuItemCustomization,
  getTenantBySlug,
} from "@/lib/queries";

export default async function EditarItemPage({
  params,
}: {
  params: Promise<{ tenant: string; id: string }>;
}) {
  const { tenant: tenantSlug, id } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) notFound();

  const [item, categories, customization] = await Promise.all([
    getMenuItemById(id, tenant.id),
    getMenuCategories(tenant.id),
    getMenuItemCustomization(id, tenant.id),
  ]);

  if (!item) notFound();

  return (
    <AdminLayout title="Editar item" subtitle={item.nome}>
      <ItemForm
        tenant={tenant}
        categories={categories}
        item={item}
        ingredients={customization.ingredients}
        complements={customization.complements}
      />
    </AdminLayout>
  );
}
