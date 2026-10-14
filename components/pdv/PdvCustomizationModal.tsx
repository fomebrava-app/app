"use client";

import { useMemo, useState } from "react";
import { ChoiceCheckbox } from "@/components/public/ChoiceCheckbox";
import { Button, Modal } from "@/components/ui";
import { menuUnitPrice } from "@/lib/customization";
import { formatBRL } from "@/lib/format";
import type { CartCustomization, MenuItem, MenuItemComplement, MenuItemIngredient } from "@/lib/types";

export function PdvCustomizationModal({
  item,
  ingredients,
  complements,
  onClose,
  onConfirm,
}: {
  item: MenuItem;
  ingredients: MenuItemIngredient[];
  complements: MenuItemComplement[];
  onClose: () => void;
  onConfirm: (customization: CartCustomization) => void;
}) {
  const [removed, setRemoved] = useState<string[]>([]);
  const [added, setAdded] = useState<string[]>([]);

  const customization = useMemo<CartCustomization>(
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

  function toggle(list: string[], id: string, setList: (next: string[]) => void) {
    setList(list.includes(id) ? list.filter((value) => value !== id) : [...list, id]);
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={item.nome}
      footer={
        <>
          <Button type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" variant="primary" onClick={() => onConfirm(customization)}>
            Adicionar
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {ingredients.length > 0 && (
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

        {complements.length > 0 && (
          <fieldset>
            <legend className="text-sm font-semibold text-black">Incluir complementos</legend>
            <div className="mt-3 space-y-2">
              {complements.map((complement) => (
                <label
                  key={complement.id}
                  className="flex items-center justify-between gap-3 text-sm text-neutral-800"
                >
                  <span className="flex items-center gap-2">
                    <ChoiceCheckbox
                      checked={added.includes(complement.id)}
                      onChange={() => toggle(added, complement.id, setAdded)}
                    />
                    {complement.nome}
                  </span>
                  {complement.cobra && (
                    <span className="text-neutral-500">+ {formatBRL(Number(complement.preco ?? 0))}</span>
                  )}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <p className="text-sm text-neutral-700">
          Preço desta escolha:{" "}
          <span className="font-semibold text-black">{formatBRL(menuUnitPrice(item, customization))}</span>
        </p>
      </div>
    </Modal>
  );
}
