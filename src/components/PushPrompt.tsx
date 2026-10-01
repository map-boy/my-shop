// FILE: src/components/PushPrompt.tsx
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { L10n } from '../lib/i18n';
import { canAsk, dismissAsk, enablePush, registerSW, syncToken } from '../lib/push';

/** Soft ask, shown a few seconds after someone opens a product or a shop. Never on the first second. */
const PushPrompt: React.FC = () => {
  const { pathname } = useLocation();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { registerSW(); }, []);

  useEffect(() => {
    if (pathname.startsWith('/admin')) { setShow(false); return () => undefined; }
    void syncToken();
    let t: number | undefined;
    if (/^\/(product|shop)\//.test(pathname)) {
      t = window.setTimeout(() => { void canAsk().then((ok) => { if (ok) setShow(true); }); }, 8000);
    }
    return () => { if (t) window.clearTimeout(t); };
  }, [pathname]);

  if (!show) return null;

  const allow = async () => {
    setBusy(true);
    await enablePush();
    setBusy(false);
    setShow(false);
  };
  const later = () => { dismissAsk(); setShow(false); };

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md rounded-2xl bg-ink-950 p-4 text-white shadow-2xl sm:bottom-6">
      <div className="flex items-start gap-3">
        <Bell size={20} className="mt-0.5 shrink-0 text-accent" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">{L10n('Get notified when new clothes arrive?')}</p>
          <p className="mt-1 text-xs text-white/60">{L10n('We only message you about shops you looked at.')}</p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => void allow()}
              disabled={busy}
              className="rounded-lg bg-accent px-4 py-2 text-xs font-bold text-ink-950 disabled:opacity-60"
            >
              {L10n('Yes, notify me')}
            </button>
            <button onClick={later} className="rounded-lg px-3 py-2 text-xs font-bold text-white/70 hover:text-white">
              {L10n('Not now')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PushPrompt;