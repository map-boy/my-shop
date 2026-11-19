import type { Pt, SizeRow } from '../fit/types.ts';
import { L_HIP, L_SH, R_HIP, R_SH } from '../pose/landmarks.ts';
import { COLLAR_CM, EMA, SLEEVE_K } from './constants.ts';
export interface GState { a: number; b: number; c: number; d: number; tx: number; ty: number; gw: number; gh: number }
export interface Smooth { cur: GState | null }
/** Draws the garment at the true cm size of `row`, rotated and anchored to shoulders/hips. Call after clearRect. */
export function drawGarment(g: CanvasRenderingContext2D, img: CanvasImageSource, l: Pt[], w: number, h: number, cmPerPx: number, row: SizeRow, st: Smooth, multiply: boolean) {
  const P = (i: number) => ({ x: l[i].x * w, y: l[i].y * h });
  const ls = P(L_SH), rs = P(R_SH), lh = P(L_HIP), rh = P(R_HIP);
  let sx = rs.x - ls.x, sy = rs.y - ls.y; if (sx < 0) { sx = -sx; sy = -sy; }
  const sn = Math.hypot(sx, sy) || 1; sx /= sn; sy /= sn;
  const ms = { x: (ls.x + rs.x) / 2, y: (ls.y + rs.y) / 2 }, mh = { x: (lh.x + rh.x) / 2, y: (lh.y + rh.y) / 2 };
  let dx = mh.x - ms.x, dy = mh.y - ms.y; const dn = Math.hypot(dx, dy) || 1; dx /= dn; dy /= dn;
  const collar = COLLAR_CM / cmPerPx;
  const n: GState = { a: sx, b: sy, c: dx, d: dy, tx: ms.x - dx * collar, ty: ms.y - dy * collar, gw: ((row.chestCm / 2) * SLEEVE_K) / cmPerPx, gh: (row.lengthCm + COLLAR_CM) / cmPerPx };
  const o = st.cur; if (o) for (const k of Object.keys(n) as (keyof GState)[]) n[k] = o[k] + (n[k] - o[k]) * EMA;
  st.cur = n;
  g.save(); g.globalAlpha = 0.93; if (multiply) g.globalCompositeOperation = 'multiply';
  g.setTransform(n.a, n.b, n.c, n.d, n.tx, n.ty); g.drawImage(img, -n.gw / 2, 0, n.gw, n.gh);
  g.restore();
}