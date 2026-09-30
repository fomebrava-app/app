---
tags: [fomebrava, auth, rls, seguranca]
type: architecture
---
# Autenticação e RLS

Supabase Auth é utilizado principalmente na área administrativa.

RLS deve garantir isolamento entre tenants. A função `current_tenant_id()` participa desse modelo.

Objetivos:
- impedir leitura entre tenants;
- impedir escrita entre tenants;
- restringir ações administrativas;
- evitar depender apenas do frontend.
