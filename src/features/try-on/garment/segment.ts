import type { ImageSegmenter } from '@mediapipe/tasks-vision';
import { MAX_PX } from './constants.ts';
const VER = '0.10.14';
const WASM = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VER}/wasm`;
const MODEL = 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite';
const CLOTHES = 4; // 0 bg, 1 hair, 2 body-skin, 3 face-skin, 4 clothes, 5 others
let p: Promise<ImageSegmenter> | null = null;
async function make() {
  const { FilesetResolver, ImageSegmenter } = await import('@mediapipe/tasks-vision');
  const files = await FilesetResolver.forVisionTasks(WASM);
  const open = (delegate: 'GPU' | 'CPU') => ImageSegmenter.createFromOptions(files, { baseOptions: { modelAssetPath: MODEL, delegate }, runningMode: 'IMAGE', outputCategoryMask: true, outputConfidenceMasks: false });
  try { return await open('GPU'); } catch { return await open('CPU'); }
}
const load = () => (p ??= make().catch((e) => { p = null; throw e; }));
/** Product photo -> transparent canvas holding only the garment, cropped to it. Null if no clothes found. */
export async function segmentClothes(img: HTMLImageElement): Promise<HTMLCanvasElement | null> {
  const s = await load();
  const res = s.segment(img); const m = res.categoryMask; if (!m) return null;
  const mw = m.width, mh = m.height, d = m.getAsUint8Array();
  const mc = document.createElement('canvas'); mc.width = mw; mc.height = mh;
  const mg = mc.getContext('2d'); if (!mg) return null;
  const id = mg.createImageData(mw, mh); let n = 0, x0 = mw, y0 = mh, x1 = 0, y1 = 0;
  for (let i = 0; i < mw * mh; i++) {
    if (d[i] !== CLOTHES) continue; n++; id.data[i * 4 + 3] = 255;
    const x = i % mw, y = (i / mw) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  try { m.close(); res.close?.(); } catch { /* ignore */ }
  if (n < mw * mh * 0.03) return null;
  mg.putImageData(id, 0, 0);
  const k = Math.min(1, MAX_PX / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * k)), h = Math.max(1, Math.round(img.naturalHeight * k));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); if (!g) return null;
  g.drawImage(img, 0, 0, w, h);
  g.globalCompositeOperation = 'destination-in'; g.imageSmoothingQuality = 'high'; g.drawImage(mc, 0, 0, w, h);
  const sx = w / mw, sy = h / mh, pad = 2;
  const cx = Math.max(0, Math.floor(x0 * sx) - pad), cy = Math.max(0, Math.floor(y0 * sy) - pad);
  const cw = Math.min(w - cx, Math.ceil((x1 - x0 + 1) * sx) + pad * 2), ch = Math.min(h - cy, Math.ceil((y1 - y0 + 1) * sy) + pad * 2);
  const out = document.createElement('canvas'); out.width = cw; out.height = ch;
  out.getContext('2d')?.drawImage(c, cx, cy, cw, ch, 0, 0, cw, ch);
  return out;
}