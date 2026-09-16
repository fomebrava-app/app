import { AdminLayout } from "./AdminLayout";
import { Button, Card, StatusBadge, SummaryCard } from "../components/ui";
import { useApp } from "../store";
import {
  products,
  financeMovements,
  inventoryMovements,
  formatBRL,
} from "../data";
import {
  IconBox,
  IconAlert,
  IconMoney,
  IconUsers,
  IconPlus,
  IconLayers,
  IconPOS,
} from "../components/icons";

export function Overview() {
  const { navigate } = useApp();

  const recentProducts = [...products]
    .sort((a, b) => b.id - a.id)
    .slice(0, 4);
  const recentInventory = inventoryMovements.slice(0, 4);
  const recentFinance = financeMovements.slice(0, 4);

  return (
    <AdminLayout
      active="overview"
      title="Visão geral"
      subtitle="Resumo geral da operação da loja."
    >
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          label="Total de produtos"
          value="48 produtos"
          hint="8 categorias ativas"
          icon={<IconBox className="h-5 w-5" />}
        />
        <SummaryCard
          label="Produtos com estoque baixo"
          value="6 produtos"
          hint="Reposição recomendada"
          icon={<IconAlert className="h-5 w-5" />}
        />
        <SummaryCard
          label="Entradas do mês"
          value={formatBRL(18450.9)}
          hint="Agosto de 2026"
          icon={<IconMoney className="h-5 w-5" />}
        />
        <SummaryCard
          label="Saídas do mês"
          value={formatBRL(7280.3)}
          hint="Agosto de 2026"
          icon={<IconMoney className="h-5 w-5" />}
        />
        <SummaryCard
          label="Saldo atual"
          value={formatBRL(11170.6)}
          hint="Entradas menos saídas"
          icon={<IconMoney className="h-5 w-5" />}
        />
        <SummaryCard
          label="Clientes cadastrados"
          value="124 clientes"
          hint="+8 neste mês"
          icon={<IconUsers className="h-5 w-5" />}
        />
      </div>

      {/* Quick actions */}
      <Card className="mt-6 p-5">
        <p className="mb-4 text-sm font-semibold text-black">Ações rápidas</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => navigate({ name: "product-form" })}>
            <IconPlus className="h-4 w-4" /> Cadastrar produto
          </Button>
          <Button onClick={() => navigate({ name: "inventory" })}>
            <IconLayers className="h-4 w-4" /> Registrar movimentação
          </Button>
          <Button onClick={() => navigate({ name: "finance" })}>
            <IconMoney className="h-4 w-4" /> Nova movimentação financeira
          </Button>
          <Button onClick={() => navigate({ name: "customers" })}>
            <IconUsers className="h-4 w-4" /> Cadastrar cliente
          </Button>
          <Button onClick={() => navigate({ name: "pdv" })}>
            <IconPOS className="h-4 w-4" /> Registrar venda no PDV
          </Button>
        </div>
      </Card>

      {/* Recent lists */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Recent products */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-black">Produtos recentes</p>
            <button
              onClick={() => navigate({ name: "products" })}
              className="text-xs text-neutral-500 underline underline-offset-2 hover:text-black"
            >
              Ver todos
            </button>
          </div>
          <ul className="space-y-3">
            {recentProducts.map((p) => (
              <li key={p.id} className="flex items-center gap-3">
                <img
                  src={p.imagem}
                  alt={p.nome}
                  className="h-10 w-10 flex-shrink-0 rounded border border-neutral-200 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-black">{p.nome}</p>
                  <p className="text-xs text-neutral-500">{p.sku}</p>
                </div>
                <span className="text-sm font-semibold text-black">
                  {formatBRL(p.precoVenda)}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Recent inventory */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-black">
              Movimentações de estoque
            </p>
            <button
              onClick={() => navigate({ name: "inventory" })}
              className="text-xs text-neutral-500 underline underline-offset-2 hover:text-black"
            >
              Ver todas
            </button>
          </div>
          <ul className="space-y-3">
            {recentInventory.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-black">
                    {m.produto}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {m.data} · {m.motivo}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge tone={m.tipo === "Entrada" ? "medium" : "soft"}>
                    {m.tipo}
                  </StatusBadge>
                  <span className="text-xs text-neutral-600">
                    {m.quantidade > 0 ? "+" : ""}
                    {m.quantidade} un.
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        {/* Recent finance */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-black">
              Movimentações financeiras
            </p>
            <button
              onClick={() => navigate({ name: "finance" })}
              className="text-xs text-neutral-500 underline underline-offset-2 hover:text-black"
            >
              Ver todas
            </button>
          </div>
          <ul className="space-y-3">
            {recentFinance.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-black">
                    {m.descricao}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {m.data} · {m.categoria}
                  </p>
                </div>
                <span className="text-sm font-semibold text-black">
                  {m.tipo === "Saída" ? "− " : "+ "}
                  {formatBRL(m.valor)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </AdminLayout>
  );
}
