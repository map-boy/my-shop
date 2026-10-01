// FILE: src/lib/track.ts
import { doc, increment, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const today = () => new Date().toISOString().slice(0, 10);

/** True the first time a key is seen in this storage. Blocked storage counts nothing. */
function once(store: Storage, key: string): boolean {
  try {
    if (store.getItem(key)) return false;
    store.setItem(key, '1');
    return true;
  } catch {
    return false;
  }
}

/**
 * Anonymous, per-day counters. views = sessions, visitors = devices per day,
 * qr = sessions that arrived through a scanned QR (?src=qr).
 */
export async function trackHit(slug: string, sellerId: string, qr: boolean): Promise<void> {
  try {
    const day = today();
    const id = `${day}__${slug}`;
    const view = once(sessionStorage, `t.v.${id}`);
    const scan = qr && once(sessionStorage, `t.q.${id}`);
    const visitor = once(localStorage, `t.u.${id}`);
    if (!view && !scan && !visitor) return;

    const data: Record<string, unknown> = { day, slug, sellerId: sellerId.toLowerCase(), updatedAt: Date.now() };
    if (view) data.views = increment(1);
    if (scan) data.qr = increment(1);
    if (visitor) data.visitors = increment(1);
    await setDoc(doc(db, 'traffic', id), data, { merge: true });
  } catch {
    /* analytics must never break the shop */
  }
}
