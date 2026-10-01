// FILE: api/sitemap.mjs  (served at /sitemap.xml via vercel.json rewrite)
const PROJECT_ID = "my-shop-84749";
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const SITE_ORIGIN = "https://karibu.fit";
const STATIC = ["/", "/shop", "/categories", "/about", "/contact", "/privacy", "/terms", "/shipping-returns", "/disclaimer", "/cookies", "/blog"];

function num(f) {
  if (!f) return 0;
  if ("integerValue" in f) return Number(f.integerValue);
  if ("doubleValue" in f) return f.doubleValue;
  return 0;
}

async function publishedPosts() {
  const r = await fetch(`${FIRESTORE_BASE}:runQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ structuredQuery: {
      from: [{ collectionId: "posts" }],
      where: { fieldFilter: { field: { fieldPath: "published" }, op: "EQUAL", value: { booleanValue: true } } },
      limit: 500,
    } }),
    signal: AbortSignal.timeout(6000),
  });
  if (!r.ok) return [];
  const rows = await r.json();
  return rows.filter((x) => x.document).map((x) => {
    const f = x.document.fields || {};
    return { slug: f.slug?.stringValue || "", t: num(f.updatedAt) || num(f.createdAt) };
  }).filter((p) => p.slug);
}

export default async function handler(req, res) {
  const posts = await publishedPosts().catch(() => []);
  const urls = STATIC.map((p) => `  <url><loc>${SITE_ORIGIN}${p}</loc></url>`);
  for (const p of posts) {
    const lm = p.t ? `<lastmod>${new Date(p.t).toISOString().slice(0, 10)}</lastmod>` : "";
    urls.push(`  <url><loc>${SITE_ORIGIN}/blog/${encodeURIComponent(p.slug)}</loc>${lm}</url>`);
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
  res.status(200).send(xml);
}