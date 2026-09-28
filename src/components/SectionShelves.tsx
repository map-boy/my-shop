// FILE: src/components/SectionShelves.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useSections } from '../lib/sections';
import { L10n, useI18n } from '../lib/i18n';
import { cn } from '../lib/utils';
import ProductCard from './ProductCard';
import { SectionHeading } from './ui';

/** Home page shelves: one block per section (Cagua, Mangaze, ...) with its own products. */
const SectionShelves: React.FC = () => {
  const { pathname } = useLocation();
  const { live } = useSections();
  const { liveProducts, loading } = useStore();
  const { t } = useI18n();
  if (pathname !== '/' || loading) return null;

  const shelves = live
    .filter((s) => s.showOnHome !== false)
    .map((s) => ({ s, items: liveProducts.filter((p) => p.sectionId === s.id).slice(0, 8) }))
    .filter((x) => x.items.length > 0);
  if (!shelves.length) return null;

  return (
    <>
      {shelves.map(({ s, items }, i) => (
        <section key={s.id} className={cn('py-12 sm:py-16', i % 2 === 0 ? 'bg-ink-50' : '')}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionHeading
              eyebrow={L10n('Section')}
              title={L10n(s.name)}
              subtitle={s.description ? L10n(s.description) : undefined}
              action={
                <Link to={'/section/' + s.slug} className="text-[12px] font-bold uppercase tracking-[0.15em] text-ink-600 hover:text-accent">
                  {t('common.viewAll')}
                </Link>
              }
            />
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
              {items.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      ))}
    </>
  );
};

export default SectionShelves;