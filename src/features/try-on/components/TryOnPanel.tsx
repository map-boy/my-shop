import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useCamera } from '../camera/useCamera';
import { useFitSession } from '../fit/useFitSession.ts';
import { DEFAULT_CHART } from '../fit/sizeChart.ts';
import type { Body, Pt, SizeRow, ZoneResult } from '../fit/types.ts';
import { usePoseLoop } from '../pose/usePoseLoop';
import { drawOverlay } from '../pose/drawOverlay.ts';
import { drawGarment, type Smooth } from '../garment/drawGarment.ts';
import { useGarment } from '../garment/useGarment.ts';
import { useGT } from '../garment/strings.ts';
import { useTT } from '../strings';
import CameraView from './CameraView';
import FitVerdict from './FitVerdict';
import HeightPrompt from './HeightPrompt';
const KEY = 'tryon.height';
const loadH = () => { try { const n = Number(localStorage.getItem(KEY)); return n >= 120 && n <= 220 ? n : null; } catch { return null; } };
interface Props { chart?: SizeRow[]; garmentUrl?: string | null }
export default function TryOnPanel({ chart = DEFAULT_CHART, garmentUrl = null }: Props) {
  const t = useTT(); const gt = useGT();
  const [h, setH] = useState<number | null>(loadH); const [sel, setSel] = useState<string | null>(null);
  const [showG, setShowG] = useState(true); const [showZ, setShowZ] = useState(false);
  const cam = useCamera(); const canvasRef = useRef<HTMLCanvasElement>(null);
  const sess = useFitSession(h ?? 170, chart); const garment = useGarment(garmentUrl);
  const cur = sel ?? sess.fits?.best ?? chart[Math.floor(chart.length / 2)]?.size ?? null;
  const zonesRef = useRef<ZoneResult[] | undefined>(undefined); zonesRef.current = sess.fits?.rows.find((r) => r.size === cur)?.zones;
  const smooth = useRef<Smooth>({ cur: null });
  const live = useRef<{ src: CanvasImageSource | null; multiply: boolean; body: Body | null; row?: SizeRow; showG: boolean; showZ: boolean }>({ src: null, multiply: false, body: null, showG: true, showZ: true });
  live.current = { src: garment.src, multiply: garment.multiply, body: sess.body, row: chart.find((r) => r.size === cur), showG, showZ };
  const { push } = sess;
  const lmsRef = useRef<{ l: Pt[] | null; t: number }>({ l: null, t: 0 });
  const onLms = useCallback((l: Pt[] | null) => {
    const v = cam.videoRef.current, c = canvasRef.current; if (!v || !c || !v.videoWidth) return;
    if (c.width !== v.videoWidth) { c.width = v.videoWidth; c.height = v.videoHeight; }
    push(l, v.videoWidth, v.videoHeight);
    lmsRef.current = { l, t: performance.now() };
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
      const under = (g: CanvasRenderingContext2D) => { if (l && L.showG && L.src && L.body && L.row) drawGarment(g, L.src, l, c.width, c.height, L.body.cmPerPx, L.row, smooth.current, L.multiply); };
      drawOverlay(c, l, zonesRef.current, under, L.showZ && !!zonesRef.current);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [cam.state, cam.videoRef]);
  const pose = usePoseLoop(cam.videoRef, cam.state === 'on', onLms);
  const stopAll = () => { cam.stop(); sess.reset(); setSel(null); smooth.current.cur = null; const c = canvasRef.current; c?.getContext('2d')?.clearRect(0, 0, c.width, c.height); };
  const msg = cam.state === 'denied' ? t('camDenied') : cam.state === 'error' ? t('camError') : pose === 'error' ? t('modelError') : pose === 'loading' ? t('loadingModel')
    : garment.status === 'loading' ? gt('garmentLoading') : garment.status === 'error' ? gt('garmentError')
    : sess.status === 'noBody' ? t('noBody') : sess.status === 'stepBack' ? t('stepBack') : sess.status === 'measuring' ? t('measuring') : '';
  if (h === null) return <HeightPrompt initial={null} onSave={(n) => { try { localStorage.setItem(KEY, String(n)); } catch { /* private mode */ } setH(n); }} />;
  const on = cam.state === 'on' || cam.state === 'starting';
  const tog = (a: boolean) => `rounded-full border px-3 py-1 text-xs font-medium ${a ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300 text-neutral-600'}`;
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{t('title')}</h1>
      <CameraView videoRef={cam.videoRef} canvasRef={canvasRef} mirrored={cam.facing === 'user'} />
      {msg && <p className="text-center text-sm text-neutral-600" role="status">{msg}</p>}
      <div className="flex gap-2">
        {on ? (<><button onClick={stopAll} className="flex-1 rounded-xl border border-neutral-300 px-4 py-3 font-medium">{t('stop')}</button><button onClick={() => { sess.reset(); smooth.current.cur = null; cam.flip(); }} className="flex-1 rounded-xl border border-neutral-300 px-4 py-3 font-medium">{t('flip')}</button></>)
          : (<button onClick={() => cam.start('user')} className="w-full rounded-xl bg-neutral-900 px-4 py-3 font-medium text-white">{t('start')}</button>)}
      </div>
      <div className="flex gap-2">
        <button onClick={() => setShowG(!showG)} className={tog(showG)}>{gt('garment')}</button>
        <button onClick={() => setShowZ(!showZ)} className={tog(showZ)}>{gt('zones')}</button>
      </div>
      {!sess.fits && cur && <div className="flex flex-wrap gap-2" role="group">{chart.map((r) => <button key={r.size} onClick={() => setSel(r.size)} className={'rounded-full border px-4 py-2 text-sm font-semibold ' + (r.size === cur ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300')}>{r.size}</button>)}</div>}
      {sess.fits && cur && <FitVerdict rows={sess.fits.rows} best={sess.fits.best} cur={cur} onPick={setSel} />}
      <p className="text-xs text-neutral-500">{t('estimate')} {t('privacy')}</p>
      <button onClick={() => { stopAll(); try { localStorage.removeItem(KEY); } catch { /* ignore */ } setH(null); }} className="text-xs underline text-neutral-500">{t('changeHeight')} ({h} cm)</button>
    </div>
  );
}