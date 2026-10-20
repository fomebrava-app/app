"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Card, Field, Select, SummaryCard } from "@/components/ui";
import { IconLayers, IconMoney, IconPOS } from "@/components/icons";
import { formatBRL } from "@/lib/format";
import type {
  CampaignMovementView,
  MovementChannel,
  MovementFilters,
  MovementSituation,
} from "@/lib/campaign-movement";

function setFilter(
  current: URLSearchParams,
  key: string,
  value: string
): URLSearchParams {
  const next = new URLSearchParams(current.toString());
  if (value === "todos") next.delete(key);
  else next.set(key, value);
  return next;
}

export function CampaignMovement({
  view,
  filters,
}: {
  view: CampaignMovementView;
  filters: MovementFilters;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function push(next: URLSearchParams) {
    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function changeCanal(canal: MovementChannel) {
    const next = setFilter(searchParams, "canal", canal);
    if (canal === "online") next.delete("pdv");
    push(next);
  }

  function changePdv(pdv: string) {
    push(setFilter(searchParams, "pdv", pdv));
  }

  function changeSituacao(situacao: MovementSituation) {
    push(setFilter(searchParams, "situacao", situacao));
  }

  const semVenda = view.cards.pedidos === 0;

  return (
    <section className="mt-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-black">Movimento da campanha</h2>
        <p className="text-sm text-neutral-500">
          Quantidade segue o filtro. Faturamento soma só pedido pago.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Canal">
          <Select
            aria-label="Canal"
            value={filters.canal}
            onChange={(event) => changeCanal(event.target.value as MovementChannel)}
          >
            <option value="todos">Todos</option>
            <option value="online">Cardápio online</option>
            <option value="pdv">PDV</option>
          </Select>
        </Field>
        {filters.canal !== "online" && (
          <Field label="PDV">
            <Select
              aria-label="PDV"
              value={filters.pdv}
              onChange={(event) => changePdv(event.target.value)}
            >
              <option value="todos">Todos</option>
              {view.pdvOptions.map((nome) => (
                <option key={nome} value={nome}>
                  {nome}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="Situação">
          <Select
            aria-label="Situação do pagamento"
            value={filters.situacao}
            onChange={(event) => changeSituacao(event.target.value as MovementSituation)}
          >
            <option value="todos">Todos</option>
            <option value="pagos">Pagos</option>
            <option value="pendentes">Pendentes</option>
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Pedidos" value={`${view.cards.pedidos}`} icon={<IconLayers className="h-5 w-5" />} />
        <SummaryCard label="Itens" value={`${view.cards.itens}`} icon={<IconLayers className="h-5 w-5" />} />
        <SummaryCard label="Faturamento" value={formatBRL(view.cards.faturamento)} icon={<IconMoney className="h-5 w-5" />} />
        <SummaryCard label="Ticket médio" value={formatBRL(view.cards.ticketMedio)} icon={<IconMoney className="h-5 w-5" />} />
        <SummaryCard label="Reservas pendentes" value={`${view.cards.reservasPendentes}`} icon={<IconPOS className="h-5 w-5" />} />
        <SummaryCard label="Retirada" value={`${view.cards.retirada}`} icon={<IconLayers className="h-5 w-5" />} />
        <SummaryCard label="Entrega" value={`${view.cards.entrega}`} icon={<IconLayers className="h-5 w-5" />} />
      </div>

      {semVenda ? (
        <Card className="p-5">
          <p className="text-sm text-neutral-500">Nenhuma venda nesse recorte.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <CountTable title="Por ponto de venda" rows={view.pontos} quantityLabel="Itens" />
          <CountTable
            title="Por produto"
            rows={view.produtos}
            quantityLabel="Quantidade"
            showOrders={false}
          />
          <div className="xl:col-span-2">
            <PaymentTable rows={view.pagamentos} />
          </div>
        </div>
      )}
    </section>
  );
}

function CountTable({
  title,
  rows,
  quantityLabel,
  showOrders = true,
}: {
  title: string;
  rows: CampaignMovementView["pontos"];
  quantityLabel: string;
  showOrders?: boolean;
}) {
  return (
    <Card className="overflow-hidden">
      <h3 className="border-b border-neutral-200 px-4 py-3 text-sm font-semibold text-black">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              {showOrders && <th className="px-4 py-3 font-medium">Pedidos</th>}
              <th className="px-4 py-3 font-medium">{quantityLabel}</th>
              <th className="px-4 py-3 font-medium">Faturamento</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.nome} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-3 font-medium text-black">{row.nome}</td>
                {showOrders && <td className="px-4 py-3">{row.pedidos}</td>}
                <td className="px-4 py-3">{row.itens}</td>
                <td className="px-4 py-3">{formatBRL(row.faturamento)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function PaymentTable({ rows }: { rows: CampaignMovementView["pagamentos"] }) {
  return (
    <Card className="overflow-hidden">
      <h3 className="border-b border-neutral-200 px-4 py-3 text-sm font-semibold text-black">
        Por forma de pagamento
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Forma</th>
              <th className="px-4 py-3 font-medium">Pedidos</th>
              <th className="px-4 py-3 font-medium">Faturamento</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.nome} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-3 font-medium text-black">{row.nome}</td>
                <td className="px-4 py-3">{row.pedidos}</td>
                <td className="px-4 py-3">{formatBRL(row.faturamento)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
