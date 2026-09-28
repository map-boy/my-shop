// FILE: src/pages/SectionPage.tsx
import React, { useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { LayoutGrid } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useSections } from '../lib/sections';
import ProductCard from '../components/ProductCard';
import { EmptyState, PageLoader } from '../components/ui';
import { L10n, useI18n } from '../lib/i18n';
import { cn, PLACEHOLDER_IMAGE } from '../lib/utils';

const SectionPage: React.FC = () => {
  const { slug = '' } = useParams();
  const { sections, loading: secLoading } = useSections();
  const { liveProducts, categories, loading } = useStore();
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const category = params.get('category') ?? '';
  const section = sections.find((s) => s.slug === slug || s.id === slug);

  const inSection = useMemo(
    () => (section ? liveProducts.filter((p) => p.sectionId === section.id) : []),
    [liveProducts, section],
  );
  const cats = useMemo(
    () => categories.filter((c) => inSection.some((p) => p.categoryId === c.id)),
    [categories, inSection],
  );
  const items = useMemo(
    () => (category ? inSection.filter((p) => p.categoryId === category) : inSection),
    [inSection, category],
  );

  if (loading || secLoading) return <PageLoader label={L10n('Loading')} />;

  if (!section || section.enabled === false) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 sm:px-6">
        <EmptyState icon={<LayoutGrid size={40} />} title={L10n('Section not found')} text={L10n('This section may have been removed.')} />
      </div>
    );
  }

  const chip = 'shrink-0 rounded-full px-4 py-2 text-[12px] font-bold uppercase tracking-[0.1em] transition';
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="relative mb-8 overflow-hidden rounded-brand bg-ink-950">
        {section.image && (
          <img src={section.image || PLACEHOLDER_IMAGE} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
        )}
        <div className="relative px-5 py-8 text-white sm:px-10 sm:py-14">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.3em] text-accent">{L10n('Section')}</p>
          <h1 className="font-display text-3xl font-bold sm:text-5xl">{L10n(section.name)}</h1>
          {section.description && <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">{L10n(section.description)}</p>}
          <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">
            {inSection.length === 1 ? t('count.item1') : t('count.items', { n: inSection.length })}
          </p>
        </div>
      </header>

      {cats.length > 1 && (
        <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto">
          <button onClick={() => setParams({}, { replace: true })} className={cn(chip, !category ? 'bg-ink-900 text-white' : 'bg-ink-100 text-ink-700')}>
            {t('common.allCategories')}
          </button>
          {cats.map((c) => (
            <button key={c.id} onClick={() => setParams({ category: c.id }, { replace: true })} className={cn(chip, category === c.id ? 'bg-ink-900 text-white' : 'bg-ink-100 text-ink-700')}>
              {L10n(c.name)}
            </button>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState icon={<LayoutGrid size={40} />} title={L10n('Nothing here yet')} text={L10n('Products added to this section appear here automatically.')} />
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
};

export default SectionPage;