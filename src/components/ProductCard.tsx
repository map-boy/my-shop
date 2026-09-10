// FILE: src/components/ProductCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Star } from 'lucide-react';
import type { Product } from '../lib/types';
import { useStore } from '../context/StoreContext';
import { useCart } from '../context/CartContext';
import { cn, discountPercent, PLACEHOLDER_IMAGE } from '../lib/utils';

interface Props {
  product: Product;
  className?: string;
}

const ProductCard: React.FC<Props> = ({ product, className }) => {
  const { money } = useStore();
  const { add } = useCart();

  const off = discountPercent(product.price, product.compareAtPrice);
  const soldOut = product.trackStock && product.stock <= 0;
  const image = product.images?.[0] || PLACEHOLDER_IMAGE;

  const quickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (soldOut) return;
    add(product, 1, '');
  };

  return (
    <Link
      to={`/product/${product.slug || product.id}`}
      className={cn('group flex flex-col', className)}
    >
      <div className="relative aspect-square overflow-hidden rounded-brand bg-ink-100">
        <img
          src={image}
          alt={product.name}
          loading="lazy"
          className={cn(
            'h-full w-full object-cover transition-transform duration-700 group-hover:scale-105',
            soldOut && 'opacity-55',
          )}
          onError={(e) => ((e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE)}
        />

        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {off > 0 && (
            <span className="rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white">
              −{off}%
            </span>
          )}
          {product.newArrival && !off && (
            <span className="rounded-full bg-brand px-2.5 py-1 text-[10px] font-black uppercase tracking-wider">
              New
            </span>
          )}
          {product.bestSeller && (
            <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-black uppercase tracking-wider">
              Best seller
            </span>
          )}
        </div>

        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-full bg-ink-950/85 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white">
              Sold out
            </span>
          </div>
        )}

        {!soldOut && (
          <button
            onClick={quickAdd}
            aria-label={`Add ${product.name} to cart`}
            className="absolute bottom-3 right-3 flex h-11 w-11 translate-y-2 items-center justify-center rounded-full bg-white text-ink-900 opacity-0 shadow-lg transition-all duration-300 hover:bg-brand group-hover:translate-y-0 group-hover:opacity-100 max-sm:translate-y-0 max-sm:opacity-100"
          >
            <Plus size={19} />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col pt-4">
        {product.categoryName && (
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-400">
            {product.categoryName}
          </p>
        )}
        <h3 className="mt-1.5 line-clamp-2 text-[15px] font-semibold leading-snug text-ink-900 transition-colors group-hover:text-accent">
          {product.name}
        </h3>

        {product.reviewCount > 0 && (
          <div className="mt-1.5 flex items-center gap-1 text-ink-400">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                size={12}
                className={i <= Math.round(product.rating) ? 'fill-accent text-accent' : 'text-ink-300'}
              />
            ))}
            <span className="ml-1 text-[11px]">({product.reviewCount})</span>
          </div>
        )}

        <div className="mt-auto flex items-baseline gap-2 pt-3">
          <span className="text-base font-bold text-ink-900">{money(product.price)}</span>
          {off > 0 && (
            <span className="text-xs text-ink-400 line-through">{money(product.compareAtPrice)}</span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;

export const ProductCardSkeleton: React.FC = () => (
  <div className="flex flex-col">
    <div className="skeleton aspect-square rounded-brand" />
    <div className="skeleton mt-4 h-3 w-20 rounded" />
    <div className="skeleton mt-2 h-4 w-full rounded" />
    <div className="skeleton mt-2 h-4 w-24 rounded" />
  </div>
);
