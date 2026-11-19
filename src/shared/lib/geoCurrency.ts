// FILE: src/lib/geoCurrency.ts
export type DisplayCurrency = 'RWF' | 'UGX';

/** UGX per 1 RWF. Confirm against the current rate and update when it drifts. */
export const UGX_PER_RWF = 2.5;

const KEY = 'karibu_currency';

export const toUgx = (rwf: number): number => Math.round((rwf * UGX_PER_RWF) / 100) * 100;

export function loadCurrency(): DisplayCurrency | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'UGX' || v === 'RWF' ? v : null;
  } catch {
    return null;
  }
}

export function saveCurrency(c: DisplayCurrency): void {
  try { localStorage.setItem(KEY, c); } catch { /* storage unavailable */ }
}

export async function detectCurrency(): Promise<DisplayCurrency> {
  try {
    const r = await fetch('/api/geo', { cache: 'no-store' });
    const j = await r.json();
    return j.country === 'UG' ? 'UGX' : 'RWF';
  } catch {
    return 'RWF';
  }
}