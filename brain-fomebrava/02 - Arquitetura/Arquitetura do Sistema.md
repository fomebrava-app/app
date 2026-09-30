---
tags: [fomebrava, arquitetura]
type: architecture
---
# Arquitetura do Sistema

Stack principal: Next.js, TypeScript, Supabase, PostgreSQL, Supabase Auth, Supabase Realtime, Supabase Storage e InfinitePay.

## Rotas por tenant
```text
/[tenant]/...
/[tenant]/pedido/[codigo]
/[tenant]/pdv/[token]
/[tenant]/admin/...
```

O [[Pedidos|pedido]] é a entidade operacional central.
