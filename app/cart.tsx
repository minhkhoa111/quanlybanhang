"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

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
  isLoggedIn: boolean;
  openLoginModal: () => void;
  addItem: (item: Omit<CartLine, "key" | "quantity">, quantity?: number) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
};

const defaultCartContext: CartContextValue = {
  items: [],
  count: 0,
  subtotal: 0,
  isLoggedIn: false,
  openLoginModal: () => {},
  addItem: () => {},
  updateQuantity: () => {},
  removeItem: () => {},
  clearCart: () => {},
};

type GlobalWithCart = typeof globalThis & {
  __HUY_CART_CONTEXT__?: React.Context<CartContextValue | null>;
};

const CartContext =
  (globalThis as GlobalWithCart).__HUY_CART_CONTEXT__ ||
  ((globalThis as GlobalWithCart).__HUY_CART_CONTEXT__ = createContext<CartContextValue | null>(null));

const STORAGE_KEY = "huy-apple-cart-v1";
const PENDING_ITEM_KEY = "infinity-pending-cart-item";


import CartToast from "./components/CartToast";
import SmemberLoginModal from "./components/SmemberLoginModal";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [lastAdded, setLastAdded] = useState<CartLine | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/account/me");
      const data = await res.json();
      setIsLoggedIn(Boolean(data?.customer));
    } catch {
      setIsLoggedIn(false);
    }
  }, []);

  useEffect(() => {
    const task = window.setTimeout(() => { void checkAuth(); }, 0);
    const handleAuthChange = () => { void checkAuth(); };
    window.addEventListener("huy-account-change", handleAuthChange);
    return () => {
      window.clearTimeout(task);
      window.removeEventListener("huy-account-change", handleAuthChange);
    };
  }, [checkAuth]);

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

  // Resume the exact product the customer selected before the login prompt.
  // Keeping this in sessionStorage lets the intent survive the /member round-trip.
  useEffect(() => {
    if (!ready || !isLoggedIn) return;
    const task = window.setTimeout(() => {
      try {
        const pending = JSON.parse(sessionStorage.getItem(PENDING_ITEM_KEY) || "null") as CartLine | null;
        if (!validCartLine(pending)) return;
        setItems((current) => mergeCartLine(current, pending));
        setLastAdded(pending);
        setShowLoginModal(false);
        sessionStorage.removeItem(PENDING_ITEM_KEY);
      } catch {
        sessionStorage.removeItem(PENDING_ITEM_KEY);
      }
    }, 0);
    return () => window.clearTimeout(task);
  }, [isLoggedIn, ready]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    count: items.reduce((total, item) => total + item.quantity, 0),
    subtotal: items.reduce((total, item) => total + item.unitPrice * item.quantity, 0),
    isLoggedIn,
    openLoginModal() { setShowLoginModal(true); },
    addItem(item, quantity = 1) {
      const key = cartKey(item);
      const safeQty = Math.min(10, Math.max(1, quantity));
      const newItem: CartLine = { ...item, key, quantity: safeQty };
      if (!isLoggedIn) {
        sessionStorage.setItem(PENDING_ITEM_KEY, JSON.stringify(newItem));
        setShowLoginModal(true);
        return;
      }
      setItems((current) => {
        const updated = mergeCartLine(current, newItem);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
      setLastAdded(newItem);
    },
    updateQuantity(key, quantity) { setItems((current) => current.map((item) => item.key === key ? { ...item, quantity: Math.min(10, Math.max(1, quantity)) } : item)); },
    removeItem(key) { setItems((current) => current.filter((item) => item.key !== key)); },
    clearCart() { setItems([]); },
  }), [items, isLoggedIn]);

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartToast item={lastAdded} totalCount={value.count} onClose={() => setLastAdded(null)} />
      <SmemberLoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  return context || defaultCartContext;
}

function cartKey(item: Pick<CartLine, "productSlug" | "ram" | "storage" | "color">) {
  return [item.productSlug, item.ram, item.storage, item.color].map((value) => value.trim().toLowerCase()).join("|");
}

function validCartLine(item: unknown): item is CartLine {
  if (!item || typeof item !== "object") return false;
  const line = item as Partial<CartLine>;
  return Boolean(line.key && line.productSlug && line.productName && Number(line.unitPrice) > 0 && Number(line.quantity) > 0);
}

function mergeCartLine(items: CartLine[], incoming: CartLine) {
  const existing = items.find((line) => line.key === incoming.key);
  if (!existing) return [...items, incoming];
  return items.map((line) => line.key === incoming.key
    ? { ...line, quantity: Math.min(10, line.quantity + incoming.quantity) }
    : line);
}
