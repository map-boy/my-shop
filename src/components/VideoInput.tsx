// FILE: src/components/VideoInput.tsx
import React, { useRef, useState } from 'react';
import { Link2, Loader2, Trash2, Upload, Video } from 'lucide-react';
import { uploadFile } from '../lib/upload';
import { useToast } from '../context/ToastContext';
import { errorMessage } from '../lib/utils';

interface Props {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  hint?: string;
}

const MAX_BYTES = 15 * 1024 * 1024;

const VideoInput: React.FC<Props> = ({ value, onChange, folder = 'products/video', label, hint }) => {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [urlDraft, setUrlDraft] = useState('');

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('video/')) {
      toast.error('Please choose a video file (MP4 or WebM).');
      return;
    }
    if (file.size >= MAX_BYTES) {
      toast.error('That video is over 15 MB. Trim or compress it and try again.');
      return;
    }
    try {
      setProgress(0);
      const { url } = await uploadFile(file, folder, setProgress);
      onChange(url);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setProgress(null);
    }
  };

  const addUrl = () => {
    const url = urlDraft.trim();
    if (!url) return;
    onChange(url);
    setUrlDraft('');
  };

  return (
    <div>
      {label && <label className="label">{label}</label>}

      {value ? (
        <div className="relative overflow-hidden rounded-xl border border-ink-400/30 bg-black">
          <video src={value} controls playsInline preload="metadata" className="aspect-video w-full object-contain" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-2 top-2 rounded-lg bg-black/70 p-1.5 text-white transition hover:bg-red-600"
            aria-label="Remove video"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ) : (
        <>
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) void handleFile(f);
            }}
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-ink-400/40 px-4 py-7 text-center transition hover:border-accent/70"
          >
            {progress !== null ? (
              <>
                <Loader2 size={22} className="mb-2 animate-spin text-accent" />
                <p className="text-xs font-semibold text-ink-500">Uploading... {progress}%</p>
                <div className="mt-2 h-1 w-40 overflow-hidden rounded-full bg-ink-500/20">
                  <div className="h-full bg-accent transition-all" style={{ width: `${progress}%` }} />
                </div>
              </>
            ) : (
              <>
                <Video size={22} className="mb-2 text-ink-400" />
                <p className="text-xs font-semibold text-ink-500">Drop a video here or click to upload</p>
                <p className="mt-1 text-[10px] text-ink-500">MP4 or WebM, up to 15 MB</p>
              </>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
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
                placeholder="...or paste a direct video URL (.mp4)"
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

export default VideoInput;