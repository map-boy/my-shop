// FILE: src/pages/admin/AdminTraffic.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Copy, ExternalLink, Eye, QrCode, Users } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useAdminData } from '../../hooks/useAdminData';
import { cn, slugify } from '../../lib/utils';

interface Row { id: string; day: string; slug: string; sellerId: string; views?: number; qr?: number; visitors?: number }
interface Tot { views: number; visitors: number; qr: number }
const zero = (): Tot => ({ views: 0, visitors: 0, qr: 0 });
const add = (t: Tot, r: { views?: number; visitors?: number; qr?: number }) => {
  t.views += r.views ?? 0; t.visitors += r.visitors ?? 0; t.qr += r.qr ?? 0;
};
const dayStr = (n: number) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);

const Stat: React.FC<{ icon: React.ReactNode; label: string; value: number }> = ({ icon, label, value }) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
    <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-ink-400">{icon} {label}</p>
    <p className="mt-3 font-display text-3xl font-bold text-white">{value.toLocaleString()}</p>
  </div>
);

const AdminTraffic: React.FC = () => {
  const { admin, managesEverything } = useAuth();
  const { admins } = useAdminData();
  const toast = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [range, setRange] = useState<7 | 30>(7);
  const email = (admin?.email ?? '').toLowerCase();

  useEffect(() => {
    if (!email) return undefined;
    const q = managesEverything
      ? query(collection(db, 'traffic'), where('day', '>=', dayStr(29)))
      : query(collection(db, 'traffic'), where('sellerId', '==', email));
    return onSnapshot(
      q,
      (s) => setRows(s.docs.map((d) => ({ ...(d.data() as Omit<Row, 'id'>), id: d.id }))),
      () => setRows([]),
    );
  }, [email, managesEverything]);

  const from = dayStr(range - 1);
  const scoped = useMemo(() => rows.filter((r) => r.day >= from), [rows, from]);

  const perDay = useMemo(() => {
    const m = new Map<string, Tot>();
    scoped
      .filter((r) => (managesEverything ? r.slug === 'site' : true))
      .forEach((r) => { const t = m.get(r.day) ?? zero(); add(t, r); m.set(r.day, t); });
    return [...m.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [scoped, managesEverything]);

  const total = useMemo(() => {
    const t = zero();
    perDay.forEach(([, d]) => add(t, d));
    return t;
  }, [perDay]);

  const shops = useMemo(() => {
    const m = new Map<string, { slug: string; name: string; tot: Tot }>();
    const seed = (name: string) => {
      const slug = slugify(name);
      if (slug && !m.has(slug)) m.set(slug, { slug, name, tot: zero() });
    };
    if (managesEverything) admins.filter((a) => a.role === 'seller' && a.shopName).forEach((a) => seed(a.shopName ?? ''));
    else if (admin?.shopName) seed(admin.shopName);
    scoped.filter((r) => r.slug !== 'site').forEach((r) => {
      const s = m.get(r.slug) ?? { slug: r.slug, name: r.slug, tot: zero() };
      add(s.tot, r);
      m.set(r.slug, s);
    });
    return [...m.values()].sort((a, b) => b.tot.qr + b.tot.views - (a.tot.qr + a.tot.views));
  }, [scoped, admins, admin?.shopName, managesEverything]);

  const link = (slug: string) => `${window.location.origin}/shop/${slug}`;
  const copy = async (slug: string) => {
    try { await navigator.clipboard.writeText(link(slug)); toast.success('Shop link copied.'); }
    catch { toast.error('Could not copy. Your browser blocked clipboard access.'); }
  };
  const maxViews = Math.max(1, ...perDay.map(([, d]) => d.views));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">Traffic</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">
            {managesEverything ? 'Visitors' : 'Your shop visitors'}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-400">
            Views count visits, visitors count devices per day, QR scans count visits that came from a scanned code.
          </p>
        </div>
        <div className="flex gap-1 rounded-xl border border-white/10 p-1">
          {([7, 30] as const).map((n) => (
            <button
              key={n}
              onClick={() => setRange(n)}
              className={cn('rounded-lg px-3 py-1.5 text-xs font-bold', range === n ? 'bg-accent text-ink-950' : 'text-ink-400 hover:text-white')}
            >
              {n} days
            </button>
          ))}
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={<Eye size={14} />} label="Views" value={total.views} />
        <Stat icon={<Users size={14} />} label="Visitors" value={total.visitors} />
        <Stat icon={<QrCode size={14} />} label="QR scans" value={total.qr} />
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="font-display text-xl font-bold text-white">{managesEverything ? 'Sellers' : 'Your link'}</h2>
        <div className="mt-4 divide-y divide-white/10">
          {shops.length === 0 && <p className="py-4 text-sm text-ink-400">No shops yet.</p>}
          {shops.map((s) => (
            <div key={s.slug} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="font-semibold text-white">{s.name}</p>
                <p className="break-all font-mono text-[11px] text-ink-500">{link(s.slug)}</p>
              </div>
              <div className="flex items-center gap-5 text-sm text-ink-300">
                <span title="Views">{s.tot.views} views</span>
                <span title="Visitors">{s.tot.visitors} visitors</span>
                <span title="QR scans">{s.tot.qr} scans</span>
                <button onClick={() => void copy(s.slug)} className="text-ink-400 hover:text-accent" aria-label="Copy link"><Copy size={15} /></button>
                <a href={link(s.slug)} target="_blank" rel="noreferrer" className="text-ink-400 hover:text-accent" aria-label="Open shop"><ExternalLink size={15} /></a>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="font-display text-xl font-bold text-white">{managesEverything ? 'Whole site, by day' : 'By day'}</h2>
        <div className="mt-4 space-y-2">
          {perDay.length === 0 && <p className="text-sm text-ink-400">No visits recorded in this period yet.</p>}
          {perDay.map(([day, d]) => (
            <div key={day} className="flex items-center gap-3 text-xs text-ink-300">
              <span className="w-24 shrink-0 font-mono">{day}</span>
              <div className="h-2 flex-1 rounded-full bg-white/5">
                <div className="h-2 rounded-full bg-accent" style={{ width: `${(d.views / maxViews) * 100}%` }} />
              </div>
              <span className="w-40 shrink-0 text-right">{d.views} views · {d.visitors} visitors · {d.qr} QR</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AdminTraffic;
