-- Solicitações enviadas pelo formulário da página inicial.
-- Sem policy para anon/authenticated: só a service role grava e lê.

create table public.landing_access_requests (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  clube text not null,
  cargo text not null,
  cep text not null,
  email text not null,
  whatsapp text not null,
  created_at timestamptz not null default now()
);

create index landing_access_requests_created_at_idx
  on public.landing_access_requests (created_at desc);

alter table public.landing_access_requests enable row level security;

revoke all on table public.landing_access_requests from anon, authenticated;
grant all on table public.landing_access_requests to service_role;
