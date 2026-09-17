-- Cardápio virtual de evento — schema inicial (single-tenant).
-- Aplicar com: supabase db push  (ou colar no SQL Editor do Supabase Studio)

-- ============================================================
-- profiles — extensão 1:1 de auth.users
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'operador_pdv' check (role in ('admin', 'operador_pdv')),
  created_at timestamptz not null default now()
);

-- Cria automaticamente um profile ao criar um usuário no Supabase Auth.
-- Novo usuário nasce como 'operador_pdv'; promova a 'admin' manualmente:
--   update public.profiles set role = 'admin' where id = '<uuid do usuário>';
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

create policy "profiles_select_self" on public.profiles
  for select using (auth.uid() = id);

-- ============================================================
-- event_settings — singleton (uma linha só, id = 1)
-- ============================================================
create table public.event_settings (
  id int primary key default 1 check (id = 1),
  event_name text not null default 'Meu Evento',
  whatsapp_default_number text,
  whatsapp_message_template text not null default
    'Olá! Aqui está o link para acompanhar seu pedido: {link} — Senha: {senha}',
  updated_at timestamptz not null default now()
);

insert into public.event_settings (id) values (1);

alter table public.event_settings enable row level security;

create policy "event_settings_select_public" on public.event_settings
  for select using (true);

create policy "event_settings_write_admin" on public.event_settings
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ============================================================
-- menu_categories
-- ============================================================
create table public.menu_categories (
  id serial primary key,
  nome text not null unique,
  ordem int not null default 0
);

alter table public.menu_categories enable row level security;

create policy "menu_categories_select_public" on public.menu_categories
  for select using (true);

create policy "menu_categories_write_admin" on public.menu_categories
  for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ============================================================
-- menu_items — substitui o "Product" de relojoaria do protótipo
-- ============================================================
create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  categoria_id int references public.menu_categories (id) on delete set null,
  descricao_curta text,
  descricao_completa text,
  preco numeric(10, 2) not null check (preco >= 0),
  preco_promocional numeric(10, 2) check (preco_promocional is null or preco_promocional >= 0),
  imagem_url text,
  status text not null default 'disponivel' check (status in ('disponivel', 'esgotado', 'inativo')),
  destaque boolean not null default false,
  ordem int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.menu_items enable row level security;

-- Público vê itens não inativos; admin vê tudo (inclusive inativos, para poder reativar).
create policy "menu_items_select" on public.menu_items
  for select using (
    status <> 'inativo'
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "menu_items_write_admin" on public.menu_items
  for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ============================================================
-- orders
-- ============================================================
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  pickup_code text not null,
  channel text not null check (channel in ('online', 'pdv')),
  status text not null default 'aguardando_pagamento'
    check (status in ('aguardando_pagamento', 'recebido', 'fazendo', 'pronto', 'entregue', 'cancelado')),
  payment_method text check (payment_method in ('infinitepay_credito', 'infinitepay_pix', 'dinheiro', 'pix_presencial')),
  payment_status text not null default 'pendente' check (payment_status in ('pendente', 'pago', 'falhou')),
  customer_name text,
  subtotal numeric(10, 2) not null default 0,
  total numeric(10, 2) not null default 0,
  infinitepay_transaction_nsu text,
  infinitepay_slug text,
  infinitepay_receipt_url text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  updated_at timestamptz not null default now()
);

-- Permite reusar o código de retirada depois que o pedido sai do fluxo ativo.
create unique index orders_pickup_code_active_key on public.orders (pickup_code)
  where status not in ('entregue', 'cancelado');

create index orders_status_idx on public.orders (status);

alter table public.orders enable row level security;

-- SELECT público necessário para o Supabase Realtime alimentar /cozinha e
-- /pedido/[codigo] sem autenticação. Trade-off aceito conscientemente:
-- não persistimos telefone do cliente nesta tabela por causa disso (fica
-- só em memória no navegador do atendente do PDV, nunca gravado aqui).
-- Não há política de INSERT/UPDATE/DELETE para anon/authenticated — toda
-- escrita passa pelas funções security definer abaixo.
create policy "orders_select_public" on public.orders
  for select using (true);

