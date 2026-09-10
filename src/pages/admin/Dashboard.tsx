// FILE: src/pages/admin/Dashboard.tsx
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, ArrowUpRight, BadgePercent, Boxes, LayoutTemplate, Mail,
  Package, ShoppingCart, TrendingUp, UserCog, Users,
} from 'lucide-react';
import { useAdminData } from '../../hooks/useAdminData';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { Badge, EmptyState } from '../../components/ui';
import { cn, timeAgo } from '../../lib/utils';
import type { Order } from '../../lib/types';

const REVENUE_STATUSES: Order['status'][] = ['confirmed', 'processing', 'shipped', 'delivered'];

const StatCard: React.FC<{
  label: string;
  value: string;
  hint?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  to?: string;
  tone?: 'default' | 'accent';
}> = ({ label, value, hint, icon: Icon, to, tone = 'default' }) => {
  const body = (
    <div
      className={cn(
        'group h-full rounded-2xl border p-5 transition',
        tone === 'accent'
          ? 'border-accent/40 bg-accent/10'
          : 'border-white/10 bg-white/[0.03] hover:border-white/20',
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <span
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl',
            tone === 'accent' ? 'bg-accent text-ink-950' : 'bg-white/5 text-accent',
          )}
        >
          <Icon size={18} />
        </span>
        {to && <ArrowUpRight size={16} className="text-ink-600 transition group-hover:text-accent" />}
      </div>
      <p className="font-display text-3xl font-bold text-white">{value}</p>
      <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-ink-500">{label}</p>
      {hint && <p className="mt-2 text-[11px] text-ink-500">{hint}</p>}
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
};

const Dashboard: React.FC = () => {
  const { orders, customers, messages, coupons, subscribers } = useAdminData();
  const { products, categories, money } = useStore();
  const { admin } = useAuth();

  const stats = useMemo(() => {
    const revenue = orders
      .filter((o) => REVENUE_STATUSES.includes(o.status))
      .reduce((sum, o) => sum + (o.total ?? 0), 0);

    const thirtyDaysAgo = Date.now() - 30 * 864e5;
    const recentRevenue = orders
      .filter((o) => REVENUE_STATUSES.includes(o.status) && o.createdAt > thirtyDaysAgo)
      .reduce((sum, o) => sum + (o.total ?? 0), 0);

    const pending = orders.filter((o) => o.status === 'pending').length;
    const lowStock = products.filter((p) => p.trackStock && p.stock > 0 && p.stock <= 5);
    const outOfStock = products.filter((p) => p.trackStock && p.stock <= 0);

    return { revenue, recentRevenue, pending, lowStock, outOfStock };
  }, [orders, products]);

  /* Last 14 days of orders, for the sparkline. */
  const series = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, i) => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - (13 - i));
      const end = start.getTime() + 864e5;
      const total = orders
        .filter((o) => o.createdAt >= start.getTime() && o.createdAt < end)
        .reduce((s, o) => s + (o.total ?? 0), 0);
      return { label: start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }), total };
    });
    const peak = Math.max(1, ...days.map((d) => d.total));
    return { days, peak };
  }, [orders]);

  const unread = messages.filter((m) => !m.read).length;

  const quickLinks = [
    { to: '/admin/products', label: 'Add a product', icon: Package },
    { to: '/admin/home-builder', label: 'Edit the home page', icon: LayoutTemplate },
    { to: '/admin/coupons', label: 'Create a discount', icon: BadgePercent },
    { to: '/admin/team', label: 'Invite an admin', icon: UserCog },
  ];

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">Overview</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">
          Welcome back{admin?.name ? `, ${admin.name.split(' ')[0]}` : ''}
        </h1>
        <p className="mt-2 text-sm text-ink-400">
          Everything on the storefront is editable from here — nothing needs a developer.
        </p>
      </header>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue (confirmed)"
          value={money(stats.revenue)}
          hint={`${money(stats.recentRevenue)} in the last 30 days`}
          icon={TrendingUp}
          tone="accent"
        />
        <StatCard
          label="Orders"
          value={String(orders.length)}
          hint={stats.pending ? `${stats.pending} awaiting confirmation` : 'All caught up'}
          icon={ShoppingCart}
          to="/admin/orders"
        />
        <StatCard
          label="Products"
          value={String(products.length)}
          hint={`${categories.length} categories`}
          icon={Package}
          to="/admin/products"
        />
        <StatCard
          label="Customers"
          value={String(customers.length)}
          hint={`${subscribers.length} newsletter subscribers`}
          icon={Users}
          to="/admin/customers"
        />
      </div>

      {/* Alerts */}
      {(stats.outOfStock.length > 0 || stats.lowStock.length > 0 || unread > 0 || stats.pending > 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {stats.pending > 0 && (
            <Link
              to="/admin/orders"
              className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100 transition hover:border-amber-500/60"
            >
              <ShoppingCart size={17} className="shrink-0 text-amber-400" />
              <span>
                <strong>{stats.pending}</strong> order{stats.pending === 1 ? '' : 's'} waiting to be confirmed
              </span>
            </Link>
          )}
          {unread > 0 && (
            <Link
              to="/admin/messages"
              className="flex items-center gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-100 transition hover:border-blue-500/60"
            >
              <Mail size={17} className="shrink-0 text-blue-400" />
              <span>
                <strong>{unread}</strong> unread message{unread === 1 ? '' : 's'} in the inbox
              </span>
            </Link>
          )}
          {stats.outOfStock.length > 0 && (
            <Link
              to="/admin/inventory"
              className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100 transition hover:border-red-500/60"
            >
              <AlertTriangle size={17} className="shrink-0 text-red-400" />
              <span>
                <strong>{stats.outOfStock.length}</strong> product{stats.outOfStock.length === 1 ? '' : 's'} sold out
              </span>
            </Link>
          )}
          {stats.lowStock.length > 0 && (
            <Link
              to="/admin/inventory"
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-ink-300 transition hover:border-white/25"
            >
              <Boxes size={17} className="shrink-0 text-accent" />
              <span>
                <strong className="text-white">{stats.lowStock.length}</strong> product
                {stats.lowStock.length === 1 ? '' : 's'} running low
              </span>
            </Link>
          )}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        {/* Sales chart */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-8 flex items-baseline justify-between">
            <h2 className="font-display text-xl font-bold text-white">Last 14 days</h2>
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-500">
              Order value
            </span>
          </div>

          <div className="flex h-48 items-end gap-1.5">
            {series.days.map((d, i) => (
              <div key={i} className="group relative flex flex-1 flex-col items-center justify-end">
                <div
                  className="w-full rounded-t bg-accent/70 transition-all group-hover:bg-accent"
                  style={{ height: `${Math.max(2, (d.total / series.peak) * 100)}%` }}
                />
                <span className="pointer-events-none absolute -top-8 whitespace-nowrap rounded-lg bg-ink-900 px-2 py-1 text-[10px] font-bold text-white opacity-0 transition group-hover:opacity-100">
                  {money(d.total)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between text-[10px] uppercase tracking-wider text-ink-600">
            <span>{series.days[0]?.label}</span>
            <span>{series.days[series.days.length - 1]?.label}</span>
          </div>
        </section>

        {/* Quick actions + recent orders */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="mb-5 font-display text-xl font-bold text-white">Quick actions</h2>
            <div className="grid gap-2">
              {quickLinks.map((q) => (
                <Link
                  key={q.to}
                  to={q.to}
                  className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-[13px] font-semibold text-ink-300 transition hover:border-accent/40 hover:text-white"
                >
                  <q.icon size={16} className="text-accent" />
                  {q.label}
                  <ArrowUpRight size={14} className="ml-auto text-ink-600" />
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-white">Latest orders</h2>
              <Link to="/admin/orders" className="text-[11px] font-bold uppercase tracking-wider text-accent">
                All
              </Link>
            </div>

            {orders.length === 0 ? (
              <p className="py-6 text-center text-xs text-ink-500">No orders yet.</p>
            ) : (
              <ul className="space-y-3">
                {orders.slice(0, 5).map((o) => (
                  <li key={o.id}>
                    <Link
                      to="/admin/orders"
                      className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-white/5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-white">{o.customerName}</p>
                        <p className="text-[11px] text-ink-500">
                          {o.number} · {timeAgo(o.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[13px] font-bold text-white">{money(o.total)}</p>
                        <Badge tone={o.status === 'pending' ? 'amber' : o.status === 'delivered' ? 'green' : 'neutral'}>
                          {o.status}
                        </Badge>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {products.length === 0 && (
        <EmptyState
          icon={<Package size={40} />}
          title="Your catalogue is empty"
          text="Add your first product and it appears on the storefront immediately."
          action={
            <Link
              to="/admin/products"
              className="inline-flex h-11 items-center rounded-xl bg-accent px-6 text-[13px] font-bold uppercase tracking-wider text-ink-950"
            >
              Add a product
            </Link>
          }
          className="border-white/15 text-white"
        />
      )}

      {coupons.length > 0 && (
        <p className="text-[11px] text-ink-600">
          {coupons.filter((c) => c.active).length} active discount code
          {coupons.filter((c) => c.active).length === 1 ? '' : 's'}.
        </p>
      )}
    </div>
  );
};

export default Dashboard;
