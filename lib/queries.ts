import { createClient } from "@/lib/supabase/server";
import type {
  EventSettings,
  Expense,
  FinanceLedgerEntry,
  MenuCategory,
  MenuItem,
  MenuItemComplement,
  MenuItemIngredient,
  Order,
  OrderItem,
  PdvLink,
  PricingScenarioSummary,
  Tenant,
} from "@/lib/types";
import {
  DEFAULT_PRICING_PRODUCTS,
  DEFAULT_PRICING_REGIONS,
  type PricingProductTemplate,
  type PricingRegion,
} from "@/lib/pricing-catalog";

// Resolve o slug da URL (params.tenant) pro tenant completo — usado por
// toda página pública/admin logo no início pra saber "de qual tenant é
// isso". A policy de leitura de tenants é pública (tenants_select_public),
// então funciona sem sessão. Retorna null se o slug não existir (a
// página chamadora decide o que fazer — normalmente notFound()).
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getMenuCategories(tenantId: string): Promise<MenuCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_categories")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("ordem", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getMenuItems(tenantId: string): Promise<MenuItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("status", "disponivel")
    .order("ordem", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getMenuItemCustomization(
  menuItemId: string,
  tenantId: string
): Promise<{ ingredients: MenuItemIngredient[]; complements: MenuItemComplement[] }> {
  const supabase = await createClient();
  const [ingredientsRes, complementsRes] = await Promise.all([
    supabase
      .from("menu_item_ingredients")
      .select("*")
      .eq("menu_item_id", menuItemId)
      .eq("tenant_id", tenantId)
      .order("ordem", { ascending: true }),
    supabase
      .from("menu_item_complements")
      .select("*")
      .eq("menu_item_id", menuItemId)
      .eq("tenant_id", tenantId)
      .order("ordem", { ascending: true }),
  ]);
  if (ingredientsRes.error) throw ingredientsRes.error;
  if (complementsRes.error) throw complementsRes.error;
  return {
    ingredients: ingredientsRes.data ?? [],
    complements: complementsRes.data ?? [],
  };
}

export type MenuCustomizations = Record<
  string,
  { ingredients: MenuItemIngredient[]; complements: MenuItemComplement[] }
>;

export async function getMenuCustomizations(tenantId: string): Promise<MenuCustomizations> {
  const supabase = await createClient();
  const [ingredientsRes, complementsRes] = await Promise.all([
    supabase
      .from("menu_item_ingredients")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("ordem", { ascending: true }),
    supabase
      .from("menu_item_complements")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("ordem", { ascending: true }),
  ]);
  if (ingredientsRes.error) throw ingredientsRes.error;
  if (complementsRes.error) throw complementsRes.error;

  const byItem: MenuCustomizations = {};
  for (const ingredient of ingredientsRes.data ?? []) {
    (byItem[ingredient.menu_item_id] ??= { ingredients: [], complements: [] }).ingredients.push(ingredient);
  }
  for (const complement of complementsRes.data ?? []) {
    (byItem[complement.menu_item_id] ??= { ingredients: [], complements: [] }).complements.push(complement);
  }
  return byItem;
}

export async function getMenuItemById(id: string, tenantId: string): Promise<MenuItem | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Usado só no admin autenticado. A policy de menu_items tem um ramo
// público (status <> 'inativo', sem checar tenant) — sem o filtro
// explícito abaixo, um admin veria os itens ativos de TODOS os tenants
// misturados, não só os do próprio.
export async function getAllMenuItemsAdmin(tenantId: string): Promise<MenuItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .eq("tenant_id", tenantId)
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

// orders_select_public é "using (true)" — sem tenant nenhum embutido na
// RLS — por isso todo filtro de orders abaixo precisa do .eq tenant_id
// explícito, senão soma pedido de todo mundo.
export async function getDashboardStats(tenantId: string): Promise<DashboardStats> {
  const supabase = await createClient();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [itensRes, pedidosHojeRes, ativosRes] = await Promise.all([
    supabase
      .from("menu_items")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .neq("status", "inativo"),
    supabase
      .from("orders")
      .select("total")
      .eq("tenant_id", tenantId)
      .eq("payment_status", "pago")
      .gte("created_at", startOfDay.toISOString()),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
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
  tenantId: string,
  limit = 200
): Promise<{ orders: Order[]; itemsByOrder: Record<string, OrderItem[]> }> {
  const supabase = await createClient();
  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .eq("tenant_id", tenantId)
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
    const itemIds = (items ?? []).map((item) => item.id);
    const retiradosPorItem: Record<string, string[]> = {};
    const complementosPorItem: Record<string, string[]> = {};

    if (itemIds.length > 0) {
      const [{ data: removals, error: removalsError }, { data: complements, error: complementsError }] =
        await Promise.all([
          supabase
            .from("order_item_removals")
            .select("order_item_id, nome_snapshot")
            .eq("tenant_id", tenantId)
            .in("order_item_id", itemIds),
          supabase
            .from("order_item_complements")
            .select("order_item_id, nome_snapshot")
            .eq("tenant_id", tenantId)
            .in("order_item_id", itemIds),
        ]);
      if (removalsError) throw removalsError;
      if (complementsError) throw complementsError;
      for (const removal of removals ?? []) {
        (retiradosPorItem[removal.order_item_id] ??= []).push(removal.nome_snapshot);
      }
      for (const complement of complements ?? []) {
        (complementosPorItem[complement.order_item_id] ??= []).push(complement.nome_snapshot);
      }
    }

    for (const item of items ?? []) {
      (itemsByOrder[item.order_id] ??= []).push({
        ...item,
        retirados: retiradosPorItem[item.id] ?? [],
        complementos: complementosPorItem[item.id] ?? [],
      });
    }
  }

  return { orders: orders ?? [], itemsByOrder };
}

export async function getFinanceLedger(
  tenantId: string,
  limit = 200
): Promise<FinanceLedgerEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("finance_ledger")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("data", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function getPdvLinks(tenantId: string): Promise<PdvLink[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pdv_links")
    .select("id, tenant_id, token, label, ativo, created_by, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getEventSettings(tenantId: string): Promise<EventSettings> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_settings")
    .select("*")
    .eq("tenant_id", tenantId)
    .single();
  if (error) throw error;
  return data;
}

export async function getExpenses(tenantId: string, limit = 100): Promise<Expense[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("data_despesa", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

// pricing_regions/pricing_product_templates são referência compartilhada
// entre todos os tenants de propósito — não levam tenant_id.
export async function getPricingCatalog(): Promise<{
  regions: PricingRegion[];
  products: PricingProductTemplate[];
}> {
  const supabase = await createClient();
  const [regionsResult, productsResult] = await Promise.all([
    supabase
      .from("pricing_regions")
      .select("id, city, neighborhood, state, label, source_label, reference_date")
      .eq("active", true)
      .order("label"),
    supabase
      .from("pricing_product_templates")
      .select(
        "id, region_id, product_key, nome, categoria, market_average_price, default_mode, default_ingredients, attention_points"
      )
      .eq("active", true)
      .order("categoria")
      .order("nome"),
  ]);

  // Mantém o assistente utilizável no primeiro acesso, antes de a nova
  // migração ser aplicada. O salvamento continua avisando que o banco
  // precisa ser atualizado.
  if (regionsResult.error || productsResult.error) {
    return {
      regions: DEFAULT_PRICING_REGIONS,
      products: DEFAULT_PRICING_PRODUCTS,
    };
  }

  return {
    regions: (regionsResult.data ?? []) as PricingRegion[],
    products: (productsResult.data ?? []) as PricingProductTemplate[],
  };
}

export async function getRecentPricingScenarios(
  tenantId: string,
  limit = 5
): Promise<PricingScenarioSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pricing_scenarios")
    .select(
      "id, nome, total_budget, total_planned_cost, suggested_revenue, reserve_percentage, fundraising_target, created_at"
    )
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data ?? []) as PricingScenarioSummary[];
}
