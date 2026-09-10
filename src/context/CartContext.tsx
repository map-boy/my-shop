// FILE: src/context/CartContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Product } from '../lib/types';

export interface CartLine {
  productId: string;
  name: string;
  image: string;
  price: number;
  qty: number;
  variant: string;
  stock: number;
  trackStock: boolean;
  sellerId: string;
  sellerName: string;
}

interface CartState {
  lines: CartLine[];
  count: number;
  subtotal: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (product: Product, qty?: number, variant?: string) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  lineKey: (line: CartLine) => string;
}

const CartContext = createContext<CartState | undefined>(undefined);
const STORAGE_KEY = 'my-shop.cart.v1';

const keyOf = (l: { productId: string; variant: string }) => `${l.productId}::${l.variant}`;

function readStored(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lines, setLines] = useState<CartLine[]>(readStored);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* storage blocked — the cart simply will not survive a reload */
    }
  }, [lines]);

  const add: CartState['add'] = (product, qty = 1, variant = '') => {
    setLines((prev) => {
      const key = keyOf({ productId: product.id, variant });
      const existing = prev.find((l) => keyOf(l) === key);
      const cap = product.trackStock ? Math.max(0, product.stock) : Infinity;

      if (existing) {
        return prev.map((l) =>
          keyOf(l) === key ? { ...l, qty: Math.min(cap, l.qty + qty) } : l,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          image: product.images?.[0] ?? '',
          price: product.price,
          qty: Math.min(cap, qty),
          variant,
          stock: product.stock,
          trackStock: product.trackStock,
          sellerId: product.sellerId ?? '',
          sellerName: product.sellerName ?? '',
        },
      ];
    });
    setOpen(true);
  };

  const setQty: CartState['setQty'] = (key, qty) =>
    setLines((prev) =>
      prev
        .map((l) => {
          if (keyOf(l) !== key) return l;
          const cap = l.trackStock ? Math.max(0, l.stock) : Infinity;
          return { ...l, qty: Math.max(0, Math.min(cap, qty)) };
        })
        .filter((l) => l.qty > 0),
    );

  const remove: CartState['remove'] = (key) =>
    setLines((prev) => prev.filter((l) => keyOf(l) !== key));

  const value = useMemo<CartState>(() => {
    const count = lines.reduce((n, l) => n + l.qty, 0);
    const subtotal = lines.reduce((n, l) => n + l.qty * l.price, 0);
    return {
      lines,
      count,
      subtotal,
      open,
      setOpen,
      add,
      setQty,
      remove,
      clear: () => setLines([]),
      lineKey: keyOf,
    };
  }, [lines, open]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export function useCart(): CartState {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
