// FILE: src/components/Splash.tsx
// First-load splash: bouncing dots -> ring closes -> smiley pops -> fades out. Covers the page until the real data has arrived.
import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useSections } from '../lib/sections';

type Phase = 'loading' | 'smile' | 'out' | 'gone';

const BRAND = 'KARIBU FIT';

const CSS = `
@keyframes ks-rot{to{transform:rotate(360deg)}}
@keyframes ks-bounce{0%,80%,100%{transform:translateY(0);opacity:.45}40%{transform:translateY(-9px);opacity:1}}
@keyframes ks-blink{0%,90%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}
@keyframes ks-wave{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-12px)}}
.ks-ltr{display:inline-block;animation:ks-wave 1.3s ease-in-out infinite}
.ks-ring{transform-origin:60px 60px;animation:ks-rot 1.1s linear infinite}
.ks-dot{animation:ks-bounce 1s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
.ks-eye{transform-box:fill-box;transform-origin:center;animation:ks-blink 2.2s ease-in-out 1.2s infinite}
@media (prefers-reduced-motion:reduce){.ks-ring,.ks-dot,.ks-eye,.ks-ltr{animation:none}}
`;

const Splash: React.FC = () => {
  const { pathname } = useLocation();
  const { ready } = useStore();
  const { loading: sectionsLoading } = useSections();
  const [phase, setPhase] = useState<Phase>('loading');
  const [timedOut, setTimedOut] = useState(false);
  const t0 = useRef(Date.now());
  const skip = pathname.startsWith('/admin') || pathname.startsWith('/agent');
  const done = (ready && !sectionsLoading) || timedOut;

  useEffect(() => { const t = window.setTimeout(() => setTimedOut(true), 7000); return () => window.clearTimeout(t); }, []);
  useEffect(() => { if (skip) setPhase('gone'); }, [skip]);

  useEffect(() => {
    if (phase !== 'loading' || !done) return undefined;
    const t = window.setTimeout(() => setPhase('smile'), Math.max(0, 500 - (Date.now() - t0.current)));
    return () => window.clearTimeout(t);
  }, [done, phase]);

  useEffect(() => {
    if (phase === 'smile') { const t = window.setTimeout(() => setPhase('out'), 1100); return () => window.clearTimeout(t); }
    if (phase === 'out') { const t = window.setTimeout(() => setPhase('gone'), 450); return () => window.clearTimeout(t); }
    return undefined;
  }, [phase]);

  if (skip || phase === 'gone') return null;

  const smiling = phase !== 'loading';
  const ease = 'cubic-bezier(.34,1.56,.64,1)';

  return (
    <div
      role="status"
      aria-label="Loading"
      style={{
        position: 'fixed', inset: 0, zIndex: 100000, background: '#fff',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14,
        opacity: phase === 'out' ? 0 : 1, transition: 'opacity .4s ease',
        pointerEvents: phase === 'out' ? 'none' : 'auto',
      }}
    >
      <style>{CSS}</style>
      <svg width="132" height="132" viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r="48" fill="none" stroke="#efeeec" strokeWidth="6" />
        <g className="ks-ring">
          <circle
            cx="60" cy="60" r="48" fill="none" stroke="var(--accent, #e0b34d)" strokeWidth="6" strokeLinecap="round"
            pathLength={100} strokeDasharray={smiling ? '100 0' : '26 74'}
            style={{ transition: 'stroke-dasharray .5s ease' }}
          />
        </g>
        <g style={{ opacity: smiling ? 0 : 1, transition: 'opacity .2s ease' }}>
          <circle className="ks-dot" cx="46" cy="60" r="4.5" fill="#171614" style={{ animationDelay: '0s' }} />
          <circle className="ks-dot" cx="60" cy="60" r="4.5" fill="#171614" style={{ animationDelay: '.15s' }} />
          <circle className="ks-dot" cx="74" cy="60" r="4.5" fill="#171614" style={{ animationDelay: '.3s' }} />
        </g>
        <g style={{ transform: smiling ? 'scale(1)' : 'scale(0)', transformOrigin: '60px 60px', transition: 'transform .5s ' + ease + ' .15s' }}>
          <circle cx="60" cy="60" r="38" fill="#FFD93B" />
          <circle className="ks-eye" cx="48" cy="54" r="4.2" fill="#171614" />
          <circle className="ks-eye" cx="72" cy="54" r="4.2" fill="#171614" />
          <path
            d="M44 68 Q60 86 76 68" fill="none" stroke="#171614" strokeWidth="4.5" strokeLinecap="round"
            pathLength={1} strokeDasharray="1" strokeDashoffset={smiling ? 0 : 1}
            style={{ transition: 'stroke-dashoffset .5s ease .5s' }}
          />
        </g>
      </svg>
      <p style={{ margin: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, fontFamily: 'var(--heading-font, "Playfair Display", Georgia, serif)', fontWeight: 800, fontSize: 'clamp(34px, 11vw, 64px)', lineHeight: 1, letterSpacing: '.06em', color: '#171614' }}>
        <span style={{ display: 'flex' }}>
          {BRAND.split('').map((c, i) => (
            <span key={i} className={smiling ? '' : 'ks-ltr'} style={{ animationDelay: i * 0.08 + 's', whiteSpace: 'pre', color: smiling ? 'var(--accent, #e0b34d)' : '#171614', transition: 'color .4s ease' }}>{c}</span>
          ))}
        </span>
        <span style={{ fontFamily: 'system-ui,sans-serif', fontSize: 12, fontWeight: 700, letterSpacing: '.28em', textTransform: 'uppercase', color: '#a5a19a' }}>{smiling ? 'Welcome' : 'Loading'}</span>
      </p>
    </div>
  );
};

export default Splash;