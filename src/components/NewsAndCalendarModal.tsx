import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  X, 
  RefreshCw, 
  Calendar, 
  Newspaper, 
  ExternalLink, 
  Search, 
  Flame, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Clock, 
  Filter, 
  Sparkles, 
  Bot, 
  Globe2, 
  ChevronRight,
  Zap,
  Info
} from 'lucide-react';
import MountAlgoLogo from './MountAlgoLogo';

interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: number;
  categories: string;
  tags: string[];
  imageUrl: string | null;
  body: string;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
}

interface EconomicEvent {
  id: string;
  event: string;
  country: string;
  currency: string;
  flag: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: number;
  dateFormatted: string;
  timeFormatted: string;
  countdownMs: number;
  countdownStr: string;
  isPast: boolean;
  forecast: string;
  previous: string;
  actual: string | null;
  unit: string;
  volatilityRisk: 'EXTREME' | 'HIGH' | 'MODERATE' | 'LOW';
  description: string;
}

interface NewsAndCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAiAgentWithContext?: (promptText: string) => void;
  activeSymbol?: string;
}

export const NewsAndCalendarModal: React.FC<NewsAndCalendarModalProps> = ({
  isOpen,
  onClose,
  onOpenAiAgentWithContext,
  activeSymbol = 'BTCUSDT'
}) => {
  const [activeTab, setActiveTab] = useState<'news' | 'calendar'>('news');
  
  // News States
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [newsCategory, setNewsCategory] = useState<string>('ALL');
  const [newsSearch, setNewsSearch] = useState<string>('');
  const [newsSentiment, setNewsSentiment] = useState<'ALL' | 'Bullish' | 'Bearish'>('ALL');
  const [lastNewsUpdate, setLastNewsUpdate] = useState<number>(Date.now());

  // Economic Calendar States
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [calendarImpact, setCalendarImpact] = useState<'ALL' | 'HIGH' | 'MEDIUM'>('ALL');
  const [calendarCurrency, setCalendarCurrency] = useState<string>('ALL');
  const [nextHighImpact, setNextHighImpact] = useState<EconomicEvent | null>(null);

  // Auto countdown ticker
  const [nowTimestamp, setNowTimestamp] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNowTimestamp(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch News from Backend
  const fetchNews = useCallback(async () => {
    setIsLoadingNews(true);
    try {
      const url = new URL('/api/news', window.location.origin);
      if (newsCategory !== 'ALL') url.searchParams.set('category', newsCategory);
      if (newsSearch.trim()) url.searchParams.set('search', newsSearch.trim());

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        if (data.news && Array.isArray(data.news)) {
          setNews(data.news);
          setLastNewsUpdate(Date.now());
        }
      }
    } catch (err) {
      console.error("Fetch news error:", err);
    } finally {
      setIsLoadingNews(false);
    }
  }, [newsCategory, newsSearch]);

  // Fetch Economic Calendar from Backend
  const fetchCalendar = useCallback(async () => {
    setIsLoadingEvents(true);
    try {
      const res = await fetch('/api/economic-calendar');
      if (res.ok) {
        const data = await res.json();
        if (data.events && Array.isArray(data.events)) {
          setEvents(data.events);
          setNextHighImpact(data.nextHighImpact || null);
        }
      }
    } catch (err) {
      console.error("Fetch calendar error:", err);
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);

  // Initial fetch when opened
  useEffect(() => {
    if (isOpen) {
      fetchNews();
      fetchCalendar();
    }
  }, [isOpen, fetchNews, fetchCalendar]);

  // Periodic background refresh every 45s when open
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      fetchNews();
      fetchCalendar();
    }, 45000);
    return () => clearInterval(interval);
  }, [isOpen, fetchNews, fetchCalendar]);

  // Filtered News
  const filteredNews = useMemo(() => {
    return news.filter(item => {
      if (newsSentiment !== 'ALL' && item.sentiment !== newsSentiment) return false;
      return true;
    });
  }, [news, newsSentiment]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter(evt => {
      if (calendarImpact === 'HIGH' && evt.impact !== 'HIGH') return false;
      if (calendarImpact === 'MEDIUM' && evt.impact === 'LOW') return false;
      if (calendarCurrency !== 'ALL' && evt.currency !== calendarCurrency) return false;
      return true;
    });
  }, [events, calendarImpact, calendarCurrency]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      {/* Dramatic Dark Glassmorphic Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
        onClick={onClose}
      />

      {/* Main Modal Container */}
      <div 
        className="relative w-full max-w-5xl h-[90vh] max-h-[850px] bg-gradient-to-b from-[#090d16]/95 via-[#06080f]/95 to-[#04060a]/95 border border-cyan-500/30 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_30px_rgba(6,182,212,0.15)] flex flex-col overflow-hidden text-white font-sans backdrop-blur-2xl pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Banner */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-[var(--color-border)]/30 bg-gradient-to-r from-cyan-950/40 via-transparent to-blue-950/30">
          <div className="flex items-center gap-3">
            <MountAlgoLogo size="sm" showGlow className="w-7 h-7" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wide font-mono text-white flex items-center gap-1.5">
                  MOUNTALGO
                  <span className="text-cyan-400 font-extrabold text-sm sm:text-base">INTELLIGENCE</span>
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE DATA FEEDS
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium">
                Berita Finansial Terverifikasi & Kalender Makroekonomi Berdampak Tinggi Real-Time
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchNews();
                fetchCalendar();
              }}
              disabled={isLoadingNews || isLoadingEvents}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-[var(--color-border)]/30 hover:border-cyan-500/40 text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-mono disabled:opacity-50"
              title="Perbarui Data Sekarang"
            >
              <RefreshCw size={14} className={`${isLoadingNews || isLoadingEvents ? 'animate-spin text-cyan-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-[var(--color-border)]/30 hover:border-rose-500/40 text-zinc-400 hover:text-rose-300 transition-colors cursor-pointer"
              title="Tutup (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tab Navigation & Live High-Impact Alert Bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-[var(--color-bg)]/40 border-b border-[var(--color-border)]/30 flex flex-wrap items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-[var(--color-border)]/30 backdrop-blur-md">
            <button
              onClick={() => setActiveTab('news')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                activeTab === 'news'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Newspaper size={14} />
              <span>News Feeds Realtime</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-[var(--color-bg)]/40 text-cyan-200">
                {news.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                activeTab === 'calendar'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Calendar size={14} />
              <span>Kalender Berita Ekonomi</span>
              {nextHighImpact && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-rose-500/40 text-rose-200 font-black animate-pulse">
                  HIGH
                </span>
              )}
            </button>
          </div>

          {/* Real-time High Impact Event Countdown Banner */}
          {nextHighImpact && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-950/60 to-amber-950/40 border border-rose-500/40 text-xs font-mono">
              <Flame size={14} className="text-rose-400 animate-bounce" />
              <span className="text-zinc-300 text-[11px] hidden md:inline">Jadwal High Impact Terdekat:</span>
              <span className="font-bold text-white text-[11px] truncate max-w-[200px]">{nextHighImpact.flag} {nextHighImpact.event}</span>
              <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-black border border-rose-500/30 text-[10px]">
                ⏱ {(() => {
                  const diff = nextHighImpact.timestamp - nowTimestamp;
                  if (diff <= 0) return 'Sedang Rilis';
                  const h = Math.floor(diff / (1000 * 60 * 60));
                  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                  const s = Math.floor((diff % (1000 * 60)) / 1000);
                  return `${h.toString().padStart(2, '0')}h : ${m.toString().padStart(2, '0')}m : ${s.toString().padStart(2, '0')}s`;
                })()}
              </span>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 scrollbar-thin">
          {/* ========================================================================= */}
          {/* TAB 1: NEWS FEEDS                                                         */}
          {/* ========================================================================= */}
          {activeTab === 'news' && (
            <div className="space-y-4">
              {/* Filter and Search Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2">
                <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar py-0.5">
                  {['ALL', 'BTC', 'ETH', 'SOL', 'Macro', 'Forex', 'DeFi'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setNewsCategory(cat)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        newsCategory === cat
                          ? 'bg-cyan-500 text-black shadow-md'
                          : 'bg-white/5 hover:bg-white/10 text-zinc-300 border border-[var(--color-border)]/30'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  {/* Sentiment Filter */}
                  <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-[var(--color-border)]/30 text-xs font-mono">
                    <button
                      onClick={() => setNewsSentiment('ALL')}
                      className={`px-2 py-0.5 rounded ${newsSentiment === 'ALL' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-zinc-400'}`}
                    >
                      Semua
                    </button>
                    <button
                      onClick={() => setNewsSentiment('Bullish')}
                      className={`px-2 py-0.5 rounded ${newsSentiment === 'Bullish' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-zinc-400'}`}
                    >
                      Bullish
                    </button>
                    <button
                      onClick={() => setNewsSentiment('Bearish')}
                      className={`px-2 py-0.5 rounded ${newsSentiment === 'Bearish' ? 'bg-rose-500/20 text-rose-300 font-bold' : 'text-zinc-400'}`}
                    >
                      Bearish
                    </button>
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Cari berita..."
                      value={newsSearch}
                      onChange={(e) => setNewsSearch(e.target.value)}
                      className="bg-[var(--color-bg)]/50 border border-[var(--color-border)]/30 rounded-lg pl-7 pr-3 py-1 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/50 w-36 sm:w-48"
                    />
                  </div>
                </div>
              </div>

              {/* News Articles Grid */}
              {isLoadingNews && news.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
                  <span className="text-xs font-mono text-cyan-300 font-bold tracking-wider">
                    MENYINKRONKAN BERITA PASAR GLOBAL REALTIME...
                  </span>
                </div>
              ) : filteredNews.length === 0 ? (
                <div className="text-center py-16 text-zinc-500 font-mono text-xs">
                  Tidak ada berita yang cocok dengan filter saat ini.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredNews.map(item => {
                    const date = new Date(item.publishedAt);
                    const timeAgoStr = Math.max(1, Math.floor((nowTimestamp - item.publishedAt) / 60000));
                    const timeText = timeAgoStr < 60 ? `${timeAgoStr}m lalu` : `${Math.floor(timeAgoStr / 60)}h lalu`;

                    return (
                      <div
                        key={item.id}
                        className="group relative p-4 rounded-xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-[var(--color-border)]/30 hover:border-cyan-500/40 transition-all duration-200 hover:shadow-xl hover:shadow-cyan-950/20 flex flex-col justify-between backdrop-blur-md"
                      >
                        <div>
                          {/* Metadata row */}
                          <div className="flex items-center justify-between gap-2 mb-2 text-[10px] font-mono">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-cyan-400 bg-cyan-950/50 border border-cyan-800/40 px-2 py-0.5 rounded">
                                {item.source}
                              </span>
                              <span className="text-zinc-500 flex items-center gap-1">
                                <Clock size={10} />
                                {timeText}
                              </span>
                            </div>

                            <span
                              className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                                item.sentiment === 'Bullish'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : item.sentiment === 'Bearish'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'bg-zinc-500/20 text-zinc-300 border border-zinc-500/30'
                              }`}
                            >
                              {item.sentiment}
                            </span>
                          </div>

                          {/* Title */}
                          <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug">
                            {item.title}
                          </h3>

                          {/* Body preview */}
                          {item.body && (
                            <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">
                              {item.body}
                            </p>
                          )}
                        </div>

                        {/* Footer & Action row */}
                        <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/5 text-xs">
                          {/* Tags */}
                          <div className="flex items-center gap-1 overflow-hidden">
                            {item.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-zinc-400 border border-white/5">
                                #{tag}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* AI Analysis Bridge Button */}
                            {onOpenAiAgentWithContext && (
                              <button
                                onClick={() => {
                                  onOpenAiAgentWithContext(
                                    `Analisis dampak berita berikut terhadap pasar kripto/forex (${activeSymbol}): "${item.title}". Apa potensi reaksi harga dan setup yang disarankan?`
                                  );
                                  onClose();
                                }}
                                className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-300 hover:text-white border border-cyan-500/40 text-[10px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer"
                                title="Minta Analisis AI Agent untuk Berita Ini"
                              >
                                <Bot size={11} className="text-cyan-400" />
                                <span>AI Insight</span>
                              </button>
                            )}

                            {/* External Source Link */}
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-zinc-400 hover:text-white transition-colors"
                              title="Buka artikel sumber asli"
                            >
                              <ExternalLink size={13} />
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: ECONOMIC CALENDAR                                                  */}
          {/* ========================================================================= */}
          {activeTab === 'calendar' && (
            <div className="space-y-4">
              {/* Filter controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[var(--color-border)]/30">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-zinc-400 font-bold">Filter Dampak:</span>
                  <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-[var(--color-border)]/30 text-xs font-mono">
                    <button
                      onClick={() => setCalendarImpact('ALL')}
                      className={`px-2.5 py-1 rounded ${calendarImpact === 'ALL' ? 'bg-cyan-500 text-black font-bold' : 'text-zinc-400 hover:text-white'}`}
                    >
                      Semua
                    </button>
                    <button
                      onClick={() => setCalendarImpact('HIGH')}
                      className={`px-2.5 py-1 rounded flex items-center gap-1 ${calendarImpact === 'HIGH' ? 'bg-rose-500 text-white font-bold' : 'text-rose-400 hover:text-rose-300'}`}
                    >
                      <Flame size={12} />
                      High Impact Only
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-zinc-400 font-bold">Mata Uang:</span>
                  <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-[var(--color-border)]/30 text-xs font-mono">
                    {['ALL', 'USD', 'EUR', 'GBP'].map(curr => (
                      <button
                        key={curr}
                        onClick={() => setCalendarCurrency(curr)}
                        className={`px-2.5 py-1 rounded ${calendarCurrency === curr ? 'bg-cyan-500 text-black font-bold' : 'text-zinc-400 hover:text-white'}`}
                      >
                        {curr}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Economic Calendar Events Table */}
              {isLoadingEvents && events.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
                  <span className="text-xs font-mono text-cyan-300 font-bold tracking-wider">
                    MEMUAT KALENDER BERITA EKONOMI MAKRO...
                  </span>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]/30 bg-[var(--color-bg)]/40 backdrop-blur-md">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-[var(--color-border)]/30 bg-white/5 text-[10px] text-zinc-400 uppercase tracking-wider">
                        <th className="py-3 px-3">Waktu & Tanggal</th>
                        <th className="py-3 px-3">Negara</th>
                        <th className="py-3 px-3">Dampak</th>
                        <th className="py-3 px-3">Event / Indikator</th>
                        <th className="py-3 px-3 text-right">Aktual</th>
                        <th className="py-3 px-3 text-right">Prakiraan</th>
                        <th className="py-3 px-3 text-right">Sebelumnya</th>
                        <th className="py-3 px-3 text-center">Countdown</th>
                        <th className="py-3 px-3 text-center">AI Analisis</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredEvents.map(evt => {
                        const diff = evt.timestamp - nowTimestamp;
                        const isPast = diff <= 0;

                        return (
                          <tr 
                            key={evt.id}
                            className={`hover:bg-white/[0.03] transition-colors ${evt.impact === 'HIGH' && !isPast ? 'bg-rose-950/10' : ''}`}
                          >
                            <td className="py-3 px-3 whitespace-nowrap">
                              <div className="font-bold text-white">{evt.timeFormatted} WIB</div>
                              <div className="text-[10px] text-zinc-500">{evt.dateFormatted}</div>
                            </td>

                            <td className="py-3 px-3 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 font-bold text-zinc-200">
                                <span className="text-base">{evt.flag}</span>
                                <span>{evt.currency}</span>
                              </div>
                            </td>

                            <td className="py-3 px-3 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                  evt.impact === 'HIGH'
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                                    : evt.impact === 'MEDIUM'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                    : 'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30'
                                }`}
                              >
                                {evt.impact}
                              </span>
                            </td>

                            <td className="py-3 px-3 min-w-[200px]">
                              <div className="font-bold text-white flex items-center gap-1.5">
                                <span>{evt.event}</span>
                                {evt.volatilityRisk === 'EXTREME' && (
                                  <span className="text-[8.5px] px-1 rounded bg-rose-500/30 text-rose-200 font-bold border border-rose-500/40">
                                    HIGH VOLATILITY
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">
                                {evt.description}
                              </div>
                            </td>

                            <td className="py-3 px-3 text-right font-bold text-white whitespace-nowrap">
                              {evt.actual ? (
                                <span className="text-emerald-400">{evt.actual}</span>
                              ) : (
                                <span className="text-zinc-600">-</span>
                              )}
                            </td>

                            <td className="py-3 px-3 text-right text-zinc-300 whitespace-nowrap">
                              {evt.forecast}
                            </td>

                            <td className="py-3 px-3 text-right text-zinc-400 whitespace-nowrap">
                              {evt.previous}
                            </td>

                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              {isPast ? (
                                <span className="text-[10px] text-zinc-500 font-bold">Rilis</span>
                              ) : (
                                <span className="text-[10.5px] px-2 py-0.5 rounded font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                                  {(() => {
                                    const h = Math.floor(diff / (1000 * 60 * 60));
                                    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                                    const s = Math.floor((diff % (1000 * 60)) / 1000);
                                    return `${h}j ${m}m ${s}d`;
                                  })()}
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              {onOpenAiAgentWithContext && (
                                <button
                                  onClick={() => {
                                    onOpenAiAgentWithContext(
                                      `Bagaimana proyeksi dampak rilis berita ekonomi "${evt.event}" (${evt.currency}, Forecast: ${evt.forecast}, Previous: ${evt.previous}) terhadap pergerakan ${activeSymbol}? Berikan rekomendasi skenario jika hasil aktual > atau < forecast.`
                                    );
                                    onClose();
                                  }}
                                  className="p-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 transition-all cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold"
                                  title="Analisis Skenario Rilis dengan AI Agent"
                                >
                                  <Bot size={12} />
                                  <span className="hidden lg:inline">Skenario AI</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsAndCalendarModal;
