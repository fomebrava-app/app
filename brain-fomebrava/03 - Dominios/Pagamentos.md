---
tags: [fomebrava, pagamentos, dominio]
type: domain
---
# Pagamentos

Gateway online atual: [[Integração InfinitePay|InfinitePay]].

Um pedido online só deve ser considerado pago após validação confiável pelo backend. Nunca confiar exclusivamente no frontend ou no webhook.

Após confirmação:
```text
payment_status = pago
status = recebido
```
