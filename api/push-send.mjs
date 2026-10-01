// FILE: api/push-send.mjs
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

const OWNER = 'techubwenge@gmail.com';

function init() {
  if (getApps().length) return;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT is not set');
  initializeApp({ credential: cert(JSON.parse(raw)) });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    init();
    const m = (req.headers.authorization || '').match(/^Bearer (.+)$/);
    if (!m) return res.status(401).json({ error: 'Sign in first.' });
    const tok = await getAuth().verifyIdToken(m[1]);
    const email = (tok.email || '').toLowerCase();
    if (!email) return res.status(401).json({ error: 'No e-mail on this account.' });

    const db = getFirestore();
    let role = 'seller';
    if (email === OWNER) role = 'owner';
    else {
      const a = await db.doc(`admins/${email}`).get();
      if (!a.exists || a.get('disabled') === true) return res.status(403).json({ error: 'Not an administrator.' });
      role = a.get('role') || 'seller';
    }

    const b = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const title = String(b.title || '').trim().slice(0, 60);
    const body = String(b.body || '').trim().slice(0, 180);
    if (!title || !body) return res.status(400).json({ error: 'Title and message are required.' });
    const raw = String(b.url || '/');
    const url = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/';

    // Sellers can only ever reach people who looked at their own shop.
    let q = db.collection('pushTokens');
    if (role === 'seller') q = q.where('sellers', 'array-contains', email);
    else if (b.audience && b.audience !== 'all') q = q.where('sellers', 'array-contains', String(b.audience).toLowerCase());

    const tokens = (await q.get()).docs.map((d) => d.id);
    let sent = 0;
    const dead = [];
    for (let i = 0; i < tokens.length; i += 500) {
      const chunk = tokens.slice(i, i + 500);
      const r = await getMessaging().sendEachForMulticast({
        tokens: chunk,
        data: { title, body, url },
        webpush: { headers: { Urgency: 'high', TTL: '86400' } },
      });
      sent += r.successCount;
      r.responses.forEach((x, j) => {
        const c = x.error && x.error.code;
        if (c === 'messaging/registration-token-not-registered' || c === 'messaging/invalid-registration-token') dead.push(chunk[j]);
      });
    }
    for (let i = 0; i < dead.length; i += 400) {
      const batch = db.batch();
      dead.slice(i, i + 400).forEach((t) => batch.delete(db.collection('pushTokens').doc(t)));
      await batch.commit();
    }
    return res.status(200).json({ sent, total: tokens.length, removed: dead.length });
  } catch (err) {
    return res.status(500).json({ error: String((err && err.message) || err) });
  }
}