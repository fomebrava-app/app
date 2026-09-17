# Cardápio Virtual de Evento

Cardápio virtual para organizadores de eventos que vendem produtos
alimentícios: loja pública acessada via QR Code, carrinho, pagamento via
[InfinitePay](https://www.infinitepay.io/), pipeline de cozinha (Recebido →
Fazendo → Pronto → Entregue) atualizado em tempo real, tela pública de
acompanhamento do pedido com senha, PDV para venda presencial e painel
administrativo com autenticação real.

## Tecnologias

- [Next.js](https://nextjs.org/) (App Router) + TypeScript
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Supabase](https://supabase.com/): Postgres, Auth, Realtime e Storage
- [InfinitePay Checkout](https://www.infinitepay.io/checkout-documentacao) para pagamento online

## Configuração inicial

1. **Instalar dependências**

   ```bash
   npm install
   ```

2. **Criar o projeto Supabase** (se ainda não existir) e aplicar o schema em
   `supabase/migrations/`, **na ordem numérica dos arquivos** (`0001` até o
   mais recente) — copie o conteúdo de cada um no SQL Editor do Supabase
   Studio, ou use `supabase db push` se estiver usando a CLI localmente. O
   arquivo `0005_enable_realtime_orders.sql` é o que liga a atualização ao
   vivo (Realtime) da cozinha e do acompanhamento do pedido — sem ele, essas
   telas só mostram o status certo ao recarregar a página.

3. **Variáveis de ambiente** — copie `.env.example` para `.env.local` e
   preencha:
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` /
     `SUPABASE_SERVICE_ROLE_KEY` — em Configurações → API do projeto Supabase.
   - `INFINITEPAY_HANDLE` — sua InfiniteTag (sem o `$`).
   - `NEXT_PUBLIC_SITE_URL` — URL pública do site (usada para montar o
     `redirect_url`/`webhook_url` da InfinitePay; em produção, aponte para o
     domínio real).

4. **Criar sua conta de admin**: em `/admin/login`, clique em "Não tem
   conta? Cadastre-se" e preencha nome, e-mail, telefone e uma senha forte —
   a conta já nasce com acesso de admin e fica ativa na hora (sem precisar
   de confirmação por e-mail nem de acesso ao Supabase Studio).

5. **Cadastrar itens do cardápio** em `/admin/itens` (após logar em
   `/admin/login`).

6. **Rodar em desenvolvimento**

   ```bash
   npm run dev
   ```

## Fluxo do cliente (celular)

Cardápio (`/`) → item (`/item/[id]`) → carrinho (`/carrinho`) → checkout
(`/checkout`, gera link InfinitePay) → pagamento na InfinitePay → retorno
(`/pagamento/retorno`, confirma o pagamento e redireciona) → acompanhamento
público do pedido (`/pedido/[codigo]`, atualizado em tempo real conforme a
cozinha avança o pedido).

## Fluxo da cozinha

`/cozinha` é uma rota **pública** (tela fixa de balcão/cozinha, sem login),
em formato pipeline: Recebido → Fazendo → Pronto. O card em "Pronto" tem um
botão **Entregue** que remove o pedido da tela. Toda mudança de status
propaga em tempo real (Supabase Realtime) para a própria cozinha e para a
tela de acompanhamento do cliente daquele pedido.

## Fluxo do PDV (venda presencial)

PDV **não usa conta/login do Supabase Auth**. Em `/admin/pdv` (autenticado,
admin), o organizador gera um link para cada caixa/pessoa informando um
rótulo (ex: "Caixa 1") e uma senha de acesso; o sistema cria um link público
(`/pdv/[token]`) e mostra um botão para enviar link + senha por WhatsApp.
Quem abrir esse link precisa digitar a senha antes de ver a tela de venda —
sem precisar de cadastro. Ali, monta-se o pedido, seleciona-se a forma de
pagamento (dinheiro ou Pix, já recebido fisicamente) e registra-se a venda —
o pedido entra direto na cozinha e no financeiro (identificado pelo rótulo
do PDV), e a tela final mostra a senha do pedido com um botão para enviar o
link de acompanhamento por WhatsApp ao cliente. O admin pode revogar um link
a qualquer momento em `/admin/pdv` sem apagar o histórico de vendas já
feitas por ele.

## Estrutura de pastas

```
app/
├── page.tsx                     # Cardápio público
├── item/[id]/page.tsx             # Detalhe do item
├── carrinho/page.tsx               # Carrinho
├── checkout/page.tsx                # Checkout + geração do link InfinitePay
├── pagamento/retorno/page.tsx        # Retorno da InfinitePay
├── pedido/page.tsx                    # Busca de pedido por senha
├── pedido/[codigo]/page.tsx            # Acompanhamento público (Realtime)
├── cozinha/page.tsx                     # KDS público (Realtime)
├── pdv/[token]/page.tsx                   # Venda pública protegida por senha
├── api/orders/route.ts                     # Criação de pedido (online e PDV)
├── api/payments/infinitepay/webhook/         # Webhook de pagamento
├── api/auth/signup/route.ts                    # Autocadastro do admin
├── api/admin/pdv-links/route.ts                  # Geração de link de PDV (admin)
├── api/pdv/[token]/auth/route.ts                   # Checagem de senha do PDV
└── admin/                                            # Painel autenticado (login,
                                                        # itens, pedidos, financeiro,
                                                        # PDVs, configurações)

components/
├── ui.tsx, icons.tsx              # Biblioteca de componentes/ícones
├── public/                         # Componentes da loja pública
├── admin/                           # Componentes do painel admin
└── pdv/PdvSaleForm.tsx               # Tela de venda usada em /pdv/[token]

lib/
├── supabase/                    # Clients (browser, server, admin/service-role)
├── infinitepay.ts                 # Integração com a API de checkout
├── whatsapp.ts                      # Link wa.me
├── password.ts                        # Regra de senha forte (client + servidor)
├── pdv-auth.ts                          # Hash/verificação de senha e token do PDV
├── cart-context.tsx                       # Carrinho (client-side)
├── queries.ts                               # Leituras server-side
└── types.ts                                   # Tipos de domínio

supabase/migrations/               # Schema SQL (tabelas, RLS, RPCs)
```

## Pontos de atenção

- **`/admin/login` permite autocadastro de admin sem convite.** Qualquer
  pessoa que encontrar essa URL pode criar uma conta com acesso total ao
  painel (cardápio, pedidos, financeiro, geração de PDVs). Foi uma decisão
  consciente para um sistema de curta duração (evento único) — se o painel
  ficar no ar por mais tempo ou o link circular publicamente, vale revisar
  esse endpoint (`app/api/auth/signup/route.ts`) antes.
- A senha de um link de PDV fica só com quem o admin compartilhar (o
  sistema nunca mostra a senha de novo depois de gerada — se perder, gere
  um novo link e revogue o antigo em `/admin/pdv`).
- O webhook da InfinitePay não é assinado (sem HMAC) — todo pagamento
  recebido pelo webhook é revalidado via `payment_check` antes de ser
  considerado confirmado (`lib/infinitepay.ts`).
- Para testar o webhook localmente, exponha `npm run dev` publicamente (ex:
  ngrok/Cloudflare Tunnel) e aponte `NEXT_PUBLIC_SITE_URL` para essa URL.
- O formato de resposta do endpoint `/links` da InfinitePay não é 100%
  documentado publicamente — valide com uma transação real de valor
  simbólico antes de ir para produção.
