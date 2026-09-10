// FILE: src/pages/Home.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { PackageOpen } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import {
  CategoryGrid, Hero, Newsletter, ProductRail, Promo, Testimonials, ValueProps,
} from '../components/HomeSections';
import { Button, EmptyState } from '../components/ui';

/**
 * The home page renders whatever sections the administrator has enabled, in the
 * order they chose (Dashboard → Home builder). Nothing here is hard-coded.
 */
const Home: React.FC = () => {
  const { settings, liveProducts, loading } = useStore();

  const byFlag = (flag: 'featured' | 'newArrival' | 'bestSeller', limit: number) => {
    const flagged = liveProducts.filter((p) => p[flag]);
    const list = flagged.length ? flagged : liveProducts;
    return list.slice(0, Math.max(1, limit));
  };

  const sections: Record<string, React.ReactNode> = {
    hero: settings.hero.enabled ? <Hero key="hero" /> : null,
    valueProps: settings.valuePropsSection.enabled ? <ValueProps key="valueProps" /> : null,
    categories: settings.categoriesSection.enabled ? <CategoryGrid key="categories" /> : null,
    featured: settings.featuredSection.enabled ? (
      <ProductRail
        key="featured"
        eyebrow="Curated"
        title={settings.featuredSection.title}
        subtitle={settings.featuredSection.subtitle}
        products={byFlag('featured', settings.featuredSection.limit)}
        loading={loading}
      />
    ) : null,
    promoA: <Promo key="promoA" which="promoA" />,
    newArrivals: settings.newArrivalsSection.enabled ? (
      <ProductRail
        key="newArrivals"
        eyebrow="Just in"
        title={settings.newArrivalsSection.title}
        subtitle={settings.newArrivalsSection.subtitle}
        products={byFlag('newArrival', settings.newArrivalsSection.limit)}
        loading={loading}
        viewAllHref="/shop?sort=newest"
        tone="muted"
      />
    ) : null,
    promoB: <Promo key="promoB" which="promoB" />,
    bestSellers: settings.bestSellersSection.enabled ? (
      <ProductRail
        key="bestSellers"
        eyebrow="Popular"
        title={settings.bestSellersSection.title}
        subtitle={settings.bestSellersSection.subtitle}
        products={byFlag('bestSeller', settings.bestSellersSection.limit)}
        loading={loading}
        viewAllHref="/shop?sort=popular"
      />
    ) : null,
    testimonials: settings.testimonialsSection.enabled ? <Testimonials key="testimonials" /> : null,
    newsletter: settings.newsletterSection.enabled ? <Newsletter key="newsletter" /> : null,
  };

  const order = settings.sectionOrder?.length
    ? settings.sectionOrder
    : Object.keys(sections);

  return (
    <>
      {order.map((key) => sections[key] ?? null)}

      {!loading && liveProducts.length === 0 && (
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
          <EmptyState
            icon={<PackageOpen size={44} />}
            title="No products yet"
            text="The shelves are empty. Sign in to the dashboard to add your first product — it will show up here instantly."
            action={
              <Link to="/admin">
                <Button size="lg">Open the dashboard</Button>
              </Link>
            }
          />
        </div>
      )}
    </>
  );
};

export default Home;
