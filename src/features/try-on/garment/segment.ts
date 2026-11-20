import type { ImageSegmenter, InteractiveSegmenter } from '@mediapipe/tasks-vision';
import { MAX_PX } from './constants.ts';
const VER = '0.10.14';
const WASM = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VER}/wasm`;
const TAP = 'https://storage.googleapis.com/mediapipe-models/interactive_segmenter/magic_touch/float32/1/magic_touch.tflite';
const MULTI = 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite';
const CLOTHES = 4; // multiclass: 0 bg, 1 hair, 2 body-skin, 3 face-skin, 4 clothes, 5 others
const files = () => import('@mediapipe/tasks-vision').then((m) => m.FilesetResolver.forVisionTasks(WASM));
let tapP: Promise<InteractiveSegmenter> | null = null;
let multiP: Promise<ImageSegmenter> | null = null;
const tapModel = () => (tapP ??= (async () => {
  const { InteractiveSegmenter } = await import('@mediapipe/tasks-vision'); const f = await files();
  const open = (delegate: 'GPU' | 'CPU') => InteractiveSegmenter.createFromOptions(f, { baseOptions: { modelAssetPath: TAP, delegate }, outputCategoryMask: false, outputConfidenceMasks: true });
  try { return await open('GPU'); } catch { return await open('CPU'); }
})().catch((e) => { tapP = null; throw e; }));
const multiModel = () => (multiP ??= (async () => {
  const { ImageSegmenter } = await import('@mediapipe/tasks-vision'); const f = await files();
  const open = (delegate: 'GPU' | 'CPU') => ImageSegmenter.createFromOptions(f, { baseOptions: { modelAssetPath: MULTI, delegate }, runningMode: 'IMAGE', outputCategoryMask: true, outputConfidenceMasks: false });
  try { return await open('GPU'); } catch { return await open('CPU'); }
})().catch((e) => { multiP = null; throw e; }));

/** keep[i]=1 for garment pixels at mask size mw x mh -> transparent, cropped canvas. Null if too small. */
function render(img: HTMLImageElement, keep: Uint8Array, mw: number, mh: number): HTMLCanvasElement | null {
  let n = 0, x0 = mw, y0 = mh, x1 = 0, y1 = 0;
  const mc = document.createElement('canvas'); mc.width = mw; mc.height = mh;
  const mg = mc.getContext('2d'); if (!mg) return null;
  const id = mg.createImageData(mw, mh);
  for (let i = 0; i < mw * mh; i++) {
    if (!keep[i]) continue; n++; id.data[i * 4 + 3] = 255;
    const x = i % mw, y = (i / mw) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  if (n < mw * mh * 0.03) return null;
  mg.putImageData(id, 0, 0);
  const k = Math.min(1, MAX_PX / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * k)), h = Math.max(1, Math.round(img.naturalHeight * k));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); if (!g) return null;
  g.drawImage(img, 0, 0, w, h);
  g.globalCompositeOperation = 'destination-in'; g.imageSmoothingQuality = 'high'; g.drawImage(mc, 0, 0, w, h); { const dd = g.getImageData(0, 0, w, h), p = dd.data; for (let i = 0; i < p.length; i += 4) { if (p[i + 3] && p[i] > p[i + 1] && p[i + 1] - p[i + 2] > 32) p[i + 3] = 0; } g.putImageData(dd, 0, 0); }
  const sx = w / mw, sy = h / mh, pad = 2;
  const cx = Math.max(0, Math.floor(x0 * sx) - pad), cy = Math.max(0, Math.floor(y0 * sy) - pad);
  const cw = Math.min(w - cx, Math.ceil((x1 - x0 + 1) * sx) + pad * 2), ch = Math.min(h - cy, Math.ceil((y1 - y0 + 1) * sy) + pad * 2);
  const out = document.createElement('canvas'); out.width = cw; out.height = ch;
  out.getContext('2d')?.drawImage(c, cx, cy, cw, ch, 0, 0, cw, ch);
  return out;
}
const T = <V,>(p: Promise<V>, ms: number) => Promise.race([p, new Promise<never>((_, r) => setTimeout(() => r(new Error('timeout')), ms))]);

/** Removes mannequin / body pixels (multiclass hair, body-skin, face-skin) from the tap-point mask, so only fabric stays. */
async function dropSkin(img: HTMLImageElement, keep: Uint8Array, w: number, h: number) {
  try {
    const s = await T(multiModel(), 60000);
    const res = s.segment(img), mm = res.categoryMask; if (!mm) return;
    const d = mm.getAsUint8Array(), W = mm.width, H = mm.height;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x; if (!keep[i]) continue;
      const c = d[Math.min(H - 1, ((y * H) / h) | 0) * W + Math.min(W - 1, ((x * W) / w) | 0)];
      if (c >= 1 && c <= 3) keep[i] = 0;
    }
    try { mm.close(); } catch { /* ignore */ }
  } catch { /* keep the tap mask as is */ }
}
async function viaTap(img: HTMLImageElement): Promise<HTMLCanvasElement | null> {
  const s = await T(tapModel(), 60000);
  for (const y of [0.55, 0.45, 0.65]) {
    const r = s.segment(img, { keypoint: { x: 0.5, y } }); const m = r.confidenceMasks?.[0]; if (!m) continue;
    const f = m.getAsFloat32Array(), keep = new Uint8Array(f.length);
    for (let i = 0; i < f.length; i++) keep[i] = f[i] > 0.5 ? 1 : 0;
    await dropSkin(img, keep, m.width, m.height); const out = render(img, keep, m.width, m.height); try { m.close(); } catch { /* ignore */ }
    if (out) return out;
  }
  return null;
}
async function viaMulti(img: HTMLImageElement): Promise<HTMLCanvasElement | null> {
  const s = await T(multiModel(), 60000);
  const res = s.segment(img), m = res.categoryMask; if (!m) return null;
  const W = m.width, H = m.height, d = m.getAsUint8Array();
  let best = -1, bd = 1e12; const cx = W * 0.5, cy = H * 0.55;
  for (let i = 0; i < W * H; i++) { if (d[i] !== CLOTHES) continue; const x = i % W, y = (i / W) | 0, q = (x - cx) ** 2 + (y - cy) ** 2; if (q < bd) { bd = q; best = i; } }
  if (best < 0) return null;
  const keep = new Uint8Array(W * H), st = [best]; keep[best] = 1;
  while (st.length) {
    const i = st.pop() as number, x = i % W, y = (i / W) | 0;
    if (x > 0 && !keep[i - 1] && d[i - 1] === CLOTHES) { keep[i - 1] = 1; st.push(i - 1); }
    if (x < W - 1 && !keep[i + 1] && d[i + 1] === CLOTHES) { keep[i + 1] = 1; st.push(i + 1); }
    if (y > 0 && !keep[i - W] && d[i - W] === CLOTHES) { keep[i - W] = 1; st.push(i - W); }
    if (y < H - 1 && !keep[i + W] && d[i + W] === CLOTHES) { keep[i + W] = 1; st.push(i + W); }
  }
  try { m.close(); } catch { /* ignore */ }
  return render(img, keep, W, H);
}
/** Product photo -> transparent canvas holding only the main garment. Null if both models fail. */
export async function segmentClothes(img: HTMLImageElement): Promise<HTMLCanvasElement | null> {
  try { const a = await viaTap(img); if (a) return a; } catch { /* next */ }
  try { return await viaMulti(img); } catch { return null; }
}