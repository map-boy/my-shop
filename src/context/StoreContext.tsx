// FILE: src/context/StoreContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DEFAULT_SETTINGS, mergeSettings } from '../lib/defaults';
import type { Category, Product, StoreSettings } from '../lib/types';
import { contrastOn, currencyLabel, formatMoney } from '../lib/utils';
import { toUgx, loadCurrency, saveCurrency, detectCurrency, type DisplayCurrency } from '../lib/geoCurrency';

interface StoreState {
  settings: StoreSettings;
  categories: Category[];
  products: Product[];
  /** Only `active` products — what shoppers are allowed to see. */
  liveProducts: Product[];
  loading: boolean;
  /** True once settings AND products have answered from Firestore. */
  ready: boolean;
  /** Set when Firestore cannot be reached, so the UI can explain itself. */
  error: string | null;
  money: (amount: number) => string;
  displayCurrency: DisplayCurrency;
  setDisplayCurrency: (c: DisplayCurrency) => void;
}

const StoreContext = createContext<StoreState | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingsReady, setSettingsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayCurrency, setDisplayCurrencyState] = useState<DisplayCurrency>(() => loadCurrency() || 'RWF');
  const setDisplayCurrency = (c: DisplayCurrency) => { setDisplayCurrencyState(c); saveCurrency(c); };
  useEffect(() => {
    if (!loadCurrency()) detectCurrency().then(setDisplayCurrencyState);
  }, []);

  /* Settings — live, so an admin's edit shows up on every open tab. */
  useEffect(
    () =>
      onSnapshot(
        doc(db, 'settings', 'store'),
        (snap) => { setSettings(mergeSettings(snap.exists() ? (snap.data() as StoreSettings) : null)); setSettingsReady(true); },
        (err) => { setError(err.message); setSettingsReady(true); },
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

    // document.title is set (translated) in LanguageProvider
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', settings.seo.description);
  }, [settings]);

  const value = useMemo<StoreState>(
    () => ({
      settings,
      categories,
      products,
      liveProducts: products.filter((p) => p.status === 'active'),
      ready: settingsReady && !loading,
      displayCurrency,
      setDisplayCurrency,
      loading,
      error,
      money: (amount: number) =>
        formatMoney(displayCurrency === 'UGX' && settings.currency === 'RWF' ? toUgx(amount) : amount, {
          symbol: displayCurrency === 'UGX' && settings.currency === 'RWF' ? 'UGX' : currencyLabel(settings.currencySymbol || settings.currency),
          position: settings.currencyPosition,
          locale: settings.locale,
        }),
    }),
    [settings, categories, products, loading, settingsReady, error, displayCurrency],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export function useStore(): StoreState {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}
