"use client";

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore } from "react";
import type { CartItem, CartProduct } from "@/types";
import { CART_STORAGE_KEY, MAX_CART_ITEMS, MAX_CART_QUANTITY, normalizeCartItems } from "@/utils/cart";

type CartContextValue = {
  items: CartItem[];
  totalQuantity: number;
  isOpen: boolean;
  addItem: (product: CartProduct) => void;
  setQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  getQuantity: (id: string) => number;
  openCart: () => void;
  closeCart: () => void;
};

const EMPTY_CART: CartItem[] = [];
const listeners = new Set<() => void>();
let cartSnapshot = EMPTY_CART;
let cartInitialized = false;

function emitCartChange() {
  listeners.forEach((listener) => listener());
}

function readStoredCart() {
  try {
    return normalizeCartItems(JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) || "[]"));
  } catch {
    return EMPTY_CART;
  }
}

function initializeCartStore() {
  if (cartInitialized || typeof window === "undefined") return;
  cartInitialized = true;
  cartSnapshot = readStoredCart();
  window.addEventListener("storage", (event) => {
    if (event.key !== CART_STORAGE_KEY) return;
    cartSnapshot = readStoredCart();
    emitCartChange();
  });
}

function subscribeToCart(listener: () => void) {
  initializeCartStore();
  listeners.add(listener);
  queueMicrotask(() => {
    if (listeners.has(listener)) listener();
  });
  return () => listeners.delete(listener);
}

function getCartSnapshot() {
  return cartSnapshot;
}

function getServerCartSnapshot() {
  return EMPTY_CART;
}

function updateCart(updater: (items: CartItem[]) => CartItem[]) {
  initializeCartStore();
  cartSnapshot = normalizeCartItems(updater(cartSnapshot));
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartSnapshot));
  emitCartChange();
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(subscribeToCart, getCartSnapshot, getServerCartSnapshot);
  const [isOpen, setIsOpen] = useState(false);

  const addItem = useCallback((product: CartProduct) => {
    updateCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) => item.id === product.id
          ? { ...product, quantity: Math.min(item.quantity + 1, MAX_CART_QUANTITY) }
          : item);
      }
      if (current.length >= MAX_CART_ITEMS) return current;
      return [...current, { ...product, quantity: 1 }];
    });
  }, []);

  const setQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      updateCart((current) => current.filter((item) => item.id !== id));
      return;
    }
    updateCart((current) => current.map((item) => item.id === id
      ? { ...item, quantity: Math.min(Math.round(quantity), MAX_CART_QUANTITY) }
      : item));
  }, []);

  const removeItem = useCallback((id: string) => {
    updateCart((current) => current.filter((item) => item.id !== id));
  }, []);

  const clearCart = useCallback(() => updateCart(() => EMPTY_CART), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const getQuantity = useCallback((id: string) => items.find((item) => item.id === id)?.quantity ?? 0, [items]);
  const totalQuantity = useMemo(() => items.reduce((total, item) => total + item.quantity, 0), [items]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    totalQuantity,
    isOpen,
    addItem,
    setQuantity,
    removeItem,
    clearCart,
    getQuantity,
    openCart,
    closeCart,
  }), [items, totalQuantity, isOpen, addItem, setQuantity, removeItem, clearCart, getQuantity, openCart, closeCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart debe usarse dentro de CartProvider.");
  return context;
}
