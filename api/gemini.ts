import type { VercelRequest, VercelResponse } from '@vercel/node';

// Serverless proxy to call Google's Generative Language API (Gemini)
// Keeps the API key on the server (do NOT put the key in client-side VITE_ vars)

// Simple in-memory rate limiter (per IP) to avoid abuse. This is best-effort
// and persists only for the lifetime of the serverless instance. For
// production, prefer an external store (Redis) or a managed rate-limiter.
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const RATE_LIMIT_MAX = 20; // max requests per IP per window

type RateEntry = { count: number; reset: number };

function getClientIp(req: VercelRequest) {
  const header = req.headers['x-forwarded-for'];
  if (typeof header === 'string') return header.split(',')[0].trim();
  if (Array.isArray(header)) return header[0];
  return req.socket?.remoteAddress || 'unknown';
}

// store on globalThis so warm instances share the same map across invocations
const globalStoreKey = '__gemini_rate_limiter_v1';
if (!(globalThis as any)[globalStoreKey]) (globalThis as any)[globalStoreKey] = new Map<string, RateEntry>();
const rateStore: Map<string, RateEntry> = (globalThis as any)[globalStoreKey];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Rate limiting
  const ip = getClientIp(req);
  const now = Date.now();
  const entry = rateStore.get(ip) || { count: 0, reset: now + RATE_LIMIT_WINDOW_MS };
  if (now > entry.reset) {
    entry.count = 0;
    entry.reset = now + RATE_LIMIT_WINDOW_MS;
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((entry.reset - now) / 1000);
    res.setHeader('Retry-After', String(retryAfter));
    res.status(429).json({ error: `Rate limit exceeded. Try again in ${retryAfter} seconds.` });
    return;
  }
  entry.count += 1;
  rateStore.set(ip, entry);

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY not configured on server' });
    return;
  }

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'Missing prompt in request body' });
    return;
  }

  try {
    const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

    const payload = {
      contents: [
        {
          parts: [{ text: prompt }],
          role: 'user',
        },
      ],
    };

    const r = await fetch(`${endpoint}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const txt = await r.text();
    if (!r.ok) {
      res.status(r.status).json({ error: txt });
      return;
    }

    const data = JSON.parse(txt);
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
    res.status(200).json({ text, raw: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message || String(err) });
  }
}
