// FILE: src/pages/admin/AdminMessages.tsx
import React, { useState } from 'react';
import { deleteDoc, doc, setDoc } from 'firebase/firestore';
import { Mail, MailOpen, Reply, Trash2 } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useAdminData } from '../../hooks/useAdminData';
import { useToast } from '../../context/ToastContext';
import { Badge, Button, ConfirmDialog, EmptyState } from '../../components/ui';
import type { Message } from '../../lib/types';
import { cn, errorMessage, formatDate } from '../../lib/utils';

const AdminMessages: React.FC = () => {
  const { messages } = useAdminData();
  const toast = useToast();
  const [active, setActive] = useState<Message | null>(null);
  const [confirm, setConfirm] = useState<Message | null>(null);
  const [busy, setBusy] = useState(false);

  const openMessage = (m: Message) => {
    setActive(m);
    if (!m.read) void setDoc(doc(db, 'messages', m.id), { read: true }, { merge: true }).catch(() => undefined);
  };

  const doDelete = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      await deleteDoc(doc(db, 'messages', confirm.id));
      if (active?.id === confirm.id) setActive(null);
      setConfirm(null);
      toast.success('Message deleted.');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const unread = messages.filter((m) => !m.read).length;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">Selling</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">Inbox</h1>
        <p className="mt-2 text-sm text-ink-400">
          {messages.length} message{messages.length === 1 ? '' : 's'}
          {unread > 0 && ` · ${unread} unread`}
        </p>
      </header>

      {messages.length === 0 ? (
        <EmptyState
          icon={<Mail size={40} />}
          title="Inbox zero"
          text="Messages sent from the contact page land here."
          className="border-white/15 text-white"
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
          <ul className="thin-scrollbar max-h-[36rem] space-y-2 overflow-y-auto pr-1">
            {messages.map((m) => (
              <li key={m.id}>
                <button
                  onClick={() => openMessage(m)}
                  className={cn(
                    'w-full rounded-xl border p-4 text-left transition',
                    active?.id === m.id
                      ? 'border-accent bg-accent/10'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/25',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className={cn('truncate text-sm', m.read ? 'text-ink-300' : 'font-bold text-white')}>
                      {m.name}
                    </p>
                    {!m.read && <Badge tone="accent">New</Badge>}
                  </div>
                  <p className="mt-1 truncate text-xs text-ink-500">{m.subject || m.body.slice(0, 60)}</p>
                  <p className="mt-2 text-[10px] uppercase tracking-wider text-ink-600">{formatDate(m.createdAt, true)}</p>
                </button>
              </li>
            ))}
          </ul>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            {active ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
                  <div className="min-w-0">
                    <h2 className="font-display text-2xl font-bold text-white">{active.subject || 'No subject'}</h2>
                    <p className="mt-2 text-sm text-ink-400">
                      {active.name} ·{' '}
                      <a href={`mailto:${active.email}`} className="hover:text-accent">{active.email}</a>
                      {active.phone && <> · <a href={`tel:${active.phone}`} className="hover:text-accent">{active.phone}</a></>}
                    </p>
                    <p className="mt-1 text-[11px] uppercase tracking-wider text-ink-600">
                      {formatDate(active.createdAt, true)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <a href={`mailto:${active.email}?subject=${encodeURIComponent(`Re: ${active.subject || 'Your message'}`)}`}>
                      <Button size="sm" variant="accent" icon={<Reply size={14} />}>Reply</Button>
                    </a>
                    <button
                      onClick={() => setConfirm(active)}
                      className="rounded-lg p-2 text-ink-400 transition hover:bg-red-500/20 hover:text-red-400"
                      aria-label="Delete message"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <p className="whitespace-pre-line pt-6 text-[15px] leading-relaxed text-ink-300">{active.body}</p>
              </>
            ) : (
              <div className="flex h-full min-h-64 flex-col items-center justify-center text-center">
                <MailOpen size={38} className="mb-4 text-ink-700" />
                <p className="text-sm text-ink-500">Pick a message to read it.</p>
              </div>
            )}
          </section>
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        title="Delete this message?"
        message="It will be removed from the inbox permanently."
        confirmLabel="Delete"
        destructive
        busy={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={() => void doDelete()}
      />
    </div>
  );
};

export default AdminMessages;
