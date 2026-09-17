"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { OrderStatus } from "@/lib/types";

export interface KitchenOrderItem {
  nome: string;
  quantidade: number;
}

export interface KitchenOrder {
  id: string;
  pickup_code: string;
  status: OrderStatus;
  channel: "online" | "pdv";
  customer_name: string | null;
  created_at: string;
  items: KitchenOrderItem[];
}

// Busca os pedidos ativos da cozinha e mantém em sincronia via Realtime.
// Compartilhado entre a tela operacional (/cozinha) e a tela de exibição
// para o cliente (/cozinha/exibicao) — as duas só leem o mesmo estado,
// a mutação de status acontece só na tela operacional.
export function useKitchenOrders() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase.rpc("list_kitchen_orders");
    if (!error && data) {
      setOrders(data as unknown as KitchenOrder[]);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca inicial ao montar, não um setState síncrono
    fetchOrders();

    const channel = supabase
      .channel("kitchen-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => fetchOrders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { orders, setOrders, loading };
}
