-- Campanhas separam a movimentação de cada período da loja.
-- Uma campanha aberta por vez. Finalizar congela pedido, despesa,
-- status e confirmação de pagamento daquele período.
-- Cole este arquivo no editor SQL do Fomebrava. Não rode de novo.

-- ============================================================
-- campaigns
-- ============================================================
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  nome text not null,
  status text not null default 'aberta' check (status in ('aberta', 'encerrada')),
  recebimento text not null check (recebimento in ('infinitepay', 'pix')),
  pix_chave text,
  reserva_antes_pagamento boolean not null default false,
  usa_cozinha boolean not null default false,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  constraint campaigns_pix_chave_check check (
    (recebimento = 'pix' and pix_chave is not null and length(trim(pix_chave)) > 0)
    or (recebimento = 'infinitepay' and pix_chave is null)
  ),
  constraint campaigns_cozinha_so_com_reserva_check check (
    usa_cozinha = false or reserva_antes_pagamento = true
  )
);

create unique index campaigns_one_open_per_tenant
  on public.campaigns (tenant_id)
  where status = 'aberta';

create index campaigns_tenant_idx on public.campaigns (tenant_id, opened_at desc);

alter table public.campaigns enable row level security;

-- A campanha aberta é pública (o cardápio e o checkout leem Pix e reserva).
-- As encerradas ficam só para o admin da própria loja.
create policy "campaigns_select" on public.campaigns
  for select using (
    status = 'aberta'
    or tenant_id = public.current_tenant_id()
  );

-- Loja nova já nasce com uma campanha no modo de hoje: InfinitePay, sem reserva.
create function public.tenants_open_default_campaign()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.campaigns (
    tenant_id, nome, status, recebimento, reserva_antes_pagamento, usa_cozinha
  )
  values (new.id, 'Campanha atual', 'aberta', 'infinitepay', false, false);
  return new;
end;
$$;

create trigger tenants_open_default_campaign
  after insert on public.tenants
  for each row execute function public.tenants_open_default_campaign();

insert into public.campaigns (
  tenant_id, nome, status, recebimento, reserva_antes_pagamento, usa_cozinha
)
select t.id, 'Campanha atual', 'aberta', 'infinitepay', false, false
from public.tenants t
where not exists (
  select 1 from public.campaigns c where c.tenant_id = t.id
);

-- ============================================================
-- orders / expenses passam a pertencer a uma campanha
-- ============================================================
alter table public.orders
  add column campaign_id uuid references public.campaigns (id),
  add column fulfillment text not null default 'retirada'
    check (fulfillment in ('retirada', 'entrega'));

update public.orders o
set campaign_id = c.id
from public.campaigns c
where c.tenant_id = o.tenant_id
  and c.status = 'aberta'
  and o.campaign_id is null;

alter table public.orders alter column campaign_id set not null;
create index orders_campaign_idx on public.orders (campaign_id);

alter table public.expenses
  add column campaign_id uuid references public.campaigns (id);

update public.expenses e
set campaign_id = c.id
from public.campaigns c
where c.tenant_id = e.tenant_id
  and c.status = 'aberta'
  and e.campaign_id is null;

alter table public.expenses alter column campaign_id set not null;
create index expenses_campaign_idx on public.expenses (campaign_id);

do $$
declare
  r record;
