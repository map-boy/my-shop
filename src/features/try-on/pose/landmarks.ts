import type { Pt } from '../fit/types.ts';
export const NOSE = 0, L_SH = 11, R_SH = 12, L_HIP = 23, R_HIP = 24, L_ANK = 27, R_ANK = 28;
export const KEY = [NOSE, L_SH, R_SH, L_HIP, R_HIP, L_ANK, R_ANK];
/** Head to feet visible, confident, and not cut by the frame edge. */
export const inFrame = (l: Pt[]) => KEY.every((i) => { const p = l[i]; return !!p && (p.visibility ?? 1) > 0.5 && p.x > 0.02 && p.x < 0.98 && p.y > 0.02 && p.y < 0.98; });