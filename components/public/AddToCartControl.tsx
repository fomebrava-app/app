"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChoiceCheckbox } from "@/components/public/ChoiceCheckbox";
import { Button } from "@/components/ui";
import { IconCart } from "@/components/icons";
import { menuUnitPrice } from "@/lib/customization";
import { useCart } from "@/lib/cart-context";
import { formatBRL } from "@/lib/format";
import type { MenuItem, MenuItemComplement, MenuItemIngredient } from "@/lib/types";

export function AddToCartControl({
  item,
  ingredients = [],
  complements = [],
}: {
  item: MenuItem;
  ingredients?: MenuItemIngredient[];
  complements?: MenuItemComplement[];
}) {
  const { addToCart } = useCart();
  const router = useRouter();
  const { tenant } = useParams<{ tenant: string }>();
  const [qty, setQty] = useState(1);
  const [removed, setRemoved] = useState<string[]>([]);
  const [added, setAdded] = useState<string[]>([]);
  const esgotado = item.status === "esgotado";
  const showRemovals = item.personalizavel && ingredients.length > 0;
  const showComplements = item.personalizavel && complements.length > 0;

  const customization = useMemo(
    () => ({
      removals: ingredients
        .filter((ingredient) => removed.includes(ingredient.id))
        .map((ingredient) => ({ id: ingredient.id, nome: ingredient.nome })),
      complements: complements
        .filter((complement) => added.includes(complement.id))
        .map((complement) => ({
          id: complement.id,
          nome: complement.nome,
          cobra: complement.cobra,
          preco: complement.preco,
        })),
    }),
    [added, complements, ingredients, removed]
  );

  const unit = menuUnitPrice(item, customization);

  function toggle(list: string[], id: string, setList: (next: string[]) => void) {
    setList(list.includes(id) ? list.filter((value) => value !== id) : [...list, id]);
  }

  return (
    <div className="mt-6 space-y-5">
      {showRemovals && (
        <fieldset>
          <legend className="text-sm font-semibold text-black">Retirar ingredientes</legend>
          <p className="mt-1 text-xs text-neutral-500">Não altera o preço.</p>
          <div className="mt-3 space-y-2">
            {ingredients.map((ingredient) => (
              <label key={ingredient.id} className="flex items-center gap-2 text-sm text-neutral-800">
                <input
                  type="checkbox"
                  checked={removed.includes(ingredient.id)}
                  onChange={() => toggle(removed, ingredient.id, setRemoved)}
                />
                Sem {ingredient.nome}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {showComplements && (
        <fieldset>
          <legend className="text-sm font-semibold text-black">Incluir complementos</legend>
          <div className="mt-3 space-y-2">
            {complements.map((complement) => (
              <label key={complement.id} className="flex items-center justify-between gap-3 text-sm text-neutral-800">
                <span className="flex items-center gap-2">
                  <ChoiceCheckbox
                    checked={added.includes(complement.id)}
                    onChange={() => toggle(added, complement.id, setAdded)}
                  />
                  {complement.nome}
                </span>
                {complement.cobra && (
                  <span className="text-neutral-500">
                    + {formatBRL(Number(complement.preco ?? 0))}
                  </span>
                )}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {(showRemovals || showComplements) && (
        <p className="text-sm text-neutral-700">
          Preço desta escolha: <span className="font-semibold text-black">{formatBRL(unit)}</span>
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded border border-neutral-300">
          <button
            onClick={() => setQty((current) => Math.max(1, current - 1))}
            className="px-3 py-2 text-neutral-600 hover:text-black"
            aria-label="Diminuir"
          >
            −
          </button>
          <span className="w-10 text-center text-sm font-medium">{qty}</span>
          <button
            onClick={() => setQty((current) => current + 1)}
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
            addToCart(item, qty, customization);
            router.push(`/${tenant}/carrinho`);
          }}
        >
          <IconCart className="h-4 w-4" /> Adicionar ao carrinho
        </Button>
      </div>
    </div>
  );
}
