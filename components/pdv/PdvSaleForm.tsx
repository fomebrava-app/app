"use client";

import { useMemo, useState } from "react";
import { Button, Card, Field, Input, SearchField, Select, StatusBadge, Toast } from "@/components/ui";
import { IconPOS, IconTrash, IconWhatsapp, IconCopy } from "@/components/icons";
import { formatBRL } from "@/lib/format";
import { buildOrderTrackingMessage, buildWhatsAppLink } from "@/lib/whatsapp";
import type { MenuItem } from "@/lib/types";

interface PdvCartItem {
  menuItem: MenuItem;
  quantidade: number;
}

type PaymentMethod = "dinheiro" | "pix_presencial";

interface Confirmation {
  pickupCode: string;
  trackingUrl: string;
}

function unitPrice(item: MenuItem) {
  return item.preco_promocional ?? item.preco;
}

export function PdvSaleForm({
  items,
  pdvToken,
  pdvPassword,
}: {
  items: MenuItem[];
  pdvToken: string;
  pdvPassword: string;
}) {
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<PdvCartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [toast, setToast] = useState("");
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  const filteredItems = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((i) => !q || i.nome.toLowerCase().includes(q));
  }, [items, search]);

  const total = useMemo(
    () => cart.reduce((s, i) => s + unitPrice(i.menuItem) * i.quantidade, 0),
    [cart]
  );

  function addItem(item: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((i) => i.menuItem.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItem.id === item.id ? { ...i, quantidade: i.quantidade + 1 } : i
        );
      }
      return [...prev, { menuItem: item, quantidade: 1 }];
    });
  }

  function updateQty(itemId: string, qty: number) {
    setCart((prev) => {
      if (qty <= 0) return prev.filter((i) => i.menuItem.id !== itemId);
      return prev.map((i) => (i.menuItem.id === itemId ? { ...i, quantidade: qty } : i));
    });
  }

  function resetForm() {
    setCart([]);
    setPaymentMethod("");
    setCustomerName("");
    setCustomerPhone("");
    setErro("");
    setConfirmation(null);
  }

  async function handleRegistrarPedido() {
    setErro("");
    if (cart.length === 0) {
      setErro("Adicione ao menos um item ao pedido.");
      return;
    }
    if (!paymentMethod) {
      setErro("Selecione a forma de pagamento.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "pdv",
          payment_method: paymentMethod,
          customer_name: customerName || undefined,
          pdv_token: pdvToken,
          pdv_password: pdvPassword,
          items: cart.map((i) => ({
            menu_item_id: i.menuItem.id,
            quantidade: i.quantidade,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao registrar pedido.");

      const trackingUrl = `${window.location.origin}/pedido/${data.pickupCode}`;
      setConfirmation({ pickupCode: data.pickupCode, trackingUrl });
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  function copyLink() {
    if (!confirmation) return;
    navigator.clipboard.writeText(confirmation.trackingUrl);
    setToast("Link copiado.");
    setTimeout(() => setToast(""), 2000);
  }

  if (confirmation) {
    const whatsappLink = buildWhatsAppLink({
      phone: customerPhone,
      message: buildOrderTrackingMessage({
        pickupCode: confirmation.pickupCode,
        trackingUrl: confirmation.trackingUrl,
      }),
    });

    return (
      <Card className="mx-auto max-w-md p-6 text-center">
        <StatusBadge tone="strong">Pedido registrado</StatusBadge>
        <p className="mt-4 text-sm text-neutral-500">Senha do pedido</p>
        <p className="mt-1 text-[48px] font-bold leading-none tracking-widest text-black">
          {confirmation.pickupCode}
        </p>
        <p className="mt-4 break-all text-xs text-neutral-500">{confirmation.trackingUrl}</p>

        <div className="mt-6 flex flex-col gap-2">
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
            <Button variant="primary" className="w-full">
              <IconWhatsapp className="h-4 w-4" /> Enviar link por WhatsApp
            </Button>
          </a>
          <Button onClick={copyLink} className="w-full">
            <IconCopy className="h-4 w-4" /> Copiar link
          </Button>
          <Button onClick={resetForm} className="w-full">
            Nova venda
          </Button>
        </div>
        <Toast message={toast} visible={!!toast} />
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card className="p-5">
          <h2 className="mb-4 flex items-center gap-2 border-b border-neutral-200 pb-3 text-lg font-semibold text-black">
            <IconPOS className="h-5 w-5 text-neutral-500" />
            Itens do cardápio
          </h2>
          <SearchField value={search} onChange={setSearch} placeholder="Buscar item..." />
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => addItem(item)}
                className="flex flex-col items-start rounded border border-neutral-200 p-3 text-left hover:border-neutral-400 hover:bg-neutral-50"
              >
                <span className="text-sm font-medium text-black">{item.nome}</span>
                <span className="mt-1 text-sm font-semibold text-neutral-600">
                  {formatBRL(unitPrice(item))}
                </span>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 border-b border-neutral-200 pb-3 text-lg font-semibold text-black">
            Dados do cliente (opcional)
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nome">
              <Input
                placeholder="Nome do cliente"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </Field>
            <Field label="WhatsApp (para enviar o link)">
              <Input
                placeholder="(00) 00000-0000"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </Field>
          </div>
        </Card>
      </div>

      <div>
        <Card className="p-5 lg:sticky lg:top-6">
          <h2 className="mb-4 border-b border-neutral-200 pb-3 text-lg font-semibold text-black">
            Resumo da venda
          </h2>

          {cart.length === 0 ? (
            <p className="py-6 text-center text-sm text-neutral-500">
              Toque nos itens ao lado para adicionar.
            </p>
          ) : (
            <ul className="space-y-3">
              {cart.map((i) => (
                <li key={i.menuItem.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-black">{i.menuItem.nome}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <button
                        onClick={() => updateQty(i.menuItem.id, i.quantidade - 1)}
                        className="rounded border border-neutral-300 px-1.5 text-xs text-neutral-600 hover:text-black"
                      >
                        −
                      </button>
                      <span className="text-xs font-medium">{i.quantidade}</span>
                      <button
                        onClick={() => updateQty(i.menuItem.id, i.quantidade + 1)}
                        className="rounded border border-neutral-300 px-1.5 text-xs text-neutral-600 hover:text-black"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-black">
                      {formatBRL(unitPrice(i.menuItem) * i.quantidade)}
                    </span>
                    <button
                      onClick={() => updateQty(i.menuItem.id, 0)}
                      className="text-neutral-400 hover:text-black"
                      aria-label="Remover"
                    >
                      <IconTrash className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <Field label="Forma de pagamento" required className="mt-4">
            <Select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            >
              <option value="">Selecione...</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="pix_presencial">Pix</option>
            </Select>
          </Field>

          <div className="mt-4 flex items-center justify-between border-t border-neutral-200 pt-4">
            <span className="text-base font-semibold text-black">Total</span>
            <span className="text-2xl font-bold text-black">{formatBRL(total)}</span>
          </div>

          {erro && <p className="mt-3 text-sm text-red-600">{erro}</p>}

          <Button
            variant="primary"
            className="mt-4 w-full"
            disabled={loading}
            onClick={handleRegistrarPedido}
          >
            {loading ? "Registrando..." : "Registrar pedido"}
          </Button>
        </Card>
      </div>
    </div>
  );
}
