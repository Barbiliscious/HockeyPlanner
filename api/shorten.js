/* global process */

const SHORTIO_API_URL = "https://api.short.io/links";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const apiKey = process.env.SHORTIO_API_KEY;
  const domain = process.env.SHORTIO_DOMAIN;

  if (!apiKey || !domain) {
    return res.status(500).json({ error: "Short link service is not configured." });
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  } catch {
    return res.status(400).json({ error: "Invalid request body." });
  }

  const { url } = body;

  if (!url) {
    return res.status(400).json({ error: "No URL provided." });
  }

  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: "Invalid URL provided." });
  }

  try {
    const response = await fetch(SHORTIO_API_URL, {
      method: "POST",
      headers: {
        authorization: apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        originalURL: url,
        domain,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(502).json({ error: data.message || "Short.io could not create a short link." });
    }

    if (!data.shortURL) {
      return res.status(502).json({ error: "Short.io did not return a short link." });
    }

    return res.status(200).json({ shortURL: data.shortURL });
  } catch {
    return res.status(500).json({ error: "Could not create short link." });
  }
}
