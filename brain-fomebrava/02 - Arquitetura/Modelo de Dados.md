---
tags: [fomebrava, banco, arquitetura]
type: reference
---
# Modelo de Dados

Entidades identificadas:
```text
tenants
profiles
menu_categories
menu_items
orders
order_items
expenses
pdv_links
pricing_scenarios
event_settings
```

[[Pedidos|orders]] funciona como eixo operacional. Entidades pertencentes a uma organização devem possuir `tenant_id` quando aplicável.
