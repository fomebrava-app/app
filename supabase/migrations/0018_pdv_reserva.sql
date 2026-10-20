-- PDV pode registrar reserva quando a campanha aberta habilita essa função.
-- Loja nova não nasce com campanha: o organizador cria a primeira.

alter table public.orders drop constraint if exists orders_payment_method_check;
alter table public.orders add constraint orders_payment_method_check
  check (payment_method in (
    'infinitepay_credito', 'infinitepay_pix', 'dinheiro', 'pix_presencial', 'pix', 'reserva'
  ));

drop trigger if exists tenants_open_default_campaign on public.tenants;
drop function if exists public.tenants_open_default_campaign();

create or replace function public.create_order(
  p_channel text,
  p_items jsonb,
  p_tenant_slug text,
  p_payment_method text default null,
  p_customer_name text default null,
  p_created_by uuid default null,
  p_pdv_link_id uuid default null,
  p_pdv_label_snapshot text default null,
  p_customer_phone text default null,
  p_fulfillment text default 'retirada',
  p_endereco text default null
)
returns table (id uuid, pickup_code text, total numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_campaign public.campaigns%rowtype;
  v_order_id uuid := gen_random_uuid();
  v_pickup_code text;
  v_subtotal numeric(10, 2) := 0;
  v_item jsonb;
  v_menu_item public.menu_items%rowtype;
  v_quantidade int;
  v_attempts int := 0;
  v_status text;
  v_payment_status text;
  v_payment_method text;
  v_fulfillment text;
  v_phone text;
  v_endereco text;
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

  select * into v_campaign
  from public.campaigns
  where campaigns.tenant_id = v_tenant_id and campaigns.status = 'aberta';
  if not found then
    raise exception 'não há campanha aberta';
  end if;

  if p_channel not in ('online', 'pdv') then
    raise exception 'channel inválido: %', p_channel;
  end if;

  if p_fulfillment not in ('retirada', 'entrega') then
    raise exception 'forma de recebimento inválida';
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

  v_phone := nullif(trim(p_customer_phone), '');
  v_endereco := nullif(trim(p_endereco), '');
  v_payment_method := p_payment_method;

  if p_channel = 'pdv' then
    v_fulfillment := 'retirada';
    v_endereco := null;
    v_phone := null;
    if p_payment_method = 'reserva' then
      if not v_campaign.reserva_antes_pagamento then
        raise exception 'reserva não está habilitada nesta campanha';
      end if;
      v_payment_status := 'pendente';
      if v_campaign.usa_cozinha then
        v_status := 'recebido';
      else
        v_status := 'reservado';
      end if;
    elsif p_payment_method in ('dinheiro', 'pix_presencial') then
      v_status := 'recebido';
      v_payment_status := 'pago';
    else
      raise exception 'forma de pagamento inválida';
    end if;
  else
    v_payment_status := 'pendente';
    v_fulfillment := p_fulfillment;
    if v_fulfillment <> 'entrega' then
      v_endereco := null;
    end if;
    if v_fulfillment = 'entrega' and v_endereco is null then
      raise exception 'informe o endereço para a entrega';
    end if;
    if v_campaign.recebimento = 'pix' then
      v_payment_method := 'pix';
    end if;
    if v_campaign.reserva_antes_pagamento then
      if v_phone is null then
        raise exception 'informe o telefone para a reserva';
      end if;
      if v_campaign.usa_cozinha then
        v_status := 'recebido';
      else
        v_status := 'reservado';
      end if;
    else
      v_status := 'aguardando_pagamento';
      if v_fulfillment = 'entrega' then
        raise exception 'entrega só vale na campanha com reserva';
      end if;
      v_endereco := null;
    end if;
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

  loop
    v_pickup_code := lpad(floor(random() * 10000)::text, 4, '0');
    begin
      insert into public.orders (
        id, pickup_code, channel, status, payment_method, payment_status,
        customer_name, subtotal, total, created_by, paid_at,
        pdv_link_id, pdv_label_snapshot, tenant_id, campaign_id, fulfillment
      )
      values (
        v_order_id, v_pickup_code, p_channel, v_status, v_payment_method, v_payment_status,
        p_customer_name, v_subtotal, v_subtotal, p_created_by,
        case when v_payment_status = 'pago' then now() else null end,
        p_pdv_link_id, p_pdv_label_snapshot, v_tenant_id, v_campaign.id, v_fulfillment
      );
      exit;
    exception when unique_violation then
      v_attempts := v_attempts + 1;
      if v_attempts > 30 then
        raise exception 'não foi possível gerar um código de retirada único, tente novamente';
      end if;
    end;
  end loop;

  if v_phone is not null or v_endereco is not null then
    insert into public.order_contacts (order_id, tenant_id, customer_phone, endereco)
    values (v_order_id, v_tenant_id, v_phone, v_endereco);
  end if;

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

  if v_status = 'recebido' then
    insert into public.order_status_events (order_id, status_anterior, status_novo, changed_by)
    values (v_order_id, null, 'recebido', p_created_by);
  end if;

  return query select v_order_id, v_pickup_code, v_subtotal;
end;
$$;

grant execute on function public.create_order(
  text, jsonb, text, text, text, uuid, uuid, text, text, text, text
) to anon, authenticated, service_role;
