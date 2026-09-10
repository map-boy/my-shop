// FILE: src/pages/admin/ShopProfile.tsx
import React, { useEffect, useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { Info, Store } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import ImageInput from '../../components/ImageInput';
import SaveBar from '../../components/SaveBar';
import { Button, Field, Input, Textarea } from '../../components/ui';
import { errorMessage } from '../../lib/utils';

/**
 * Where a seller fills in who they are. The security rules let them write only
 * their own record, and only the fields below — role and suspension are not
 * theirs to change.
 */
const ShopProfile: React.FC = () => {
  const { admin, refresh } = useAuth();
  const { settings } = useStore();
  const toast = useToast();

  const [form, setForm] = useState({ name: '', shopName: '', phone: '', about: '', logoUrl: '' });
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!admin || dirty) return;
    setForm({
      name: admin.name ?? '',
      shopName: admin.shopName ?? '',
      phone: admin.phone ?? '',
      about: admin.about ?? '',
      logoUrl: admin.logoUrl ?? '',
    });
  }, [admin, dirty]);

  const set = (key: keyof typeof form, value: string) => {
    setDirty(true);
    setForm((f) => ({ ...f, [key]: value }));
  };

  const save = async () => {
    if (!admin) return;
    if (!form.name.trim()) return toast.error('Please enter your name.');
    if (!form.shopName.trim()) return toast.error('Please enter the name of your shop.');

    setBusy(true);
    try {
      await setDoc(
        doc(db, 'admins', admin.id),
        {
          name: form.name.trim(),
          shopName: form.shopName.trim(),
          phone: form.phone.trim(),
          about: form.about.trim(),
          logoUrl: form.logoUrl,
          profileComplete: true,
        },
        { merge: true },
      );
      await refresh();
      setDirty(false);
      toast.success('Your shop details are saved.');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">Your account</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">My shop</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-400">
          Your shop name appears on every product you list, so shoppers know who they are buying from.
        </p>
      </header>

      {!admin?.profileComplete && (
        <div className="rounded-xl border border-accent/40 bg-accent/10 p-4 text-sm text-white">
          Fill this in before you add your first product — your listings will carry this name.
        </div>
      )}

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <h2 className="flex items-center gap-2.5 font-display text-xl font-bold text-white">
          <Store size={19} className="text-accent" /> Your details
        </h2>

        <div className="mt-7 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Your name" required>
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Jean Uwase" />
            </Field>
            <Field label="Shop name" required hint="Shown to shoppers on your products.">
              <Input value={form.shopName} onChange={(e) => set('shopName', e.target.value)} placeholder="Uwase Fashion" />
            </Field>
          </div>

          <Field label="Phone" hint="How the shop owner reaches you about your orders.">
            <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+250 7…" />
          </Field>

          <Field label="About your shop" hint="A sentence or two about what you sell.">
            <Textarea value={form.about} onChange={(e) => set('about', e.target.value)} />
          </Field>

          <ImageInput
            value={form.logoUrl ? [form.logoUrl] : []}
            onChange={(urls) => { setDirty(true); setForm((f) => ({ ...f, logoUrl: urls[0] ?? '' })); }}
            max={1}
            compact
            folder="sellers"
            label="Shop logo"
          />

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
            <p className="label">Sign-in account</p>
            <p className="font-mono text-sm text-white">{admin?.email}</p>
            <p className="mt-2 text-[11px] text-ink-500">
              This is fixed — it is the Google account the shop owner gave access to.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <h2 className="flex items-center gap-2.5 font-display text-xl font-bold text-white">
          <Info size={19} className="text-accent" /> How you get paid
        </h2>
        <div className="mt-5 space-y-3 text-sm leading-relaxed text-ink-400">
          <p>
            Shoppers pay the shop directly — MTN Mobile Money on the shop's own pay code, or cash on
            delivery. Nothing is charged to your own MoMo number, and the payment details are not
            editable from a seller account.
          </p>
          <p className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-ink-300">
            {settings.payments.instructions}
          </p>
          <p>
            The shop owner sees every order, confirms it, and settles your share with you. You can see
            the orders containing your items under <strong className="text-white">Orders</strong>.
          </p>
        </div>
      </section>

      <SaveBar dirty={dirty} busy={busy} onSave={() => void save()} onReset={() => setDirty(false)} />

      {!dirty && (
        <Button variant="accent" onClick={() => void save()} loading={busy}>
          Save my details
        </Button>
      )}
    </div>
  );
};

export default ShopProfile;
