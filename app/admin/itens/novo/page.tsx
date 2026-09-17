import { AdminLayout } from "@/components/admin/AdminLayout";
import { ItemForm } from "@/components/admin/ItemForm";
import { getMenuCategories } from "@/lib/queries";

export default async function NovoItemPage() {
  const categories = await getMenuCategories();

  return (
    <AdminLayout title="Novo item" subtitle="Cadastre um item no cardápio.">
      <ItemForm categories={categories} />
    </AdminLayout>
  );
}
