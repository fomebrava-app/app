// Tipos de domínio do cardápio virtual.
// Espelham o schema em supabase/migrations/0001_init.sql — depois que o
// projeto Supabase existir, rodar `npx supabase gen types typescript` e
// considerar substituir/complementar isto pelos tipos gerados.

export interface Tenant {
  id: string;
  slug: string;
  nome: string;
  infinitepay_handle: string | null;
  infinitepay_default_customer_email: string | null;
  created_at: string;
}

export type MenuItemStatus = "disponivel" | "esgotado" | "inativo";

export interface MenuCategory {
  id: number;
  tenant_id: string;
  nome: string;
  ordem: number;
}

export interface MenuItem {
  id: string;
  tenant_id: string;
  nome: string;
  categoria_id: number | null;
  descricao_curta: string | null;
  descricao_completa: string | null;
  preco: number;
  preco_promocional: number | null;
  imagem_url: string | null;
  status: MenuItemStatus;
  destaque: boolean;
  personalizavel: boolean;
  ordem: number;
  created_at: string;
  updated_at: string;
}

export interface MenuItemIngredient {
  id: string;
  tenant_id: string;
  menu_item_id: string;
  nome: string;
  ordem: number;
}

export interface MenuItemComplement {
  id: string;
  tenant_id: string;
  menu_item_id: string;
  nome: string;
  cobra: boolean;
  preco: number | null;
  ordem: number;
}

export type OrderChannel = "online" | "pdv";

export type OrderStatus =
  | "aguardando_pagamento"
  | "reservado"
  | "recebido"
  | "fazendo"
  | "pronto"
  | "entregue"
  | "cancelado";

export type OrderFulfillment = "retirada" | "entrega";

export type PaymentMethod =
  | "infinitepay_credito"
  | "infinitepay_pix"
  | "dinheiro"
  | "pix_presencial"
  | "pix";

export type CampaignStatus = "aberta" | "encerrada";

export type CampaignRecebimento = "infinitepay" | "pix";

export interface Campaign {
  id: string;
  tenant_id: string;
  nome: string;
  status: CampaignStatus;
  recebimento: CampaignRecebimento;
  pix_chave: string | null;
  reserva_antes_pagamento: boolean;
  usa_cozinha: boolean;
  opened_at: string;
  closed_at: string | null;
}

export interface OrderContact {
  order_id: string;
  tenant_id: string;
  customer_phone: string | null;
  endereco: string | null;
}

export type PaymentStatus = "pendente" | "pago" | "falhou";

export interface Order {
  id: string;
  tenant_id: string;
  pickup_code: string;
  channel: OrderChannel;
  status: OrderStatus;
  payment_method: PaymentMethod | null;
  payment_status: PaymentStatus;
  customer_name: string | null;
  campaign_id: string;
  fulfillment: OrderFulfillment;
  subtotal: number;
  total: number;
  infinitepay_transaction_nsu: string | null;
  infinitepay_slug: string | null;
  infinitepay_receipt_url: string | null;
  created_by: string | null;
  pdv_link_id: string | null;
  pdv_label_snapshot: string | null;
  created_at: string;
  paid_at: string | null;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  nome_snapshot: string;
  preco_unitario_snapshot: number;
  quantidade: number;
  subtotal: number;
  retirados?: string[];
  complementos?: string[];
}

export interface CartRemoval {
  id: string;
  nome: string;
}

export interface CartComplement {
  id: string;
  nome: string;
  cobra: boolean;
  preco: number | null;
}

export interface CartCustomization {
  removals: CartRemoval[];
  complements: CartComplement[];
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export interface Expense {
  id: string;
  tenant_id: string;
  descricao: string;
  categoria: string;
  valor: number;
  data_despesa: string;
  created_by: string | null;
  created_at: string;
}

export interface FinanceLedgerEntry {
  tipo: "Entrada" | "Saída";
  descricao: string;
  categoria: string;
  valor: number;
  data: string;
  referencia_id: string;
  tenant_id: string;
  campaign_id: string;
}

export interface EventSettings {
  id: number;
  tenant_id: string;
  event_name: string;
  whatsapp_default_number: string | null;
  whatsapp_message_template: string | null;
  updated_at: string;
}

export type ProfileRole = "admin" | "operador_pdv";

export interface Profile {
  id: string;
  tenant_id: string | null;
  full_name: string | null;
  telefone: string | null;
  role: ProfileRole;
}

export interface PdvLink {
  id: string;
  tenant_id: string;
  token: string;
  label: string;
  ativo: boolean;
  created_by: string | null;
  created_at: string;
}

export interface PricingScenarioSummary {
  id: string;
  nome: string;
  total_budget: number;
  total_planned_cost: number;
  suggested_revenue: number;
  reserve_percentage: number;
  fundraising_target: number;
  created_at: string;
}

// Carrinho — só existe no client, nunca é persistido diretamente.
export interface CartItem {
  lineId: string;
  menuItem: MenuItem;
  quantidade: number;
  customization: CartCustomization;
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  reservado: "Reservado",
  recebido: "Recebido",
  fazendo: "Fazendo",
  pronto: "Pronto",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

// Cor de destaque suave/translúcida por status, usada em qualquer lugar
// do sistema que mostre o status do pedido (cozinha, acompanhamento do
// cliente, lista de pedidos do admin) — opacidade baixa para a fonte
// continuar em destaque, tanto em fundo claro quanto escuro.
export const ORDER_STATUS_ACCENT_CLASS: Partial<Record<OrderStatus, string>> = {
  fazendo: "bg-amber-400/10 border-amber-400/30",
  pronto: "bg-green-400/10 border-green-400/30",
};
