// FILE: src/pages/admin/AdminCategories.tsx
import React, { useEffect, useState } from 'react';
import { addDoc, collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import { ArrowDown, ArrowUp, Pencil, Plus, Star, Tags, Trash2 } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { logActivity } from '../../lib/activity';
import ImageInput from '../../components/ImageInput';
import { Badge, Button, ConfirmDialog, EmptyState, Field, Input, Modal, Textarea, Toggle } from '../../components/ui';
import type { Category } from '../../lib/types';
import { errorMessage, PLACEHOLDER_IMAGE, slugify } from '../../lib/utils';

const BLANK: Omit<Category, 'id'> = {
  name: '', slug: '', description: '', image: '', icon: '',
  featured: true, order: 0, createdAt: 0,
};

const AdminCategories: React.FC = () => {
  const { categories, products } = useStore();
  const { admin } = useAuth();
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<Omit<Category, 'id'>>(BLANK);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<Category | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      const { id, ...rest } = editing;
      setForm({ ...BLANK, ...rest });
    } else {
      setForm({ ...BLANK, order: categories.length });
    }
  }, [open, editing, categories.length]);

  const save = async () => {
    if (!form.name.trim()) return toast.error('A category needs a name.');
    setBusy(true);
    const payload = {
      ...form,
      name: form.name.trim(),
      slug: form.slug || slugify(form.name),
      createdAt: editing?.createdAt || Date.now(),
    };
    try {
      if (editing) {
        await setDoc(doc(db, 'categories', editing.id), payload, { merge: true });
        // Keep the denormalised name on products in sync.
        const affected = products.filter((p) => p.categoryId === editing.id);
        if (affected.length && editing.name !== payload.name) {
          const batch = writeBatch(db);
          affected.forEach((p) => batch.set(doc(db, 'products', p.id), { categoryName: payload.name }, { merge: true }));
          await batch.commit();
        }
        logActivity(admin?.email ?? 'admin', 'updated category', payload.name);
        toast.success('Category updated.');
      } else {
        await addDoc(collection(db, 'categories'), payload);
        logActivity(admin?.email ?? 'admin', 'created category', payload.name);
        toast.success('Category created.');
      }
      setOpen(false);
      setEditing(null);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const move = async (cat: Category, direction: -1 | 1) => {
    const sorted = [...categories].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((c) => c.id === cat.id);
    const swapWith = sorted[index + direction];
    if (!swapWith) return;
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'categories', cat.id), { order: swapWith.order }, { merge: true });
      batch.set(doc(db, 'categories', swapWith.id), { order: cat.order }, { merge: true });
      await batch.commit();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const doDelete = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'categories', confirm.id));
      // Products keep existing but become uncategorised.
      products
        .filter((p) => p.categoryId === confirm.id)
        .forEach((p) => batch.set(doc(db, 'products', p.id), { categoryId: '', categoryName: '' }, { merge: true }));
      await batch.commit();
      logActivity(admin?.email ?? 'admin', 'deleted category', confirm.name);
      toast.success('Category deleted.');
      setConfirm(null);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const sorted = [...categories].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">Catalogue</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">Categories</h1>
          <p className="mt-2 text-sm text-ink-400">
            Order here is the order shoppers see on the home page and the categories page.
          </p>
        </div>
        <Button variant="accent" size="lg" icon={<Plus size={17} />} onClick={() => { setEditing(null); setOpen(true); }}>
          New category
        </Button>
      </header>

      {sorted.length === 0 ? (
        <EmptyState
          icon={<Tags size={40} />}
          title="No categories yet"
          text="Group your products so shoppers can find things fast."
          action={
            <Button variant="accent" icon={<Plus size={16} />} onClick={() => { setEditing(null); setOpen(true); }}>
              New category
            </Button>
          }
          className="border-white/15 text-white"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((c, i) => {
            const count = products.filter((p) => p.categoryId === c.id).length;
            return (
              <article key={c.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                <div className="relative aspect-[16/9]">
                  <img
                    src={c.image || PLACEHOLDER_IMAGE}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={(e) => ((e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE)}
                  />
                  {c.featured && (
                    <span className="absolute left-3 top-3">
                      <Badge tone="accent"><Star size={10} className="fill-current" /> Featured</Badge>
                    </span>
                  )}
                </div>

                <div className="p-5">
                  <h2 className="font-display text-lg font-bold text-white">{c.name}</h2>
                  <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-xs leading-relaxed text-ink-500">
                    {c.description || 'No description.'}
                  </p>
                  <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
                    {count} product{count === 1 ? '' : 's'}
                  </p>

                  <div className="mt-5 flex items-center gap-1">
                    <button
                      onClick={() => void move(c, -1)}
                      disabled={i === 0}
                      className="rounded-lg p-2 text-ink-400 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
                      aria-label="Move up"
                    >
                      <ArrowUp size={15} />
                    </button>
                    <button
                      onClick={() => void move(c, 1)}
                      disabled={i === sorted.length - 1}
                      className="rounded-lg p-2 text-ink-400 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
                      aria-label="Move down"
                    >
                      <ArrowDown size={15} />
                    </button>
                    <div className="ml-auto flex gap-1">
                      <button
                        onClick={() => { setEditing(c); setOpen(true); }}
                        className="rounded-lg p-2 text-ink-400 transition hover:bg-white/10 hover:text-white"
                        aria-label="Edit"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setConfirm(c)}
                        className="rounded-lg p-2 text-ink-400 transition hover:bg-red-500/20 hover:text-red-400"
                        aria-label="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => { setOpen(false); setEditing(null); }}
        title={editing ? 'Edit category' : 'New category'}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setOpen(false); setEditing(null); }} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={() => void save()} loading={busy}>Save</Button>
          </div>
        }
      >
        <div className="space-y-5">
          <Field label="Name" required>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: slugify(e.target.value) }))}
              placeholder="Bags & luggage"
              autoFocus
            />
          </Field>

          <Field label="Description" hint="Shown on the categories page.">
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Everything you need for the trip."
            />
          </Field>

          <ImageInput
            value={form.image ? [form.image] : []}
            onChange={(urls) => setForm((f) => ({ ...f, image: urls[0] ?? '' }))}
            max={1}
            compact
            folder="categories"
            label="Cover image"
            hint="A wide photo works best — it is used as a tile background."
          />

          <div className="rounded-xl border border-ink-200 p-5">
            <Toggle
              checked={form.featured}
              onChange={(v) => setForm((f) => ({ ...f, featured: v }))}
              label="Show on the home page"
              hint="Featured categories fill the “Shop by category” row."
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        title="Delete this category?"
        message={`“${confirm?.name ?? ''}” will be removed. Its products stay in the shop but become uncategorised.`}
        confirmLabel="Delete"
        destructive
        busy={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={() => void doDelete()}
      />
    </div>
  );
};

export default AdminCategories;
