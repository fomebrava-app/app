"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { Button, Card, EmptyState, Field, Input, Loading, Modal } from "@/components/ui";
import { IconArrowLeft, IconCart, IconLock } from "@/components/icons";
import { useCart } from "@/lib/cart-context";
import { createClient } from "@/lib/supabase/client";
import { formatBRL } from "@/lib/format";

function clearPendingOrderStorage() {
  sessionStorage.removeItem("pendingOrderId");
  sessionStorage.removeItem("pendingOrderPickupCode");
  sessionStorage.removeItem("pendingPaymentUrl");
}

interface PendingOrder {
  pickupCode: string;
  status: string;
  paymentUrl: string | null;
}

interface PaymentModalState {
  orderId: string;
  pickupCode: string;
  paymentUrl: string;
}

export default function CheckoutPage() {
  const { cart, cartTotal } = useCart();
  const [customerName, setCustomerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [paymentModal, setPaymentModal] = useState<PaymentModalState | null>(null);

  const [checkingPending, setCheckingPending] = useState(true);
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null);

  useEffect(() => {
    const pickupCode = sessionStorage.getItem("pendingOrderPickupCode");
    if (!pickupCode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- checagem síncrona ao montar, não reage a mudança de estado
      setCheckingPending(false);
      return;
    }
    const supabase = createClient();
    supabase
      .rpc("get_order_by_code", { p_pickup_code: pickupCode })
      .then(({ data, error }) => {
        const order = !error ? (data as { status: string } | null) : null;
        if (!order) {
          // Não encontrado (ou já cancelado — a RPC já filtra isso): não há
          // mais nada pendente de verdade, limpa o rastro antigo.
          clearPendingOrderStorage();
        } else {
          setPendingOrder({
            pickupCode,
            status: order.status,
            paymentUrl: sessionStorage.getItem("pendingPaymentUrl"),
          });
        }
        setCheckingPending(false);
      });
  }, []);

  function dismissPendingOrder() {
    clearPendingOrderStorage();
    setPendingOrder(null);
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
      setPaymentModal({
        orderId: data.orderId,
        pickupCode: data.pickupCode,
        paymentUrl: data.paymentUrl,
      });
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  function goToPayment() {
    if (!paymentModal) return;
    // O carrinho só é esvaziado quando o pagamento for confirmado (ver
    // app/pedido/[codigo]/AcompanharPedidoClient.tsx) — não aqui, senão
    // o cliente perde os itens escolhidos se abandonar o pagamento.
    sessionStorage.setItem("pendingOrderId", paymentModal.orderId);
    sessionStorage.setItem("pendingOrderPickupCode", paymentModal.pickupCode);
    sessionStorage.setItem("pendingPaymentUrl", paymentModal.paymentUrl);
    window.location.href = paymentModal.paymentUrl;
  }

  if (checkingPending) {
    return (
      <div className="min-h-screen bg-brand-paper text-black">
        <PublicHeader />
        <div className="flex justify-center px-4 py-16">
          <Loading label="Verificando seu pedido..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-paper text-black">
      <PublicHeader />

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {pendingOrder &&
          (pendingOrder.status === "aguardando_pagamento" ? (
            <Card className="mb-6 border-brand-orange/40 bg-brand-orange/10 p-5">
              <h2 className="text-base font-semibold text-black">
                Você tem um pedido aguardando pagamento
              </h2>
              <p className="mt-1 text-sm text-neutral-700">
                Código <span className="font-bold">{pendingOrder.pickupCode}</span>. Se
                já pagou, confira o status do pedido. Se ainda não pagou, pode continuar
                de onde parou.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {pendingOrder.paymentUrl && (
                  <Button
                    variant="primary"
                    onClick={() => {
                      window.location.href = pendingOrder.paymentUrl!;
                    }}
                  >
                    Continuar pagamento
                  </Button>
                )}
                <Link href={`/pedido/${pendingOrder.pickupCode}`}>
                  <Button>Ver detalhes do pedido</Button>
                </Link>
              </div>
              <button
                onClick={dismissPendingOrder}
                className="mt-3 text-xs text-neutral-600 underline hover:text-black"
              >
                Ignorar e começar um pedido novo
              </button>
            </Card>
          ) : (
            <Card className="mb-6 border-green-400/40 bg-green-400/10 p-5">
              <h2 className="text-base font-semibold text-black">
                Seu pedido já foi confirmado!
              </h2>
              <p className="mt-1 text-sm text-neutral-700">
                Código <span className="font-bold">{pendingOrder.pickupCode}</span>.
              </p>
              <div className="mt-4">
                <Link href={`/pedido/${pendingOrder.pickupCode}`}>
                  <Button variant="primary">Ver status do pedido</Button>
                </Link>
              </div>
            </Card>
          ))}

        {cart.length === 0 ? (
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
        ) : (
          <>
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
          </>
        )}
      </div>

      <Modal
        open={!!paymentModal}
        onClose={() => setPaymentModal(null)}
        title="Pedido registrado"
        size="sm"
        footer={
          <Button variant="primary" className="w-full sm:w-auto" onClick={goToPayment}>
            Ir para o pagamento
          </Button>
        }
      >
        {paymentModal && (
          <div className="space-y-3 text-sm text-neutral-700">
            <p>
              Seu código de retirada é{" "}
              <span className="text-lg font-bold text-black">
                {paymentModal.pickupCode}
              </span>
              . Anote para acompanhar o pedido no botão &quot;Acompanhar pedido&quot; após o pagamento.
            </p>
            <p className="rounded border border-brand-orange/40 bg-brand-orange/10 p-3 text-black">
              Depois de concluir o pagamento na InfinitePay, clique no botão para voltar
              à loja — não use o botão <strong>Voltar</strong> do navegador nem feche a
              aba, para não perder a confirmação do seu pedido.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
