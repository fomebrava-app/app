---
tags: [fomebrava, riscos, seguranca]
type: risk-register
---
# Riscos Conhecidos

## SELECT público em orders
Facilita Realtime, mas merece revisão para uma operação SaaS maior.

## Segredos em pacotes
Arquivos `.env` não devem ser distribuídos. Credenciais potencialmente expostas devem ser rotacionadas.

## Artefatos de desenvolvimento
Evitar distribuir `.git`, `.next` e `node_modules`.

## Validação incompleta
A versão analisada não teve lint/build completamente validado no ambiente da análise.

## InfinitePay
Endpoints e formatos de resposta devem continuar sendo tratados defensivamente.
