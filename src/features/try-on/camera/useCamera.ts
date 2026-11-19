import { useCallback, useEffect, useRef, useState } from 'react';
export type CamState = 'idle' | 'starting' | 'on' | 'denied' | 'error';
export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null); const stream = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CamState>('idle'); const [facing, setFacing] = useState<'user' | 'environment'>('user');
  const halt = () => { stream.current?.getTracks().forEach((t) => t.stop()); stream.current = null; };
  const stop = useCallback(() => { halt(); setState('idle'); }, []);
  const start = useCallback(async (f: 'user' | 'environment' = 'user') => {
    halt(); setState('starting');
    try {
      if (!navigator.mediaDevices?.getUserMedia) return setState('error'); // needs https or localhost
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: f, width: { ideal: 720 }, height: { ideal: 1280 } }, audio: false });
      stream.current = s; const v = videoRef.current;
      if (v) { v.srcObject = s; v.muted = true; await v.play(); }
      setFacing(f); setState('on');
    } catch (e) { setState((e as { name?: string })?.name === 'NotAllowedError' ? 'denied' : 'error'); }
  }, []);
  useEffect(() => halt, []);
  return { videoRef, state, facing, start, stop, flip: () => start(facing === 'user' ? 'environment' : 'user') };
}