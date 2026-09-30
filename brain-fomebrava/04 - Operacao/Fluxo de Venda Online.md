---
tags: [fomebrava, fluxo, venda-online]
type: flow
---
# Fluxo de Venda Online

```text
Cliente abre cardápio
↓
Seleciona produtos
↓
Carrinho
↓
Checkout
↓
create_order()
↓
status = aguardando_pagamento
↓
InfinitePay
↓
payment_check
↓
payment_status = pago
↓
status = recebido
↓
pedido aparece na cozinha
```
