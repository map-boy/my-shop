// FILE: src/pages/admin/AdminHomeBuilder.tsx
import React from 'react';
import { ArrowDown, ArrowUp, ExternalLink, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSettingsDraft } from '../../hooks/useSettingsDraft';
import ImageInput from '../../components/ImageInput';
import SaveBar from '../../components/SaveBar';
import { Button, Field, Input, Select, Textarea, Toggle } from '../../components/ui';
import type { HeroSlide, StoreSettings } from '../../lib/types';
import { cn } from '../../lib/utils';

const SECTION_LABELS: Record<string, string> = {
  hero: 'Hero banner',
  valueProps: 'Trust badges',
  categories: 'Shop by category',
  featured: 'Featured products',
  promoA: 'Promo banner A',
  newArrivals: 'New arrivals',
  promoB: 'Promo banner B',
  bestSellers: 'Best sellers',
  testimonials: 'Testimonials',
  newsletter: 'Newsletter',
};

const BLANK_SLIDE: HeroSlide = {
  eyebrow: '', title: '', subtitle: '', image: '',
  ctaText: 'Shop now', ctaLink: '/shop',
  ctaSecondaryText: '', ctaSecondaryLink: '',
};

const ICON_OPTIONS = ['truck', 'shield', 'refresh', 'headphones', 'package', 'star', 'sparkles'];

