// FILE: api/feed.mjs  (served at /feed.xml via vercel.json rewrite) - Google Merchant Center product feed
const PROJECT_ID = "my-shop-84749";
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const SITE_ORIGIN = "https://karibu.fit";
const CURRENCY = "RWF";

function fv(f) {
  if (!f) return undefined;
  if ("stringValue" in f) return f.stringValue;
  if ("doubleValue" in f) return f.doubleValue;
  if ("integerValue" in f) return Number(f.integerValue);
  if ("booleanValue" in f) return f.booleanValue;
  if ("arrayValue" in f) return (f.arrayValue.values || []).map(fv);
  if ("mapValue" in f) return parse(f.mapValue.fields || {});
  return undefined;
}
function parse(fields) {
  const o = {};
  for (const k of Object.keys(fields || {})) o[k] = fv(fields[k]);
  return o;
}
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c]));
const clean = (s) => String(s ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

async function products() {
  const out = [];
  let pageToken = "";
  do {
    const r = await fetch(`${FIRESTORE_BASE}/products?pageSize=300${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""}`, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) break;
    const j = await r.json();
    for (const d of j.documents || []) out.push({ _id: d.name.split("/").pop(), ...parse(d.fields || {}) });
    pageToken = j.nextPageToken || "";
  } while (pageToken);
  return out;
}

function stockState(p) {
  if (p.inStock === false || p.available === false) return "out_of_stock";
  for (const k of ["stock", "quantity", "qty", "inventory"]) {
    if (typeof p[k] === "number") return p[k] > 0 ? "in_stock" : "out_of_stock";
  }
  return "in_stock";
}

export default async function handler(req, res) {
  const list = await products().catch(() => []);
  const items = [];
  for (const p of list) {
    if (p.published === false || p.active === false || p.hidden === true || p.draft === true) continue;
    const price = Number(p.price);
    const images = (Array.isArray(p.images) ? p.images : []).filter((u) => typeof u === "string" && u.startsWith("http"));
    const name = clean(p.name);
    if (!name || !price || price <= 0 || !images.length) continue;
    const slug = p.slug || p._id;
    const desc = clean(p.description || p.shortDescription) || name;
    const extra = images.slice(1, 10).map((u) => `      <g:additional_image_link>${esc(u)}</g:additional_image_link>`).join("\n");
    items.push(`    <item>
      <g:id>${esc(p._id)}</g:id>
      <g:title>${esc(name.slice(0, 150))}</g:title>
      <g:description>${esc(desc.slice(0, 4900))}</g:description>
      <g:link>${SITE_ORIGIN}/product/${encodeURIComponent(slug)}</g:link>
      <g:image_link>${esc(images[0])}</g:image_link>
${extra}
      <g:availability>${stockState(p)}</g:availability>
      <g:price>${Math.round(price)} ${CURRENCY}</g:price>
      <g:condition>new</g:condition>
      <g:brand>${esc(clean(p.brand) || "Karibu")}</g:brand>
      <g:identifier_exists>no</g:identifier_exists>
    </item>`);
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Karibu Fit</title>
    <link>${SITE_ORIGIN}</link>
    <description>Karibu Fit products</description>
${items.join("\n")}
  </channel>
</rss>
`;
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate");
  res.status(200).send(xml);
}