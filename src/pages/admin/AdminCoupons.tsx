// FILE: src/pages/admin/AdminCoupons.tsx
import React, { useEffect, useState } from 'react';
import { deleteDoc, doc, setDoc } from 'firebase/firestore';
import { BadgePercent, Plus, Trash2 } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useAdminData } from '../../hooks/useAdminData';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { logActivity } from '../../lib/activity';
import { Badge, Button, ConfirmDialog, EmptyState, Field, Input, Modal, Select, Toggle } from '../../components/ui';
import type { Coupon } from '../../lib/types';
import { errorMessage, formatDate } from '../../lib/utils';

const BLANK = {
  code: '', type: 'percent' as Coupon['type'], value: 10,
  minSubtotal: 0, usageLimit: 0, active: true, expires: '',
};

const AdminCoupons: React.FC = () => {
  const { coupons, orders } = useAdminData();
  const { money } = useStore();
  const { admin } = useAuth();
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState(BLANK);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<Coupon | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        code: editing.code,
        type: editing.type,
        value: editing.value,
        minSubtotal: editing.minSubtotal,
        usageLimit: editing.usageLimit,
        active: editing.active,
        expires: editing.expiresAt ? new Date(editing.expiresAt).toISOString().slice(0, 10) : '',
      });
    } else {
      setForm(BLANK);
    }
  }, [open, editing]);

  const usageOf = (code: string) =>
    orders.filter((o) => o.couponCode?.toUpperCase() === code.toUpperCase()).length;

  const save = async () => {
    const code = form.code.trim().toUpperCase();
    if (!code) return toast.error('A discount needs a code.');
    if (form.value <= 0) return toast.error('The discount value must be above zero.');
    if (form.type === 'percent' && form.value > 100) return toast.error('A percentage cannot exceed 100.');

    setBusy(true);
    try {
      await setDoc(
        doc(db, 'coupons', code),
        {
          code,
          type: form.type,
          value: Number(form.value),
          minSubtotal: Number(form.minSubtotal) || 0,
          usageLimit: Number(form.usageLimit) || 0,
          used: editing?.used ?? 0,
          active: form.active,
          expiresAt: form.expires ? new Date(`${form.expires}T23:59:59`).getTime() : 0,
          createdAt: editing?.createdAt ?? Date.now(),
        },
        { merge: true },
      );
      logActivity(admin?.email ?? 'admin', editing ? 'updated discount' : 'created discount', code);
      toast.success(`Code ${code} saved.`);
      setOpen(false);
      setEditing(null);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      await deleteDoc(doc(db, 'coupons', confirm.id));
      logActivity(admin?.email ?? 'admin', 'deleted discount', confirm.code);
      toast.success('Discount deleted.');
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
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">Selling</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">Discount codes</h1>
          <p className="mt-2 text-sm text-ink-400">Shoppers enter these at checkout.</p>
        </div>
        <Button variant="accent" size="lg" icon={<Plus size={17} />} onClick={() => { setEditing(null); setOpen(true); }}>
          New code
        </Button>
      </header>

      {coupons.length === 0 ? (
        <EmptyState
          icon={<BadgePercent size={40} />}
          title="No discount codes"
          text="Create a code to run a promotion or reward a repeat customer."
          action={
            <Button variant="accent" icon={<Plus size={16} />} onClick={() => { setEditing(null); setOpen(true); }}>
              New code
            </Button>
          }
          className="border-white/15 text-white"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {coupons.map((c) => {
            const expired = c.expiresAt > 0 && c.expiresAt < Date.now();
            const used = usageOf(c.code);
            return (
              <article key={c.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xl font-black tracking-wider text-white">{c.code}</p>
                    <p className="mt-1 text-sm text-accent">
                      {c.type === 'percent' ? `${c.value}% off` : `${money(c.value)} off`}
                    </p>
                  </div>
                  <Badge tone={expired ? 'red' : c.active ? 'green' : 'neutral'}>
                    {expired ? 'expired' : c.active ? 'active' : 'paused'}
                  </Badge>
                </div>

                <dl className="mt-5 space-y-2 border-t border-white/10 pt-4 text-xs text-ink-400">
                  <div className="flex justify-between">
                    <dt>Minimum spend</dt>
                    <dd className="text-ink-200">{c.minSubtotal ? money(c.minSubtotal) : 'none'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Redeemed</dt>
                    <dd className="text-ink-200">{used}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Expires</dt>
                    <dd className="text-ink-200">{c.expiresAt ? formatDate(c.expiresAt) : 'never'}</dd>
                  </div>
                </dl>

                <div className="mt-5 flex gap-2">
                  <Button size="sm" variant="subtle" onClick={() => { setEditing(c); setOpen(true); }}>Edit</Button>
                  <Button
                    size="sm"
                    variant="subtle"
                    onClick={() =>
                      void setDoc(doc(db, 'coupons', c.id), { active: !c.active }, { merge: true }).catch((err) =>
                        toast.error(errorMessage(err)),
                      )
                    }
                  >
                    {c.active ? 'Pause' : 'Activate'}
                  </Button>
                  <button
                    onClick={() => setConfirm(c)}
                    className="ml-auto rounded-lg p-2 text-ink-400 transition hover:bg-red-500/20 hover:text-red-400"
                    aria-label="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => { setOpen(false); setEditing(null); }}
        title={editing ? 'Edit discount' : 'New discount'}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setOpen(false); setEditing(null); }} disabled={busy}>Cancel</Button>
            <Button onClick={() => void save()} loading={busy}>Save</Button>
          </div>
        }
      >
        <div className="space-y-5">
          <Field label="Code" required hint="Shoppers type this at checkout — it is not case sensitive.">
            <Input
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              placeholder="WELCOME10"
              disabled={!!editing}
              className="font-mono tracking-wider"
              autoFocus
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Type">
              <Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as Coupon['type'] }))}>
                <option value="percent">Percentage off</option>
                <option value="fixed">Fixed amount off</option>
              </Select>
            </Field>
            <Field label={form.type === 'percent' ? 'Percent' : 'Amount'} required>
              <Input
                type="number"
                min={0}
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) }))}
              />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Minimum spend" hint="0 means no minimum.">
              <Input
                type="number"
                min={0}
                value={form.minSubtotal}
                onChange={(e) => setForm((f) => ({ ...f, minSubtotal: Number(e.target.value) }))}
              />
            </Field>
            <Field label="Usage limit" hint="0 means unlimited.">
              <Input
                type="number"
                min={0}
                value={form.usageLimit}
                onChange={(e) => setForm((f) => ({ ...f, usageLimit: Number(e.target.value) }))}
              />
            </Field>
          </div>

          <Field label="Expires on" hint="Leave empty for no expiry.">
            <Input type="date" value={form.expires} onChange={(e) => setForm((f) => ({ ...f, expires: e.target.value }))} />
          </Field>

          <div className="rounded-xl border border-ink-200 p-5">
            <Toggle
              checked={form.active}
              onChange={(v) => setForm((f) => ({ ...f, active: v }))}
              label="Active"
              hint="Paused codes are rejected at checkout."
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        title="Delete this code?"
        message={`“${confirm?.code ?? ''}” will stop working immediately.`}
        confirmLabel="Delete"
        destructive
        busy={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={() => void doDelete()}
      />
    </div>
  );
};

export default AdminCoupons;
