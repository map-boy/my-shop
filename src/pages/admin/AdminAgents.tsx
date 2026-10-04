// FILE: src/pages/admin/AdminAgents.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { Copy, Handshake, MessageCircle, Pencil, Plus, Trash2 } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useAdminData } from '../../hooks/useAdminData';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { logActivity } from '../../lib/activity';
import { Button, ConfirmDialog, EmptyState, Field, Input, Modal, Toggle } from '../../components/ui';
import { errorMessage } from '../../lib/utils';
import type { Order } from '../../lib/types';

interface Agent { id: string; code: string; name: string; phone: string; notes: string; active: boolean; perVisit: number; commissionPct: number; minActiveSec: number; dailyCap: number; createdAt: number }
interface Visit { id: string; code: string; day: string; startedAt: number; activeSec: number; pages: number; productViews: number; scrolled: boolean; waClicks: number; landing?: string; ua?: string; voided?: boolean }
interface Lead { id: string; code: string; productName?: string; qty?: number; price?: number; status: 'lead' | 'sold' | 'rejected'; amount: number; note?: string; createdAt: number }
interface Payout { id: string; code: string; amount: number; note: string; paidAt: number; by: string }

const BOT = /bot|crawl|spider|headless|lighthouse|preview|facebookexternalhit|whatsapp/i;
const BLANK = { code: '', name: '', phone: '', notes: '', active: true, perVisit: 50, commissionPct: 5, minActiveSec: 30, dailyCap: 50 };
const dt = (n: number) => (n ? new Date(n).toLocaleString() : '-');
const isQ = (v: Visit, a: Agent) => !v.voided && !BOT.test(v.ua || '') && v.activeSec >= a.minActiveSec && (v.productViews > 0 || v.scrolled || v.pages >= 2);
const countsOrder = (o: Order) => o.status !== 'cancelled' && o.status !== 'refunded' && (o.status === 'delivered' || o.paymentStatus === 'paid');
const card = 'rounded-2xl border border-white/10 bg-white/[0.04] p-5';
const th = 'px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-ink-500';
const td = 'px-3 py-2.5 text-[13px] text-ink-300';
const mini = 'h-9 rounded-lg bg-white px-2 text-[13px] text-ink-900';

