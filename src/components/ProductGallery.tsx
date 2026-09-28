// FILE: src/components/ProductGallery.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { cn, PLACEHOLDER_IMAGE } from '../lib/utils';
import { L10n } from '../lib/i18n';

interface Props {
  images: string[];
  videoUrl?: string;
  alt: string;
  badge?: React.ReactNode;
}

type Media = { type: 'image'; src: string } | { type: 'video'; src: string };

const MIN = 1;
const MAX = 4;
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));

const ProductGallery: React.FC<Props> = ({ images, videoUrl, alt, badge }) => {
  const media = useMemo<Media[]>(() => {
    const list: Media[] = images.map((src): Media => ({ type: 'image', src }));
    if (videoUrl) list.push({ type: 'video', src: videoUrl });
    return list;
  }, [images, videoUrl]);

  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState({ s: 1, x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const viewer = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; scale: number } | null>(null);

  const safeIndex = Math.min(index, media.length - 1);
  const current = media[safeIndex];

  const fit = useCallback((s: number, x: number, y: number) => {
    const r = viewer.current?.getBoundingClientRect();
    const w = r?.width ?? 0;
    const h = r?.height ?? 0;
    const ns = clamp(s, MIN, MAX);
    const mx = ((ns - 1) * w) / 2;
    const my = ((ns - 1) * h) / 2;
    return {
      s: ns,
      x: ns === MIN ? 0 : clamp(x, -mx, mx),
      y: ns === MIN ? 0 : clamp(y, -my, my),
    };
  }, []);

  const zoomBy = (d: number) => setZoom((z) => fit(z.s + d, z.x, z.y));
  const reset = () => setZoom({ s: 1, x: 0, y: 0 });

  useEffect(() => {
    reset();
  }, [safeIndex]);

  // Wheel zoom: only with Ctrl held, or once already zoomed in, so normal page scrolling still works.
  useEffect(() => {
    const el = viewer.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (current?.type !== 'image') return;
      if (!e.ctrlKey && zoomRef.current.s === 1) return;
      e.preventDefault();
      const d = e.deltaY < 0 ? 0.25 : -0.25;
      setZoom((z) => fit(z.s + d, z.x, z.y));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [fit, current?.type]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setDragging(true);
    if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values());
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y) || 1, scale: zoomRef.current.s };
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = Array.from(pointers.current.values());
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const start = pinch.current;
      setZoom((z) => fit(start.scale * (dist / start.dist), z.x, z.y));
    } else if (pointers.current.size === 1 && zoomRef.current.s > 1) {
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      setZoom((z) => fit(z.s, z.x + dx, z.y + dy));
    }
  };

  const onPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId);
    pinch.current = null;
    if (pointers.current.size === 0) setDragging(false);
  };

  const onDoubleClick = () =>
    setZoom((z) => (z.s > 1 ? { s: 1, x: 0, y: 0 } : fit(2, 0, 0)));

  return (
    <div className={cn('relative', media.length > 1 && 'lg:pl-24')}>
      <div ref={viewer} className="relative aspect-square overflow-hidden rounded-brand bg-ink-100">
        {current.type === 'image' ? (
          <>
            <div
              className="absolute inset-0"
              style={{
                touchAction: zoom.s > 1 ? 'none' : 'pan-y',
                cursor: zoom.s > 1 ? (dragging ? 'grabbing' : 'grab') : 'zoom-in',
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerEnd}
              onPointerCancel={onPointerEnd}
              onDoubleClick={onDoubleClick}
            >
              <img
                src={current.src}
                alt={alt}
                draggable={false}
                className="h-full w-full select-none object-cover"
                style={{
                  transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.s})`,
                  transition: dragging ? 'none' : 'transform 0.2s ease-out',
                }}
                onError={(e) => ((e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE)}
              />
            </div>

            <div className="absolute bottom-3 right-3 flex overflow-hidden rounded-full bg-white/90 shadow-lg backdrop-blur">
              <button
                type="button"
                onClick={() => zoomBy(-0.5)}
                disabled={zoom.s <= MIN}
                className="flex h-10 w-10 items-center justify-center text-ink-900 transition hover:bg-ink-100 disabled:opacity-30"
                aria-label={L10n("Zoom out")}
              >
                <ZoomOut size={17} />
              </button>
              <button
                type="button"
                onClick={reset}
                disabled={zoom.s === MIN}
                className="flex h-10 w-10 items-center justify-center text-ink-900 transition hover:bg-ink-100 disabled:opacity-30"
                aria-label={L10n("Reset zoom")}
              >
                <RotateCcw size={15} />
              </button>
              <button
                type="button"
                onClick={() => zoomBy(0.5)}
                disabled={zoom.s >= MAX}
                className="flex h-10 w-10 items-center justify-center text-ink-900 transition hover:bg-ink-100 disabled:opacity-30"
                aria-label={L10n("Zoom in")}
              >
                <ZoomIn size={17} />
              </button>
            </div>
          </>
        ) : (
          <video
            key={current.src}
            src={current.src}
            controls
            playsInline
            preload="metadata"
            className="h-full w-full bg-black object-contain"
          />
        )}

        {badge && <div className="pointer-events-none absolute left-4 top-4 z-10">{badge}</div>}
      </div>

      {media.length > 1 && (
        <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto lg:absolute lg:bottom-0 lg:left-0 lg:top-0 lg:mt-0 lg:w-20 lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto">
          {media.map((m, i) => (
            <button
              key={`${m.type}-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={m.type === 'video' ? 'Play product video' : `Show image ${i + 1}`}
              className={cn(
                'h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition',
                i === safeIndex ? 'border-ink-900' : 'border-transparent opacity-60 hover:opacity-100',
              )}
            >
              {m.type === 'image' ? (
                <img src={m.src} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-ink-900 text-white">
                  <Play size={22} className="fill-current" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;