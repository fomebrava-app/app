-- Assistente de precificação solidária.
-- As referências regionais são parâmetros internos, não uma pesquisa oficial;
-- devem ser revisadas pelo organizador antes de cada evento.

create table public.pricing_regions (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  neighborhood text not null,
  state char(2) not null,
  label text not null,
  source_label text not null,
  reference_date date not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (city, neighborhood, state)
);

create table public.pricing_product_templates (
  id uuid primary key default gen_random_uuid(),
  region_id uuid not null references public.pricing_regions (id) on delete cascade,
  product_key text not null,
  nome text not null,
  categoria text not null,
  market_average_price numeric(10, 2) not null check (market_average_price >= 0),
  default_mode text not null check (default_mode in ('pronto', 'produzido')),
  default_ingredients jsonb not null default '[]'::jsonb,
  attention_points jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (region_id, product_key)
);

create table public.pricing_scenarios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  region_id uuid references public.pricing_regions (id) on delete set null,
  total_budget numeric(12, 2) not null check (total_budget >= 0),
  reserve_percentage numeric(5, 2) not null check (reserve_percentage between 0 and 100),
  fundraising_target numeric(12, 2) not null check (fundraising_target >= 0),
  total_planned_cost numeric(12, 2) not null check (total_planned_cost >= 0),
  suggested_revenue numeric(12, 2) not null check (suggested_revenue >= 0),
  input_snapshot jsonb not null,
  result_snapshot jsonb not null,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create index pricing_templates_region_idx
  on public.pricing_product_templates (region_id, active, categoria);
create index pricing_scenarios_created_by_idx
  on public.pricing_scenarios (created_by, created_at desc);

alter table public.pricing_regions enable row level security;
alter table public.pricing_product_templates enable row level security;
alter table public.pricing_scenarios enable row level security;

create policy "pricing_regions_admin_read" on public.pricing_regions
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "pricing_templates_admin_read" on public.pricing_product_templates
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "pricing_scenarios_admin_all" on public.pricing_scenarios
  for all
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    created_by = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

insert into public.pricing_regions (
  id, city, neighborhood, state, label, source_label, reference_date
) values (
  '11111111-1111-4111-8111-111111111111',
  'São Paulo',
  'Itaquera',
  'SP',
  'Itaquera — São Paulo/SP',
  'Referência inicial informada pelo projeto; validar antes do evento',
  '2026-09-24'
);

insert into public.pricing_product_templates (
  id, region_id, product_key, nome, categoria, market_average_price,
  default_mode, default_ingredients, attention_points
) values
(
  '21111111-1111-4111-8111-111111111111',
  '11111111-1111-4111-8111-111111111111',
  'hamburguer', 'Hambúrguer', 'Lanches', 25, 'produzido',
  '["Pães", "Hambúrgueres/carne", "Queijo", "Salada e molhos", "Embalagens individuais"]'::jsonb,
  '["Manter carnes refrigeradas e separar utensílios crus dos alimentos prontos.", "Planejar chapa, gás/energia, montagem e embalagem no ritmo de pico.", "Informar ingredientes alergênicos, especialmente glúten, leite, ovos e molhos."]'::jsonb
),
(
  '22222222-2222-4222-8222-222222222222',
  '11111111-1111-4111-8111-111111111111',
  'pastel', 'Pastel', 'Salgados', 15, 'produzido',
  '["Massa", "Recheios", "Óleo para fritura", "Gás/energia da fritadeira", "Embalagens e guardanapos"]'::jsonb,
  '["Dimensionar óleo, descarte correto, ventilação e prevenção de queimaduras.", "Separar recheios e utensílios para reduzir contaminação cruzada.", "Controlar produção por lotes para evitar perda de qualidade e desperdício."]'::jsonb
),
(
  '23333333-3333-4333-8333-333333333333',
  '11111111-1111-4111-8111-111111111111',
  'suco', 'Suco', 'Bebidas', 10, 'produzido',
  '["Frutas ou polpa", "Água filtrada", "Açúcar/adoçante", "Gelo", "Copos, tampas e canudos"]'::jsonb,
  '["Garantir água potável, gelo de procedência e refrigeração adequada.", "Planejar copos, tampas, canudos e espaço para descarte.", "Preparar em lotes compatíveis com a demanda para reduzir sobra."]'::jsonb
);

