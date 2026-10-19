-- Marca a resposta do formulário que já virou loja.
-- Sem este horário, o Painel geral não oferece Cadastrar de novo.

alter table public.landing_access_requests
  add column registered_at timestamptz;
