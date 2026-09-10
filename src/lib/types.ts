// FILE: src/lib/types.ts

export type ID = string;

/* -------------------------------------------------------------------------- */
/*  Catalog                                                                    */
/* -------------------------------------------------------------------------- */

export type ProductStatus = 'active' | 'draft' | 'archived';

export interface ProductOption {
  name: string;          // e.g. "Size"
  values: string[];      // e.g. ["S", "M", "L"]
}

export interface Product {
  id: ID;
  name: string;
  slug: string;
  sku: string;
  description: string;
  shortDescription: string;
  price: number;
  compareAtPrice: number;  // 0 = no "was" price
  cost: number;            // internal, never shown to shoppers
  images: string[];
  categoryId: string;
  categoryName: string;
  tags: string[];
  options: ProductOption[];
  stock: number;
  trackStock: boolean;
  status: ProductStatus;
  featured: boolean;
  bestSeller: boolean;
  newArrival: boolean;
  rating: number;
  reviewCount: number;
  soldCount: number;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export interface Category {
  id: ID;
  name: string;
  slug: string;
  description: string;
  image: string;
  icon: string;
  featured: boolean;
  order: number;
  createdAt: number;
}

/* -------------------------------------------------------------------------- */
/*  Orders                                                                     */
/* -------------------------------------------------------------------------- */

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

export interface OrderItem {
  productId: ID;
  name: string;
  image: string;
  price: number;
  qty: number;
  variant: string;
}

export interface OrderEvent {
  at: number;
  status: OrderStatus | 'note';
  by: string;
  note: string;
}

export interface Order {
  id: ID;
  number: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  couponCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  city: string;
  notes: string;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  timeline: OrderEvent[];
  createdAt: number;
  updatedAt: number;
}

export interface Customer {
  id: ID;               // the e-mail address
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  orderCount: number;
  totalSpent: number;
  createdAt: number;
  lastOrderAt: number;
}

export interface Coupon {
  id: ID;               // the code, upper-cased
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minSubtotal: number;
  usageLimit: number;   // 0 = unlimited
  used: number;
  active: boolean;
  expiresAt: number;    // 0 = never
  createdAt: number;
}

export interface Message {
  id: ID;
  name: string;
  email: string;
  phone: string;
  subject: string;
  body: string;
  read: boolean;
  createdAt: number;
}

export interface Subscriber {
  id: ID;
  email: string;
  createdAt: number;
}

/* -------------------------------------------------------------------------- */
/*  Administrators                                                             */
/* -------------------------------------------------------------------------- */

export type AdminRole = 'owner' | 'admin' | 'staff';

export interface AdminUser {
  id: ID;               // the e-mail address, lower-cased
  email: string;
  name: string;
  photoURL: string;
  role: AdminRole;
  disabled: boolean;
  addedBy: string;
  addedAt: number;
  lastLogin: number;
}

export interface ActivityEntry {
  id: ID;
  actor: string;
  action: string;
  target: string;
  at: number;
}

/* -------------------------------------------------------------------------- */
/*  Store settings — every one of these is editable from the dashboard         */
/* -------------------------------------------------------------------------- */

export interface LinkItem {
  label: string;
  href: string;
}

export interface FooterColumn {
  title: string;
  links: LinkItem[];
}

export interface ValueProp {
  icon: string;
  title: string;
  text: string;
}

export interface Testimonial {
  name: string;
  role: string;
  avatar: string;
  quote: string;
  rating: number;
}

export interface PromoBanner {
  enabled: boolean;
  eyebrow: string;
  title: string;
  text: string;
  image: string;
  ctaText: string;
  ctaLink: string;
}

export interface HeroSlide {
  eyebrow: string;
  title: string;
  subtitle: string;
  image: string;
  ctaText: string;
  ctaLink: string;
  ctaSecondaryText: string;
  ctaSecondaryLink: string;
}

export interface StoreSettings {
  /* Identity */
  storeName: string;
  tagline: string;
  logoUrl: string;
  currency: string;
  currencySymbol: string;
  currencyPosition: 'before' | 'after';
  locale: string;

  /* Theme */
  brandColor: string;
  accentColor: string;
  surface: 'light' | 'dark';
  radius: number;
  headingFont: string;

  /* Announcement bar */
  announcement: { enabled: boolean; text: string; link: string; bg: string; color: string };

  /* Home page */
  hero: { enabled: boolean; autoplay: boolean; interval: number; slides: HeroSlide[] };
  categoriesSection: { enabled: boolean; title: string; subtitle: string };
  featuredSection: { enabled: boolean; title: string; subtitle: string; limit: number };
  newArrivalsSection: { enabled: boolean; title: string; subtitle: string; limit: number };
  bestSellersSection: { enabled: boolean; title: string; subtitle: string; limit: number };
  promoA: PromoBanner;
  promoB: PromoBanner;
  valuePropsSection: { enabled: boolean; items: ValueProp[] };
  testimonialsSection: { enabled: boolean; title: string; subtitle: string; items: Testimonial[] };
  newsletterSection: { enabled: boolean; title: string; subtitle: string; buttonText: string };
  sectionOrder: string[];

  /* Commerce */
  shipping: { enabled: boolean; flatRate: number; freeOver: number; note: string };
  tax: { enabled: boolean; rate: number; label: string };
  payments: { cod: boolean; mobileMoney: boolean; card: boolean; bank: boolean; instructions: string };
  checkout: { requirePhone: boolean; allowNotes: boolean; minOrder: number };

  /* Contact & social */
  contact: { phone: string; whatsapp: string; email: string; address: string; hours: string; mapUrl: string };
  social: { facebook: string; instagram: string; twitter: string; tiktok: string; youtube: string; linkedin: string };

  /* Footer & SEO */
  footer: { about: string; columns: FooterColumn[]; copyright: string; paymentNote: string };
  seo: { title: string; description: string; ogImage: string };

  /* Kill switch */
  maintenance: { enabled: boolean; title: string; message: string };

  updatedAt: number;
  updatedBy: string;
}
