import React, { useState } from 'react';
import { useTT } from '../strings';
export default function HeightPrompt({ initial, onSave }: { initial: number | null; onSave: (n: number) => void }) {
  const t = useTT(); const [v, setV] = useState(initial ? String(initial) : ''); const n = Number(v); const ok = n >= 120 && n <= 220;
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (ok) onSave(n); }}>
      <label className="block text-sm font-medium" htmlFor="tryon-h">{t('heightLabel')}</label>
      <input id="tryon-h" inputMode="numeric" value={v} onChange={(e) => setV(e.target.value.replace(/\D/g, '').slice(0, 3))} className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-lg" placeholder="170" />
      <p className="text-sm text-neutral-500">{t('heightHint')}</p>
      {v && !ok && <p className="text-sm text-red-600">{t('heightErr')}</p>}
      <button type="submit" disabled={!ok} className="w-full rounded-xl bg-neutral-900 px-4 py-3 font-medium text-white disabled:opacity-40">{t('save')}</button>
    </form>
  );
}