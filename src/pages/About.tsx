// FILE: src/pages/About.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Button } from '../components/ui';
import { PLACEHOLDER_IMAGE } from '../lib/utils';

const About: React.FC = () => {
  const { settings, liveProducts, categories } = useStore();

  const stats = [
    { value: `${liveProducts.length}+`, label: 'Products on the shelf' },
    { value: `${categories.length}`, label: 'Categories' },
    { value: '48h', label: 'Countrywide delivery' },
    { value: '7 days', label: 'Easy returns' },
  ];

  return (
    <div>
      <section className="relative flex h-[46vh] min-h-[340px] items-center overflow-hidden bg-ink-950">
        <img
          src={settings.hero.slides[0]?.image || PLACEHOLDER_IMAGE}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.3em] text-accent">About us</p>
          <h1 className="max-w-2xl font-display text-4xl font-bold text-white sm:text-6xl">
            {settings.tagline}
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
        <p className="font-display text-2xl leading-relaxed text-ink-800 sm:text-3xl">
          {settings.footer.about}
        </p>
        <div className="mt-10 space-y-5 text-[15px] leading-relaxed text-ink-600">
          <p>
            {settings.storeName} started with a simple frustration: too much choice, too little care. So we
            keep the catalogue small and the standards high. Every product on this site is one we would buy
            ourselves.
          </p>
          <p>
            We answer messages quickly, we tell you the truth about stock and delivery times, and if something
            is not right we make it right. That is the whole business model.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-brand bg-ink-200 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-white px-4 py-8 text-center">
              <p className="font-display text-3xl font-bold text-ink-900">{s.value}</p>
              <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-400">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-wrap gap-3">
          <Link to="/shop">
            <Button size="lg" icon={<ArrowRight size={17} />}>Browse the shop</Button>
          </Link>
          <Link to="/contact">
            <Button size="lg" variant="outline">Talk to us</Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default About;
