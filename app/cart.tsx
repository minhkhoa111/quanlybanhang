"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartLine = {
  key: string;
  productSlug: string;
  productName: string;
  image: string;
  ram: string;
  storage: string;
  color: string;
  unitPrice: number;
  quantity: number;
};

type CartContextValue = {
  items: CartLine[];
  count: number;
  subtotal: number;
  addItem: (item: Omit<CartLine, "key" | "quantity">, quantity?: number) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "huy-apple-cart-v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const restore = window.setTimeout(() => {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        if (Array.isArray(saved)) setItems(saved.filter(validCartLine));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(restore);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, ready]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    count: items.reduce((total, item) => total + item.quantity, 0),
    subtotal: items.reduce((total, item) => total + item.unitPrice * item.quantity, 0),
    addItem(item, quantity = 1) {
      const key = cartKey(item);
      setItems((current) => {
        const existing = current.find((line) => line.key === key);
        if (existing) return current.map((line) => line.key === key ? { ...line, quantity: Math.min(10, line.quantity + quantity) } : line);
        return [...current, { ...item, key, quantity: Math.min(10, Math.max(1, quantity)) }];
      });
    },
    updateQuantity(key, quantity) { setItems((current) => current.map((item) => item.key === key ? { ...item, quantity: Math.min(10, Math.max(1, quantity)) } : item)); },
    removeItem(key) { setItems((current) => current.filter((item) => item.key !== key)); },
    clearCart() { setItems([]); },
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}

function cartKey(item: Pick<CartLine, "productSlug" | "ram" | "storage" | "color">) {
  return [item.productSlug, item.ram, item.storage, item.color].map((value) => value.trim().toLowerCase()).join("|");
}

function validCartLine(item: unknown): item is CartLine {
  if (!item || typeof item !== "object") return false;
  const line = item as Partial<CartLine>;
  return Boolean(line.key && line.productSlug && line.productName && Number(line.unitPrice) > 0 && Number(line.quantity) > 0);
}
