-- Corrige bug em create_order: como a função usa
-- RETURNS TABLE (id uuid, ...), o Postgres declara "id" como variável
-- dentro da função — isso deixa "where id = ..." ambíguo entre essa
-- variável e a coluna menu_items.id, causando o erro
-- "column reference id is ambiguous" ao criar qualquer pedido.
drop function if exists public.create_order(text, jsonb, text, text, uuid, uuid, text);

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
