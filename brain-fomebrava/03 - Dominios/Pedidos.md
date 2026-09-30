---
tags: [fomebrava, pedidos, dominio]
type: domain
---
# Pedidos

O pedido é a entidade central do Fomebrava.

## Responsabilidades
- registrar compra;
- relacionar produtos;
- registrar pagamento;
- gerar código de retirada;
- controlar produção;
- alimentar o financeiro.

Cada pedido possui `pickup_code` e pode ser acessado conceitualmente em `/[tenant]/pedido/[pickup_code]`.

Ver [[Estados do Pedido]].
