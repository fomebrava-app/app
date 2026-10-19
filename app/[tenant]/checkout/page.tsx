"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PublicHeader } from "@/components/public/PublicHeader";
import { Button, Card, EmptyState, Field, Input, Loading, Modal } from "@/components/ui";
import { IconArrowLeft, IconCart, IconLock } from "@/components/icons";
import { MontagemTexto } from "@/components/orders/MontagemTexto";
import { cartUnitPrice } from "@/lib/customization";
import { useCart } from "@/lib/cart-context";
import { createClient } from "@/lib/supabase/client";
import { formatBRL } from "@/lib/format";
import { buildBuyerSaveMessage, buildWhatsAppLink } from "@/lib/whatsapp";
import {
  formatCep,
  formatDeliveryAddress,
  lookupCep,
  onlyCepDigits,
  type ViaCepAddress,
} from "@/lib/viacep";
import type { CampaignRecebimento, OrderFulfillment } from "@/lib/types";

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

interface OpenCampaign {
  recebimento: CampaignRecebimento;
  pix_chave: string | null;
  reserva_antes_pagamento: boolean;
}

interface PaymentModalState {
  orderId: string;
  pickupCode: string;
  paymentUrl: string;
  total: number;
}

interface ChargeModalState {
  pickupCode: string;
  total: number;
  mode: "pix" | "reserva";
  recebimento: CampaignRecebimento;
  pixChave: string | null;
  resumo: string[];
}

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart();
  const { tenant } = useParams<{ tenant: string }>();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [fulfillment, setFulfillment] = useState<OrderFulfillment>("retirada");
  const [cep, setCep] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [cepErro, setCepErro] = useState("");
  const [enderecoEncontrado, setEnderecoEncontrado] = useState<ViaCepAddress | null>(null);
  const [logradouro, setLogradouro] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const cepRequest = useRef("");
  const [campaign, setCampaign] = useState<OpenCampaign | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [paymentModal, setPaymentModal] = useState<PaymentModalState | null>(null);
  const [chargeModal, setChargeModal] = useState<ChargeModalState | null>(null);

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
      .rpc("get_order_by_code", { p_pickup_code: pickupCode, p_tenant_slug: tenant })
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
  }, [tenant]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("tenants")
      .select("id")
      .eq("slug", tenant)
      .maybeSingle()
      .then(async ({ data: store, error }) => {
        if (error || !store) {
          setCampaign(null);
          return;
        }
        const { data, error: campaignError } = await supabase
          .from("campaigns")
          .select("recebimento, pix_chave, reserva_antes_pagamento")
          .eq("tenant_id", store.id)
          .eq("status", "aberta")
          .maybeSingle();
        if (campaignError) {
          setErro("Não foi possível ler a campanha aberta.");
          setCampaign(null);
          return;
        }
        setCampaign(data);
      });
  }, [tenant]);

  function dismissPendingOrder() {
    clearPendingOrderStorage();
    setPendingOrder(null);
  }

  async function buscarCep(digits: string) {
    cepRequest.current = digits;
    setCepLoading(true);
    setCepErro("");
    try {
      const found = await lookupCep(digits);
      if (cepRequest.current !== digits) return;
      setEnderecoEncontrado(found);
      setLogradouro(found.logradouro);
    } catch (err) {
      if (cepRequest.current !== digits) return;
      setEnderecoEncontrado(null);
      setLogradouro("");
      setCepErro(err instanceof Error ? err.message : "Não foi possível consultar o CEP.");
    } finally {
      if (cepRequest.current === digits) setCepLoading(false);
    }
  }

  async function handleContinue() {
    if (campaign?.reserva_antes_pagamento && !customerPhone.trim()) {
      setErro("Informe o telefone para a reserva.");
      return;
    }
    if (campaign?.reserva_antes_pagamento && fulfillment === "entrega") {
      if (!enderecoEncontrado) {
        setErro("Informe um CEP válido para a entrega.");
        return;
      }
      if (!logradouro.trim() || !numero.trim()) {
        setErro("Informe a rua e o número da entrega.");
        return;
      }
    }
    setLoading(true);
    setErro("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "online",
          tenant,
          items: cart.map((i) => ({
            menu_item_id: i.menuItem.id,
            quantidade: i.quantidade,
            remover_ids: i.customization.removals.map((removal) => removal.id),
            complemento_ids: i.customization.complements.map((complement) => complement.id),
          })),
          customer_name: customerName || undefined,
          customer_phone: customerPhone || undefined,
          fulfillment: campaign?.reserva_antes_pagamento ? fulfillment : "retirada",
          endereco:
            campaign?.reserva_antes_pagamento && fulfillment === "entrega" && enderecoEncontrado
              ? formatDeliveryAddress({
                  logradouro,
                  numero,
                  complemento,
                  bairro: enderecoEncontrado.bairro,
                  localidade: enderecoEncontrado.localidade,
                  uf: enderecoEncontrado.uf,
                  cep: enderecoEncontrado.cep,
                })
              : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Não foi possível registrar o pedido.");
      }
      if (data.mode === "infinitepay") {
        setPaymentModal({
          orderId: data.orderId,
          pickupCode: data.pickupCode,
          paymentUrl: data.paymentUrl,
          total: Number(data.total),
        });
        return;
      }
      const resumo = cart.map((item) => {
        const unit = cartUnitPrice(item);
        const montagem = [
          item.customization.removals.length > 0
            ? `sem ${item.customization.removals.map((removal) => removal.nome).join(", ")}`
            : null,
          item.customization.complements.length > 0
            ? item.customization.complements.map((complement) => `+ ${complement.nome}`).join(", ")
            : null,
        ]
          .filter(Boolean)
          .join(" · ");
        const linha = `${item.quantidade}x ${item.menuItem.nome} — ${formatBRL(unit * item.quantidade)}`;
        return montagem ? `${linha} (${montagem})` : linha;
      });
      clearCart();
      sessionStorage.setItem("pendingOrderId", data.orderId);
      sessionStorage.setItem("pendingOrderPickupCode", data.pickupCode);
      sessionStorage.removeItem("pendingPaymentUrl");
      setChargeModal({
        pickupCode: data.pickupCode,
        total: Number(data.total),
        mode: data.mode,
        recebimento: data.recebimento,
        pixChave: data.pixChave ?? null,
        resumo,
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

  const reserva = campaign?.reserva_antes_pagamento === true;
  const pix = campaign?.recebimento === "pix";
  const campanhaFechada = campaign === null;

  function chargeLink() {
    if (!chargeModal) return "#";
    const trackingUrl = `${window.location.origin}/${tenant}/pedido/${chargeModal.pickupCode}`;
    return buildWhatsAppLink({
      phone: customerPhone,
      message: buildBuyerSaveMessage({
        lines: chargeModal.resumo,
        pickupCode: chargeModal.pickupCode,
        trackingUrl,
        totalLabel: formatBRL(chargeModal.total),
        pixChave: chargeModal.recebimento === "pix" ? chargeModal.pixChave : null,
      }),
    });
  }

  if (checkingPending || campaign === undefined) {
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
          (pendingOrder.status === "aguardando_pagamento" || pendingOrder.status === "reservado" ? (
            <Card className="mb-6 border-brand-orange/40 bg-brand-orange/10 p-5">
              <h2 className="text-base font-semibold text-black">
                {pendingOrder.status === "reservado"
                  ? "Você tem uma reserva em aberto"
                  : "Você tem um pedido aguardando pagamento"}
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
                <Link href={`/${tenant}/pedido/${pendingOrder.pickupCode}`}>
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
                <Link href={`/${tenant}/pedido/${pendingOrder.pickupCode}`}>
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
              <Link href={`/${tenant}`}>
                <Button variant="primary">Ver cardápio</Button>
              </Link>
            }
          />
        ) : (
          <>
            <Link
              href={`/${tenant}/carrinho`}
              className="mb-4 flex w-fit items-center gap-1.5 text-sm text-neutral-500 hover:text-black"
            >
              <IconArrowLeft className="h-4 w-4" /> Voltar ao carrinho
            </Link>
            <h1 className="text-[28px] font-bold tracking-tight text-black">
              Finalizar pedido
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              {reserva
                ? "Reserve os itens e escolha se quer receber ou retirar. O pagamento fica para depois."
                : pix
                  ? "Confirme o pedido. A cobrança segue por Pix no WhatsApp."
                  : "Confirme seu pedido antes de prosseguir para o pagamento."}
            </p>
            {campanhaFechada && (
              <Card className="mt-6 border-brand-orange/40 bg-brand-orange/10 p-5">
                <p className="text-sm text-black">
                  A campanha está encerrada. Novos pedidos ficam para a próxima campanha.
                </p>
              </Card>
            )}

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
                {(reserva || pix) && (
                  <div className="mt-4">
                    <Field label="Telefone" required={reserva}>
                      <Input
                        inputMode="tel"
                        placeholder="DDD e número"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                      />
                    </Field>
                  </div>
                )}
              </Card>

              {reserva && (
                <Card className="p-5">
                  <h2 className="mb-4 border-b border-neutral-200 pb-3 text-lg font-semibold text-black">
                    Como você quer receber
                  </h2>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm text-neutral-800">
                      <input
                        type="radio"
                        name="fulfillment"
                        checked={fulfillment === "retirada"}
                        onChange={() => setFulfillment("retirada")}
                      />
                      Retirar
                    </label>
                    <label className="flex items-center gap-2 text-sm text-neutral-800">
                      <input
                        type="radio"
                        name="fulfillment"
                        checked={fulfillment === "entrega"}
                        onChange={() => setFulfillment("entrega")}
                      />
                      Receber
                    </label>
                  </div>
                  {fulfillment === "entrega" && (
                    <div className="mt-4 space-y-4">
                      <Field label="CEP" required>
                        <Input
                          inputMode="numeric"
                          placeholder="00000-000"
                          value={formatCep(cep)}
                          onChange={(e) => {
                            const digits = onlyCepDigits(e.target.value);
                            setCep(digits);
                            setCepErro("");
                            setEnderecoEncontrado(null);
                            setLogradouro("");
                            if (digits.length === 8) {
                              void buscarCep(digits);
                            }
                          }}
                        />
                      </Field>
                      {cepLoading && <p className="text-sm text-neutral-500">Buscando endereço...</p>}
                      {cepErro && <p className="text-sm text-red-600">{cepErro}</p>}
                      {enderecoEncontrado && (
                        <>
                          <p className="text-sm text-neutral-700">
                            {[
                              enderecoEncontrado.logradouro,
                              enderecoEncontrado.bairro,
                              enderecoEncontrado.localidade
                                ? `${enderecoEncontrado.localidade}/${enderecoEncontrado.uf}`
                                : "",
                            ]
                              .filter(Boolean)
                              .join(" — ")}
                          </p>
                          {!enderecoEncontrado.logradouro && (
                            <Field label="Rua" required>
                              <Input
                                value={logradouro}
                                onChange={(e) => setLogradouro(e.target.value)}
                                placeholder="Nome da rua"
                              />
                            </Field>
                          )}
                          <Field label="Número" required>
                            <Input
                              value={numero}
                              onChange={(e) => setNumero(e.target.value)}
                              placeholder="120"
                            />
                          </Field>
                          <Field label="Complemento">
                            <Input
                              value={complemento}
                              onChange={(e) => setComplemento(e.target.value)}
                              placeholder="Apto, bloco ou referência"
                            />
                          </Field>
                        </>
                      )}
                    </div>
                  )}
                </Card>
              )}

              <Card className="p-5">
                <h2 className="mb-4 border-b border-neutral-200 pb-3 text-lg font-semibold text-black">
                  Resumo do pedido
                </h2>
                <ul className="space-y-3">
                  {cart.map((item) => {
                    const unit = cartUnitPrice(item);
                    return (
                      <li key={item.lineId} className="text-sm">
                        <div className="flex justify-between gap-3">
                          <span className="text-neutral-700">
                            {item.quantidade}x {item.menuItem.nome}
                          </span>
                          <span className="font-medium text-black">
                            {formatBRL(unit * item.quantidade)}
                          </span>
                        </div>
                        <MontagemTexto
                          retirados={item.customization.removals.map((removal) => removal.nome)}
                          complementos={item.customization.complements.map((complement) => complement.nome)}
                        />
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
                disabled={loading || campanhaFechada}
                onClick={handleContinue}
              >
                {loading ? (
                  "Registrando pedido..."
                ) : reserva ? (
                  "Reservar pedido"
                ) : pix ? (
                  "Registrar pedido"
                ) : (
                  <>
                    <IconLock className="h-4 w-4" /> Continuar para o pagamento
                  </>
                )}
              </Button>
              {!reserva && !pix && !campanhaFechada && (
                <p className="flex items-center justify-center gap-1.5 text-center text-xs text-neutral-500">
                  <IconLock className="h-3.5 w-3.5" />
                  Você será direcionado para o ambiente seguro da InfinitePay.
                </p>
              )}
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
            <p>
              Valor a pagar:{" "}
              <span className="font-bold text-black">{formatBRL(paymentModal.total)}</span>
            </p>
            <p className="rounded border border-brand-orange/40 bg-brand-orange/10 p-3 text-black">
              Depois de concluir o pagamento na InfinitePay, clique no botão para voltar
              à loja — não use o botão <strong>Voltar</strong> do navegador nem feche a
              aba, para não perder a confirmação do seu pedido.
            </p>
          </div>
        )}
      </Modal>

      <Modal
        open={!!chargeModal}
        onClose={() => setChargeModal(null)}
        title={chargeModal?.mode === "reserva" ? "Reserva registrada" : "Pedido registrado"}
        size="sm"
        footer={
          <a href={chargeLink()} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
            <Button variant="primary" className="w-full">
              Salvar no meu WhatsApp
            </Button>
          </a>
        }
      >
        {chargeModal && (
          <div className="space-y-3 text-sm text-neutral-700">
            {chargeModal.resumo.length > 0 && (
              <ul className="space-y-1">
                {chargeModal.resumo.map((linha, index) => (
                  <li key={`${index}-${linha}`}>{linha}</li>
                ))}
              </ul>
            )}
            <p>
              Sua senha é{" "}
              <span className="text-lg font-bold text-black">{chargeModal.pickupCode}</span>.
            </p>
            <p>
              Valor: <span className="font-bold text-black">{formatBRL(chargeModal.total)}</span>
            </p>
            {chargeModal.recebimento === "pix" && chargeModal.pixChave && (
              <p>
                Pix: <span className="font-medium text-black">{chargeModal.pixChave}</span>
              </p>
            )}
            <p>
              {chargeModal.mode === "reserva"
                ? "O pagamento fica para depois. O organizador acompanha esta reserva na lista de pedidos."
                : "O pedido só entra como pago depois que o organizador confirmar o Pix."}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