-- ============================================================
-- order_items — snapshot do que foi pedido (resiliente a edição/remoção
-- futura do item de cardápio). Sem policy de select para anon: a leitura
-- pública acontece só via as funções security definer (que bypassam RLS),
-- nunca por select direto na tabela.
-- ============================================================
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  menu_item_id uuid references public.menu_items (id) on delete set null,
  nome_snapshot text not null,
  preco_unitario_snapshot numeric(10, 2) not null,
  quantidade int not null check (quantidade > 0),
  subtotal numeric(10, 2) not null
);

create index order_items_order_id_idx on public.order_items (order_id);

alter table public.order_items enable row level security;

create policy "order_items_select_admin" on public.order_items
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ============================================================
-- order_status_events — auditoria de transições de status
-- ============================================================
create table public.order_status_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  status_anterior text,
  status_novo text not null,
  changed_by uuid references public.profiles (id),
  changed_at timestamptz not null default now()
);

alter table public.order_status_events enable row level security;

create policy "order_status_events_select_admin" on public.order_status_events
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ============================================================
-- expenses — lado "Saída" do financeiro (entradas vêm de orders pagos)
-- ============================================================
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  descricao text not null,
  categoria text not null default 'Geral',
  valor numeric(10, 2) not null check (valor >= 0),
  data_despesa date not null default current_date,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.expenses enable row level security;

create policy "expenses_admin_all" on public.expenses
  for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ============================================================
-- finance_ledger — view de extrato (entradas de pedidos pagos + saídas)
-- ============================================================
create view public.finance_ledger as
  select
    'Entrada'::text as tipo,
    ('Pedido ' || o.pickup_code || ' (' || o.channel || ')')::text as descricao,
    coalesce(o.payment_method, 'infinitepay_credito')::text as categoria,
    o.total as valor,
    coalesce(o.paid_at, o.created_at)::date as data,
    o.id as referencia_id
  from public.orders o
  where o.payment_status = 'pago'
  union all
  select
    'Saída'::text as tipo,
    e.descricao,
    e.categoria,
    e.valor,
    e.data_despesa as data,
    e.id as referencia_id
  from public.expenses e;

alter view public.finance_ledger set (security_invoker = true);

