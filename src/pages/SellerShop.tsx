// FILE: src/pages/SellerShop.tsx
import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Store } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import ProductCard from '../components/ProductCard';
import { EmptyState, PageLoader } from '../components/ui';
import { L10n } from '../lib/i18n';
import { slugify } from '../lib/utils';

/** Public page for one seller's shop. QR codes and share links point here. */
const SellerShop: React.FC = () => {
  const { seller = '' } = useParams();
  const { liveProducts, loading } = useStore();
  const key = slugify(decodeURIComponent(seller));

  const items = useMemo(
    () => liveProducts.filter((p) => p.sellerName && slugify(p.sellerName) === key),
    [liveProducts, key],
  );
  const shopName = items[0]?.sellerName ?? '';

  if (loading) return <PageLoader label={L10n('Loading')} />;

  if (!key || items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 sm:px-6">
        <EmptyState
          icon={<Store size={40} />}
          title={L10n('Shop not found')}
          text={L10n('This shop has no products yet, or the link is wrong.')}
          action={
            <Link to="/shop" className="text-sm font-bold text-accent">
              {L10n('Browse the whole shop')}
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8 rounded-brand bg-ink-950 px-5 py-8 text-white sm:px-10 sm:py-12">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.3em] text-accent">{L10n('Shop')}</p>
        <h1 className="font-display text-3xl font-bold sm:text-5xl">{shopName}</h1>
        <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">
          {items.length} {items.length === 1 ? L10n('item') : L10n('items')}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      <p className="mt-12 text-center">
        <Link to="/shop" className="text-[12px] font-bold uppercase tracking-[0.16em] text-ink-500 hover:text-accent">
          {L10n('Browse the whole shop')}
        </Link>
      </p>
    </div>
  );
};

export default SellerShop;
