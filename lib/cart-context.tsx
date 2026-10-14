"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cartUnitPrice, EMPTY_CUSTOMIZATION, lineIdFor } from "./customization";
import type { CartCustomization, CartItem, MenuItem } from "./types";

interface CartState {
  cart: CartItem[];
  addToCart: (item: MenuItem, qty?: number, customization?: CartCustomization) => void;
  removeFromCart: (lineId: string) => void;
  updateQuantity: (lineId: string, qty: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = useCallback(
    (menuItem: MenuItem, qty = 1, customization: CartCustomization = EMPTY_CUSTOMIZATION) => {
      const lineId = lineIdFor(menuItem.id, customization);
      setCart((prev) => {
        const existing = prev.find((item) => item.lineId === lineId);
        if (existing) {
          return prev.map((item) =>
            item.lineId === lineId ? { ...item, quantidade: item.quantidade + qty } : item
          );
        }
        return [...prev, { lineId, menuItem, quantidade: qty, customization }];
      });
    },
    []
  );

  const removeFromCart = useCallback((lineId: string) => {
    setCart((prev) => prev.filter((item) => item.lineId !== lineId));
  }, []);

  const updateQuantity = useCallback((lineId: string, qty: number) => {
    setCart((prev) => {
      if (qty <= 0) return prev.filter((item) => item.lineId !== lineId);
      return prev.map((item) => (item.lineId === lineId ? { ...item, quantidade: qty } : item));
    });
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantidade, 0), [cart]);

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + cartUnitPrice(item) * item.quantidade, 0),
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
