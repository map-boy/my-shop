// FILE: src/data/seed.ts
import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { slugify } from '../lib/utils';

interface SeedProduct {
  name: string;
  category: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  image: string;
  short: string;
  description: string;
  featured?: boolean;
  bestSeller?: boolean;
}

const CATEGORIES = [
  {
    name: 'Bags & luggage',
    description: 'Carry it well — day packs, totes and weekenders.',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Audio',
    description: 'Headphones and speakers worth listening through.',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Home',
    description: 'Small things that make a room feel finished.',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Accessories',
    description: 'The details that carry an outfit.',
    image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=1200&q=80',
  },
];

const PRODUCTS: SeedProduct[] = [
  {
    name: 'Leather weekend bag',
    category: 'Bags & luggage',
    price: 145000,
    compareAtPrice: 189000,
    stock: 8,
    image: 'https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&w=1200&q=80',
    short: 'Full-grain leather, fits a laptop and a weekend.',
    description:
      'Full-grain leather that softens with every trip. Cotton-twill lining, solid brass hardware and a padded 15" laptop sleeve.\n\nDimensions: 52 × 28 × 24 cm.',
    featured: true,
    bestSeller: true,
  },
  {
    name: 'Canvas daypack',
    category: 'Bags & luggage',
    price: 48000,
    stock: 22,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=80',
    short: 'Waxed canvas, leather straps, room for everything.',
    description: 'Water-resistant waxed canvas with a roll-top closure and a padded back panel.',
    featured: true,
  },
  {
    name: 'Studio headphones',
    category: 'Audio',
    price: 132000,
    compareAtPrice: 160000,
    stock: 12,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
    short: 'Closed-back, 40 mm drivers, 30-hour battery.',
    description: 'Closed-back over-ears tuned flat for long sessions. Bluetooth 5.3 with a wired option.',
    featured: true,
    bestSeller: true,
  },
  {
    name: 'Portable speaker',
    category: 'Audio',
    price: 68000,
    stock: 30,
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=1200&q=80',
    short: 'Loud, rugged and waterproof to IPX7.',
    description: 'Twelve hours of playtime, a strap that clips anywhere, and enough bass for a small room.',
  },
  {
    name: 'Ceramic pour-over set',
    category: 'Home',
    price: 39000,
    stock: 16,
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
    short: 'Dripper, carafe and a reusable steel filter.',
    description: 'Hand-glazed stoneware dripper with a borosilicate carafe. Makes two generous cups.',
    featured: true,
  },
  {
    name: 'Linen throw blanket',
    category: 'Home',
    price: 54000,
    compareAtPrice: 72000,
    stock: 9,
    image: 'https://images.unsplash.com/photo-1616627561950-9f746e330187?auto=format&fit=crop&w=1200&q=80',
    short: 'Stonewashed linen that gets softer every wash.',
    description: 'Pure European linen, stonewashed for a lived-in feel. 130 × 180 cm.',
  },
  {
    name: 'Minimal wristwatch',
    category: 'Accessories',
    price: 96000,
    stock: 14,
    image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=1200&q=80',
    short: 'Sapphire glass, 38 mm case, leather strap.',
    description: 'A quiet watch with a Japanese movement, a sapphire crystal and a quick-release strap.',
    bestSeller: true,
  },
  {
    name: 'Woven leather belt',
    category: 'Accessories',
    price: 27000,
    stock: 25,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=80',
    short: 'Stretchy woven leather, no notches to miss.',
    description: 'Hand-woven leather with a solid brass buckle. Adjusts to any waist between 76 and 106 cm.',
  },
];

/**
 * Fills an empty shop with a small demo catalogue so the storefront can be
 * judged with real content. Refuses to run if products already exist.
 */
export async function seedDemoCatalogue(): Promise<{ products: number; categories: number }> {
  const existing = await getDocs(collection(db, 'products'));
  if (!existing.empty) throw new Error('The catalogue already has products — nothing was changed.');

  const now = Date.now();
  const batch = writeBatch(db);
  const categoryIds = new Map<string, string>();

  CATEGORIES.forEach((c, i) => {
    const ref = doc(collection(db, 'categories'));
    categoryIds.set(c.name, ref.id);
    batch.set(ref, {
      name: c.name,
      slug: slugify(c.name),
      description: c.description,
      image: c.image,
      icon: '',
      featured: true,
      order: i,
      createdAt: now,
    });
  });

  PRODUCTS.forEach((p, i) => {
    const ref = doc(collection(db, 'products'));
    batch.set(ref, {
      name: p.name,
      slug: slugify(p.name),
      sku: `DEMO-${String(i + 1).padStart(3, '0')}`,
      description: p.description,
      shortDescription: p.short,
      price: p.price,
      compareAtPrice: p.compareAtPrice ?? 0,
      cost: Math.round(p.price * 0.6),
      images: [p.image],
      categoryId: categoryIds.get(p.category) ?? '',
      categoryName: p.category,
      sellerId: '',
      sellerName: '',
      tags: [slugify(p.category)],
      options: [],
      stock: p.stock,
      trackStock: true,
      status: 'active',
      featured: !!p.featured,
      bestSeller: !!p.bestSeller,
      newArrival: i < 4,
      rating: 0,
      reviewCount: 0,
      soldCount: 0,
      order: i,
      createdAt: now - i * 1000,
      updatedAt: now,
    });
  });

  await batch.commit();
  return { products: PRODUCTS.length, categories: CATEGORIES.length };
}
