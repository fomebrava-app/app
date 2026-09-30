-- ============================================================
-- Multi-tenant — Fase 3 (complemento): finance_ledger precisa expor
-- tenant_id pra ser filtrável em lib/queries.ts — a política pública
-- de orders (orders_select_public, using(true)) não restringe por
-- tenant, então a filtragem tem que acontecer na camada de query.
-- ============================================================
create or replace view public.finance_ledger as
  select
    'Entrada'::text as tipo,
    ('Pedido ' || o.pickup_code || ' (' || o.channel || ')')::text as descricao,
    coalesce(o.payment_method, 'infinitepay_credito')::text as categoria,
    o.total as valor,
    coalesce(o.paid_at, o.created_at)::date as data,
    o.id as referencia_id,
    o.tenant_id as tenant_id
  from public.orders o
  where o.payment_status = 'pago'
  union all
  select
    'Saída'::text as tipo,
    e.descricao,
    e.categoria,
    e.valor,
    e.data_despesa as data,
    e.id as referencia_id,
    e.tenant_id as tenant_id
  from public.expenses e;

alter view public.finance_ledger set (security_invoker = true);
