// FILE: src/pages/admin/AdminLayout.tsx
import React, { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import {
  BadgePercent, Boxes, ExternalLink, LayoutDashboard, LayoutTemplate, LogOut, Mail,
  Menu, Package, Settings as SettingsIcon, ShoppingCart, Tags, Users, UserCog, X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { useAdminData } from '../../hooks/useAdminData';
import { Spinner } from '../../components/ui';
import { cn } from '../../lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: number;
  ownerOnly?: boolean;
}

const AdminLayout: React.FC = () => {
  const { isAdmin, isOwner, loading, admin, user, signOut } = useAuth();
  const { settings } = useStore();
  const { orders, messages } = useAdminData();
  const [sidebar, setSidebar] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSidebar(false);
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950">
        <Spinner size={26} />
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/admin" replace state={{ from: location.pathname }} />;

  const pendingOrders = orders.filter((o) => o.status === 'pending').length;
  const unreadMessages = messages.filter((m) => !m.read).length;

  const groups: { title: string; items: NavItem[] }[] = [
    {
      title: 'Overview',
      items: [{ to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
    },
    {
      title: 'Catalogue',
      items: [
        { to: '/admin/products', label: 'Products', icon: Package },
        { to: '/admin/categories', label: 'Categories', icon: Tags },
        { to: '/admin/inventory', label: 'Inventory', icon: Boxes },
      ],
    },
    {
      title: 'Selling',
      items: [
        { to: '/admin/orders', label: 'Orders', icon: ShoppingCart, badge: pendingOrders },
        { to: '/admin/customers', label: 'Customers', icon: Users },
        { to: '/admin/coupons', label: 'Discounts', icon: BadgePercent },
        { to: '/admin/messages', label: 'Inbox', icon: Mail, badge: unreadMessages },
      ],
    },
    {
      title: 'Storefront',
      items: [
        { to: '/admin/home-builder', label: 'Home builder', icon: LayoutTemplate },
        { to: '/admin/settings', label: 'Store settings', icon: SettingsIcon },
        { to: '/admin/team', label: 'Team & access', icon: UserCog, ownerOnly: false },
      ],
    },
  ];

  const Sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-white/10 px-6 py-6">
        {settings.logoUrl ? (
          <img src={settings.logoUrl} alt="" className="h-9 w-9 rounded-lg object-contain" />
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-sm font-black text-ink-950">
            {settings.storeName.slice(0, 1)}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate font-display text-base font-bold text-white">{settings.storeName}</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-500">Dashboard</p>
        </div>
        <button
          onClick={() => setSidebar(false)}
          className="ml-auto rounded-lg p-2 text-ink-400 hover:bg-white/5 lg:hidden"
          aria-label="Close navigation"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="thin-scrollbar flex-1 overflow-y-auto px-3 py-5">
        {groups.map((group) => (
          <div key={group.title} className="mb-6">
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-ink-600">
              {group.title}
            </p>
            {group.items
              .filter((item) => !item.ownerOnly || isOwner)
              .map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition',
                      isActive
                        ? 'bg-accent text-ink-950'
                        : 'text-ink-400 hover:bg-white/5 hover:text-white',
                    )
                  }
                >
                  <item.icon size={17} />
                  <span className="flex-1">{item.label}</span>
                  {!!item.badge && item.badge > 0 && (
                    <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-black text-white">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <Link
          to="/"
          target="_blank"
          className="mb-3 flex items-center gap-2 rounded-xl px-3 py-2.5 text-[12px] font-semibold text-ink-400 transition hover:bg-white/5 hover:text-white"
        >
          <ExternalLink size={15} /> View the shop
        </Link>

        <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] p-3">
          {admin?.photoURL || user?.photoURL ? (
            <img src={admin?.photoURL || user?.photoURL || ''} alt="" className="h-9 w-9 rounded-full object-cover" />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-xs font-black text-ink-950">
              {(admin?.name || user?.email || '?').slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-white">{admin?.name || user?.displayName || 'Administrator'}</p>
            <p className="truncate text-[10px] uppercase tracking-wider text-accent">{admin?.role ?? 'admin'}</p>
          </div>
          <button
            onClick={() => void signOut()}
            className="rounded-lg p-2 text-ink-400 transition hover:bg-white/10 hover:text-red-400"
            aria-label="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="admin-shell min-h-screen bg-ink-950">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/10 bg-ink-950 lg:block">
        {Sidebar}
      </aside>

      {sidebar && (
        <div className="fixed inset-0 z-[110] lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-black/60" onClick={() => setSidebar(false)} />
          <aside className="animate-slide-in absolute left-0 top-0 h-full w-72 border-r border-white/10 bg-ink-950">
            {Sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/10 bg-ink-950/90 px-4 backdrop-blur-md sm:px-6 lg:hidden">
          <button
            onClick={() => setSidebar(true)}
            className="rounded-lg p-2 text-white hover:bg-white/5"
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>
          <span className="font-display text-base font-bold text-white">{settings.storeName}</span>
        </header>

        <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
