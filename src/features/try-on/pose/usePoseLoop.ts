import { useEffect, useRef, useState, type RefObject } from 'react';
import { loadPose } from './poseModel';
import type { Pt } from '../fit/types.ts';
export type PoseStatus = 'idle' | 'loading' | 'ready' | 'error';
/** ~15 fps pose detection on a playing <video>. Returns the status string. Frames stay on the device. */
export function usePoseLoop(video: RefObject<HTMLVideoElement | null>, active: boolean, onLms: (l: Pt[] | null) => void): PoseStatus {
  const cb = useRef(onLms); cb.current = onLms;
  const [status, setStatus] = useState<PoseStatus>('idle');
  useEffect(() => {
    if (!active) { setStatus('idle'); return; }
    let stop = false, raf = 0, last = 0; setStatus('loading');
    loadPose().then((model) => {
      if (stop) return; setStatus('ready');
      const tick = () => {
        if (stop) return; raf = requestAnimationFrame(tick);
        const v = video.current, now = performance.now();
        if (!v || v.readyState < 2 || now - last < 66) return; last = now;
        try { cb.current(model.detectForVideo(v, now).landmarks[0] ?? null); } catch { /* skip frame */ }
      };
      tick();
    }).catch(() => { if (!stop) setStatus('error'); });
    return () => { stop = true; cancelAnimationFrame(raf); };
  }, [active, video]);
  return status;
}