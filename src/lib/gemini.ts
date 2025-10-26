/**
 * Simple Gemini REST client.
 * Reads API key from Vite env: VITE_GEMINI_API_KEY.
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Using gemini-1.5-flash-latest for the latest stable version
// Client-side wrapper: call the serverless /api/gemini proxy which keeps the API key secret
export async function generateGeminiResponse(prompt: string): Promise<string> {
  try {
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Gemini proxy error: ${res.status} ${txt}`);
    }

    const data = await res.json();
    return data.text || 'Tidak ada respons dari AI.';
  } catch (err: any) {
    console.error('Error calling Gemini proxy:', err);
    throw err;
  }
}

export function buildRouteAwarePrompt(routeSummary: string, userMessage: string) {
  return `Anda adalah asisten pariwisata budaya Indonesia. Gunakan ringkasan rute berikut sebagai konteks dan berikan saran kuliner, budaya, dan tips lokal yang relevan.

RINGKASAN RUTE:
${routeSummary}

PERTANYAAN PENGGUNA:
${userMessage}`;
}
