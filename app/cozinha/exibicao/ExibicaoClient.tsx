"use client";

import { useEffect, useRef, useState } from "react";
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
  const [soundEnabled, setSoundEnabled] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- leitura síncrona do localStorage ao montar, não reage a mudança de estado
    setSoundEnabled(localStorage.getItem("exibicaoSoundEnabled") === "1");
  }, []);

  function enableSound() {
    // Precisa ser um play() síncrono dentro do clique — é esse gesto do
    // usuário que destrava o autoplay de áudio no navegador para o resto
    // da sessão dessa aba (sem isso, os play() automáticos do efeito
    // abaixo são bloqueados silenciosamente quando a tela fica aberta
    // sozinha num monitor, sem ninguém clicando nela).
    const audio = new Audio("/sounds/efeito-sonoro-tela-cliente.mp3");
    audio.volume = 0;
    audio.play().catch(() => {});
    localStorage.setItem("exibicaoSoundEnabled", "1");
    setSoundEnabled(true);
  }

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  const prevReadyIdsRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (loading) return;
    const readyIds = new Set(orders.filter((o) => o.status === "pronto").map((o) => o.id));
    if (prevReadyIdsRef.current) {
      const hasNewReady = [...readyIds].some((id) => !prevReadyIdsRef.current!.has(id));
      if (hasNewReady) {
        new Audio("/sounds/efeito-sonoro-tela-cliente.mp3").play().catch(() => {
          // autoplay pode ser bloqueado sem interação prévia do usuário na página
        });
      }
    }
    prevReadyIdsRef.current = readyIds;
  }, [orders, loading]);

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

      {!soundEnabled && (
        <button
          onClick={enableSound}
          className="fixed bottom-4 right-4 z-10 rounded border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg hover:bg-neutral-800"
        >
          🔊 Ativar som
        </button>
      )}

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
