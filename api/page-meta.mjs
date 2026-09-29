// FILE: api/page-meta.mjs
// GET /api/page-meta?path=/section/mangaze  ->  tiny HTML with OG tags built from Store settings (SEO tab) + section data.
const PROJECT_ID = "my-shop-84749";
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const SITE_ORIGIN = "https://karibu.fit";
const PAGE_TITLES = { "/shop": "Shop", "/categories": "Categories", "/about": "About", "/contact": "Contact" };

function fv(field) {
  if (!field) return undefined;
  if ("stringValue" in field) return field.stringValue;
  if ("doubleValue" in field) return field.doubleValue;
  if ("integerValue" in field) return Number(field.integerValue);
  if ("booleanValue" in field) return field.booleanValue;
  if ("arrayValue" in field) return (field.arrayValue.values || []).map(fv);
  if ("mapValue" in field) return parseFields(field.mapValue.fields || {});
  return undefined;
}

function parseFields(fields) {
  const out = {};
  for (const key of Object.keys(fields || {})) out[key] = fv(fields[key]);
  return out;
}

async function fetchStore() {
  const r = await fetch(`${FIRESTORE_BASE}/settings/store`, { signal: AbortSignal.timeout(5000) });
  if (!r.ok) return null;
  const doc = await r.json();
  return parseFields(doc.fields || {});
}

async function fetchSection(slug) {
  const query = {
    structuredQuery: {
      from: [{ collectionId: "sections" }],
      where: { fieldFilter: { field: { fieldPath: "slug" }, op: "EQUAL", value: { stringValue: slug } } },
      limit: 1,
    },
  };
  const r = await fetch(`${FIRESTORE_BASE}:runQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(query),
    signal: AbortSignal.timeout(5000),
  });
  if (!r.ok) return null;
  const rows = await r.json();
  const match = rows.find((x) => x.document);
  return match ? parseFields(match.document.fields || {}) : null;
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

export default async function handler(req, res) {
  let path = String(req.query.path || "/").trim();
  if (!path.startsWith("/")) path = "/";
  const pageUrl = SITE_ORIGIN + (path === "/" ? "/" : path.split("/").map((s) => encodeURIComponent(decodeURIComponent(s))).join("/"));

  const store = (await fetchStore().catch(() => null)) || {};
  const seo = store.seo || {};
  const storeName = store.storeName || "Shop";

  let title = seo.title || storeName;
  let description = seo.description || store.tagline || "";
  let image = seo.ogImage || "";

  if (path.startsWith("/section/")) {
    let slug = "";
    try { slug = decodeURIComponent(path.split("/")[2] || ""); } catch { slug = ""; }
    const section = slug ? await fetchSection(slug).catch(() => null) : null;
    if (section && section.enabled !== false) {
      title = `${section.name || slug} \u2014 ${storeName}`;
      if (section.description) description = section.description;
      if (section.image) image = section.image;
    }
  } else if (PAGE_TITLES[path]) {
    title = `${PAGE_TITLES[path]} \u2014 ${storeName}`;
  }

  // 1200x630 copy served through our own resizer so the preview is small, sharp and crawler-friendly.
  const ogImage = image && image.startsWith("https://firebasestorage.googleapis.com/")
    ? `${SITE_ORIGIN}/api/og-image?w=1200&h=630&u=${encodeURIComponent(image)}`
    : image;

  const imageTags = ogImage
    ? `<meta property="og:image" content="${escapeHtml(ogImage)}" />
<meta property="og:image:secure_url" content="${escapeHtml(ogImage)}" />
<meta property="og:image:alt" content="${escapeHtml(title)}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:image" content="${escapeHtml(ogImage)}" />`
    : "";

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:site_name" content="${escapeHtml(storeName)}" />
<meta property="og:url" content="${escapeHtml(pageUrl)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
${imageTags}
<meta http-equiv="refresh" content="0; url=${escapeHtml(pageUrl)}" />
</head>
<body>
<a href="${escapeHtml(pageUrl)}">${escapeHtml(title)}</a>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
  res.status(200).send(html);
}