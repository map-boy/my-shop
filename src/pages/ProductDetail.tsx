// FILE: src/pages/ProductDetail.tsx
import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ChevronRight, Minus, Plus, RefreshCw, ShieldCheck, ShoppingBag, Star, Truck,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import ProductCard from '../components/ProductCard';
import { Badge, Button, PageLoader, SectionHeading } from '../components/ui';
import { cn, discountPercent, PLACEHOLDER_IMAGE } from '../lib/utils';

const ProductDetail: React.FC = () => {
  const { slug = '' } = useParams();
  const { liveProducts, loading, money, settings } = useStore();
  const { add, setOpen } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const [imageIndex, setImageIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<'description' | 'delivery'>('description');

  const product = useMemo(
    () => liveProducts.find((p) => p.slug === slug || p.id === slug),
    [liveProducts, slug],
  );

  const related = useMemo(
    () =>
      product
        ? liveProducts.filter((p) => p.id !== product.id && p.categoryId === product.categoryId).slice(0, 4)
        : [],
    [liveProducts, product],
  );

  if (loading) return <PageLoader label="Loading product" />;

  if (!product) {
    return (
      <div className="mx-auto max-w-xl px-4 py-32 text-center">
        <h1 className="font-display text-3xl font-bold">Product not found</h1>
        <p className="mt-3 text-sm text-ink-500">It may have been removed or is no longer available.</p>
        <Button className="mt-8" onClick={() => navigate('/shop')}>Back to the shop</Button>
      </div>
    );
  }

  const images = product.images?.length ? product.images : [PLACEHOLDER_IMAGE];
  const off = discountPercent(product.price, product.compareAtPrice);
  const soldOut = product.trackStock && product.stock <= 0;
  const lowStock = product.trackStock && product.stock > 0 && product.stock <= 5;

  const missingChoice = product.options?.find((o) => o.values.length > 0 && !choices[o.name]);

  const addToCart = () => {
    if (soldOut) return;
    if (missingChoice) {
      toast.error(`Please choose a ${missingChoice.name.toLowerCase()}.`);
      return;
    }
    const variant = product.options
      ?.map((o) => (choices[o.name] ? `${o.name}: ${choices[o.name]}` : ''))
      .filter(Boolean)
      .join(' · ');
    add(product, qty, variant ?? '');
  };

  const buyNow = () => {
    addToCart();
    if (!missingChoice && !soldOut) {
      setOpen(false);
      navigate('/checkout');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <nav className="mb-8 flex items-center gap-1.5 text-xs text-ink-500">
        <Link to="/" className="hover:text-ink-900">Home</Link>
        <ChevronRight size={13} />
        <Link to="/shop" className="hover:text-ink-900">Shop</Link>
        {product.categoryName && (
          <>
            <ChevronRight size={13} />
            <Link to={`/shop?category=${product.categoryId}`} className="hover:text-ink-900">
              {product.categoryName}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Gallery */}
        <div>
          <div className="relative aspect-square overflow-hidden rounded-brand bg-ink-100">
            <img
              src={images[Math.min(imageIndex, images.length - 1)]}
              alt={product.name}
              className="h-full w-full object-cover"
              onError={(e) => ((e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE)}
            />
            {off > 0 && (
              <span className="absolute left-4 top-4 rounded-full bg-red-600 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-white">
                Save {off}%
              </span>
            )}
          </div>

          {images.length > 1 && (
            <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto">
              {images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setImageIndex(i)}
                  className={cn(
                    'h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition',
                    i === imageIndex ? 'border-ink-900' : 'border-transparent opacity-60 hover:opacity-100',
                  )}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Buy box */}
        <div>
          {product.categoryName && (
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">
              {product.categoryName}
            </p>
          )}
          <h1 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl">{product.name}</h1>

          {product.reviewCount > 0 && (
            <div className="mt-4 flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    size={15}
                    className={i <= Math.round(product.rating) ? 'fill-accent text-accent' : 'text-ink-300'}
                  />
                ))}
              </div>
              <span className="text-xs text-ink-500">
                {product.rating.toFixed(1)} · {product.reviewCount} reviews
              </span>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-bold">{money(product.price)}</span>
            {off > 0 && <span className="text-lg text-ink-400 line-through">{money(product.compareAtPrice)}</span>}
            {soldOut ? (
              <Badge tone="red">Sold out</Badge>
            ) : lowStock ? (
              <Badge tone="amber">Only {product.stock} left</Badge>
            ) : (
              <Badge tone="green">In stock</Badge>
            )}
          </div>

          {product.shortDescription && (
            <p className="mt-6 text-[15px] leading-relaxed text-ink-600">{product.shortDescription}</p>
          )}

          {/* Options */}
          {product.options?.filter((o) => o.values.length).map((opt) => (
            <div key={opt.name} className="mt-7">
              <p className="label">{opt.name}</p>
              <div className="flex flex-wrap gap-2">
                {opt.values.map((v) => (
                  <button
                    key={v}
                    onClick={() => setChoices((c) => ({ ...c, [opt.name]: v }))}
                    className={cn(
                      'rounded-xl border px-4 py-2.5 text-sm font-medium transition',
                      choices[opt.name] === v
                        ? 'border-ink-900 bg-ink-900 text-white'
                        : 'border-ink-200 text-ink-700 hover:border-ink-900',
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Quantity + actions */}
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-xl border border-ink-200">
              <button
                onClick={() => setQty((n) => Math.max(1, n - 1))}
                className="flex h-12 w-12 items-center justify-center transition hover:bg-ink-100"
                aria-label="Decrease quantity"
              >
                <Minus size={15} />
              </button>
              <span className="w-10 text-center font-bold">{qty}</span>
              <button
                onClick={() =>
                  setQty((n) => (product.trackStock ? Math.min(product.stock, n + 1) : n + 1))
                }
                className="flex h-12 w-12 items-center justify-center transition hover:bg-ink-100"
                aria-label="Increase quantity"
              >
                <Plus size={15} />
              </button>
            </div>

            <Button
              size="lg"
              className="flex-1"
              disabled={soldOut}
              onClick={addToCart}
              icon={<ShoppingBag size={17} />}
            >
              {soldOut ? 'Sold out' : 'Add to bag'}
            </Button>
          </div>

          {!soldOut && (
            <Button variant="accent" size="lg" full className="mt-3" onClick={buyNow}>
              Buy it now
            </Button>
          )}

          {/* Reassurance */}
          <ul className="mt-9 grid gap-4 border-t border-ink-200 pt-8 sm:grid-cols-3">
            <li className="flex items-start gap-3 text-xs text-ink-600">
              <Truck size={17} className="mt-0.5 shrink-0 text-accent" />
              <span>{settings.shipping.freeOver > 0 ? `Free over ${money(settings.shipping.freeOver)}` : 'Fast delivery'}</span>
            </li>
            <li className="flex items-start gap-3 text-xs text-ink-600">
              <RefreshCw size={17} className="mt-0.5 shrink-0 text-accent" />
              <span>7-day easy returns</span>
            </li>
            <li className="flex items-start gap-3 text-xs text-ink-600">
              <ShieldCheck size={17} className="mt-0.5 shrink-0 text-accent" />
              <span>Secure checkout</span>
            </li>
          </ul>

          {product.sku && <p className="mt-6 text-[11px] uppercase tracking-widest text-ink-400">SKU · {product.sku}</p>}
        </div>
      </div>

      {/* Details tabs */}
      <div className="mt-16 border-t border-ink-200 pt-10">
        <div className="flex gap-6 border-b border-ink-200">
          {(['description', 'delivery'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                '-mb-px border-b-2 pb-3 text-[12px] font-bold uppercase tracking-[0.15em] transition',
                tab === t ? 'border-ink-900 text-ink-900' : 'border-transparent text-ink-400 hover:text-ink-700',
              )}
            >
              {t === 'description' ? 'Description' : 'Delivery & returns'}
            </button>
          ))}
        </div>

        <div className="max-w-3xl py-8 text-[15px] leading-relaxed text-ink-600">
          {tab === 'description' ? (
            <p className="whitespace-pre-line">{product.description || 'No description has been added yet.'}</p>
          ) : (
            <div className="space-y-4">
              <p>{settings.shipping.note}</p>
              <p>
                {settings.shipping.freeOver > 0
                  ? `Orders over ${money(settings.shipping.freeOver)} ship free. Below that a flat fee of ${money(settings.shipping.flatRate)} applies.`
                  : `A flat delivery fee of ${money(settings.shipping.flatRate)} applies.`}
              </p>
              <p>Not right for you? Return it within 7 days in its original condition.</p>
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-16">
          <SectionHeading eyebrow="You may also like" title="Pairs well with this" />
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
