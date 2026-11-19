import type { Body, Pt } from './types.ts';
import { CHEST_K, NOSE_ANKLE_RATIO, SEAM_CM } from './constants.ts';
import { L_ANK, L_HIP, L_SH, NOSE, R_ANK, R_HIP, R_SH } from '../pose/landmarks.ts';
type V = { x: number; y: number };
const mid = (a: V, b: V): V => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const dist = (a: V, b: V) => Math.hypot(a.x - b.x, a.y - b.y);
/** One frame -> body estimate in cm. Height in cm sets the pixel scale. */
export function measure(l: Pt[], w: number, h: number, heightCm: number): Body | null {
  const P = (i: number): V => ({ x: l[i].x * w, y: l[i].y * h });
  const ls = P(L_SH), rs = P(R_SH), lh = P(L_HIP), rh = P(R_HIP);
  const span = Math.abs(mid(P(L_ANK), P(R_ANK)).y - P(NOSE).y);
  if (span < h * 0.3) return null;
  const cmPerPx = (heightCm * NOSE_ANKLE_RATIO) / span;
  const joint = dist(ls, rs) * cmPerPx;
  if (joint < 25 || joint > 70) return null;
  return { shoulderCm: joint + SEAM_CM, chestCm: [joint * CHEST_K[0], joint * CHEST_K[1]], torsoCm: dist(mid(ls, rs), mid(lh, rh)) * cmPerPx, cmPerPx };
}