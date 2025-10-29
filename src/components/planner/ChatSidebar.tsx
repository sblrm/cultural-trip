import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { generateGeminiResponse, buildRouteAwarePrompt } from '@/lib/gemini';
import type { Route } from '@/services/routePlanner';

type Message = { role: 'user' | 'assistant'; content: string };

function summarizeRoute(route: Route | null): string {
  if (!route) return 'Belum ada rute.';
  const lines: string[] = [];
  lines.push(`Total jarak: ${route.totalDistance.toFixed(2)} km, estimasi waktu: ${route.totalDuration} menit, estimasi biaya: Rp ${route.totalCost.toLocaleString('id-ID')}`);
  route.nodes.forEach((n, i) => {
    lines.push(`${i + 1}. ${n.destination.name} (${n.destination.location.city}, ${n.destination.location.province}) - ${n.distance.toFixed(2)} km`);
  });
  return lines.join('\n');
}

export default function ChatSidebar({ route }: { route: Route | null }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hai! Aku Tavo, asisten perjalananmu! Tanyakan apa saja tentang rute ini: makanan lokal, alternatif destinasi, estimasi biaya, atau tips transportasi.' }
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setInput('');
    setSending(true);
    try {
      const summary = summarizeRoute(route);
      const prompt = buildRouteAwarePrompt(summary, text);
      const reply = await generateGeminiResponse(prompt);
      setMessages((m) => [...m, { role: 'assistant', content: reply }]);
    } catch (e: any) {
      setMessages((m) => [...m, { role: 'assistant', content: e?.message || 'Maaf, terjadi kesalahan memanggil AI.' }]);
    } finally {
      setSending(false);
    }
  };

  // Auto scroll to bottom when messages update
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  return (
    <Card className="h-[75vh] max-h-[75vh] flex flex-col sticky top-4">
      <CardContent className="p-0 h-full flex flex-col">
        <div className="border-b p-4 font-semibold">Tavo</div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, idx) => (
            <div key={idx} className={m.role === 'user' ? 'text-right' : ''}>
              <div className={`inline-block rounded-lg px-3 py-2 text-sm ${m.role==='user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                {m.content}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t p-3 flex gap-2">
          <Input
            placeholder="Tanyakan tentang rute..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
          />
          <Button onClick={handleSend} disabled={sending}>{sending ? 'Mengirim...' : 'Kirim'}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
