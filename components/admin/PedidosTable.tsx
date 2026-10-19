"use client";

import { Fragment, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChargeWhatsAppButton } from "@/components/admin/ChargeWhatsAppButton";
import { MontagemTexto } from "@/components/orders/MontagemTexto";
import { Button, Card, EmptyState, Field, Modal, Select, StatusBadge, Textarea } from "@/components/ui";
import { IconAlert, IconLayers } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";
import { formatBRL } from "@/lib/format";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import {
  ORDER_STATUS_ACCENT_CLASS,
  ORDER_STATUS_LABEL,
  type CampaignRecebimento,
  type Order,
  type OrderContact,
  type OrderItem,
  type OrderStatus,
} from "@/lib/types";

const STATUS_OPTIONS: OrderStatus[] = [
  "aguardando_pagamento",
  "reservado",
  "recebido",
  "fazendo",
  "pronto",
  "entregue",
  "cancelado",
];

export function PedidosTable({
  orders,
  itemsByOrder,
  contactsByOrder,
  readOnly = false,
  recebimento,
  pixChave,
}: {
  orders: Order[];
  itemsByOrder: Record<string, OrderItem[]>;
  contactsByOrder: Record<string, OrderContact>;
  readOnly?: boolean;
  recebimento: CampaignRecebimento;
  pixChave: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const { tenant } = useParams<{ tenant: string }>();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [confirmingPayment, setConfirmingPayment] = useState<Order | null>(null);
  const [nota, setNota] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);
  const [erroPayment, setErroPayment] = useState("");
  const [charging, setCharging] = useState<string | null>(null);

  async function handleConfirmPayment() {
    if (!confirmingPayment || !nota.trim()) return;
    setSavingPayment(true);
    setErroPayment("");
    const { error } = await supabase.rpc("confirm_manual_payment", {
      p_order_id: confirmingPayment.id,
      p_nota: nota.trim(),
    });
    setSavingPayment(false);
    if (error) {
      setErroPayment(error.message);
      return;
    }
    setConfirmingPayment(null);
    setNota("");
    router.refresh();
  }

  async function handleCharge(order: Order) {
    setCharging(order.id);
    setErroPayment("");
    try {
      const res = await fetch("/api/orders/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant, orderId: order.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Não foi possível montar a cobrança.");
      const link = buildWhatsAppLink({
        phone: contactsByOrder[order.id]?.customer_phone,
        message: data.message,
      });
      window.open(link, "_blank", "noopener,noreferrer");
    } catch (err) {
      setErroPayment(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setCharging(null);
    }
  }

  async function handleStatusChange(order: Order, novoStatus: OrderStatus) {
    if (novoStatus === order.status) return;
    setPending(order.id);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.rpc("update_order_status", {
      p_order_id: order.id,
      p_novo_status: novoStatus,
      p_tenant_slug: tenant,
      p_changed_by: user?.id ?? null,
    });
    setPending(null);
    router.refresh();
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<IconLayers className="h-10 w-10" />}
        title="Nenhum pedido ainda."
        description="Os pedidos aparecem aqui assim que forem criados."
      />
    );
  }

  return (
    <Card className="overflow-hidden">
      {erroPayment && !confirmingPayment && (
        <p className="border-b border-neutral-200 px-4 py-3 text-sm text-red-600">{erroPayment}</p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Senha</th>
              <th className="px-4 py-3 font-medium">Canal</th>
              <th className="px-4 py-3 font-medium">Pagamento</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {orders.map((order) => (
              <Fragment key={order.id}>
                <tr
                  className="cursor-pointer hover:bg-neutral-50"
                  onClick={() =>
                    setExpanded((prev) => (prev === order.id ? null : order.id))
                  }
                >
                  <td className="px-4 py-3 font-semibold text-black">
                    #{order.pickup_code}
                  </td>
                  <td className="px-4 py-3 text-neutral-600 capitalize">{order.channel}</td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={order.payment_status === "pago" ? "medium" : "soft"}>
                      {order.payment_status}
                    </StatusBadge>
                    {!readOnly && order.payment_status !== "pago" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setErroPayment("");
                          setNota("");
                          setConfirmingPayment(order);
                        }}
                        className="mt-1 block text-xs text-neutral-500 underline hover:text-black"
                      >
                        Confirmar pagamento
                      </button>
                    )}
                    {!readOnly && order.payment_status === "pendente" && (
                      <ChargeWhatsAppButton
                        label={charging === order.id ? "Abrindo WhatsApp..." : "Cobrar no WhatsApp"}
                        disabled={charging === order.id}
                        onClick={() => handleCharge(order)}
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-black">
                    {formatBRL(order.total)}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {new Date(order.created_at).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={order.status}
                      disabled={readOnly || pending === order.id}
                      onChange={(e) =>
                        handleStatusChange(order, e.target.value as OrderStatus)
                      }
                      className={cn("w-44", ORDER_STATUS_ACCENT_CLASS[order.status])}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {ORDER_STATUS_LABEL[s]}
                        </option>
                      ))}
                    </Select>
                  </td>
                </tr>
                {expanded === order.id && (
                  <tr>
                    <td colSpan={6} className="bg-neutral-50 px-4 py-3">
                      <ul className="space-y-1 text-sm text-neutral-700">
                        {(itemsByOrder[order.id] ?? []).map((item) => (
                          <li key={item.id}>
                            <div className="flex justify-between gap-3">
                              <span>
                                {item.quantidade}x {item.nome_snapshot}
                              </span>
                              <span className="font-medium text-black">
                                {formatBRL(item.subtotal)}
                              </span>
                            </div>
                            <MontagemTexto
                              retirados={item.retirados}
                              complementos={item.complementos}
                            />
                          </li>
                        ))}
                      </ul>
                      {order.customer_name && (
                        <p className="mt-2 text-xs text-neutral-500">
                          Cliente: {order.customer_name}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-neutral-500">
                        {order.fulfillment === "entrega" ? "Entrega" : "Retirada"}
                        {contactsByOrder[order.id]?.endereco
                          ? ` — ${contactsByOrder[order.id].endereco}`
                          : ""}
                      </p>
                      {contactsByOrder[order.id]?.customer_phone && (
                        <p className="mt-1 text-xs text-neutral-500">
                          Telefone: {contactsByOrder[order.id].customer_phone}
                        </p>
                      )}
                      {recebimento === "pix" && pixChave && (
                        <p className="mt-1 text-xs text-neutral-500">Pix: {pixChave}</p>
                      )}
                      {order.pdv_label_snapshot && (
                        <p className="mt-1 text-xs text-neutral-500">
                          PDV: {order.pdv_label_snapshot}
                        </p>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!confirmingPayment}
        onClose={() => setConfirmingPayment(null)}
        title="Confirmar pagamento manualmente"
        size="sm"
        footer={
          <>
            <Button onClick={() => setConfirmingPayment(null)}>Cancelar</Button>
            <Button
              variant="primary"
              disabled={!nota.trim() || savingPayment}
              onClick={handleConfirmPayment}
            >
              {savingPayment ? "Confirmando..." : "Confirmar pagamento"}
            </Button>
          </>
        }
      >
        {confirmingPayment && (
          <div className="space-y-4">
            <div className="flex gap-3 rounded border border-neutral-200 bg-neutral-50 p-3">
              <IconAlert className="h-5 w-5 flex-shrink-0 text-neutral-500" />
              <p className="text-sm text-neutral-700">
                Isso marca o pedido #{confirmingPayment.pickup_code} como pago sem
                confirmação da InfinitePay. Use só se o cliente mostrou comprovante de
                cobrança (extrato, fatura, print do banco).
              </p>
            </div>
            <Field label="Como foi confirmado o pagamento?" required>
              <Textarea
                placeholder="Ex.: cliente mostrou comprovante Nubank de R$ 45,90 na tela do celular"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
              />
            </Field>
            {erroPayment && <p className="text-sm text-red-600">{erroPayment}</p>}
          </div>
        )}
      </Modal>
    </Card>
  );
}
