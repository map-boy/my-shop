// FILE: src/pages/Cart.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { Button, EmptyState } from '../components/ui';
import { PLACEHOLDER_IMAGE } from '../lib/utils';

const Cart: React.FC = () => {
  const { lines, setQty, remove, subtotal, lineKey, clear } = useCart();
  const { money, settings } = useStore();
  const navigate = useNavigate();

  const shipping =
    !settings.shipping.enabled || (settings.shipping.freeOver > 0 && subtotal >= settings.shipping.freeOver)
      ? 0
      : settings.shipping.flatRate;

  if (!lines.length) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 sm:px-6">
        <EmptyState
          icon={<ShoppingBag size={44} />}
          title="Your bag is empty"
          text="Once you add something it will show up here."
          action={<Button size="lg" onClick={() => navigate('/shop')}>Browse the shop</Button>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-display text-4xl font-bold sm:text-5xl">Your bag</h1>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_22rem]">
        <div>
          <ul className="divide-y divide-ink-200 border-y border-ink-200">
            {lines.map((line) => {
              const key = lineKey(line);
              return (
                <li key={key} className="flex gap-5 py-6">
                  <Link to={`/product/${line.productId}`} className="shrink-0">
                    <img
                      src={line.image || PLACEHOLDER_IMAGE}
                      alt=""
                      className="h-28 w-24 rounded-xl object-cover sm:h-32 sm:w-28"
                      onError={(e) => ((e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE)}
                    />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-semibold text-ink-900">{line.name}</p>
                        {line.variant && <p className="mt-1 text-xs text-ink-500">{line.variant}</p>}
                        <p className="mt-1 text-sm text-ink-500">{money(line.price)} each</p>
                      </div>
                      <span className="shrink-0 font-bold">{money(line.price * line.qty)}</span>
                    </div>

                    <div className="mt-auto flex items-center gap-4 pt-4">
                      <div className="flex items-center rounded-full border border-ink-200">
                        <button
                          onClick={() => setQty(key, line.qty - 1)}
                          className="flex h-9 w-9 items-center justify-center rounded-l-full hover:bg-ink-100"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-9 text-center text-sm font-bold">{line.qty}</span>
                        <button
                          onClick={() => setQty(key, line.qty + 1)}
                          className="flex h-9 w-9 items-center justify-center rounded-r-full hover:bg-ink-100"
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button
                        onClick={() => remove(key)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-500 transition hover:text-red-600"
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/shop">
              <Button variant="outline">Continue shopping</Button>
            </Link>
            <Button variant="ghost" onClick={clear}>Empty bag</Button>
          </div>
        </div>

        <aside className="lg:sticky lg:top-28 lg:h-fit">
          <div className="rounded-brand border border-ink-200 p-6">
            <h2 className="font-display text-xl font-bold">Order summary</h2>
            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-600">Subtotal</dt>
                <dd className="font-semibold">{money(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-600">Delivery</dt>
                <dd className="font-semibold">{shipping === 0 ? 'Free' : money(shipping)}</dd>
              </div>
              <div className="flex justify-between border-t border-ink-200 pt-3 text-base">
                <dt className="font-bold">Estimated total</dt>
                <dd className="font-bold">{money(subtotal + shipping)}</dd>
              </div>
            </dl>
            <Button full size="lg" className="mt-7" onClick={() => navigate('/checkout')}>
              Checkout
            </Button>
            <p className="mt-4 text-center text-[11px] text-ink-500">
              Taxes and any discount codes are applied at checkout.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Cart;
