"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartItem, MenuItem } from "./types";

interface CartState {
  cart: CartItem[];
  addToCart: (item: MenuItem, qty?: number) => void;
  removeFromCart: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, qty: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartState | null>(null);

function unitPrice(item: MenuItem) {
  return item.preco_promocional ?? item.preco;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = useCallback((menuItem: MenuItem, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.menuItem.id === menuItem.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItem.id === menuItem.id
            ? { ...i, quantidade: i.quantidade + qty }
            : i
        );
      }
      return [...prev, { menuItem, quantidade: qty }];
    });
  }, []);

  const removeFromCart = useCallback((menuItemId: string) => {
    setCart((prev) => prev.filter((i) => i.menuItem.id !== menuItemId));
  }, []);

  const updateQuantity = useCallback((menuItemId: string, qty: number) => {
    setCart((prev) => {
      if (qty <= 0) return prev.filter((i) => i.menuItem.id !== menuItemId);
      return prev.map((i) =>
        i.menuItem.id === menuItemId ? { ...i, quantidade: qty } : i
      );
    });
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartCount = useMemo(
    () => cart.reduce((s, i) => s + i.quantidade, 0),
    [cart]
  );

  const cartTotal = useMemo(
    () => cart.reduce((s, i) => s + unitPrice(i.menuItem) * i.quantidade, 0),
    [cart]
  );

  const value = useMemo(
    () => ({
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartCount,
      cartTotal,
    }),
    [cart, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
