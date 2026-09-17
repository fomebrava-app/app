"use client";

import Link from "next/link";
import { Button, Card, StatusBadge } from "@/components/ui";
import { useCart } from "@/lib/cart-context";
import { formatBRL } from "@/lib/format";
import type { MenuItem } from "@/lib/types";

export function MenuItemCard({ item }: { item: MenuItem }) {
  const { cart, addToCart, updateQuantity } = useCart();
  const hasPromo = !!item.preco_promocional;
  const esgotado = item.status === "esgotado";
  const qtyInCart = cart.find((i) => i.menuItem.id === item.id)?.quantidade ?? 0;

  return (
    <Card className="flex flex-col overflow-hidden transition-colors hover:border-neutral-400">
      <Link
        href={`/item/${item.id}`}
        className="relative block aspect-square overflow-hidden bg-neutral-50"
      >
        {item.imagem_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imagem_url}
            alt={item.nome}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-neutral-300">
            Sem foto
          </div>
        )}
        {hasPromo && (
          <span className="absolute left-2 top-2">
            <StatusBadge tone="medium" className="bg-brand-yellow/25 border-brand-yellow/50">
              Promoção
            </StatusBadge>
          </span>
        )}
        {esgotado && (
          <span className="absolute right-2 top-2">
            <StatusBadge tone="outline" className="bg-brand-red/10 border-brand-red/40">
              Esgotado
            </StatusBadge>
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-[16px] font-semibold leading-snug text-black">
          {item.nome}
        </h3>
        <div className="mt-1 flex items-start justify-between gap-2">
          {item.descricao_curta && (
            <p className="line-clamp-2 text-[13px] text-neutral-500">
              {item.descricao_curta}
            </p>
          )}
          {qtyInCart > 0 && (
            <div className="flex flex-shrink-0 items-center rounded border border-neutral-300">
              <button
                onClick={() => updateQuantity(item.id, qtyInCart - 1)}
                className="px-2.5 py-1 text-neutral-600 hover:text-black"
                aria-label="Diminuir"
              >
                −
              </button>
              <span className="w-8 text-center text-sm font-medium">
                {qtyInCart}
              </span>
              <button
                onClick={() => updateQuantity(item.id, qtyInCart + 1)}
                className="px-2.5 py-1 text-neutral-600 hover:text-black"
                aria-label="Aumentar"
              >
                +
              </button>
            </div>
          )}
        </div>

        <div className="mt-3">
          {hasPromo ? (
            <div className="flex items-baseline gap-2">
              <span className="text-[13px] text-neutral-400 line-through">
                {formatBRL(item.preco)}
              </span>
              <span className="text-lg font-bold text-black">
                {formatBRL(item.preco_promocional!)}
              </span>
            </div>
          ) : (
            <span className="text-lg font-bold text-black">
              {formatBRL(item.preco)}
            </span>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <Link href={`/item/${item.id}`} className="flex-1">
            <Button className="w-full">Ver detalhes</Button>
          </Link>
          <Button
            variant="primary"
            className="flex-1"
            disabled={esgotado}
            onClick={() => addToCart(item, 1)}
          >
            {qtyInCart > 0 ? `Adicionar (${qtyInCart})` : "Adicionar"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
