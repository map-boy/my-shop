// FILE: src/pages/Shop.tsx
import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PackageOpen, SlidersHorizontal, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard';
import { Button, EmptyState, Select } from '../components/ui';
import { cn } from '../lib/utils';

type Sort = 'newest' | 'popular' | 'price-asc' | 'price-desc' | 'name';

const SORTS: { value: Sort; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'popular', label: 'Most popular' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'name', label: 'Name A–Z' },
];

const Shop: React.FC = () => {
  const { liveProducts, categories, loading, money, settings } = useStore();
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const q = params.get('q') ?? '';
  const category = params.get('category') ?? '';
  const sort = (params.get('sort') as Sort) ?? 'newest';
  const maxPrice = Number(params.get('max') ?? 0);
  const onSale = params.get('sale') === '1';
  const inStock = params.get('stock') === '1';

  const patch = (next: Record<string, string | null>) => {
    const merged = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (v === null || v === '') merged.delete(k);
      else merged.set(k, v);
    }
    setParams(merged, { replace: true });
  };

  const priceCeiling = useMemo(
    () => Math.max(1000, ...liveProducts.map((p) => p.price)),
    [liveProducts],
  );

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = liveProducts.filter((p) => {
      if (category && p.categoryId !== category) return false;
      if (onSale && !(p.compareAtPrice > p.price)) return false;
      if (inStock && p.trackStock && p.stock <= 0) return false;
      if (maxPrice > 0 && p.price > maxPrice) return false;
      if (!needle) return true;
      return (
        p.name.toLowerCase().includes(needle) ||
        p.shortDescription?.toLowerCase().includes(needle) ||
        p.description?.toLowerCase().includes(needle) ||
        p.categoryName?.toLowerCase().includes(needle) ||
        p.sku?.toLowerCase().includes(needle) ||
        p.tags?.some((t) => t.toLowerCase().includes(needle))
      );
    });

    list = [...list];
    switch (sort) {
      case 'price-asc': list.sort((a, b) => a.price - b.price); break;
      case 'price-desc': list.sort((a, b) => b.price - a.price); break;
      case 'name': list.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'popular': list.sort((a, b) => (b.soldCount ?? 0) - (a.soldCount ?? 0)); break;
      default: list.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    }
    return list;
  }, [liveProducts, q, category, sort, maxPrice, onSale, inStock]);

  const activeCount = [category, onSale && '1', inStock && '1', maxPrice > 0 && '1', q].filter(Boolean).length;

  const Filters = (
    <div className="space-y-8">
      <div>
        <p className="label">Category</p>
        <div className="space-y-1">
          <button
            onClick={() => patch({ category: null })}
            className={cn(
              'block w-full rounded-lg px-3 py-2 text-left text-sm transition',
              !category ? 'bg-ink-900 font-semibold text-white' : 'text-ink-600 hover:bg-ink-100',
            )}
          >
            All products
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => patch({ category: c.id })}
              className={cn(
                'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition',
                category === c.id ? 'bg-ink-900 font-semibold text-white' : 'text-ink-600 hover:bg-ink-100',
              )}
            >
              {c.name}
              <span className="text-xs opacity-60">
                {liveProducts.filter((p) => p.categoryId === c.id).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="label">Max price</p>
        <input
          type="range"
          min={0}
          max={priceCeiling}
          step={Math.max(1, Math.round(priceCeiling / 100))}
          value={maxPrice || priceCeiling}
          onChange={(e) =>
            patch({ max: Number(e.target.value) >= priceCeiling ? null : e.target.value })
          }
          className="w-full accent-[var(--accent)]"
        />
        <p className="mt-2 text-xs text-ink-500">
          Up to <strong className="text-ink-900">{money(maxPrice || priceCeiling)}</strong>
        </p>
      </div>

      <div className="space-y-2.5">
        <label className="flex cursor-pointer items-center gap-3 text-sm text-ink-700">
          <input
            type="checkbox"
            checked={onSale}
            onChange={(e) => patch({ sale: e.target.checked ? '1' : null })}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          On sale only
        </label>
        <label className="flex cursor-pointer items-center gap-3 text-sm text-ink-700">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => patch({ stock: e.target.checked ? '1' : null })}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          In stock only
        </label>
      </div>

      {activeCount > 0 && (
        <Button variant="outline" full onClick={() => setParams({}, { replace: true })}>
          Clear filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="mb-10">
        <h1 className="font-display text-4xl font-bold sm:text-5xl">
          {q ? `Results for “${q}”` : category ? categories.find((c) => c.id === category)?.name ?? 'Shop' : 'All products'}
        </h1>
        <p className="mt-3 text-sm text-ink-500">
          {loading ? 'Loading the catalogue…' : `${results.length} ${results.length === 1 ? 'product' : 'products'}`}
          {settings.shipping.freeOver > 0 && ` · Free delivery over ${money(settings.shipping.freeOver)}`}
        </p>
      </header>

      <div className="mb-8 flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          icon={<SlidersHorizontal size={15} />}
          onClick={() => setFiltersOpen(true)}
          className="lg:hidden"
        >
          Filters {activeCount > 0 && `(${activeCount})`}
        </Button>
        <div className="ml-auto w-48">
          <Select value={sort} onChange={(e) => patch({ sort: e.target.value })} aria-label="Sort products">
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[16rem_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-28">{Filters}</div>
        </aside>

        <div>
          {loading ? (
            <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : results.length ? (
            <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3 xl:grid-cols-4">
              {results.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <EmptyState
              icon={<PackageOpen size={40} />}
              title="Nothing matched"
              text="Try a different search term or clear the filters."
              action={<Button onClick={() => setParams({}, { replace: true })}>Clear filters</Button>}
            />
          )}
        </div>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-[120] lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-black/50" onClick={() => setFiltersOpen(false)} />
          <div className="animate-slide-in absolute right-0 top-0 h-full w-[85%] max-w-sm overflow-y-auto bg-white">
            <div className="sticky top-0 flex items-center justify-between border-b border-ink-200 bg-white px-5 py-4">
              <span className="font-display text-lg font-bold">Filters</span>
              <button onClick={() => setFiltersOpen(false)} className="rounded-lg p-2 hover:bg-ink-100" aria-label="Close filters">
                <X size={19} />
              </button>
            </div>
            <div className="p-5">{Filters}</div>
            <div className="sticky bottom-0 border-t border-ink-200 bg-white p-5">
              <Button full onClick={() => setFiltersOpen(false)}>Show {results.length} results</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shop;
