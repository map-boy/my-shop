// FILE: src/lib/defaults.ts
import type { StoreSettings } from './types';

/**
 * The storefront renders from these values until an administrator saves their
 * own. Every field here is exposed in Dashboard → Settings / Home Builder, so
 * nothing on the site is hard-coded beyond this file.
 */
export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'MY SHOP',
  tagline: 'Everything you love, delivered.',
  logoUrl: '',
  currency: 'RWF',
  currencySymbol: 'RWF',
  currencyPosition: 'before',
  locale: 'en-RW',

  brandColor: '#111827',
  accentColor: '#e0b34d',
  surface: 'light',
  radius: 16,
  headingFont: "'Playfair Display', Georgia, serif",

  announcement: {
    enabled: true,
    text: 'Free delivery on orders over 50,000 RWF · Same-day dispatch in Kigali',
    link: '/shop',
    bg: '#111827',
    color: '#ffffff',
  },

  hero: {
    enabled: true,
    autoplay: true,
    interval: 6000,
    slides: [
      {
        eyebrow: 'New season',
        title: 'Products picked with care.',
        subtitle:
          'A small, honest catalogue — quality you can feel, prices that make sense, delivered to your door.',
        image:
          'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1800&q=80',
        ctaText: 'Shop the collection',
        ctaLink: '/shop',
        ctaSecondaryText: 'Browse categories',
        ctaSecondaryLink: '/categories',
      },
      {
        eyebrow: 'Just landed',
        title: 'Fresh arrivals, every week.',
        subtitle: 'New pieces added to the shelves every Friday. Be the first to see them.',
        image:
          'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1800&q=80',
        ctaText: 'See what is new',
        ctaLink: '/shop?sort=newest',
        ctaSecondaryText: 'Talk to us',
        ctaSecondaryLink: '/contact',
      },
    ],
  },

  categoriesSection: {
    enabled: true,
    title: 'Shop by category',
    subtitle: 'Find exactly what you came for.',
  },
  featuredSection: {
    enabled: true,
    title: 'Featured this week',
    subtitle: 'Hand-picked by our team.',
    limit: 8,
  },
  newArrivalsSection: {
    enabled: true,
    title: 'New arrivals',
    subtitle: 'Straight off the shelf.',
    limit: 8,
  },
  bestSellersSection: {
    enabled: true,
    title: 'Best sellers',
    subtitle: 'What everyone is buying.',
    limit: 8,
  },

  promoA: {
    enabled: true,
    eyebrow: 'Limited offer',
    title: 'Up to 30% off selected items',
    text: 'A rotating selection of favourites at a price worth telling a friend about.',
    image:
      'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1400&q=80',
    ctaText: 'Shop the sale',
    ctaLink: '/shop',
  },
  promoB: {
    enabled: true,
    eyebrow: 'Delivered fast',
    title: 'Same-day delivery in Kigali',
    text: 'Order before 3pm and it arrives today. Countrywide delivery in 48 hours.',
    image:
      'https://images.unsplash.com/photo-1580674285054-bed31e145f59?auto=format&fit=crop&w=1400&q=80',
    ctaText: 'How it works',
    ctaLink: '/contact',
  },

  valuePropsSection: {
    enabled: true,
    items: [
      { icon: 'truck', title: 'Fast delivery', text: 'Same-day in Kigali, 48h countrywide.' },
      { icon: 'shield', title: 'Secure checkout', text: 'Pay on delivery or by mobile money.' },
      { icon: 'refresh', title: '7-day returns', text: 'Changed your mind? Send it back.' },
      { icon: 'headphones', title: 'Real people', text: 'We answer on WhatsApp in minutes.' },
    ],
  },

  testimonialsSection: {
    enabled: true,
    title: 'Loved by our customers',
    subtitle: 'A few words from people who shop with us.',
    items: [
      {
        name: 'Aline U.',
        role: 'Kigali',
        avatar: '',
        quote: 'Ordered at noon, it was at my door by five. The quality was better than the photos.',
        rating: 5,
      },
      {
        name: 'Eric M.',
        role: 'Musanze',
        avatar: '',
        quote: 'Clear prices, no surprises at checkout, and they actually pick up the phone.',
        rating: 5,
      },
      {
        name: 'Divine K.',
        role: 'Huye',
        avatar: '',
        quote: 'I have ordered four times now. Nothing has ever arrived late or damaged.',
        rating: 5,
      },
    ],
  },

  newsletterSection: {
    enabled: true,
    title: 'Get the good stuff first',
    subtitle: 'New arrivals and private offers, once a week. No noise.',
    buttonText: 'Subscribe',
  },

  sectionOrder: [
    'hero',
    'valueProps',
    'categories',
    'featured',
    'promoA',
    'newArrivals',
    'promoB',
    'bestSellers',
    'testimonials',
    'newsletter',
  ],

  shipping: {
    enabled: true,
    flatRate: 2000,
    freeOver: 50000,
    note: 'Delivery fee is confirmed with you before dispatch.',
  },
  tax: { enabled: false, rate: 18, label: 'VAT' },
  payments: {
    cod: true,
    mobileMoney: true,
    card: false,
    bank: false,
    instructions:
      'Mobile Money: send to *182*8*1*XXXXXX# and paste the transaction ID in the notes field.',
  },
  checkout: { requirePhone: true, allowNotes: true, minOrder: 0 },

  contact: {
    phone: '+250 788 000 000',
    whatsapp: '+250788000000',
    email: 'hello@myshop.rw',
    address: 'KG 11 Ave, Kigali, Rwanda',
    hours: 'Mon – Sat, 08:00 – 19:00',
    mapUrl: '',
  },

  social: {
    facebook: '',
    instagram: '',
    twitter: '',
    tiktok: '',
    youtube: '',
    linkedin: '',
  },

  footer: {
    about:
      'A small online shop with a big obsession for good products, fair prices and delivery that actually shows up.',
    columns: [
      {
        title: 'Shop',
        links: [
          { label: 'All products', href: '/shop' },
          { label: 'Categories', href: '/categories' },
          { label: 'New arrivals', href: '/shop?sort=newest' },
        ],
      },
      {
        title: 'Company',
        links: [
          { label: 'About us', href: '/about' },
          { label: 'Contact', href: '/contact' },
          { label: 'Track my order', href: '/track' },
        ],
      },
    ],
    copyright: `© ${new Date().getFullYear()} My Shop. All rights reserved.`,
    paymentNote: 'We accept Mobile Money, cash on delivery and bank transfer.',
  },

  seo: {
    title: 'My Shop — Modern online store',
    description: 'Shop curated products with fast delivery and secure checkout.',
    ogImage: '',
  },

  maintenance: {
    enabled: false,
    title: 'We will be right back',
    message: 'The shop is being updated. Please check back in a few minutes.',
  },

  updatedAt: 0,
  updatedBy: '',
};

/** Deep-merges saved settings over the defaults so new fields never break an old document. */
export function mergeSettings(saved: Partial<StoreSettings> | undefined | null): StoreSettings {
  return deepMerge(DEFAULT_SETTINGS, saved ?? {}) as StoreSettings;
}

function deepMerge<T>(base: T, patch: any): T {
  if (Array.isArray(base)) return (Array.isArray(patch) ? patch : base) as T;
  if (base && typeof base === 'object' && patch && typeof patch === 'object') {
    const out: any = { ...base };
    for (const key of Object.keys(patch)) {
      const b = (base as any)[key];
      const p = patch[key];
      if (p === undefined || p === null) continue;
      out[key] = b && typeof b === 'object' && !Array.isArray(b) ? deepMerge(b, p) : p;
    }
    return out;
  }
  return (patch === undefined ? base : patch) as T;
}
