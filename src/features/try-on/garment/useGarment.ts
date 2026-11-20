import { useEffect, useState } from 'react';
import { cutout, loadImage } from './cutout.ts';
import { segmentClothes } from './segment.ts';
export interface GarmentState { src: HTMLCanvasElement | HTMLImageElement | null; multiply: boolean; status: 'idle' | 'loading' | 'ready' | 'error' }
const NONE: GarmentState = { src: null, multiply: false, status: 'idle' };
/** multiply = cutout failed (CORS), so white background is blended away instead. */
export function useGarment(url: string | null | undefined): GarmentState {
  const [s, setS] = useState<GarmentState>(NONE);
  useEffect(() => {
    if (!url) { setS(NONE); return; }
    let off = false; setS({ src: null, multiply: false, status: 'loading' });
    loadImage(url).then(async (img) => { if (off) return; let c: HTMLCanvasElement | null = null; try { c = await segmentClothes(img); } catch { /* fall back */ } if (!c) c = cutout(img); if (off) return; setS(c ? { src: c, multiply: false, status: 'ready' } : { src: null, multiply: false, status: 'error' }); })
      .catch(() => { if (!off) setS({ src: null, multiply: false, status: 'error' }); });
    return () => { off = true; };
  }, [url]);
  return s;
}