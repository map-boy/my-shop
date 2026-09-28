import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { EXTRA } from './i18n-extra';
import { MORE } from './i18n-more';
import { useStore } from '../context/StoreContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

export type Lang = 'en' | 'fr' | 'ar' | 'rw';

export const LANGS: { code: Lang; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Fran\u00e7ais' },
  { code: 'ar', label: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629' },
  { code: 'rw', label: 'Kinyarwanda' },
];

type Dict = Record<string, string>;

const en: Dict = {
  'nav.home': 'Home', 'nav.shop': 'Shop', 'nav.categories': 'Categories', 'nav.about': 'About', 'nav.contact': 'Contact',
  search: 'Search products\u2026',
  soldOut: 'Sold out', inStock: 'In stock', onlyLeft: 'Only {n} left', save: 'Save {n}%',
  share: 'Share to Status', preparing: 'Preparing link...',
  freeOver: 'Free over {amount}', fastDelivery: 'Fast delivery', returns: '7-day easy returns', secure: 'Secure checkout',
  description: 'Description', deliveryReturns: 'Delivery & returns',
  orderWhatsapp: 'Order on WhatsApp', addToBag: 'Add to bag', chooseOption: 'Please choose an option first.',
  waMessage: 'Hello, I would like to order: {name} x{qty} - {price}',
};

const fr: Dict = {
  'nav.home': 'Accueil', 'nav.shop': 'Boutique', 'nav.categories': 'Cat\u00e9gories', 'nav.about': '\u00c0 propos', 'nav.contact': 'Contact',
  search: 'Rechercher des produits\u2026',
  soldOut: '\u00c9puis\u00e9', inStock: 'En stock', onlyLeft: 'Plus que {n} en stock', save: '-{n}%',
  share: 'Partager en statut', preparing: 'Pr\u00e9paration...',
  freeOver: 'Livraison gratuite d\u00e8s {amount}', fastDelivery: 'Livraison rapide', returns: 'Retours faciles sous 7 jours', secure: 'Paiement s\u00e9curis\u00e9',
  description: 'Description', deliveryReturns: 'Livraison et retours',
  orderWhatsapp: 'Commander sur WhatsApp', addToBag: 'Ajouter au panier', chooseOption: 'Veuillez d\u2019abord choisir une option.',
  waMessage: 'Bonjour, je souhaite commander : {name} x{qty} - {price}',
};

const ar: Dict = {
  'nav.home': '\u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629', 'nav.shop': '\u0627\u0644\u0645\u062a\u062c\u0631', 'nav.categories': '\u0627\u0644\u0641\u0626\u0627\u062a', 'nav.about': '\u0645\u0646 \u0646\u062d\u0646', 'nav.contact': '\u0627\u062a\u0635\u0644 \u0628\u0646\u0627',
  search: '\u0627\u0628\u062d\u062b \u0639\u0646 \u0645\u0646\u062a\u062c\u0627\u062a\u2026',
  soldOut: '\u0646\u0641\u062f \u0627\u0644\u0645\u062e\u0632\u0648\u0646', inStock: '\u0645\u062a\u0648\u0641\u0631', onlyLeft: '\u0628\u0642\u064a\u062a {n} \u0641\u0642\u0637', save: '\u0648\u0641\u0651\u0631 {n}%',
  share: '\u0634\u0627\u0631\u0643 \u0641\u064a \u0627\u0644\u062d\u0627\u0644\u0629', preparing: '\u062c\u0627\u0631\u064d \u0627\u0644\u062a\u062d\u0636\u064a\u0631...',
  freeOver: '\u062a\u0648\u0635\u064a\u0644 \u0645\u062c\u0627\u0646\u064a \u0641\u0648\u0642 {amount}', fastDelivery: '\u062a\u0648\u0635\u064a\u0644 \u0633\u0631\u064a\u0639', returns: '\u0625\u0631\u062c\u0627\u0639 \u0633\u0647\u0644 \u062e\u0644\u0627\u0644 7 \u0623\u064a\u0627\u0645', secure: '\u062f\u0641\u0639 \u0622\u0645\u0646',
  description: '\u0627\u0644\u0648\u0635\u0641', deliveryReturns: '\u0627\u0644\u062a\u0648\u0635\u064a\u0644 \u0648\u0627\u0644\u0625\u0631\u062c\u0627\u0639',
  orderWhatsapp: '\u0627\u0637\u0644\u0628 \u0639\u0628\u0631 \u0648\u0627\u062a\u0633\u0627\u0628', addToBag: '\u0623\u0636\u0641 \u0625\u0644\u0649 \u0627\u0644\u0633\u0644\u0629', chooseOption: '\u064a\u0631\u062c\u0649 \u0627\u062e\u062a\u064a\u0627\u0631 \u062e\u064a\u0627\u0631 \u0623\u0648\u0644\u0627\u064b.',
  waMessage: '\u0645\u0631\u062d\u0628\u0627\u064b\u060c \u0623\u0631\u063a\u0628 \u0641\u064a \u0637\u0644\u0628: {name} x{qty} - {price}',
};

const rw: Dict = {
  'nav.home': 'Ahabanza', 'nav.shop': 'Iduka', 'nav.categories': 'Ibyiciro', 'nav.about': 'Abo turi bo', 'nav.contact': 'Twandikire',
  search: 'Shakisha ibicuruzwa\u2026',
  soldOut: 'Byashize', inStock: 'Birahari', onlyLeft: 'Hasigaye {n} gusa', save: 'Igabanywa rya {n}%',
  share: 'Sangiza kuri Status', preparing: 'Biri gutegurwa...',
  freeOver: 'Ubwikorezi ni ubuntu hejuru ya {amount}', fastDelivery: 'Kugezwaho vuba', returns: 'Gusubiza mu minsi 7', secure: 'Kwishyura bifite umutekano',
  description: 'Ibisobanuro', deliveryReturns: 'Ubwikorezi no gusubiza',
  orderWhatsapp: 'Tumiza kuri WhatsApp', addToBag: 'Shyira mu gaseke', chooseOption: 'Banza uhitemo.',
  waMessage: 'Muraho, nifuza gutumiza: {name} x{qty} - {price}',
};

export const DICT: Record<Lang, Dict> = {
  en: { ...en, ...EXTRA.en, ...MORE.en },
  fr: { ...fr, ...EXTRA.fr, ...MORE.fr },
  ar: { ...ar, ...EXTRA.ar, ...MORE.ar },
  rw: { ...rw, ...EXTRA.rw, ...MORE.rw },
};

/** Firestore-safe key for an interface string (no dots). */
export const fsKey = (k: string) => k.replace(/\./g, '_');

/** Stable key for admin-translated free text (banners, products, categories...). */
export function textKey(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h * 33) ^ text.charCodeAt(i)) >>> 0;
  return 'h' + h.toString(36) + text.length.toString(36);
}

