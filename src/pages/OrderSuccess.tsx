// FILE: src/pages/OrderSuccess.tsx
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { CheckCircle2, Copy, Printer } from 'lucide-react';
import { db } from '../lib/firebase';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { Button, PageLoader } from '../components/ui';
import type { Order } from '../lib/types';
import { formatDate } from '../lib/utils';

const OrderSuccess: React.FC = () => {
  const { id = '' } = useParams();
  const location = useLocation();
  const { money, settings } = useStore();
  const toast = useToast();

  const passed = (location.state as { order?: Order } | null)?.order ?? null;
  const [order, setOrder] = useState<Order | null>(passed);
  const [loading, setLoading] = useState(!passed);

  useEffect(() => {
    if (passed || !id) return;
    // Guests cannot read the order back under the security rules, so this only
    // resolves for a signed-in customer or an administrator.
    getDoc(doc(db, 'orders', id))
      .then((snap) => snap.exists() && setOrder({ id: snap.id, ...(snap.data() as Omit<Order, 'id'>) }))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [id, passed]);

  if (loading) return <PageLoader label="Loading your order" />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="text-center">
        <span className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 size={40} />
        </span>
        <h1 className="font-display text-4xl font-bold sm:text-5xl">Thank you!</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-600">
          Your order has been received. We will call or e-mail you shortly to confirm the delivery.
        </p>
      </div>

      <div className="mt-10 rounded-brand border border-ink-200 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink-200 pb-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-400">Order reference</p>
            <p className="mt-1 font-display text-2xl font-bold">{order?.number ?? id.slice(0, 8).toUpperCase()}</p>
          </div>
          <div className="flex gap-2 no-print">
            <Button
              variant="outline"
              size="sm"
              icon={<Copy size={14} />}
              onClick={() => {
                navigator.clipboard?.writeText(order?.number ?? id).then(
                  () => toast.success('Reference copied.'),
                  () => toast.error('Could not copy.'),
                );
              }}
            >
              Copy
            </Button>
            <Button variant="outline" size="sm" icon={<Printer size={14} />} onClick={() => window.print()}>
              Print
            </Button>
          </div>
        </div>

        {order ? (
          <>
            <ul className="divide-y divide-ink-200">
              {order.items.map((it, i) => (
                <li key={i} className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{it.name}</p>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {it.variant ? `${it.variant} · ` : ''}Qty {it.qty}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-bold">{money(it.price * it.qty)}</span>
                </li>
              ))}
            </ul>

            <dl className="space-y-2.5 border-t border-ink-200 pt-5 text-sm">
              <div className="flex justify-between"><dt className="text-ink-600">Subtotal</dt><dd>{money(order.subtotal)}</dd></div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600"><dt>Discount</dt><dd>−{money(order.discount)}</dd></div>
              )}
              <div className="flex justify-between"><dt className="text-ink-600">Delivery</dt><dd>{order.shipping === 0 ? 'Free' : money(order.shipping)}</dd></div>
              {order.tax > 0 && (
                <div className="flex justify-between"><dt className="text-ink-600">{settings.tax.label}</dt><dd>{money(order.tax)}</dd></div>
              )}
              <div className="flex justify-between border-t border-ink-200 pt-3 text-lg font-bold">
                <dt>Total</dt><dd>{money(order.total)}</dd>
              </div>
            </dl>

            <div className="mt-6 grid gap-4 border-t border-ink-200 pt-5 text-sm sm:grid-cols-2">
              <div>
                <p className="label">Deliver to</p>
                <p className="font-semibold">{order.customerName}</p>
                <p className="text-ink-600">{order.address}{order.city ? `, ${order.city}` : ''}</p>
                <p className="text-ink-600">{order.customerPhone}</p>
              </div>
              <div>
                <p className="label">Payment</p>
                <p className="font-semibold">{order.paymentMethod}</p>
                <p className="text-ink-600">Placed {formatDate(order.createdAt, true)}</p>
              </div>
            </div>
          </>
        ) : (
          <p className="py-6 text-sm text-ink-600">
            Keep this reference safe — quote it when you contact us about this order.
          </p>
        )}
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-3 no-print">
        <Link to="/shop"><Button size="lg">Keep shopping</Button></Link>
        {settings.contact.whatsapp && (
          <a
            href={`https://wa.me/${settings.contact.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
              `Hello, I just placed order ${order?.number ?? id}`,
            )}`}
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="outline" size="lg">Message us on WhatsApp</Button>
          </a>
        )}
      </div>
    </div>
  );
};

export default OrderSuccess;
