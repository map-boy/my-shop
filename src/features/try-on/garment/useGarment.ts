import { useEffect, useState } from 'react';
import { cutout, loadImage } from './cutout.ts';
export interface GarmentState { src: HTMLCanvasElement | HTMLImageElement | null; multiply: boolean; status: 'idle' | 'loading' | 'ready' | 'error' }
const NONE: GarmentState = { src: null, multiply: false, status: 'idle' };
/** multiply = cutout failed (CORS), so white background is blended away instead. */
export function useGarment(url: string | null | undefined): GarmentState {
  const [s, setS] = useState<GarmentState>(NONE);
  useEffect(() => {
    if (!url) { setS(NONE); return; }
    let off = false; setS({ src: null, multiply: false, status: 'loading' });
    loadImage(url).then((img) => { if (off) return; const c = cutout(img); setS({ src: c ?? img, multiply: !c, status: 'ready' }); })
      .catch(() => { if (!off) setS({ src: null, multiply: false, status: 'error' }); });
    return () => { off = true; };
  }, [url]);
  return s;
}