/** Saved choice > browser language > English. */
function detect(): Lang {
  try {
    const saved = localStorage.getItem('lang');
    if (saved === 'en' || saved === 'fr' || saved === 'ar' || saved === 'rw') return saved;
  } catch { /* storage blocked */ }
  const list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];
  for (const l of list) {
    const c = (l || '').toLowerCase().split('-')[0];
    if (c === 'rw' || c === 'kin') return 'rw';
    if (c === 'fr' || c === 'ar' || c === 'en') return c as Lang;
  }
  return 'en';
}

interface I18n {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  /** Translates free text (banner, product name...) using the admin's translations; falls back to the text itself. */
  tx: (text: string) => string;
}

const Ctx = createContext<I18n | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(detect);
  const { settings } = useStore();
  const overrides = settings.translations?.[lang];
  const [auto, setAuto] = useState<Record<string, string>>({});
  useEffect(() => {
    if (lang === 'en') { setAuto({}); return undefined; }
    const ck = 'autoTx.' + lang;
    try { const c = localStorage.getItem(ck); setAuto(c ? JSON.parse(c) : {}); } catch { setAuto({}); }
    return onSnapshot(
      doc(db, 'translations', lang),
      (s) => {
        const m = (s.data() as { m?: Record<string, string> } | undefined)?.m ?? {};
        setAuto(m);
        try { localStorage.setItem(ck, JSON.stringify(m)); } catch { /* storage full */ }
      },
      () => undefined,
    );
  }, [lang]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem('lang', l); } catch { /* ignore */ }
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      let s = overrides?.[fsKey(key)] || DICT[lang][key] || DICT.en[key] || key;
      if (vars) for (const k of Object.keys(vars)) s = s.split('{' + k + '}').join(String(vars[k]));
      return s;
    },
    [lang, overrides],
  );

  const tx = useCallback(
    (text: string) => (text && (overrides?.[textKey(text)] || auto[textKey(text)])) || text,
    [overrides, auto],
  );

  const value = useMemo(() => ({ lang, setLang, t, tx }), [lang, setLang, t, tx]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export function useI18n(): I18n {
  const c = useContext(Ctx);
  if (!c) throw new Error('useI18n must be used inside <LanguageProvider>');
  return c;
}