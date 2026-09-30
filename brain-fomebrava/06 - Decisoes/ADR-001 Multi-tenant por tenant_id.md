---
tags: [fomebrava, adr, multitenant]
type: adr
status: aceito
---
# ADR-001 — Multi-tenant por tenant_id

## Contexto
O projeto evoluiu de uma operação única para múltiplas organizações.

## Decisão
Entidades operacionais devem ser associadas explicitamente a `tenant_id`, com isolamento reforçado por RLS e `current_tenant_id()`.

## Consequências
- suporte a múltiplas organizações;
- disciplina adicional nas queries;
- toda nova entidade exige revisão de RLS.
