// FILE: src/pages/admin/AdminOrders.tsx
import React, { useMemo, useState } from 'react';
import { doc, setDoc, writeBatch } from 'firebase/firestore';
import { Download, Printer, Search, ShoppingCart, X } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useAdminData } from '../../hooks/useAdminData';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { logActivity } from '../../lib/activity';
import { Badge, Button, EmptyState, Input, Select } from '../../components/ui';
import type { Order, OrderStatus, PaymentStatus } from '../../lib/types';
import { cn, errorMessage, formatDate, timeAgo } from '../../lib/utils';

const STATUSES: OrderStatus[] = [
  'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded',
];

const STATUS_TONE: Record<OrderStatus, 'neutral' | 'green' | 'amber' | 'red' | 'blue'> = {
  pending: 'amber',
  confirmed: 'blue',
  processing: 'blue',
  shipped: 'blue',
  delivered: 'green',
  cancelled: 'red',
  refunded: 'red',
};

const AdminOrders: React.FC = () => {
  const { orders } = useAdminData();
  const { products, money } = useStore();
  const { admin, isSeller, managesEverything } = useAuth();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [active, setActive] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (status && o.status !== status) return false;
      if (!needle) return true;
      return (
        o.number?.toLowerCase().includes(needle) ||
        o.customerName?.toLowerCase().includes(needle) ||
        o.customerEmail?.toLowerCase().includes(needle) ||
        o.customerPhone?.includes(needle)
      );
    });
  }, [orders, search, status]);

  const totals = useMemo(() => {
    const paid = orders.filter((o) => o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0);
    return { count: orders.length, paid };
  }, [orders]);

  /**
   * Moving an order to "confirmed" for the first time reserves stock, because
   * guest checkout cannot write to the products collection.
   */
  const changeStatus = async (order: Order, next: OrderStatus) => {
    setBusy(true);
    const now = Date.now();
    try {
      const batch = writeBatch(db);
      batch.set(
        doc(db, 'orders', order.id),
        {
          status: next,
          updatedAt: now,
          timeline: [
            ...(order.timeline ?? []),
            { at: now, status: next, by: admin?.email ?? 'admin', note: '' },
          ],
        },
        { merge: true },
      );

      const alreadyReserved = (order.timeline ?? []).some((t) => t.status === 'confirmed');
      if (next === 'confirmed' && !alreadyReserved) {
        order.items.forEach((item) => {
          const product = products.find((p) => p.id === item.productId);
          if (product?.trackStock) {
            batch.set(
              doc(db, 'products', product.id),
              {
                stock: Math.max(0, product.stock - item.qty),
                soldCount: (product.soldCount ?? 0) + item.qty,
                updatedAt: now,
              },
              { merge: true },
            );
          }
        });
      }

      await batch.commit();
      logActivity(admin?.email ?? 'admin', `order marked ${next}`, order.number);
      setActive((o) => (o ? { ...o, status: next } : o));
      toast.success(`Order ${order.number} is now ${next}.`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const changePayment = async (order: Order, next: PaymentStatus) => {
    try {
      await setDoc(doc(db, 'orders', order.id), { paymentStatus: next, updatedAt: Date.now() }, { merge: true });
      setActive((o) => (o ? { ...o, paymentStatus: next } : o));
      toast.success(`Payment marked ${next}.`);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const addNote = async (order: Order) => {
    if (!note.trim()) return;
    const now = Date.now();
    try {
      await setDoc(
        doc(db, 'orders', order.id),
        {
          timeline: [
            ...(order.timeline ?? []),
            { at: now, status: 'note', by: admin?.email ?? 'admin', note: note.trim() },
          ],
          updatedAt: now,
        },
        { merge: true },
      );
      setActive((o) =>
        o ? { ...o, timeline: [...(o.timeline ?? []), { at: now, status: 'note', by: admin?.email ?? 'admin', note: note.trim() }] } : o,
      );
      setNote('');
      toast.success('Note added.');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const exportCsv = () => {
    const header = ['Number', 'Date', 'Customer', 'Email', 'Phone', 'Address', 'Items', 'Total', 'Payment', 'Status'];
    const lines = rows.map((o) =>
      [
        o.number,
        formatDate(o.createdAt, true),
        o.customerName,
        o.customerEmail,
        o.customerPhone,
        `${o.address} ${o.city}`.trim(),
        o.items.map((i) => `${i.qty}x ${i.name}`).join(' | '),
        o.total,
        o.paymentStatus,
        o.status,
      ]
        .map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`)
        .join(','),
    );
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">Selling</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">Orders</h1>
          <p className="mt-2 text-sm text-ink-400">
            {totals.count} order{totals.count === 1 ? '' : 's'} · {money(totals.paid)} collected
          {isSeller && ' · orders containing your items'}
          </p>
        </div>
        <Button variant="outline" icon={<Download size={16} />} onClick={exportCsv} className="border-white/20 text-white hover:bg-white/10">
          Export CSV
        </Button>
      </header>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order, name, e-mail or phone…" className="pl-10" />
        </div>
        <div className="w-44">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart size={40} />}
          title={orders.length ? 'No orders match' : 'No orders yet'}
          text={orders.length ? 'Try a different search or status.' : 'Orders placed on the storefront land here in real time.'}
          className="border-white/15 text-white"
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <div className="thin-scrollbar overflow-x-auto">
            <table className="w-full min-w-[48rem] text-left text-sm">
              <thead className="bg-white/[0.03] text-[10px] uppercase tracking-[0.16em] text-ink-500">
                <tr>
                  <th className="px-4 py-4 font-bold">Order</th>
                  <th className="px-3 py-4 font-bold">Customer</th>
                  <th className="px-3 py-4 font-bold">Items</th>
                  <th className="px-3 py-4 font-bold">Total</th>
                  <th className="px-3 py-4 font-bold">Payment</th>
                  <th className="px-3 py-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => setActive(o)}
                    className="cursor-pointer transition hover:bg-white/[0.03]"
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-white">{o.number}</p>
                      <p className="text-[11px] text-ink-500">{timeAgo(o.createdAt)}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-ink-200">{o.customerName}</p>
                      <p className="text-[11px] text-ink-500">{o.customerPhone || o.customerEmail}</p>
                    </td>
                    <td className="px-3 py-3 text-ink-400">
                      {o.items.reduce((n, i) => n + i.qty, 0)}
                    </td>
                    <td className="px-3 py-3 font-semibold text-white">{money(o.total)}</td>
                    <td className="px-3 py-3">
                      <Badge tone={o.paymentStatus === 'paid' ? 'green' : o.paymentStatus === 'refunded' ? 'red' : 'neutral'}>
                        {o.paymentStatus}
                      </Badge>
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={STATUS_TONE[o.status]}>{o.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail drawer */}
      {active && (
        <div className="fixed inset-0 z-[140]">
          <div className="absolute inset-0 animate-fade-in bg-black/60" onClick={() => setActive(null)} />
          <aside className="animate-slide-in absolute right-0 top-0 flex h-full w-full max-w-lg flex-col border-l border-white/10 bg-ink-950">
            <header className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
              <div>
                <p className="font-display text-xl font-bold text-white">{active.number}</p>
                <p className="mt-1 text-[11px] text-ink-500">{formatDate(active.createdAt, true)}</p>
              </div>
              <div className="flex gap-1 no-print">
                <button onClick={() => window.print()} className="rounded-lg p-2 text-ink-400 hover:bg-white/10 hover:text-white" aria-label="Print">
                  <Printer size={17} />
                </button>
                <button onClick={() => setActive(null)} className="rounded-lg p-2 text-ink-400 hover:bg-white/10 hover:text-white" aria-label="Close">
                  <X size={18} />
                </button>
              </div>
            </header>

            <div className="thin-scrollbar flex-1 overflow-y-auto px-6 py-6">
              {/* Status controls — the platform's, not a seller's: one order can
                  hold items from several sellers. */}
              {!managesEverything ? (
                <div className="mb-7 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs leading-relaxed text-ink-400">
                  <p className="mb-1 font-bold uppercase tracking-wider text-ink-300">Your items in this order</p>
                  <p>
                    Orders can contain items from several sellers, so only the shop owner changes an
                    order's status. Pack your items and the owner confirms and settles with you.
                  </p>
                </div>
              ) : (
              <div className="mb-7 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="label">Order status</p>
                  <Select
                    value={active.status}
                    disabled={busy}
                    onChange={(e) => void changeStatus(active, e.target.value as OrderStatus)}
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </Select>
                </div>
                <div>
                  <p className="label">Payment</p>
                  <Select
                    value={active.paymentStatus}
                    onChange={(e) => void changePayment(active, e.target.value as PaymentStatus)}
                  >
                    <option value="unpaid">unpaid</option>
                    <option value="paid">paid</option>
                    <option value="refunded">refunded</option>
                  </Select>
                </div>
              </div>

              )}

              {managesEverything && (
                <p className="mb-4 text-[11px] text-ink-500">
                  Marking an order <strong className="text-ink-300">confirmed</strong> the first time subtracts the
                  items from stock.
                </p>
              )}

              {/* Items */}
              <section className="mb-7 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <h3 className="mb-4 text-[11px] font-bold uppercase tracking-[0.16em] text-ink-500">Items</h3>
                <ul className="space-y-3">
                  {active.items.map((it, i) => {
                    const mine =
                      !isSeller ||
                      (it.sellerId ?? '').toLowerCase() === (admin?.email ?? '').toLowerCase();
                    return (
                      <li
                        key={i}
                        className={cn(
                          'flex items-start justify-between gap-3',
                          !mine && 'opacity-40',
                        )}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm text-white">
                            {it.name}
                            {isSeller && mine && (
                              <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-accent">
                                yours
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-ink-500">
                            {it.variant ? `${it.variant} · ` : ''}{it.qty} × {money(it.price)}
                            {managesEverything && it.sellerName ? ` · ${it.sellerName}` : ''}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-semibold text-white">{money(it.price * it.qty)}</span>
                      </li>
                    );
                  })}
                </ul>

                <dl className="mt-5 space-y-2 border-t border-white/10 pt-4 text-sm">
                  <div className="flex justify-between"><dt className="text-ink-500">Subtotal</dt><dd className="text-ink-300">{money(active.subtotal)}</dd></div>
                  {active.discount > 0 && (
                    <div className="flex justify-between"><dt className="text-ink-500">Discount {active.couponCode && `(${active.couponCode})`}</dt><dd className="text-emerald-400">−{money(active.discount)}</dd></div>
                  )}
                  <div className="flex justify-between"><dt className="text-ink-500">Delivery</dt><dd className="text-ink-300">{active.shipping ? money(active.shipping) : 'Free'}</dd></div>
                  {active.tax > 0 && (
                    <div className="flex justify-between"><dt className="text-ink-500">Tax</dt><dd className="text-ink-300">{money(active.tax)}</dd></div>
                  )}
                  <div className="flex justify-between border-t border-white/10 pt-3 text-base font-bold text-white">
                    <dt>Total</dt><dd>{money(active.total)}</dd>
                  </div>
                </dl>
              </section>

              {/* Customer */}
              <section className="mb-7 rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-sm">
                <h3 className="mb-4 text-[11px] font-bold uppercase tracking-[0.16em] text-ink-500">Customer</h3>
                <p className="font-semibold text-white">{active.customerName}</p>
                <p className="mt-1 text-ink-400">
                  <a href={`mailto:${active.customerEmail}`} className="hover:text-accent">{active.customerEmail}</a>
                </p>
                {active.customerPhone && (
                  <p className="text-ink-400">
                    <a href={`tel:${active.customerPhone}`} className="hover:text-accent">{active.customerPhone}</a>
                  </p>
                )}
                <p className="mt-3 text-ink-400">{active.address}{active.city ? `, ${active.city}` : ''}</p>
                <p className="mt-3 text-[11px] uppercase tracking-wider text-ink-600">Paying by {active.paymentMethod}</p>
                {active.notes && (
                  <p className="mt-3 rounded-lg bg-white/5 p-3 text-xs italic text-ink-300">“{active.notes}”</p>
                )}
              </section>

              {/* Timeline */}
              <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <h3 className="mb-4 text-[11px] font-bold uppercase tracking-[0.16em] text-ink-500">History</h3>
                <ol className="space-y-4">
                  {(active.timeline ?? []).map((t, i) => (
                    <li key={i} className="flex gap-3">
                      <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', t.status === 'note' ? 'bg-ink-500' : 'bg-accent')} />
                      <div className="min-w-0">
                        <p className="text-sm text-white">
                          {t.status === 'note' ? t.note : `Marked ${t.status}`}
                        </p>
                        <p className="text-[11px] text-ink-500">{formatDate(t.at, true)} · {t.by}</p>
                      </div>
                    </li>
                  ))}
                </ol>

                {managesEverything && (
                <div className="mt-5 flex gap-2">
                  <Input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), void addNote(active))}
                    placeholder="Add an internal note…"
                  />
                  <Button variant="outline" onClick={() => void addNote(active)} className="shrink-0 border-white/20 text-white hover:bg-white/10">
                    Add
                  </Button>
                </div>
                )}
              </section>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
