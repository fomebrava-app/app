"use client";

import { useState } from "react";
import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { Button, Card, EmptyState, Field, Input } from "@/components/ui";
import { IconArrowLeft, IconCart, IconLock } from "@/components/icons";
import { useCart } from "@/lib/cart-context";
import { formatBRL } from "@/lib/format";

export default function CheckoutPage() {
  const { cart, cartTotal } = useCart();
  const [customerName, setCustomerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-brand-yellow/10 text-black">
        <PublicHeader />
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <EmptyState
            icon={<IconCart className="h-10 w-10" />}
            title="Seu carrinho está vazio."
            description="Adicione itens do cardápio para continuar com a compra."
            action={
              <Link href="/">
                <Button variant="primary">Ver cardápio</Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  async function handleContinue() {
    setLoading(true);
    setErro("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "online",
          items: cart.map((i) => ({
            menu_item_id: i.menuItem.id,
            quantidade: i.quantidade,
          })),
          customer_name: customerName || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Não foi possível iniciar o pagamento.");
      }
      // O carrinho só é esvaziado quando o pagamento for confirmado (ver
      // app/pedido/[codigo]/AcompanharPedidoClient.tsx) — não aqui, senão
      // o cliente perde os itens escolhidos se abandonar o pagamento.
      sessionStorage.setItem("pendingOrderId", data.orderId);
      window.location.href = data.paymentUrl;
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-yellow/10 text-black">
      <PublicHeader />

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link
          href="/carrinho"
          className="mb-4 flex w-fit items-center gap-1.5 text-sm text-neutral-500 hover:text-black"
        >
          <IconArrowLeft className="h-4 w-4" /> Voltar ao carrinho
        </Link>
        <h1 className="text-[28px] font-bold tracking-tight text-black">
          Finalizar pedido
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Confirme seu pedido antes de prosseguir para o pagamento.
        </p>

        <div className="mt-6 space-y-5">
          <Card className="p-5">
            <h2 className="mb-4 border-b border-neutral-200 pb-3 text-lg font-semibold text-black">
              Seu nome (opcional)
            </h2>
            <Field label="Nome para chamar na retirada">
              <Input
                placeholder="Como podemos te chamar?"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </Field>
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 border-b border-neutral-200 pb-3 text-lg font-semibold text-black">
              Resumo do pedido
            </h2>
            <ul className="space-y-3">
              {cart.map((item) => {
                const unit = item.menuItem.preco_promocional ?? item.menuItem.preco;
                return (
                  <li key={item.menuItem.id} className="flex justify-between text-sm">
                    <span className="text-neutral-700">
                      {item.quantidade}x {item.menuItem.nome}
                    </span>
                    <span className="font-medium text-black">
                      {formatBRL(unit * item.quantidade)}
                    </span>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 flex items-center justify-between border-t border-neutral-200 pt-4">
              <span className="text-base font-semibold text-black">Total</span>
              <span className="text-2xl font-bold text-black">
                {formatBRL(cartTotal)}
              </span>
            </div>
          </Card>

          {erro && <p className="text-sm text-red-600">{erro}</p>}

          <Button
            variant="primary"
            className="w-full"
            disabled={loading}
            onClick={handleContinue}
          >
            {loading ? (
              "Gerando pagamento..."
            ) : (
              <>
                <IconLock className="h-4 w-4" /> Continuar para o pagamento
              </>
            )}
          </Button>
          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-neutral-500">
            <IconLock className="h-3.5 w-3.5" />
            Você será direcionado para o ambiente seguro da InfinitePay.
          </p>
        </div>
      </div>
    </div>
  );
}
