// FILE: api/translate.mjs
// POST /api/translate   Authorization: Bearer <Firebase ID token of a shop admin/seller>
// body { lang: 'fr'|'ar'|'rw', texts: string[] }  ->  { t: string[] }   ('' = that item could not be translated)
const PROJECT_ID = 'my-shop-84749';
const OWNER = String(process.env.VITE_OWNER_EMAIL || 'techubwenge@gmail.com').toLowerCase();
const LANGS = ['fr', 'ar', 'rw'];
const SITE = 'https://karibu.fit/';

async function isStaff(idToken) {
  const apiKey = process.env.VITE_FIREBASE_API_KEY;
  if (!idToken || !apiKey) return false;
  const r = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + encodeURIComponent(apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Referer: SITE },
    body: JSON.stringify({ idToken }),
  });
  if (!r.ok) return false;
  const j = await r.json();
  const email = String((j.users && j.users[0] && j.users[0].email) || '').toLowerCase();
  if (!email) return false;
  if (email === OWNER) return true;
  const d = await fetch('https://firestore.googleapis.com/v1/projects/' + PROJECT_ID + '/databases/(default)/documents/admins/' + encodeURIComponent(email), {
    headers: { Authorization: 'Bearer ' + idToken },
  });
  if (!d.ok) return false;
  const doc = await d.json();
  const off = doc.fields && doc.fields.disabled && doc.fields.disabled.booleanValue === true;
  return !off;
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const unesc = (s) => s.replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

async function google(q, target, format, key) {
  const r = await fetch('https://translation.googleapis.com/language/translate/v2?key=' + encodeURIComponent(key), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q, target, source: 'en', format }),
  });
  if (!r.ok) throw new Error('google ' + r.status);
  const j = await r.json();
  return j.data.translations.map((x) => String(x.translatedText || ''));
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const key = process.env.GOOGLE_TRANSLATE_KEY;
  if (!key) return res.status(500).json({ error: 'translation key missing on server' });

  const h = String(req.headers.authorization || '');
  let staff = false;
  try { staff = await isStaff(h.startsWith('Bearer ') ? h.slice(7) : ''); } catch { staff = false; }
  if (!staff) return res.status(401).json({ error: 'not allowed' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};
  const lang = String(body.lang || '');
  const texts = Array.isArray(body.texts) ? body.texts.map((t) => String(t == null ? '' : t)) : [];
  const total = texts.reduce((n, t) => n + t.length, 0);
  if (!LANGS.includes(lang) || !texts.length || texts.length > 100 || total > 30000) {
    return res.status(400).json({ error: 'bad request' });
  }

  const out = texts.map(() => '');
  const plain = [];
  const withVars = [];
  texts.forEach((t, i) => { if (!t.trim()) return; (/\{\w+\}/.test(t) ? withVars : plain).push(i); });

  try {
    if (plain.length) {
      const r = await google(plain.map((i) => texts[i]), lang, 'text', key);
      plain.forEach((i, k) => { out[i] = r[k] || ''; });
    }
    if (withVars.length) {
      const q = withVars.map((i) => esc(texts[i]).replace(/\{(\w+)\}/g, '<span translate="no">{$1}</span>'));
      const r = await google(q, lang, 'html', key);
      withVars.forEach((i, k) => {
        const s = unesc(String(r[k] || '').replace(/<\/?span[^>]*>/g, ''));
        const need = texts[i].match(/\{\w+\}/g) || [];
        out[i] = need.every((v) => s.includes(v)) ? s : '';
      });
    }
  } catch (e) {
    return res.status(502).json({ error: 'translation service error' });
  }
  if (lang === 'ar') for (let i = 0; i < out.length; i++) out[i] = out[i].replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x660));
  return res.status(200).json({ t: out });
}