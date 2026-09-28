// FILE: src/pages/ProductDetail.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ChevronRight, MessageCircle, Minus, Plus, RefreshCw, Share2, ShieldCheck, ShoppingBag, Star, Truck,
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import ProductCard from '../components/ProductCard';
import ProductGallery from '../components/ProductGallery';
import { Badge, Button, PageLoader, SectionHeading } from '../components/ui';
import type { Product } from '../lib/types';
import { cn, discountPercent, PLACEHOLDER_IMAGE } from '../lib/utils';
import { useI18n } from '../lib/i18n';
import { L10n } from '../lib/i18n';

const ProductDetail: React.FC = () => {
  const { slug = '' } = useParams();
  const { products, liveProducts, loading, money, settings } = useStore();
  const { isAdmin } = useAuth();
  const { add, setOpen } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const { t: tr, tx } = useI18n();

  const [qty, setQty] = useState(1);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<'description' | 'delivery'>('description');
  const [sharing, setSharing] = useState(false);

  const fromCatalogue = useMemo(() => {
    const key = slug.trim().toLowerCase();
    return (
      products.find((p) => p.slug?.toLowerCase() === key) ??
      products.find((p) => p.id === slug) ??
      null
    );
  }, [products, slug]);

  const [fetched, setFetched] = useState<Product | null>(null);
  const [lookupDone, setLookupDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFetched(null);
    setLookupDone(false);

    if (fromCatalogue || loading) {
      setLookupDone(true);
      return;
    }

    getDoc(doc(db, 'products', slug))
      .then((snap) => {
        if (cancelled) return;
        if (snap.exists()) setFetched({ id: snap.id, ...(snap.data() as Omit<Product, 'id'>) });
      })
      .catch(() => undefined)
      .finally(() => !cancelled && setLookupDone(true));

    return () => {
      cancelled = true;
    };
  }, [slug, fromCatalogue, loading]);

  const found = fromCatalogue ?? fetched;
  const product = found && (found.status === 'active' || isAdmin) ? found : undefined;
  const hiddenFromShoppers = !!found && found.status !== 'active';

  const related = useMemo(
    () =>
      product
        ? liveProducts.filter((p) => p.id !== product.id && p.categoryId === product.categoryId).slice(0, 4)
        : [],
    [liveProducts, product],
  );

  if (loading || !lookupDone) return <PageLoader label={tr('pd.loading')} />;

  if (!product) {
    return (
      <div className="mx-auto max-w-xl px-4 py-32 text-center">
        <h1 className="font-display text-3xl font-bold">{tr('pd.notFound')}</h1>
        <p className="mt-3 text-sm text-ink-500">{tr('pd.notFoundText')}</p>
        <Button className="mt-8" onClick={() => navigate('/shop')}>{tr('pd.backShop')}</Button>
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
      toast.error(tr('chooseOption'));
      return;
    }
    const variant = product.options
      ?.map((o) => (choices[o.name] ? `${o.name}: ${choices[o.name]}` : ''))
      .filter(Boolean)
      .join(' - ');
    add(product, qty, variant ?? '');
  };

  const buyNow = () => {
    addToCart();
    if (!missingChoice && !soldOut) {
      setOpen(false);
      navigate('/checkout');
    }
  };

  const shareToStatus = async () => {
    setSharing(true);
    const shareUrl = window.location.origin + '/product/' + (product.slug || product.id);
    const shareText = product.name + ' - ' + money(product.price);
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, text: shareText, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success(tr('pd.linkCopied'));
      }
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        toast.error(tr('pd.shareFail'));
      }
    } finally {
      setSharing(false);
    }
  };

  const variantText = (product.options ?? [])
    .map((o) => (choices[o.name] ? `${o.name}: ${choices[o.name]}` : ''))
    .filter(Boolean)
    .join(', ');
  const waNumber = (settings.contact.whatsapp || '').replace(/[^0-9]/g, '');
  const productUrl = window.location.origin + '/product/' + (product.slug || product.id);
  const waText =
    tr('waMessage', { name: product.name, qty, price: money(product.price * qty) }) +
    (variantText ? '\n' + variantText : '') +
    '\n' + productUrl;
  const waHref = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(waText)}` : '';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <nav className="mb-8 flex items-center gap-1.5 text-xs text-ink-500">
        <Link to="/" className="hover:text-ink-900">{tr('nav.home')}</Link>
        <ChevronRight size={13} />
        <Link to="/shop" className="hover:text-ink-900">{tr('nav.shop')}</Link>
        {product.categoryName && (
          <>
            <ChevronRight size={13} />
            <Link to={`/shop?category=${product.categoryId}`} className="hover:text-ink-900">
              {tx(product.categoryName)}
            </Link>
          </>
        )}
      </nav>

      {hiddenFromShoppers && (
        <div className="mb-8 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>{tr('pd.hiddenTitle')}</strong> {tr('pd.hiddenText', { status: product.status })}
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <ProductGallery
          key={product.id}
          images={images}
          videoUrl={product.videoUrl}
          alt={product.name}
          badge={
            off > 0 ? (
              <span className="rounded-full bg-red-600 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-white">
                {tr('save', { n: off })}
              </span>
            ) : null
          }
        />

        <div>
          {product.categoryName && (
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">
              {tx(product.categoryName)}
            </p>
          )}
          <h1 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl">{tx(product.name)}</h1>

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
                {tr('pd.reviews', { rating: product.rating.toFixed(1), n: product.reviewCount })}
              </span>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-bold">{money(product.price)}</span>
            {off > 0 && <span className="text-lg text-ink-400 line-through">{money(product.compareAtPrice)}</span>}
            {soldOut ? (
              <Badge tone="red">{tr('soldOut')}</Badge>
            ) : lowStock ? (
              <Badge tone="amber">{tr('onlyLeft', { n: product.stock })}</Badge>
            ) : (
              <Badge tone="green">{tr('inStock')}</Badge>
            )}
          </div>

          {product.shortDescription && (
            <p className="mt-6 text-[15px] leading-relaxed text-ink-600">{tx(product.shortDescription)}</p>
          )}

          {product.options?.filter((o) => o.values.length).map((opt) => (
            <div key={opt.name} className="mt-7">
              <p className="label">{tx(opt.name)}</p>
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
                    {tx(v)}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {settings.whatsappOnly ? (
            <div className="mt-9 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-xl border border-ink-200">
                  <button
                    onClick={() => setQty((n) => Math.max(1, n - 1))}
                    className="flex h-12 w-12 items-center justify-center transition hover:bg-ink-100"
                    aria-label={L10n("Decrease quantity")}
                  >
                    <Minus size={15} />
                  </button>
                  <span className="w-10 text-center font-bold">{qty}</span>
                  <button
                    onClick={() => setQty((n) => (product.trackStock ? Math.min(product.stock, n + 1) : n + 1))}
                    className="flex h-12 w-12 items-center justify-center transition hover:bg-ink-100"
                    aria-label={L10n("Increase quantity")}
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </div>
              {waHref && (
                <a href={waHref}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => {
                    if (soldOut) e.preventDefault();
                    else if (missingChoice) {
                      e.preventDefault();
                      toast.error(tr('chooseOption'));
                    }
                  }}
                  className={cn(
                    'flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] text-sm font-bold uppercase tracking-wider text-white transition hover:brightness-95',
                    soldOut && 'pointer-events-none opacity-50',
                  )}
                >
                  <MessageCircle size={18} />
                  {soldOut ? tr('soldOut') : tr('orderWhatsapp')}
                </a>
              )}
            </div>
          ) : (
          <>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-xl border border-ink-200">
              <button
                onClick={() => setQty((n) => Math.max(1, n - 1))}
                className="flex h-12 w-12 items-center justify-center transition hover:bg-ink-100"
                aria-label={L10n("Decrease quantity")}
              >
                <Minus size={15} />
              </button>
              <span className="w-10 text-center font-bold">{qty}</span>
              <button
                onClick={() =>
                  setQty((n) => (product.trackStock ? Math.min(product.stock, n + 1) : n + 1))
                }
                className="flex h-12 w-12 items-center justify-center transition hover:bg-ink-100"
                aria-label={L10n("Increase quantity")}
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
              {soldOut ? tr('soldOut') : tr('addToBag')}
            </Button>
          </div>

          {!soldOut && (
            <Button variant="accent" size="lg" full className="mt-3" onClick={buyNow}>
              {L10n("Buy it now")}
            </Button>
          )}
          </>
          )}

          <button
            type="button"
            onClick={shareToStatus}
            disabled={sharing}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-ink-200 py-3 text-sm font-semibold text-ink-700 transition hover:border-ink-900 hover:text-ink-900 disabled:opacity-50"
          >
            <Share2 size={16} />
            {sharing ? tr('preparing') : tr('share')}
          </button>

          <ul className="mt-9 grid gap-4 border-t border-ink-200 pt-8 sm:grid-cols-3">
            <li className="flex items-start gap-3 text-xs text-ink-600">
              <Truck size={17} className="mt-0.5 shrink-0 text-accent" />
              <span>{settings.shipping.freeOver > 0 ? tr('freeOver', { amount: money(settings.shipping.freeOver) }) : tr('fastDelivery')}</span>
            </li>
            <li className="flex items-start gap-3 text-xs text-ink-600">
              <RefreshCw size={17} className="mt-0.5 shrink-0 text-accent" />
              <span>{tr('returns')}</span>
            </li>
            <li className="flex items-start gap-3 text-xs text-ink-600">
              <ShieldCheck size={17} className="mt-0.5 shrink-0 text-accent" />
              <span>{tr('secure')}</span>
            </li>
          </ul>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] uppercase tracking-widest text-ink-400">
            {product.sellerName && (
              <span>
                {tr('pd.soldBy')} <strong className="text-ink-700">{product.sellerName}</strong>
              </span>
            )}
            {product.sku && <span>{tr('pd.sku')} - {product.sku}</span>}
          </div>
        </div>
      </div>

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
              {t === 'description' ? tr('description') : tr('deliveryReturns')}
            </button>
          ))}
        </div>

        <div className="max-w-3xl py-8 text-[15px] leading-relaxed text-ink-600">
          {tab === 'description' ? (
            <p className="whitespace-pre-line">{product.description ? tx(product.description) : tr('pd.noDesc')}</p>
          ) : (
            <div className="space-y-4">
              <p>{tx(settings.shipping.note)}</p>
              <p>
                {settings.shipping.freeOver > 0
                  ? tr('pd.deliveryFree', { amount: money(settings.shipping.freeOver), fee: money(settings.shipping.flatRate) })
                  : tr('pd.deliveryFlat', { fee: money(settings.shipping.flatRate) })}
              </p>
              <p>{tr('pd.returnNote')}</p>
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-16">
          <SectionHeading eyebrow={tr('pd.also')} title={tr('pd.pairs')} />
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
