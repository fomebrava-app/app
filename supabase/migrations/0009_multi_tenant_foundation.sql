-- ============================================================
-- Multi-tenant — Fase 1: fundação de schema.
-- Cria a tabela tenants, adiciona tenant_id nas tabelas de dados
-- de cada operação, migra todos os dados existentes para o tenant
-- "clubealfa" (operação atual, já em produção), e reescreve as RLS
-- admin-only para respeitar o tenant do usuário logado.
--
-- Rotas (app/[tenant]/...), RPCs (create_order etc.) e proxy.ts
-- ganham consciência de tenant nas próximas migrações/fases — ver
-- o plano multi-tenant. Esta migração só estabelece a fundação de
-- dados; a aplicação ainda não passa p_tenant_id pra lugar nenhum.
-- ============================================================

-- ============================================================
-- tenants
-- ============================================================
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]([a-z0-9-]{0,48}[a-z0-9])?$'),
  nome text not null,
  infinitepay_handle text,
  infinitepay_default_customer_email text,
  created_at timestamptz not null default now()
);

alter table public.tenants enable row level security;

-- Leitura pública: a loja/cozinha/pdv de cada tenant precisam resolver
-- slug -> id sem estar autenticados (visitante anônimo). O handle da
-- InfinitePay não é segredo — já fica exposto em links de pagamento.
create policy "tenants_select_public" on public.tenants
  for select using (true);

-- ============================================================
-- tenant_id nas tabelas de dados de cada operação (precisa vir antes
-- da função current_tenant_id() abaixo, que lê profiles.tenant_id).
-- ============================================================
alter table public.profiles add column tenant_id uuid references public.tenants (id);
alter table public.menu_items add column tenant_id uuid references public.tenants (id);
alter table public.menu_categories add column tenant_id uuid references public.tenants (id);
alter table public.orders add column tenant_id uuid references public.tenants (id);
alter table public.expenses add column tenant_id uuid references public.tenants (id);
alter table public.pdv_links add column tenant_id uuid references public.tenants (id);

-- pricing_scenarios é o cálculo salvo de um admin específico (dado do
-- tenant); pricing_regions/pricing_product_templates continuam globais
-- de propósito — são referências regionais compartilhadas, não dado de
-- tenant (qualquer admin, de qualquer tenant, se beneficia da mesma
-- base de preços de mercado).
alter table public.pricing_scenarios add column tenant_id uuid references public.tenants (id);

-- event_settings deixa de ser singleton fixo (id sempre 1) e vira uma
-- linha por tenant.
alter table public.event_settings drop constraint if exists event_settings_id_check;
alter table public.event_settings alter column id drop default;
create sequence if not exists public.event_settings_id_seq;
select setval('public.event_settings_id_seq', (select coalesce(max(id), 1) from public.event_settings));
alter table public.event_settings alter column id set default nextval('public.event_settings_id_seq');
alter sequence public.event_settings_id_seq owned by public.event_settings.id;
alter table public.event_settings add column tenant_id uuid references public.tenants (id);
alter table public.event_settings add constraint event_settings_tenant_id_key unique (tenant_id);

-- ============================================================
-- Helper: tenant do usuário logado (security definer, evita repetir
-- a subquery em toda policy admin-only).
-- ============================================================
create function public.current_tenant_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select tenant_id from public.profiles where id = auth.uid();
$$;

grant execute on function public.current_tenant_id() to authenticated;

