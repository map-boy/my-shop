// FILE: src/context/ToastContext.tsx
import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  kind: ToastKind;
  text: string;
}

interface ToastApi {
  toast: (text: string, kind?: ToastKind) => void;
  success: (text: string) => void;
  error: (text: string) => void;
}

const ToastContext = createContext<ToastApi | undefined>(undefined);

const ICONS = { success: CheckCircle2, error: AlertTriangle, info: Info } as const;
const TONES = {
  success: 'border-emerald-500/40 bg-emerald-50 text-emerald-900',
  error: 'border-red-500/40 bg-red-50 text-red-900',
  info: 'border-ink-300 bg-white text-ink-900',
} as const;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Toast[]>([]);

  const toast = useCallback((text: string, kind: ToastKind = 'info') => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, kind, text }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 4200);
  }, []);

  const api: ToastApi = {
    toast,
    success: (text) => toast(text, 'success'),
    error: (text) => toast(text, 'error'),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed bottom-5 right-5 z-[200] flex w-[min(92vw,22rem)] flex-col gap-2">
        {items.map((t) => {
          const Icon = ICONS[t.kind];
          return (
            <div
              key={t.id}
              role="status"
              className={`animate-fade-up flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg shadow-black/5 ${TONES[t.kind]}`}
            >
              <Icon size={18} className="mt-0.5 shrink-0" />
              <p className="flex-1 leading-snug">{t.text}</p>
              <button
                onClick={() => setItems((prev) => prev.filter((x) => x.id !== t.id))}
                className="opacity-50 transition hover:opacity-100"
                aria-label="Dismiss"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
