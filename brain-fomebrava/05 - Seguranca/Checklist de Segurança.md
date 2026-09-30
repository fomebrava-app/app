---
tags: [fomebrava, seguranca, checklist]
type: checklist
---
# Checklist de Segurança

- [ ] A entidade possui `tenant_id` quando necessário?
- [ ] As políticas RLS foram revisadas?
- [ ] Existe risco de leitura entre tenants?
- [ ] Existe risco de escrita entre tenants?
- [ ] Algum segredo foi exposto no frontend?
- [ ] Pagamentos são validados no backend?
- [ ] O frontend está sendo usado apenas como interface, não como autoridade?
- [ ] Dados públicos expõem informações pessoais?
- [ ] RPCs públicas retornam apenas o necessário?
