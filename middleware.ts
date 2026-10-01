// FILE: middleware.ts
export const config = {
  matcher: ["/", "/shop", "/categories", "/about", "/contact", "/privacy", "/terms", "/shipping-returns", "/disclaimer", "/cookies", "/blog", "/blog/:slug", "/section/:slug*", "/product/:slug*"],
};

// Social / link-preview crawlers. Googlebot is handled separately: it renders JS, so it only gets
// the product stub (existing behaviour) and never a stub for the homepage or section pages.
const SOCIAL_UA = /facebookexternalhit|Twitterbot|WhatsApp|LinkedInBot|Slackbot|TelegramBot|Discordbot|SkypeUriPreview|vkShare|Pinterest|redditbot/i;
const GOOGLE_UA = /Googlebot/i;
// Blog pages get full server-rendered HTML for Google's crawlers (incl. the AdSense reviewer).
const BLOG_GOOGLE_UA = /Googlebot|Mediapartners-Google|AdsBot-Google|Google-InspectionTool/i;

export default async function middleware(request: Request) {
  const ua = request.headers.get("user-agent") || "";
  const url = new URL(request.url);
  const isProduct = url.pathname.startsWith("/product/");
  const isBlog = url.pathname === "/blog" || url.pathname.startsWith("/blog/");

  const isBot = isProduct
    ? SOCIAL_UA.test(ua) || GOOGLE_UA.test(ua)
    : isBlog
      ? SOCIAL_UA.test(ua) || BLOG_GOOGLE_UA.test(ua)
      : SOCIAL_UA.test(ua);
  if (!isBot) {
    return; // real visitors fall through to the normal SPA rewrite
  }

  let metaUrl: URL;
  if (isProduct) {
    const slug = url.pathname.split("/").filter(Boolean).pop() || "";
    metaUrl = new URL(`/api/product-meta?slug=${encodeURIComponent(slug)}`, url.origin);
  } else if (isBlog) {
    metaUrl = new URL(`/api/blog-ssr?path=${encodeURIComponent(url.pathname)}`, url.origin);
  } else {
    metaUrl = new URL(`/api/page-meta?path=${encodeURIComponent(url.pathname)}`, url.origin);
  }

  try {
    const upstream = await fetch(metaUrl.toString());
    if (!upstream.ok) return; // fall through to the SPA instead of serving an error page
    const body = await upstream.text();
    return new Response(body, {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  } catch {
    return;
  }
}