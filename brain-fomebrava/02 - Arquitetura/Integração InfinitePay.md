---
tags: [fomebrava, infinitepay, pagamentos]
type: integration
---
# Integração InfinitePay

O checkout online utiliza InfinitePay.

## Regra crítica
Webhook não é confirmação definitiva de pagamento.

O backend consulta:
```text
https://api.checkout.infinitepay.io/payment_check
```

Após validação:
```text
payment_status = pago
status = recebido
```

Ver [[ADR-002 Webhook não confirma pagamento sozinho]].
