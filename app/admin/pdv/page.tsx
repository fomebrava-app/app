import { AdminLayout } from "@/components/admin/AdminLayout";
import { PdvLinksManager } from "@/components/admin/PdvLinksManager";
import { getPdvLinks } from "@/lib/queries";

export default async function PdvPage() {
  const pdvLinks = await getPdvLinks();

  return (
    <AdminLayout
      title="PDVs"
      subtitle="Gere links de acesso ao ponto de venda — sem precisar criar login para quem vai operar."
    >
      <PdvLinksManager pdvLinks={pdvLinks} />
    </AdminLayout>
  );
}
