// FILE: api/geo.mjs  (returns the visitor's country from Vercel's edge header)
export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({ country: String(req.headers["x-vercel-ip-country"] || "") });
}