// FILE: src/components/DeliveryBanner.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Truck } from 'lucide-react';
import { useStore } from '../context/StoreContext';

/**
 * Sitewide delivery promise. The threshold is substituted at render time from
 * `shipping.freeOver`, so changing the rule in Store settings updates the
 * banner too — the two can never disagree.
 */
const DeliveryBanner: React.FC = () => {
  const { settings, money } = useStore();
  const { banner, freeOver, enabled } = settings.shipping;

  if (!banner?.enabled || !banner.text.trim()) return null;

  // With delivery charging switched off, or no threshold set, a "spend X for
  // free delivery" message would be nonsense.
  if (!enabled || freeOver <= 0) return null;

  const text = banner.text.replace(/\{amount\}/gi, money(freeOver));

  return (
    <div style={{ background: banner.bg, color: banner.color }}>
      <Link
        to="/shop"
        className="mx-auto flex max-w-7xl items-center justify-center gap-2.5 px-4 py-2.5 text-center text-[12px] font-bold sm:text-[13px]"
      >
        <Truck size={16} className="shrink-0" />
        <span>{text}</span>
      </Link>
    </div>
  );
};

export default DeliveryBanner;
