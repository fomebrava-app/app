---
tags: [fomebrava, adr, pagamentos]
type: adr
status: aceito
---
# ADR-002 — Webhook não confirma pagamento sozinho

## Contexto
Webhooks podem ser repetidos, falsificados ou processados fora de ordem.

## Decisão
Uma notificação deve disparar nova validação junto à InfinitePay por `payment_check`.

## Consequência
O pedido só muda para pago/recebido após validação confiável pelo backend.
