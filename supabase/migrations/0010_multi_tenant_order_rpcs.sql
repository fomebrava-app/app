-- ============================================================
-- Multi-tenant — Fase 2: RPCs de pedido ganham consciência de tenant.
--
-- Todas recebem p_tenant_slug (não p_tenant_id) de propósito: assim o
-- código que chama essas funções não precisa fazer um round-trip extra
-- pra resolver slug -> id antes de cada chamada — a própria função
-- resolve internamente. Isso também significa que, quando a Fase 3
-- (rotas /[tenant]/...) estiver pronta, o app só troca o literal
-- "clubealfa" pelo slug vindo da URL — nenhuma mudança de banco de novo.
--
-- ATENÇÃO AO APLICAR: essa migração muda a assinatura de funções que o
-- app já chama hoje. Precisa ser aplicada JUNTO com o deploy do código
-- que já passa p_tenant_slug (ver lib/tenant.ts e os call sites) —
-- nunca isolada, senão o site quebra (checkout/cozinha/acompanhamento
-- param de funcionar até o deploy do código correspondente).
-- ============================================================

-- ============================================================
-- create_order
-- ============================================================
drop function if exists public.create_order(text, jsonb, text, text, uuid, uuid, text);

create function public.create_order(
  p_channel text,
  p_items jsonb,
  p_tenant_slug text,
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
  v_tenant_id uuid;
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
  select id into v_tenant_id from public.tenants where slug = p_tenant_slug;
  if not found then
    raise exception 'tenant não encontrado: %', p_tenant_slug;
  end if;

  if p_channel not in ('online', 'pdv') then
    raise exception 'channel inválido: %', p_channel;
  end if;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'o pedido precisa ter ao menos um item';
  end if;

  if p_pdv_link_id is not null and not exists (
    select 1 from public.pdv_links where id = p_pdv_link_id and tenant_id = v_tenant_id
  ) then
    raise exception 'link de PDV não pertence a este tenant';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_menu_item from public.menu_items
      where menu_items.id = (v_item ->> 'menu_item_id')::uuid
        and menu_items.tenant_id = v_tenant_id;
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
        pdv_link_id, pdv_label_snapshot, tenant_id
      )
      values (
        v_order_id, v_pickup_code, p_channel, v_status, p_payment_method, v_payment_status,
        p_customer_name, v_subtotal, v_subtotal, p_created_by,
        case when p_channel = 'pdv' then now() else null end,
        p_pdv_link_id, p_pdv_label_snapshot, v_tenant_id
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
    select * into v_menu_item from public.menu_items
      where menu_items.id = (v_item ->> 'menu_item_id')::uuid
        and menu_items.tenant_id = v_tenant_id;
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

grant execute on function public.create_order(text, jsonb, text, text, text, uuid, uuid, text) to anon, authenticated;

-- ============================================================
-- update_order_status
-- ============================================================
drop function if exists public.update_order_status(uuid, text, text, uuid);

create function public.update_order_status(
  p_order_id uuid,
  p_novo_status text,
  p_tenant_slug text,
  p_status_esperado text default null,
  p_changed_by uuid default null
)
returns setof public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_old_status text;
  v_order_tenant uuid;
begin
  select id into v_tenant_id from public.tenants where slug = p_tenant_slug;
  if not found then
    raise exception 'tenant não encontrado: %', p_tenant_slug;
  end if;

  if p_novo_status not in ('recebido', 'fazendo', 'pronto', 'entregue', 'cancelado') then
    raise exception 'status inválido: %', p_novo_status;
  end if;

  select status, tenant_id into v_old_status, v_order_tenant
  from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'pedido não encontrado: %', p_order_id;
  end if;

  if v_order_tenant <> v_tenant_id then
    raise exception 'pedido não pertence a este tenant';
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

grant execute on function public.update_order_status(uuid, text, text, text, uuid) to anon, authenticated;

-- ============================================================
-- get_order_by_code
-- ============================================================
drop function if exists public.get_order_by_code(text);

create function public.get_order_by_code(p_pickup_code text, p_tenant_slug text)
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
  join public.tenants t on t.id = o.tenant_id
  where o.pickup_code = p_pickup_code
    and t.slug = p_tenant_slug
    and o.status <> 'cancelado'
  order by o.created_at desc
  limit 1;
$$;

grant execute on function public.get_order_by_code(text, text) to anon, authenticated;

-- ============================================================
-- list_kitchen_orders
-- ============================================================
drop function if exists public.list_kitchen_orders();

create function public.list_kitchen_orders(p_tenant_slug text)
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
  join public.tenants t on t.id = o.tenant_id
  where o.status in ('recebido', 'fazendo', 'pronto')
    and t.slug = p_tenant_slug;
$$;

grant execute on function public.list_kitchen_orders(text) to anon, authenticated;