const Panel: React.FC<{
  title: string;
  description?: string;
  enabled?: boolean;
  onToggle?: (v: boolean) => void;
  children: React.ReactNode;
}> = ({ title, description, enabled, onToggle, children }) => (
  <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 className="font-display text-xl font-bold text-white">{title}</h2>
        {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-400">{description}</p>}
      </div>
      {onToggle && (
        <button
          onClick={() => onToggle(!enabled)}
          className={cn(
            'flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider transition',
            enabled ? 'bg-accent text-ink-950' : 'border border-white/15 text-ink-400 hover:text-white',
          )}
        >
          {enabled ? <Eye size={14} /> : <EyeOff size={14} />}
          {enabled ? 'Visible' : 'Hidden'}
        </button>
      )}
    </div>
    <div className={cn('mt-7 space-y-5', onToggle && !enabled && 'pointer-events-none opacity-40')}>{children}</div>
  </section>
);

const AdminHomeBuilder: React.FC = () => {
  const { draft, set, setIn, save, reset, busy, dirty } = useSettingsDraft('home page');

  const order = draft.sectionOrder?.length ? draft.sectionOrder : Object.keys(SECTION_LABELS);

  const moveSection = (index: number, dir: -1 | 1) => {
    const next = [...order];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    set('sectionOrder', next);
  };

  const enabledOf = (key: string): boolean => {
    const map: Record<string, boolean> = {
      hero: draft.hero.enabled,
      valueProps: draft.valuePropsSection.enabled,
      categories: draft.categoriesSection.enabled,
      featured: draft.featuredSection.enabled,
      promoA: draft.promoA.enabled,
      newArrivals: draft.newArrivalsSection.enabled,
      promoB: draft.promoB.enabled,
      bestSellers: draft.bestSellersSection.enabled,
      testimonials: draft.testimonialsSection.enabled,
      newsletter: draft.newsletterSection.enabled,
    };
    return map[key] ?? true;
  };

  const patchSlide = (i: number, patch: Partial<HeroSlide>) =>
    setIn('hero', { slides: draft.hero.slides.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) });

  const rowSection = (
    key: 'featuredSection' | 'newArrivalsSection' | 'bestSellersSection',
    title: string,
    description: string,
  ) => {
    const cfg = draft[key] as StoreSettings['featuredSection'];
    return (
      <Panel
        title={title}
        description={description}
        enabled={cfg.enabled}
        onToggle={(v) => setIn(key, { enabled: v })}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Heading">
            <Input value={cfg.title} onChange={(e) => setIn(key, { title: e.target.value })} />
          </Field>
          <Field label="Sub-heading">
            <Input value={cfg.subtitle} onChange={(e) => setIn(key, { subtitle: e.target.value })} />
          </Field>
        </div>
        <Field label="How many products to show" hint="4 or 8 keeps the grid tidy.">
          <Input
            type="number"
            min={1}
            max={24}
            value={cfg.limit}
            onChange={(e) => setIn(key, { limit: Number(e.target.value) })}
          />
        </Field>
      </Panel>
    );
  };

  const promoSection = (key: 'promoA' | 'promoB', title: string) => {
    const p = draft[key];
    return (
      <Panel
        title={title}
        description="A wide image-and-text block. Use it for a sale, a delivery promise or a new collection."
        enabled={p.enabled}
        onToggle={(v) => setIn(key, { enabled: v })}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Eyebrow">
            <Input value={p.eyebrow} onChange={(e) => setIn(key, { eyebrow: e.target.value })} placeholder="Limited offer" />
          </Field>
          <Field label="Heading">
            <Input value={p.title} onChange={(e) => setIn(key, { title: e.target.value })} />
          </Field>
        </div>
        <Field label="Body text">
          <Textarea value={p.text} onChange={(e) => setIn(key, { text: e.target.value })} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Button text">
            <Input value={p.ctaText} onChange={(e) => setIn(key, { ctaText: e.target.value })} />
          </Field>
          <Field label="Button link">
            <Input value={p.ctaLink} onChange={(e) => setIn(key, { ctaLink: e.target.value })} placeholder="/shop" />
          </Field>
        </div>
        <ImageInput
          value={p.image ? [p.image] : []}
          onChange={(urls) => setIn(key, { image: urls[0] ?? '' })}
          max={1}
          compact
          folder="banners"
          label="Banner image"
        />
      </Panel>
    );
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">Storefront</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">Home builder</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-400">
            Every block on the home page — its wording, images, order and whether it shows at all.
          </p>
        </div>
        <Link to="/" target="_blank">
          <Button variant="outline" icon={<ExternalLink size={16} />} className="border-white/20 text-white hover:bg-white/10">
            Preview the shop
          </Button>
        </Link>
      </header>

      {/* Section order */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <h2 className="font-display text-xl font-bold text-white">Section order</h2>
        <p className="mt-2 text-sm text-ink-400">Top to bottom, exactly as shoppers scroll through it.</p>
        <ul className="mt-6 space-y-2">
          {order.map((key, i) => (
            <li
              key={key}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3"
            >
              <span className="w-6 text-center text-xs font-bold text-ink-600">{i + 1}</span>
              <span className={cn('flex-1 text-sm font-semibold', enabledOf(key) ? 'text-white' : 'text-ink-600 line-through')}>
                {SECTION_LABELS[key] ?? key}
              </span>
              {!enabledOf(key) && <span className="text-[10px] uppercase tracking-wider text-ink-600">hidden</span>}
              <button
                onClick={() => moveSection(i, -1)}
                disabled={i === 0}
                className="rounded-lg p-2 text-ink-400 transition hover:bg-white/10 hover:text-white disabled:opacity-25"
                aria-label="Move up"
              >
                <ArrowUp size={14} />
              </button>
              <button
                onClick={() => moveSection(i, 1)}
                disabled={i === order.length - 1}
                className="rounded-lg p-2 text-ink-400 transition hover:bg-white/10 hover:text-white disabled:opacity-25"
                aria-label="Move down"
              >
                <ArrowDown size={14} />
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Hero */}
      <Panel
        title="Hero banner"
        description="The full-width image at the very top. Add more than one slide to make it rotate."
        enabled={draft.hero.enabled}
        onToggle={(v) => setIn('hero', { enabled: v })}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Toggle
            checked={draft.hero.autoplay}
            onChange={(v) => setIn('hero', { autoplay: v })}
            label="Rotate slides automatically"
          />
          <Field label="Seconds per slide">
            <Input
              type="number"
              min={2}
              max={30}
              value={Math.round(draft.hero.interval / 1000)}
              onChange={(e) => setIn('hero', { interval: Math.max(2, Number(e.target.value)) * 1000 })}
            />
          </Field>
        </div>

        {draft.hero.slides.map((slide, i) => (
          <div key={i} className="rounded-xl border border-white/10 p-5">
            <div className="mb-5 flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">Slide {i + 1}</p>
              {draft.hero.slides.length > 1 && (
                <button
                  onClick={() => setIn('hero', { slides: draft.hero.slides.filter((_, idx) => idx !== i) })}
                  className="rounded-lg p-2 text-ink-400 transition hover:bg-red-500/20 hover:text-red-400"
                  aria-label="Remove slide"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>

            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Eyebrow" hint="Small text above the headline.">
                  <Input value={slide.eyebrow} onChange={(e) => patchSlide(i, { eyebrow: e.target.value })} />
                </Field>
                <Field label="Headline">
                  <Input value={slide.title} onChange={(e) => patchSlide(i, { title: e.target.value })} />
                </Field>
              </div>

              <Field label="Sub-headline">
                <Textarea value={slide.subtitle} onChange={(e) => patchSlide(i, { subtitle: e.target.value })} />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Main button text">
                  <Input value={slide.ctaText} onChange={(e) => patchSlide(i, { ctaText: e.target.value })} />
                </Field>
                <Field label="Main button link">
                  <Input value={slide.ctaLink} onChange={(e) => patchSlide(i, { ctaLink: e.target.value })} placeholder="/shop" />
                </Field>
                <Field label="Second button text" hint="Leave empty to show only one button.">
                  <Input value={slide.ctaSecondaryText} onChange={(e) => patchSlide(i, { ctaSecondaryText: e.target.value })} />
                </Field>
                <Field label="Second button link">
                  <Input value={slide.ctaSecondaryLink} onChange={(e) => patchSlide(i, { ctaSecondaryLink: e.target.value })} />
                </Field>
              </div>

              <ImageInput
                value={slide.image ? [slide.image] : []}
                onChange={(urls) => patchSlide(i, { image: urls[0] ?? '' })}
                max={1}
                compact
                folder="hero"
                label="Background image"
                hint="Wide and bright works best — text sits on the left over a dark gradient."
              />
            </div>
          </div>
        ))}

        <Button
          variant="outline"
          icon={<Plus size={15} />}
          onClick={() => setIn('hero', { slides: [...draft.hero.slides, { ...BLANK_SLIDE }] })}
          className="border-white/20 text-white hover:bg-white/10"
        >
          Add a slide
        </Button>
      </Panel>

      {/* Value props */}
      <Panel
        title="Trust badges"
        description="The four short promises under the hero — delivery, returns, support."
        enabled={draft.valuePropsSection.enabled}
        onToggle={(v) => setIn('valuePropsSection', { enabled: v })}
      >
        {draft.valuePropsSection.items.map((item, i) => (
          <div key={i} className="grid gap-3 rounded-xl border border-white/10 p-5 sm:grid-cols-[8rem_1fr_1fr_auto]">
            <Field label="Icon">
              <Select
                value={item.icon}
                onChange={(e) =>
                  setIn('valuePropsSection', {
                    items: draft.valuePropsSection.items.map((x, idx) =>
                      idx === i ? { ...x, icon: e.target.value } : x,
                    ),
                  })
                }
              >
                {ICON_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </Select>
            </Field>
            <Field label="Title">
              <Input
                value={item.title}
                onChange={(e) =>
                  setIn('valuePropsSection', {
                    items: draft.valuePropsSection.items.map((x, idx) =>
                      idx === i ? { ...x, title: e.target.value } : x,
                    ),
                  })
                }
              />
            </Field>
            <Field label="Text">
              <Input
                value={item.text}
                onChange={(e) =>
                  setIn('valuePropsSection', {
                    items: draft.valuePropsSection.items.map((x, idx) =>
                      idx === i ? { ...x, text: e.target.value } : x,
                    ),
                  })
                }
              />
            </Field>
            <button
              onClick={() =>
                setIn('valuePropsSection', {
                  items: draft.valuePropsSection.items.filter((_, idx) => idx !== i),
                })
              }
              className="mt-6 h-11 rounded-xl border border-white/15 px-3 text-ink-400 transition hover:border-red-400 hover:text-red-400"
              aria-label="Remove badge"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        <Button
          variant="outline"
          icon={<Plus size={15} />}
          onClick={() =>
            setIn('valuePropsSection', {
              items: [...draft.valuePropsSection.items, { icon: 'star', title: '', text: '' }],
            })
          }
          className="border-white/20 text-white hover:bg-white/10"
        >
          Add a badge
        </Button>
      </Panel>

      {/* Categories */}
      <Panel
        title="Shop by category"
        description="Category tiles. Which categories appear is controlled on the Categories screen."
        enabled={draft.categoriesSection.enabled}
        onToggle={(v) => setIn('categoriesSection', { enabled: v })}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Heading">
            <Input value={draft.categoriesSection.title} onChange={(e) => setIn('categoriesSection', { title: e.target.value })} />
          </Field>
          <Field label="Sub-heading">
            <Input value={draft.categoriesSection.subtitle} onChange={(e) => setIn('categoriesSection', { subtitle: e.target.value })} />
          </Field>
        </div>
      </Panel>

      {rowSection('featuredSection', 'Featured products', 'Shows products you marked as Featured. Falls back to the newest products if none are marked.')}
      {promoSection('promoA', 'Promo banner A')}
      {rowSection('newArrivalsSection', 'New arrivals', 'Shows products marked as New arrival.')}
      {promoSection('promoB', 'Promo banner B')}
      {rowSection('bestSellersSection', 'Best sellers', 'Shows products marked as Best seller.')}

      {/* Testimonials */}
      <Panel
        title="Testimonials"
        description="Real quotes from real customers sell better than any copywriting."
        enabled={draft.testimonialsSection.enabled}
        onToggle={(v) => setIn('testimonialsSection', { enabled: v })}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Heading">
            <Input value={draft.testimonialsSection.title} onChange={(e) => setIn('testimonialsSection', { title: e.target.value })} />
          </Field>
          <Field label="Sub-heading">
            <Input value={draft.testimonialsSection.subtitle} onChange={(e) => setIn('testimonialsSection', { subtitle: e.target.value })} />
          </Field>
        </div>

        {draft.testimonialsSection.items.map((t, i) => (
          <div key={i} className="rounded-xl border border-white/10 p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">Quote {i + 1}</p>
              <button
                onClick={() =>
                  setIn('testimonialsSection', {
                    items: draft.testimonialsSection.items.filter((_, idx) => idx !== i),
                  })
                }
                className="rounded-lg p-2 text-ink-400 transition hover:bg-red-500/20 hover:text-red-400"
                aria-label="Remove quote"
              >
                <Trash2 size={15} />
              </button>
            </div>
            <div className="space-y-4">
              <Field label="Quote">
                <Textarea
                  value={t.quote}
                  onChange={(e) =>
                    setIn('testimonialsSection', {
                      items: draft.testimonialsSection.items.map((x, idx) =>
                        idx === i ? { ...x, quote: e.target.value } : x,
                      ),
                    })
                  }
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Name">
                  <Input
                    value={t.name}
                    onChange={(e) =>
                      setIn('testimonialsSection', {
                        items: draft.testimonialsSection.items.map((x, idx) =>
                          idx === i ? { ...x, name: e.target.value } : x,
                        ),
                      })
                    }
                  />
                </Field>
                <Field label="Location or role">
                  <Input
                    value={t.role}
                    onChange={(e) =>
                      setIn('testimonialsSection', {
                        items: draft.testimonialsSection.items.map((x, idx) =>
                          idx === i ? { ...x, role: e.target.value } : x,
                        ),
                      })
                    }
                  />
                </Field>
                <Field label="Stars">
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={t.rating}
                    onChange={(e) =>
                      setIn('testimonialsSection', {
                        items: draft.testimonialsSection.items.map((x, idx) =>
                          idx === i ? { ...x, rating: Number(e.target.value) } : x,
                        ),
                      })
                    }
                  />
                </Field>
              </div>
            </div>
          </div>
        ))}

        <Button
          variant="outline"
          icon={<Plus size={15} />}
          onClick={() =>
            setIn('testimonialsSection', {
              items: [...draft.testimonialsSection.items, { name: '', role: '', avatar: '', quote: '', rating: 5 }],
            })
          }
          className="border-white/20 text-white hover:bg-white/10"
        >
          Add a quote
        </Button>
      </Panel>

      {/* Newsletter */}
      <Panel
        title="Newsletter block"
        description="Collects e-mail addresses into the Customers screen."
        enabled={draft.newsletterSection.enabled}
        onToggle={(v) => setIn('newsletterSection', { enabled: v })}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Heading">
            <Input value={draft.newsletterSection.title} onChange={(e) => setIn('newsletterSection', { title: e.target.value })} />
          </Field>
          <Field label="Button text">
            <Input value={draft.newsletterSection.buttonText} onChange={(e) => setIn('newsletterSection', { buttonText: e.target.value })} />
          </Field>
        </div>
        <Field label="Sub-heading">
          <Input value={draft.newsletterSection.subtitle} onChange={(e) => setIn('newsletterSection', { subtitle: e.target.value })} />
        </Field>
      </Panel>

      <SaveBar dirty={dirty} busy={busy} onSave={() => void save()} onReset={reset} note="The home page updates as soon as you save." />
    </div>
  );
};

export default AdminHomeBuilder;
