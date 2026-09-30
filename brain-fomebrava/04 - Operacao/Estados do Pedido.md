---
tags: [fomebrava, pedidos, estados]
type: reference
---
# Estados do Pedido

```text
aguardando_pagamento → recebido → fazendo → pronto → entregue
```

Estado complementar: `cancelado`.

- **aguardando_pagamento**: ainda sem confirmação confiável de pagamento.
- **recebido**: pode entrar na cozinha.
- **fazendo**: em produção.
- **pronto**: disponível para retirada.
- **entregue**: operação concluída.
- **cancelado**: encerrado fora do fluxo normal.
