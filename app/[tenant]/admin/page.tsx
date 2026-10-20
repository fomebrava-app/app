import { notFound } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button, Card, SummaryCard } from "@/components/ui";
import { IconBox, IconMoney, IconLayers, IconChefHat, IconPlus, IconPOS, IconCalculator } from "@/components/icons";
import { formatBRL } from "@/lib/format";
import { CampaignSelect } from "@/components/admin/CampaignSelect";
import { CampaignMovement } from "@/components/admin/CampaignMovement";
import { parseMovementFilters, summarizeCampaignMovement } from "@/lib/campaign-movement";
import {
  getCampaignMovementSource,
  getCampaigns,
  getDashboardStats,
  getTenantBySlug,
  pickCampaign,
} from "@/lib/queries";
import Link from "next/link";

export default async function AdminOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ campanha?: string; canal?: string; pdv?: string; situacao?: string }>;
}) {
  const { tenant: tenantSlug } = await params;
  const { campanha, canal, pdv, situacao } = await searchParams;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) notFound();

  const campaigns = await getCampaigns(tenant.id);
  const selected = pickCampaign(campaigns, campanha);
  const stats = await getDashboardStats(
    tenant.id,
    selected?.id ?? null,
    selected?.status === "aberta"
  );
  const periodoHoje = selected?.status !== "encerrada";
  const temCampanhaAberta = campaigns.some((campaign) => campaign.status === "aberta");
  const filters = parseMovementFilters({ canal, pdv, situacao });
  const source = selected ? await getCampaignMovementSource(tenant.id, selected.id) : null;
  const movement = source
    ? summarizeCampaignMovement(source.orders, source.items, filters)
    : null;

  return (
    <AdminLayout
      title="Visão geral"
      subtitle="Resumo da operação do evento."
      campaignName={selected?.nome ?? "Nenhuma campanha aberta"}
      actions={
        selected ? <CampaignSelect campaigns={campaigns} selectedId={selected.id} /> : undefined
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Itens no cardápio"
          value={`${stats.totalItens}`}
          icon={<IconBox className="h-5 w-5" />}
        />
        <SummaryCard
          label={periodoHoje ? "Pedidos hoje" : "Pedidos pagos"}
          value={`${stats.pedidosHoje}`}
          icon={<IconLayers className="h-5 w-5" />}
        />
        <SummaryCard
          label={periodoHoje ? "Faturamento hoje" : "Faturamento da campanha"}
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
          {!temCampanhaAberta && (
            <Link href={`/${tenantSlug}/admin/configuracoes`}>
              <Button variant="primary">
                <IconPlus className="h-4 w-4" /> Criar campanha
              </Button>
            </Link>
          )}
          <Link href={`/${tenantSlug}/admin/itens/novo`}>
            <Button variant="primary">
              <IconPlus className="h-4 w-4" /> Cadastrar item
            </Button>
          </Link>
          <Link href={`/${tenantSlug}/admin/pdv`}>
            <Button>
              <IconPOS className="h-4 w-4" /> Registrar venda no PDV
            </Button>
          </Link>
          <Link href={`/${tenantSlug}/admin/precificacao`}>
            <Button>
              <IconCalculator className="h-4 w-4" /> Planejar preços
            </Button>
          </Link>
          <Link href={`/${tenantSlug}/cozinha`}>
            <Button>
              <IconChefHat className="h-4 w-4" /> Abrir tela da cozinha
            </Button>
          </Link>
        </div>
      </Card>

      {movement ? (
        <CampaignMovement view={movement} filters={filters} />
      ) : (
        <Card className="mt-6 p-5">
          <h2 className="text-lg font-semibold text-black">Movimento da campanha</h2>
          <p className="mt-2 text-sm text-neutral-500">
            Ainda não há campanha para ler o movimento. Crie uma campanha para começar.
          </p>
        </Card>
      )}
    </AdminLayout>
  );
}
