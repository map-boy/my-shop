// FILE: src/components/SaveBar.tsx
import React from 'react';
import { RotateCcw, Save } from 'lucide-react';
import { Button } from './ui';

/** Sticky bar that appears as soon as a settings screen has unsaved changes. */
const SaveBar: React.FC<{
  dirty: boolean;
  busy: boolean;
  onSave: () => void;
  onReset: () => void;
  note?: string;
}> = ({ dirty, busy, onSave, onReset, note }) => {
  if (!dirty) return null;
  return (
    <div className="sticky bottom-4 z-20 mt-8 flex flex-wrap items-center gap-3 rounded-2xl border border-accent/40 bg-ink-900/95 p-4 shadow-2xl backdrop-blur-md">
      <p className="text-sm font-semibold text-white">
        Unsaved changes
        {note && <span className="ml-2 font-normal text-ink-400">{note}</span>}
      </p>
      <div className="ml-auto flex gap-2">
        <Button variant="ghost" size="sm" icon={<RotateCcw size={14} />} onClick={onReset} disabled={busy} className="text-ink-300 hover:bg-white/10">
          Discard
        </Button>
        <Button variant="accent" size="sm" icon={<Save size={14} />} onClick={onSave} loading={busy}>
          Save changes
        </Button>
      </div>
    </div>
  );
};

export default SaveBar;
