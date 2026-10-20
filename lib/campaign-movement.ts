import type { OrderChannel, OrderFulfillment, PaymentMethod, PaymentStatus } from "@/lib/types";

// Recorte do movimento de uma campanha.
// Pedido cancelado não entra. Faturamento soma só payment_status pago.

export type MovementChannel = "todos" | OrderChannel;
export type MovementSituation = "todos" | "pagos" | "pendentes";

export interface MovementFilters {
  canal: MovementChannel;
  pdv: string;
  situacao: MovementSituation;
}

export interface MovementOrder {
  id: string;
  channel: OrderChannel;
  payment_method: PaymentMethod | null;
  payment_status: PaymentStatus;
  status: string;
  fulfillment: OrderFulfillment;
  total: number;
  pdv_label_snapshot: string | null;
}

export interface MovementItem {
  order_id: string;
  nome_snapshot: string;
  quantidade: number;
  subtotal: number;
}

export interface MovementCountRow {
  nome: string;
  pedidos: number;
  itens: number;
  faturamento: number;
}

export interface MovementPaymentRow {
  nome: string;
  pedidos: number;
  faturamento: number;
}

export interface CampaignMovementView {
  cards: {
    pedidos: number;
    itens: number;
    faturamento: number;
    ticketMedio: number;
    reservasPendentes: number;
    retirada: number;
    entrega: number;
  };
  pontos: MovementCountRow[];
  produtos: MovementCountRow[];
  pagamentos: MovementPaymentRow[];
  pdvOptions: string[];
}

const PAYMENT_ORDER = [
  { key: "dinheiro", nome: "Dinheiro" },
  { key: "pix_presencial", nome: "Pix" },
  { key: "reserva", nome: "Reserva" },
  { key: "pix", nome: "Pix no WhatsApp" },
  { key: "infinitepay", nome: "InfinitePay" },
] as const;

const ONLINE_POINT = "Cardápio online";
const UNNAMED_PDV = "PDV sem nome";

export function parseMovementFilters(input: {
  canal?: string;
  pdv?: string;
  situacao?: string;
}): MovementFilters {
  const canal: MovementChannel =
    input.canal === "online" || input.canal === "pdv" ? input.canal : "todos";
  const situacao: MovementSituation =
    input.situacao === "pagos" || input.situacao === "pendentes" ? input.situacao : "todos";
  const pdv = input.pdv?.trim() || "todos";
  return { canal, pdv: canal === "online" ? "todos" : pdv, situacao };
}

function pointName(order: MovementOrder): string {
  if (order.channel === "online") return ONLINE_POINT;
  return order.pdv_label_snapshot?.trim() || UNNAMED_PDV;
}

function paymentKey(method: PaymentMethod | null): string {
  if (method === "infinitepay_credito" || method === "infinitepay_pix") return "infinitepay";
  if (
    method === "dinheiro" ||
    method === "pix_presencial" ||
    method === "reserva" ||
    method === "pix"
  ) {
    return method;
  }
  return "outros";
}

function inSlice(order: MovementOrder, filters: MovementFilters): boolean {
  if (order.status === "cancelado") return false;
  if (filters.canal !== "todos" && order.channel !== filters.canal) return false;
  if (filters.pdv !== "todos" && pointName(order) !== filters.pdv) return false;
  if (filters.situacao === "pagos" && order.payment_status !== "pago") return false;
  if (filters.situacao === "pendentes" && order.payment_status !== "pendente") return false;
  return true;
}

function paidValue(order: MovementOrder): number {
  return order.payment_status === "pago" ? Number(order.total) : 0;
}

export function summarizeCampaignMovement(
  orders: MovementOrder[],
  items: MovementItem[],
  filters: MovementFilters
): CampaignMovementView {
  const pdvOptions = [
    ...new Set(
      orders
        .filter((order) => order.status !== "cancelado" && order.channel === "pdv")
        .map(pointName)
    ),
  ].sort((a, b) => a.localeCompare(b, "pt-BR"));

  const selected = orders.filter((order) => inSlice(order, filters));
  const selectedIds = new Set(selected.map((order) => order.id));
  const itemsByOrder = new Map<string, MovementItem[]>();
  for (const item of items) {
    if (!selectedIds.has(item.order_id)) continue;
    const list = itemsByOrder.get(item.order_id) ?? [];
    list.push(item);
    itemsByOrder.set(item.order_id, list);
  }

  let itens = 0;
  let faturamento = 0;
  let pagos = 0;
  let reservasPendentes = 0;
  let retirada = 0;
  let entrega = 0;

  const pontos = new Map<string, MovementCountRow>();
  const produtos = new Map<string, MovementCountRow>();
  const pagamentos = new Map<string, MovementPaymentRow>();
  for (const row of PAYMENT_ORDER) {
    pagamentos.set(row.key, { nome: row.nome, pedidos: 0, faturamento: 0 });
  }

  for (const order of selected) {
    const valor = paidValue(order);
    const orderItems = itemsByOrder.get(order.id) ?? [];
    const quantidade = orderItems.reduce((sum, item) => sum + Number(item.quantidade), 0);
    itens += quantidade;
    faturamento += valor;
    if (order.payment_status === "pago") pagos += 1;
    if (order.payment_method === "reserva" && order.payment_status === "pendente") {
      reservasPendentes += 1;
    }
    if (order.fulfillment === "entrega") entrega += 1;
    else retirada += 1;

    const ponto = pontos.get(pointName(order)) ?? {
      nome: pointName(order),
      pedidos: 0,
      itens: 0,
      faturamento: 0,
    };
    ponto.pedidos += 1;
    ponto.itens += quantidade;
    ponto.faturamento += valor;
    pontos.set(pointName(order), ponto);

    const key = paymentKey(order.payment_method);
    const pagamento = pagamentos.get(key) ?? { nome: "Outra forma", pedidos: 0, faturamento: 0 };
    pagamento.pedidos += 1;
    pagamento.faturamento += valor;
    pagamentos.set(key, pagamento);

    for (const item of orderItems) {
      const nome = item.nome_snapshot.trim() || "Item sem nome";
      const produto = produtos.get(nome) ?? { nome, pedidos: 0, itens: 0, faturamento: 0 };
      produto.pedidos += 1;
      produto.itens += Number(item.quantidade);
      if (order.payment_status === "pago") produto.faturamento += Number(item.subtotal);
      produtos.set(nome, produto);
    }
  }

  const paymentRows = [
    ...PAYMENT_ORDER.map((row) => pagamentos.get(row.key)!),
    ...(pagamentos.get("outros") && pagamentos.get("outros")!.pedidos > 0
      ? [pagamentos.get("outros")!]
      : []),
  ];

  return {
    cards: {
      pedidos: selected.length,
      itens,
      faturamento,
      ticketMedio: pagos > 0 ? faturamento / pagos : 0,
      reservasPendentes,
      retirada,
      entrega,
    },
    pontos: [...pontos.values()].sort(
      (a, b) => b.pedidos - a.pedidos || a.nome.localeCompare(b.nome, "pt-BR")
    ),
    produtos: [...produtos.values()].sort(
      (a, b) => b.itens - a.itens || a.nome.localeCompare(b.nome, "pt-BR")
    ),
    pagamentos: paymentRows,
    pdvOptions,
  };
}
