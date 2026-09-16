import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "./data";

export type Route =
  // public
  | { name: "landing" }
  | { name: "product"; id: number }
  | { name: "checkout" }
  // admin
  | { name: "login" }
  | { name: "overview" }
  | { name: "products" }
  | { name: "product-form"; id?: number }
  | { name: "inventory" }
  | { name: "finance" }
  | { name: "customers" }
  | { name: "pdv" }
  | { name: "settings" };

export interface CartItem {
  product: Product;
  quantidade: number;
}

interface AppState {
  route: Route;
  navigate: (r: Route) => void;
  cart: CartItem[];
  addToCart: (p: Product, qty?: number) => void;
  cartCount: number;
  clearCart: () => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>({ name: "landing" });
  const [cart, setCart] = useState<CartItem[]>([]);

  const navigate = useCallback((r: Route) => {
    setRoute(r);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  const addToCart = useCallback((p: Product, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === p.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === p.id
            ? { ...i, quantidade: i.quantidade + qty }
            : i
        );
      }
      return [...prev, { product: p, quantidade: qty }];
    });
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartCount = useMemo(
    () => cart.reduce((s, i) => s + i.quantidade, 0),
    [cart]
  );

  const value = useMemo(
    () => ({ route, navigate, cart, addToCart, cartCount, clearCart }),
    [route, navigate, cart, addToCart, cartCount, clearCart]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
