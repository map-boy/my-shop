// Same-origin image proxy so the try-on can read garment pixels (Firebase Storage sends no CORS header).
const HOSTS = new Set(['firebasestorage.googleapis.com', 'storage.googleapis.com']);
export default async function handler(req, res) {
  try {
    const u = new URL(String(req.query?.u || ''));
    if (u.protocol !== 'https:' || !HOSTS.has(u.hostname)) { res.statusCode = 400; return res.end('bad host'); }
    const r = await fetch(u.toString());
    if (!r.ok) { res.statusCode = 502; return res.end('upstream ' + r.status); }
    const type = r.headers.get('content-type') || 'image/jpeg';
    if (!type.startsWith('image/')) { res.statusCode = 415; return res.end('not an image'); }
    res.setHeader('Content-Type', type);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.end(Buffer.from(await r.arrayBuffer()));
  } catch { res.statusCode = 400; res.end('bad request'); }
}