import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import TryOnPanel from './components/TryOnPanel';
import { useGT } from './garment/strings.ts';
/** Customers arrive from a product page: ?img=<that product's photo>. The file picker is dev-only (&dev=1). */
export default function TryOnPage() {
  const gt = useGT(); const [sp] = useSearchParams(); const dev = sp.get('dev') === '1';
  const [url, setUrl] = useState<string | null>(sp.get('img'));
  useEffect(() => () => { if (url?.startsWith('blob:')) URL.revokeObjectURL(url); }, [url]);
  return (
    <div className="mx-auto w-full max-w-xl space-y-4 px-4 py-6">
      {dev && (
        <label className="block cursor-pointer rounded-xl border border-dashed border-neutral-400 px-4 py-3 text-center text-sm font-medium">
          {gt('pickGarment')}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setUrl(URL.createObjectURL(f)); }} />
        </label>
      )}
      {!url && <p className="text-sm text-neutral-600">{gt(dev ? 'noGarment' : 'openFromProduct')}</p>}
      {(url || dev) && <TryOnPanel garmentUrl={url} />}
    </div>
  );
}