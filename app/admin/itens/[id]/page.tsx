import { notFound } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ItemForm } from "@/components/admin/ItemForm";
import { getMenuCategories, getMenuItemById } from "@/lib/queries";

export default async function EditarItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [item, categories] = await Promise.all([getMenuItemById(id), getMenuCategories()]);

  if (!item) notFound();

  return (
    <AdminLayout title="Editar item" subtitle={item.nome}>
      <ItemForm categories={categories} item={item} />
    </AdminLayout>
  );
}
