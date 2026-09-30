---
tags: [fomebrava, arquitetura, multitenant]
type: architecture
---
# Multi-tenant

A unidade de isolamento é o `tenant`. Entidades operacionais usam `tenant_id`.

```text
usuário do tenant A ≠ acesso aos dados do tenant B
```

Existe a função de banco:
```sql
current_tenant_id()
```

Ela é utilizada por políticas RLS para identificar o tenant do usuário autenticado.

Entidades observadas: `profiles`, `menu_items`, `menu_categories`, `orders`, `expenses`, `pdv_links`, `pricing_scenarios`, `event_settings`.
