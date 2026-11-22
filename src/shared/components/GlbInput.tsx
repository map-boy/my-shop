import React, { useRef, useState } from 'react';
import { Box, Loader2, Trash2 } from 'lucide-react';
import { uploadFile } from '@/shared/lib/upload';
import { useToast } from '@/app/context/ToastContext';
import { errorMessage } from '@/shared/lib/utils';

interface Props { value: string; onChange: (url: string) => void; folder?: string; label?: string; hint?: string }
const MAX_BYTES = 4 * 1024 * 1024;

const GlbInput: React.FC<Props> = ({ value, onChange, folder = 'products/3d', label, hint }) => {
  const toast = useToast(); const ref = useRef<HTMLInputElement>(null); const [pct, setPct] = useState<number | null>(null);
  const pick = async (f: File) => {
    if (!/\.glb$/i.test(f.name)) { toast.error('Please choose a .glb file.'); return; }
    if (f.size >= MAX_BYTES) { toast.error('That GLB is over 4 MB. Compress it (glTF-Transform) and try again.'); return; }
    try { setPct(0); const { url } = await uploadFile(f, folder, setPct); onChange(url); }
    catch (e) { toast.error(errorMessage(e)); } finally { setPct(null); }
  };
  return (
    <div>
      {label && <label className="label">{label}</label>}
      {value ? (
        <div className="flex items-center justify-between rounded-xl border border-ink-400/30 px-4 py-3 text-xs">
          <span className="flex items-center gap-2 font-semibold text-ink-500"><Box size={16} /> 3D model attached</span>
          <button type="button" onClick={() => onChange('')} className="rounded-lg p-1.5 hover:bg-red-600 hover:text-white" aria-label="Remove 3D model"><Trash2 size={14} /></button>
        </div>
      ) : (
        <div onClick={() => ref.current?.click()} onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) void pick(f); }}
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-ink-400/40 px-4 py-7 text-center transition hover:border-accent/70">
          {pct !== null ? (<><Loader2 size={22} className="mb-2 animate-spin text-accent" /><p className="text-xs font-semibold text-ink-500">Uploading... {pct}%</p></>)
            : (<><Box size={22} className="mb-2 text-ink-400" /><p className="text-xs font-semibold text-ink-500">Drop a .glb here or click to upload</p><p className="mt-1 text-[10px] text-ink-500">GLB up to 4 MB</p></>)}
        </div>
      )}
      <input ref={ref} type="file" accept=".glb,model/gltf-binary" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void pick(f); e.target.value = ''; }} />
      {hint && <p className="mt-2 text-[11px] text-ink-500">{hint}</p>}
    </div>
  );
};
export default GlbInput;