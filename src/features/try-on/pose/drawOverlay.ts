import type { Pt, Zone, ZoneResult } from '../fit/types.ts';
import { KEY, L_HIP, L_SH, R_HIP, R_SH } from './landmarks.ts';
const COL = { fits: '#22c55e', tight: '#ef4444', loose: '#f59e0b' } as const;
type XY = [number, number];
/** Clears, lets `under` paint first (garment), then draws zone lines + joints if `lines`. */
export function drawOverlay(c: HTMLCanvasElement, l: Pt[] | null, zones?: ZoneResult[], under?: (g: CanvasRenderingContext2D) => void, lines = true) {
  const g = c.getContext('2d'); if (!g) return;
  const w = c.width, h = c.height; g.clearRect(0, 0, w, h); if (!l) return;
  under?.(g); if (!lines) return;
  const px = (i: number): XY => [l[i].x * w, l[i].y * h];
  const col = (z: Zone) => { const r = zones?.find((q) => q.zone === z); return r ? COL[r.verdict] : '#ffffff'; };
  const sw = Math.max(4, w * 0.012);
  const line = (a: XY, b: XY, color: string) => { g.strokeStyle = color; g.lineWidth = sw; g.lineCap = 'round'; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); };
  const ls = px(L_SH), rs = px(R_SH), lh = px(L_HIP), rh = px(R_HIP);
  const ms: XY = [(ls[0] + rs[0]) / 2, (ls[1] + rs[1]) / 2], mh: XY = [(lh[0] + rh[0]) / 2, (lh[1] + rh[1]) / 2];
  line(ls, rs, col('shoulders'));
  line(ms, mh, col('length'));
  const cy = ms[1] + (mh[1] - ms[1]) * 0.3, half = Math.abs(rs[0] - ls[0]) * 0.45;
  line([ms[0] - half, cy], [ms[0] + half, cy], col('chest'));
  g.fillStyle = '#fff'; for (const i of KEY) { const [x, y] = px(i); g.beginPath(); g.arc(x, y, sw * 0.7, 0, 7); g.fill(); }
}