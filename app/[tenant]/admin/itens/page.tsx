import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui";
import { IconPlus } from "@/components/icons";
import { ItensTable } from "@/components/admin/ItensTable";
import { getAllMenuItemsAdmin, getMenuCategories, getTenantBySlug } from "@/lib/queries";

export default async function ItensPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) notFound();

  const [items, categories] = await Promise.all([
    getAllMenuItemsAdmin(tenant.id),
    getMenuCategories(tenant.id),
  ]);

  return (
    <AdminLayout
      title="Itens do cardápio"
      subtitle="Cadastre e gerencie os itens vendidos no evento."
      actions={
        <Link href={`/${tenantSlug}/admin/itens/novo`}>
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
