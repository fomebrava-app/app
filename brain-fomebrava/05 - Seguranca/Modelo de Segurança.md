---
tags: [fomebrava, seguranca]
type: security
---
# Modelo de Segurança

Princípios:
1. isolamento entre tenants;
2. validação financeira no backend;
3. uso de RLS;
4. exposição pública mínima;
5. não confiar no frontend para decisões críticas.

A implementação atual permite SELECT público em `orders` para alguns fluxos Realtime. `order_items` não possui a mesma exposição direta; dados necessários ao acompanhamento público são obtidos por RPC.
