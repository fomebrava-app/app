---
tags: [fomebrava, adr, pdv]
type: adr
status: aceito
---
# ADR-003 — PDV por link e senha

## Contexto
Eventos podem ter operadores temporários de caixa.

## Decisão
O PDV utiliza links `/[tenant]/pdv/[token]` com proteção por senha, evitando criar uma conta completa para cada operador.

## Consequências
- entrada rápida de operadores;
- menor administração de contas;
- token e senha tornam-se credenciais operacionais.
