import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useCamera } from '../camera/useCamera';
import { useFitSession } from '../fit/useFitSession.ts';
import { DEFAULT_CHART } from '../fit/sizeChart.ts';
import type { Body, Pt, SizeRow, ZoneResult } from '../fit/types.ts';
import { usePoseLoop } from '../pose/usePoseLoop';
import { drawOverlay } from '../pose/drawOverlay.ts';
import { loadPose } from '../pose/poseModel';
import { drawGarment, type Smooth } from '../garment/drawGarment.ts';
import { useGarment } from '../garment/useGarment.ts';
import { useGT } from '../garment/strings.ts';
import { useTT } from '../strings';
import CameraView from './CameraView';
import FitVerdict from './FitVerdict';
import HeightPrompt from './HeightPrompt';
import type { Garment3D } from '../three/Garment3D';
const KEY = 'tryon.height';
const loadH = () => { try { const n = Number(localStorage.getItem(KEY)); return n >= 120 && n <= 220 ? n : null; } catch { return null; } };
interface Props { chart?: SizeRow[]; garmentUrl?: string | null; model3dUrl?: string | null }
export default function TryOnPanel({ chart = DEFAULT_CHART, garmentUrl = null, model3dUrl = null }: Props) {
  const t = useTT(); const gt = useGT();
  const [h, setH] = useState<number | null>(loadH); const [sel, setSel] = useState<string | null>(null);
  const [showG, setShowG] = useState(true); const [showZ, setShowZ] = useState(false);
  const cam = useCamera(); const canvasRef = useRef<HTMLCanvasElement>(null);
  const sess = useFitSession(h ?? 170, chart); const garment = useGarment(garmentUrl);
  const cur = sel ?? sess.fits?.best ?? chart[Math.floor(chart.length / 2)]?.size ?? null;
  const zonesRef = useRef<ZoneResult[] | undefined>(undefined); zonesRef.current = sess.fits?.rows.find((r) => r.size === cur)?.zones;
  const smooth = useRef<Smooth>({ cur: null });
  const c3Ref = useRef<HTMLCanvasElement>(null); const g3 = useRef<Garment3D | null>(null);
  useEffect(() => {
    if (!model3dUrl || !c3Ref.current) return; let dead = false;
    import('../three/Garment3D').then(async ({ Garment3D }) => {
      if (dead || !c3Ref.current) return;
      const g = new Garment3D(c3Ref.current);
      try { await g.load(model3dUrl.startsWith('/') ? model3dUrl : '/api/img?u=' + encodeURIComponent(model3dUrl)); } catch { g.dispose(); return; }
      if (dead) { g.dispose(); return; } g3.current = g;
    }).catch(() => { /* keep 2D */ });
    return () => { dead = true; g3.current?.dispose(); g3.current = null; };
  }, [model3dUrl, h === null]);
  const live = useRef<{ src: CanvasImageSource | null; multiply: boolean; body: Body | null; row?: SizeRow; showG: boolean; showZ: boolean }>({ src: null, multiply: false, body: null, showG: true, showZ: true });
  live.current = { src: garment.src, multiply: garment.multiply, body: sess.body, row: chart.find((r) => r.size === cur), showG, showZ };
  const { push } = sess;
  const lmsRef = useRef<{ l: Pt[] | null; t: number; w?: Pt[] | null }>({ l: null, t: 0 });
  const onLms = useCallback((l: Pt[] | null, wl?: Pt[] | null) => {
    const v = cam.videoRef.current, c = canvasRef.current; if (!v || !c || !v.videoWidth) return;
    if (c.width !== v.videoWidth) { c.width = v.videoWidth; c.height = v.videoHeight; }
    push(l, v.videoWidth, v.videoHeight);
    lmsRef.current = { l, t: performance.now(), w: wl ?? null };
  }, [push, cam.videoRef]);
  useEffect(() => {
    if (cam.state !== 'on') return;
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const v = cam.videoRef.current, c = canvasRef.current; if (!v || !c || !v.videoWidth) return;
      if (c.width !== v.videoWidth) { c.width = v.videoWidth; c.height = v.videoHeight; }
      const { l: raw, t } = lmsRef.current; const l = raw && performance.now() - t < 400 ? raw : null;
      const L = live.current;
      const under = (g: CanvasRenderingContext2D) => { if (l && L.showG && !g3.current && L.src && L.body && L.row) drawGarment(g, L.src, l, c.width, c.height, L.body.cmPerPx, L.row, smooth.current, L.multiply, v); };
      drawOverlay(c, l, zonesRef.current, under, L.showZ && !!zonesRef.current);
      const G = g3.current, c3 = c3Ref.current;
      if (G && c3) {
        if (c3.width !== c.width || c3.height !== c.height) G.resize(c.width, c.height);
        const wl = lmsRef.current.w;
        if (l && wl && L.showG) G.update(l as never, wl as never, c.width, c.height); else G.hide();
        G.render();
      }
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [cam.state, cam.videoRef]);
  const [photo, setPhoto] = useState<HTMLCanvasElement | null>(null); const [photoL, setPhotoL] = useState<Pt[] | null>(null); const [photoMsg, setPhotoMsg] = useState('');
  useEffect(() => {
    const c = canvasRef.current; if (!photo || !c) return;
    c.width = photo.width; c.height = photo.height;
    const g = c.getContext('2d'); if (!g) return;
    g.clearRect(0, 0, c.width, c.height); g.drawImage(photo, 0, 0);
    const row = chart.find((r) => r.size === cur);
    if (photoL && showG && garment.src && sess.body && row) drawGarment(g, garment.src, photoL, c.width, c.height, sess.body.cmPerPx, row, { cur: null }, garment.multiply, photo);
  }, [photo, photoL, showG, garment.src, garment.multiply, sess.body, cur, chart]);
  const loadPhoto = async (f: File) => {
    setPhotoMsg(''); cam.stop(); sess.reset();
    try {
      const bmp = await createImageBitmap(f, { imageOrientation: 'from-image' });
      const k = Math.min(1, 1280 / Math.max(bmp.width, bmp.height));
      const pc = document.createElement('canvas'); pc.width = Math.round(bmp.width * k); pc.height = Math.round(bmp.height * k);
      pc.getContext('2d')?.drawImage(bmp, 0, 0, pc.width, pc.height);
      const model = await loadPose(); let l: Pt[] | null = null; const t0 = performance.now();
      for (let i = 0; i < 3; i++) l = model.detectForVideo(pc, t0 + i * 40).landmarks[0] ?? null;
      if (!l) { setPhoto(null); setPhotoL(null); setPhotoMsg(gt('photoNoBody')); return; }
      for (let i = 0; i < 20; i++) push(l, pc.width, pc.height);
      setPhoto(pc); setPhotoL(l);
    } catch { setPhotoMsg(gt('photoNoBody')); }
  };
  const snap = async () => {
    const c = canvasRef.current, v = cam.videoRef.current; if (!c) return;
    let w = c.width, hh = c.height;
    if (!photo) { if (!v || !v.videoWidth) return; w = v.videoWidth; hh = v.videoHeight; }
    const o = document.createElement('canvas'); o.width = w; o.height = hh; const g = o.getContext('2d'); if (!g) return;
    if (photo) g.drawImage(c, 0, 0);
    else { if (cam.facing === 'user') { g.translate(w, 0); g.scale(-1, 1); } g.drawImage(v as HTMLVideoElement, 0, 0, w, hh); g.drawImage(c, 0, 0, w, hh); }
    const blob: Blob | null = await new Promise((r) => o.toBlob(r, 'image/jpeg', 0.92)); if (!blob) return;
    const file = new File([blob], 'karibu-try-on.jpg', { type: 'image/jpeg' });
    try { if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file] }); return; } } catch (e) { if ((e as { name?: string })?.name === 'AbortError') return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = file.name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };
  const pose = usePoseLoop(cam.videoRef, cam.state === 'on', onLms);
  const stopAll = () => { cam.stop(); sess.reset(); setSel(null); smooth.current.cur = null; const c = canvasRef.current; c?.getContext('2d')?.clearRect(0, 0, c.width, c.height); };
  const msg = photoMsg ? photoMsg : cam.state === 'denied' ? t('camDenied') : cam.state === 'error' ? t('camError') : pose === 'error' ? t('modelError') : pose === 'loading' ? t('loadingModel')
    : garment.status === 'loading' ? gt('garmentLoading') : garment.status === 'error' ? gt('garmentError')
    : sess.status === 'noBody' ? t('noBody') : sess.status === 'stepBack' ? t('stepBack') : sess.status === 'measuring' ? t('measuring') : '';
  if (h === null) return <HeightPrompt initial={null} onSave={(n) => { try { localStorage.setItem(KEY, String(n)); } catch { /* private mode */ } setH(n); }} />;
  const on = cam.state === 'on' || cam.state === 'starting';
  const tog = (a: boolean) => `rounded-full border px-3 py-1 text-xs font-medium ${a ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300 text-neutral-600'}`;
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{t('title')}</h1>
      <CameraView videoRef={cam.videoRef} canvasRef={canvasRef} canvas3dRef={model3dUrl ? c3Ref : undefined} mirrored={!photo && cam.facing === 'user'} />
      {msg && <p className="text-center text-sm text-neutral-600" role="status">{msg}</p>}
      <div className="flex gap-2">
        {on ? (<><button onClick={stopAll} className="flex-1 rounded-xl border border-neutral-300 px-4 py-3 font-medium">{t('stop')}</button><button onClick={() => { sess.reset(); smooth.current.cur = null; cam.flip(); }} className="flex-1 rounded-xl border border-neutral-300 px-4 py-3 font-medium">{t('flip')}</button></>)
          : (<button onClick={() => { setPhoto(null); setPhotoL(null); setPhotoMsg(''); cam.start('user'); }} className="w-full rounded-xl bg-neutral-900 px-4 py-3 font-medium text-white">{t('start')}</button>)}
      </div>
      <div className="flex gap-2">
        <button onClick={() => setShowG(!showG)} className={tog(showG)}>{gt('garment')}</button>
        <button onClick={() => setShowZ(!showZ)} className={tog(showZ)}>{gt('zones')}</button>
      </div>
      <div className="flex gap-2">
        {(on || photo) && <button onClick={snap} className="flex-1 rounded-xl bg-neutral-900 px-4 py-3 font-medium text-white">{gt('snap')}</button>}
        <label className="flex-1 cursor-pointer rounded-xl border border-neutral-300 px-4 py-3 text-center font-medium">{gt('uploadPhoto')}<input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void loadPhoto(f); }} /></label>
      </div>
      {!sess.fits && cur && <div className="flex flex-wrap gap-2" role="group">{chart.map((r) => <button key={r.size} onClick={() => setSel(r.size)} className={'rounded-full border px-4 py-2 text-sm font-semibold ' + (r.size === cur ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300')}>{r.size}</button>)}</div>}
      {sess.fits && cur && <FitVerdict rows={sess.fits.rows} best={sess.fits.best} cur={cur} onPick={setSel} />}
      <p className="text-xs text-neutral-500">{t('estimate')} {t('privacy')}</p>
      <button onClick={() => { stopAll(); try { localStorage.removeItem(KEY); } catch { /* ignore */ } setH(null); }} className="text-xs underline text-neutral-500">{t('changeHeight')} ({h} cm)</button>
    </div>
  );
}