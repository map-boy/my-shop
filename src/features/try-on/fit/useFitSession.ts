import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Body, Pt, SizeRow } from './types.ts';
import { fitAll } from './compare.ts';
import { measure } from './measure.ts';
import { stabilize } from './stabilize.ts';
import { inFrame } from '../pose/landmarks.ts';
export type FitStatus = 'idle' | 'noBody' | 'stepBack' | 'measuring' | 'ready';
const MIN = 15, WINDOW = 30;
export function useFitSession(heightCm: number, chart: SizeRow[]) {
  const samples = useRef<Body[]>([]); const tick = useRef(0);
  const [status, setStatus] = useState<FitStatus>('idle'); const [body, setBody] = useState<Body | null>(null);
  const reset = useCallback(() => { samples.current = []; tick.current = 0; setBody(null); setStatus('idle'); }, []);
  useEffect(reset, [heightCm, reset]);
  const push = useCallback((l: Pt[] | null, w: number, h: number) => {
    if (!l) return setStatus('noBody');
    if (!inFrame(l)) return setStatus('stepBack');
    const b = measure(l, w, h, heightCm); if (!b) return setStatus('stepBack');
    const s = samples.current; s.push(b); if (s.length > WINDOW) s.shift();
    if (s.length < MIN) return setStatus('measuring');
    if (tick.current++ % 6 === 0) setBody(stabilize(s));
    setStatus('ready');
  }, [heightCm]);
  const fits = useMemo(() => (body ? fitAll(body, chart) : null), [body, chart]);
  return { status, body, fits, push, reset };
}