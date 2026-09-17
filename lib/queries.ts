import { createClient } from "@/lib/supabase/server";
import type {
  EventSettings,
  Expense,
  FinanceLedgerEntry,
  MenuCategory,
  MenuItem,
  Order,
  OrderItem,
  PdvLink,
} from "@/lib/types";

export async function getMenuCategories(): Promise<MenuCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_categories")
    .select("*")
    .order("ordem", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getMenuItems(): Promise<MenuItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .eq("status", "disponivel")
    .order("ordem", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getMenuItemById(id: string): Promise<MenuItem | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Usado só no admin autenticado — inclui itens inativos (RLS libera para admin).
export async function getAllMenuItemsAdmin(): Promise<MenuItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .order("ordem", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export interface DashboardStats {
  totalItens: number;
  pedidosHoje: number;
  faturamentoHoje: number;
  pedidosAtivos: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [itensRes, pedidosHojeRes, ativosRes] = await Promise.all([
    supabase
      .from("menu_items")
      .select("id", { count: "exact", head: true })
      .neq("status", "inativo"),
    supabase
      .from("orders")
      .select("total")
      .eq("payment_status", "pago")
      .gte("created_at", startOfDay.toISOString()),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .in("status", ["recebido", "fazendo", "pronto"]),
  ]);

  const pedidosHojeData = pedidosHojeRes.data ?? [];

  return {
    totalItens: itensRes.count ?? 0,
    pedidosHoje: pedidosHojeData.length,
    faturamentoHoje: pedidosHojeData.reduce((s, o) => s + Number(o.total), 0),
    pedidosAtivos: ativosRes.count ?? 0,
  };
}

export async function getAllOrdersAdmin(
  limit = 200
): Promise<{ orders: Order[]; itemsByOrder: Record<string, OrderItem[]> }> {
  const supabase = await createClient();
  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;

  const orderIds = (orders ?? []).map((o) => o.id);
  const itemsByOrder: Record<string, OrderItem[]> = {};

  if (orderIds.length > 0) {
    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .in("order_id", orderIds);
    if (itemsError) throw itemsError;
    for (const item of items ?? []) {
      (itemsByOrder[item.order_id] ??= []).push(item);
    }
  }

  return { orders: orders ?? [], itemsByOrder };
}

export async function getFinanceLedger(limit = 200): Promise<FinanceLedgerEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("finance_ledger")
    .select("*")
    .order("data", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function getPdvLinks(): Promise<PdvLink[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pdv_links")
    .select("id, token, label, ativo, created_by, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getEventSettings(): Promise<EventSettings> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_settings")
    .select("*")
    .eq("id", 1)
    .single();
  if (error) throw error;
  return data;
}

export async function getExpenses(limit = 100): Promise<Expense[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .order("data_despesa", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
