// FILE: src/pages/admin/AdminProducts.tsx
import React, { useMemo, useState } from 'react';
import { deleteDoc, doc, setDoc, addDoc, collection, writeBatch } from 'firebase/firestore';
import {
  Copy, Eye, EyeOff, Package, Pencil, Plus, Search, Star, Trash2,
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { logActivity } from '../../lib/activity';
import ProductEditor from './ProductEditor';
import { Badge, Button, ConfirmDialog, EmptyState, Input, Select } from '../../components/ui';
import { seedDemoCatalogue } from '../../data/seed';
import type { Product } from '../../lib/types';
import { cn, errorMessage, PLACEHOLDER_IMAGE, slugify } from '../../lib/utils';

const AdminProducts: React.FC = () => {
  const { products, categories, money } = useStore();
  const { admin } = useAuth();
  const visibleProducts = admin?.role === 'owner' ? products : products.filter((p) => p.sellerId === admin?.email);
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [confirm, setConfirm] = useState<{ ids: string[]; label: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const seed = async () => {
    setSeeding(true);
    try {
      const { products: n } = await seedDemoCatalogue();
      toast.success(`${n} demo products added — edit or delete them freely.`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSeeding(false);
    }
  };

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return visibleProducts.filter((p) => {
      if (status && p.status !== status) return false;
      if (category && p.categoryId !== category) return false;
      if (!needle) return true;
      return (
        p.name.toLowerCase().includes(needle) ||
        p.sku?.toLowerCase().includes(needle) ||
        p.categoryName?.toLowerCase().includes(needle) ||
        p.tags?.some((t) => t.includes(needle))
      );
    });
  }, [visibleProducts, search, status, category]);

  const allChecked = rows.length > 0 && selected.length === rows.length;

  const toggleAll = () => setSelected(allChecked ? [] : rows.map((r) => r.id));
  const toggleOne = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const openNew = () => { setEditing(null); setEditorOpen(true); };
  const openEdit = (p: Product) => { setEditing(p); setEditorOpen(true); };

  const patch = async (id: string, data: Partial<Product>, note: string) => {
    try {
      await setDoc(doc(db, 'products', id), { ...data, updatedAt: Date.now() }, { merge: true });
      logActivity(admin?.email ?? 'admin', note, products.find((p) => p.id === id)?.name ?? id);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const bulk = async (data: Partial<Product>, note: string) => {
    if (!selected.length) return;
    setBusy(true);
    try {
      const batch = writeBatch(db);
      selected.forEach((id) => batch.set(doc(db, 'products', id), { ...data, updatedAt: Date.now() }, { merge: true }));
      await batch.commit();
      logActivity(admin?.email ?? 'admin', note, `${selected.length} products`);
      toast.success(`${selected.length} product${selected.length === 1 ? '' : 's'} updated.`);
      setSelected([]);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const duplicate = async (p: Product) => {
    const { id, ...rest } = p;
    try {
      await addDoc(collection(db, 'products'), {
        ...rest,
        name: `${p.name} (copy)`,
        slug: slugify(`${p.name}-copy-${Date.now().toString(36)}`),
        status: 'draft',
        soldCount: 0,
        reviewCount: 0,
        rating: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      toast.success('Duplicated as a draft.');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const doDelete = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      const batch = writeBatch(db);
      confirm.ids.forEach((id) => batch.delete(doc(db, 'products', id)));
      await batch.commit();
      logActivity(admin?.email ?? 'admin', 'deleted product', confirm.label);
      toast.success('Deleted.');
      setSelected([]);
      setConfirm(null);
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
          <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">Products</h1>
          <p className="mt-2 text-sm text-ink-400">
            {visibleProducts.length} total · {visibleProducts.filter((p) => p.status === 'active').length} live
          </p>
        </div>
        <Button variant="accent" size="lg" icon={<Plus size={17} />} onClick={openNew}>
          New product
        </Button>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, SKU or tag…"
            className="pl-10"
          />
        </div>
        <div className="w-40">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </Select>
        </div>
        <div className="w-48">
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Bulk bar */}
      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-accent/40 bg-accent/10 p-4">
          <span className="text-sm font-bold text-white">{selected.length} selected</span>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button size="sm" variant="subtle" onClick={() => void bulk({ status: 'active' }, 'published products')} disabled={busy}>
              Publish
            </Button>
            <Button size="sm" variant="subtle" onClick={() => void bulk({ status: 'draft' }, 'unpublished products')} disabled={busy}>
              Unpublish
            </Button>
            <Button size="sm" variant="subtle" onClick={() => void bulk({ featured: true }, 'featured products')} disabled={busy}>
              Feature
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => setConfirm({ ids: selected, label: `${selected.length} products` })}
              disabled={busy}
            >
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      {rows.length === 0 ? (
        <EmptyState
          icon={<Package size={40} />}
          title={visibleProducts.length ? 'Nothing matches those filters' : 'No products yet'}
          text={
            visibleProducts.length
              ? 'Try a different search term or clear the filters.'
              : 'Add your first product — it appears on the storefront the moment you save.'
          }
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="accent" onClick={openNew} icon={<Plus size={16} />}>New product</Button>
              {visibleProducts.length === 0 && (
                <Button variant="outline" onClick={() => void seed()} loading={seeding} className="border-white/25 text-white hover:bg-white/10">
                  Load demo catalogue
                </Button>
              )}
            </div>
          }
          className="border-white/15 text-white"
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <div className="thin-scrollbar overflow-x-auto">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead className="bg-white/[0.03] text-[10px] uppercase tracking-[0.16em] text-ink-500">
                <tr>
                  <th className="w-12 px-4 py-4">
                    <input type="checkbox" checked={allChecked} onChange={toggleAll} className="h-4 w-4 accent-[var(--accent)]" />
                  </th>
                  <th className="px-3 py-4 font-bold">Product</th>
                  <th className="px-3 py-4 font-bold">Category</th>
                  <th className="px-3 py-4 font-bold">Price</th>
                  <th className="px-3 py-4 font-bold">Stock</th>
                  <th className="px-3 py-4 font-bold">Status</th>
                  <th className="px-3 py-4 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((p) => {
                  const soldOut = p.trackStock && p.stock <= 0;
                  return (
                    <tr key={p.id} className="transition hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.includes(p.id)}
                          onChange={() => toggleOne(p.id)}
                          className="h-4 w-4 accent-[var(--accent)]"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <button onClick={() => openEdit(p)} className="flex items-center gap-3 text-left">
                          <img
                            src={p.images?.[0] || PLACEHOLDER_IMAGE}
                            alt=""
                            className="h-12 w-12 shrink-0 rounded-lg object-cover"
                            onError={(e) => ((e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE)}
                          />
                          <span className="min-w-0">
                            <span className="block max-w-[16rem] truncate font-semibold text-white">{p.name}</span>
                            <span className="block text-[11px] text-ink-500">{p.sku || '—'}</span>
                          </span>
                        </button>
                      </td>
                      <td className="px-3 py-3 text-ink-400">{p.categoryName || '—'}</td>
                      <td className="px-3 py-3">
                        <span className="font-semibold text-white">{money(p.price)}</span>
                        {p.compareAtPrice > p.price && (
                          <span className="ml-2 text-[11px] text-ink-600 line-through">{money(p.compareAtPrice)}</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {p.trackStock ? (
                          <span className={cn('font-semibold', soldOut ? 'text-red-400' : p.stock <= 5 ? 'text-amber-400' : 'text-ink-300')}>
                            {p.stock}
                          </span>
                        ) : (
                          <span className="text-ink-600">∞</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <Badge tone={p.status === 'active' ? 'green' : p.status === 'draft' ? 'amber' : 'neutral'}>
                          {p.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => void patch(p.id, { featured: !p.featured }, 'toggled featured')}
                            title={p.featured ? 'Remove from featured' : 'Mark as featured'}
                            className={cn(
                              'rounded-lg p-2 transition hover:bg-white/10',
                              p.featured ? 'text-accent' : 'text-ink-600',
                            )}
                          >
                            <Star size={15} className={p.featured ? 'fill-current' : ''} />
                          </button>
                          <button
                            onClick={() =>
                              void patch(p.id, { status: p.status === 'active' ? 'draft' : 'active' }, 'toggled visibility')
                            }
                            title={p.status === 'active' ? 'Hide from shop' : 'Publish'}
                            className="rounded-lg p-2 text-ink-400 transition hover:bg-white/10 hover:text-white"
                          >
                            {p.status === 'active' ? <Eye size={15} /> : <EyeOff size={15} />}
                          </button>
                          <button
                            onClick={() => void duplicate(p)}
                            title="Duplicate"
                            className="rounded-lg p-2 text-ink-400 transition hover:bg-white/10 hover:text-white"
                          >
                            <Copy size={15} />
                          </button>
                          <button
                            onClick={() => openEdit(p)}
                            title="Edit"
                            className="rounded-lg p-2 text-ink-400 transition hover:bg-white/10 hover:text-white"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => setConfirm({ ids: [p.id], label: p.name })}
                            title="Delete"
                            className="rounded-lg p-2 text-ink-400 transition hover:bg-red-500/20 hover:text-red-400"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ProductEditor open={editorOpen} product={editing} onClose={() => setEditorOpen(false)} />

      <ConfirmDialog
        open={!!confirm}
        title="Delete permanently?"
        message={`“${confirm?.label ?? ''}” will be removed from the shop. This cannot be undone — archive instead if you may want it back.`}
        confirmLabel="Delete"
        destructive
        busy={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={() => void doDelete()}
      />
    </div>
  );
};

export default AdminProducts;
