// FILE: src/components/Tracker.tsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { trackHit } from '../lib/track';
import { noteShop } from '../lib/push';
import { slugify } from '../lib/utils';

const safe = (s: string) => { try { return decodeURIComponent(s); } catch { return s; } };

/** Counts storefront visits, and remembers which sellers this device has looked at (for push). */
const Tracker = () => {
  const { pathname, search } = useLocation();
  const { liveProducts, loading } = useStore();

  useEffect(() => {
    if (pathname.startsWith('/admin')) return;
    const qr = new URLSearchParams(search).get('src') === 'qr';
    void trackHit('site', '', qr);
    if (loading) return;

    const prod = pathname.match(/^\/product\/([^/]+)/);
    if (prod) {
      const s = safe(prod[1]);
      const p = liveProducts.find((x) => (x as unknown as { slug?: string }).slug === s);
      if (p?.sellerId) noteShop(p.sellerId);
    }

    const shop = pathname.match(/^\/shop\/([^/]+)/);
    if (!shop) return;
    const slug = slugify(safe(shop[1]));
    const p = liveProducts.find((x) => x.sellerName && slugify(x.sellerName) === slug);
    if (p?.sellerId) {
      noteShop(p.sellerId);
      void trackHit(slug, p.sellerId, qr);
    }
  }, [pathname, search, loading, liveProducts]);

  return null;
};

export default Tracker;