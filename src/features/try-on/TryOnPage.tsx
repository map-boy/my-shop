import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '@/app/context/StoreContext';
import TryOnPanel from './components/TryOnPanel';
import { chartFor } from './fit/chartFor.ts';
import { useGT } from './garment/strings.ts';
/** Customers arrive from a product page: ?p=<slug>&img=<photo>. The file picker is dev-only (&dev=1). */
export default function TryOnPage() {
  const gt = useGT(); const [sp] = useSearchParams(); const dev = sp.get('dev') === '1';
  const { products } = useStore(); const slug = (sp.get('p') || '').toLowerCase();
  const product = useMemo(() => products.find((p) => p.slug?.toLowerCase() === slug || p.id === sp.get('p')) ?? null, [products, slug, sp]);
  const sizes = product?.options?.find((o) => /size|ingano|taille|مقاس/i.test(o.name))?.values;
  const chart = useMemo(() => chartFor(sizes), [sizes]);
  const [picked, setPicked] = useState<string | null>(null);
  const url = picked ?? sp.get('img') ?? product?.images?.[0] ?? null;
  useEffect(() => () => { if (picked?.startsWith('blob:')) URL.revokeObjectURL(picked); }, [picked]);
  return (
    <div className="mx-auto w-full max-w-xl space-y-4 px-4 py-6">
      {dev && (
        <label className="block cursor-pointer rounded-xl border border-dashed border-neutral-400 px-4 py-3 text-center text-sm font-medium">
          {gt('pickGarment')}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setPicked(URL.createObjectURL(f)); }} />
        </label>
      )}
      {!url && <p className="text-sm text-neutral-600">{gt(dev ? 'noGarment' : 'openFromProduct')}</p>}
      {(url || dev) && <TryOnPanel garmentUrl={url} chart={chart} model3dUrl={product?.model3d ?? null} />}
    </div>
  );
}