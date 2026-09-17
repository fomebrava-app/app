"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, Loading } from "@/components/ui";
import { IconChefHat, IconClock, IconMonitor } from "@/components/icons";
import { useKitchenOrders, type KitchenOrder } from "@/lib/useKitchenOrders";
import { cn } from "@/lib/cn";
import { ORDER_STATUS_ACCENT_CLASS, type OrderStatus } from "@/lib/types";

const COLUMNS: { status: OrderStatus; title: string }[] = [
  { status: "recebido", title: "Recebido" },
  { status: "fazendo", title: "Fazendo" },
  { status: "pronto", title: "Pronto" },
];

function timeSince(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "agora";
  if (minutes === 1) return "1 min";
  return `${minutes} min`;
}

export function CozinhaClient() {
  const { orders, setOrders, loading } = useKitchenOrders();
  const [now, setNow] = useState(() => Date.now());
  const supabase = createClient();

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  async function advanceStatus(order: KitchenOrder, novoStatus: OrderStatus) {
    // Atualização otimista: some/move o card na hora, o Realtime confirma
    // (ou corrige, se outro operador já tiver mudado o status antes).
    setOrders((prev) =>
      novoStatus === "entregue"
        ? prev.filter((o) => o.id !== order.id)
        : prev.map((o) => (o.id === order.id ? { ...o, status: novoStatus } : o))
    );
    await supabase.rpc("update_order_status", {
      p_order_id: order.id,
      p_novo_status: novoStatus,
      p_status_esperado: order.status,
    });
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950">
        <Loading label="Carregando pedidos..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white" data-theme="dark">
      <header className="flex items-center gap-3 border-b border-neutral-800 px-6 py-4">
        <IconChefHat className="h-7 w-7" />
        <h1 className="text-xl font-bold tracking-tight">Cozinha</h1>
        <Link
          href="/cozinha/exibicao"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-4 flex items-center gap-1.5 rounded border border-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-neutral-800"
        >
          <IconMonitor className="h-3.5 w-3.5" /> Tela do cliente
        </Link>
        <span className="ml-auto text-xs text-neutral-400" suppressHydrationWarning>
          {new Date(now).toLocaleTimeString("pt-BR")}
        </span>
      </header>

      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-3 md:p-6">
        {COLUMNS.map((col) => {
          const columnOrders = orders.filter((o) => o.status === col.status);
          return (
            <div key={col.status} className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-300">
                  {col.title}
                </h2>
                <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-300">
                  {columnOrders.length}
                </span>
              </div>

              {columnOrders.length === 0 && (
                <div className="rounded-md border border-dashed border-neutral-800 py-8 text-center text-sm text-neutral-600">
                  Nenhum pedido
                </div>
              )}

              {columnOrders.map((order) => (
                <Card
                  key={order.id}
                  className={cn(
                    "border-neutral-800 bg-neutral-900 p-4 text-white",
                    ORDER_STATUS_ACCENT_CLASS[col.status]
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold tracking-widest">
                      #{order.pickup_code}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-neutral-400">
                      <IconClock className="h-3.5 w-3.5" />
                      {timeSince(order.created_at)}
                    </span>
                  </div>
                  {order.customer_name && (
                    <p className="mt-1 text-sm text-neutral-400">
                      {order.customer_name}
                    </p>
                  )}
                  <ul className="mt-3 space-y-1 border-t border-neutral-800 pt-3 text-sm">
                    {order.items.map((item, idx) => (
                      <li key={idx} className="flex justify-between gap-2">
                        <span>{item.nome}</span>
                        <span className="font-semibold">{item.quantidade}x</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4">
                    {col.status === "recebido" && (
                      <button
                        onClick={() => advanceStatus(order, "fazendo")}
                        className="w-full rounded border border-neutral-700 bg-neutral-800 py-2 text-sm font-medium hover:bg-neutral-700"
                      >
                        Iniciar preparo
                      </button>
                    )}
                    {col.status === "fazendo" && (
                      <button
                        onClick={() => advanceStatus(order, "pronto")}
                        className="w-full rounded border border-neutral-700 bg-neutral-800 py-2 text-sm font-medium hover:bg-neutral-700"
                      >
                        Marcar como pronto
                      </button>
                    )}
                    {col.status === "pronto" && (
                      <button
                        onClick={() => advanceStatus(order, "entregue")}
                        className="w-full rounded border-2 border-white bg-white py-2 text-sm font-bold text-black hover:bg-neutral-100"
                      >
                        Entregue
                      </button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
