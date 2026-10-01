// FILE: api/blog-ssr.mjs
// GET /api/blog-ssr?path=/blog  or  ?path=/blog/<slug>
// Crawler-only server-rendered HTML for the blog (middleware.ts sends bots here; shoppers get the SPA).
const PROJECT_ID = "my-shop-84749";
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const SITE_ORIGIN = "https://karibu.fit";
const NAV = [["/", "Home"], ["/shop", "Shop"], ["/categories", "Categories"], ["/blog", "Blog"], ["/about", "About"], ["/contact", "Contact"]];
const LEGAL = [["/privacy", "Privacy Policy"], ["/terms", "Terms"], ["/shipping-returns", "Shipping & Returns"], ["/disclaimer", "Disclaimer"], ["/cookies", "Cookies"]];

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
  for (const k of Object.keys(fields || {})) out[k] = fv(fields[k]);
  return out;
}
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

async function fetchStore() {
  const r = await fetch(`${FIRESTORE_BASE}/settings/store`, { signal: AbortSignal.timeout(5000) });
  if (!r.ok) return null;
  return parseFields((await r.json()).fields || {});
}
async function runQuery(structuredQuery) {
  const r = await fetch(`${FIRESTORE_BASE}:runQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ structuredQuery }),
    signal: AbortSignal.timeout(6000),
  });
  if (!r.ok) return [];
  const rows = await r.json();
  return rows.filter((x) => x.document).map((x) => parseFields(x.document.fields || {}));
}
const PUBLISHED = { fieldFilter: { field: { fieldPath: "published" }, op: "EQUAL", value: { booleanValue: true } } };

function renderBody(body) {
  return String(body || "").split(/\n{2,}/).map((block) => {
    const t = block.trim();
    if (!t) return "";
    if (t.startsWith("## ")) return `<h2>${esc(t.slice(3))}</h2>`;
    const lines = t.split("\n");
    if (lines.every((l) => l.startsWith("- "))) return "<ul>" + lines.map((l) => `<li>${esc(l.slice(2))}</li>`).join("") + "</ul>";
    return `<p>${esc(t)}</p>`;
  }).join("\n");
}

function layout({ storeName, title, description, canonical, ogType, image, jsonLd, main }) {
  const nav = NAV.map(([h, l]) => `<a href="${h}">${esc(l)}</a>`).join(" &middot; ");
  const legal = LEGAL.map(([h, l]) => `<a href="${h}">${esc(l)}</a>`).join(" &middot; ");
  const ld = jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>` : "";
  const img = image ? `<meta property="og:image" content="${esc(image)}" />\n<meta name="twitter:image" content="${esc(image)}" />` : "";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${esc(canonical)}" />
<meta property="og:type" content="${ogType}" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:site_name" content="${esc(storeName)}" />
<meta property="og:url" content="${esc(canonical)}" />
<meta name="twitter:card" content="summary_large_image" />
${img}
${ld}
</head>
<body style="font-family:system-ui,sans-serif;max-width:720px;margin:0 auto;padding:24px;color:#171614;line-height:1.6">
<header><a href="/" style="font-weight:700;font-size:20px;color:inherit;text-decoration:none">${esc(storeName)}</a>
<nav style="margin-top:8px">${nav}</nav></header>
<main>
${main}
</main>
<footer style="margin-top:32px;font-size:13px">${legal}</footer>
</body>
</html>`;
}

export default async function handler(req, res) {
  let path = String(req.query.path || "/blog").trim().replace(/\/+$/, "") || "/blog";
  res.setHeader("Content-Type", "text/html; charset=utf-8");

  const store = (await fetchStore().catch(() => null)) || {};
  const storeName = store.storeName || "My Shop";

  if (path === "/blog") {
    const posts = (await runQuery({ from: [{ collectionId: "posts" }], where: PUBLISHED, limit: 200 }).catch(() => []))
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const items = posts.map((p) => `<article style="margin:24px 0">
<h2 style="margin:0 0 4px"><a href="/blog/${encodeURIComponent(p.slug)}">${esc(p.title)}</a></h2>
<p style="margin:0">${esc(p.excerpt)}</p></article>`).join("\n");
    const html = layout({
      storeName,
      title: `Blog \u2014 ${storeName}`,
      description: `Practical guides on fit, fabric care and styling from ${storeName}.`,
      canonical: `${SITE_ORIGIN}/blog`,
      ogType: "website",
      image: posts[0]?.cover || "",
      main: `<h1>Blog</h1>\n<p>Practical guides on fit, fabric care and styling.</p>\n${items}`,
    });
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
    return res.status(200).send(html);
  }

  const m = path.match(/^\/blog\/([^/]+)$/);
  let slug = "";
  try { slug = m ? decodeURIComponent(m[1]) : ""; } catch { slug = ""; }
  const rows = slug
    ? await runQuery({
        from: [{ collectionId: "posts" }],
        where: { compositeFilter: { op: "AND", filters: [PUBLISHED, { fieldFilter: { field: { fieldPath: "slug" }, op: "EQUAL", value: { stringValue: slug } } }] } },
        limit: 1,
      }).catch(() => [])
    : [];
  const p = rows[0];
  if (!p) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(404).send("Not found");
  }
  const canonical = `${SITE_ORIGIN}/blog/${encodeURIComponent(p.slug)}`;
  const iso = (t) => (t ? new Date(t).toISOString() : undefined);
  const html = layout({
    storeName,
    title: `${p.title} \u2014 ${storeName}`,
    description: p.excerpt || "",
    canonical,
    ogType: "article",
    image: p.cover || "",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: p.title,
      description: p.excerpt || "",
      image: p.cover || undefined,
      datePublished: iso(p.createdAt),
      dateModified: iso(p.updatedAt || p.createdAt),
      mainEntityOfPage: canonical,
      author: { "@type": "Organization", name: storeName },
      publisher: { "@type": "Organization", name: storeName, url: SITE_ORIGIN + "/" },
    },
    main: `<p><a href="/blog">&larr; All articles</a></p>
<article>
<h1>${esc(p.title)}</h1>
<p>By the ${esc(storeName)} editorial team</p>
${p.cover ? `<img src="${esc(p.cover)}" alt="${esc(p.title)}" style="max-width:100%;height:auto" />` : ""}
${renderBody(p.body)}
</article>`,
  });
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
  return res.status(200).send(html);
}