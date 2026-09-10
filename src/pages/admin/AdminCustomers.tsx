// FILE: src/pages/admin/AdminCustomers.tsx
import React, { useMemo, useState } from 'react';
import { Download, Mail, Search, Users } from 'lucide-react';
import { useAdminData } from '../../hooks/useAdminData';
import { useStore } from '../../context/StoreContext';
import { Badge, EmptyState, Input } from '../../components/ui';
import { Button } from '../../components/ui';
import { formatDate } from '../../lib/utils';

/** Customers are derived from orders so the list is never out of date. */
const AdminCustomers: React.FC = () => {
  const { orders, subscribers } = useAdminData();
  const { money } = useStore();
  const [search, setSearch] = useState('');

  const people = useMemo(() => {
    const map = new Map<
      string,
      { email: string; name: string; phone: string; city: string; orders: number; spent: number; last: number; first: number }
    >();

    for (const o of orders) {
      const key = (o.customerEmail || o.customerPhone || o.id).toLowerCase();
      const entry = map.get(key) ?? {
        email: o.customerEmail,
        name: o.customerName,
        phone: o.customerPhone,
        city: o.city,
        orders: 0,
        spent: 0,
        last: 0,
        first: Number.MAX_SAFE_INTEGER,
      };
      entry.orders += 1;
      if (!['cancelled', 'refunded'].includes(o.status)) entry.spent += o.total ?? 0;
      entry.last = Math.max(entry.last, o.createdAt);
      entry.first = Math.min(entry.first, o.createdAt);
      entry.name = entry.name || o.customerName;
      entry.phone = entry.phone || o.customerPhone;
      entry.city = entry.city || o.city;
      map.set(key, entry);
    }

    const needle = search.trim().toLowerCase();
    return [...map.values()]
      .filter((p) => !needle || p.name?.toLowerCase().includes(needle) || p.email?.toLowerCase().includes(needle) || p.phone?.includes(needle))
      .sort((a, b) => b.spent - a.spent);
  }, [orders, search]);

  const exportCsv = () => {
    const header = ['Name', 'Email', 'Phone', 'City', 'Orders', 'Total spent', 'First order', 'Last order'];
    const lines = people.map((p) =>
      [p.name, p.email, p.phone, p.city, p.orders, p.spent, formatDate(p.first), formatDate(p.last)]
        .map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`)
        .join(','),
    );
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">Selling</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">Customers</h1>
          <p className="mt-2 text-sm text-ink-400">
            {people.length} buyer{people.length === 1 ? '' : 's'} · {subscribers.length} newsletter subscriber
            {subscribers.length === 1 ? '' : 's'}
          </p>
        </div>
        {people.length > 0 && (
          <Button variant="outline" icon={<Download size={16} />} onClick={exportCsv} className="border-white/20 text-white hover:bg-white/10">
            Export CSV
          </Button>
        )}
      </header>

      <div className="relative max-w-md">
        <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers…" className="pl-10" />
      </div>

      {people.length === 0 ? (
        <EmptyState
          icon={<Users size={40} />}
          title="No customers yet"
          text="Anyone who places an order appears here automatically."
          className="border-white/15 text-white"
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <div className="thin-scrollbar overflow-x-auto">
            <table className="w-full min-w-[46rem] text-left text-sm">
              <thead className="bg-white/[0.03] text-[10px] uppercase tracking-[0.16em] text-ink-500">
                <tr>
                  <th className="px-4 py-4 font-bold">Customer</th>
                  <th className="px-3 py-4 font-bold">Contact</th>
                  <th className="px-3 py-4 font-bold">Orders</th>
                  <th className="px-3 py-4 font-bold">Spent</th>
                  <th className="px-3 py-4 font-bold">Last order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {people.map((p, i) => (
                  <tr key={p.email || i} className="transition hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-black text-ink-950">
                          {(p.name || p.email || '?').slice(0, 1).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-white">{p.name || 'Guest'}</p>
                          {p.city && <p className="text-[11px] text-ink-500">{p.city}</p>}
                        </div>
                        {p.orders >= 3 && <Badge tone="accent">VIP</Badge>}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-ink-400">
                      {p.email && (
                        <a href={`mailto:${p.email}`} className="block truncate hover:text-accent">{p.email}</a>
                      )}
                      {p.phone && <span className="block text-[11px]">{p.phone}</span>}
                    </td>
                    <td className="px-3 py-3 text-ink-300">{p.orders}</td>
                    <td className="px-3 py-3 font-semibold text-white">{money(p.spent)}</td>
                    <td className="px-3 py-3 text-ink-400">{formatDate(p.last)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subscribers.length > 0 && (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-white">
            <Mail size={17} className="text-accent" /> Newsletter list
          </h2>
          <div className="flex flex-wrap gap-2">
            {subscribers.slice(0, 60).map((s) => (
              <span key={s.id} className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-ink-300">
                {s.email}
              </span>
            ))}
            {subscribers.length > 60 && (
              <span className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-ink-500">
                +{subscribers.length - 60} more
              </span>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default AdminCustomers;
