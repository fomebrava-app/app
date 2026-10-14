-- A função create_order já aplicada em 0013 usa RETURNING id.
-- Essa saída da função também se chama id, e o Postgres recusa o pedido
-- com "column reference id is ambiguous". Aqui o id da linha é gerado antes do insert.

create or replace function public.create_order(
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
  v_remover jsonb;
  v_complementos jsonb;
  v_distinct int;
  v_choice_id text;
  v_extra numeric(10, 2);
  v_unit numeric(10, 2);
  v_order_item_id uuid;
  v_ingredient public.menu_item_ingredients%rowtype;
  v_complement public.menu_item_complements%rowtype;
begin
  select tenants.id into v_tenant_id from public.tenants where tenants.slug = p_tenant_slug;
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
    select 1 from public.pdv_links
    where pdv_links.id = p_pdv_link_id and pdv_links.tenant_id = v_tenant_id
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
    if v_quantidade is null or v_quantidade <= 0 then
      raise exception 'quantidade inválida';
    end if;

    v_remover := coalesce(v_item -> 'remover_ids', '[]'::jsonb);
    v_complementos := coalesce(v_item -> 'complemento_ids', '[]'::jsonb);
    if jsonb_typeof(v_remover) = 'null' then
      v_remover := '[]'::jsonb;
    end if;
    if jsonb_typeof(v_complementos) = 'null' then
      v_complementos := '[]'::jsonb;
    end if;
    if jsonb_typeof(v_remover) <> 'array' or jsonb_typeof(v_complementos) <> 'array' then
      raise exception 'personalização inválida';
    end if;

    if (jsonb_array_length(v_remover) > 0 or jsonb_array_length(v_complementos) > 0)
       and not v_menu_item.personalizavel then
      raise exception 'este produto não aceita personalização: %', v_menu_item.nome;
    end if;

    select count(distinct value)::int into v_distinct
    from jsonb_array_elements_text(v_remover);
    if v_distinct <> jsonb_array_length(v_remover) then
      raise exception 'ingrediente repetido na personalização';
    end if;

    select count(distinct value)::int into v_distinct
    from jsonb_array_elements_text(v_complementos);
    if v_distinct <> jsonb_array_length(v_complementos) then
      raise exception 'complemento repetido na personalização';
    end if;

    v_extra := 0;
    for v_choice_id in select value from jsonb_array_elements_text(v_remover)
    loop
      select * into v_ingredient from public.menu_item_ingredients
        where menu_item_ingredients.id = v_choice_id::uuid
          and menu_item_ingredients.menu_item_id = v_menu_item.id
          and menu_item_ingredients.tenant_id = v_tenant_id;
      if not found then
        raise exception 'ingrediente não pertence a este produto';
      end if;
    end loop;

    for v_choice_id in select value from jsonb_array_elements_text(v_complementos)
    loop
      select * into v_complement from public.menu_item_complements
        where menu_item_complements.id = v_choice_id::uuid
          and menu_item_complements.menu_item_id = v_menu_item.id
          and menu_item_complements.tenant_id = v_tenant_id;
      if not found then
        raise exception 'complemento não pertence a este produto';
      end if;
      if v_complement.cobra then
        v_extra := v_extra + v_complement.preco;
      end if;
    end loop;

    v_unit := coalesce(v_menu_item.preco_promocional, v_menu_item.preco) + v_extra;
    v_subtotal := v_subtotal + v_unit * v_quantidade;
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
    v_remover := coalesce(v_item -> 'remover_ids', '[]'::jsonb);
    v_complementos := coalesce(v_item -> 'complemento_ids', '[]'::jsonb);
    if jsonb_typeof(v_remover) = 'null' then
      v_remover := '[]'::jsonb;
    end if;
    if jsonb_typeof(v_complementos) = 'null' then
      v_complementos := '[]'::jsonb;
    end if;

    v_extra := 0;
    for v_choice_id in select value from jsonb_array_elements_text(v_complementos)
    loop
      select * into v_complement from public.menu_item_complements
        where menu_item_complements.id = v_choice_id::uuid
          and menu_item_complements.menu_item_id = v_menu_item.id
          and menu_item_complements.tenant_id = v_tenant_id;
      if v_complement.cobra then
        v_extra := v_extra + v_complement.preco;
      end if;
    end loop;

    v_unit := coalesce(v_menu_item.preco_promocional, v_menu_item.preco) + v_extra;
    -- A função devolve uma coluna chamada id. RETURNING id ficaria
    -- ambíguo com essa saída, o mesmo bug corrigido em 0004.
    v_order_item_id := gen_random_uuid();

    insert into public.order_items (
      id, order_id, menu_item_id, nome_snapshot, preco_unitario_snapshot, quantidade, subtotal
    )
    values (
      v_order_item_id, v_order_id, v_menu_item.id, v_menu_item.nome,
      v_unit, v_quantidade, v_unit * v_quantidade
    );

    for v_choice_id in select value from jsonb_array_elements_text(v_remover)
    loop
      select * into v_ingredient from public.menu_item_ingredients
        where menu_item_ingredients.id = v_choice_id::uuid
          and menu_item_ingredients.menu_item_id = v_menu_item.id
          and menu_item_ingredients.tenant_id = v_tenant_id;
      insert into public.order_item_removals (tenant_id, order_item_id, nome_snapshot)
      values (v_tenant_id, v_order_item_id, v_ingredient.nome);
    end loop;

    for v_choice_id in select value from jsonb_array_elements_text(v_complementos)
    loop
      select * into v_complement from public.menu_item_complements
        where menu_item_complements.id = v_choice_id::uuid
          and menu_item_complements.menu_item_id = v_menu_item.id
          and menu_item_complements.tenant_id = v_tenant_id;
      insert into public.order_item_complements (
        tenant_id, order_item_id, nome_snapshot, cobra, preco_unitario_snapshot
      )
      values (
        v_tenant_id,
        v_order_item_id,
        v_complement.nome,
        v_complement.cobra,
        case when v_complement.cobra then v_complement.preco else 0 end
      );
    end loop;
  end loop;

  if p_channel = 'pdv' then
    insert into public.order_status_events (order_id, status_anterior, status_novo, changed_by)
    values (v_order_id, null, 'recebido', p_created_by);
  end if;

  return query select v_order_id, v_pickup_code, v_subtotal;
end;
$$;
