import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Body, Pt, SizeRow } from './types.ts';
import { fitAll } from './compare.ts';
import { measure, measureUpper } from './measure.ts';
import { stabilize } from './stabilize.ts';
import { inFrame, upperOk } from '../pose/landmarks.ts';
export type FitStatus = 'idle' | 'noBody' | 'stepBack' | 'measuring' | 'ready';
const MIN = 15, WINDOW = 30;
/** body = best scale so far (close-up preview or full body). fits only exist once the full body is measured. */
export function useFitSession(heightCm: number, chart: SizeRow[]) {
  const full = useRef<Body[]>([]); const up = useRef<Body[]>([]); const tick = useRef(0);
  const [status, setStatus] = useState<FitStatus>('idle'); const [body, setBody] = useState<Body | null>(null); const [isFull, setIsFull] = useState(false);
  const reset = useCallback(() => { full.current = []; up.current = []; tick.current = 0; setBody(null); setIsFull(false); setStatus('idle'); }, []);
  useEffect(reset, [heightCm, reset]);
  const push = useCallback((l: Pt[] | null, w: number, h: number) => {
    if (!l) return setStatus('noBody');
    const f = inFrame(l) ? measure(l, w, h, heightCm) : null;
    if (f) {
      const s = full.current; s.push(f); if (s.length > WINDOW) s.shift(); up.current = [];
      if (s.length < MIN) return setStatus('measuring');
      if (tick.current++ % 6 === 0) { setBody(stabilize(s)); setIsFull(true); }
      return setStatus('ready');
    }
    full.current = [];
    const u = upperOk(l) ? measureUpper(l, w, h, heightCm) : null;
    if (!u) { setBody(null); setIsFull(false); return setStatus('stepBack'); }
    const s = up.current; s.push(u); if (s.length > 10) s.shift();
    if (tick.current++ % 3 === 0) { setBody(stabilize(s)); setIsFull(false); }
    setStatus('stepBack');
  }, [heightCm]);
  const fits = useMemo(() => (body && isFull ? fitAll(body, chart) : null), [body, isFull, chart]);
  return { status, body, fits, push, reset };
}