-- ============================================================
-- Triggers de updated_at
-- ============================================================
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger menu_items_set_updated_at
  before update on public.menu_items
  for each row execute function public.set_updated_at();

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ============================================================
-- RPC: create_order — único caminho de criação de pedido (online e pdv)
-- ============================================================
create function public.create_order(
  p_channel text,
  p_items jsonb, -- [{ "menu_item_id": "...", "quantidade": 2 }, ...]
  p_payment_method text default null,
  p_customer_name text default null,
  p_created_by uuid default null
)
returns table (id uuid, pickup_code text, total numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid := gen_random_uuid();
  v_pickup_code text;
  v_subtotal numeric(10, 2) := 0;
  v_item jsonb;
  v_menu_item public.menu_items%rowtype;
  v_quantidade int;
  v_attempts int := 0;
  v_status text;
  v_payment_status text;
begin
  if p_channel not in ('online', 'pdv') then
    raise exception 'channel inválido: %', p_channel;
  end if;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'o pedido precisa ter ao menos um item';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_menu_item from public.menu_items where menu_items.id = (v_item ->> 'menu_item_id')::uuid;
    if not found then
      raise exception 'item de cardápio não encontrado: %', v_item ->> 'menu_item_id';
    end if;
    if v_menu_item.status <> 'disponivel' then
      raise exception 'item indisponível: %', v_menu_item.nome;
    end if;
    v_quantidade := (v_item ->> 'quantidade')::int;
    v_subtotal := v_subtotal + coalesce(v_menu_item.preco_promocional, v_menu_item.preco) * v_quantidade;
  end loop;

  if p_channel = 'pdv' then
    v_status := 'recebido';
    v_payment_status := 'pago';
  else
    v_status := 'aguardando_pagamento';
    v_payment_status := 'pendente';
  end if;

  loop
    v_pickup_code := lpad(floor(random() * 10000)::text, 4, '0');
    begin
      insert into public.orders (
        id, pickup_code, channel, status, payment_method, payment_status,
        customer_name, subtotal, total, created_by, paid_at
      )
      values (
        v_order_id, v_pickup_code, p_channel, v_status, p_payment_method, v_payment_status,
        p_customer_name, v_subtotal, v_subtotal, p_created_by,
        case when p_channel = 'pdv' then now() else null end
      );
      exit;
    exception when unique_violation then
      v_attempts := v_attempts + 1;
      if v_attempts > 30 then
        raise exception 'não foi possível gerar um código de retirada único, tente novamente';
      end if;
    end;
  end loop;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_menu_item from public.menu_items where menu_items.id = (v_item ->> 'menu_item_id')::uuid;
    v_quantidade := (v_item ->> 'quantidade')::int;
    insert into public.order_items (
      order_id, menu_item_id, nome_snapshot, preco_unitario_snapshot, quantidade, subtotal
    )
    values (
      v_order_id, v_menu_item.id, v_menu_item.nome,
      coalesce(v_menu_item.preco_promocional, v_menu_item.preco), v_quantidade,
      coalesce(v_menu_item.preco_promocional, v_menu_item.preco) * v_quantidade
    );
  end loop;

  if p_channel = 'pdv' then
    insert into public.order_status_events (order_id, status_anterior, status_novo, changed_by)
    values (v_order_id, null, 'recebido', p_created_by);
  end if;

  return query select v_order_id, v_pickup_code, v_subtotal;
end;
$$;

grant execute on function public.create_order(text, jsonb, text, text, uuid) to anon, authenticated;

-- ============================================================
-- RPC: update_order_status — usada pela cozinha e pelo admin (histórico)
-- Concorrência otimista: se outro operador já mudou o status, vira no-op
-- silencioso (retorna o estado atual sem erro) em vez de dar conflito.
-- ============================================================
create function public.update_order_status(
  p_order_id uuid,
  p_novo_status text,
  p_status_esperado text default null,
  p_changed_by uuid default null
)
returns setof public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_status text;
begin
  if p_novo_status not in ('recebido', 'fazendo', 'pronto', 'entregue', 'cancelado') then
    raise exception 'status inválido: %', p_novo_status;
  end if;

  select status into v_old_status from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'pedido não encontrado: %', p_order_id;
  end if;

  if p_status_esperado is not null and v_old_status <> p_status_esperado then
    return query select * from public.orders where id = p_order_id;
    return;
  end if;

  update public.orders set status = p_novo_status where id = p_order_id;

  insert into public.order_status_events (order_id, status_anterior, status_novo, changed_by)
  values (p_order_id, v_old_status, p_novo_status, p_changed_by);

  return query select * from public.orders where id = p_order_id;
end;
$$;

grant execute on function public.update_order_status(uuid, text, text, uuid) to anon, authenticated;

-- ============================================================
-- RPC: get_order_by_code — tela pública de acompanhamento do pedido
-- ============================================================
create function public.get_order_by_code(p_pickup_code text)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object(
    'id', o.id,
    'pickup_code', o.pickup_code,
    'status', o.status,
    'channel', o.channel,
    'payment_status', o.payment_status,
    'total', o.total,
    'created_at', o.created_at,
    'paid_at', o.paid_at,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'nome', oi.nome_snapshot,
        'quantidade', oi.quantidade,
        'preco_unitario', oi.preco_unitario_snapshot,
        'subtotal', oi.subtotal
      ) order by oi.id)
      from public.order_items oi where oi.order_id = o.id
    ), '[]'::jsonb)
  )
  from public.orders o
  where o.pickup_code = p_pickup_code
    and o.status <> 'cancelado'
  order by o.created_at desc
  limit 1;
$$;

grant execute on function public.get_order_by_code(text) to anon, authenticated;

-- ============================================================
-- RPC: list_kitchen_orders — alimenta a tela pública da cozinha (KDS)
-- ============================================================
create function public.list_kitchen_orders()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', o.id,
    'pickup_code', o.pickup_code,
    'status', o.status,
    'channel', o.channel,
    'customer_name', o.customer_name,
    'created_at', o.created_at,
    'items', (
      select jsonb_agg(jsonb_build_object(
        'nome', oi.nome_snapshot,
        'quantidade', oi.quantidade
      ) order by oi.id)
      from public.order_items oi where oi.order_id = o.id
    )
  ) order by o.created_at asc), '[]'::jsonb)
  from public.orders o
  where o.status in ('recebido', 'fazendo', 'pronto');
$$;

grant execute on function public.list_kitchen_orders() to anon, authenticated;
