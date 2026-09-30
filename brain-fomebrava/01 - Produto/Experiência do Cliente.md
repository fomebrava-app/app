---
tags: [fomebrava, cliente, produto]
type: flow
---
# Experiência do Cliente

```text
cardápio → produto → carrinho → checkout → pagamento → acompanhamento
```

## Regras
- O cliente recebe um `pickup_code`.
- O pedido pode ser acompanhado em tempo real.
- O carrinho só deve ser limpo automaticamente quando a sessão reconhecer o pedido como próprio.
- Consultar manualmente outro pedido não deve apagar o carrinho atual.

Ver [[Cardápio]], [[Pedidos]], [[Pagamentos]] e [[Acompanhamento do Cliente]].
