/**
 * Simple Gemini REST client.
 * Reads API key from Vite env: VITE_GEMINI_API_KEY.
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export async function generateGeminiResponse(prompt: string, apiKey?: string): Promise<string> {
  const key = apiKey || import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) {
    return 'AI tidak aktif: VITE_GEMINI_API_KEY belum dikonfigurasi.';
  }

  const payload = {
    contents: [
      {
        parts: [{ text: prompt }],
        role: 'user',
      },
    ],
  };

  const res = await fetch(`${GEMINI_API_URL}?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Gemini API error: ${res.status} ${txt}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return text || 'Tidak ada respons dari AI.';
}

export function buildRouteAwarePrompt(routeSummary: string, userMessage: string) {
  return `Anda adalah asisten pariwisata budaya Indonesia. Gunakan ringkasan rute berikut sebagai konteks dan berikan saran kuliner, budaya, dan tips lokal yang relevan.

RINGKASAN RUTE:
${routeSummary}

PERTANYAAN PENGGUNA:
${userMessage}`;
}
