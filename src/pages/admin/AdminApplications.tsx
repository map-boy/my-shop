// FILE: src/pages/admin/AdminApplications.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { getApp } from 'firebase/app';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { collection, doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { Bell, Check, MessageCircle, X } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { logActivity } from '../../lib/activity';
import { Button } from '../../components/ui';
import { errorMessage } from '../../lib/utils';

interface App { id: string; name: string; phone: string; email: string; note?: string; status: 'pending' | 'approved' | 'rejected'; createdAt: number; queuePos?: number; agentCode?: string }
interface Ag { id: string; name: string; phone?: string; active: boolean; orderCount?: number; adminMessage?: string }
interface Vis { id: string; code: string; voided?: boolean; ua?: string }
interface Led { id: string; code: string; status: string }

const BOT = /bot|crawl|spider|headless|lighthouse|preview|facebookexternalhit|whatsapp/i;
const card = 'rounded-2xl border border-white/10 bg-white/[0.04] p-5';
const th = 'px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-ink-500';
const td = 'px-3 py-2.5 text-[13px] text-ink-300';
const inp = 'w-full rounded-xl bg-white px-3 py-2 text-[13px] text-ink-900';
const dt = (n: number) => (n ? new Date(n).toLocaleString() : '-');
const mapDocs = <T,>(s: { docs: { id: string; data: () => unknown }[] }) => s.docs.map((d) => ({ ...(d.data() as object), id: d.id })) as unknown as T[];
const waLink = (phone: string, text: string) => {
  let d = (phone || '').replace(/\D/g, '');
  if (d.length === 10 && d.startsWith('0')) d = '250' + d.slice(1);
  return `https://wa.me/${d}?text=${encodeURIComponent(text)}`;
};