begin
  for r in
    select conname
    from pg_constraint
    where conrelid = 'public.orders'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%aguardando_pagamento%'
  loop
    execute format('alter table public.orders drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.orders add constraint orders_status_check
  check (status in (
    'aguardando_pagamento', 'reservado', 'recebido', 'fazendo', 'pronto', 'entregue', 'cancelado'
  ));

do $$
declare
  r record;
begin
  for r in
    select conname
    from pg_constraint
    where conrelid = 'public.orders'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%pix_presencial%'
  loop
    execute format('alter table public.orders drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.orders add constraint orders_payment_method_check
  check (payment_method in (
    'infinitepay_credito', 'infinitepay_pix', 'dinheiro', 'pix_presencial', 'pix'
  ));

-- Telefone e endereço não ficam em orders: essa tabela é leitura pública.
create table public.order_contacts (
  order_id uuid primary key references public.orders (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id),
  customer_phone text,
  endereco text
);

alter table public.order_contacts enable row level security;

create policy "order_contacts_select_admin" on public.order_contacts
  for select using (
    tenant_id = public.current_tenant_id()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

grant select on public.campaigns to anon, authenticated, service_role;
grant select on public.order_contacts to authenticated, service_role;

-- ============================================================
-- Campanha encerrada não aceita movimentação
-- ============================================================
create function public.reject_closed_campaign_order_change()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_status text;
begin
  if old.campaign_id is null then
    return new;
  end if;

  select status into v_status from public.campaigns where id = old.campaign_id;
  if v_status = 'encerrada' then
    raise exception 'a campanha está encerrada';
  end if;

  if new.campaign_id is distinct from old.campaign_id then
    raise exception 'não é possível mover o pedido de campanha';
  end if;

  return new;
end;
$$;

create trigger orders_freeze_closed_campaign
  before update on public.orders
  for each row execute function public.reject_closed_campaign_order_change();

create function public.expenses_bind_open_campaign()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_campaign public.campaigns%rowtype;
  v_status text;
begin
  if tg_op = 'INSERT' then
    if new.campaign_id is null then
      select * into v_campaign
      from public.campaigns
      where tenant_id = new.tenant_id and status = 'aberta';
      if not found then
        raise exception 'não há campanha aberta para lançar despesa';
      end if;
      new.campaign_id := v_campaign.id;
      return new;
    end if;

    select * into v_campaign from public.campaigns where id = new.campaign_id;
    if not found or v_campaign.tenant_id <> new.tenant_id then
      raise exception 'despesa não pertence à campanha desta loja';
    end if;
    if v_campaign.status <> 'aberta' then
      raise exception 'a campanha está encerrada';
    end if;
    return new;
  end if;

  select campaigns.status into v_status
  from public.campaigns
  where campaigns.id = old.campaign_id;
  if v_status = 'encerrada' then
    raise exception 'a campanha está encerrada';
  end if;
  if tg_op = 'UPDATE' and new.campaign_id is distinct from old.campaign_id then
    raise exception 'não é possível mover a despesa de campanha';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger expenses_bind_open_campaign
  before insert or update or delete on public.expenses
  for each row execute function public.expenses_bind_open_campaign();

-- ============================================================
-- Abrir e finalizar campanha
-- ============================================================
create function public.create_campaign(
  p_tenant_slug text,
  p_nome text,
  p_recebimento text,
  p_pix_chave text,
  p_reserva boolean,
  p_usa_cozinha boolean
)
returns setof public.campaigns
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_nome text;
  v_chave text;
  v_cozinha boolean;
begin
  select id into v_tenant_id from public.tenants where slug = p_tenant_slug;
  if not found then
    raise exception 'tenant não encontrado: %', p_tenant_slug;
  end if;

  if not exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and tenant_id = v_tenant_id
  ) then
    raise exception 'apenas o administrador desta loja pode abrir uma campanha';
  end if;

  if exists (
    select 1 from public.campaigns
    where tenant_id = v_tenant_id and status = 'aberta'
  ) then
    raise exception 'já existe uma campanha aberta';
  end if;

  if p_recebimento not in ('infinitepay', 'pix') then
    raise exception 'forma de recebimento inválida';
  end if;

  v_nome := nullif(trim(p_nome), '');
  if v_nome is null then
    raise exception 'informe o nome da campanha';
  end if;

  v_chave := nullif(trim(p_pix_chave), '');
  if p_recebimento = 'pix' and v_chave is null then
    raise exception 'informe a chave Pix';
  end if;
  if p_recebimento = 'infinitepay' then
    v_chave := null;
  end if;

  v_cozinha := coalesce(p_reserva, false) and coalesce(p_usa_cozinha, false);

  return query
  insert into public.campaigns (
    tenant_id, nome, status, recebimento, pix_chave, reserva_antes_pagamento, usa_cozinha
  )
  values (
    v_tenant_id,
    v_nome,
    'aberta',
    p_recebimento,
    v_chave,
    coalesce(p_reserva, false),
    v_cozinha
  )
  returning *;
end;
$$;

create function public.close_campaign(p_campaign_id uuid)
returns setof public.campaigns
language plpgsql
security definer
set search_path = public
as $$
declare
  v_campaign public.campaigns%rowtype;
begin
  select * into v_campaign from public.campaigns where id = p_campaign_id for update;
  if not found then
    raise exception 'campanha não encontrada';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and tenant_id = v_campaign.tenant_id
  ) then
    raise exception 'apenas o administrador desta loja pode finalizar a campanha';
  end if;

  if v_campaign.status = 'encerrada' then
    return query select * from public.campaigns where id = p_campaign_id;
    return;
  end if;

  update public.campaigns
  set status = 'encerrada', closed_at = now()
  where id = p_campaign_id;

  return query select * from public.campaigns where id = p_campaign_id;
end;
$$;

revoke all on function public.create_campaign(text, text, text, text, boolean, boolean) from public;
revoke all on function public.close_campaign(uuid) from public;
grant execute on function public.create_campaign(text, text, text, text, boolean, boolean) to authenticated;
grant execute on function public.close_campaign(uuid) to authenticated;

-- ============================================================
-- create_order — grava na campanha aberta
-- O id da linha continua gerado antes do insert (0014).
-- ============================================================
drop function if exists public.create_order(text, jsonb, text, text, text, uuid, uuid, text);

create function public.create_order(
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
    v_status := 'recebido';
    v_payment_status := 'pago';
    v_fulfillment := 'retirada';
    v_endereco := null;
    v_phone := null;
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
        case when p_channel = 'pdv' then now() else null end,
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

-- ============================================================
-- Confirmação manual: reserva sem cozinha entra como recebido
-- ============================================================
create or replace function public.confirm_manual_payment(
  p_order_id uuid,
  p_nota text
)
returns setof public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_admin_id uuid := auth.uid();
  v_novo_status text;
begin
  if not exists (
    select 1 from public.profiles
    where id = v_admin_id and role = 'admin' and tenant_id = public.current_tenant_id()
  ) then
    raise exception 'apenas administradores podem confirmar pagamentos manualmente';
  end if;

  if nullif(trim(p_nota), '') is null then
    raise exception 'informe como o pagamento foi confirmado';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'pedido não encontrado: %', p_order_id;
  end if;

  if v_order.tenant_id is distinct from public.current_tenant_id() then
    raise exception 'pedido não pertence a esta loja';
  end if;

  if v_order.payment_status = 'pago' then
    return query select * from public.orders where id = p_order_id;
    return;
  end if;

  v_novo_status := case
    when v_order.status in ('aguardando_pagamento', 'reservado') then 'recebido'
    else v_order.status
  end;

  update public.orders
  set payment_status = 'pago', paid_at = now(), status = v_novo_status
  where id = p_order_id;

  insert into public.order_status_events (order_id, status_anterior, status_novo, changed_by, nota)
  values (p_order_id, v_order.status, v_novo_status, v_admin_id, trim(p_nota));

  return query select * from public.orders where id = p_order_id;
end;
$$;

-- ============================================================
-- Cozinha: só a campanha aberta. Reserva sem cozinha fica de fora.
-- ============================================================
create or replace function public.list_kitchen_orders(p_tenant_slug text)
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
    'fulfillment', o.fulfillment,
    'created_at', o.created_at,
    'items', (
      select jsonb_agg(jsonb_build_object(
        'nome', oi.nome_snapshot,
        'quantidade', oi.quantidade,
        'retirados', coalesce((
          select jsonb_agg(r.nome_snapshot order by r.nome_snapshot)
          from public.order_item_removals r
          where r.order_item_id = oi.id
        ), '[]'::jsonb),
        'complementos', coalesce((
          select jsonb_agg(c.nome_snapshot order by c.nome_snapshot)
          from public.order_item_complements c
          where c.order_item_id = oi.id
        ), '[]'::jsonb)
      ) order by oi.id)
      from public.order_items oi where oi.order_id = o.id
    )
  ) order by o.created_at asc), '[]'::jsonb)
  from public.orders o
  join public.tenants t on t.id = o.tenant_id
  join public.campaigns c on c.id = o.campaign_id and c.status = 'aberta'
  where o.status in ('recebido', 'fazendo', 'pronto')
    and t.slug = p_tenant_slug;
