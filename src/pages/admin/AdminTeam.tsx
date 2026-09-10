// FILE: src/pages/admin/AdminTeam.tsx
import React, { useState } from 'react';
import { deleteDoc, doc, setDoc } from 'firebase/firestore';
import { Crown, Plus, ShieldCheck, ShieldX, Trash2, UserCog } from 'lucide-react';
import { db, OWNER_EMAIL } from '../../lib/firebase';
import { useAdminData } from '../../hooks/useAdminData';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { logActivity } from '../../lib/activity';
import { Badge, Button, ConfirmDialog, EmptyState, Field, Input, Modal, Select } from '../../components/ui';
import type { AdminRole, AdminUser } from '../../lib/types';
import { cn, errorMessage, formatDate, timeAgo } from '../../lib/utils';

const ROLE_COPY: Record<AdminRole, string> = {
  owner: 'Full control, including adding and removing other administrators.',
  admin: 'Can change everything in the shop, but cannot manage the team.',
  seller: 'Sells on the shop. Sees and edits only their own products, promotions and orders — nothing belonging to another seller.',
};

const AdminTeam: React.FC = () => {
  const { admins, activity } = useAdminData();
  const { isOwner, admin: me } = useAuth();
  const { products, money } = useStore();
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AdminRole>('seller');
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<AdminUser | null>(null);

  const invite = async () => {
    const clean = email.trim().toLowerCase();
    if (!clean.includes('@')) return toast.error('Enter a valid e-mail address.');
    if (admins.some((a) => a.id === clean)) return toast.error('That account is already an administrator.');

    setBusy(true);
    try {
      await setDoc(doc(db, 'admins', clean), {
        email: clean,
        name: '',
        photoURL: '',
        role,
        disabled: false,
        addedBy: me?.email ?? 'owner',
        addedAt: Date.now(),
        lastLogin: 0,
        shopName: '',
        phone: '',
        about: '',
        logoUrl: '',
        profileComplete: false,
      });
      logActivity(me?.email ?? 'owner', 'granted admin access', clean);
      toast.success(`${clean} can now sign in with Google.`);
      setEmail('');
      setOpen(false);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const changeRole = async (a: AdminUser, next: AdminRole) => {
    try {
      await setDoc(doc(db, 'admins', a.id), { role: next }, { merge: true });
      logActivity(me?.email ?? 'owner', `changed role to ${next}`, a.email);
      toast.success(`${a.email} is now ${next}.`);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const toggleDisabled = async (a: AdminUser) => {
    try {
      await setDoc(doc(db, 'admins', a.id), { disabled: !a.disabled }, { merge: true });
      logActivity(me?.email ?? 'owner', a.disabled ? 'restored admin' : 'suspended admin', a.email);
      toast.success(a.disabled ? 'Access restored.' : 'Access suspended.');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const doRemove = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      await deleteDoc(doc(db, 'admins', confirm.id));
      logActivity(me?.email ?? 'owner', 'removed admin access', confirm.email);
      toast.success('Access removed.');
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
          <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">Sellers & access</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-400">
            Anyone listed here signs in with their Google account — no passwords. A <strong>seller</strong>{' '}
            sees only their own products, promotions and orders. An <strong>admin</strong> or{' '}
            <strong>owner</strong> sees everything.
          </p>
        </div>
        {isOwner && (
          <Button variant="accent" size="lg" icon={<Plus size={17} />} onClick={() => setOpen(true)}>
            Add an administrator
          </Button>
        )}
      </header>

      {!isOwner && (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          Only an owner can add or remove administrators. Ask{' '}
          <span className="font-mono">{OWNER_EMAIL}</span> if you need someone added.
        </p>
      )}

      {admins.length === 0 ? (
        <EmptyState
          icon={<UserCog size={40} />}
          title="Just you so far"
          text="Invite a colleague by e-mail and they can sign in with Google straight away."
          className="border-white/15 text-white"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {admins.map((a) => {
            const isBootstrapOwner = a.id === OWNER_EMAIL;
            return (
              <article
                key={a.id}
                className={cn(
                  'rounded-2xl border p-6',
                  a.disabled ? 'border-white/5 bg-white/[0.01] opacity-60' : 'border-white/10 bg-white/[0.03]',
                )}
              >
                <div className="flex items-start gap-4">
                  {a.photoURL ? (
                    <img src={a.photoURL} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-black text-ink-950">
                      {(a.name || a.email).slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-white">{a.name || 'Not signed in yet'}</p>
                    <p className="truncate text-xs text-ink-500">{a.email}</p>
                  </div>
                  {isBootstrapOwner && <Crown size={16} className="shrink-0 text-accent" />}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge tone={a.role === 'owner' ? 'accent' : a.role === 'admin' ? 'blue' : 'neutral'}>
                    {a.role}
                  </Badge>
                  {a.disabled && <Badge tone="red">suspended</Badge>}
                  {!a.lastLogin && <Badge tone="amber">pending first login</Badge>}
                </div>

                {a.role === 'seller' && (
                  <dl className="mt-4 space-y-1.5 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-[11px] text-ink-500">
                    <div className="flex justify-between">
                      <dt>Shop</dt>
                      <dd className="text-ink-200">{a.shopName || <span className="text-amber-400">not set up yet</span>}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Phone</dt>
                      <dd className="text-ink-200">{a.phone || '—'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Listings</dt>
                      <dd className="text-ink-200">
                        {products.filter(
                          (p) => (p.sellerId ?? '').toLowerCase() === a.id.toLowerCase(),
                        ).length}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Stock value</dt>
                      <dd className="text-ink-200">
                        {money(
                          products
                            .filter((p) => (p.sellerId ?? '').toLowerCase() === a.id.toLowerCase())
                            .reduce((n, p) => n + (p.trackStock ? p.stock * p.price : 0), 0),
                        )}
                      </dd>
                    </div>
                  </dl>
                )}

                <dl className="mt-4 space-y-1.5 text-[11px] text-ink-500">
                  <div className="flex justify-between">
                    <dt>Added</dt>
                    <dd>{a.addedAt ? formatDate(a.addedAt) : '—'}{a.addedBy ? ` by ${a.addedBy}` : ''}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Last seen</dt>
                    <dd>{a.lastLogin ? timeAgo(a.lastLogin) : 'never'}</dd>
                  </div>
                </dl>

                {isOwner && !isBootstrapOwner && (
                  <div className="mt-5 space-y-3 border-t border-white/10 pt-4">
                    <Select value={a.role} onChange={(e) => void changeRole(a, e.target.value as AdminRole)}>
                      <option value="seller">Seller</option>
                      <option value="admin">Admin</option>
                      <option value="owner">Owner</option>
                    </Select>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="subtle"
                        icon={a.disabled ? <ShieldCheck size={14} /> : <ShieldX size={14} />}
                        onClick={() => void toggleDisabled(a)}
                      >
                        {a.disabled ? 'Restore' : 'Suspend'}
                      </Button>
                      <button
                        onClick={() => setConfirm(a)}
                        className="ml-auto rounded-lg p-2 text-ink-400 transition hover:bg-red-500/20 hover:text-red-400"
                        aria-label="Remove access"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                )}

                {isBootstrapOwner && (
                  <p className="mt-5 border-t border-white/10 pt-4 text-[11px] leading-relaxed text-ink-600">
                    The founding owner account. It cannot be suspended or removed, so the shop can never be
                    locked out.
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Audit trail */}
      {activity.length > 0 && (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <h2 className="font-display text-xl font-bold text-white">Recent activity</h2>
          <p className="mt-2 text-sm text-ink-400">Who changed what, most recent first.</p>
          <ul className="mt-6 space-y-3">
            {activity.slice(0, 25).map((e) => (
              <li key={e.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 border-b border-white/5 pb-3 text-sm">
                <span className="font-semibold text-white">{e.actor}</span>
                <span className="text-ink-400">{e.action}</span>
                <span className="text-accent">{e.target}</span>
                <span className="ml-auto text-[11px] text-ink-600">{timeAgo(e.at)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add a seller"
        subtitle="They sign in with Google — there is no password to share."
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={() => void invite()} loading={busy}>Grant access</Button>
          </div>
        }
      >
        <div className="space-y-5">
          <Field
            label="Google account e-mail"
            required
            hint="It must be the address they use to sign in with Google."
          >
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), void invite())}
              placeholder="colleague@gmail.com"
              autoFocus
            />
          </Field>

          <Field label="Role">
            <Select value={role} onChange={(e) => setRole(e.target.value as AdminRole)}>
              <option value="seller">Seller</option>
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
            </Select>
          </Field>

          <p className="rounded-xl bg-ink-100 p-4 text-xs leading-relaxed text-ink-600">
            <strong>{role}</strong> — {ROLE_COPY[role]}
          </p>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        title="Remove access?"
        message={`${confirm?.email ?? ''} will no longer be able to open the dashboard. You can add them again at any time.`}
        confirmLabel="Remove"
        destructive
        busy={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={() => void doRemove()}
      />
    </div>
  );
};

export default AdminTeam;
