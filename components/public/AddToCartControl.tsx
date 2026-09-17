"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { IconCart } from "@/components/icons";
import { useCart } from "@/lib/cart-context";
import type { MenuItem } from "@/lib/types";

export function AddToCartControl({ item }: { item: MenuItem }) {
  const { addToCart } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const esgotado = item.status === "esgotado";

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <div className="flex items-center rounded border border-neutral-300">
        <button
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className="px-3 py-2 text-neutral-600 hover:text-black"
          aria-label="Diminuir"
        >
          −
        </button>
        <span className="w-10 text-center text-sm font-medium">{qty}</span>
        <button
          onClick={() => setQty((q) => q + 1)}
          className="px-3 py-2 text-neutral-600 hover:text-black"
          aria-label="Aumentar"
        >
          +
        </button>
      </div>
      <Button
        variant="primary"
        disabled={esgotado}
        className="flex-1 sm:flex-none"
        onClick={() => {
          addToCart(item, qty);
          router.push("/carrinho");
        }}
      >
        <IconCart className="h-4 w-4" /> Adicionar ao carrinho
      </Button>
    </div>
  );
}
