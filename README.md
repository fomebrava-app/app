# EDS Relógios — Protótipo de E-commerce

Protótipo navegável de um sistema de e-commerce de relógios, contendo uma área
administrativa completa, uma vitrine pública de produtos e um fluxo visual de
checkout. Todo o conteúdo da interface está em **Português do Brasil (pt-BR)**,
com formatação nacional de moeda, datas e horários.

> ⚠️ Este projeto é um protótipo de front-end. Não há backend, banco de dados,
> autenticação real, cálculos financeiros reais ou integração com gateways de
> pagamento. Todos os dados exibidos são fictícios.

## Visão geral

O projeto foi desenvolvido para validar a experiência de uso (UX), a
organização de telas e a navegação de um e-commerce de relógios, com um visual
minimalista, neutro e monocromático (preto, branco e cinza).

### Ambientes do sistema

1. **Área administrativa** — gestão de produtos, estoque, financeiro e clientes.
2. **Loja virtual pública** — vitrine de produtos com carrinho e checkout simulado.

## Tecnologias utilizadas

- [React 19](https://react.dev/)
- [Vite 7](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- Fonte [Inter](https://fonts.google.com/specimen/Inter) (Google Fonts)
- Ícones outline em SVG desenhados sob medida (sem bibliotecas externas)

## Como executar o projeto

```bash
# instalar dependências
npm install

# ambiente de desenvolvimento
npm run dev

# build de produção
npm run build

# pré-visualizar o build
npm run preview
```

## Estrutura de pastas

```
src/
├── App.tsx                 # Roteador principal (baseado em estado, sem reload)
├── store.tsx                # Contexto global: navegação (rotas) e carrinho de compras
├── data.ts                   # Dados fictícios (produtos, clientes, estoque, financeiro)
├── index.css                  # Estilos globais e importação da fonte Inter
│
├── components/
│   ├── ui.tsx                 # Biblioteca de componentes reutilizáveis
│   └── icons.tsx              # Ícones outline em SVG (preto/cinza)
│
├── admin/                     # Telas da área administrativa
│   ├── AdminLayout.tsx         # Sidebar + cabeçalho administrativo
│   ├── Login.tsx                # Acesso administrativo
│   ├── Overview.tsx              # Dashboard / visão geral
│   ├── Products.tsx               # Lista de produtos
│   ├── ProductForm.tsx             # Cadastro e edição de produtos
│   ├── Inventory.tsx                # Controle de estoque
│   ├── Finance.tsx                   # Controle financeiro
│   ├── Customers.tsx                  # Gestão de clientes
│   ├── PDV.tsx                          # Ponto de venda (registro rápido de venda)
│   └── Settings.tsx                      # Configurações da loja
│
└── public/                    # Telas da loja virtual (público)
    ├── PublicHeader.tsx         # Cabeçalho da loja (busca, carrinho, menu)
    ├── ProductCard.tsx           # Card de produto da vitrine
    ├── Landing.tsx                 # Página inicial / vitrine de produtos
    ├── ProductDetail.tsx            # Página de detalhes do produto
    └── Checkout.tsx                   # Resumo de checkout
```

## Telas do protótipo

### Área administrativa
| Tela | Descrição |
|---|---|
| **Acesso administrativo** | Login com validação de campos obrigatórios, estado de carregamento e mensagem de credenciais inválidas. Login de demonstração: `admin@edsrelogios.com.br` / `123456`. |
| **Visão geral (Dashboard)** | Cards de resumo (produtos, estoque baixo, entradas, saídas, saldo, clientes), atalhos rápidos e listas de atividades recentes. |
| **Produtos** | Listagem com busca, filtros (categoria, estoque, status), badges de status e ações (visualizar, editar, duplicar, excluir) com confirmação. |
| **Cadastro/edição de produto** | Formulário único dividido em seções: informações básicas, precificação, estoque, imagens e visibilidade. |
| **Controle de estoque** | Tabela de níveis de estoque, alerta de estoque baixo, modal de movimentação (entrada/saída/ajuste) e histórico. |
| **Financeiro** | Cards de totais (entradas, saídas, saldo, pendências), tabela de movimentações com filtros e modal de nova movimentação. |
| **Clientes** | Listagem com busca, cadastro/edição em modal e exclusão com confirmação. |
| **PDV** | Registro rápido de venda: localizar produto, selecionar cliente, definir quantidade e desconto, com resumo da venda e valor total calculado visualmente. |
| **Configurações** | Preferências gerais da loja (dados, notificações, idioma). |

### Loja virtual (pública)
| Tela | Descrição |
|---|---|
| **Página inicial** | Cabeçalho público, seção principal (hero) e vitrine de produtos responsiva (grade de 1 a 4 colunas) com busca e filtro por categoria. |
| **Detalhes do produto** | Galeria de imagens, seletor de quantidade, preço promocional e ficha técnica (caixa, pulseira, mecanismo, resistência à água, garantia). |
| **Checkout (resumo)** | Dados do cliente, endereço de entrega e resumo do pedido (produtos, subtotal, frete, total), com botão para seguir ao pagamento simulado. |

## Componentes reutilizáveis

Localizados em `src/components/ui.tsx`:

- `Button` (variantes primária, secundária, discreta e "destrutiva" textual)
- `Card`
- `SummaryCard` (cards de indicadores do dashboard)
- `StatusBadge` (indicadores em tons de cinza: Ativo, Inativo, Pago, Pendente etc.)
- `Field`, `Input`, `Select`, `Textarea`, `SearchField`
- `Modal` e `ConfirmDialog`
- `EmptyState`, `Loading`, `Toast`
- `Toggle`

## Direção visual

- Paleta restrita a **branco, preto e tons de cinza** — sem cores vibrantes, gradientes ou sombras pesadas.
- Tipografia **Inter** em toda a interface, com hierarquia consistente de tamanhos.
- Bordas finas, divisores sutis e espaçamento generoso entre seções.
- Cantos com raio mínimo, sem excesso de arredondamento.
- Ícones outline simples em preto/cinza, sem preenchimento colorido.

## Responsividade

O layout foi construído com abordagem mobile-first e se adapta a três faixas principais:

- **Desktop**: sidebar fixa, tabelas completas, grade de produtos em 4 colunas.
- **Tablet**: sidebar colapsável, grade de produtos em 3 colunas, cards em 2 colunas.
- **Mobile**: menu administrativo em drawer, formulários em coluna única, grade de produtos em 1–2 colunas, tabelas com rolagem horizontal.

## Estados de interação cobertos

- Carregamento (`Carregando...`)
- Conteúdo vazio (`Nenhum produto encontrado.`, `Seu carrinho está vazio.`)
- Sucesso ao salvar (`Produto salvo com sucesso.`, `Cliente cadastrado com sucesso.`)
- Erro de validação (`Preencha os campos obrigatórios.`)
- Confirmação de exclusão (`Tem certeza de que deseja excluir este produto?`)
- Alerta de estoque baixo (`Este produto está com estoque baixo.`)
- Credenciais inválidas no login

## Limitações do protótipo

Conforme escopo definido para esta fase inicial, o projeto **não** inclui:

- Conexão com banco de dados real
- Autenticação real
- Infraestrutura de backend ou APIs externas
- Regras reais de controle de estoque ou cálculos financeiros
- Integração com gateway de pagamento
- Relatórios avançados ou módulos fora do escopo definido

O foco está exclusivamente em **design visual, navegação, estrutura de telas,
responsividade e organização de componentes reutilizáveis**.
