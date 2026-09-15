import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  Zap, 
  RotateCcw, 
  Copy, 
  Check, 
  Layers, 
  Target, 
  Compass, 
  ArrowRight,
  Sliders,
  DollarSign
} from 'lucide-react';
import MountAlgoLogo from './MountAlgoLogo';

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: number;
  tradeSetup?: {
    symbol: string;
    direction: 'BUY' | 'SELL';
    entry: number;
    stopLoss: number;
    takeProfit1: number;
    takeProfit2?: number;
    riskReward?: string;
  } | null;
}

interface AiAgentTerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSymbol?: string;
  currentPrice?: number | null;
  priceChange24h?: number;
  timeframe?: string;
  initialPrompt?: string;
  onApplyTradeSetupToChart?: (setup: any) => void;
}

export const AiAgentTerminalModal: React.FC<AiAgentTerminalModalProps> = ({
  isOpen,
  onClose,
  activeSymbol = 'BTCUSDT',
  currentPrice = 0,
  priceChange24h = 0,
  timeframe = '15m',
  initialPrompt,
  onApplyTradeSetupToChart,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'init-1',
      sender: 'agent',
      text: `### 🤖 Halo Trader, Saya MountAlgo Quant Agent

Saya siap mendampingi eksekusi dan analisis kuantitatif Anda di terminal.
Beberapa hal yang dapat saya bantu secara real-time:
* **Analisis Multi-Timeframe & Price Action**: Identifikasi Order Block dan Liquidity Sweep.
* **Order Flow & Volume Profile**: Membaca serapan (absorption) institusi, delta volume, dan level POC.
* **Korelasi Makro & Berita**: Proyeksi volatilitas rilis kalender ekonomi (CPI, NFP, Fed).
* **Setup Trade Presisi**: Menghitung entry, stop loss terukur, target profit, dan rasio R:R minimal 1:2.

Pilih topik cepat di bawah atau ketikkan pertanyaan Anda.`,
      timestamp: Date.now(),
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Handle initial prompt passed from News or Calendar
  useEffect(() => {
    if (initialPrompt && isOpen) {
      handleSendMessage(initialPrompt);
    }
  }, [initialPrompt, isOpen]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputPrompt;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    if (!customText) setInputPrompt('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/terminal-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend.trim(),
          symbol: activeSymbol,
          price: currentPrice,
          timeframe,
          priceChange24h,
          history: messages.slice(-6).map(m => ({ sender: m.sender, text: m.text }))
        })
      });

      if (response.ok) {
        const data = await response.json();
        const agentMessage: ChatMessage = {
          id: `agt-${Date.now()}`,
          sender: 'agent',
          text: data.reply || "Analisis telah selesai diproses.",
          timestamp: Date.now(),
          tradeSetup: data.tradeSetup || null
        };
        setMessages(prev => [...prev, agentMessage]);
      } else {
        throw new Error('Gagal menghubungi backend AI');
      }
    } catch (err: any) {
      console.warn("AI Agent notice:", err?.message || err);
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'agent',
          text: `⚠️ **Catatan Sistem:** Layanan AI inference mengalami kendala jaringan. Pastikan API key terpasang atau ulangi beberapa saat lagi.`,
          timestamp: Date.now()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickPrompts = [
    { label: "Setup Scalping 15M", prompt: `Buatkan setup trading scalping presisi untuk ${activeSymbol} di timeframe ${timeframe}. Sertakan area entry, stop loss ketat, TP1, TP2, dan rasio R:R.` },
    { label: "Analisis Order Flow & S/R", prompt: `Analisis struktur support resistance kunci dan potensi serapan likuiditas (liquidity sweep) pada pasangan ${activeSymbol}.` },
    { label: "Dampak Makro & Berita", prompt: `Bagaimana korelasi jadwal rilis kalender ekonomi makro terkini terhadap aset ${activeSymbol}? Apa rekomendasi mitigasi resiko sebelum news rilis?` },
    { label: "Kalkulasi Resiko 1%", prompt: `Hitung position sizing ideal untuk akun $10,000 dengan resiko maksimal 1% per trade pada ${activeSymbol} di harga $${currentPrice}.` },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10002] flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      {/* Dark Glassmorphic Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
        onClick={onClose}
      />

      {/* Main Terminal Container */}
      <div 
        className="relative w-full max-w-4xl h-[90vh] max-h-[820px] bg-gradient-to-b from-[#090d18]/95 via-[#060810]/95 to-[#04050a]/95 border border-cyan-500/40 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_35px_rgba(6,182,212,0.2)] flex flex-col overflow-hidden text-white font-sans backdrop-blur-2xl pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/10 bg-gradient-to-r from-cyan-950/40 via-transparent to-blue-950/40">
          <div className="flex items-center gap-3">
            <div className="relative">
              <MountAlgoLogo size="sm" showGlow className="w-8 h-8" />
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-black animate-ping" />
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-black" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wide font-mono text-white flex items-center gap-1.5">
                  MOUNTALGO
                  <span className="text-cyan-400 font-extrabold">QUANT AGENT</span>
                </h2>
                <span className="text-[9.5px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 flex items-center gap-1">
                  <Zap size={10} className="fill-current text-cyan-400" />
                  GEMINI 3.8 FLASH
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium">
                Terminal Kecerdasan Kuantitatif & Strategi Order Flow Presisi
              </p>
            </div>
          </div>

          {/* Right Live Context Badge & Close Button */}
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-xs font-mono">
              <span className="font-black text-cyan-300">{activeSymbol}</span>
              <span className="text-zinc-500">·</span>
              <span className="text-white font-bold">${currentPrice ? currentPrice.toLocaleString() : 'N/A'}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${priceChange24h >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                {priceChange24h >= 0 ? '+' : ''}{priceChange24h}%
              </span>
            </div>

            <button
              onClick={() => setMessages([messages[0]])}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Bersihkan Percakapan"
            >
              <RotateCcw size={14} />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/40 text-zinc-400 hover:text-rose-300 transition-colors cursor-pointer"
              title="Tutup Modal"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Quick Suggestion Chips Bar */}
        <div className="px-4 sm:px-6 py-2 bg-black/40 border-b border-white/10 flex items-center gap-2 overflow-x-auto hide-scrollbar">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-bold shrink-0">
            Quick Prompts:
          </span>
          {quickPrompts.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(item.prompt)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-cyan-500/20 hover:border-cyan-500/40 border border-white/10 text-[11px] font-mono text-zinc-300 hover:text-cyan-300 transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <Sparkles size={11} className="text-cyan-400" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Messages Stream */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {/* Agent Avatar */}
              {msg.sender === 'agent' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shrink-0 shadow-md border border-cyan-400/40">
                  <Bot size={18} />
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-xs font-sans leading-relaxed backdrop-blur-md transition-all ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-br from-cyan-600 to-blue-700 text-white rounded-tr-none shadow-lg'
                    : 'bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 text-zinc-200 rounded-tl-none shadow-xl'
                }`}
              >
                {/* Content with simple Markdown parser */}
                <div className="space-y-2 whitespace-pre-wrap font-sans text-[12.5px] leading-relaxed">
                  {msg.text}
                </div>

                {/* Structured Trade Setup Card if generated */}
                {msg.tradeSetup && (
                  <div className="mt-3.5 p-3 rounded-xl bg-black/60 border border-cyan-500/30 text-xs font-mono space-y-2">
                    <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded font-black text-[10px] ${
                          msg.tradeSetup.direction === 'BUY' 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}>
                          {msg.tradeSetup.direction} SETUP
                        </span>
                        <span className="font-bold text-white">{msg.tradeSetup.symbol}</span>
                      </div>

                      {msg.tradeSetup.riskReward && (
                        <span className="text-[10px] text-cyan-300 font-bold">
                          R:R {msg.tradeSetup.riskReward}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[10.5px]">
                      <div className="p-1.5 rounded bg-white/5">
                        <div className="text-zinc-500 text-[9px]">AREA ENTRY</div>
                        <div className="font-bold text-white">${msg.tradeSetup.entry?.toFixed(2)}</div>
                      </div>
                      <div className="p-1.5 rounded bg-rose-950/30 border border-rose-500/20">
                        <div className="text-rose-400 text-[9px]">STOP LOSS</div>
                        <div className="font-bold text-rose-300">${msg.tradeSetup.stopLoss?.toFixed(2)}</div>
                      </div>
                      <div className="p-1.5 rounded bg-emerald-950/30 border border-emerald-500/20">
                        <div className="text-emerald-400 text-[9px]">TARGET PROFIT</div>
                        <div className="font-bold text-emerald-300">${msg.tradeSetup.takeProfit1?.toFixed(2)}</div>
                      </div>
                    </div>

                    {/* Action button */}
                    {onApplyTradeSetupToChart && (
                      <button
                        onClick={() => onApplyTradeSetupToChart(msg.tradeSetup)}
                        className="w-full mt-1 py-1.5 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-black text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <Target size={12} />
                        <span>Tandai Level di Chart</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Footer with Timestamp & Copy */}
                <div className="flex items-center justify-between pt-2 mt-2 border-t border-white/5 text-[10px] text-zinc-400 font-mono">
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <button
                    onClick={() => handleCopyText(msg.id, msg.text)}
                    className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {copiedId === msg.id ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                    <span>{copiedId === msg.id ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
              </div>

              {/* User Avatar */}
              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center text-white shrink-0">
                  <User size={16} />
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shrink-0">
                <Bot size={18} />
              </div>
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2 text-xs font-mono text-cyan-300">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="ml-1">Quant Agent sedang menganalisis data order flow & berita...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-black/60 border-t border-white/10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder={`Tanyakan analisis setup, order flow, atau kalender berita untuk ${activeSymbol}...`}
                disabled={isLoading}
                className="w-full bg-white/[0.05] border border-white/15 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs font-mono text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all backdrop-blur-md pr-10"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !inputPrompt.trim()}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs font-mono transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-[0_0_20px_rgba(6,182,212,0.3)] shrink-0 active:scale-95"
            >
              <Send size={14} />
              <span className="hidden sm:inline">Kirim</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AiAgentTerminalModal;
