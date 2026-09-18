"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PublicHeader } from "@/components/public/PublicHeader";
import { Card, EmptyState, Loading, StatusBadge } from "@/components/ui";
import { IconCheck, IconChefHat } from "@/components/icons";
import { useCart } from "@/lib/cart-context";
import { cn } from "@/lib/cn";
import { formatBRL } from "@/lib/format";
import { ORDER_STATUS_ACCENT_CLASS, ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/types";

interface OrderItem {
  nome: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
}

interface OrderDetail {
  id: string;
  pickup_code: string;
  status: OrderStatus;
  channel: "online" | "pdv";
  payment_status: "pendente" | "pago" | "falhou";
  total: number;
  created_at: string;
  paid_at: string | null;
  items: OrderItem[];
}

const STEPS: OrderStatus[] = ["recebido", "fazendo", "pronto", "entregue"];

const STEP_COLOR: Record<string, { dot: string; text: string; line: string }> = {
  recebido: { dot: "border-black bg-black", text: "text-white", line: "bg-black" },
  fazendo: { dot: "border-brand-yellow bg-brand-yellow", text: "text-black", line: "bg-brand-yellow" },
  pronto: { dot: "border-green-600 bg-green-600", text: "text-white", line: "bg-green-600" },
  entregue: { dot: "border-blue-600 bg-blue-600", text: "text-white", line: "bg-blue-600" },
};

export function AcompanharPedidoClient({ codigo }: { codigo: string }) {
  const [order, setOrder] = useState<OrderDetail | null | undefined>(undefined);
  const { clearCart } = useCart();

  const supabase = createClient();

  const fetchOrder = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_order_by_code", {
      p_pickup_code: codigo,
    });
    if (!error) {
      setOrder((data as unknown as OrderDetail | null) ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigo]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca inicial ao montar, não um setState síncrono
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigo]);

  useEffect(() => {
    if (!order?.id) return;
    const channel = supabase
      .channel(`pedido-${order.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `id=eq.${order.id}`,
        },
        () => fetchOrder()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.id]);

  useEffect(() => {
    if (!order || order.channel !== "online" || order.status === "aguardando_pagamento") return;
    // Só esvazia o carrinho da própria aba que criou este pedido — evita
    // limpar o carrinho de quem só está consultando a senha de outro
    // pedido pela busca manual em /pedido.
    if (sessionStorage.getItem("pendingOrderId") === order.id) {
      clearCart();
      sessionStorage.removeItem("pendingOrderId");
      sessionStorage.removeItem("pendingOrderPickupCode");
      sessionStorage.removeItem("pendingPaymentUrl");
    }
  }, [order, clearCart]);

  const prevStatusRef = useRef<OrderStatus | null>(null);

  useEffect(() => {
    if (!order) return;
    if (
      order.status === "pronto" &&
      prevStatusRef.current !== null &&
      prevStatusRef.current !== "pronto"
    ) {
      new Audio("/sounds/efeito-sonoro-acompanhamento.mp3").play().catch(() => {
        // autoplay pode ser bloqueado sem interação prévia do usuário na página
      });
    }
    prevStatusRef.current = order.status;
  }, [order]);

  if (order === undefined) {
    return (
      <div className="min-h-screen bg-brand-yellow/10">
        <PublicHeader />
        <Loading label="Carregando pedido..." />
      </div>
    );
  }

  if (order === null) {
    return (
      <div className="min-h-screen bg-brand-yellow/10 text-black">
        <PublicHeader />
        <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
          <EmptyState
            title="Pedido não encontrado."
            description="Confira se a senha foi digitada corretamente."
            action={
              <Link href="/pedido" className="text-sm font-medium text-black underline">
                Buscar novamente
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const aguardandoPagamento = order.status === "aguardando_pagamento";
  const currentStepIdx = STEPS.indexOf(order.status);

  return (
    <div className="min-h-screen bg-brand-yellow/10 text-black">
      <PublicHeader />

      <div className="mx-auto max-w-md px-4 py-10 sm:px-6">
        <div className="text-center">
          <p className="text-sm text-neutral-500">Senha do pedido</p>
          <p className="mt-1 text-[56px] font-bold leading-none tracking-widest text-black">
            {order.pickup_code}
          </p>
        </div>

        {aguardandoPagamento ? (
          <Card className="mt-8 flex flex-col items-center gap-3 p-6 text-center">
            <Loading label="Aguardando confirmação do pagamento..." />
            <p className="text-xs text-neutral-500">
              Assim que a InfinitePay confirmar, seu pedido segue para a cozinha
              automaticamente.
            </p>
          </Card>
        ) : (
          <Card className="mt-8 p-6">
            <div className="flex items-center justify-between">
              {STEPS.map((step, idx) => {
                const reached = idx <= currentStepIdx;
                const passed = idx < currentStepIdx;
                const colors = STEP_COLOR[step];
                const prevColors = idx > 0 ? STEP_COLOR[STEPS[idx - 1]] : null;
                return (
                  <div key={step} className="flex flex-1 flex-col items-center">
                    <div className="flex w-full items-center">
                      {idx > 0 && (
                        <div
                          className={`h-0.5 flex-1 ${
                            reached ? prevColors!.line : "bg-neutral-200"
                          }`}
                        />
                      )}
                      <div
                        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                          reached
                            ? `${colors.dot} ${colors.text}`
                            : "border-neutral-300 text-neutral-300"
                        }`}
                      >
                        {reached ? (
                          <IconCheck className="h-4 w-4" />
                        ) : (
                          <span className="text-xs">{idx + 1}</span>
                        )}
                      </div>
                      {idx < STEPS.length - 1 && (
                        <div
                          className={`h-0.5 flex-1 ${
                            passed ? colors.line : "bg-neutral-200"
                          }`}
                        />
                      )}
                    </div>
                    <span className="mt-2 text-center text-[11px] font-medium text-neutral-600">
                      {ORDER_STATUS_LABEL[step]}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 border-t border-neutral-200 pt-4">
              <IconChefHat className="h-4 w-4 text-neutral-500" />
              <StatusBadge
                tone={order.status === "pronto" ? "strong" : "medium"}
                className={
                  order.status === "pronto"
                    ? cn(ORDER_STATUS_ACCENT_CLASS.pronto, "text-black")
                    : ORDER_STATUS_ACCENT_CLASS[order.status]
                }
              >
                {ORDER_STATUS_LABEL[order.status]}
              </StatusBadge>
            </div>
          </Card>
        )}

        <Card className="mt-5 p-5">
          <h2 className="mb-3 border-b border-neutral-200 pb-3 text-sm font-semibold text-black">
            Itens do pedido
          </h2>
          <ul className="space-y-2 text-sm">
            {order.items.map((item, idx) => (
              <li key={idx} className="flex justify-between">
                <span className="text-neutral-700">
                  {item.quantidade}x {item.nome}
                </span>
                <span className="font-medium text-black">
                  {formatBRL(item.subtotal)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-neutral-200 pt-3 text-base font-bold text-black">
            <span>Total</span>
            <span>{formatBRL(order.total)}</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
