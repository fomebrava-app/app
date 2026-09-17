// Tipos de domínio do cardápio virtual.
// Espelham o schema em supabase/migrations/0001_init.sql — depois que o
// projeto Supabase existir, rodar `npx supabase gen types typescript` e
// considerar substituir/complementar isto pelos tipos gerados.

export type MenuItemStatus = "disponivel" | "esgotado" | "inativo";

export interface MenuCategory {
  id: number;
  nome: string;
  ordem: number;
}

export interface MenuItem {
  id: string;
  nome: string;
  categoria_id: number | null;
  descricao_curta: string | null;
  descricao_completa: string | null;
  preco: number;
  preco_promocional: number | null;
  imagem_url: string | null;
  status: MenuItemStatus;
  destaque: boolean;
  ordem: number;
  created_at: string;
  updated_at: string;
}

export type OrderChannel = "online" | "pdv";

export type OrderStatus =
  | "aguardando_pagamento"
  | "recebido"
  | "fazendo"
  | "pronto"
  | "entregue"
  | "cancelado";

export type PaymentMethod =
  | "infinitepay_credito"
  | "infinitepay_pix"
  | "dinheiro"
  | "pix_presencial";

export type PaymentStatus = "pendente" | "pago" | "falhou";

export interface Order {
  id: string;
  pickup_code: string;
  channel: OrderChannel;
  status: OrderStatus;
  payment_method: PaymentMethod | null;
  payment_status: PaymentStatus;
  customer_name: string | null;
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
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export interface Expense {
  id: string;
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
}

export interface EventSettings {
  id: 1;
  event_name: string;
  whatsapp_default_number: string | null;
  whatsapp_message_template: string | null;
  updated_at: string;
}

export type ProfileRole = "admin" | "operador_pdv";

export interface Profile {
  id: string;
  full_name: string | null;
  telefone: string | null;
  role: ProfileRole;
}

export interface PdvLink {
  id: string;
  token: string;
  label: string;
  ativo: boolean;
  created_by: string | null;
  created_at: string;
}

// Carrinho — só existe no client, nunca é persistido diretamente.
export interface CartItem {
  menuItem: MenuItem;
  quantidade: number;
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  aguardando_pagamento: "Aguardando pagamento",
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
