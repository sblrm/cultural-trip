export interface EmailPayload {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  meta?: Record<string, unknown>;
}

/**
 * Send email notification via external API.
 * If VITE_EMAIL_API_URL is not provided, this becomes a no-op.
 */
export async function sendEmailNotification(payload: EmailPayload): Promise<{ ok: boolean; skipped?: boolean }>{
  const url = import.meta.env.VITE_EMAIL_API_URL as string | undefined;
  const apiKey = import.meta.env.VITE_EMAIL_API_KEY as string | undefined;

  if (!url) {
    // No endpoint configured; silently skip
    return { ok: true, skipped: true };
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Email API error: ${res.status} ${body}`);
    }
    return { ok: true };
  } catch (err) {
    // Swallow errors to avoid breaking UX; log for diagnostics
    console.error('sendEmailNotification failed', err);
    return { ok: false };
  }
}
