// FILE: src/pages/admin/AdminBlog.tsx
import React, { useEffect, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { BookOpen, ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { logActivity } from '../../lib/activity';
import { usePosts, type Post } from '../../lib/posts';
import ImageInput from '../../components/ImageInput';
import { Badge, Button, ConfirmDialog, EmptyState, Field, Input, Modal, Textarea, Toggle } from '../../components/ui';
import { errorMessage, formatDate, PLACEHOLDER_IMAGE, slugify } from '../../lib/utils';

type Form = Omit<Post, 'id' | 'createdAt' | 'updatedAt'>;
const BLANK: Form = { title: '', slug: '', excerpt: '', body: '', cover: '', published: false };

const AdminBlog: React.FC = () => {
  const { posts } = usePosts(true);
  const { admin } = useAuth();
  const toast = useToast();
  const actor = admin?.email ?? 'admin';

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Post | null>(null);
  const [form, setForm] = useState<Form>(BLANK);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<Post | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      const { id, createdAt, updatedAt, ...rest } = editing;
      setForm({ ...BLANK, ...rest });
    } else {
      setForm(BLANK);
    }
  }, [open, editing]);

  const close = () => { setOpen(false); setEditing(null); };

  const save = async () => {
    const title = form.title.trim();
    const body = form.body.trim();
    if (!title) return toast.error('An article needs a title.');
    if (!body) return toast.error('An article needs some text.');
    const slug = slugify(form.slug || title);
    if (!slug) return toast.error('Could not build a web address from that title.');
    if (posts.some((p) => p.slug === slug && p.id !== editing?.id)) {
      return toast.error('Another article already uses that web address. Change the slug.');
    }
    setBusy(true);
    const now = Date.now();
    const payload = {
      title, slug, body,
      excerpt: form.excerpt.trim(),
      cover: form.cover,
      published: form.published,
      createdAt: editing?.createdAt || now,
      updatedAt: now,
    };
    try {
      if (editing) {
        await setDoc(doc(db, 'posts', editing.id), payload, { merge: true });
        logActivity(actor, 'updated article', title);
        toast.success('Article saved.');
      } else {
        await addDoc(collection(db, 'posts'), payload);
        logActivity(actor, 'created article', title);
        toast.success('Article created.');
      }
      close();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const togglePublish = async (p: Post) => {
    try {
      await setDoc(doc(db, 'posts', p.id), { published: !p.published, updatedAt: Date.now() }, { merge: true });
      logActivity(actor, p.published ? 'unpublished article' : 'published article', p.title);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const doDelete = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      await deleteDoc(doc(db, 'posts', confirm.id));
      logActivity(actor, 'deleted article', confirm.title);
      toast.success('Article deleted.');
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
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">Storefront</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">Blog</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-400">
            Articles live at /blog and are linked only from the footer, so shoppers see products first.
            Drafts are private until you publish them.
          </p>
        </div>
        <Button variant="accent" size="lg" icon={<Plus size={17} />} onClick={() => { setEditing(null); setOpen(true); }}>
          New article
        </Button>
      </header>

      {posts.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={40} />}
          title="No articles yet"
          text="Write your first article. It stays a draft until you switch it to published."
          className="border-white/15 text-white"
        />
      ) : (
        <ul className="divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
          {posts.map((p) => (
            <li key={p.id} className="flex items-center gap-4 p-4">
              <img
                src={p.cover || PLACEHOLDER_IMAGE}
                alt=""
                className="h-14 w-20 shrink-0 rounded-lg object-cover"
                onError={(e) => ((e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE)}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-white">{p.title}</p>
                <p className="mt-0.5 truncate text-xs text-ink-500">/blog/{p.slug} &middot; {formatDate(p.createdAt)}</p>
              </div>
              {p.published ? <Badge tone="green">published</Badge> : <Badge>draft</Badge>}
              <div className="flex shrink-0 gap-1">
                <button onClick={() => void togglePublish(p)} className="rounded-lg px-2.5 py-2 text-[11px] font-bold uppercase tracking-wider text-ink-400 transition hover:bg-white/10 hover:text-white">
                  {p.published ? 'Unpublish' : 'Publish'}
                </button>
                {p.published && (
                  <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-ink-400 transition hover:bg-white/10 hover:text-white" aria-label="View"><ExternalLink size={15} /></a>
                )}
                <button onClick={() => { setEditing(p); setOpen(true); }} className="rounded-lg p-2 text-ink-400 transition hover:bg-white/10 hover:text-white" aria-label="Edit"><Pencil size={15} /></button>
                <button onClick={() => setConfirm(p)} className="rounded-lg p-2 text-ink-400 transition hover:bg-red-500/20 hover:text-red-400" aria-label="Delete"><Trash2 size={15} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={open}
        onClose={close}
        size="xl"
        title={editing ? 'Edit article' : 'New article'}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={close} disabled={busy}>Cancel</Button>
            <Button onClick={() => void save()} loading={busy}>Save</Button>
          </div>
        }
      >
        <div className="space-y-5">
          <Field label="Title" required>
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="How to choose a good phone case" autoFocus />
          </Field>
          <Field label="Web address (slug)" hint="Leave empty to build it from the title. Becomes /blog/your-slug.">
            <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="how-to-choose-a-phone-case" />
          </Field>
          <Field label="Short summary" hint="One or two sentences shown on the blog list and in search results.">
            <Textarea value={form.excerpt} onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))} className="min-h-24" />
          </Field>
          <ImageInput
            value={form.cover ? [form.cover] : []}
            onChange={(urls) => setForm((f) => ({ ...f, cover: urls[0] ?? '' }))}
            max={1}
            compact
            folder="blog"
            label="Cover image"
            hint="A wide photo, shown on the list and at the top of the article."
          />
          <Field
            label="Article text"
            required
            hint="Leave a blank line between paragraphs. Start a line with ## for a heading, ### for a sub-heading, and - for bullet points."
          >
            <Textarea value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} className="min-h-80 font-mono text-[13px]" />
          </Field>
          <div className="rounded-xl border border-ink-200 p-5">
            <Toggle
              checked={form.published}
              onChange={(v) => setForm((f) => ({ ...f, published: v }))}
              label="Published"
              hint="Off keeps it as a private draft."
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        title="Delete this article?"
        message={`"${confirm?.title ?? ''}" will be removed for good.`}
        confirmLabel="Delete"
        destructive
        busy={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={() => void doDelete()}
      />
    </div>
  );
};

export default AdminBlog;