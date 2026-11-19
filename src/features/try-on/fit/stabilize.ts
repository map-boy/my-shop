import type { Body } from './types.ts';
const med = (a: number[]) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
/** Median over recent frames, so one bad frame cannot flip the verdict. */
export const stabilize = (s: Body[]): Body => ({
  shoulderCm: med(s.map((b) => b.shoulderCm)),
  chestCm: [med(s.map((b) => b.chestCm[0])), med(s.map((b) => b.chestCm[1]))],
  torsoCm: med(s.map((b) => b.torsoCm)),
  cmPerPx: med(s.map((b) => b.cmPerPx)),
});