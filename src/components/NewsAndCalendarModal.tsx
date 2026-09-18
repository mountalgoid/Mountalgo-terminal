import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  ChevronDown,
  Zap,
  Info,
  ShieldCheck,
  Server,
  Volume2,
  VolumeX,
  Target,
  ShieldAlert,
  CheckCircle2,
  Layers,
  Radio
} from 'lucide-react';
import MountAlgoLogo from './MountAlgoLogo';
import { calendarWorkerDispatcher } from '../workers/calendarWorkerDispatcher';
import { tradingAudio } from '../utils/audioSynth';
import { formatTimeInTimezone, getStoredTimezone } from '../utils/timezone';
import { TimezoneSelector } from './TimezoneSelector';
import { useTheme } from '../context/ThemeContext';
import { 
  getThemeCardGradient, 
  getThemeCardBorder, 
  getThemeCardBoxShadow, 
  getThemeModalGradient, 
  getThemeAiDigestGradient,
  hexToRgba 
} from '../utils/themeGradient';

interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: number;
  scheduledAt?: number;
  countdownMs?: number;
  countdownStr?: string;
  categories: string;
  tags: string[];
  imageUrl: string | null;
  body: string;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  impact?: 'HIGH' | 'MEDIUM' | 'LOW';
  isUpcoming?: boolean;
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
  isJustReleased?: boolean;
  forecast: string;
  previous: string;
  actual: string | null;
  deviation?: string | null;
  deviationStatus?: 'BEAT' | 'MISS' | 'IN_LINE' | null;
  marketReaction?: string | null;
  unit: string;
  volatilityRisk: 'EXTREME' | 'HIGH' | 'MODERATE' | 'LOW';
  description: string;
  sourceOrg?: string;
  officialUrl?: string;
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
  const { palette, isLight } = useTheme();
  const [activeTab, setActiveTab] = useState<'news' | 'calendar'>('news');
  
  // News States
  const [news, setNews] = useState<NewsItem[]>([]);
  const [upcomingNews, setUpcomingNews] = useState<NewsItem[]>([]);
  const [newsFilterMode, setNewsFilterMode] = useState<'UPCOMING_ONLY' | 'ALL_FEEDS'>('UPCOMING_ONLY');
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [newsCategory, setNewsCategory] = useState<string>('ALL');
  const [newsSearch, setNewsSearch] = useState<string>('');
  const [newsSentiment, setNewsSentiment] = useState<'ALL' | 'Bullish' | 'Bearish'>('ALL');
  const [lastNewsUpdate, setLastNewsUpdate] = useState<number>(Date.now());
  const [filterOnlyActiveSymbol, setFilterOnlyActiveSymbol] = useState(false);
  const [sourceTierFilter, setSourceTierFilter] = useState<'ALL' | 'TIER1' | 'CRYPTO' | 'OFFICIAL'>('ALL');
  const [expandedAiDigestId, setExpandedAiDigestId] = useState<string | null>(null);

  // Audio Breaking News Chime State
  const [isAudioAlertEnabled, setIsAudioAlertEnabled] = useState<boolean>(() => {
    return localStorage.getItem('mountalgo_news_audio_alert_enabled') !== 'false';
  });

  // Floating Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => prev === msg ? null : prev);
    }, 3000);
  };

  const toggleAudioAlert = () => {
    const next = !isAudioAlertEnabled;
    setIsAudioAlertEnabled(next);
    localStorage.setItem('mountalgo_news_audio_alert_enabled', String(next));
    if (next) {
      tradingAudio.play('ALERT');
      showToast('🔊 Audio Notifikasi Breaking News Aktif');
    } else {
      showToast('🔇 Audio Notifikasi Dimatikan');
    }
  };

  // Symbol Normalization helper for interactive tag clicks
  const normalizeTagToSymbol = useCallback((rawTag: string): string | null => {
    const clean = rawTag.replace(/^#/, '').toUpperCase().trim();
    if (!clean) return null;
    
    if (clean.includes('BTC') || clean === 'BITCOIN') return 'BTCUSDT';
    if (clean.includes('ETH') || clean === 'ETHEREUM') return 'ETHUSDT';
    if (clean.includes('SOL') || clean === 'SOLANA') return 'SOLUSDT';
    if (clean.includes('BNB')) return 'BNBUSDT';
    if (clean.includes('XRP') || clean === 'RIPPLE') return 'XRPUSDT';
    if (clean.includes('DOGE')) return 'DOGEUSDT';
    if (clean.includes('ADA') || clean === 'CARDANO') return 'ADAUSDT';
    if (clean.includes('AVAX')) return 'AVAXUSDT';
    if (clean.includes('GOLD') || clean.includes('XAU') || clean === 'EMAS') return 'XAUUSD';
    if (clean.includes('OIL') || clean.includes('WTI') || clean.includes('CRUDE') || clean === 'MINYAK') return 'USOIL';
    if (clean.includes('EURUSD') || clean === 'EUR') return 'EURUSD';
    if (clean.includes('GBPUSD') || clean === 'GBP') return 'GBPUSD';
    if (clean.includes('USDJPY') || clean === 'JPY') return 'USDJPY';
    if (clean.includes('AUDUSD') || clean === 'AUD') return 'AUDUSD';
    if (clean.includes('USDCAD') || clean === 'CAD') return 'USDCAD';
    if (clean.includes('USDCHF') || clean === 'CHF') return 'USDCHF';
    if (clean.includes('NDX') || clean.includes('NAS100') || clean.includes('NASDAQ')) return 'NAS100';
    if (clean.includes('SPX') || clean.includes('SP500') || clean.includes('US500')) return 'US500';
    
    if (/^[A-Z0-9]{3,8}$/.test(clean)) {
      return clean.endsWith('USDT') || clean.length === 6 ? clean : `${clean}USDT`;
    }
    return null;
  }, []);

  // Interactive Switch Symbol handler
  const handleSwitchSymbol = useCallback((tag: string) => {
    const targetSymbol = normalizeTagToSymbol(tag);
    if (targetSymbol) {
      window.dispatchEvent(new CustomEvent('mountalgo_symbol_changed', { detail: targetSymbol }));
      tradingAudio.play('CLICK');
      showToast(`🎯 Chart berpindah ke instrumen ${targetSymbol}`);
    }
  }, [normalizeTagToSymbol]);

  // Economic Calendar States
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [calendarImpact, setCalendarImpact] = useState<'ALL' | 'HIGH' | 'MEDIUM'>('ALL');
  const [calendarCurrency, setCalendarCurrency] = useState<string>('ALL');
  const [calendarMode, setCalendarMode] = useState<'ALL' | 'UPCOMING'>('ALL');
  const [isSimulating, setIsSimulating] = useState(false);
  const [nextHighImpact, setNextHighImpact] = useState<EconomicEvent | null>(null);
  const [feedProvider, setFeedProvider] = useState<{
    name: string;
    latency: number;
    isFailover: boolean;
  }>({
    name: 'Primary Institutional Feed',
    latency: 14,
    isFailover: false
  });

  // Auto countdown ticker updated every second in sync with realtime clock
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
        }
        if (data.upcomingNews && Array.isArray(data.upcomingNews)) {
          setUpcomingNews(data.upcomingNews);
        }
        setLastNewsUpdate(Date.now());
      }
    } catch (err) {
      console.error("Fetch news error:", err);
    } finally {
      setIsLoadingNews(false);
    }
  }, [newsCategory, newsSearch]);

  // Fetch Economic Calendar from Backend with Sub-3s SLA Failover & Worker Offloading
  const fetchCalendar = useCallback(async (modeOverride?: 'ALL' | 'UPCOMING') => {
    setIsLoadingEvents(true);
    const mode = modeOverride || calendarMode;
    const modeQuery = mode === 'UPCOMING' ? 'upcoming' : 'all';

    // 3-Second Timeout AbortController for primary institutional feed
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
      let data: any = null;
      try {
        const res = await fetch(`/api/economic-calendar?mode=${modeQuery}`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          data = await res.json();
        } else {
          throw new Error('Primary status not ok');
        }
      } catch (primaryErr) {
        clearTimeout(timeoutId);
        // Failover triggered seamlessly within 3s SLA
        console.warn('Primary feed timeout (>3s) or error. Activating secondary failover...', primaryErr);
        const failoverRes = await fetch(`/api/economic-calendar/failover?mode=${modeQuery}`);
        if (failoverRes.ok) {
          data = await failoverRes.json();
        }
      }

      if (data && data.events && Array.isArray(data.events)) {
        setFeedProvider({
          name: data.provider || (data.failoverActive ? 'Secondary Failover' : 'Primary Institutional'),
          latency: data.latencyMs || 10,
          isFailover: !!data.failoverActive
        });

        // Web Worker Offloading: If events exceed 100, offload sort & calculations to background thread
        if (data.events.length > 100) {
          try {
            const workerResult = await calendarWorkerDispatcher.processEventsAsync(
              data.events,
              Date.now(),
              calendarImpact,
              calendarCurrency
            );
            setEvents(workerResult.events as EconomicEvent[]);
            setNextHighImpact((workerResult.nextHighImpact || null) as EconomicEvent | null);
            return;
          } catch (wErr) {
            console.warn('Worker offloading fallback:', wErr);
          }
        }

        setEvents(data.events);
        setNextHighImpact(data.nextHighImpact || null);
      }
    } catch (err) {
      console.error("Fetch calendar error:", err);
    } finally {
      setIsLoadingEvents(false);
    }
  }, [calendarMode, calendarImpact, calendarCurrency]);

  // Pre-News Alarm Notification (Audio chime + Toast alert at 30m, 15m, 5m, 1m mark)
  const notifiedEventsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!nextHighImpact) return;
    const diffMins = Math.floor((nextHighImpact.timestamp - nowTimestamp) / 60000);
    if (diffMins <= 0) return;

    const eventKey = `${nextHighImpact.id}-${diffMins}`;
    if ([30, 15, 5, 1].includes(diffMins) && !notifiedEventsRef.current.has(eventKey)) {
      notifiedEventsRef.current.add(eventKey);
      tradingAudio.play('ALERT');
      if (typeof window !== 'undefined' && (window as any).showToast) {
        (window as any).showToast(`⚠️ ALARM MACRO: Berita High Impact (${nextHighImpact.flag} ${nextHighImpact.currency} - ${nextHighImpact.event}) rilis dalam ${diffMins} menit!`);
      }
    }
  }, [nextHighImpact, nowTimestamp]);
  const handleSimulateRelease = async () => {
    try {
      setIsSimulating(true);
      tradingAudio.play('ORDER_SUBMITTED');
      const res = await fetch('/api/economic-calendar/trigger-release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: 'ec-cpi-mom' })
      });
      if (res.ok) {
        tradingAudio.play('ALERT');
        await fetchCalendar();
      }
    } catch (e) {
      console.error('Simulate release error:', e);
    } finally {
      setIsSimulating(false);
    }
  };

  // Auto-fetch actual print within 3-5 seconds when countdown hits 0
  useEffect(() => {
    const shouldRefresh = events.some(e => {
      const diff = e.timestamp - nowTimestamp;
      return diff <= 0 && diff >= -20000 && !e.actual;
    });
    if (shouldRefresh && !isLoadingEvents) {
      const t = setTimeout(() => {
        fetchCalendar();
      }, 3500);
      return () => clearTimeout(t);
    }
  }, [nowTimestamp, events, isLoadingEvents, fetchCalendar]);

  // Initial fetch when opened
  useEffect(() => {
    if (isOpen) {
      fetchNews();
      fetchCalendar();
    }
  }, [isOpen, fetchNews, fetchCalendar]);

  // Periodic background refresh every 12s when open for real-time live accuracy
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      fetchNews();
      fetchCalendar();
    }, 12000);
    return () => clearInterval(interval);
  }, [isOpen, fetchNews, fetchCalendar]);

  // Selected Timezone state with persistent global sync
  const [selectedTimezone, setSelectedTimezone] = useState<string>(() => getStoredTimezone());
  const [showChartNewsMarkers, setShowChartNewsMarkers] = useState<boolean>(() => localStorage.getItem('mountalgo_show_news_markers') !== 'false');
  const [alarmMinutesThreshold, setAlarmMinutesThreshold] = useState<number>(() => {
    const saved = localStorage.getItem('mountalgo_news_alarm_mins');
    return saved ? parseInt(saved, 10) : 5;
  });

  useEffect(() => {
    const handleTzChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) setSelectedTimezone(customEvent.detail);
    };
    window.addEventListener('mountalgo_timezone_changed', handleTzChange);
    return () => window.removeEventListener('mountalgo_timezone_changed', handleTzChange);
  }, []);

  const toggleChartNewsMarkers = () => {
    const next = !showChartNewsMarkers;
    setShowChartNewsMarkers(next);
    localStorage.setItem('mountalgo_show_news_markers', next ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('mountalgo_news_markers_toggled', { detail: next }));
    tradingAudio.play('CLICK');
  };

  // Format Helper: Real-time Synchronized Time & Date in Selected Timezone
  const formatLocalTime = useCallback((timestamp: number) => {
    const formatted = formatTimeInTimezone(timestamp, selectedTimezone);
    return {
      timeStr: formatted.timeWithSecsStr,
      dateStr: formatted.dateStr,
      tzStr: formatted.tzAbbr,
      tzOffset: formatted.tzOffset
    };
  }, [selectedTimezone]);

  // Format Helper: Live Countdown string calculation
  const getLiveCountdown = useCallback((targetTimestamp: number) => {
    const diff = targetTimestamp - nowTimestamp;
    if (diff <= 0) {
      return { str: 'Sedang Rilis', isPast: true, diff: 0, hours: 0, mins: 0, secs: 0 };
    }
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    const str = `${hours.toString().padStart(2, '0')}j : ${mins.toString().padStart(2, '0')}m : ${secs.toString().padStart(2, '0')}s`;
    return { str, isPast: false, diff, hours, mins, secs };
  }, [nowTimestamp]);

  // Helper: News Relevance to Active Symbol
  const isNewsRelevantToSymbol = useCallback((item: NewsItem, symbol: string): boolean => {
    const sym = symbol.toUpperCase();
    const base = sym.replace(/USDT$|USD$/, '');
    const terms = [sym, base];

    if (sym.includes('BTC')) terms.push('bitcoin', 'crypto', 'satoshi', 'etf');
    if (sym.includes('ETH')) terms.push('ethereum', 'vitalik', 'defi', 'layer 2');
    if (sym.includes('SOL')) terms.push('solana', 'meme');
    if (sym.includes('XAU') || sym.includes('GOLD')) terms.push('gold', 'emas', 'fomc', 'fed', 'cpi', 'inflation', 'dollar', 'usd', 'yield');
    if (sym.includes('USOIL') || sym.includes('OIL')) terms.push('oil', 'crude', 'eia', 'opec', 'petroleum', 'energy', 'brent');
    if (sym.includes('EUR')) terms.push('ecb', 'lagarde', 'euro', 'europe', 'inflation');
    if (sym.includes('GBP')) terms.push('boe', 'bailey', 'pound', 'uk');
    if (sym.includes('JPY')) terms.push('boj', 'ueda', 'yen', 'japan');

    const content = `${item.title} ${item.body} ${item.categories} ${item.tags?.join(' ')}`.toLowerCase();
    return terms.some(t => t && content.includes(t.toLowerCase()));
  }, []);

  // Helper: Source Tier Whitelist Filtering
  const isNewsMatchingSourceFilter = useCallback((item: NewsItem, filter: 'ALL' | 'TIER1' | 'CRYPTO' | 'OFFICIAL'): boolean => {
    if (filter === 'ALL') return true;
    const src = (item.source || '').toLowerCase();
    if (filter === 'TIER1') {
      return src.includes('reuters') || src.includes('bloomberg') || src.includes('wsj') || src.includes('ft') || src.includes('marketwatch') || src.includes('yahoo');
    }
    if (filter === 'CRYPTO') {
      return src.includes('cointelegraph') || src.includes('coindesk') || src.includes('cryptocompare') || src.includes('theblock') || src.includes('decrypt');
    }
    if (filter === 'OFFICIAL') {
      return src.includes('fed') || src.includes('bls') || src.includes('ecb') || src.includes('boe') || src.includes('sec') || src.includes('census') || src.includes('eia');
    }
    return true;
  }, []);

  // Filtered News: strictly upcoming news when in UPCOMING_ONLY mode
  const displayedNewsItems = useMemo(() => {
    const sourceList = newsFilterMode === 'UPCOMING_ONLY' ? upcomingNews : [...upcomingNews, ...news];

    return sourceList.filter(item => {
      const eventTime = item.scheduledAt || item.publishedAt;
      // If user requested UPCOMING ONLY: strictly filter events in the future
      if (newsFilterMode === 'UPCOMING_ONLY' && eventTime <= nowTimestamp) {
        return false;
      }
      if (newsSentiment !== 'ALL' && item.sentiment !== newsSentiment) return false;
      
      // Active Symbol Filter
      if (filterOnlyActiveSymbol && !isNewsRelevantToSymbol(item, activeSymbol)) {
        return false;
      }

      // Source Tier Filter
      if (!isNewsMatchingSourceFilter(item, sourceTierFilter)) {
        return false;
      }

      if (newsCategory !== 'ALL') {
        const cat = newsCategory.toLowerCase();
        const hasCategory = item.categories?.toLowerCase().includes(cat) || item.tags?.some(t => t.toLowerCase().includes(cat));
        if (!hasCategory) return false;
      }
      return true;
    }).sort((a, b) => {
      // Sort upcoming by closest time first
      const timeA = a.scheduledAt || a.publishedAt;
      const timeB = b.scheduledAt || b.publishedAt;
      return timeA - timeB;
    });
  }, [
    newsFilterMode, 
    upcomingNews, 
    news, 
    nowTimestamp, 
    newsSentiment, 
    newsCategory, 
    filterOnlyActiveSymbol, 
    activeSymbol, 
    isNewsRelevantToSymbol, 
    sourceTierFilter, 
    isNewsMatchingSourceFilter
  ]);

  // Filtered Events: support upcoming only or upcoming + newly released prints
  const filteredEvents = useMemo(() => {
    return events.filter(evt => {
      if (calendarMode === 'UPCOMING' && evt.timestamp <= nowTimestamp) return false;
      if (calendarImpact === 'HIGH' && evt.impact !== 'HIGH') return false;
      if (calendarImpact === 'MEDIUM' && evt.impact === 'LOW') return false;
      if (calendarCurrency !== 'ALL' && evt.currency !== calendarCurrency) return false;
      return true;
    }).sort((a, b) => a.timestamp - b.timestamp);
  }, [events, nowTimestamp, calendarMode, calendarImpact, calendarCurrency]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      {/* Translucent Backdrop - background outside modal/bar is visible */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Floating Glass Toast Notification */}
      {toastMessage && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[10010] bg-[#090d16]/95 border border-cyan-500/50 text-cyan-200 px-4 py-2 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(6,182,212,0.3)] text-xs font-mono font-bold flex items-center gap-2 backdrop-blur-xl animate-in fade-in slide-in-from-top-3 duration-200">
          <CheckCircle2 size={14} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Modal Container */}
      <div 
        style={{
          borderColor: getThemeCardBorder(palette, false),
          boxShadow: `0 25px 60px -15px rgba(0,0,0,0.85), 0 0 35px ${hexToRgba(palette.bull, 0.25)}`,
          background: getThemeModalGradient(palette, isLight),
        }}
        className="relative w-full max-w-5xl h-[90vh] max-h-[850px] border rounded-2xl flex flex-col overflow-hidden text-white font-sans backdrop-blur-2xl pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Theme Accent Bar */}
        <div 
          className="absolute top-0 left-0 right-0 h-[2.5px] z-20"
          style={{
            background: `linear-gradient(90deg, ${palette.bull} 0%, ${palette.poc || '#6366f1'} 50%, ${palette.bear} 100%)`,
            boxShadow: `0 0 12px ${hexToRgba(palette.bull, 0.4)}`
          }}
        />

        {/* Top Header Banner */}
        <div 
          style={{
            background: `linear-gradient(90deg, ${hexToRgba(palette.bull, 0.12)} 0%, rgba(255,255,255,0.02) 50%, ${hexToRgba(palette.bear, 0.10)} 100%)`,
          }}
          className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10"
        >
          <div className="flex items-center gap-3">
            <MountAlgoLogo size="sm" showGlow className="w-7 h-7" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wide font-mono text-white flex items-center gap-1.5">
                  MOUNTALGO
                  <span className="text-white font-extrabold text-sm sm:text-base">INTELLIGENCE</span>
                </h2>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold border flex items-center gap-1.5 ${
                  feedProvider.isFailover
                    ? 'bg-amber-500/10 text-white border-amber-500/30'
                    : 'bg-white/[0.04] text-white border-white/10'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${feedProvider.isFailover ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 animate-pulse'}`} />
                  <span className="text-white">{feedProvider.isFailover ? 'FAILOVER FEED' : 'PRIMARY FEED'}</span>
                  <span className="text-zinc-400 font-normal">({feedProvider.latency}ms)</span>
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono flex items-center gap-2 mt-0.5">
                <span>Real-Time Market Feeds & Makroekonomi Terverifikasi</span>
                <span className="text-zinc-400">• Instrumen: <strong className="text-white font-semibold">{activeSymbol}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Global Timezone Selector */}
            <TimezoneSelector selectedTz={selectedTimezone} onChange={(tz) => setSelectedTimezone(tz)} />

            {/* Chart News Marker Visual Toggle [ON/OFF] */}
            <button
              onClick={toggleChartNewsMarkers}
              type="button"
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                showChartNewsMarkers
                  ? 'bg-white/[0.1] text-white border-white/25 shadow-xs'
                  : 'bg-white/[0.04] text-white border-white/10 hover:bg-white/[0.08]'
              }`}
              title={showChartNewsMarkers ? 'Sembunyikan Visual Ikon Berita di Chart [ON]' : 'Tampilkan Visual Ikon Berita di Chart [OFF]'}
            >
              <Flame size={13} className={showChartNewsMarkers ? "text-amber-400 animate-pulse" : "text-zinc-400"} />
              <span className="hidden md:inline text-[11px] font-bold text-white">IKON CHART</span>
              <span className="text-[10px] text-zinc-400 font-mono">[{showChartNewsMarkers ? "ON" : "OFF"}]</span>
            </button>

            {/* Audio Alert Chime Toggle */}
            <button
              onClick={toggleAudioAlert}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                isAudioAlertEnabled
                  ? 'bg-white/[0.1] text-white border-white/25 shadow-xs'
                  : 'bg-white/[0.04] text-white border-white/10 hover:bg-white/[0.08]'
              }`}
              title={isAudioAlertEnabled ? 'Matikan Notifikasi Audio Breaking News' : 'Nyalakan Notifikasi Audio Breaking News'}
            >
              {isAudioAlertEnabled ? <Volume2 size={13} className="text-white" /> : <VolumeX size={13} className="text-zinc-400" />}
              <span className="hidden md:inline text-[11px] font-bold text-white">AUDIO</span>
              <span className="text-[10px] text-zinc-400 font-mono">[{isAudioAlertEnabled ? 'ON' : 'OFF'}]</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={() => {
                tradingAudio.play('CLICK');
                fetchNews();
                fetchCalendar();
              }}
              disabled={isLoadingNews || isLoadingEvents}
              className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-mono disabled:opacity-50"
              title="Perbarui Data Sekarang"
            >
              <RefreshCw size={13} className={`text-zinc-400 ${isLoadingNews || isLoadingEvents ? 'animate-spin text-white' : ''}`} />
              <span className="hidden sm:inline font-medium text-white">Refresh</span>
            </button>

            {/* Close Modal Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
              title="Tutup (Esc)"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Tab Navigation & Live High-Impact Alert Bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-black/20 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/10 backdrop-blur-xl">
            <button
              onClick={() => {
                tradingAudio.play('CLICK');
                setActiveTab('news');
              }}
              style={activeTab === 'news' ? {
                backgroundColor: palette.bull,
                color: isLight ? '#ffffff' : '#000000',
              } : undefined}
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                activeTab === 'news'
                  ? 'shadow-xs font-bold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Newspaper size={13} />
              <span>News Feeds Realtime</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${
                activeTab === 'news'
                  ? 'bg-black/20 text-current'
                  : 'bg-white/10 text-zinc-400'
              }`}>
                {displayedNewsItems.length}
              </span>
            </button>

            <button
              onClick={() => {
                tradingAudio.play('CLICK');
                setActiveTab('calendar');
              }}
              style={activeTab === 'calendar' ? {
                backgroundColor: palette.bull,
                color: isLight ? '#ffffff' : '#000000',
              } : undefined}
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                activeTab === 'calendar'
                  ? 'shadow-xs font-bold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Calendar size={13} />
              <span>Kalender Berita Ekonomi</span>
              {nextHighImpact && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-rose-500/30 text-white font-black animate-pulse">
                  HIGH
                </span>
              )}
            </button>
          </div>

          {/* Real-time High Impact Event Countdown Banner */}
          {nextHighImpact && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs font-mono">
              <Flame size={13} className="text-rose-400 animate-bounce" />
              <span className="text-zinc-400 text-[11px] hidden md:inline">Jadwal High Impact:</span>
              <span className="font-bold text-white text-[11px] truncate max-w-[200px]">{nextHighImpact.flag} {nextHighImpact.event}</span>
              <span className="px-2 py-0.5 rounded-md bg-white/10 text-white font-black border border-white/10 text-[10px]">
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
              {/* Primary Feed Selector (Upcoming vs All) */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 p-1.5 rounded-xl bg-white/[0.02] border border-white/10">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-mono text-zinc-400 font-medium hidden sm:inline pl-1">Mode:</span>
                  <button
                    onClick={() => {
                      tradingAudio.play('CLICK');
                      setNewsFilterMode('UPCOMING_ONLY');
                    }}
                    style={newsFilterMode === 'UPCOMING_ONLY' ? {
                      backgroundColor: palette.bull,
                      color: isLight ? '#ffffff' : '#000000',
                    } : undefined}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                      newsFilterMode === 'UPCOMING_ONLY'
                        ? 'font-bold shadow-xs'
                        : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-white/10'
                    }`}
                  >
                    <Clock size={12} className={newsFilterMode === 'UPCOMING_ONLY' ? 'animate-pulse text-current' : 'text-zinc-400'} />
                    <span className={newsFilterMode === 'UPCOMING_ONLY' ? 'text-current font-bold' : 'text-white'}>Yang Akan Datang (Upcoming)</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${newsFilterMode === 'UPCOMING_ONLY' ? 'bg-black/20 text-current' : 'bg-white/10 text-zinc-400'}`}>
                      {upcomingNews.length}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      tradingAudio.play('CLICK');
                      setNewsFilterMode('ALL_FEEDS');
                    }}
                    style={newsFilterMode === 'ALL_FEEDS' ? {
                      backgroundColor: palette.bull,
                      color: isLight ? '#ffffff' : '#000000',
                    } : undefined}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                      newsFilterMode === 'ALL_FEEDS'
                        ? 'font-bold shadow-xs'
                        : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-white/10'
                    }`}
                  >
                    <Newspaper size={12} className={newsFilterMode === 'ALL_FEEDS' ? 'text-current' : 'text-zinc-400'} />
                    <span className={newsFilterMode === 'ALL_FEEDS' ? 'text-current font-bold' : 'text-white'}>Semua Wire Feeds Terkini</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {/* Single-Click Active Symbol News Filter Toggle */}
                  <button
                    onClick={() => {
                      tradingAudio.play('CLICK');
                      setFilterOnlyActiveSymbol(!filterOnlyActiveSymbol);
                      showToast(!filterOnlyActiveSymbol ? `Menampilkan berita khusus ${activeSymbol}` : 'Menampilkan berita semua instrumen');
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all border cursor-pointer ${
                      filterOnlyActiveSymbol
                        ? 'bg-white/[0.1] text-white border-white/25 shadow-xs font-bold'
                        : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white border-white/10'
                    }`}
                    title="Filter Berita Sesuai Instrumen yang Sedang Dibuka di Chart"
                  >
                    <Target size={12} className={filterOnlyActiveSymbol ? 'animate-pulse text-white' : 'text-zinc-400'} />
                    <span className="text-white font-medium">Hanya Aset Aktif</span>
                    <span className="text-zinc-400 font-mono text-[10px]">({activeSymbol})</span>
                  </button>
                </div>
              </div>

              {/* Filter and Search Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pb-1">
                <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar py-0.5">
                  {['ALL', 'BTC', 'ETH', 'SOL', 'Macro', 'Forex', 'DeFi'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setNewsCategory(cat)}
                      style={newsCategory === cat ? {
                        backgroundColor: palette.bull,
                        color: isLight ? '#ffffff' : '#000000',
                        borderColor: palette.bull
                      } : undefined}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all border cursor-pointer ${
                        newsCategory === cat
                          ? 'shadow-xs font-bold'
                          : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white border-white/10 font-medium'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Source Tier Whitelist Filter */}
                  <div className="flex items-center gap-0.5 bg-white/[0.03] p-1 rounded-lg border border-white/10 text-xs font-mono">
                    <span className="px-1.5 text-[10px] text-zinc-400 font-medium hidden md:inline">Sumber:</span>
                    {[
                      { id: 'ALL', label: 'Semua', title: 'Semua Sumber Berita' },
                      { id: 'TIER1', label: 'Tier-1 Inst.', title: 'Reuters, Bloomberg, WSJ, Yahoo Finance' },
                      { id: 'CRYPTO', label: 'Crypto Wire', title: 'Cointelegraph, CoinDesk, CryptoCompare' },
                      { id: 'OFFICIAL', label: 'Portal Resmi', title: 'Federal Reserve, BLS, ECB, BOE' }
                    ].map((src) => (
                      <button
                        key={src.id}
                        onClick={() => setSourceTierFilter(src.id as any)}
                        style={sourceTierFilter === src.id ? {
                          backgroundColor: palette.bull,
                          color: isLight ? '#ffffff' : '#000000'
                        } : undefined}
                        className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                          sourceTierFilter === src.id
                            ? 'font-bold shadow-xs'
                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                        title={src.title}
                      >
                        {src.label}
                      </button>
                    ))}
                  </div>

                  {/* Sentiment Filter */}
                  <div className="flex items-center gap-0.5 bg-white/[0.03] p-1 rounded-lg border border-white/10 text-xs font-mono">
                    <button
                      onClick={() => setNewsSentiment('ALL')}
                      style={newsSentiment === 'ALL' ? {
                        backgroundColor: palette.bull,
                        color: isLight ? '#ffffff' : '#000000'
                      } : undefined}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                        newsSentiment === 'ALL'
                          ? 'font-bold shadow-xs'
                          : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      Semua
                    </button>
                    <button
                      onClick={() => setNewsSentiment('Bullish')}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                        newsSentiment === 'Bullish'
                          ? 'bg-emerald-500/25 text-white font-bold border border-emerald-500/40'
                          : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      Bullish
                    </button>
                    <button
                      onClick={() => setNewsSentiment('Bearish')}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                        newsSentiment === 'Bearish'
                          ? 'bg-rose-500/25 text-white font-bold border border-rose-500/40'
                          : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      Bearish
                    </button>
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Cari berita..."
                      value={newsSearch}
                      onChange={(e) => setNewsSearch(e.target.value)}
                      className="bg-white/[0.04] border border-white/10 rounded-lg pl-7 pr-3 py-1 text-xs font-mono text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/30 w-32 sm:w-44 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* News Articles Grid */}
              {isLoadingNews && displayedNewsItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div
                    style={{ borderColor: `${palette.bull}40`, borderTopColor: palette.bull }}
                    className="w-10 h-10 rounded-full border-2 animate-spin"
                  />
                  <span className="text-xs font-mono font-bold tracking-wider" style={{ color: palette.bull }}>
                    MENYINKRONKAN JADWAL BERITA PASAR REALTIME...
                  </span>
                </div>
              ) : displayedNewsItems.length === 0 ? (
                <div className="text-center py-16 text-zinc-500 font-mono text-xs">
                  Tidak ada berita yang cocok dengan filter saat ini.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {displayedNewsItems.map(item => {
                    const eventTime = item.scheduledAt || item.publishedAt;
                    const isUpcomingEvent = eventTime > nowTimestamp;
                    const countdown = getLiveCountdown(eventTime);
                    const { timeStr, dateStr, tzStr } = formatLocalTime(eventTime);

                    // Relative time for past/wire news with precise time stamp
                    const diffPast = Math.max(0, nowTimestamp - eventTime);
                    const pastSecs = Math.floor(diffPast / 1000);
                    const pastMins = Math.floor(pastSecs / 60);
                    const relativePastStr = pastSecs < 60 
                      ? `${pastSecs}s lalu (${timeStr})` 
                      : pastMins < 60 
                      ? `${pastMins}m lalu (${timeStr})` 
                      : pastMins < 1440 
                      ? `${Math.floor(pastMins / 60)}j ${pastMins % 60}m lalu (${timeStr})` 
                      : `${dateStr}, ${timeStr}`;

                    const isExpandedAi = expandedAiDigestId === item.id;
                    const isBull = item.sentiment === 'Bullish';
                    const isBear = item.sentiment === 'Bearish';

                    return (
                      <div
                        key={item.id}
                        style={{
                          borderColor: getThemeCardBorder(palette, isUpcomingEvent),
                          boxShadow: getThemeCardBoxShadow(palette, isUpcomingEvent),
                          background: getThemeCardGradient(palette, isLight, isUpcomingEvent),
                        }}
                        className="group relative p-4 pl-5 rounded-xl border transition-all duration-300 flex flex-col justify-between backdrop-blur-xl hover:border-white/30 overflow-hidden"
                      >
                        {/* Theme Accent Bar */}
                        <div 
                          className="absolute left-0 top-0 bottom-0 w-[3.5px] transition-all"
                          style={{
                            backgroundColor: palette.bull,
                            boxShadow: isUpcomingEvent ? `0 0 10px ${palette.bull}` : undefined
                          }}
                        />

                        <div>
                          {/* Top Row: Tag / Source & Live Ticking Countdown */}
                          <div className="flex items-center justify-between gap-2 mb-2 text-[10px] font-mono">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold border border-white/10 bg-white/[0.05] text-white px-2 py-0.5 rounded-md">
                                {item.source}
                              </span>

                              {isUpcomingEvent ? (
                                <span
                                  style={{
                                    borderColor: `${palette.bull}50`,
                                    backgroundColor: `${palette.bull}15`,
                                    color: palette.bull
                                  }}
                                  className="flex items-center gap-1 px-2 py-0.5 rounded-md font-black border shadow-xs animate-pulse"
                                >
                                  <Clock size={11} style={{ color: palette.bull }} />
                                  <span>RILIS: {countdown.str} LAGI</span>
                                </span>
                              ) : (
                                <span className="text-zinc-400 flex items-center gap-1">
                                  <Clock size={10} className="text-zinc-500" />
                                  <span>{relativePastStr}</span>
                                </span>
                              )}
                            </div>

                            <span
                              className={`px-2 py-0.5 rounded-md font-bold uppercase text-[9px] border flex items-center gap-1.5 ${
                                item.sentiment === 'Bullish'
                                  ? 'bg-emerald-500/15 text-white border-emerald-500/30'
                                  : item.sentiment === 'Bearish'
                                  ? 'bg-rose-500/15 text-white border-rose-500/30'
                                  : 'bg-white/[0.04] text-zinc-300 border-white/10'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                item.sentiment === 'Bullish' ? 'bg-emerald-400' : item.sentiment === 'Bearish' ? 'bg-rose-400' : 'bg-zinc-400'
                              }`} />
                              {item.sentiment}
                            </span>
                          </div>

                          {/* Scheduled Event Timing Bar (For upcoming news) */}
                          {isUpcomingEvent && (
                            <div className="mb-2 px-2.5 py-1 rounded-lg bg-white/[0.02] border border-white/10 flex items-center justify-between text-[10.5px] font-mono text-zinc-300">
                              <span className="text-zinc-400">Jadwal Tepat:</span>
                              <span className="font-bold text-white">
                                {dateStr}, {timeStr} ({tzStr})
                              </span>
                            </div>
                          )}

                          {/* Title */}
                          <h3 className="text-sm font-bold text-white group-hover:text-zinc-100 transition-colors line-clamp-2 leading-snug">
                            {item.title}
                          </h3>

                          {/* Body preview */}
                          {item.body && (
                            <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">
                              {item.body}
                            </p>
                          )}

                          {/* Expandable AI Fundamental Digest Section */}
                          {isExpandedAi && (
                            <div 
                              style={{
                                background: getThemeAiDigestGradient(palette, isLight),
                                borderColor: getThemeCardBorder(palette, false),
                              }}
                              className="mt-3 p-3 rounded-xl border backdrop-blur-xl shadow-lg space-y-2 text-xs font-sans animate-in fade-in duration-200"
                            >
                              <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                                <span className="text-[11px] font-mono font-bold flex items-center gap-1.5 text-white">
                                  <Sparkles size={12} style={{ color: palette.bull }} />
                                  AI Fundamental Impact Assessment ({activeSymbol})
                                </span>
                                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                                  isBull ? 'bg-emerald-500/20 text-white' : isBear ? 'bg-rose-500/20 text-white' : 'bg-white/10 text-zinc-300'
                                }`}>
                                  {item.sentiment}
                                </span>
                              </div>

                              <div className="space-y-1.5 text-[11px] text-zinc-300 leading-relaxed font-sans">
                                <div className="flex items-start gap-1.5">
                                  <TrendingUp size={13} className="shrink-0 mt-0.5" style={{ color: palette.bull }} />
                                  <div>
                                    <strong className="text-white font-mono">Dampak Tren:</strong> {
                                      isBull 
                                        ? `Katalis ekspansi bullish berpotensi mendorong ${activeSymbol} menembus resistance struktural dengan momentum volume tinggi.`
                                        : isBear
                                        ? `Tekanan likuidasi bearish berpotensi menguji support kunci ${activeSymbol}, waspadai aksi sweep likuiditas.`
                                        : `Sentimen netral / konsolidasi. Reaksi harga cenderung membentuk false breakout sebelum tren sejati terbentuk.`
                                    }
                                  </div>
                                </div>

                                <div className="flex items-start gap-1.5">
                                  <Target size={13} className="text-amber-400 shrink-0 mt-0.5" />
                                  <div>
                                    <strong className="text-white font-mono">Level Kunci Terpicu:</strong> {
                                      isBull
                                        ? `Order Block demand & Fair Value Gap bawah menjadi area pullback ideal sebelum melanjutkan uptrend.`
                                        : isBear
                                        ? `Supply zone & rejection wick atas menjadi area validasi konfirmasi entri short.`
                                        : `Rentang range 4H menjadi zona pantauan retest support dan resistance.`
                                    }
                                  </div>
                                </div>

                                <div className="flex items-start gap-1.5">
                                  <ShieldAlert size={13} className="text-rose-400 shrink-0 mt-0.5" />
                                  <div>
                                    <strong className="text-white font-mono">Panduan Risiko:</strong> Batasi risiko per trade maks 1-2%, hindari eksekusi market order menjelang volatilitas ekstrem untuk mencegah slippage.
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Footer & Action row */}
                        <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/5 text-xs">
                          {/* Interactive Tags: Click to switch chart symbol instantly */}
                          <div className="flex items-center gap-1 overflow-hidden">
                            {item.tags?.slice(0, 3).map(tag => (
                              <button
                                key={tag}
                                onClick={() => handleSwitchSymbol(tag)}
                                className="text-[9.5px] font-mono px-1.5 py-0.5 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
                                title={`Klik untuk ganti instrumen chart ke #${tag}`}
                              >
                                #{tag}
                              </button>
                            ))}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Toggle AI Digest Button */}
                            <button
                              onClick={() => {
                                tradingAudio.play('CLICK');
                                setExpandedAiDigestId(isExpandedAi ? null : item.id);
                              }}
                              style={isExpandedAi ? {
                                backgroundColor: palette.bull,
                                color: isLight ? '#ffffff' : '#000000',
                                borderColor: palette.bull
                              } : undefined}
                              className={`px-2.5 py-1 rounded-lg border text-[10px] font-mono transition-all flex items-center gap-1 cursor-pointer ${
                                isExpandedAi
                                  ? 'font-bold shadow-xs'
                                  : 'bg-white/[0.04] hover:bg-white/[0.08] text-white border-white/10'
                              }`}
                              title="Tampilkan Analisis Singkat Dampak Fundamental"
                            >
                              <Sparkles size={11} className={isExpandedAi ? 'text-current' : 'text-zinc-400'} />
                              <span className={isExpandedAi ? 'text-current font-bold' : 'text-white'}>{isExpandedAi ? 'Tutup Digest' : 'AI Digest'}</span>
                            </button>

                            {/* AI Agent Deep Analysis Button */}
                            {onOpenAiAgentWithContext && (
                              <button
                                onClick={() => {
                                  onOpenAiAgentWithContext(
                                    `Analisis dampak berita berikut terhadap pasar kripto/forex (${activeSymbol}): "${item.title}". Waktu rilis: ${timeStr} ${tzStr}. Apa potensi reaksi harga dan setup yang disarankan?`
                                  );
                                  onClose();
                                }}
                                className="px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/10 text-[10px] font-mono transition-all flex items-center gap-1 cursor-pointer"
                                title="Minta Analisis AI Agent untuk Berita Ini"
                              >
                                <Bot size={11} className="text-zinc-400" />
                                <span className="text-white">AI Agent</span>
                              </button>
                            )}

                            {/* Direct External Verified Source Link */}
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/10 text-[10px] font-mono transition-all flex items-center gap-1.5 cursor-pointer"
                              title="Buka lembar berita asli dari sumber terverifikasi di tab baru"
                            >
                              <span className="text-white">Sumber Asli</span>
                              <ExternalLink size={10} className="text-zinc-400" />
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
              <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-white/10">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono text-zinc-400 font-medium">Tampilan:</span>
                    <div className="flex items-center gap-0.5 bg-white/[0.03] p-1 rounded-lg border border-white/10 text-xs font-mono">
                      <button
                        onClick={() => setCalendarMode('ALL')}
                        style={calendarMode === 'ALL' ? { backgroundColor: palette.bull, color: isLight ? '#ffffff' : '#000000' } : undefined}
                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${calendarMode === 'ALL' ? 'font-bold shadow-xs' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                      >
                        Mendatang & Rilis Baru
                      </button>
                      <button
                        onClick={() => setCalendarMode('UPCOMING')}
                        style={calendarMode === 'UPCOMING' ? { backgroundColor: palette.bull, color: isLight ? '#ffffff' : '#000000' } : undefined}
                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${calendarMode === 'UPCOMING' ? 'font-bold shadow-xs' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                      >
                        Mendatang Saja
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono text-zinc-400 font-medium">Dampak:</span>
                    <div className="flex items-center gap-0.5 bg-white/[0.03] p-1 rounded-lg border border-white/10 text-xs font-mono">
                      <button
                        onClick={() => setCalendarImpact('ALL')}
                        style={calendarImpact === 'ALL' ? { backgroundColor: palette.bull, color: isLight ? '#ffffff' : '#000000' } : undefined}
                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${calendarImpact === 'ALL' ? 'font-bold shadow-xs' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                      >
                        Semua
                      </button>
                      <button
                        onClick={() => setCalendarImpact('HIGH')}
                        className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition-all cursor-pointer ${calendarImpact === 'HIGH' ? 'bg-rose-500/25 text-white font-bold border border-rose-500/40' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                      >
                        <Flame size={12} className="text-rose-400" />
                        <span className="text-white">High Impact</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono text-zinc-400 font-medium">Mata Uang:</span>
                    <div className="flex items-center gap-0.5 bg-white/[0.03] p-1 rounded-lg border border-white/10 text-xs font-mono">
                      {['ALL', 'USD', 'EUR', 'GBP'].map(curr => (
                        <button
                          key={curr}
                          onClick={() => setCalendarCurrency(curr)}
                          style={calendarCurrency === curr ? { backgroundColor: palette.bull, color: isLight ? '#ffffff' : '#000000' } : undefined}
                          className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${calendarCurrency === curr ? 'font-bold shadow-xs' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                        >
                          {curr}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSimulateRelease}
                    disabled={isSimulating}
                    className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/10 text-xs font-mono font-medium flex items-center gap-1.5 cursor-pointer transition-all"
                    title="Simulasikan rilis instan angka aktual US CPI MoM"
                  >
                    <Zap size={12} className={isSimulating ? "animate-spin text-amber-400" : "text-zinc-400"} />
                    <span className="text-white">{isSimulating ? "Memproses..." : "Uji Rilis Aktual (Simulasi)"}</span>
                  </button>

                  <button
                    onClick={() => fetchCalendar()}
                    disabled={isLoadingEvents}
                    className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-white/10 text-xs transition-colors cursor-pointer flex items-center justify-center"
                    title="Muat Ulang Data"
                  >
                    <RefreshCw size={13} className={isLoadingEvents ? "animate-spin text-white" : ""} />
                  </button>
                </div>
              </div>

              {/* Economic Calendar Events Table */}
              {isLoadingEvents && events.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div
                    style={{ borderColor: `${palette.bull}40`, borderTopColor: palette.bull }}
                    className="w-10 h-10 rounded-full border-2 animate-spin"
                  />
                  <span className="text-xs font-mono font-bold tracking-wider" style={{ color: palette.bull }}>
                    MEMUAT KALENDER BERITA EKONOMI MAKRO...
                  </span>
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="text-center py-16 text-zinc-500 font-mono text-xs">
                  Tidak ada event yang cocok dengan filter saat ini.
                </div>
              ) : (
                <div 
                  style={{
                    background: getThemeCardGradient(palette, isLight, false),
                    borderColor: getThemeCardBorder(palette, false),
                    boxShadow: getThemeCardBoxShadow(palette, false),
                  }}
                  className="overflow-x-auto rounded-xl border backdrop-blur-2xl"
                >
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.02] text-[10px] text-zinc-400 uppercase tracking-wider">
                        <th className="py-3 px-3">Waktu Realtime</th>
                        <th className="py-3 px-3">Negara</th>
                        <th className="py-3 px-3">Dampak</th>
                        <th className="py-3 px-3">Event / Indikator</th>
                        <th className="py-3 px-3 text-right">Aktual</th>
                        <th className="py-3 px-3 text-right">Prakiraan</th>
                        <th className="py-3 px-3 text-right">Sebelumnya</th>
                        <th className="py-3 px-3 text-center">Waktu Mundur</th>
                        <th className="py-3 px-3 text-center">AI Analisis</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredEvents.map(evt => {
                        const countdown = getLiveCountdown(evt.timestamp);
                        const { timeStr, dateStr, tzStr } = formatLocalTime(evt.timestamp);

                        return (
                          <tr 
                            key={evt.id}
                            className={`hover:bg-white/[0.04] transition-colors ${evt.impact === 'HIGH' ? 'bg-rose-950/10' : ''}`}
                          >
                            <td className="py-3 px-3 whitespace-nowrap">
                              <div className="font-bold text-white">{timeStr} <span className="text-[10px] font-normal text-zinc-400">{tzStr}</span></div>
                              <div className="text-[10px] text-zinc-500">{dateStr}</div>
                            </td>

                            <td className="py-3 px-3 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 font-bold text-white">
                                <span className="text-base">{evt.flag}</span>
                                <span>{evt.currency}</span>
                              </div>
                            </td>

                            <td className="py-3 px-3 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                                  evt.impact === 'HIGH'
                                    ? 'bg-rose-500/20 text-white border border-rose-500/40'
                                    : evt.impact === 'MEDIUM'
                                    ? 'bg-amber-500/20 text-white border border-amber-500/40'
                                    : 'bg-white/[0.04] text-zinc-400 border border-white/10'
                                }`}
                              >
                                {evt.impact}
                              </span>
                            </td>

                            <td className="py-3 px-3 min-w-[220px]">
                              <div className="font-bold text-white flex items-center gap-1.5 flex-wrap">
                                <span>{evt.event}</span>
                                {evt.isJustReleased && (
                                  <span className="text-[8px] px-1.5 py-0.2 rounded bg-emerald-500/30 text-white font-bold border border-emerald-500/50 animate-pulse">
                                    LIVE ACTUAL
                                  </span>
                                )}
                                {evt.volatilityRisk === 'EXTREME' && (
                                  <span className="text-[8.5px] px-1 rounded bg-rose-500/30 text-white font-bold border border-rose-500/40">
                                    HIGH VOLATILITY
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">
                                {evt.description}
                              </div>
                              <div className="flex items-center gap-3 mt-1 flex-wrap">
                                {evt.officialUrl && (
                                  <a
                                    href={evt.officialUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[9.5px] font-mono px-1.5 py-0.5 rounded-md border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] transition-colors"
                                    title={`Kunjungi portal resmi rilis data (${evt.sourceOrg || 'Lembaga Resmi'})`}
                                  >
                                    <span className="text-white">{evt.sourceOrg || 'Portal Resmi Rilis'}</span>
                                    <ExternalLink size={9} className="text-zinc-400" />
                                  </a>
                                )}
                                {evt.marketReaction && (
                                  <span className="text-[9.5px] font-mono text-amber-300 font-bold">
                                    ⚡ {evt.marketReaction}
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-3 px-3 text-right whitespace-nowrap">
                              {evt.actual ? (
                                <div className="flex flex-col items-end">
                                  <span className="font-bold text-emerald-400 font-mono text-sm">{evt.actual}</span>
                                  {evt.deviation && (
                                    <span
                                      className={`text-[8.5px] font-mono px-1.5 py-0.2 rounded border font-bold ${
                                        evt.deviationStatus === 'BEAT'
                                          ? 'bg-emerald-500/20 text-white border-emerald-500/50'
                                          : evt.deviationStatus === 'MISS'
                                          ? 'bg-rose-500/20 text-white border-rose-500/50'
                                          : 'bg-white/10 text-white border-white/20'
                                      }`}
                                    >
                                      {evt.deviation} ({evt.deviationStatus})
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-amber-400 text-[10px] font-bold">Menunggu</span>
                              )}
                            </td>

                            <td className="py-3 px-3 text-right text-zinc-300 whitespace-nowrap font-medium">
                              {evt.forecast}
                            </td>

                            <td className="py-3 px-3 text-right text-zinc-400 whitespace-nowrap">
                              {evt.previous}
                            </td>

                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              <span
                                className={`text-[10.5px] px-2 py-0.5 rounded-md font-mono font-bold border ${
                                  countdown.isPast
                                    ? 'bg-white/[0.04] text-zinc-400 border-white/10'
                                    : 'bg-white/[0.08] text-white border-white/20 shadow-xs'
                                }`}
                              >
                                {countdown.isPast ? '✓ ' + countdown.str : '⏱ ' + countdown.str}
                              </span>
                            </td>

                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              {onOpenAiAgentWithContext && (
                                <button
                                  onClick={() => {
                                    onOpenAiAgentWithContext(
                                      `Bagaimana proyeksi dampak rilis berita ekonomi "${evt.event}" (${evt.currency}, Forecast: ${evt.forecast}, Previous: ${evt.previous}) terhadap pergerakan ${activeSymbol}? Waktu rilis: ${timeStr} ${tzStr}. Berikan rekomendasi skenario jika hasil aktual > atau < forecast.`
                                    );
                                    onClose();
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/10 text-[10px] font-mono transition-all flex items-center gap-1 mx-auto cursor-pointer"
                                  title="Analisis Skenario Rilis dengan MountAlgo AI"
                                >
                                  <Bot size={11} className="text-zinc-400" />
                                  <span className="text-white">AI Analisis</span>
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
