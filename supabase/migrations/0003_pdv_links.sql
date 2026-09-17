-- Telefone do perfil (usado no autocadastro do admin em /admin/login).
alter table public.profiles add column telefone text;

-- ============================================================
-- pdv_links — PDVs identificados por rótulo + senha de acesso,
-- sem precisar de conta/login no Supabase Auth para quem opera o caixa.
-- ============================================================
create table public.pdv_links (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  label text not null,
  password_hash text not null,
  ativo boolean not null default true,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.pdv_links enable row level security;

-- Só admin autenticado gerencia (criar/listar/revogar) via client Supabase.
-- Sem policy de select para anon/authenticated: a leitura pública do
-- rótulo (para exibir antes da senha) e a checagem da senha em si
-- acontecem só em código de servidor com a service role key
-- (app/pdv/[token]/page.tsx, app/api/pdv/[token]/auth, app/api/orders),
-- nunca diretamente pelo client.
create policy "pdv_links_admin_all" on public.pdv_links
  for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ============================================================
-- orders — atribuição da venda a um link de PDV (em vez de a um
-- profile/usuário autenticado, já que PDV não usa Supabase Auth).
-- ============================================================
alter table public.orders add column pdv_link_id uuid references public.pdv_links (id);
alter table public.orders add column pdv_label_snapshot text;

-- Redefine create_order incluindo os novos parâmetros no final. Precisa
-- de DROP antes: adicionar parâmetros muda a lista de tipos, então
-- "create or replace" trataria isso como um novo overload em vez de
-- substituir a função antiga — o que deixaria as duas coexistindo e
-- o PostgREST ambíguo sobre qual chamar.
drop function if exists public.create_order(text, jsonb, text, text, uuid);

create function public.create_order(
  p_channel text,
  p_items jsonb,
  p_payment_method text default null,
  p_customer_name text default null,
  p_created_by uuid default null,
  p_pdv_link_id uuid default null,
  p_pdv_label_snapshot text default null
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
        customer_name, subtotal, total, created_by, paid_at,
        pdv_link_id, pdv_label_snapshot
      )
      values (
        v_order_id, v_pickup_code, p_channel, v_status, p_payment_method, v_payment_status,
        p_customer_name, v_subtotal, v_subtotal, p_created_by,
        case when p_channel = 'pdv' then now() else null end,
        p_pdv_link_id, p_pdv_label_snapshot
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

grant execute on function public.create_order(text, jsonb, text, text, uuid, uuid, text) to anon, authenticated;