const AdminApplications: React.FC = () => {
  const { admin } = useAuth();
  const toast = useToast();
  const actor = admin?.email ?? 'admin';

  const [apps, setApps] = useState<App[]>([]);
  const [agents, setAgents] = useState<Ag[]>([]);
  const [visits, setVisits] = useState<Vis[]>([]);
  const [leads, setLeads] = useState<Led[]>([]);
  const [cfg, setCfg] = useState({ rules: '', earnings: '', threshold: 30, message: '', groupLink: '' });
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const un = [
      onSnapshot(collection(db, 'agentApplications'), (s) => setApps(mapDocs<App>(s)), () => setApps([])),
      onSnapshot(collection(db, 'agents'), (s) => setAgents(mapDocs<Ag>(s)), () => setAgents([])),
      onSnapshot(collection(db, 'agentVisits'), (s) => setVisits(mapDocs<Vis>(s)), () => setVisits([])),
      onSnapshot(collection(db, 'agentLeads'), (s) => setLeads(mapDocs<Led>(s)), () => setLeads([])),
    ];
    return () => un.forEach((u) => u());
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const [a, b] = await Promise.all([getDoc(doc(db, 'agentProgram', 'config')), getDoc(doc(db, 'agentProgramPrivate', 'config'))]);
        const x = (a.data() ?? {}) as { rules?: string; earnings?: string; threshold?: number; message?: string };
        const y = (b.data() ?? {}) as { groupLink?: string };
        setCfg({ rules: x.rules ?? '', earnings: x.earnings ?? '', threshold: x.threshold ?? 30, message: x.message ?? '', groupLink: y.groupLink ?? '' });
      } catch { /* ignore */ }
    })();
  }, []);

  const registerAlerts = async (silent: boolean) => {
    try {
      const vapid = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;
      if (!vapid || !('Notification' in window) || !(await isSupported())) { if (!silent) toast.error('This browser cannot receive push alerts.'); return; }
      if (Notification.permission !== 'granted') {
        if (silent) return;
        if ((await Notification.requestPermission()) !== 'granted') return toast.error('Notifications were blocked in the browser.');
      }
      await navigator.serviceWorker.register('/sw.js');
      const reg = await navigator.serviceWorker.ready;
      const token = await getToken(getMessaging(getApp()), { vapidKey: vapid, serviceWorkerRegistration: reg });
      if (!token) return;
      await setDoc(doc(db, 'adminPushTokens', token), { token, email: actor, updatedAt: Date.now() }, { merge: true });
      if (!silent) toast.success('This device will get an alert for every new application.');
    } catch (e) { if (!silent) toast.error(errorMessage(e)); }
  };
  useEffect(() => { void registerAlerts(true); }, []);

  const saveCfg = async () => {
    setBusy(true);
    try {
      await setDoc(doc(db, 'agentProgram', 'config'), { rules: cfg.rules, earnings: cfg.earnings, threshold: Number(cfg.threshold) || 30, message: cfg.message.trim(), messageAt: Date.now() }, { merge: true });
      await setDoc(doc(db, 'agentProgramPrivate', 'config'), { groupLink: cfg.groupLink.trim() }, { merge: true });
      logActivity(actor, 'updated agent program', 'config');
      toast.success('Saved.');
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };

  const approve = async (a: App) => {
    const base = (a.name || 'AG').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'AG';
    let code = '';
    for (let i = 0; i < 30; i++) {
      const c = base + Math.floor(100 + Math.random() * 900);
      if (!agents.some((x) => x.id === c)) { code = c; break; }
    }
    if (!code) return toast.error('Could not create a code, try again.');
    setBusy(true);
    try {
      await setDoc(doc(db, 'agents', code), {
        code, name: a.name, phone: a.phone, notes: 'From application', active: true, email: a.email.toLowerCase(),
        perVisit: 100, commissionPerSale: 0, minActiveSec: 30, dailyCap: 50, createdAt: Date.now(),
      });
      await setDoc(doc(db, 'agentApplications', a.id), { status: 'approved', agentCode: code, groupLink: cfg.groupLink.trim(), approvedAt: Date.now() }, { merge: true });
      logActivity(actor, 'approved agent', code);
      toast.success(`Approved as ${code}. Send them the WhatsApp message.`);
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };

  const reject = async (a: App) => {
    try {
      await setDoc(doc(db, 'agentApplications', a.id), { status: 'rejected' }, { merge: true });
      logActivity(actor, 'rejected agent application', a.email);
    } catch (e) { toast.error(errorMessage(e)); }
  };

  const origin = window.location.origin;
  const welcome = (a: App) =>
    `Hello ${a.name}, you are approved as a Karibu agent. Join our WhatsApp group (for any problem): ${cfg.groupLink || '(link coming)'}\n` +
    `Your agent link (share this): ${origin}/?ref=${a.agentCode}\nYour private dashboard: ${origin}/agent (sign in with ${a.email})`;

  const pending = useMemo(() => apps.filter((a) => a.status === 'pending').sort((x, y) => x.createdAt - y.createdAt), [apps]);
  const done = useMemo(() => apps.filter((a) => a.status !== 'pending').sort((x, y) => y.createdAt - x.createdAt), [apps]);

  const flagged = useMemo(() => agents.filter((a) => a.active).map((a) => {
    const uniq = new Set(visits.filter((v) => v.code === a.id && !v.voided && !BOT.test(v.ua || '')).map((v) => v.id.split('__')[0])).size;
    const sales = leads.filter((l) => l.code === a.id && l.status === 'sold').length + (a.orderCount || 0);
    return { a, uniq, sales };
  }).filter((x) => x.uniq >= (Number(cfg.threshold) || 30) && x.sales === 0), [agents, visits, leads, cfg.threshold]);

  const sendMsg = async (code: string) => {
    try {
      await setDoc(doc(db, 'agents', code), { adminMessage: (drafts[code] ?? '').trim(), adminMessageAt: Date.now() }, { merge: true });
      logActivity(actor, 'messaged agent', code);
      toast.success('Message shown on the agent dashboard.');
    } catch (e) { toast.error(errorMessage(e)); }
  };
  const pause = async (code: string) => {
    try { await setDoc(doc(db, 'agents', code), { active: false }, { merge: true }); logActivity(actor, 'paused agent', code); toast.success(`${code} paused.`); }
    catch (e) { toast.error(errorMessage(e)); }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">Selling</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">Agent applications</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-400">Public page: <span className="font-mono">{origin}/agents</span>. Applicants wait in the queue until you approve them.</p>
        </div>
        <Button variant="accent" icon={<Bell size={16} />} onClick={() => void registerAlerts(false)}>Alert this device</Button>
      </header>

      {flagged.length > 0 && (
        <section className="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-amber-200">Decision needed: {cfg.threshold}+ people reached, nobody bought</h2>
          <div className="mt-4 space-y-4">
            {flagged.map(({ a, uniq }) => (
              <div key={a.id} className="rounded-xl bg-white/[0.05] p-4">
                <p className="text-[13px] text-white"><b>{a.name}</b> <span className="font-mono text-accent">{a.id}</span> - {uniq} unique visitors, 0 sales</p>
                <textarea className={inp + ' mt-3'} rows={2} placeholder="Message shown on this agent's dashboard" value={drafts[a.id] ?? a.adminMessage ?? ''} onChange={(e) => setDrafts((d) => ({ ...d, [a.id]: e.target.value }))} />
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button size="sm" variant="accent" onClick={() => void sendMsg(a.id)}>Show message to agent</Button>
                  <Button size="sm" variant="danger" onClick={() => void pause(a.id)}>Stop (pause agent)</Button>
                  {a.phone && <a href={waLink(a.phone, drafts[a.id] ?? '')} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center rounded-xl bg-[#25D366] px-3 text-white"><MessageCircle size={14} /></a>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className={card}>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-white">Queue ({pending.length})</h2>
        {pending.length === 0 ? <p className="text-sm text-ink-400">No pending applications.</p> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[720px]">
            <thead><tr className="border-b border-white/10">{['#', 'Applicant', 'WhatsApp', 'Note', 'Applied', ''].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
            <tbody>{pending.map((a, i) => (
              <tr key={a.id} className="border-b border-white/5">
                <td className={td}>{i + 1}</td>
                <td className={td}><p className="font-bold text-white">{a.name}</p><p className="text-[11px]">{a.email}</p></td>
                <td className={td}>{a.phone}</td>
                <td className={td}>{a.note || '-'}</td>
                <td className={td}>{dt(a.createdAt)}</td>
                <td className={td}><div className="flex gap-1.5">
                  <Button size="sm" variant="accent" icon={<Check size={13} />} loading={busy} onClick={() => void approve(a)}>Approve</Button>
                  <Button size="sm" variant="danger" icon={<X size={13} />} onClick={() => void reject(a)} />
                </div></td>
              </tr>))}</tbody>
          </table></div>
        )}
      </section>

      <section className={card}>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-white">Approved / rejected</h2>
        {done.length === 0 ? <p className="text-sm text-ink-400">Nothing yet.</p> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[640px]">
            <thead><tr className="border-b border-white/10">{['Applicant', 'Status', 'Code', ''].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
            <tbody>{done.map((a) => (
              <tr key={a.id} className="border-b border-white/5">
                <td className={td}><p className="font-bold text-white">{a.name}</p><p className="text-[11px]">{a.email}</p></td>
                <td className={td}>{a.status}</td>
                <td className={td + ' font-mono text-accent'}>{a.agentCode || '-'}</td>
                <td className={td}>{a.status === 'approved' && a.agentCode && (
                  <a href={waLink(a.phone, welcome(a))} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#25D366] px-3 text-[12px] font-bold text-white"><MessageCircle size={14} /> Send group + links</a>
                )}</td>
              </tr>))}</tbody>
          </table></div>
        )}
      </section>

      <section className={card}>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-white">Program settings</h2>
        <div className="space-y-4">
          <label className="block text-[12px] text-ink-400">WhatsApp group invite link (private, given only to approved agents)
            <input className={inp + ' mt-1'} value={cfg.groupLink} onChange={(e) => setCfg((c) => ({ ...c, groupLink: e.target.value }))} placeholder="https://chat.whatsapp.com/..." />
          </label>
          <label className="block text-[12px] text-ink-400">Rules shown on /agents (one per line, empty = defaults)
            <textarea className={inp + ' mt-1'} rows={6} value={cfg.rules} onChange={(e) => setCfg((c) => ({ ...c, rules: e.target.value }))} />
          </label>
          <label className="block text-[12px] text-ink-400">How agents earn (one per line, empty = defaults)
            <textarea className={inp + ' mt-1'} rows={4} value={cfg.earnings} onChange={(e) => setCfg((c) => ({ ...c, earnings: e.target.value }))} />
          </label>
          <label className="block text-[12px] text-ink-400">Alert when an agent reached this many unique visitors with no sale
            <input type="number" min={1} className={inp + ' mt-1 w-32'} value={cfg.threshold} onChange={(e) => setCfg((c) => ({ ...c, threshold: Number(e.target.value) }))} />
          </label>
          <label className="block text-[12px] text-ink-400">Message shown on every agent dashboard (empty = none)
            <textarea className={inp + ' mt-1'} rows={3} value={cfg.message} onChange={(e) => setCfg((c) => ({ ...c, message: e.target.value }))} />
          </label>
          <Button variant="accent" loading={busy} onClick={() => void saveCfg()}>Save settings</Button>
        </div>
      </section>
    </div>
  );
};

export default AdminApplications;