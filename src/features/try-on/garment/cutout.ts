import { CUT_TOL, MAX_PX } from './constants.ts';
export function loadImage(url: string, cors = true): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const i = new Image();
    if (cors && !url.startsWith('blob:') && !url.startsWith('data:')) i.crossOrigin = 'anonymous';
    i.onload = () => res(i);
    i.onerror = () => { if (!cors) return rej(new Error('image failed')); if (/^https?:/.test(url) && !url.includes('/api/img?')) loadImage('/api/img?u=' + encodeURIComponent(url), true).then(res, () => loadImage(url, false).then(res, rej)); else loadImage(url, false).then(res, rej); };
    i.src = url;
  });
}
/** Flat-lay photo -> transparent cutout (flood-fill the background from the edges), cropped to the garment. Null if the canvas is tainted. */
export function cutout(img: HTMLImageElement): HTMLCanvasElement | null {
  const k = Math.min(1, MAX_PX / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * k)), h = Math.max(1, Math.round(img.naturalHeight * k));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true }); if (!g) return null;
  g.drawImage(img, 0, 0, w, h);
  let data: ImageData; try { data = g.getImageData(0, 0, w, h); } catch { return null; }
  const p = data.data, at = (x: number, y: number) => (y * w + x) * 4;
  const cs = [at(0, 0), at(w - 1, 0), at(0, h - 1), at(w - 1, h - 1)];
  const bg = [0, 1, 2].map((ch) => cs.reduce((s, i) => s + p[i + ch], 0) / 4);
  const near = (i: number) => p[i + 3] < 10 || Math.abs(p[i] - bg[0]) + Math.abs(p[i + 1] - bg[1]) + Math.abs(p[i + 2] - bg[2]) < CUT_TOL * 3;
  const seen = new Uint8Array(w * h), stack: number[] = [];
  const seed = (x: number, y: number) => { const n = y * w + x; if (!seen[n] && near(n * 4)) { seen[n] = 1; stack.push(n); } };
  for (let x = 0; x < w; x++) { seed(x, 0); seed(x, h - 1); }
  for (let y = 0; y < h; y++) { seed(0, y); seed(w - 1, y); }
  while (stack.length) {
    const n = stack.pop() as number, x = n % w, y = (n / w) | 0;
    if (x > 0) seed(x - 1, y); if (x < w - 1) seed(x + 1, y); if (y > 0) seed(x, y - 1); if (y < h - 1) seed(x, y + 1);
  }
  let x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (let n = 0; n < w * h; n++) {
    if (seen[n]) { p[n * 4 + 3] = 0; continue; }
    const x = n % w, y = (n / w) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  if (x1 <= x0 || y1 <= y0) return null;
  g.putImageData(data, 0, 0);
  const out = document.createElement('canvas'); out.width = x1 - x0 + 1; out.height = y1 - y0 + 1;
  out.getContext('2d')?.drawImage(c, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}