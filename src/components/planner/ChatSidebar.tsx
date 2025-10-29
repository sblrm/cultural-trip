import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { generateGeminiResponse, buildRouteAwarePrompt } from '@/lib/gemini';
import { Send, Bot, User, Sparkles, MessageCircle, X, Minimize2 } from 'lucide-react';
import type { Route } from '@/services/routePlanner';

type Message = { 
  role: 'user' | 'assistant'; 
  content: string;
  timestamp: Date;
};

function summarizeRoute(route: Route | null): string {
  if (!route) return 'Belum ada rute.';
  const lines: string[] = [];
  lines.push(`Total jarak: ${route.totalDistance.toFixed(2)} km, estimasi waktu: ${route.totalDuration} menit, estimasi biaya: Rp ${route.totalCost.toLocaleString('id-ID')}`);
  route.nodes.forEach((n, i) => {
    lines.push(`${i + 1}. ${n.destination.name} (${n.destination.location.city}, ${n.destination.location.province}) - ${n.distance.toFixed(2)} km`);
  });
  return lines.join('\n');
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatSidebar({ route }: { route: Route | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'Hai! Aku Tavo, asisten perjalananmu! Tanyakan apa saja tentang rute ini: makanan lokal, alternatif destinasi, estimasi biaya, atau tips transportasi.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    
    const userMessage: Message = {
      role: 'user',
      content: text,
      timestamp: new Date()
    };
    
    setMessages((m) => [...m, userMessage]);
    setInput('');
    setSending(true);
    
    try {
      const summary = summarizeRoute(route);
      const prompt = buildRouteAwarePrompt(summary, text);
      const reply = await generateGeminiResponse(prompt);
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: reply,
        timestamp: new Date()
      };
      
      setMessages((m) => [...m, assistantMessage]);
    } catch (e: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: e?.message || 'Maaf, terjadi kesalahan memanggil AI.',
        timestamp: new Date()
      };
      setMessages((m) => [...m, errorMessage]);
    } finally {
      setSending(false);
    }
  };

  // Auto scroll to bottom when messages update
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      setTimeout(() => {
        el.scrollTop = el.scrollHeight;
      }, 100);
    }
  }, [messages]);

  return (
    <>
      {/* Floating Chat Button - Bottom Right */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40">
          <Button
            onClick={() => setIsOpen(true)}
            size="lg"
            className="h-14 w-14 rounded-full shadow-2xl hover:scale-110 transition-transform bg-gradient-to-r from-primary to-primary/80 animate-pulse"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
          {/* Notification Badge */}
          <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold border-2 border-white">
            1
          </div>
        </div>
      )}

      {/* Chat Window - Responsive: Full screen mobile, Floating desktop */}
      {isOpen && (
        <div className={`fixed z-50 shadow-2xl transition-all
          ${isMinimized 
            ? 'bottom-6 right-6 w-80 md:w-80' 
            : 'inset-0 md:inset-auto md:bottom-6 md:right-6 md:w-96 md:h-[600px]'
          }`}>
          <Card className={`flex flex-col border-2 h-full ${isMinimized ? 'md:h-auto' : ''} rounded-none md:rounded-lg`}>
            <CardContent className="p-0 h-full flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-4 py-3 flex items-center gap-3 rounded-t-none md:rounded-t-lg">
                <div className="relative">
                  <Avatar className="h-10 w-10 border-2 border-white">
                    <AvatarImage src="/images/tavo-avatar.png" alt="Tavo" />
                    <AvatarFallback className="bg-white text-primary">
                      <Bot className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div className="flex-1">
                  <div className="font-semibold flex items-center gap-2">
                    Tavo
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="text-xs opacity-90">AI Travel Assistant</div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary-foreground hover:bg-white/20 hidden md:flex"
                    onClick={() => setIsMinimized(!isMinimized)}
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary-foreground hover:bg-white/20"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Messages - Hidden when minimized */}
              {!isMinimized && (
                <>
                  <div 
                    ref={scrollRef} 
                    className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-muted/20 to-background"
                  >
                    {messages.map((m, idx) => (
                      <div 
                        key={idx} 
                        className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        {/* Avatar */}
                        <Avatar className="h-8 w-8 shrink-0">
                          {m.role === 'assistant' ? (
                            <>
                              <AvatarImage src="/images/tavo-avatar.png" alt="Tavo" />
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                <Bot className="h-4 w-4" />
                              </AvatarFallback>
                            </>
                          ) : (
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          )}
                        </Avatar>

                        {/* Message Bubble */}
                        <div className={`flex flex-col gap-1 max-w-[85%] md:max-w-[80%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                          <div 
                            className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                              m.role === 'user' 
                                ? 'bg-primary text-primary-foreground rounded-tr-none' 
                                : 'bg-card border border-border rounded-tl-none'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words leading-relaxed">
                              {m.content}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground px-2">
                            {formatTime(m.timestamp)}
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    {/* Typing Indicator */}
                    {sending && (
                      <div className="flex gap-2">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-card border border-border rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input Area */}
                  <div className="border-t bg-card p-3 md:p-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ketik pesan..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => { 
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                        disabled={sending}
                        className="flex-1 rounded-full border-2 focus-visible:ring-primary min-h-[44px]"
                      />
                      <Button 
                        onClick={handleSend} 
                        disabled={sending || !input.trim()}
                        size="icon"
                        className="rounded-full h-11 w-11 md:h-10 md:w-10 shrink-0"
                      >
                        <Send className="h-5 w-5 md:h-4 md:w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Powered by Gemini AI
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
