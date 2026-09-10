// FILE: src/pages/admin/AdminLogin.tsx
import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, LogOut, ShieldAlert, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { OWNER_EMAIL } from '../../lib/firebase';
import { Button, Spinner } from '../../components/ui';
import { errorMessage } from '../../lib/utils';

const GoogleMark = () => (
  <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.7 1.22 9.2 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 0 1 9.77 24c0-1.6.28-3.14.76-4.59l-7.98-6.19A23.94 23.94 0 0 0 0 24c0 3.88.93 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.17 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

const AdminLogin: React.FC = () => {
  const { user, isAdmin, loading, denied, signInWithGoogle, signOut } = useAuth();
  const { settings } = useStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950">
        <Spinner size={26} />
      </div>
    );
  }

  if (isAdmin) return <Navigate to="/admin/dashboard" replace />;

  const handleSignIn = async () => {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-shell relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-950 px-4 py-14">
      <div className="pointer-events-none absolute inset-0 opacity-[0.18]">
        <div className="absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-accent blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 h-[28rem] w-[28rem] rounded-full bg-accent blur-[120px]" />
      </div>

      <div className="animate-fade-up relative w-full max-w-md">
        <div className="mb-10 text-center">
          <span className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="" className="h-9 w-9 object-contain" />
            ) : (
              <ShieldCheck size={28} className="text-accent" />
            )}
          </span>
          <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">Control room</h1>
          <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.28em] text-ink-500">
            {settings.storeName} · Administrators only
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl sm:p-10">
          {denied && (
            <div className="mb-7 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              <ShieldAlert size={18} className="mt-0.5 shrink-0 text-red-400" />
              <div className="min-w-0">
                <p className="font-semibold">Access denied</p>
                <p className="mt-1 break-words text-xs leading-relaxed text-red-200/80">
                  <span className="font-mono">{denied}</span> is not on the administrator list. Ask an existing
                  administrator to add you from Dashboard → Team.
                </p>
                <button
                  onClick={() => void signOut()}
                  className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-red-200 hover:text-white"
                >
                  <LogOut size={12} /> Use a different account
                </button>
              </div>
            </div>
          )}

          {error && !denied && (
            <div className="mb-7 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200">
              {error}
            </div>
          )}

          <button
            onClick={handleSignIn}
            disabled={busy}
            className="flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-white text-sm font-bold uppercase tracking-[0.1em] text-ink-900 transition hover:bg-ink-100 active:scale-[0.98] disabled:opacity-60"
          >
            {busy ? <Spinner size={18} className="text-ink-900" /> : <GoogleMark />}
            Continue with Google
          </button>

          <div className="mt-8 flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <Sparkles size={15} className="mt-0.5 shrink-0 text-accent" />
            <p className="text-[11px] leading-relaxed text-ink-400">
              First time here? Sign in with{' '}
              <span className="font-mono text-ink-200">{OWNER_EMAIL}</span> — the owner account is created
              automatically and can then invite everyone else.
            </p>
          </div>

          {user && !isAdmin && !denied && (
            <p className="mt-6 text-center text-[11px] text-ink-500">
              Signed in as {user.email} ·{' '}
              <button onClick={() => void signOut()} className="underline hover:text-white">sign out</button>
            </p>
          )}
        </div>

        <Link
          to="/"
          className="mt-10 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-ink-500 transition hover:text-accent"
        >
          <ArrowLeft size={13} /> Back to the shop
        </Link>

        <p className="mt-6 text-center font-mono text-[10px] text-ink-700">build {__BUILD_ID__}</p>
      </div>
    </div>
  );
};

export default AdminLogin;
