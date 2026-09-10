// FILE: src/components/HomeSections.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { addDoc, collection } from 'firebase/firestore';
import {
  ArrowRight, ChevronLeft, ChevronRight, Headphones, PackageCheck, Quote,
  RefreshCw, ShieldCheck, Sparkles, Star, Truck,
} from 'lucide-react';
import { db } from '../lib/firebase';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import type { Product } from '../lib/types';
import ProductCard, { ProductCardSkeleton } from './ProductCard';
import { Button, SectionHeading } from './ui';
import { cn, PLACEHOLDER_IMAGE } from '../lib/utils';

const Container: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn('mx-auto max-w-7xl px-4 sm:px-6', className)}>{children}</div>
);

/* -------------------------------------------------------------------------- */
/*  Hero                                                                       */
/* -------------------------------------------------------------------------- */

export const Hero: React.FC = () => {
  const { settings } = useStore();
  const { slides, autoplay, interval } = settings.hero;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!autoplay || slides.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), Math.max(2500, interval));
    return () => clearInterval(id);
  }, [autoplay, interval, slides.length]);

  if (!slides.length) return null;
  const slide = slides[Math.min(index, slides.length - 1)];

  return (
    <section className="relative h-[78vh] min-h-[520px] w-full overflow-hidden bg-ink-950">
      {slides.map((s, i) => (
        <img
          key={i}
          src={s.image || PLACEHOLDER_IMAGE}
          alt=""
          aria-hidden={i !== index}
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition-opacity duration-1000',
            i === index ? 'opacity-100' : 'opacity-0',
          )}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/10" />

      <Container className="relative flex h-full items-center">
        <div key={index} className="animate-fade-up max-w-2xl text-white">
          {slide.eyebrow && (
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.24em] backdrop-blur-sm">
              <Sparkles size={13} className="text-accent" />
              {slide.eyebrow}
            </p>
          )}
          <h1 className="font-display text-4xl font-bold leading-[1.05] sm:text-6xl lg:text-7xl">
            {slide.title}
          </h1>
          {slide.subtitle && (
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              {slide.subtitle}
            </p>
          )}
          <div className="mt-10 flex flex-wrap gap-3">
            {slide.ctaText && (
              <Link to={slide.ctaLink || '/shop'}>
                <Button size="lg" variant="accent" icon={<ArrowRight size={17} />}>
                  {slide.ctaText}
                </Button>
              </Link>
            )}
            {slide.ctaSecondaryText && (
              <Link to={slide.ctaSecondaryLink || '/categories'}>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/40 text-white hover:border-white hover:bg-white/10"
                >
                  {slide.ctaSecondaryText}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </Container>

      {slides.length > 1 && (
        <>
          <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === index ? 'w-8 bg-accent' : 'w-4 bg-white/40 hover:bg-white/70',
                )}
              />
            ))}
          </div>
          <button
            onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}
            className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full border border-white/25 p-3 text-white/80 backdrop-blur-sm transition hover:bg-white/15 sm:block"
            aria-label="Previous slide"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => setIndex((i) => (i + 1) % slides.length)}
            className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full border border-white/25 p-3 text-white/80 backdrop-blur-sm transition hover:bg-white/15 sm:block"
            aria-label="Next slide"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/*  Value propositions                                                         */
/* -------------------------------------------------------------------------- */

const VALUE_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  truck: Truck,
  shield: ShieldCheck,
  refresh: RefreshCw,
  headphones: Headphones,
  package: PackageCheck,
  star: Star,
  sparkles: Sparkles,
};

