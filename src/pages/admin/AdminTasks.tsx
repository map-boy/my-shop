// FILE: src/pages/admin/AdminTasks.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc, writeBatch } from 'firebase/firestore';
import { Check, Pencil, Pin, Plus, Trash2 } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { useAdminData } from '../../hooks/useAdminData';
import { cn } from '../../lib/utils';
import { PHASES, SEED, isDone, toTask, today } from '../../lib/tasks';
import type { TaskDoc, TaskPhase, TaskRepeat } from '../../lib/tasks';

interface Form {
  title: string;
  hint: string;
  group: string;
  phase: TaskPhase;
  repeat: TaskRepeat;
  to: string;
}

const emptyForm: Form = { title: '', hint: '', group: '', phase: 'week1', repeat: 'once', to: '' };

const inp =
  'w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-ink-500 focus:border-accent';

const inToday = (t: TaskDoc) =>
  t.repeat === 'daily' || (t.pinned && (!t.doneOn || t.doneOn === today()));

const AdminTasks: React.FC = () => {
  const { managesEverything } = useAuth();
  const { orders, messages } = useAdminData();

  const [tasks, setTasks] = useState<TaskDoc[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState<'today' | 'plan' | 'all'>('today');
  const [editing, setEditing] = useState<string | null>(null); // 'new' or a task id
  const [form, setForm] = useState<Form>(emptyForm);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!managesEverything) return undefined;
    return onSnapshot(
      collection(db, 'tasks'),
      (snap) => {
        setTasks(snap.docs.map((d) => toTask(d.id, d.data())));
        setLoaded(true);
      },
      (e) => {
        setError(e.message);
        setLoaded(true);
      },
    );
  }, [managesEverything]);

  const sorted = useMemo(() => [...tasks].sort((a, b) => a.order - b.order), [tasks]);
  const groups = useMemo(() => Array.from(new Set(sorted.map((t) => t.group))), [sorted]);

  const run = async (fn: () => Promise<unknown>) => {
    setError('');
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
  };

  const toggle = (t: TaskDoc) =>
    run(() => updateDoc(doc(db, 'tasks', t.id), { doneOn: isDone(t) ? null : today(), updatedAt: Date.now() }));

  const pin = (t: TaskDoc) =>
    run(() => updateDoc(doc(db, 'tasks', t.id), { pinned: !t.pinned, updatedAt: Date.now() }));

  const remove = (t: TaskDoc) => {
    if (!window.confirm('Delete this task?')) return Promise.resolve();
    return run(() => deleteDoc(doc(db, 'tasks', t.id)));
  };

  const startNew = () => {
    setForm(emptyForm);
    setEditing('new');
  };

  const startEdit = (t: TaskDoc) => {
    setForm({ title: t.title, hint: t.hint, group: t.group, phase: t.phase, repeat: t.repeat, to: t.to });
    setEditing(t.id);
  };

  const save = async () => {
    if (!form.title.trim()) {
      setError('Give the task a title.');
      return;
    }
    setBusy(true);
    const data = {
      title: form.title.trim(),
      hint: form.hint.trim(),
      group: form.group.trim() || 'General',
      phase: form.phase,
      repeat: form.repeat,
      to: form.to.trim(),
      updatedAt: Date.now(),
    };
    await run(async () => {
      if (editing === 'new') {
        const next = sorted.reduce((m, t) => Math.max(m, t.order), 0) + 1;
        await addDoc(collection(db, 'tasks'), { ...data, pinned: false, doneOn: null, order: next, createdAt: Date.now() });
      } else if (editing) {
        await updateDoc(doc(db, 'tasks', editing), data);
      }
      setEditing(null);
    });
    setBusy(false);
  };

  const seed = async () => {
    setBusy(true);
    await run(async () => {
      const batch = writeBatch(db);
      SEED.forEach((s, i) => {
        batch.set(doc(collection(db, 'tasks')), {
          ...s,
          doneOn: null,
          order: i + 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      });
      await batch.commit();
    });
    setBusy(false);
  };

  if (!managesEverything) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-3xl font-black text-white">Welcome</h1>
        <p className="mt-2 text-sm text-ink-400">The shop task list is managed by the owner.</p>
        <Link to="/admin/products" className="mt-4 inline-block text-sm font-bold text-accent hover:underline">
          Go to my products
        </Link>
      </div>
    );
  }

  const row = (t: TaskDoc) => {
    const done = isDone(t);
    const external = /^https?:\/\//i.test(t.to);
    return (
      <li
        key={t.id}
        className={cn(
          'flex items-start gap-4 rounded-2xl border p-4 transition',
          done ? 'border-white/5 bg-white/[0.02]' : 'border-white/10 bg-white/[0.04]',
        )}
      >
        <button
          type="button"
          onClick={() => void toggle(t)}
          aria-label={done ? 'Mark as not done' : 'Mark as done'}
          className={cn(
            'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition',
            done ? 'border-accent bg-accent text-ink-950' : 'border-ink-500 text-transparent hover:border-accent',
          )}
        >
          <Check size={14} strokeWidth={3} />
        </button>
        <div className="min-w-0 flex-1">
          <p className={cn('text-sm font-bold', done ? 'text-ink-500 line-through' : 'text-white')}>{t.title}</p>
          {!done && t.hint && <p className="mt-1 text-xs leading-relaxed text-ink-400">{t.hint}</p>}
          {!done && t.to && (
            external ? (
              <a href={t.to} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-bold text-accent hover:underline">
                Open
              </a>
            ) : (
              <Link to={t.to} className="mt-2 inline-block text-xs font-bold text-accent hover:underline">
                Open
              </Link>
            )
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {t.repeat !== 'daily' && (
            <button
              type="button"
              onClick={() => void pin(t)}
              aria-label={t.pinned ? 'Remove from Today' : 'Show in Today'}
              className={cn('rounded-lg p-2 hover:bg-white/10', t.pinned ? 'text-accent' : 'text-ink-500')}
            >
              <Pin size={15} />
            </button>
          )}
          <button type="button" onClick={() => startEdit(t)} aria-label="Edit" className="rounded-lg p-2 text-ink-500 hover:bg-white/10 hover:text-white">
            <Pencil size={15} />
          </button>
          <button type="button" onClick={() => void remove(t)} aria-label="Delete" className="rounded-lg p-2 text-ink-500 hover:bg-white/10 hover:text-red-400">
            <Trash2 size={15} />
          </button>
        </div>
      </li>
    );
  };

  const list = (items: TaskDoc[], emptyText: string) =>
    items.length === 0 ? (
      <li className="rounded-2xl border border-white/10 p-5 text-center text-sm text-ink-500">{emptyText}</li>
    ) : (
      items.map(row)
    );

  const heading = (text: string) => (
    <h2 className="mb-3 mt-10 text-[10px] font-bold uppercase tracking-[0.2em] text-ink-500">{text}</h2>
  );

  const needsPending = orders.some((o) => o.status === 'pending');
  const needsInbox = messages.some((m) => !m.read);

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-500">
        {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
      </p>
      <div className="mt-1 flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-black text-white">Tasks</h1>
        <button
          type="button"
          onClick={startNew}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-xs font-black text-ink-950"
        >
          <Plus size={15} /> Add task
        </button>
      </div>

      <div className="mt-5 flex gap-2">
        {([['today', 'Today'], ['plan', 'Plan'], ['all', 'All ideas']] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setView(id)}
            className={cn(
              'rounded-full px-4 py-1.5 text-xs font-bold transition',
              view === id ? 'bg-accent text-ink-950' : 'bg-white/5 text-ink-400 hover:text-white',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">{error}</p>}

      {editing && (
        <div className="mt-6 space-y-3 rounded-2xl border border-accent/30 bg-white/[0.04] p-4">
          <input className={inp} placeholder="Task title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <textarea className={inp} rows={2} placeholder="Short note or how-to (optional)" value={form.hint} onChange={(e) => setForm((f) => ({ ...f, hint: e.target.value }))} />
          <div className="grid gap-3 sm:grid-cols-2">
            <input className={inp} list="task-groups" placeholder="Group (e.g. Images)" value={form.group} onChange={(e) => setForm((f) => ({ ...f, group: e.target.value }))} />
            <datalist id="task-groups">{groups.map((g) => <option key={g} value={g} />)}</datalist>
            <input className={inp} placeholder="Link (optional, e.g. /admin/products)" value={form.to} onChange={(e) => setForm((f) => ({ ...f, to: e.target.value }))} />
            <select className={inp} value={form.phase} onChange={(e) => setForm((f) => ({ ...f, phase: e.target.value as TaskPhase }))}>
              {PHASES.map((p) => <option key={p.id} value={p.id} className="text-black">{p.label}</option>)}
            </select>
            <select className={inp} value={form.repeat} onChange={(e) => setForm((f) => ({ ...f, repeat: e.target.value as TaskRepeat }))}>
              <option value="once" className="text-black">Do once</option>
              <option value="daily" className="text-black">Repeat every day</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button type="button" disabled={busy} onClick={() => void save()} className="rounded-xl bg-accent px-4 py-2 text-xs font-black text-ink-950 disabled:opacity-60">
              Save
            </button>
            <button type="button" onClick={() => setEditing(null)} className="rounded-xl bg-white/5 px-4 py-2 text-xs font-bold text-ink-400 hover:text-white">
              Cancel
            </button>
          </div>
        </div>
      )}

      {loaded && sorted.length === 0 && !error && (
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center">
          <p className="text-sm font-bold text-white">No tasks yet.</p>
          <p className="mt-1 text-xs text-ink-400">
            Load the starter plan (daily routine, products, images, trusted people, events, offers). You can edit or delete any of it afterwards.
          </p>
          <button type="button" disabled={busy} onClick={() => void seed()} className="mt-4 rounded-xl bg-accent px-4 py-2 text-xs font-black text-ink-950 disabled:opacity-60">
            Add starter plan
          </button>
        </div>
      )}

      {view === 'today' && sorted.length > 0 && (
        <>
          {(needsPending || needsInbox) && (
            <>
              {heading('Needs you now')}
              <ul className="space-y-2">
                {needsPending && (
                  <li className="flex items-center justify-between rounded-2xl border border-accent/30 bg-accent/10 p-4">
                    <span className="text-sm font-bold text-white">Confirm new orders by phone or WhatsApp</span>
                    <Link to="/admin/orders" className="text-xs font-bold text-accent hover:underline">Open</Link>
                  </li>
                )}
                {needsInbox && (
                  <li className="flex items-center justify-between rounded-2xl border border-accent/30 bg-accent/10 p-4">
                    <span className="text-sm font-bold text-white">Reply to new messages in the inbox</span>
                    <Link to="/admin/messages" className="text-xs font-bold text-accent hover:underline">Open</Link>
                  </li>
                )}
              </ul>
            </>
          )}
          {heading('To do today')}
          <ul className="space-y-3">
            {list(sorted.filter((t) => inToday(t) && !isDone(t)), 'Everything is done for today. Well done.')}
          </ul>
          {sorted.some((t) => inToday(t) && isDone(t)) && (
            <>
              {heading('Done')}
              <ul className="space-y-2">{sorted.filter((t) => inToday(t) && isDone(t)).map(row)}</ul>
            </>
          )}
        </>
      )}

      {view === 'plan' &&
        PHASES.filter((p) => p.id !== 'daily').map((p) => {
          const items = sorted.filter((t) => t.repeat !== 'daily' && t.phase === p.id);
          if (items.length === 0) return null;
          return (
            <React.Fragment key={p.id}>
              {heading(p.label)}
              <ul className="space-y-2">
                {items.filter((t) => !isDone(t)).map(row)}
                {items.filter((t) => isDone(t)).map(row)}
              </ul>
            </React.Fragment>
          );
        })}

      {view === 'all' &&
        groups.map((g) => (
          <React.Fragment key={g}>
            {heading(g)}
            <ul className="space-y-2">{sorted.filter((t) => t.group === g).map(row)}</ul>
          </React.Fragment>
        ))}

      <p className="mt-10 text-xs text-ink-500">
        Tasks are saved in the database. Pin a task to show it in Today. Daily tasks reset every morning.
      </p>
    </div>
  );
};

export default AdminTasks;