-- Só o próprio tenant (admin dele) edita seus dados de config.
create policy "tenants_update_self" on public.tenants
  for update using (
    id = public.current_tenant_id()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (id = public.current_tenant_id());

-- ============================================================
-- Migração dos dados existentes -> tenant "clubealfa"
-- ============================================================
do $$
declare
  v_tenant_id uuid;
begin
  insert into public.tenants (slug, nome)
  values ('clubealfa', 'Clube Alfa')
  returning id into v_tenant_id;

  update public.profiles set tenant_id = v_tenant_id where tenant_id is null;
  update public.menu_items set tenant_id = v_tenant_id where tenant_id is null;
  update public.menu_categories set tenant_id = v_tenant_id where tenant_id is null;
  update public.orders set tenant_id = v_tenant_id where tenant_id is null;
  update public.expenses set tenant_id = v_tenant_id where tenant_id is null;
  update public.pdv_links set tenant_id = v_tenant_id where tenant_id is null;
  update public.pricing_scenarios set tenant_id = v_tenant_id where tenant_id is null;
  update public.event_settings set tenant_id = v_tenant_id where tenant_id is null;
end $$;

alter table public.menu_items alter column tenant_id set not null;
alter table public.menu_categories alter column tenant_id set not null;
alter table public.orders alter column tenant_id set not null;
alter table public.expenses alter column tenant_id set not null;
alter table public.pdv_links alter column tenant_id set not null;
alter table public.pricing_scenarios alter column tenant_id set not null;
alter table public.event_settings alter column tenant_id set not null;
-- profiles.tenant_id fica nullable de propósito: um usuário recém-criado
-- via trigger (handle_new_user) ainda não tem tenant até o passo seguinte
-- do cadastro definir/criar um (ver Fase 3).

-- ============================================================
-- Correção de unicidade da senha de retirada — hoje é global; com
-- mais de um tenant ativo, uma colisão de 4 dígitos entre tenants
-- diferentes quebraria o checkout de um deles.
-- ============================================================
drop index if exists public.orders_pickup_code_active_key;
create unique index orders_pickup_code_active_key on public.orders (tenant_id, pickup_code)
  where status not in ('entregue', 'cancelado');

-- ============================================================
-- RLS admin-only: escopadas por tenant
-- ============================================================

-- menu_items: a cláusula pública (status <> 'inativo') continua global
-- de propósito (filtragem por tenant na loja pública acontece na camada
-- de query, Fase 3) — só o ramo "admin vê inativos também" passa a
-- exigir ser do próprio tenant, senão um admin veria itens inativos de
-- outro tenant.
drop policy if exists "menu_items_select" on public.menu_items;
create policy "menu_items_select" on public.menu_items
  for select using (
    status <> 'inativo'
    or (
      tenant_id = public.current_tenant_id()
      and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    )
  );

drop policy if exists "menu_items_write_admin" on public.menu_items;
create policy "menu_items_write_admin" on public.menu_items
  for all
  using (
    tenant_id = public.current_tenant_id()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    tenant_id = public.current_tenant_id()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "menu_categories_write_admin" on public.menu_categories;
create policy "menu_categories_write_admin" on public.menu_categories
  for all
  using (
    tenant_id = public.current_tenant_id()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    tenant_id = public.current_tenant_id()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "expenses_admin_all" on public.expenses;
create policy "expenses_admin_all" on public.expenses
  for all
  using (
    tenant_id = public.current_tenant_id()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    tenant_id = public.current_tenant_id()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "event_settings_write_admin" on public.event_settings;
create policy "event_settings_write_admin" on public.event_settings
  for update using (
    tenant_id = public.current_tenant_id()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- order_items / order_status_events não têm tenant_id direto — evita
-- duplicar/derivar de orders via join, pra não arriscar drift.
drop policy if exists "order_items_select_admin" on public.order_items;
create policy "order_items_select_admin" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.tenant_id = public.current_tenant_id()
    )
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "order_status_events_select_admin" on public.order_status_events;
create policy "order_status_events_select_admin" on public.order_status_events
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_status_events.order_id and o.tenant_id = public.current_tenant_id()
    )
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "pdv_links_admin_all" on public.pdv_links;
create policy "pdv_links_admin_all" on public.pdv_links
  for all
  using (
    tenant_id = public.current_tenant_id()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    tenant_id = public.current_tenant_id()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- pricing_scenarios: fecha um gap que já existia antes do multi-tenant
-- (a policy de leitura deixava qualquer admin ver o cálculo salvo de
-- qualquer outro admin, sem checar nem autoria nem — agora — tenant).
drop policy if exists "pricing_scenarios_admin_all" on public.pricing_scenarios;
create policy "pricing_scenarios_admin_all" on public.pricing_scenarios
  for all
  using (
    tenant_id = public.current_tenant_id()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    tenant_id = public.current_tenant_id()
    and created_by = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ============================================================
-- Storage: fotos do cardápio ganham prefixo de tenant no path
-- (aplicação passa a subir como "<tenant_id>/<uuid>-<nome>"), e a
-- policy de escrita passa a exigir que o path comece com o tenant
-- do usuário logado — evita um admin sobrescrever/apagar a foto de
-- outro tenant no mesmo bucket público.
-- ============================================================
drop policy if exists "menu_images_admin_write" on storage.objects;
create policy "menu_images_admin_write" on storage.objects
  for all
  using (
    bucket_id = 'menu-images'
    and (storage.foldername(name))[1] = public.current_tenant_id()::text
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    bucket_id = 'menu-images'
    and (storage.foldername(name))[1] = public.current_tenant_id()::text
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
