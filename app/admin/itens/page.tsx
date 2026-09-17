import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui";
import { IconPlus } from "@/components/icons";
import { ItensTable } from "@/components/admin/ItensTable";
import { getAllMenuItemsAdmin, getMenuCategories } from "@/lib/queries";

export default async function ItensPage() {
  const [items, categories] = await Promise.all([
    getAllMenuItemsAdmin(),
    getMenuCategories(),
  ]);

  return (
    <AdminLayout
      title="Itens do cardápio"
      subtitle="Cadastre e gerencie os itens vendidos no evento."
      actions={
        <Link href="/admin/itens/novo">
          <Button variant="primary">
            <IconPlus className="h-4 w-4" /> Novo item
          </Button>
        </Link>
      }
    >
      <ItensTable items={items} categories={categories} />
    </AdminLayout>
  );
}
