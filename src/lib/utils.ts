// FILE: src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';

export const cn = (...inputs: ClassValue[]) => clsx(inputs);

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function formatMoney(
  amount: number,
  opts: { symbol?: string; position?: 'before' | 'after'; locale?: string } = {},
): string {
  const { symbol = 'RWF', position = 'before', locale = 'en-US' } = opts;
  const n = Number.isFinite(amount) ? amount : 0;
  const body = new Intl.NumberFormat(locale, {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(n);
  return position === 'before' ? `${symbol} ${body}` : `${body} ${symbol}`;
}

export function formatDate(ms: number, withTime = false): string {
  if (!ms) return '—';
  const d = new Date(ms);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

export function timeAgo(ms: number): string {
  if (!ms) return '—';
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(ms);
}

export function discountPercent(price: number, compareAt: number): number {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

export function orderNumber(): string {
  const now = new Date();
  const stamp = `${now.getFullYear()}`.slice(2) +
    `${now.getMonth() + 1}`.padStart(2, '0') +
    `${now.getDate()}`.padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `MS-${stamp}-${rand}`;
}

/** Turns an unknown Firebase error into something a human can act on. */
export function errorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  const map: Record<string, string> = {
    'permission-denied': 'You do not have permission to do that.',
    'auth/popup-closed-by-user': 'Sign-in was cancelled.',
    'auth/popup-blocked': 'Your browser blocked the pop-up. Allow pop-ups and try again.',
    'auth/network-request-failed': 'Network problem — check your connection and retry.',
    'auth/unauthorized-domain': 'This domain is not authorised in Firebase Auth settings.',
    'storage/unauthorized': 'Only administrators can upload files.',
  };
  if (map[code]) return map[code];
  const msg = (err as { message?: string })?.message;
  return msg ? msg.replace(/^Firebase:\s*/, '') : 'Something went wrong. Please try again.';
}

/** Readable text colour for an arbitrary background. */
export function contrastOn(hex: string): string {
  const c = hex.replace('#', '');
  if (c.length < 6) return '#ffffff';
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#111827' : '#ffffff';
}

export const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="600" height="600" fill="#f1f0ee"/><path d="M180 380l90-110 70 85 55-60 95 125z" fill="#d8d5d0"/><circle cx="240" cy="215" r="38" fill="#d8d5d0"/></svg>`,
  );
