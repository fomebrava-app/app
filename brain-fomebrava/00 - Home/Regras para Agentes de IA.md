---
tags: [fomebrava, ai, desenvolvimento]
type: guidelines
---
# Regras para Agentes de IA

Antes de alterar código:
1. entender o fluxo afetado;
2. identificar entidades envolvidas;
3. identificar `tenant_id`;
4. revisar RLS aplicável;
5. verificar impacto em pedidos;
6. verificar impacto em pagamentos;
7. verificar impacto em Realtime;
8. verificar impacto financeiro;
9. preservar compatibilidade com os fluxos existentes.

## Perguntas obrigatórias
- A qual tenant esse dado pertence?
- Quem pode ler, criar, alterar e apagar?
- Essa ação altera o estado de algum pedido?
- Precisa aparecer em Realtime?
- Tem impacto financeiro?
- Precisa de auditoria?
- Será usada em ambiente de alta pressão?

## Prioridades
```text
1. integridade financeira
2. isolamento entre tenants
3. integridade dos pedidos
4. operação da cozinha
5. experiência do cliente
6. experiência administrativa
7. conveniência de desenvolvimento
```
