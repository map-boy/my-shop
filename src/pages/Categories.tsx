// FILE: src/pages/Categories.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { EmptyState } from '../components/ui';
import { PLACEHOLDER_IMAGE } from '../lib/utils';

const Categories: React.FC = () => {
  const { categories, liveProducts, settings } = useStore();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="mb-12 max-w-2xl">
        <h1 className="font-display text-4xl font-bold sm:text-5xl">{settings.categoriesSection.title}</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-500">{settings.categoriesSection.subtitle}</p>
      </header>

      {categories.length === 0 ? (
        <EmptyState
          icon={<LayoutGrid size={40} />}
          title="No categories yet"
          text="Categories added in the dashboard appear here automatically."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => {
            const count = liveProducts.filter((p) => p.categoryId === c.id).length;
            return (
              <Link
                key={c.id}
                to={`/shop?category=${c.id}`}
                className="group relative aspect-[16/10] overflow-hidden rounded-brand bg-ink-900"
              >
                <img
                  src={c.image || PLACEHOLDER_IMAGE}
                  alt={c.name}
                  loading="lazy"
                  className="h-full w-full object-cover opacity-70 transition-all duration-700 group-hover:scale-105 group-hover:opacity-55"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <h2 className="font-display text-2xl font-bold text-white">{c.name}</h2>
                  {c.description && (
                    <p className="mt-1.5 line-clamp-2 text-sm text-white/70">{c.description}</p>
                  )}
                  <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
                    {count} {count === 1 ? 'product' : 'products'}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Categories;
