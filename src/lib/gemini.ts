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
      
      // Handle specific error codes with user-friendly messages
      if (res.status === 503) {
        throw new Error('Maaf, server Gemini AI sedang sibuk. Coba lagi dalam beberapa saat ya! 🙏');
      }
      if (res.status === 429) {
        throw new Error('Terlalu banyak permintaan. Tunggu sebentar ya! ⏳');
      }
      if (res.status === 500) {
        throw new Error('Server sedang bermasalah. Coba lagi nanti ya! 😅');
      }
      
      throw new Error(`Gemini proxy error: ${res.status} ${txt}`);
    }

    const data = await res.json();
    return data.text || 'Tidak ada respons dari AI.';
  } catch (err: any) {
    console.error('Error calling Gemini proxy:', err);
    
    // Re-throw user-friendly messages as-is
    if (err.message?.includes('Maaf') || err.message?.includes('Terlalu') || err.message?.includes('Server')) {
      throw err;
    }
    
    // Network errors
    if (err.name === 'TypeError' && err.message?.includes('fetch')) {
      throw new Error('Koneksi internet bermasalah. Cek koneksi kamu ya! 📡');
    }
    
    throw err;
  }
}

export function buildRouteAwarePrompt(routeSummary: string, userMessage: string) {
  return `Anda adalah asisten pariwisata budaya Indonesia yang ramah dan singkat. 

INSTRUKSI PENTING:
- Jawab dengan SINGKAT dan LANGSUNG ke intinya (maksimal 3-4 kalimat)
- Gunakan bahasa Indonesia yang casual dan mudah dipahami
- JANGAN gunakan format Markdown (*, #, --, bullet points, dll)
- Tulis dalam paragraf biasa, gunakan emoji sesekali untuk friendly tone
- Fokus pada informasi praktis dan berguna

RINGKASAN RUTE:
${routeSummary}

PERTANYAAN PENGGUNA:
${userMessage}`;
}
