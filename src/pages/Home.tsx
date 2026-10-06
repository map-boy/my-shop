// FILE: src/pages/Home.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { PackageOpen } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import {
  CategoryGrid, Hero, Newsletter, Testimonials, ValueProps,
} from '../components/HomeSections';
import { Button, EmptyState } from '../components/ui';
import { L10n } from '../lib/i18n';

/**
 * The home page renders whatever sections the administrator has enabled, in the
 * order they chose (Dashboard → Home builder). Nothing here is hard-coded.
 */
const Home: React.FC = () => {
  const { settings, liveProducts, loading } = useStore();

  const sections: Record<string, React.ReactNode> = {
    hero: settings.hero.enabled ? <Hero key="hero" /> : null,
    valueProps: settings.valuePropsSection.enabled ? <ValueProps key="valueProps" /> : null,
    categories: settings.categoriesSection.enabled ? <CategoryGrid key="categories" /> : null,
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
            title={L10n("No products yet")}
            text={L10n("The shelves are empty. Sign in to the dashboard to add your first product — it will show up here instantly.")}
            action={
              <Link to="/admin">
                <Button size="lg">{L10n("Open the dashboard")}</Button>
              </Link>
            }
          />
        </div>
      )}
    </>
  );
};

export default Home;
