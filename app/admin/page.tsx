import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button, Card, SummaryCard } from "@/components/ui";
import { IconBox, IconMoney, IconLayers, IconChefHat, IconPlus, IconPOS } from "@/components/icons";
import { formatBRL } from "@/lib/format";
import { getDashboardStats } from "@/lib/queries";
import Link from "next/link";

export default async function AdminOverviewPage() {
  const stats = await getDashboardStats();

  return (
    <AdminLayout title="Visão geral" subtitle="Resumo da operação do evento.">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Itens no cardápio"
          value={`${stats.totalItens}`}
          icon={<IconBox className="h-5 w-5" />}
        />
        <SummaryCard
          label="Pedidos hoje"
          value={`${stats.pedidosHoje}`}
          icon={<IconLayers className="h-5 w-5" />}
        />
        <SummaryCard
          label="Faturamento hoje"
          value={formatBRL(stats.faturamentoHoje)}
          icon={<IconMoney className="h-5 w-5" />}
        />
        <SummaryCard
          label="Pedidos ativos na cozinha"
          value={`${stats.pedidosAtivos}`}
          icon={<IconChefHat className="h-5 w-5" />}
        />
      </div>

      <Card className="mt-6 p-5">
        <p className="mb-4 text-sm font-semibold text-black">Ações rápidas</p>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/itens/novo">
            <Button variant="primary">
              <IconPlus className="h-4 w-4" /> Cadastrar item
            </Button>
          </Link>
          <Link href="/admin/pdv">
            <Button>
              <IconPOS className="h-4 w-4" /> Registrar venda no PDV
            </Button>
          </Link>
          <Link href="/cozinha">
            <Button>
              <IconChefHat className="h-4 w-4" /> Abrir tela da cozinha
            </Button>
          </Link>
        </div>
      </Card>
    </AdminLayout>
  );
}