const AdminAgents: React.FC = () => {
  const { orders } = useAdminData();
  const { money } = useStore();
  const { admin } = useAuth();
  const toast = useToast();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [sel, setSel] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Agent | null>(null);
  const [form, setForm] = useState(BLANK);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<{ kind: 'agents' | 'agentVisits' | 'agentLeads' | 'agentPayouts'; id: string; label: string } | null>(null);
  const [pay, setPay] = useState({ amount: 0, note: '' });
  const [sale, setSale] = useState({ amount: 0, note: '' });

  useEffect(() => {
    const mapDocs = <T,>(s: { docs: { id: string; data: () => unknown }[] }) => s.docs.map((d) => ({ ...(d.data() as object), id: d.id })) as unknown as T[];
    const un = [
      onSnapshot(collection(db, 'agents'), (s) => setAgents(mapDocs<Agent>(s).map((a) => ({ ...a, code: a.id }))), () => setAgents([])),
      onSnapshot(collection(db, 'agentVisits'), (s) => setVisits(mapDocs<Visit>(s)), () => setVisits([])),
      onSnapshot(collection(db, 'agentLeads'), (s) => setLeads(mapDocs<Lead>(s)), () => setLeads([])),
      onSnapshot(collection(db, 'agentPayouts'), (s) => setPayouts(mapDocs<Payout>(s)), () => setPayouts([])),
    ];
    return () => un.forEach((u) => u());
  }, []);

  const stats = useMemo(() => {
    const out: Record<string, { vs: Visit[]; counted: Set<string>; qualified: number; avg: number; leadsN: number; sales: number; visitPay: number; commission: number; earned: number; paid: number; balance: number }> = {};
    agents.forEach((a) => {
      const vs = visits.filter((v) => v.code === a.code);
      const counted = new Set<string>();
      const perDay: Record<string, number> = {};
      [...vs].sort((x, y) => x.startedAt - y.startedAt).forEach((v) => {
        if (!isQ(v, a)) return;
        const n = perDay[v.day] ?? 0;
        if (!a.dailyCap || n < a.dailyCap) { perDay[v.day] = n + 1; counted.add(v.id); }
      });
      const active = vs.reduce((s, v) => s + v.activeSec, 0);
      const mine = leads.filter((l) => l.code === a.code);
      const sold = mine.filter((l) => l.status === 'sold').reduce((s, l) => s + (l.amount || 0), 0);
      const ord = orders.filter((o) => o.agentCode === a.code && countsOrder(o)).reduce((s, o) => s + o.total, 0);
      const sales = sold + ord;
      const visitPay = counted.size * (a.perVisit || 0);
      const commission = Math.round((sales * (a.commissionPct || 0)) / 100);
      const paid = payouts.filter((p) => p.code === a.code).reduce((s, p) => s + (p.amount || 0), 0);
      out[a.code] = { vs, counted, qualified: counted.size, avg: vs.length ? Math.round(active / vs.length) : 0, leadsN: mine.length, sales, visitPay, commission, earned: visitPay + commission, paid, balance: visitPay + commission - paid };
    });
    return out;
  }, [agents, visits, leads, payouts, orders]);

  const A = agents.find((a) => a.code === sel) ?? null;
  const S = A ? stats[A.code] : null;
  const linkOf = (a: Agent) => `${window.location.origin}/?ref=${a.code}`;
  const copy = (a: Agent) => { void navigator.clipboard.writeText(linkOf(a)).then(() => toast.success('Link copied.')).catch(() => toast.error('Copy failed.')); };
  const waOf = (a: Agent) => `https://wa.me/${(a.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${a.name}, this is your Karibu agent link: ${linkOf(a)}`)}`;
  const fail = (err: unknown) => toast.error(errorMessage(err));

  const openNew = () => { setEditing(null); setForm(BLANK); setOpen(true); };
  const openEdit = (a: Agent) => {
    setEditing(a);
    setForm({ code: a.code, name: a.name, phone: a.phone || '', notes: a.notes || '', active: a.active, perVisit: a.perVisit, commissionPct: a.commissionPct, minActiveSec: a.minActiveSec, dailyCap: a.dailyCap });
    setOpen(true);
  };

  const save = async () => {
    const name = form.name.trim();
    if (!name) return toast.error('The agent needs a name.');
    const code = editing ? editing.code : (form.code.trim() || name.slice(0, 4) + Math.floor(100 + Math.random() * 900)).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
    if (!code) return toast.error('Code is invalid.');
    if (!editing && agents.some((a) => a.code === code)) return toast.error('That code is already used.');
    setBusy(true);
    try {
      await setDoc(doc(db, 'agents', code), {
        code, name, phone: form.phone.trim(), notes: form.notes.trim(), active: form.active,
        perVisit: Number(form.perVisit) || 0, commissionPct: Number(form.commissionPct) || 0,
        minActiveSec: Number(form.minActiveSec) || 0, dailyCap: Number(form.dailyCap) || 0,
        createdAt: editing?.createdAt ?? Date.now(),
      }, { merge: true });
      logActivity(admin?.email ?? 'admin', editing ? 'updated agent' : 'created agent', code);
      toast.success(`Agent ${code} saved.`);
      setOpen(false); setEditing(null); if (!editing) setSel(code);
    } catch (err) { fail(err); } finally { setBusy(false); }
  };

  const doDelete = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      await deleteDoc(doc(db, confirm.kind, confirm.id));
      logActivity(admin?.email ?? 'admin', 'deleted ' + confirm.kind, confirm.label);
      if (confirm.kind === 'agents' && sel === confirm.id) setSel('');
      setConfirm(null);
    } catch (err) { fail(err); } finally { setBusy(false); }
  };

  const saveLead = (l: Lead, patch: Partial<Lead>) => { void setDoc(doc(db, 'agentLeads', l.id), patch, { merge: true }).catch(fail); };
  const toggleVoid = (v: Visit) => { void setDoc(doc(db, 'agentVisits', v.id), { voided: !v.voided }, { merge: true }).catch(fail); };

  const addPayout = async () => {
    if (!A || pay.amount <= 0) return toast.error('Enter an amount above zero.');
    try {
      await addDoc(collection(db, 'agentPayouts'), { code: A.code, amount: Number(pay.amount), note: pay.note.trim(), paidAt: Date.now(), by: admin?.email ?? 'admin', createdAt: Date.now() });
      logActivity(admin?.email ?? 'admin', 'paid agent', `${A.code} ${pay.amount}`);
      setPay({ amount: 0, note: '' });
    } catch (err) { fail(err); }
  };

  const addSale = async () => {
    if (!A || sale.amount <= 0) return toast.error('Enter the sale amount.');
    try {
      await addDoc(collection(db, 'agentLeads'), { code: A.code, productName: sale.note.trim() || 'Manual sale', qty: 1, price: Number(sale.amount), status: 'sold', amount: Number(sale.amount), note: 'added by admin', createdAt: Date.now() });
      setSale({ amount: 0, note: '' });
    } catch (err) { fail(err); }
  };

  const vStatus = (v: Visit, a: Agent, counted: Set<string>) =>
    v.voided ? 'voided' : BOT.test(v.ua || '') ? 'bot' : counted.has(v.id) ? 'paid visit' : isQ(v, a) ? 'over daily cap' : 'too short / no activity';

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">Selling</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">Agents</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-400">Give each agent their own link. A visit is paid only after the active-time rule; sales are confirmed here before commission counts.</p>
        </div>
        <Button variant="accent" size="lg" icon={<Plus size={17} />} onClick={openNew}>New agent</Button>
      </header>

      {agents.length === 0 ? (
        <EmptyState icon={<Handshake size={40} />} title="No agents yet" text="Create an agent to get a tracking link." action={<Button variant="accent" icon={<Plus size={16} />} onClick={openNew}>New agent</Button>} />
      ) : (
        <div className={card + ' overflow-x-auto !p-0'}>
          <table className="w-full min-w-[900px] text-left">
            <thead><tr className="border-b border-white/10">
              {['Agent', 'Visits', 'Paid visits', 'Avg active', 'Leads', 'Sales', 'Earned', 'Paid out', 'Balance', ''].map((h) => <th key={h} className={th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {agents.map((a) => { const s = stats[a.code]; if (!s) return null; return (
                <tr key={a.id} className={'cursor-pointer border-b border-white/5 hover:bg-white/[0.03] ' + (sel === a.code ? 'bg-white/[0.06]' : '')} onClick={() => setSel(a.code)}>
                  <td className={td}><p className="font-bold text-white">{a.name} {!a.active && <span className="ml-1 rounded bg-red-500/20 px-1.5 text-[10px] text-red-300">PAUSED</span>}</p><p className="font-mono text-[11px] text-accent">{a.code}</p></td>
                  <td className={td}>{s.vs.length}</td>
                  <td className={td}>{s.qualified}</td>
                  <td className={td}>{s.avg}s</td>
                  <td className={td}>{s.leadsN}</td>
                  <td className={td}>{money(s.sales)}</td>
                  <td className={td}>{money(s.earned)}</td>
                  <td className={td}>{money(s.paid)}</td>
                  <td className={td + ' font-bold text-white'}>{money(s.balance)}</td>
                  <td className={td} onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="subtle" icon={<Copy size={13} />} onClick={() => copy(a)}>Link</Button>
                      {a.phone && <a href={waOf(a)} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center rounded-xl bg-[#25D366] px-3 text-white"><MessageCircle size={14} /></a>}
                      <Button size="sm" variant="subtle" icon={<Pencil size={13} />} onClick={() => openEdit(a)} />
                      <Button size="sm" variant="danger" icon={<Trash2 size={13} />} onClick={() => setConfirm({ kind: 'agents', id: a.id, label: a.code })} />
                    </div>
                  </td>
                </tr>); })}
            </tbody>
          </table>
        </div>
      )}

      {A && S && (
        <div className="space-y-6">
          <div className={card}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold text-white">{A.name} <span className="font-mono text-sm text-accent">{A.code}</span></h2>
                <p className="mt-1 break-all font-mono text-[12px] text-ink-400">{linkOf(A)}</p>
                <p className="mt-2 text-[12px] text-ink-500">Rule: {money(A.perVisit)} per qualified visit (min {A.minActiveSec}s active and a product view, scroll or 2 pages, max {A.dailyCap || 'unlimited'}/day) + {A.commissionPct}% of confirmed sales.</p>
              </div>
              <div className="text-right text-[13px] text-ink-300">
                <p>Visits pay: <b className="text-white">{money(S.visitPay)}</b></p>
                <p>Commission ({money(S.sales)} sales): <b className="text-white">{money(S.commission)}</b></p>
                <p>Paid out: <b className="text-white">{money(S.paid)}</b></p>
                <p className="mt-1 text-base">Balance due: <b className="text-accent">{money(S.balance)}</b></p>
              </div>
            </div>
          </div>

          <div className={card}>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-white">Sales & WhatsApp leads</h3>
            <p className="mb-3 text-[12px] text-ink-500">A lead is created when a visitor taps Order on WhatsApp. Set it to Sold with the real amount once the customer pays; only Sold counts for commission. Website orders with this agent&apos;s code count when delivered or paid.</p>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <input type="number" min={0} value={sale.amount} onChange={(e) => setSale((s) => ({ ...s, amount: Number(e.target.value) }))} className={mini + ' w-32'} placeholder="Amount" />
              <input value={sale.note} onChange={(e) => setSale((s) => ({ ...s, note: e.target.value }))} className={mini + ' w-56'} placeholder="What was sold" />
              <Button size="sm" variant="accent" icon={<Plus size={14} />} onClick={() => void addSale()}>Add sale</Button>
            </div>
            <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left">
              <thead><tr className="border-b border-white/10">{['When', 'Product', 'Status', 'Amount', ''].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
              <tbody>
                {leads.filter((l) => l.code === A.code).sort((x, y) => y.createdAt - x.createdAt).map((l) => (
                  <tr key={l.id} className="border-b border-white/5">
                    <td className={td}>{dt(l.createdAt)}</td>
                    <td className={td}>{l.productName || '-'}{l.qty ? ` x${l.qty}` : ''}{l.note ? <span className="text-ink-500"> ({l.note})</span> : null}</td>
                    <td className={td}>
                      <select value={l.status} onChange={(e) => saveLead(l, { status: e.target.value as Lead['status'] })} className={mini}>
                        <option value="lead">Lead (pending)</option><option value="sold">Sold</option><option value="rejected">Rejected</option>
                      </select>
                    </td>
                    <td className={td}><input key={l.id + l.amount} type="number" min={0} defaultValue={l.amount} onBlur={(e) => saveLead(l, { amount: Number(e.target.value) || 0 })} className={mini + ' w-28'} /></td>
                    <td className={td}><Button size="sm" variant="danger" icon={<Trash2 size={13} />} onClick={() => setConfirm({ kind: 'agentLeads', id: l.id, label: l.productName || l.id })} /></td>
                  </tr>))}
              </tbody>
            </table></div>
            {orders.filter((o) => o.agentCode === A.code).length > 0 && (
              <p className="mt-3 text-[12px] text-ink-400">Website orders with this code: {orders.filter((o) => o.agentCode === A.code).map((o) => `${o.number} (${o.status}, ${money(o.total)})`).join(' · ')}</p>
            )}
          </div>

          <div className={card}>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-white">Payouts</h3>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <input type="number" min={0} value={pay.amount} onChange={(e) => setPay((p) => ({ ...p, amount: Number(e.target.value) }))} className={mini + ' w-32'} placeholder="Amount" />
              <input value={pay.note} onChange={(e) => setPay((p) => ({ ...p, note: e.target.value }))} className={mini + ' w-56'} placeholder="Note (MoMo ref...)" />
              <Button size="sm" variant="accent" icon={<Plus size={14} />} onClick={() => void addPayout()}>Record payout</Button>
            </div>
            {payouts.filter((p) => p.code === A.code).sort((x, y) => y.paidAt - x.paidAt).map((p) => (
              <div key={p.id} className="flex items-center justify-between border-b border-white/5 py-2 text-[13px] text-ink-300">
                <span>{dt(p.paidAt)} · <b className="text-white">{money(p.amount)}</b> {p.note && <span className="text-ink-500">({p.note})</span>}</span>
                <Button size="sm" variant="danger" icon={<Trash2 size={13} />} onClick={() => setConfirm({ kind: 'agentPayouts', id: p.id, label: A.code + ' payout' })} />
              </div>))}
          </div>

          <div className={card}>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-white">Visits (latest 150)</h3>
            <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left">
              <thead><tr className="border-b border-white/10">{['Started', 'Active', 'Pages', 'Products', 'Scrolled', 'WhatsApp', 'Result', ''].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
              <tbody>
                {[...S.vs].sort((x, y) => y.startedAt - x.startedAt).slice(0, 150).map((v) => (
                  <tr key={v.id} className="border-b border-white/5">
                    <td className={td}>{dt(v.startedAt)}</td>
                    <td className={td}>{v.activeSec}s</td>
                    <td className={td}>{v.pages}</td>
                    <td className={td}>{v.productViews}</td>
                    <td className={td}>{v.scrolled ? 'yes' : 'no'}</td>
                    <td className={td}>{v.waClicks}</td>
                    <td className={td}>{vStatus(v, A, S.counted)}</td>
                    <td className={td}><div className="flex gap-1.5">
                      <Button size="sm" variant="subtle" onClick={() => toggleVoid(v)}>{v.voided ? 'Restore' : 'Void'}</Button>
                      <Button size="sm" variant="danger" icon={<Trash2 size={13} />} onClick={() => setConfirm({ kind: 'agentVisits', id: v.id, label: v.id })} />
                    </div></td>
                  </tr>))}
              </tbody>
            </table></div>
          </div>
        </div>
      )}

      <Modal
        open={open}
        onClose={() => { setOpen(false); setEditing(null); }}
        title={editing ? 'Edit agent' : 'New agent'}
        footer={<div className="flex justify-end gap-3"><Button variant="outline" onClick={() => { setOpen(false); setEditing(null); }} disabled={busy}>Cancel</Button><Button onClick={() => void save()} loading={busy}>Save</Button></div>}
      >
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Name" required><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} autoFocus /></Field>
            <Field label="Code" hint="Used in the link. Leave empty to generate."><Input value={form.code} disabled={!!editing} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} className="font-mono tracking-wider" /></Field>
          </div>
          <Field label="Phone (WhatsApp)"><Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Pay per qualified visit"><Input type="number" min={0} value={form.perVisit} onChange={(e) => setForm((f) => ({ ...f, perVisit: Number(e.target.value) }))} /></Field>
            <Field label="Commission % on confirmed sales"><Input type="number" min={0} max={100} value={form.commissionPct} onChange={(e) => setForm((f) => ({ ...f, commissionPct: Number(e.target.value) }))} /></Field>
            <Field label="Minimum active seconds" hint="Time the tab is open AND the visitor is interacting."><Input type="number" min={0} value={form.minActiveSec} onChange={(e) => setForm((f) => ({ ...f, minActiveSec: Number(e.target.value) }))} /></Field>
            <Field label="Max paid visits per day" hint="0 means unlimited."><Input type="number" min={0} value={form.dailyCap} onChange={(e) => setForm((f) => ({ ...f, dailyCap: Number(e.target.value) }))} /></Field>
          </div>
          <Field label="Notes"><Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} /></Field>
          <div className="rounded-xl border border-ink-200 p-5"><Toggle checked={form.active} onChange={(v) => setForm((f) => ({ ...f, active: v }))} label="Active" hint="Paused agents stop recording new visits and leads." /></div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        title="Delete this record?"
        message={`"${confirm?.label ?? ''}" will be removed permanently.`}
        confirmLabel="Delete"
        destructive
        busy={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={() => void doDelete()}
      />
    </div>
  );
};

export default AdminAgents;