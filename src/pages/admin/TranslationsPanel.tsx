import React, { useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { Search } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { DICT, LANGS, fsKey, textKey, type Lang } from '../../lib/i18n';
import { Input, Select, Textarea } from '../../components/ui';
import type { StoreSettings } from '../../lib/types';
import { cn, errorMessage } from '../../lib/utils';
import { db } from '../../lib/firebase';
import { translateMissing } from '../../lib/autoTranslate';
import { useToast } from '../../context/ToastContext';

type Store = Record<string, Record<string, string>>;

interface Row {
  key: string;
  group: string;
  source: string;
  long: boolean;
  hint?: string;
}

/** Small hard-coded storefront labels that are also editable here. */
const LOOSE_TEXT = ['Curated', 'Just in', 'Popular', 'Browse', 'Reviews'];

interface Props {
  draft: StoreSettings;
  value: Store;
  onChange: (next: Store) => void;
}

const TranslationsPanel: React.FC<Props> = ({ draft, value, onChange }) => {
  const { products, categories } = useStore();
  const [lang, setLang] = useState<Lang>('fr');
  const [group, setGroup] = useState('');
  const [term, setTerm] = useState('');
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [autoDoc, setAutoDoc] = useState<Record<string, string>>({});
  useEffect(() => {
    if (lang === 'en') { setAutoDoc({}); return undefined; }
    return onSnapshot(
      doc(db, 'translations', lang),
      (s) => setAutoDoc((s.data() as { m?: Record<string, string> } | undefined)?.m ?? {}),
      () => undefined,
    );
  }, [lang]);

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    const seen = new Set<string>();
    const add = (grp: string, text?: string) => {
      if (!text || !text.trim()) return;
      const key = textKey(text);
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ key, group: grp, source: text, long: text.length > 70 || text.includes('\n') });
    };

    Object.keys(DICT.en).forEach((k) =>
      out.push({ key: fsKey(k), group: 'Interface text', source: DICT.en[k], long: DICT.en[k].length > 70, hint: k }),
    );

    const home = 'Home page and banners';
    add(home, draft.announcement?.text);
    (draft.hero?.slides ?? []).forEach((s) => {
      add(home, s.eyebrow);
      add(home, s.title);
      add(home, s.subtitle);
      add(home, s.ctaText);
      add(home, s.ctaSecondaryText);
    });
    [draft.categoriesSection, draft.featuredSection, draft.newArrivalsSection, draft.bestSellersSection, draft.testimonialsSection].forEach((s) => {
      add(home, s?.title);
      add(home, s?.subtitle);
    });
    add(home, draft.newsletterSection?.title);
    add(home, draft.newsletterSection?.subtitle);
    add(home, draft.newsletterSection?.buttonText);
    [draft.promoA, draft.promoB].forEach((p) => {
      add(home, p?.eyebrow);
      add(home, p?.title);
      add(home, p?.text);
      add(home, p?.ctaText);
    });
    (draft.valuePropsSection?.items ?? []).forEach((v) => {
      add(home, v.title);
      add(home, v.text);
    });
    LOOSE_TEXT.forEach((t) => add(home, t));

    const foot = 'Footer, delivery and contact';
    add(foot, draft.footer?.about);
    (draft.footer?.columns ?? []).forEach((c) => {
      add(foot, c.title);
      c.links.forEach((l) => add(foot, l.label));
    });
    add(foot, draft.footer?.copyright);
    add(foot, draft.footer?.paymentNote);
    add(foot, draft.shipping?.note);
    add(foot, draft.shipping?.banner?.text);
    add(foot, draft.payments?.instructions);
    add(foot, draft.contact?.hours);
    add(foot, draft.maintenance?.title);
    add(foot, draft.maintenance?.message);

    products.forEach((p) => {
      add('Products', p.name);
      add('Products', p.shortDescription);
      add('Products', p.description);
    });
    categories.forEach((c) => {
      add('Categories', c.name);
      add('Categories', c.description);
    });
    return out;
  }, [draft, products, categories]);

  const groups = useMemo(() => Array.from(new Set(rows.map((r) => r.group))), [rows]);

  const needle = term.trim().toLowerCase();
  const shown = rows.filter(
    (r) =>
      (!group || r.group === group) &&
      (!needle || r.source.toLowerCase().includes(needle) || (r.hint ?? '').toLowerCase().includes(needle)),
  );

  const filled = (l: Lang) => rows.filter((r) => value[l]?.[r.key]).length;

  const setText = (key: string, text: string) =>
    onChange({ ...value, [lang]: { ...(value[lang] ?? {}), [key]: text } });

  const translateAll = async () => {
    setBusy(true);
    try {
      const r = await translateMissing(rows.filter((x) => !x.hint).map((x) => x.source));
      if (r.failed) toast.error(`${r.failed} texts could not be translated. Press the button again to retry.`);
      else toast.success(r.added ? `Translated ${r.added} new texts.` : 'Everything is already translated.');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-xs leading-relaxed text-ink-400">
        Pick a language, then type the translation under each text. Empty boxes use the built-in translation
        (interface text) or the automatic translation shown in grey (everything else). Editing the original text of a banner or product
        makes it show up here again as a new line to translate. Press Save at the bottom when you are done.
      </p>

      <div className="flex flex-wrap gap-2">
        {LANGS.map((l) => (
          <button
            key={l.code}
            type="button"
            onClick={() => setLang(l.code)}
            className={cn(
              'rounded-xl px-4 py-2.5 text-[13px] font-semibold transition',
              lang === l.code ? 'bg-accent text-ink-950' : 'bg-white/5 text-ink-300 hover:bg-white/10',
            )}
          >
            {l.label} <span className="opacity-60">{filled(l.code)}/{rows.length}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
          <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search text..." className="pl-10" />
        </div>
        <div className="w-60">
          <Select value={group} onChange={(e) => setGroup(e.target.value)}>
            <option value="">All groups</option>
            {groups.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </Select>
        </div>
      </div>

            <button
        type="button"
        onClick={translateAll}
        disabled={busy}
        className="rounded-xl bg-accent px-4 py-2.5 text-[13px] font-semibold text-ink-950 transition hover:brightness-95 disabled:opacity-50"
      >
        {busy ? 'Translating...' : 'Translate everything now'}
      </button>

      <p className="text-[11px] text-ink-500">{shown.length} texts</p>

      <div className="space-y-4">
        {shown.slice(0, 250).map((r) => {
          const cur = value[lang]?.[r.key] ?? '';
          const fallback = r.hint ? (DICT[lang][r.hint] ?? '') : (autoDoc[r.key] ?? '');
          return (
            <div key={`${r.group}-${r.key}`} className="rounded-xl border border-white/10 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-500">
                {r.group}{r.hint ? ` - ${r.hint}` : ''}
              </p>
              <p className="mt-1 whitespace-pre-line text-sm text-ink-300">{r.source}</p>
              <div className="mt-3">
                {r.long ? (
                  <Textarea
                    value={cur}
                    dir={lang === 'ar' ? 'rtl' : 'ltr'}
                    placeholder={fallback}
                    onChange={(e) => setText(r.key, e.target.value)}
                    className="min-h-24"
                  />
                ) : (
                  <Input
                    value={cur}
                    dir={lang === 'ar' ? 'rtl' : 'ltr'}
                    placeholder={fallback}
                    onChange={(e) => setText(r.key, e.target.value)}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
      {shown.length > 250 && (
        <p className="text-[11px] text-amber-300">Showing the first 250. Use search or the group filter to reach the rest.</p>
      )}
    </div>
  );
};

export default TranslationsPanel;