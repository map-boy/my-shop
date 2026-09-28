// FILE: src/pages/admin/AdminSections.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import { ArrowDown, ArrowUp, LayoutGrid, Package, Pencil, Plus, Trash2 } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { useSections } from '../../lib/sections';
import { translateMissing } from '../../lib/autoTranslate';
import { useToast } from '../../context/ToastContext';
import { logActivity } from '../../lib/activity';
import ImageInput from '../../components/ImageInput';
import { Badge, Button, ConfirmDialog, EmptyState, Field, Input, Modal, Textarea, Toggle } from '../../components/ui';
import type { Section } from '../../lib/types';
import { errorMessage, PLACEHOLDER_IMAGE, slugify } from '../../lib/utils';

type Batch = ReturnType<typeof writeBatch>;
type Op = (b: Batch) => void;

async function commitAll(ops: Op[]) {
  for (let i = 0; i < ops.length; i += 400) {
    const b = writeBatch(db);
    ops.slice(i, i + 400).forEach((o) => o(b));
    await b.commit();
  }
}

const BLANK: Omit<Section, 'id'> = {
  name: '', slug: '', description: '', image: '', enabled: true, showOnHome: true, order: 0, createdAt: 0,
};

const AdminSections: React.FC = () => {
  const { sections } = useSections();
  const { products } = useStore();
  const { admin } = useAuth();
  const toast = useToast();
  const actor = admin?.email ?? 'admin';

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Section | null>(null);
  const [form, setForm] = useState<Omit<Section, 'id'>>(BLANK);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<Section | null>(null);
  const [assign, setAssign] = useState<Section | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [q, setQ] = useState('');

  useEffect(() => {
    if (!open) return;
    if (editing) {
      const { id, ...rest } = editing;
      setForm({ ...BLANK, ...rest });
    } else {
      setForm({ ...BLANK, order: sections.length });
    }
  }, [open, editing, sections.length]);

  useEffect(() => {
    if (!assign) return;
    setPicked(new Set(products.filter((p) => p.sectionId === assign.id).map((p) => p.id)));
    setQ('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assign]);

  const nameOf = useMemo(() => {
    const m = new Map<string, string>();
    sections.forEach((s) => m.set(s.id, s.name));
    return m;
  }, [sections]);

  const save = async () => {
    const name = form.name.trim();
    if (!name) return toast.error('A section needs a name.');
    setBusy(true);
    const payload = { ...form, name, slug: slugify(form.slug || name), createdAt: editing?.createdAt || Date.now() };
    try {
      if (editing) {
        await setDoc(doc(db, 'sections', editing.id), payload, { merge: true });
        if (editing.name !== name) {
          await commitAll(
            products.filter((p) => p.sectionId === editing.id).map((p) => (b: Batch) =>
              b.set(doc(db, 'products', p.id), { sectionName: name }, { merge: true })),
          );
        }
        logActivity(actor, 'updated section', name);
        toast.success('Section updated.');
      } else {
        await addDoc(collection(db, 'sections'), payload);
        logActivity(actor, 'created section', name);
        toast.success('Section created.');
      }
      void translateMissing([name, payload.description]).catch(() => undefined);
      setOpen(false);
      setEditing(null);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const createDefaults = async () => {
    setBusy(true);
    try {
      const names = ['Cagua', 'Mangaze'];
      for (let i = 0; i < names.length; i++) {
        const name = names[i];
        if (sections.some((s) => s.name.toLowerCase() === name.toLowerCase())) continue;
        await addDoc(collection(db, 'sections'), { ...BLANK, name, slug: slugify(name), order: sections.length + i, createdAt: Date.now() });
      }
      logActivity(actor, 'created sections', 'Cagua, Mangaze');
      toast.success('Cagua and Mangaze created.');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const move = async (s: Section, dir: -1 | 1) => {
    const list = [...sections];
    const i = list.findIndex((x) => x.id === s.id);
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    try {
      await commitAll(list.map((x, k) => (b: Batch) => b.set(doc(db, 'sections', x.id), { order: k }, { merge: true })));
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const doDelete = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      const ops: Op[] = [(b) => b.delete(doc(db, 'sections', confirm.id))];
      products
        .filter((p) => p.sectionId === confirm.id)
        .forEach((p) => ops.push((b) => b.set(doc(db, 'products', p.id), { sectionId: '', sectionName: '' }, { merge: true })));
      await commitAll(ops);
      logActivity(actor, 'deleted section', confirm.name);
      toast.success('Section deleted.');
      setConfirm(null);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const saveAssign = async () => {
    if (!assign) return;
    setBusy(true);
    try {
      const ops: Op[] = [];
      for (const p of products) {
        const was = p.sectionId === assign.id;
        const now = picked.has(p.id);
        if (was && !now) ops.push((b) => b.set(doc(db, 'products', p.id), { sectionId: '', sectionName: '', updatedAt: Date.now() }, { merge: true }));
        if (!was && now) ops.push((b) => b.set(doc(db, 'products', p.id), { sectionId: assign.id, sectionName: assign.name, updatedAt: Date.now() }, { merge: true }));
      }
      await commitAll(ops);
      logActivity(actor, 'assigned products to section', assign.name);
      toast.success(`${ops.length} product${ops.length === 1 ? '' : 's'} updated.`);
      setAssign(null);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const shownProducts = products.filter((p) => !q.trim() || p.name.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">Catalogue</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">Sections</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-400">
            Each section (Cagua, Mangaze, or any you add) gets its own tab, its own page and its own shelf on the home page.
            A product belongs to one section. Set it here in bulk, or per product in the product editor.
          </p>
        </div>
        <Button variant="accent" size="lg" icon={<Plus size={17} />} onClick={() => { setEditing(null); setOpen(true); }}>
          New section
        </Button>
      </header>

      {sections.length === 0 ? (
        <EmptyState
          icon={<LayoutGrid size={40} />}
          title="No sections yet"
          text="Create Cagua and Mangaze in one click, or add your own."
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="accent" onClick={() => void createDefaults()} loading={busy}>Create Cagua and Mangaze</Button>
              <Button variant="outline" onClick={() => { setEditing(null); setOpen(true); }} className="border-white/25 text-white hover:bg-white/10">New section</Button>
            </div>
          }
          className="border-white/15 text-white"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sections.map((s, i) => {
            const count = products.filter((p) => p.sectionId === s.id).length;
            return (
              <article key={s.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                <div className="relative aspect-[16/9]">
                  <img src={s.image || PLACEHOLDER_IMAGE} alt="" className="h-full w-full object-cover" onError={(e) => ((e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE)} />
                  <div className="absolute left-3 top-3 flex gap-1.5">
                    {s.enabled === false ? <Badge>hidden</Badge> : <Badge tone="green">live</Badge>}
                    {s.showOnHome !== false && <Badge tone="accent">home</Badge>}
                  </div>
                </div>
                <div className="p-5">
                  <h2 className="font-display text-lg font-bold text-white">{s.name}</h2>
                  <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-xs leading-relaxed text-ink-500">{s.description || 'No description.'}</p>
                  <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
                    {count} product{count === 1 ? '' : 's'} · /section/{s.slug}
                  </p>
                  <div className="mt-5 flex items-center gap-1">
                    <button onClick={() => void move(s, -1)} disabled={i === 0} className="rounded-lg p-2 text-ink-400 transition hover:bg-white/10 hover:text-white disabled:opacity-30" aria-label="Move up"><ArrowUp size={15} /></button>
                    <button onClick={() => void move(s, 1)} disabled={i === sections.length - 1} className="rounded-lg p-2 text-ink-400 transition hover:bg-white/10 hover:text-white disabled:opacity-30" aria-label="Move down"><ArrowDown size={15} /></button>
                    <div className="ml-auto flex gap-1">
                      <button onClick={() => setAssign(s)} className="rounded-lg p-2 text-ink-400 transition hover:bg-white/10 hover:text-white" aria-label="Manage products" title="Manage products"><Package size={15} /></button>
                      <button onClick={() => { setEditing(s); setOpen(true); }} className="rounded-lg p-2 text-ink-400 transition hover:bg-white/10 hover:text-white" aria-label="Edit"><Pencil size={15} /></button>
                      <button onClick={() => setConfirm(s)} className="rounded-lg p-2 text-ink-400 transition hover:bg-red-500/20 hover:text-red-400" aria-label="Delete"><Trash2 size={15} /></button>
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
        title={editing ? 'Edit section' : 'New section'}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setOpen(false); setEditing(null); }} disabled={busy}>Cancel</Button>
            <Button onClick={() => void save()} loading={busy}>Save</Button>
          </div>
        }
      >
        <div className="space-y-5">
          <Field label="Name" required>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Cagua" autoFocus />
          </Field>
          <Field label="Description" hint="Shown at the top of the section page and on the home shelf.">
            <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </Field>
          <ImageInput
            value={form.image ? [form.image] : []}
            onChange={(urls) => setForm((f) => ({ ...f, image: urls[0] ?? '' }))}
            max={1}
            compact
            folder="sections"
            label="Cover image"
            hint="A wide photo. Used as the section page banner."
          />
          <div className="space-y-4 rounded-xl border border-ink-200 p-5">
            <Toggle checked={form.enabled} onChange={(v) => setForm((f) => ({ ...f, enabled: v }))} label="Visible on the shop" hint="Off hides the tab, the page and the shelf. Products stay assigned." />
            <Toggle checked={form.showOnHome} onChange={(v) => setForm((f) => ({ ...f, showOnHome: v }))} label="Show a shelf on the home page" />
          </div>
        </div>
      </Modal>

      <Modal
        open={!!assign}
        onClose={() => setAssign(null)}
        size="lg"
        title={assign ? 'Products in ' + assign.name : ''}
        subtitle="Tick the products that belong here. A product moves out of its previous section."
        footer={
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] text-ink-500">{picked.size} selected</span>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setAssign(null)} disabled={busy}>Cancel</Button>
              <Button onClick={() => void saveAssign()} loading={busy}>Save</Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products..." />
          <ul className="max-h-[50vh] divide-y divide-ink-200 overflow-y-auto rounded-xl border border-ink-200">
            {shownProducts.map((p) => (
              <li key={p.id}>
                <label className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-ink-50">
                  <input
                    type="checkbox"
                    checked={picked.has(p.id)}
                    onChange={() => setPicked((s) => { const n = new Set(s); if (n.has(p.id)) n.delete(p.id); else n.add(p.id); return n; })}
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                  <img src={p.images?.[0] || PLACEHOLDER_IMAGE} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{p.name}</span>
                  {p.sectionId && assign && p.sectionId !== assign.id && (
                    <Badge>{nameOf.get(p.sectionId) || p.sectionName}</Badge>
                  )}
                </label>
              </li>
            ))}
            {shownProducts.length === 0 && <li className="px-4 py-6 text-center text-xs text-ink-500">No products.</li>}
          </ul>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        title="Delete this section?"
        message={`"${confirm?.name ?? ''}" will be removed. Its products stay in the shop but lose this section.`}
        confirmLabel="Delete"
        destructive
        busy={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={() => void doDelete()}
      />
    </div>
  );
};

export default AdminSections;