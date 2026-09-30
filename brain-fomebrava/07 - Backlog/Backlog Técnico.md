---
tags: [fomebrava, backlog, tecnico]
type: backlog
---
# Backlog Técnico

## Segurança
- [ ] Reavaliar SELECT público em `orders`.
- [ ] Revisar exposição pública de RPCs.
- [ ] Rotacionar credenciais caso o `.env` distribuído contenha chaves válidas.

## Qualidade
- [ ] Validar lint completo.
- [ ] Validar build completo.
- [ ] Criar testes dos fluxos críticos de pedido.
- [ ] Criar testes de isolamento entre tenants.
- [ ] Criar testes do fluxo de pagamento.

## Empacotamento
- [ ] Remover `.git` de pacotes distribuídos.
- [ ] Remover `.next`.
- [ ] Remover `node_modules`.
