// FILE: src/pages/AgentProgram.tsx
// Public agent program page at /agents: rules, earnings, then Google sign-in + application + queue status.
import React, { useEffect, useState } from 'react';
import { getApp } from 'firebase/app';
import { GoogleAuthProvider, getAuth, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { Check, Clock, Copy, MessageCircle } from 'lucide-react';
import { db } from '../lib/firebase';
import { useToast } from '../context/ToastContext';
import { Button, Spinner } from '../components/ui';
import { errorMessage } from '../lib/utils';

interface Cfg { rules?: string; earnings?: string }
interface App { name: string; phone: string; status: 'pending' | 'approved' | 'rejected'; queuePos?: number; agentCode?: string; groupLink?: string; createdAt: number }

const DEFAULT_RULES = [
  'Share your personal agent link. You receive it, plus your private dashboard, once you are approved.',
  'A visit is paid only for a NEW visitor (one device is paid once) who stays active for the minimum time and views a product, scrolls or opens 2 pages.',
  'Bots, link previews, repeat visits from the same device and visits voided by admin are not paid.',
  'A daily cap on paid visits applies to every agent.',
  'A sale counts only after admin confirms it as Sold (the customer has paid).',
  'No self-visits, fake traffic or spam. Fraud means removal and no payout.',
  'Payouts are recorded by admin (Mobile Money) and appear in your dashboard.',
  'If many people are reached and nobody buys, admin may stop the campaign and decide another arrangement. Admin messages appear on your dashboard.',
];
const DEFAULT_EARN = [
  'Default: 100 RWF for each new qualified visitor (your exact amount is set when you are approved).',
  'A fixed commission for each confirmed sale (amount set by admin).',
  'Your balance = earnings minus payouts, shown live on your dashboard at /agent.',
];
const STEPS = [
  'Read the rules and earnings below',
  'Sign in with Google and apply',
  'Your application waits in the queue',
  'When approved you are added to the WhatsApp group (for any problem) and get your agent links',
  'Share your link and watch your earnings',
];
const lines = (s: string | undefined, d: string[]) => {
  const l = (s ?? '').split('\n').map((x) => x.trim()).filter(Boolean);
  return l.length ? l : d;
};
const card = 'rounded-2xl border border-ink-200 bg-white p-5';
const inp = 'w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-[14px] text-ink-900';

const AgentProgram: React.FC = () => {
  const toast = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [cfg, setCfg] = useState<Cfg>({});
  const [app, setApp] = useState<App | null>(null);
  const [appLoaded, setAppLoaded] = useState(false);
  const [read, setRead] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', note: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => onAuthStateChanged(getAuth(getApp()), (u) => {
    setUser(u); setReady(true);
    if (u) setForm((f) => (f.name ? f : { ...f, name: u.displayName ?? '' }));
  }), []);

  useEffect(() => onSnapshot(doc(db, 'agentProgram', 'config'), (s) => setCfg((s.data() as Cfg | undefined) ?? {}), () => setCfg({})), []);

  const email = (user?.email ?? '').toLowerCase();
  useEffect(() => {
    setApp(null); setAppLoaded(false);
    if (!email) return undefined;
    return onSnapshot(doc(db, 'agentApplications', email),
      (s) => { setApp(s.exists() ? (s.data() as App) : null); setAppLoaded(true); },
      () => { setApp(null); setAppLoaded(true); });
  }, [email]);

  const login = async () => { try { await signInWithPopup(getAuth(getApp()), new GoogleAuthProvider()); } catch (e) { toast.error(errorMessage(e)); } };

  const submit = async () => {
    if (!user || !email) return;
    if (!read) return toast.error('Please confirm you have read the rules.');
    if (!form.name.trim()) return toast.error('Enter your name.');
    if (form.phone.replace(/\D/g, '').length < 9) return toast.error('Enter your WhatsApp number.');
    setBusy(true);
    try {
      await setDoc(doc(db, 'agentApplications', email), {
        name: form.name.trim().slice(0, 80), phone: form.phone.trim().slice(0, 24), email,
        note: form.note.trim().slice(0, 400), agreed: true, status: 'pending', createdAt: Date.now(),
      });
      const t = await user.getIdToken();
      void fetch('/api/agent-apply', { method: 'POST', headers: { Authorization: `Bearer ${t}` } }).catch(() => undefined);
      toast.success('Application sent.');
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const refLink = app?.agentCode ? `${origin}/?ref=${app.agentCode}` : '';
  const copy = () => { void navigator.clipboard.writeText(refLink).then(() => toast.success('Link copied.')).catch(() => toast.error('Copy failed.')); };

  if (!ready || (user && !appLoaded)) return <div className="flex min-h-[60vh] items-center justify-center"><Spinner size={26} /></div>;

  const Rules = lines(cfg.rules, DEFAULT_RULES);
  const Earn = lines(cfg.earnings, DEFAULT_EARN);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">Agent program</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink-900 sm:text-4xl">Earn by sharing</h1>
        <p className="mt-2 text-sm text-ink-500">Read how the journey works, then apply. Nothing is paid until you are approved.</p>
      </header>

      <section className={card}>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-ink-900">Your journey</h2>
        <ol className="space-y-2">
          {STEPS.map((s, i) => (
            <li key={s} className="flex gap-3 text-[14px] text-ink-800">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-black text-ink-950">{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className={card}>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-ink-900">How you earn</h2>
        <ul className="list-disc space-y-2 pl-5 text-[14px] text-ink-800">{Earn.map((x) => <li key={x}>{x}</li>)}</ul>
      </section>

      <section className={card}>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-ink-900">Rules</h2>
        <ul className="list-disc space-y-2 pl-5 text-[14px] text-ink-800">{Rules.map((x) => <li key={x}>{x}</li>)}</ul>
      </section>

      <section className={card}>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-ink-900">Apply</h2>

        {!app && (
          <label className="mb-4 flex items-start gap-3 text-[14px] text-ink-800">
            <input type="checkbox" checked={read} onChange={(e) => setRead(e.target.checked)} className="mt-1 h-4 w-4 accent-[var(--accent)]" />
            <span>I have read the journey, earnings and rules above and I accept them.</span>
          </label>
        )}

        {!user && (
          <Button variant="accent" size="lg" disabled={!read} onClick={() => void login()}>Sign in with Google to apply</Button>
        )}

        {user && !app && (
          <div className="space-y-3">
            <p className="text-[12px] text-ink-500">Signed in as {email}. <button className="underline" onClick={() => void signOut(getAuth(getApp()))}>Use another account</button></p>
            <input className={inp} placeholder="Your name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <input className={inp} placeholder="WhatsApp number (0788 000 000)" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            <textarea className={inp} rows={3} maxLength={400} placeholder="Where will you share the link? (optional)" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
            <Button variant="accent" size="lg" loading={busy} disabled={!read} onClick={() => void submit()}>Send application</Button>
          </div>
        )}

        {app?.status === 'pending' && (
          <div className="flex items-start gap-3 rounded-xl bg-ink-100 p-4 text-[14px] text-ink-900">
            <Clock size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-bold">Your application is in the queue{app.queuePos ? ` (position ${app.queuePos})` : ''}.</p>
              <p className="mt-1 text-ink-600">When it is approved you will be added to our WhatsApp group (for anyone with a problem) and you will receive your agent links here and on WhatsApp.</p>
            </div>
          </div>
        )}

        {app?.status === 'approved' && (
          <div className="space-y-3 rounded-xl bg-ink-100 p-4 text-[14px] text-ink-900">
            <p className="flex items-center gap-2 font-bold"><Check size={18} /> Approved. Your agent code is {app.agentCode}.</p>
            {app.groupLink && (
              <a href={app.groupLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2 font-bold text-white"><MessageCircle size={16} /> Join the WhatsApp group</a>
            )}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-500">Your referral link (share this)</p>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <code className="break-all rounded-lg bg-white px-3 py-2 text-[13px]">{refLink}</code>
                <Button size="sm" variant="accent" icon={<Copy size={14} />} onClick={copy}>Copy</Button>
              </div>
            </div>
            <p>Your private dashboard: <Link to="/agent" className="font-bold underline">{origin}/agent</Link></p>
          </div>
        )}

        {app?.status === 'rejected' && (
          <p className="rounded-xl bg-ink-100 p-4 text-[14px] text-ink-900">Your application was not accepted this time. Contact us if you have questions.</p>
        )}
      </section>
    </div>
  );
};

export default AgentProgram;