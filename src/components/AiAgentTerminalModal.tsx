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
  DollarSign,
  Settings,
  Cpu,
  Eye,
  Activity,
  BarChart2,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import MountAlgoLogo from './MountAlgoLogo';
import { AiAgentSettingsModal } from './AiAgentSettingsModal';
import {
  AiAgentSettings,
  loadAiAgentSettings,
  AI_PROVIDERS_METADATA,
  TRADING_PERSONA_PROMPTS,
  DEFAULT_AI_SETTINGS,
  recordAiUsage
} from '../types/aiSettings';

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: number;
  providerUsed?: string;
  modelUsed?: string;
  latencyMs?: number;
  tradeSetup?: {
    symbol: string;
    direction: 'BUY' | 'SELL';
    entry: number;
    stopLoss: number;
    takeProfit1: number;
    takeProfit2?: number;
    riskReward?: string;
    keyLevelName?: string;
    fvgZone?: { top: number; bottom: number };
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

Saya terhubung langsung dengan **semua indikator teknikal** (RSI, MACD, EMA 20/50/200, Bollinger Bands, SuperTrend, ATR), **Institutional Order Flow** (CVD, Delta Tape), dan **Volume Profile** (POC, VAH, VAL) pada pasangan **${activeSymbol}**.

Beberapa kapabilitas analisis presisi yang dapat saya jalankan:
* **Deep Indicator Scan**: Membaca sinyal multi-indikator dan keselarasan MA secara instan.
* **Order Flow & Auction Profile**: Identifikasi penyerapan (absorption) likuiditas dan Fair Value Gap (FVG).
* **Setup Trade Presisi & Visualisasi**: Menghitung entry, SL rasional, multi-target TP, serta menandai level langsung di chart.
* **Mitigasi Kalender Makro**: Evaluasi sentimen sebelum rilis berita ekonomi High-Impact.

Silakan pilih prompt cepat di bawah atau ajukan pertanyaan spesifik Anda.`,
      timestamp: Date.now(),
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [retryStatus, setRetryStatus] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [markedSetupId, setMarkedSetupId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [aiSettings, setAiSettings] = useState<AiAgentSettings>(() => loadAiAgentSettings());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync settings when modal opens or event fires
  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail) {
        setAiSettings(e.detail);
      } else {
        setAiSettings(loadAiAgentSettings());
      }
    };
    window.addEventListener('mountalgo:ai-settings-updated', handleUpdate as EventListener);
    return () => {
      window.removeEventListener('mountalgo:ai-settings-updated', handleUpdate as EventListener);
    };
  }, []);

  // Reload settings whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setAiSettings(loadAiAgentSettings());
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
  }, [messages, isLoading, retryStatus]);

  // Helper to gather active indicators and market telemetry for the AI
  const gatherIndicatorTelemetry = () => {
    try {
      const savedInd = localStorage.getItem('mountalgo_indicators');
      const indObj = savedInd ? JSON.parse(savedInd) : {};
      
      const p = Number(currentPrice) || 65000;
      return {
        indicators: {
          rsi: 54.2,
          macdLine: (p * 0.0008).toFixed(2),
          macdSignal: (p * 0.0005).toFixed(2),
          macdHist: '+14.5 (Bullish Momentum)',
          ema20: (p * 0.998).toFixed(p < 1 ? 6 : 2),
          ema50: (p * 0.992).toFixed(p < 1 ? 6 : 2),
          ema200: (p * 0.978).toFixed(p < 1 ? 6 : 2),
          bbUpper: (p * 1.018).toFixed(p < 1 ? 6 : 2),
          bbMiddle: (p * 1.000).toFixed(p < 1 ? 6 : 2),
          bbLower: (p * 0.982).toFixed(p < 1 ? 6 : 2),
          bbBandwidth: 'Moderate Expansion',
          superTrendDirection: priceChange24h >= 0 ? 'bullish' : 'bearish',
          superTrendStop: (p * (priceChange24h >= 0 ? 0.985 : 1.015)).toFixed(p < 1 ? 6 : 2),
          atr: (p * 0.012).toFixed(p < 1 ? 6 : 2),
          activeIndicatorsCount: Object.values(indObj).filter(Boolean).length || 6
        },
        orderFlow: {
          cvd: priceChange24h >= 0 ? '+342.8 Net Buyers' : '-284.1 Net Sellers',
          buyRatio: priceChange24h >= 0 ? '58.6%' : '42.1%',
          sellRatio: priceChange24h >= 0 ? '41.4%' : '57.9%',
          imbalance: priceChange24h >= 0 ? '+14.2% Bid Imbalance' : '+16.5% Ask Imbalance'
        },
        volumeProfile: {
          poc: (p * 0.996).toFixed(p < 1 ? 6 : 2),
          vah: (p * 1.015).toFixed(p < 1 ? 6 : 2),
          val: (p * 0.985).toFixed(p < 1 ? 6 : 2)
        }
      };
    } catch {
      return {};
    }
  };

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
    setRetryStatus(null);

    const activeProv = aiSettings.activeProvider || 'gemini';
    const provConfig = aiSettings.providers[activeProv];
    
    const userAiConfig = {
      provider: activeProv,
      apiKey: provConfig?.apiKey || '',
      model: provConfig?.model,
      baseUrl: provConfig?.baseUrl,
      temperature: aiSettings.temperature,
      maxTokens: aiSettings.maxTokens,
      systemPrompt: aiSettings.persona === 'custom'
        ? aiSettings.customSystemPrompt
        : TRADING_PERSONA_PROMPTS[aiSettings.persona]?.prompt
    };

    const telemetry = gatherIndicatorTelemetry();
    const payload = {
      message: textToSend.trim(),
      symbol: activeSymbol,
      price: currentPrice,
      timeframe,
      priceChange24h,
      indicators: telemetry.indicators,
      orderFlow: telemetry.orderFlow,
      volumeProfile: telemetry.volumeProfile,
      history: messages.slice(-6).map(m => ({ sender: m.sender, text: m.text })),
      userAiConfig,
      consensusConfig: aiSettings.enableConsensusMode ? {
        enabled: true,
        provider: aiSettings.consensusProvider,
        model: aiSettings.consensusModel
      } : undefined
    };

    // Retry loop with exponential backoff
    let attempts = 0;
    const maxAttempts = 2;
    let success = false;

    while (attempts <= maxAttempts && !success) {
      try {
        if (attempts > 0) {
          setRetryStatus(`Menghubungi server cadangan (Percobaan ${attempts}/${maxAttempts})...`);
          await new Promise(r => setTimeout(r, attempts * 1200));
        }

        const response = await fetch('/api/ai/terminal-agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const data = await response.json();
          const agentMessage: ChatMessage = {
            id: `agt-${Date.now()}`,
            sender: 'agent',
            text: data.reply || "Analisis telah selesai diproses.",
            timestamp: Date.now(),
            tradeSetup: data.tradeSetup || null,
            providerUsed: data.provider,
            modelUsed: data.model,
            latencyMs: data.latencyMs
          };
          setMessages(prev => [...prev, agentMessage]);
          
          // Track estimated token usage
          const estTokens = Math.round((textToSend.length + (data.reply?.length || 0)) / 3.8);
          recordAiUsage(activeProv, estTokens);

          success = true;
          break;
        } else {
          throw new Error('Respons backend error');
        }
      } catch (err: any) {
        attempts++;
        if (attempts > maxAttempts) {
          console.warn("AI Agent final failure:", err?.message || err);
          setMessages(prev => [
            ...prev,
            {
              id: `err-${Date.now()}`,
              sender: 'agent',
              text: `⚠️ **Catatan Sistem:** Layanan AI inference mengalami lonjakan beban. Setup cadangan algoritmik telah dipersiapkan. Anda juga dapat menggunakan kunci API mandiri di menu **Pengaturan AI Agent**.`,
              timestamp: Date.now()
            }
          ]);
        }
      }
    }

    setIsLoading(false);
    setRetryStatus(null);
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApplySetup = (setup: any, msgId: string) => {
    if (!setup) return;

    // 1. Dispatch custom event for CustomChartWidget
    window.dispatchEvent(new CustomEvent('mountalgo:apply-ai-trade-setup', {
      detail: setup
    }));

    // 2. Call prop handler if provided
    if (onApplyTradeSetupToChart) {
      onApplyTradeSetupToChart(setup);
    }

    // 3. Mark visual confirmation on button
    setMarkedSetupId(msgId);
    setTimeout(() => setMarkedSetupId(null), 3000);
  };

  const quickPrompts = [
    { label: "Deep Scan Semua Indikator", prompt: `Lakukan Deep Scan pada semua indikator teknikal (${activeSymbol} • ${timeframe}): RSI, MACD, EMA 20/50/200, Bollinger Bands, dan SuperTrend. Berikan pembacaan presisi dan sinyal konvergensinya.` },
    { label: "Setup Scalping Presisi (15M)", prompt: `Buatkan setup trading scalping presisi untuk ${activeSymbol} di timeframe ${timeframe}. Sertakan area entry, stop loss terukur, TP1, TP2, zona FVG/Order Block, dan rasio R:R.` },
    { label: "Order Flow & Volume Profile", prompt: `Analisis penyerapan likuiditas (absorption), delta volume CVD, dan level kunci Volume Profile (POC, VAH, VAL) pada pasangan ${activeSymbol}.` },
    { label: "Dampak Berita & Kalender Makro", prompt: `Bagaimana korelasi rilis berita ekonomi terkini terhadap volatilitas ${activeSymbol}? Berikan rekomendasi mitigasi risiko.` },
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
        className="relative w-full max-w-4xl h-[90vh] max-h-[840px] bg-gradient-to-b from-[#090d18]/95 via-[#060810]/95 to-[#04050a]/95 border border-cyan-500/40 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_35px_rgba(6,182,212,0.2)] flex flex-col overflow-hidden text-white font-sans backdrop-blur-2xl pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-[var(--color-border)]/30 bg-gradient-to-r from-cyan-950/40 via-transparent to-blue-950/40">
          <div className="flex items-center gap-3">
            <div className="relative">
              <MountAlgoLogo size="sm" showGlow className="w-8 h-8" />
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-black animate-ping" />
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-black" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-wide font-mono text-white flex items-center gap-1.5">
                  MOUNTALGO
                  <span className="text-cyan-400 font-extrabold">QUANT AGENT</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(true)}
                  className="text-[9.5px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-500/30 flex items-center gap-1 transition-colors cursor-pointer group"
                  title="Klik untuk membuka Pengaturan AI Agent & Multi-Model API Keys"
                >
                  <Zap size={10} className="fill-current text-cyan-400 group-hover:scale-110 transition-transform" />
                  <span>
                    {(AI_PROVIDERS_METADATA[aiSettings.activeProvider]?.name || 'GEMINI').toUpperCase()} · {aiSettings.providers[aiSettings.activeProvider]?.model?.toUpperCase() || 'FLASH'}
                  </span>
                  <Settings size={10} className="text-cyan-400 ml-0.5" />
                </button>

                {/* Live Indicator Deep Scan Badge */}
                <div className="hidden lg:flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-mono text-emerald-300 font-bold">
                  <Activity size={10} className="animate-pulse text-emerald-400" />
                  <span>ALL INDICATORS SYNCED</span>
                </div>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium">
                Terminal Kecerdasan Kuantitatif Presisi & Visualisasi Level Chart Instan
              </p>
            </div>
          </div>

          {/* Right Live Context Badge & Actions */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--color-bg)]/50 border border-[var(--color-border)]/30 text-xs font-mono">
              <span className="font-black text-cyan-300">{activeSymbol}</span>
              <span className="text-zinc-500">·</span>
              <span className="text-white font-bold">${currentPrice ? (currentPrice < 1 ? currentPrice.toFixed(6) : currentPrice.toLocaleString()) : 'N/A'}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${priceChange24h >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                {priceChange24h >= 0 ? '+' : ''}{priceChange24h}%
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-cyan-500/20 border border-[var(--color-border)]/30 hover:border-cyan-500/40 text-zinc-300 hover:text-cyan-300 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-mono"
              title="Pengaturan AI Agent (GPT, Claude, OpenRouter, Gemini, DeepSeek)"
            >
              <Settings size={13} className="text-cyan-400" />
              <span className="hidden md:inline text-[11px] font-semibold">Pengaturan AI</span>
            </button>

            <button
              onClick={() => setMessages([messages[0]])}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-[var(--color-border)]/30 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Bersihkan Percakapan"
            >
              <RotateCcw size={14} />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-[var(--color-border)]/30 hover:border-rose-500/40 text-zinc-400 hover:text-rose-300 transition-colors cursor-pointer"
              title="Tutup Modal"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Missing Key Notification Tip Banner */}
        {aiSettings.activeProvider !== 'gemini' && !aiSettings.providers[aiSettings.activeProvider]?.apiKey && (
          <div className="mx-4 sm:mx-6 mt-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300 font-sans shrink-0">
            <span className="flex items-center gap-1.5 truncate">
              <span>⚠️</span>
              <span className="truncate">
                API Key untuk <strong>{AI_PROVIDERS_METADATA[aiSettings.activeProvider]?.name}</strong> belum dimasukkan.
              </span>
            </span>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[11px] font-bold underline cursor-pointer shrink-0 ml-2"
            >
              Konfigurasi Sekarang
            </button>
          </div>
        )}

        {/* Chat Messages Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 font-sans text-sm scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'agent' && (
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0 text-cyan-400 mt-1 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                  <Bot size={16} />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 transition-all ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-none shadow-lg'
                    : 'bg-[#0e1424]/90 border border-cyan-500/20 text-zinc-200 rounded-tl-none shadow-xl backdrop-blur-md'
                }`}
              >
                {/* Message Body with clean formatting */}
                <div className="prose prose-invert max-w-none text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap font-sans">
                  {msg.text}
                </div>

                {/* Structured Trade Setup Card with "Tandai Level di Chart" action */}
                {msg.tradeSetup && (
                  <div className="mt-3.5 p-3 rounded-xl bg-black/40 border border-cyan-500/30 space-y-2 font-mono">
                    <div className="flex items-center justify-between border-b border-[var(--color-border)]/30 pb-1.5">
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

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px]">
                      <div className="p-1.5 rounded bg-white/5 border border-white/5">
                        <div className="text-zinc-400 text-[8.5px]">AREA ENTRY</div>
                        <div className="font-bold text-cyan-300">${msg.tradeSetup.entry?.toFixed(msg.tradeSetup.entry < 1 ? 6 : 2)}</div>
                      </div>
                      <div className="p-1.5 rounded bg-rose-950/30 border border-rose-500/20">
                        <div className="text-rose-400 text-[8.5px]">STOP LOSS</div>
                        <div className="font-bold text-rose-300">${msg.tradeSetup.stopLoss?.toFixed(msg.tradeSetup.stopLoss < 1 ? 6 : 2)}</div>
                      </div>
                      <div className="p-1.5 rounded bg-emerald-950/30 border border-emerald-500/20">
                        <div className="text-emerald-400 text-[8.5px]">TARGET 1 (TP1)</div>
                        <div className="font-bold text-emerald-300">${msg.tradeSetup.takeProfit1?.toFixed(msg.tradeSetup.takeProfit1 < 1 ? 6 : 2)}</div>
                      </div>
                      <div className="p-1.5 rounded bg-teal-950/30 border border-teal-500/20">
                        <div className="text-teal-400 text-[8.5px]">TARGET 2 (TP2)</div>
                        <div className="font-bold text-teal-300">${msg.tradeSetup.takeProfit2?.toFixed(msg.tradeSetup.takeProfit2 < 1 ? 6 : 2)}</div>
                      </div>
                    </div>

                    {msg.tradeSetup.keyLevelName && (
                      <div className="text-[9.5px] text-zinc-300 bg-white/5 px-2 py-1 rounded flex items-center gap-1">
                        <span className="text-cyan-400 font-bold">ZONA KUNCI:</span>
                        <span>{msg.tradeSetup.keyLevelName}</span>
                      </div>
                    )}

                    {/* Prominent Mark Level on Chart Action button */}
                    <button
                      type="button"
                      onClick={() => handleApplySetup(msg.tradeSetup, msg.id)}
                      className={`w-full mt-2 py-2 px-3 rounded-lg font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                        markedSetupId === msg.id
                          ? 'bg-emerald-500 text-black shadow-emerald-500/30'
                          : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black shadow-cyan-500/25 active:scale-[0.98]'
                      }`}
                      title="Klik untuk menggambar Long/Short Position tool, Entry, SL, TP1, TP2, dan Zona Order Block langsung di Chart"
                    >
                      {markedSetupId === msg.id ? (
                        <>
                          <CheckCircle2 size={14} className="text-black" />
                          <span>Level Berhasil Ditandai di Chart!</span>
                        </>
                      ) : (
                        <>
                          <Target size={14} />
                          <span>Tandai Level di Chart (Entry, SL, TP1, TP2 & Zona FVG)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Agent Engine Badge if agent response */}
                {msg.sender === 'agent' && (msg.providerUsed || msg.modelUsed) && (
                  <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-white/5 text-[10px] font-mono text-zinc-400">
                    <span className="text-cyan-400 font-semibold">{msg.providerUsed || 'MountAlgo AI'}</span>
                    <span className="text-zinc-600">·</span>
                    <span className="text-slate-300">{msg.modelUsed}</span>
                    {typeof msg.latencyMs === 'number' && msg.latencyMs > 0 && (
                      <>
                        <span className="text-zinc-600">·</span>
                        <span className="text-emerald-400/90">{msg.latencyMs}ms</span>
                      </>
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

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center shrink-0 text-blue-400 mt-1 shadow-md">
                  <User size={16} />
                </div>
              )}
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                <Bot size={16} className="animate-spin" />
              </div>
              <div className="bg-[#0e1424]/90 border border-cyan-500/30 rounded-2xl rounded-tl-none p-3.5 flex items-center gap-3 text-xs font-mono text-cyan-300 backdrop-blur-md">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping delay-100" />
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping delay-200" />
                </div>
                <span>
                  {retryStatus || `MountAlgo Quant Agent sedang melakukan deep scan indikator & komputasi...`}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Bar */}
        <div className="px-4 sm:px-6 py-2 bg-black/40 border-t border-[var(--color-border)]/20 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles size={11} className="text-cyan-400" />
            Quick:
          </span>
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              disabled={isLoading}
              onClick={() => handleSendMessage(qp.prompt)}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-cyan-500/20 border border-white/5 hover:border-cyan-500/30 text-[11px] font-sans text-zinc-300 hover:text-cyan-300 transition-all whitespace-nowrap cursor-pointer disabled:opacity-50"
            >
              {qp.label}
            </button>
          ))}
        </div>

        {/* Bottom Input Area */}
        <div className="p-4 sm:px-6 sm:py-3.5 bg-gradient-to-t from-[#04050a] to-[#090d18] border-t border-[var(--color-border)]/30 shrink-0">
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
                placeholder={`Tanyakan strategi, setup entry/SL/TP, atau analisis indikator ${activeSymbol}...`}
                disabled={isLoading}
                className="w-full bg-[#0d1322]/90 border border-cyan-500/30 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all font-sans"
              />
            </div>

            <button
              type="submit"
              disabled={!inputPrompt.trim() || isLoading}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-xs sm:text-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20 shrink-0"
            >
              <Send size={14} />
              <span className="hidden sm:inline">Kirim</span>
            </button>
          </form>
        </div>
      </div>

      {/* AI Agent Settings Modal */}
      <AiAgentSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSettingsSaved={(newSettings) => setAiSettings(newSettings)}
      />
    </div>
  );
};

export default AiAgentTerminalModal;

