// FILE: middleware.ts
export const config = {
  matcher: "/product/:slug*",
};

const BOT_UA = /facebookexternalhit|Twitterbot|WhatsApp|LinkedInBot|Slackbot|TelegramBot|Discordbot|SkypeUriPreview|Googlebot|vkShare|Pinterest|redditbot/i;

export default async function middleware(request: Request) {
  const ua = request.headers.get("user-agent") || "";
  if (!BOT_UA.test(ua)) {
    return; // real visitors fall through to the normal SPA rewrite
  }

  const url = new URL(request.url);
  const slug = url.pathname.split("/").filter(Boolean).pop() || "";
  const metaUrl = new URL(`/api/product-meta?slug=${encodeURIComponent(slug)}`, url.origin);

  const upstream = await fetch(metaUrl.toString());
  const body = await upstream.text();

  return new Response(body, {
    status: upstream.status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}