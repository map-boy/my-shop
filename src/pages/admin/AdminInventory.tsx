// FILE: src/pages/admin/AdminInventory.tsx
import React, { useMemo, useState } from 'react';
import { doc, writeBatch } from 'firebase/firestore';
import { Boxes, Check, Search } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { logActivity } from '../../lib/activity';
import { Badge, Button, EmptyState, Input, Select } from '../../components/ui';
import { cn, errorMessage, PLACEHOLDER_IMAGE } from '../../lib/utils';

/**
 * A spreadsheet-style stock editor. Edits are staged locally and written in one
 * batch, so an admin can walk the shelves and save once.
 */
const AdminInventory: React.FC = () => {
  const { products, money } = useStore();
  const { admin, isSeller } = useAuth();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'out' | 'tracked'>('all');
  const [drafts, setDrafts] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);

  const visibleProducts = useMemo(
    () =>
      isSeller && admin?.email
        ? products.filter((p) => (p.sellerId ?? '').toLowerCase() === admin.email.toLowerCase())
        : products,
    [products, isSeller, admin?.email],
  );

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return visibleProducts
      .filter((p) => {
        if (filter === 'low') return p.trackStock && p.stock > 0 && p.stock <= 5;
        if (filter === 'out') return p.trackStock && p.stock <= 0;
        if (filter === 'tracked') return p.trackStock;
        return true;
      })
      .filter((p) => !needle || p.name.toLowerCase().includes(needle) || p.sku?.toLowerCase().includes(needle))
      .sort((a, b) => Number(b.trackStock) - Number(a.trackStock) || a.stock - b.stock);
  }, [visibleProducts, search, filter]);

  const stockValue = useMemo(
    () => visibleProducts.reduce((sum, p) => sum + (p.trackStock ? p.stock * p.price : 0), 0),
    [visibleProducts],
  );

  const dirty = Object.keys(drafts).length;

  const saveAll = async () => {
    if (!dirty) return;
    setBusy(true);
    try {
      const batch = writeBatch(db);
      Object.entries(drafts).forEach(([id, stock]) =>
        batch.set(doc(db, 'products', id), { stock, updatedAt: Date.now() }, { merge: true }),
      );
      await batch.commit();
      logActivity(admin?.email ?? 'admin', 'adjusted stock', `${dirty} products`);
      toast.success(`Stock updated for ${dirty} product${dirty === 1 ? '' : 's'}.`);
      setDrafts({});
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">Catalogue</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">Inventory</h1>
          <p className="mt-2 text-sm text-ink-400">
            Stock on hand is worth <strong className="text-white">{money(stockValue)}</strong> at selling price.
          </p>
        </div>
        {dirty > 0 && (
          <Button variant="accent" size="lg" icon={<Check size={17} />} onClick={() => void saveAll()} loading={busy}>
            Save {dirty} change{dirty === 1 ? '' : 's'}
          </Button>
        )}
      </header>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" className="pl-10" />
        </div>
        <div className="w-48">
          <Select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
            <option value="all">Everything</option>
            <option value="tracked">Tracked only</option>
            <option value="low">Running low (≤5)</option>
            <option value="out">Sold out</option>
          </Select>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Boxes size={40} />}
          title="Nothing here"
          text="No products match this filter."
          className="border-white/15 text-white"
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <div className="thin-scrollbar overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead className="bg-white/[0.03] text-[10px] uppercase tracking-[0.16em] text-ink-500">
                <tr>
                  <th className="px-4 py-4 font-bold">Product</th>
                  <th className="px-3 py-4 font-bold">SKU</th>
                  <th className="px-3 py-4 font-bold">Price</th>
                  <th className="px-3 py-4 font-bold">Status</th>
                  <th className="w-40 px-3 py-4 font-bold">Units</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((p) => {
                  const current = drafts[p.id] ?? p.stock;
                  const changed = drafts[p.id] !== undefined && drafts[p.id] !== p.stock;
                  return (
                    <tr key={p.id} className={cn('transition', changed ? 'bg-accent/5' : 'hover:bg-white/[0.02]')}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.images?.[0] || PLACEHOLDER_IMAGE}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-lg object-cover"
                            onError={(e) => ((e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE)}
                          />
                          <span className="block max-w-[18rem] truncate font-semibold text-white">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-ink-500">{p.sku || '—'}</td>
                      <td className="px-3 py-3 text-ink-300">{money(p.price)}</td>
                      <td className="px-3 py-3">
                        {!p.trackStock ? (
                          <Badge>Not tracked</Badge>
                        ) : current <= 0 ? (
                          <Badge tone="red">Sold out</Badge>
                        ) : current <= 5 ? (
                          <Badge tone="amber">Low</Badge>
                        ) : (
                          <Badge tone="green">In stock</Badge>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {p.trackStock ? (
                          <input
                            type="number"
                            min={0}
                            value={current}
                            onChange={(e) =>
                              setDrafts((d) => ({ ...d, [p.id]: Math.max(0, Number(e.target.value)) }))
                            }
                            className="field h-10 w-28"
                          />
                        ) : (
                          <span className="text-ink-600">∞</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInventory;
