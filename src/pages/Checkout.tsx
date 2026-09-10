// FILE: src/pages/Checkout.tsx
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { BadgePercent, Lock, ShoppingBag } from 'lucide-react';
import { db } from '../lib/firebase';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { Button, EmptyState, Field, Input, Textarea } from '../components/ui';
import type { Coupon, Order } from '../lib/types';
import { cn, errorMessage, orderNumber, PLACEHOLDER_IMAGE } from '../lib/utils';

interface Form {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  notes: string;
}

const Checkout: React.FC = () => {
  const { lines, subtotal, clear } = useCart();
  const { money, settings } = useStore();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState<Form>({ name: '', email: '', phone: '', address: '', city: '', notes: '' });
  const [payment, setPayment] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState(false);

  const methods = useMemo(() => {
    const p = settings.payments;
    return [
      p.cod && { id: 'cod', label: 'Cash on delivery', hint: 'Pay the courier when your order arrives.' },
      p.mobileMoney && { id: 'momo', label: 'Mobile Money', hint: settings.payments.instructions },
      p.bank && { id: 'bank', label: 'Bank transfer', hint: 'We send account details after you order.' },
      p.card && { id: 'card', label: 'Card', hint: 'A secure payment link is sent to your e-mail.' },
    ].filter(Boolean) as { id: string; label: string; hint: string }[];
  }, [settings.payments]);

  const activeMethod = payment || methods[0]?.id || 'cod';

  const discount = useMemo(() => {
    if (!coupon) return 0;
    const raw = coupon.type === 'percent' ? (subtotal * coupon.value) / 100 : coupon.value;
    return Math.min(subtotal, Math.max(0, Math.round(raw)));
  }, [coupon, subtotal]);

  const shipping =
    !settings.shipping.enabled ||
    (settings.shipping.freeOver > 0 && subtotal - discount >= settings.shipping.freeOver)
      ? 0
      : settings.shipping.flatRate;

  const tax = settings.tax.enabled
    ? Math.round(((subtotal - discount) * settings.tax.rate) / 100)
    : 0;

  const total = Math.max(0, subtotal - discount + shipping + tax);

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    setChecking(true);
    try {
      const snap = await getDoc(doc(db, 'coupons', code));
      if (!snap.exists()) {
        setCoupon(null);
        return toast.error('That code does not exist.');
      }
      const data = { id: snap.id, ...(snap.data() as Omit<Coupon, 'id'>) };
      if (!data.active) { setCoupon(null); return toast.error('That code is no longer active.'); }
      if (data.expiresAt && data.expiresAt < Date.now()) { setCoupon(null); return toast.error('That code has expired.'); }
      if (data.minSubtotal && subtotal < data.minSubtotal) {
        setCoupon(null);
        return toast.error(`Spend at least ${money(data.minSubtotal)} to use this code.`);
      }
      if (data.usageLimit > 0 && data.used >= data.usageLimit) {
        setCoupon(null);
        return toast.error('That code has been fully redeemed.');
      }
      setCoupon(data);
      toast.success(`Code applied — ${data.type === 'percent' ? `${data.value}% off` : `${money(data.value)} off`}.`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setChecking(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Please enter your name.');
    if (!form.email.includes('@')) return toast.error('Please enter a valid e-mail address.');
    if (settings.checkout.requirePhone && !form.phone.trim()) return toast.error('Please enter a phone number.');
    if (!form.address.trim()) return toast.error('Please enter a delivery address.');
    if (settings.checkout.minOrder > 0 && subtotal < settings.checkout.minOrder) {
      return toast.error(`The minimum order is ${money(settings.checkout.minOrder)}.`);
    }

    setBusy(true);
    const now = Date.now();
    const order: Omit<Order, 'id'> = {
      number: orderNumber(),
      items: lines.map((l) => ({
        productId: l.productId,
        name: l.name,
        image: l.image,
        price: l.price,
        qty: l.qty,
        variant: l.variant,
        sellerId: l.sellerId ?? '',
        sellerName: l.sellerName ?? '',
      })),
      // Flat list of sellers in this order. A seller's dashboard query and the
      // security rules both read this, so it has to be written at checkout.
      sellerIds: Array.from(
        new Set(lines.map((l) => (l.sellerId ?? '').toLowerCase()).filter(Boolean)),
      ),
      subtotal,
      shipping,
      tax,
      discount,
      total,
      couponCode: coupon?.code ?? '',
      customerName: form.name.trim(),
      customerEmail: form.email.trim().toLowerCase(),
      customerPhone: form.phone.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      notes: form.notes.trim(),
      paymentMethod: methods.find((m) => m.id === activeMethod)?.label ?? activeMethod,
      paymentStatus: 'unpaid',
      status: 'pending',
      timeline: [{ at: now, status: 'pending', by: 'customer', note: 'Order placed' }],
      createdAt: now,
      updatedAt: now,
    };

    try {
      const ref = await addDoc(collection(db, 'orders'), order);

      // Best-effort customer record; failure here must not lose the order.
      void setDoc(
        doc(db, 'customers', order.customerEmail),
        {
          name: order.customerName,
          email: order.customerEmail,
          phone: order.customerPhone,
          address: order.address,
          city: order.city,
          lastOrderAt: now,
          createdAt: now,
        },
        { merge: true },
      ).catch(() => undefined);

      clear();
      navigate(`/order/${ref.id}`, { state: { order: { id: ref.id, ...order } } });
    } catch (err) {
      toast.error(errorMessage(err));
      setBusy(false);
    }
  };

  if (!lines.length) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 sm:px-6">
        <EmptyState
          icon={<ShoppingBag size={44} />}
          title="Nothing to check out"
          text="Add a product to your bag first."
          action={<Button size="lg" onClick={() => navigate('/shop')}>Browse the shop</Button>}
        />
      </div>
    );
  }

  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-display text-4xl font-bold sm:text-5xl">Checkout</h1>
      <p className="mt-3 flex items-center gap-2 text-sm text-ink-500">
        <Lock size={14} /> Your details are only used to deliver this order.
      </p>

      <form onSubmit={submit} className="mt-10 grid gap-10 lg:grid-cols-[1fr_23rem]">
        <div className="space-y-10">
          <section>
            <h2 className="mb-5 font-display text-xl font-bold">Delivery details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" required>
                <Input value={form.name} onChange={set('name')} placeholder="Jane Doe" autoComplete="name" />
              </Field>
              <Field label="E-mail" required>
                <Input type="email" value={form.email} onChange={set('email')} placeholder="jane@example.com" autoComplete="email" />
              </Field>
              <Field label="Phone" required={settings.checkout.requirePhone}>
                <Input value={form.phone} onChange={set('phone')} placeholder="+250 7…" autoComplete="tel" />
              </Field>
              <Field label="City / town">
                <Input value={form.city} onChange={set('city')} placeholder="Kigali" autoComplete="address-level2" />
              </Field>
              <Field label="Delivery address" required className="sm:col-span-2">
                <Input value={form.address} onChange={set('address')} placeholder="Street, house number, landmark" autoComplete="street-address" />
              </Field>
              {settings.checkout.allowNotes && (
                <Field label="Order notes" hint="Anything the courier should know." className="sm:col-span-2">
                  <Textarea value={form.notes} onChange={set('notes')} placeholder="Optional" />
                </Field>
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-5 font-display text-xl font-bold">Payment</h2>
            <div className="space-y-3">
              {methods.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setPayment(m.id)}
                  className={cn(
                    'flex w-full items-start gap-4 rounded-xl border p-5 text-left transition',
                    activeMethod === m.id ? 'border-ink-900 bg-ink-50' : 'border-ink-200 hover:border-ink-400',
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                      activeMethod === m.id ? 'border-ink-900' : 'border-ink-300',
                    )}
                  >
                    {activeMethod === m.id && <span className="h-2.5 w-2.5 rounded-full bg-ink-900" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-ink-900">{m.label}</span>
                    {m.hint && <span className="mt-1 block text-xs leading-relaxed text-ink-500">{m.hint}</span>}
                  </span>
                </button>
              ))}
              {!methods.length && (
                <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
                  No payment method is enabled. Please contact the shop to complete your order.
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-28 lg:h-fit">
          <div className="rounded-brand border border-ink-200 p-6">
            <h2 className="font-display text-xl font-bold">Your order</h2>

            <ul className="mt-5 max-h-64 space-y-4 overflow-y-auto pr-1">
              {lines.map((l, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <img
                      src={l.image || PLACEHOLDER_IMAGE}
                      alt=""
                      className="h-14 w-14 rounded-lg object-cover"
                      onError={(e) => ((e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE)}
                    />
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink-900 px-1 text-[10px] font-bold text-white">
                      {l.qty}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">{l.name}</p>
                    {l.variant && <p className="truncate text-[11px] text-ink-500">{l.variant}</p>}
                  </div>
                  <span className="text-xs font-bold">{money(l.price * l.qty)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 border-t border-ink-200 pt-5">
              <div className="flex gap-2">
                <Input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Discount code"
                  className="h-11"
                />
                <Button type="button" variant="outline" onClick={applyCoupon} loading={checking} className="shrink-0">
                  Apply
                </Button>
              </div>
              {coupon && (
                <p className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                  <BadgePercent size={13} /> {coupon.code} applied
                </p>
              )}
            </div>

            <dl className="mt-6 space-y-3 border-t border-ink-200 pt-5 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-600">Subtotal</dt>
                <dd className="font-semibold">{money(subtotal)}</dd>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <dt>Discount</dt>
                  <dd className="font-semibold">−{money(discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-ink-600">Delivery</dt>
                <dd className="font-semibold">{shipping === 0 ? 'Free' : money(shipping)}</dd>
              </div>
              {tax > 0 && (
                <div className="flex justify-between">
                  <dt className="text-ink-600">{settings.tax.label} ({settings.tax.rate}%)</dt>
                  <dd className="font-semibold">{money(tax)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-ink-200 pt-3 text-lg">
                <dt className="font-bold">Total</dt>
                <dd className="font-bold">{money(total)}</dd>
              </div>
            </dl>

            <Button type="submit" full size="lg" className="mt-7" loading={busy}>
              Place order
            </Button>
            <p className="mt-4 text-center text-[11px] leading-relaxed text-ink-500">
              By placing this order you agree to be contacted about the delivery.
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
};

export default Checkout;