$$;

create or replace function public.get_order_by_code(p_pickup_code text, p_tenant_slug text)
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
    'fulfillment', o.fulfillment,
    'total', o.total,
    'created_at', o.created_at,
    'paid_at', o.paid_at,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'nome', oi.nome_snapshot,
        'quantidade', oi.quantidade,
        'preco_unitario', oi.preco_unitario_snapshot,
        'subtotal', oi.subtotal,
        'retirados', coalesce((
          select jsonb_agg(r.nome_snapshot order by r.nome_snapshot)
          from public.order_item_removals r
          where r.order_item_id = oi.id
        ), '[]'::jsonb),
        'complementos', coalesce((
          select jsonb_agg(c.nome_snapshot order by c.nome_snapshot)
          from public.order_item_complements c
          where c.order_item_id = oi.id
        ), '[]'::jsonb)
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

-- ============================================================
-- Extrato da campanha. Entrada continua só de pedido pago.
-- ============================================================
create or replace view public.finance_ledger as
  select
    'Entrada'::text as tipo,
    ('Pedido ' || o.pickup_code || ' (' || o.channel || ')')::text as descricao,
    coalesce(o.payment_method, 'infinitepay_credito')::text as categoria,
    o.total as valor,
    coalesce(o.paid_at, o.created_at)::date as data,
    o.id as referencia_id,
    o.tenant_id as tenant_id,
    o.campaign_id as campaign_id
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
    e.tenant_id as tenant_id,
    e.campaign_id as campaign_id
  from public.expenses e;

alter view public.finance_ledger set (security_invoker = true);
