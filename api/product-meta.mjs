// FILE: api/product-meta.mjs
const PROJECT_ID = "my-shop-84749";
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const SITE_ORIGIN = "https://karibu.fit";
const CURRENCY_SYMBOL = "FRW";

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

async function fetchProduct(slug) {
  const byId = await fetch(`${FIRESTORE_BASE}/products/${encodeURIComponent(slug)}`);
  if (byId.ok) {
    const doc = await byId.json();
    return parseFields(doc.fields || {});
  }

  const query = {
    structuredQuery: {
      from: [{ collectionId: "products" }],
      where: {
        fieldFilter: {
          field: { fieldPath: "slug" },
          op: "EQUAL",
          value: { stringValue: slug },
        },
      },
      limit: 1,
    },
  };
  const res = await fetch(`${FIRESTORE_BASE}:runQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(query),
  });
  if (!res.ok) return null;
  const rows = await res.json();
  const match = rows.find((r) => r.document);
  return match ? parseFields(match.document.fields || {}) : null;
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

export default async function handler(req, res) {
  const slug = String(req.query.slug || "").trim();
  const pageUrl = `${SITE_ORIGIN}/product/${encodeURIComponent(slug)}`;

  const product = slug ? await fetchProduct(slug).catch(() => null) : null;

  if (!product) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(
      "<!doctype html><html><head><title>My Shop</title>" +
      '<meta property="og:title" content="My Shop" />' +
      "</head><body>Redirecting…<script>location.href=" + JSON.stringify(pageUrl) + ";</script></body></html>"
    );
    return;
  }

  const name = product.name || "Product";
  const price = typeof product.price === "number" ? product.price : 0;
  const priceLabel = `${CURRENCY_SYMBOL} ${Math.round(price).toLocaleString("en-RW")}`;
  const image = Array.isArray(product.images) && product.images[0] ? product.images[0] : "";
  const description = product.shortDescription || product.description || "Shop this on My Shop.";

  const ogImageUrl = `${SITE_ORIGIN}/api/og?` + new URLSearchParams({ name, price: priceLabel, image }).toString();

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(name)} — My Shop</title>
<meta property="og:type" content="product" />
<meta property="og:title" content="${escapeHtml(name)} — ${escapeHtml(priceLabel)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:image" content="${escapeHtml(ogImageUrl)}" />
<meta property="og:image:width" content="1080" />
<meta property="og:image:height" content="1080" />
<meta property="og:url" content="${escapeHtml(pageUrl)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta http-equiv="refresh" content="0; url=${escapeHtml(pageUrl)}" />
</head>
<body>
<a href="${escapeHtml(pageUrl)}">${escapeHtml(name)}</a>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate");
  res.status(200).send(html);
}