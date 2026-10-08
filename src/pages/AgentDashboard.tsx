// FILE: src/pages/AgentDashboard.tsx
// Agent self-service dashboard at /agent (Google sign-in). The referral link (/?ref=CODE) is a different URL.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getApp } from 'firebase/app';
import { GoogleAuthProvider, getAuth, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { Bell, Copy, LogOut } from 'lucide-react';
import { db } from '../lib/firebase';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { Button, Spinner } from '../components/ui';
import { errorMessage } from '../lib/utils';

interface Agent { adminMessage?: string; id: string; code: string; name: string; email?: string; active: boolean; perVisit: number; commissionPct?: number; commissionPerSale?: number; orderCount?: number; minActiveSec: number; dailyCap: number; orderSales?: number }
interface Visit { id: string; code: string; day: string; startedAt: number; activeSec: number; pages: number; productViews: number; scrolled: boolean; waClicks: number; ua?: string; voided?: boolean }
interface Lead { id: string; code: string; productName?: string; status: 'lead' | 'sold' | 'rejected'; amount: number; createdAt: number }
interface Payout { id: string; code: string; amount: number; note: string; paidAt: number }

const BOT = /bot|crawl|spider|headless|lighthouse|preview|facebookexternalhit|whatsapp/i;
const card = 'rounded-2xl border border-ink-200 bg-white p-5';
const th = 'px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-ink-500';
const td = 'px-3 py-2.5 text-[13px] text-ink-700';
const dt = (n: number) => (n ? new Date(n).toLocaleString() : '-');
const mapDocs = <T,>(s: { docs: { id: string; data: () => unknown }[] }) => s.docs.map((d) => ({ ...(d.data() as object), id: d.id })) as unknown as T[];
const engaged = (v: Visit) => v.productViews > 0 || v.scrolled || v.pages >= 2;
const isQ = (v: Visit, a: Agent) => !v.voided && !BOT.test(v.ua || '') && v.activeSec >= a.minActiveSec && engaged(v);
const why = (v: Visit, a: Agent) =>
  v.voided ? 'Voided by admin'
  : BOT.test(v.ua || '') ? 'Bot / preview'
  : v.activeSec < a.minActiveSec ? `Too short (needs ${a.minActiveSec}s active)`
  : !engaged(v) ? 'Needs a product view, scroll or 2 pages'
  : 'Qualified';

const Stat: React.FC<{ label: string; value: string; hint?: string }> = ({ label, value, hint }) => (
  <div className={card}>
    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-500">{label}</p>
    <p className="mt-2 font-display text-2xl font-bold text-ink-900">{value}</p>
    {hint && <p className="mt-1 text-[11px] text-ink-500">{hint}</p>}
  </div>
);

const AgentDashboard: React.FC = () => {
  const { money } = useStore();
  const toast = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [agentLoaded, setAgentLoaded] = useState(false);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [progMsg, setProgMsg] = useState('');
  const [perm, setPerm] = useState<string>(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');

  const notifyRef = useRef<(m: string) => void>(() => undefined);
  notifyRef.current = (m: string) => {
    toast.success(m);
    try { if (typeof Notification !== 'undefined' && Notification.permission === 'granted') new Notification('Karibu agent', { body: m }); } catch { /* ignore */ }
  };

  useEffect(() => onAuthStateChanged(getAuth(getApp()), (u) => { setUser(u); setReady(true); }), []);

  const email = (user?.email ?? '').toLowerCase();

  useEffect(() => onSnapshot(doc(db, 'agentProgram', 'config'), (s) => setProgMsg(String((s.data() as { message?: string } | undefined)?.message ?? '')), () => setProgMsg('')), []);

  useEffect(() => {
    setAgent(null); setAgentLoaded(false);
    if (!email) return undefined;
    return onSnapshot(
      query(collection(db, 'agents'), where('email', '==', email)),
      (s) => { const l = mapDocs<Agent>(s).map((a) => ({ ...a, code: a.id })); setAgent(l[0] ?? null); setAgentLoaded(true); },
      () => { setAgent(null); setAgentLoaded(true); },
    );
  }, [email]);

  const code = agent?.code ?? '';
  useEffect(() => {
    setVisits([]); setLeads([]); setPayouts([]);
    if (!code) return undefined;
    let firstP = true; let firstL = true;
    const un = [
      onSnapshot(query(collection(db, 'agentVisits'), where('code', '==', code)), (s) => setVisits(mapDocs<Visit>(s)), () => setVisits([])),
      onSnapshot(query(collection(db, 'agentLeads'), where('code', '==', code)), (s) => {
        if (!firstL) s.docChanges().forEach((c) => { const l = c.doc.data() as Lead; if (c.type !== 'removed' && l.status === 'sold') notifyRef.current(`Sale confirmed: ${l.amount}`); });
        firstL = false; setLeads(mapDocs<Lead>(s));
      }, () => setLeads([])),
      onSnapshot(query(collection(db, 'agentPayouts'), where('code', '==', code)), (s) => {
        if (!firstP) s.docChanges().forEach((c) => { if (c.type === 'added') notifyRef.current(`You were paid ${(c.doc.data() as Payout).amount}`); });
        firstP = false; setPayouts(mapDocs<Payout>(s));
      }, () => setPayouts([])),
    ];
    return () => un.forEach((u) => u());
  }, [code]);

  const S = useMemo(() => {
    if (!agent) return null;
    const perDay = new Map<string, number>();
    let counted = 0;
    const seenV = new Set<string>();
    [...visits].sort((a, b) => a.startedAt - b.startedAt).forEach((v) => {
      if (!isQ(v, agent)) return;
      if (seenV.has(v.id.split('__')[0])) return;
      const n = perDay.get(v.day) ?? 0;
      if (agent.dailyCap > 0 && n >= agent.dailyCap) return;
      perDay.set(v.day, n + 1); counted += 1; seenV.add(v.id.split('__')[0]);
    });
    const sales = leads.filter((l) => l.status === 'sold').reduce((s, l) => s + (l.amount || 0), 0) + (agent.orderSales || 0);
    const soldN = leads.filter((l) => l.status === 'sold').length + (agent.orderCount || 0);
    const commission = soldN * (agent.commissionPerSale || 0);
    const visitPay = counted * (agent.perVisit || 0);
    const earned = visitPay + commission;
    const paid = payouts.reduce((s, p) => s + (p.amount || 0), 0);
    const real = visits.filter((v) => !v.voided && !BOT.test(v.ua || ''));
    const avg = real.length ? Math.round(real.reduce((s, v) => s + v.activeSec, 0) / real.length) : 0;
    const unique = new Set(real.map((v) => v.id.split('__')[0])).size;
    return { counted, sales, commission, visitPay, earned, paid, balance: earned - paid, avg, unique, total: real.length };
  }, [agent, visits, leads, payouts]);

  const feed = useMemo(() => [
    ...payouts.map((p) => ({ id: 'p' + p.id, at: p.paidAt, text: `Paid ${money(p.amount)}${p.note ? ' - ' + p.note : ''}` })),
    ...leads.filter((l) => l.status === 'sold').map((l) => ({ id: 'l' + l.id, at: l.createdAt, text: `Sale confirmed ${money(l.amount)}${l.productName ? ' - ' + l.productName : ''}` })),
  ].sort((a, b) => b.at - a.at), [payouts, leads, money]);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const refLink = agent ? `${origin}/?ref=${agent.code}` : '';
  const copy = () => { void navigator.clipboard.writeText(refLink).then(() => toast.success('Referral link copied.')).catch(() => toast.error('Copy failed.')); };
  const login = async () => { try { await signInWithPopup(getAuth(getApp()), new GoogleAuthProvider()); } catch (e) { toast.error(errorMessage(e)); } };
  const askPerm = async () => { try { setPerm(await Notification.requestPermission()); } catch { /* ignore */ } };

  if (!ready || (user && !agentLoaded)) return <div className="flex min-h-[60vh] items-center justify-center"><Spinner size={26} /></div>;

  if (!user) return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="font-display text-3xl font-bold text-ink-900">Agent dashboard</h1>
      <p className="mt-3 text-sm text-ink-500">Sign in with the Google account your admin registered for you.</p>
      <div className="mt-8"><Button variant="accent" size="lg" onClick={() => void login()}>Sign in with Google</Button></div>
    </div>
  );

  if (!agent || !S) return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="font-display text-2xl font-bold text-ink-900">No agent profile found</h1>
      <p className="mt-3 text-sm text-ink-500">{email} is not linked to an agent yet. Ask the admin to put this e-mail on your agent profile.</p>
      <div className="mt-8"><Button onClick={() => void signOut(getAuth(getApp()))}>Sign out</Button></div>
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">Agent</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-ink-900">Hello {agent.name}</h1>
          <p className="mt-1 text-sm text-ink-500">Code {agent.code}{agent.active ? '' : ' (paused - new visits are not recorded)'}</p>
        </div>
        <div className="flex gap-2">
          {perm === 'default' && <Button size="sm" icon={<Bell size={14} />} onClick={() => void askPerm()}>Enable alerts</Button>}
          <Button size="sm" icon={<LogOut size={14} />} onClick={() => void signOut(getAuth(getApp()))}>Sign out</Button>
        </div>
      </header>

      {(progMsg || agent.adminMessage) && (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-700">Message from admin</p>
          {progMsg && <p className="mt-2 whitespace-pre-line text-[14px] text-ink-900">{progMsg}</p>}
          {agent.adminMessage && <p className="mt-2 whitespace-pre-line text-[14px] font-semibold text-ink-900">{agent.adminMessage}</p>}
        </section>
      )}

      <section className={card}>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-500">Your referral link (share this)</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <code className="break-all rounded-lg bg-ink-100 px-3 py-2 text-[13px] text-ink-900">{refLink}</code>
          <Button size="sm" variant="accent" icon={<Copy size={14} />} onClick={copy}>Copy</Button>
        </div>
        <p className="mt-2 text-[12px] text-ink-500">This page ({origin}/agent) is your private dashboard. Do not share it.</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Earned" value={money(S.earned)} hint={`Visits ${money(S.visitPay)} + commission ${money(S.commission)}`} />
        <Stat label="Paid to you" value={money(S.paid)} />
        <Stat label="Balance owed" value={money(S.balance)} />
        <Stat label="Confirmed sales" value={money(S.sales)} hint={`${money(agent.commissionPerSale || 0)} per confirmed sale`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Referrals (visits)" value={String(S.total)} hint={`${S.unique} unique visitors`} />
        <Stat label="Paid visits" value={String(S.counted)} hint={`${money(agent.perVisit)} per new visitor, max ${agent.dailyCap || 'unlimited'}/day`} />
        <Stat label="Avg time active" value={`${S.avg}s`} hint={`Minimum to count: ${agent.minActiveSec}s`} />
        <Stat label="Leads" value={String(leads.length)} hint={`${leads.filter((l) => l.status === 'sold').length} sold`} />
      </div>

      <section className={card}>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-ink-900">Notifications</h2>
        {feed.length === 0 ? <p className="text-sm text-ink-500">Nothing yet. You will see payments and confirmed sales here.</p> : (
          <ul className="space-y-2">{feed.map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-3 rounded-xl bg-ink-100 px-3 py-2 text-[13px] text-ink-800"><span>{f.text}</span><span className="shrink-0 text-[11px] text-ink-500">{dt(f.at)}</span></li>
          ))}</ul>
        )}
      </section>

      <section className={card}>
        <h2 className="mb-1 text-sm font-bold uppercase tracking-wider text-ink-900">Time spent by your visitors</h2>
        <p className="mb-3 text-[12px] text-ink-500">A visit is paid after {agent.minActiveSec}s of real activity plus a product view, a scroll or 2 pages.</p>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-ink-200">{['Started', 'Active', 'Pages', 'Products', 'Scrolled', 'Result'].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
            <tbody>{[...visits].sort((a, b) => b.startedAt - a.startedAt).slice(0, 40).map((v) => (
              <tr key={v.id} className="border-b border-ink-100">
                <td className={td}>{dt(v.startedAt)}</td><td className={td}>{v.activeSec}s</td><td className={td}>{v.pages}</td>
                <td className={td}>{v.productViews}</td><td className={td}>{v.scrolled ? 'yes' : 'no'}</td><td className={td}>{why(v, agent)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>

      <section className={card}>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-ink-900">Payment history</h2>
        {payouts.length === 0 ? <p className="text-sm text-ink-500">No payments yet.</p> : (
          <ul className="space-y-2">{[...payouts].sort((a, b) => b.paidAt - a.paidAt).map((p) => (
            <li key={p.id} className="flex justify-between text-[13px] text-ink-800"><span>{money(p.amount)}{p.note ? ' - ' + p.note : ''}</span><span className="text-ink-500">{dt(p.paidAt)}</span></li>
          ))}</ul>
        )}
      </section>
    </div>
  );
};

export default AgentDashboard;