export const ValueProps: React.FC = () => {
  const { settings } = useStore();
  const items = settings.valuePropsSection.items;
  if (!items.length) return null;

  return (
    <section className="border-b border-ink-200 bg-ink-50">
      <Container className="grid grid-cols-2 gap-px overflow-hidden lg:grid-cols-4">
        {items.map((v, i) => {
          const Icon = VALUE_ICONS[v.icon] ?? PackageCheck;
          return (
            <div key={i} className="flex items-start gap-4 px-2 py-8 sm:px-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-accent shadow-sm">
                <Icon size={19} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-ink-900">{v.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-500">{v.text}</p>
              </div>
            </div>
          );
        })}
      </Container>
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/*  Categories                                                                 */
/* -------------------------------------------------------------------------- */

export const CategoryGrid: React.FC = () => {
  const { settings, categories, liveProducts } = useStore();
  const cfg = settings.categoriesSection;
  const list = categories.filter((c) => c.featured).length
    ? categories.filter((c) => c.featured)
    : categories;

  if (!list.length) return null;

  return (
    <section className="py-20 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="Browse"
          title={cfg.title}
          subtitle={cfg.subtitle}
          action={
            <Link to="/categories" className="group inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.15em] text-ink-600 hover:text-accent">
              All categories
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </Link>
          }
        />

        <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
          {list.slice(0, 8).map((c) => {
            const count = liveProducts.filter((p) => p.categoryId === c.id).length;
            return (
              <Link
                key={c.id}
                to={`/shop?category=${c.id}`}
                className="group relative aspect-[4/5] overflow-hidden rounded-brand bg-ink-900"
              >
                <img
                  src={c.image || PLACEHOLDER_IMAGE}
                  alt={c.name}
                  loading="lazy"
                  className="h-full w-full object-cover opacity-75 transition-all duration-700 group-hover:scale-105 group-hover:opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <h3 className="font-display text-lg font-bold text-white sm:text-xl">{c.name}</h3>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-white/60">
                    {count} {count === 1 ? 'item' : 'items'}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/*  Product rail                                                               */
/* -------------------------------------------------------------------------- */

export const ProductRail: React.FC<{
  eyebrow?: string;
  title: string;
  subtitle?: string;
  products: Product[];
  loading?: boolean;
  viewAllHref?: string;
  tone?: 'light' | 'muted';
}> = ({ eyebrow, title, subtitle, products, loading, viewAllHref = '/shop', tone = 'light' }) => {
  if (!loading && !products.length) return null;

  return (
    <section className={cn('py-20 sm:py-24', tone === 'muted' && 'bg-ink-50')}>
      <Container>
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          action={
            <Link to={viewAllHref} className="group inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.15em] text-ink-600 hover:text-accent">
              View all
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </Link>
          }
        />

        <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </Container>
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/*  Promo banner                                                               */
/* -------------------------------------------------------------------------- */

export const Promo: React.FC<{ which: 'promoA' | 'promoB' }> = ({ which }) => {
  const { settings } = useStore();
  const p = settings[which];
  if (!p.enabled) return null;
  const flip = which === 'promoB';

  return (
    <section className="py-20 sm:py-24">
      <Container>
        <div
          className={cn(
            'grid items-center gap-10 overflow-hidden rounded-brand bg-ink-950 lg:grid-cols-2',
            flip && 'lg:[direction:rtl]',
          )}
        >
          <div className="relative h-64 w-full lg:h-[26rem]">
            <img
              src={p.image || PLACEHOLDER_IMAGE}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="px-7 pb-10 lg:px-14 lg:py-16 [direction:ltr]">
            {p.eyebrow && (
              <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.3em] text-accent">{p.eyebrow}</p>
            )}
            <h2 className="font-display text-3xl font-bold leading-tight text-white sm:text-4xl">{p.title}</h2>
            {p.text && <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-300">{p.text}</p>}
            {p.ctaText && (
              <Link to={p.ctaLink || '/shop'} className="mt-8 inline-block">
                <Button variant="accent" size="lg" icon={<ArrowRight size={17} />}>
                  {p.ctaText}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/*  Testimonials                                                               */
/* -------------------------------------------------------------------------- */

export const Testimonials: React.FC = () => {
  const { settings } = useStore();
  const cfg = settings.testimonialsSection;
  if (!cfg.items.length) return null;

  return (
    <section className="bg-ink-50 py-20 sm:py-24">
      <Container>
        <SectionHeading eyebrow="Reviews" title={cfg.title} subtitle={cfg.subtitle} align="center" />
        <div className="grid gap-5 md:grid-cols-3">
          {cfg.items.map((t, i) => (
            <figure key={i} className="flex flex-col rounded-brand bg-white p-8 shadow-sm">
              <Quote size={26} className="mb-5 text-accent" />
              <blockquote className="flex-1 text-[15px] leading-relaxed text-ink-700">“{t.quote}”</blockquote>
              <div className="mt-6 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    size={13}
                    className={n <= (t.rating || 5) ? 'fill-accent text-accent' : 'text-ink-300'}
                  />
                ))}
              </div>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-ink-200 pt-5">
                {t.avatar ? (
                  <img src={t.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-900 text-xs font-bold text-white">
                    {t.name.slice(0, 1)}
                  </span>
                )}
                <span>
                  <span className="block text-sm font-bold text-ink-900">{t.name}</span>
                  <span className="block text-xs text-ink-500">{t.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/*  Newsletter                                                                 */
/* -------------------------------------------------------------------------- */

export const Newsletter: React.FC = () => {
  const { settings } = useStore();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const cfg = settings.newsletterSection;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) return toast.error('Enter a valid e-mail address.');
    setBusy(true);
    try {
      await addDoc(collection(db, 'subscribers'), { email: email.toLowerCase(), createdAt: Date.now() });
      setEmail('');
      toast.success('Subscribed — welcome aboard!');
    } catch {
      toast.error('Could not subscribe right now.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="py-20 sm:py-24">
      <Container>
        <div className="rounded-brand bg-brand px-6 py-16 text-center sm:px-16">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">{cfg.title}</h2>
          <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed opacity-75">{cfg.subtitle}</p>
          <form onSubmit={submit} className="mx-auto mt-9 flex max-w-md flex-col gap-3 sm:flex-row">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-14 min-w-0 flex-1 rounded-xl border border-white/20 bg-white/10 px-5 text-sm text-current outline-none placeholder:opacity-50 focus:border-white/60"
            />
            <Button type="submit" variant="accent" size="lg" loading={busy} className="shrink-0">
              {cfg.buttonText}
            </Button>
          </form>
        </div>
      </Container>
    </section>
  );
};
