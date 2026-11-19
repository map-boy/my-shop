import React from 'react';
import type { FitResult, Verdict } from '../fit/types.ts';
import { useTT } from '../strings';
const BG: Record<Verdict, string> = { fits: 'bg-green-500', tight: 'bg-red-500', loose: 'bg-amber-500' };
interface Props { rows: FitResult[]; best: string; cur: string; onPick: (s: string) => void }
export default function FitVerdict({ rows, best, cur, onPick }: Props) {
  const t = useTT(); const row = rows.find((r) => r.size === cur) ?? rows[0];
  const zl = { shoulders: t('zShoulders'), chest: t('zChest'), length: t('zLength') };
  return (
    <div className="space-y-3">
      <p className="text-sm text-neutral-600">{t('bestSize')}: <b className="text-neutral-900">{best}</b></p>
      <div className="flex flex-wrap gap-2" role="group" aria-label={t('sizeLabel')}>
        {rows.map((r) => (
          <button key={r.size} onClick={() => onPick(r.size)} className={`rounded-full px-4 py-2 text-sm font-semibold text-white ${BG[r.overall]} ${r.size === cur ? 'ring-2 ring-neutral-900 ring-offset-2' : 'opacity-80'}`}>{r.size}</button>
        ))}
      </div>
      <ul className="space-y-1 text-sm">
        {row.zones.map((z) => (
          <li key={z.zone} className="flex items-center justify-between rounded-lg bg-neutral-100 px-3 py-2">
            <span>{zl[z.zone]}</span>
            <span className="flex items-center gap-2"><i className={`inline-block h-2.5 w-2.5 rounded-full ${BG[z.verdict]}`} />{t(z.verdict)} <span className="text-neutral-400">({z.diffCm > 0 ? '+' : ''}{z.diffCm.toFixed(1)} cm)</span></span>
          </li>
        ))}
      </ul>
    </div>
  );
}