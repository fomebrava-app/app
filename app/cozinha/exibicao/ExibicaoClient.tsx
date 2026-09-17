"use client";

import { useEffect, useState } from "react";
import { Loading } from "@/components/ui";
import { IconChefHat } from "@/components/icons";
import { useKitchenOrders } from "@/lib/useKitchenOrders";
import { cn } from "@/lib/cn";
import { ORDER_STATUS_ACCENT_CLASS, type OrderStatus } from "@/lib/types";

const COLUMNS: { status: OrderStatus; title: string }[] = [
  { status: "recebido", title: "Recebido" },
  { status: "fazendo", title: "Preparando" },
  { status: "pronto", title: "Pronto" },
];

// Espelho somente leitura de /cozinha, pensado para um segundo monitor
// visível aos clientes — só os códigos, sem itens/ações/dados pessoais.
export function ExibicaoClient() {
  const { orders, loading } = useKitchenOrders();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950">
        <Loading label="Carregando..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white" data-theme="dark">
      <header className="flex items-center gap-3 border-b border-neutral-800 px-8 py-5">
        <IconChefHat className="h-8 w-8" />
        <h1 className="text-2xl font-bold tracking-tight">Acompanhe seu pedido</h1>
        <span className="ml-auto text-sm text-neutral-400" suppressHydrationWarning>
          {new Date(now).toLocaleTimeString("pt-BR")}
        </span>
      </header>

      <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-3 md:p-10">
        {COLUMNS.map((col) => {
          const columnOrders = orders.filter((o) => o.status === col.status);
          return (
            <div key={col.status} className="flex flex-col gap-4">
              <h2 className="text-center text-lg font-semibold uppercase tracking-widest text-neutral-300">
                {col.title}
              </h2>

              <div className="flex flex-1 flex-wrap content-start justify-center gap-4 rounded-lg border border-neutral-800 bg-neutral-900/50 p-4 min-h-[240px]">
                {columnOrders.length === 0 ? (
                  <p className="mt-8 text-sm text-neutral-600">—</p>
                ) : (
                  columnOrders.map((order) => (
                    <div
                      key={order.id}
                      className={cn(
                        "flex h-24 w-24 items-center justify-center rounded-lg border-2 border-neutral-700 bg-neutral-900 text-3xl font-bold tracking-widest sm:h-28 sm:w-28 sm:text-4xl",
                        ORDER_STATUS_ACCENT_CLASS[col.status]
                      )}
                    >
                      {order.pickup_code}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
