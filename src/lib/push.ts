// FILE: src/lib/push.ts
import { getApp } from 'firebase/app';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const VAPID = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;
const SHOPS_KEY = 'push.shops';
const ASKED_KEY = 'push.dismissed';
// In-app browsers (Facebook, Instagram, TikTok, Android WebView) cannot show the permission prompt.
const IN_APP = /FBAN|FBAV|Instagram|TikTok|musical_ly|Line\/|; wv\)/i;

const read = (k: string): string | null => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* blocked */ } };

/** Sellers (by e-mail id) whose shop or product this device has looked at. */
export function getShops(): string[] {
  try {
    const a = JSON.parse(read(SHOPS_KEY) ?? '[]');
    return Array.isArray(a) ? a.filter((x): x is string => typeof x === 'string') : [];
  } catch { return []; }
}

export function noteShop(sellerId: string) {
  const id = sellerId.toLowerCase();
  if (!id) return;
  const cur = getShops();
  if (cur.includes(id)) return;
  write(SHOPS_KEY, JSON.stringify([id, ...cur].slice(0, 20)));
}

export const dismissAsk = () => write(ASKED_KEY, String(Date.now()));

async function ready(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    await navigator.serviceWorker.register('/sw.js');
    return await navigator.serviceWorker.ready;
  } catch { return null; }
}

export function registerSW() { void ready(); }

export async function canAsk(): Promise<boolean> {
  if (!VAPID || IN_APP.test(navigator.userAgent) || !('Notification' in window)) return false;
  if (Notification.permission !== 'default') return false;
  if (Date.now() - Number(read(ASKED_KEY) ?? 0) < 14 * 864e5) return false;
  try { return await isSupported(); } catch { return false; }
}

/** Saves or refreshes this device's token plus the shops it has viewed. Only runs once permission is granted. */
export async function syncToken(): Promise<boolean> {
  try {
    if (!VAPID || !('Notification' in window) || Notification.permission !== 'granted') return false;
    if (!(await isSupported())) return false;
    const reg = await ready();
    if (!reg) return false;
    const token = await getToken(getMessaging(getApp()), { vapidKey: VAPID, serviceWorkerRegistration: reg });
    if (!token) return false;
    const sellers = getShops();
    const sig = token.slice(-12) + sellers.join('|');
    try { if (sessionStorage.getItem('push.sig') === sig) return true; } catch { /* ignore */ }
    await setDoc(
      doc(db, 'pushTokens', token),
      { token, sellers, lang: read('lang') ?? '', updatedAt: Date.now() },
      { merge: true },
    );
    try { sessionStorage.setItem('push.sig', sig); } catch { /* ignore */ }
    return true;
  } catch { return false; }
}

export async function enablePush(): Promise<'ok' | 'denied' | 'error'> {
  try {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') { dismissAsk(); return 'denied'; }
    return (await syncToken()) ? 'ok' : 'error';
  } catch { return 'error'; }
}