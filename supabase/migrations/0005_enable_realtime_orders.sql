-- Habilita o Supabase Realtime (postgres_changes) para a tabela orders.
-- Sem isso, as assinaturas em /cozinha, /cozinha/exibicao e
-- /pedido/[codigo] nunca recebem eventos de mudança — a tela só mostra
-- o status certo ao carregar/recarregar a página, nunca ao vivo.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;
