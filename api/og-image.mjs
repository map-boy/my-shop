// FILE: api/og-image.mjs
// GET /api/og-image?u=<firebase storage image url>  ->  800x800 JPEG for link previews (WhatsApp etc.), CDN-cached 1 year
import sharp from 'sharp';

const BUCKET_PREFIX = '/v0/b/my-shop-84749.firebasestorage.app/';

export default async function handler(req, res) {
  let url;
  try { url = new URL(String(req.query.u || '')); } catch { return res.status(400).send('bad url'); }
  if (url.protocol !== 'https:' || url.hostname !== 'firebasestorage.googleapis.com' || !url.pathname.startsWith(BUCKET_PREFIX)) {
    return res.status(400).send('bad host');
  }
  try {
    const r = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return res.status(502).send('source ' + r.status);
    const input = Buffer.from(await r.arrayBuffer());
    let img = sharp(input).rotate().resize(800, 800, { fit: 'cover' });
    if (String(req.query.play || '') === '1') {
      const svg = Buffer.from('<svg width="800" height="800" xmlns="http://www.w3.org/2000/svg"><circle cx="400" cy="400" r="96" fill="#000" fill-opacity="0.55"/><circle cx="400" cy="400" r="96" fill="none" stroke="#fff" stroke-width="6"/><polygon points="372,350 372,450 458,400" fill="#fff"/></svg>');
      img = img.composite([{ input: svg }]);
    }
    const out = await img.jpeg({ quality: 75, mozjpeg: true }).toBuffer();
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
    return res.status(200).send(out);
  } catch (e) {
    return res.status(500).send('resize failed');
  }
}