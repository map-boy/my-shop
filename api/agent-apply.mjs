// FILE: api/agent-apply.mjs
// POST (Bearer = applicant Firebase ID token). Reads their own application, sets queue position, pushes an FCM alert to admin devices.
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

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
    const ref = db.doc(`agentApplications/${email}`);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'No application found.' });
    const a = snap.data();

    const pend = (await db.collection('agentApplications').where('status', '==', 'pending').get()).docs.map((d) => d.get('createdAt') || 0);
    const queuePos = pend.filter((t) => t < (a.createdAt || 0)).length + 1;

    if (a.notified === true || a.status !== 'pending') {
      await ref.set({ queuePos }, { merge: true });
      return res.status(200).json({ ok: true, queuePos, sent: 0 });
    }

    const tokens = (await db.collection('adminPushTokens').get()).docs.map((d) => d.id);
    let sent = 0;
    const dead = [];
    for (let i = 0; i < tokens.length; i += 500) {
      const chunk = tokens.slice(i, i + 500);
      const r = await getMessaging().sendEachForMulticast({
        tokens: chunk,
        data: {
          title: 'New agent application',
          body: `${String(a.name || '').slice(0, 40)} (${String(a.phone || '').slice(0, 20)}) applied. Queue position ${queuePos}.`,
          url: '/admin/applications',
        },
        webpush: { headers: { Urgency: 'high', TTL: '86400' } },
      });
      sent += r.successCount;
      r.responses.forEach((x, j) => {
        const c = x.error && x.error.code;
        if (c === 'messaging/registration-token-not-registered' || c === 'messaging/invalid-registration-token') dead.push(chunk[j]);
      });
    }
    for (const t of dead) await db.collection('adminPushTokens').doc(t).delete();
    await ref.set({ notified: true, queuePos }, { merge: true });
    return res.status(200).json({ ok: true, queuePos, sent });
  } catch (err) {
    return res.status(500).json({ error: String((err && err.message) || err) });
  }
}