// FILE: src/components/ImageInput.tsx
import React, { useRef, useState } from 'react';
import { GripVertical, ImagePlus, Link2, Loader2, Trash2, Upload } from 'lucide-react';
import { uploadFile } from '../lib/upload';
import { useToast } from '../context/ToastContext';
import { cn, errorMessage, PLACEHOLDER_IMAGE } from '../lib/utils';

interface Props {
  /** Current image URLs. */
  value: string[];
  onChange: (urls: string[]) => void;
  /** 1 for a single image (logo, banner), more for a product gallery. */
  max?: number;
  folder?: string;
  label?: string;
  hint?: string;
  /** Compact single-image square, used inside settings forms. */
  compact?: boolean;
}

/**
 * Image picker used everywhere in the dashboard. Accepts drag & drop, a file
 * picker, or a pasted URL, so an administrator is never blocked by Storage
 * being unconfigured.
 */
const ImageInput: React.FC<Props> = ({
  value,
  onChange,
  max = 6,
  folder = 'products',
  label,
  hint,
  compact,
}) => {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [urlDraft, setUrlDraft] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const room = Math.max(0, max - value.length);

  const handleFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/')).slice(0, room);
    if (!list.length) return;

    for (const file of list) {
      try {
        setProgress(0);
        const { url } = await uploadFile(file, folder, setProgress);
        onChange([...value, url].slice(0, max));
      } catch (err) {
        toast.error(errorMessage(err));
      } finally {
        setProgress(null);
      }
    }
  };

  const addUrl = () => {
    const url = urlDraft.trim();
    if (!url) return;
    onChange([...value, url].slice(0, max));
    setUrlDraft('');
  };

  const removeAt = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  const reorder = (from: number, to: number) => {
    const next = [...value];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  return (
    <div>
      {label && <label className="label">{label}</label>}

      {value.length > 0 && (
        <div className={cn('mb-3 grid gap-3', compact ? 'grid-cols-1' : 'grid-cols-3 sm:grid-cols-4')}>
          {value.map((src, i) => (
            <div
              key={`${src}-${i}`}
              draggable={!compact && value.length > 1}
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null && dragIndex !== i) reorder(dragIndex, i);
                setDragIndex(null);
              }}
              className={cn(
                'group relative overflow-hidden rounded-xl border border-ink-400/30 bg-ink-500/10',
                compact ? 'aspect-[16/9]' : 'aspect-square',
              )}
            >
              <img
                src={src}
                alt=""
                className="h-full w-full object-cover"
                onError={(e) => ((e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE)}
              />
              {i === 0 && !compact && value.length > 1 && (
                <span className="absolute left-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                  Main
                </span>
              )}
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute right-1.5 top-1.5 rounded-lg bg-black/70 p-1.5 text-white opacity-0 transition group-hover:opacity-100"
                aria-label="Remove image"
              >
                <Trash2 size={13} />
              </button>
              {!compact && value.length > 1 && (
                <span className="absolute bottom-1.5 left-1.5 cursor-grab rounded bg-black/60 p-1 text-white/70">
                  <GripVertical size={12} />
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {room > 0 && (
        <>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              void handleFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-7 text-center transition',
              dragOver ? 'border-accent bg-accent/5' : 'border-ink-400/40 hover:border-accent/70',
            )}
          >
            {progress !== null ? (
              <>
                <Loader2 size={22} className="mb-2 animate-spin text-accent" />
                <p className="text-xs font-semibold text-ink-500">Uploading… {progress}%</p>
                <div className="mt-2 h-1 w-40 overflow-hidden rounded-full bg-ink-500/20">
                  <div className="h-full bg-accent transition-all" style={{ width: `${progress}%` }} />
                </div>
              </>
            ) : (
              <>
                <ImagePlus size={22} className="mb-2 text-ink-400" />
                <p className="text-xs font-semibold text-ink-500">
                  Drop {max > 1 ? 'images' : 'an image'} here or click to upload
                </p>
                <p className="mt-1 text-[10px] text-ink-500">
                  PNG, JPG or WebP · up to 15 MB{max > 1 ? ` · ${room} slot${room === 1 ? '' : 's'} left` : ''}
                </p>
              </>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple={max > 1}
            hidden
            onChange={(e) => {
              if (e.target.files) void handleFiles(e.target.files);
              e.target.value = '';
            }}
          />

          <div className="mt-3 flex gap-2">
            <div className="relative flex-1">
              <Link2 size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
              <input
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUrl())}
                placeholder="…or paste an image URL"
                className="field pl-9"
              />
            </div>
            <button
              type="button"
              onClick={addUrl}
              className="shrink-0 rounded-xl border border-ink-400/40 px-4 text-xs font-bold uppercase tracking-wider text-ink-500 transition hover:border-accent hover:text-accent"
            >
              <Upload size={14} />
            </button>
          </div>
        </>
      )}

      {hint && <p className="mt-2 text-[11px] text-ink-500">{hint}</p>}
    </div>
  );
};

export default ImageInput;
