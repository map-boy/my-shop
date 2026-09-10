// FILE: src/context/StoreContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DEFAULT_SETTINGS, mergeSettings } from '../lib/defaults';
import type { Category, Product, StoreSettings } from '../lib/types';
import { contrastOn, formatMoney } from '../lib/utils';

interface StoreState {
  settings: StoreSettings;
  categories: Category[];
  products: Product[];
  /** Only `active` products — what shoppers are allowed to see. */
  liveProducts: Product[];
  loading: boolean;
  /** Set when Firestore cannot be reached, so the UI can explain itself. */
  error: string | null;
  money: (amount: number) => string;
}

const StoreContext = createContext<StoreState | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* Settings — live, so an admin's edit shows up on every open tab. */
  useEffect(
    () =>
      onSnapshot(
        doc(db, 'settings', 'store'),
        (snap) => setSettings(mergeSettings(snap.exists() ? (snap.data() as StoreSettings) : null)),
        (err) => setError(err.message),
      ),
    [],
  );

  /* Categories */
  useEffect(
    () =>
      onSnapshot(
        query(collection(db, 'categories'), orderBy('order', 'asc')),
        (snap) => setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Category)),
        () => setCategories([]),
      ),
    [],
  );

  /* Products */
  useEffect(
    () =>
      onSnapshot(
        query(collection(db, 'products'), orderBy('createdAt', 'desc')),
        (snap) => {
          setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product));
          setLoading(false);
        },
        (err) => {
          setError(err.message);
          setLoading(false);
        },
      ),
    [],
  );

  /* Push the brand palette into CSS custom properties. */
  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty('--brand', settings.brandColor);
    root.setProperty('--brand-contrast', contrastOn(settings.brandColor));
    root.setProperty('--accent', settings.accentColor);
    root.setProperty('--accent-contrast', contrastOn(settings.accentColor));
    root.setProperty('--radius', `${settings.radius}px`);
    root.setProperty('--heading-font', settings.headingFont);

    document.title = settings.seo.title || settings.storeName;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', settings.seo.description);
  }, [settings]);

  const value = useMemo<StoreState>(
    () => ({
      settings,
      categories,
      products,
      liveProducts: products.filter((p) => p.status === 'active'),
      loading,
      error,
      money: (amount: number) =>
        formatMoney(amount, {
          symbol: settings.currencySymbol || settings.currency,
          position: settings.currencyPosition,
          locale: settings.locale,
        }),
    }),
    [settings, categories, products, loading, error],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export function useStore(): StoreState {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}
