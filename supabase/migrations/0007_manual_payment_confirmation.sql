-- Auditoria de confirmações manuais de pagamento (ver confirm_manual_payment abaixo).
alter table public.order_status_events add column nota text;

-- ============================================================
-- RPC: confirm_manual_payment — liquidação manual de pagamento pelo admin
-- Cobre o caso em que a InfinitePay cobrou o cliente mas o retorno/webhook
-- nunca confirmou no sistema (instabilidade), deixando o pedido preso em
-- payment_status='pendente' + status='aguardando_pagamento' mesmo com o
-- dinheiro já tendo saído da conta do cliente.
-- ============================================================
create function public.confirm_manual_payment(
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
  if not exists (select 1 from public.profiles where id = v_admin_id and role = 'admin') then
    raise exception 'apenas administradores podem confirmar pagamentos manualmente';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'pedido não encontrado: %', p_order_id;
  end if;

  if v_order.payment_status = 'pago' then
    return query select * from public.orders where id = p_order_id;
    return; -- idempotente: já estava pago, não faz nada
  end if;

  v_novo_status := case when v_order.status = 'aguardando_pagamento' then 'recebido' else v_order.status end;

  update public.orders
  set payment_status = 'pago', paid_at = now(), status = v_novo_status
  where id = p_order_id;

  insert into public.order_status_events (order_id, status_anterior, status_novo, changed_by, nota)
  values (p_order_id, v_order.status, v_novo_status, v_admin_id, p_nota);

  return query select * from public.orders where id = p_order_id;
end;
$$;

grant execute on function public.confirm_manual_payment(uuid, text) to authenticated;
