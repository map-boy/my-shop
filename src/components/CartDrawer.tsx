// FILE: src/components/CartDrawer.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { Button, EmptyState } from './ui';
import { PLACEHOLDER_IMAGE } from '../lib/utils';

const CartDrawer: React.FC = () => {
  const { lines, open, setOpen, setQty, remove, subtotal, count, lineKey } = useCart();
  const { money, settings } = useStore();
  const navigate = useNavigate();

  React.useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const freeOver = settings.shipping.freeOver;
  const remaining = freeOver > 0 ? Math.max(0, freeOver - subtotal) : 0;
  const progress = freeOver > 0 ? Math.min(100, (subtotal / freeOver) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[130]">
      <div className="absolute inset-0 animate-fade-in bg-black/50" onClick={() => setOpen(false)} />

      <aside className="animate-slide-in absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-ink-200 px-5 py-5">
          <h2 className="font-display text-xl font-bold">
            Your bag {count > 0 && <span className="text-ink-400">({count})</span>}
          </h2>
          <button onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-ink-100" aria-label="Close cart">
            <X size={20} />
          </button>
        </header>

        {lines.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <EmptyState
              icon={<ShoppingBag size={40} />}
              title="Your bag is empty"
              text="Browse the shop and add something you love."
              action={
                <Button onClick={() => { setOpen(false); navigate('/shop'); }}>Start shopping</Button>
              }
              className="border-none"
            />
          </div>
        ) : (
          <>
            {freeOver > 0 && (
              <div className="border-b border-ink-200 px-5 py-4">
                <p className="text-xs text-ink-600">
                  {remaining > 0 ? (
                    <>Spend <strong>{money(remaining)}</strong> more for free delivery</>
                  ) : (
                    <strong className="text-emerald-600">You have unlocked free delivery 🎉</strong>
                  )}
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-200">
                  <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            <div className="thin-scrollbar flex-1 overflow-y-auto px-5 py-5">
              <ul className="space-y-5">
                {lines.map((line) => {
                  const key = lineKey(line);
                  return (
                    <li key={key} className="flex gap-4">
                      <img
                        src={line.image || PLACEHOLDER_IMAGE}
                        alt=""
                        className="h-24 w-20 shrink-0 rounded-xl object-cover"
                        onError={(e) => ((e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE)}
                      />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="line-clamp-2 text-sm font-semibold text-ink-900">{line.name}</p>
                            {line.variant && <p className="mt-0.5 text-xs text-ink-500">{line.variant}</p>}
                          </div>
                          <button
                            onClick={() => remove(key)}
                            className="shrink-0 rounded-lg p-1.5 text-ink-400 transition hover:bg-red-50 hover:text-red-600"
                            aria-label="Remove item"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>

                        <div className="mt-auto flex items-center justify-between pt-3">
                          <div className="flex items-center rounded-full border border-ink-200">
                            <button
                              onClick={() => setQty(key, line.qty - 1)}
                              className="flex h-8 w-8 items-center justify-center rounded-l-full transition hover:bg-ink-100"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={13} />
                            </button>
                            <span className="w-8 text-center text-sm font-bold">{line.qty}</span>
                            <button
                              onClick={() => setQty(key, line.qty + 1)}
                              className="flex h-8 w-8 items-center justify-center rounded-r-full transition hover:bg-ink-100"
                              aria-label="Increase quantity"
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                          <span className="text-sm font-bold">{money(line.price * line.qty)}</span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <footer className="border-t border-ink-200 px-5 py-5">
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-ink-600">Subtotal</span>
                <span className="text-lg font-bold">{money(subtotal)}</span>
              </div>
              <p className="mb-4 text-[11px] text-ink-500">Delivery and any taxes are calculated at checkout.</p>
              <Button full size="lg" onClick={() => { setOpen(false); navigate('/checkout'); }}>
                Checkout
              </Button>
              <Link
                to="/cart"
                onClick={() => setOpen(false)}
                className="mt-3 block text-center text-xs font-semibold uppercase tracking-[0.15em] text-ink-500 hover:text-ink-900"
              >
                View full bag
              </Link>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
};

export default CartDrawer;
