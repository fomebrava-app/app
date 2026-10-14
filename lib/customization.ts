import type { CartCustomization, CartItem, MenuItem } from "./types";

export const EMPTY_CUSTOMIZATION: CartCustomization = {
  removals: [],
  complements: [],
};

export function cartLineId(
  menuItemId: string,
  removalIds: string[],
  complementIds: string[]
) {
  return `${menuItemId}|${[...removalIds].sort().join(",")}|${[...complementIds].sort().join(",")}`;
}

export function lineIdFor(menuItemId: string, customization: CartCustomization = EMPTY_CUSTOMIZATION) {
  return cartLineId(
    menuItemId,
    customization.removals.map((item) => item.id),
    customization.complements.map((item) => item.id)
  );
}

export function cartUnitPrice(item: Pick<CartItem, "menuItem" | "customization">) {
  return menuUnitPrice(item.menuItem, item.customization);
}

export function menuUnitPrice(item: MenuItem, customization: CartCustomization = EMPTY_CUSTOMIZATION) {
  const base = item.preco_promocional ?? item.preco;
  const extra = customization.complements.reduce((sum, complement) => {
    if (!complement.cobra) return sum;
    return sum + Number(complement.preco ?? 0);
  }, 0);
  return base + extra;
}

export function paymentDescription(nome: string, retirados: string[], complementos: string[]) {
  const parts = [
    ...retirados.map((nomeRetirado) => `sem ${nomeRetirado}`),
    ...complementos.map((nomeComplemento) => `+ ${nomeComplemento}`),
  ];
  if (parts.length === 0) return nome;
  const full = `${nome} (${parts.join(", ")})`;
  return full.length > 120 ? `${full.slice(0, 117)}...` : full;
}
