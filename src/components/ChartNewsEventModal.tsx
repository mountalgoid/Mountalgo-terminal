import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Clock,
  Flame,
  AlertTriangle,
  Calendar,
  Sparkles,
  Bot,
  ExternalLink,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Zap,
  Info,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { tradingAudio } from '../utils/audioSynth';
import { formatTimeInTimezone, getStoredTimezone } from '../utils/timezone';
import { TimezoneSelector } from './TimezoneSelector';
import { useTheme } from '../context/ThemeContext';
import { 
  getThemeCardGradient, 
  getThemeCardBorder, 
  getThemeCardBoxShadow, 
  getThemeModalGradient, 
  hexToRgba 
} from '../utils/themeGradient';

export interface ChartNewsEconomicEvent {
  id: string;
  event: string;
  country: string;
  currency: string;
  flag: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: number;
  dateFormatted?: string;
  timeFormatted?: string;
  forecast?: string;
  previous?: string;
  actual?: string | null;
  deviation?: string | null;
  deviationStatus?: 'BEAT' | 'MISS' | 'IN_LINE' | null;
  marketReaction?: string | null;
  isJustReleased?: boolean;
  unit?: string;
  volatilityRisk?: 'EXTREME' | 'HIGH' | 'MODERATE' | 'LOW';
  description?: string;
}

interface ChartNewsEventModalProps {
  event: ChartNewsEconomicEvent;
  onClose: () => void;
  onOpenFullCalendar?: () => void;
  onOpenAiAgent?: (prompt: string) => void;
  activeSymbol?: string;
  clusterEvents?: ChartNewsEconomicEvent[];
}

export const ChartNewsEventModal: React.FC<ChartNewsEventModalProps> = ({
  event: initialEvent,
  onClose,
  onOpenFullCalendar,
  onOpenAiAgent,
  activeSymbol = 'BTCUSDT',
  clusterEvents = []
}) => {
  const { palette, isLight } = useTheme();
  const [currentEvent, setCurrentEvent] = useState<ChartNewsEconomicEvent>(initialEvent);
  const [now, setNow] = useState<number>(Date.now());
  const [isFetchingActual, setIsFetchingActual] = useState<boolean>(false);
  const [showSimulateSuccess, setShowSimulateSuccess] = useState<boolean>(false);

  // Sync state if initialEvent changes
  useEffect(() => {
    setCurrentEvent(initialEvent);
  }, [initialEvent]);

  // Real-time ticking 1-second countdown
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const diff = currentEvent.timestamp - now;
  const isPast = diff <= 0;

  // Auto-fetch actual print within 3-5 seconds when countdown hits 0 and actual is still null
  const fetchLatestActualPrint = useCallback(async () => {
    try {
      setIsFetchingActual(true);
      const res = await fetch('/api/economic-calendar');
      if (res.ok) {
        const json = await res.json();
        const updated = json.events?.find((e: any) => e.id === currentEvent.id);
        if (updated) {
          setCurrentEvent(updated);
          if (updated.actual && !currentEvent.actual) {
            tradingAudio.play('ALERT');
          }
        }
      }
    } catch (e) {
      console.warn('Failed to auto-fetch actual print:', e);
    } finally {
      setIsFetchingActual(false);
    }
  }, [currentEvent.id, currentEvent.actual]);

  useEffect(() => {
    if (isPast && !currentEvent.actual && !isFetchingActual) {
      // Auto-trigger fetch within 3 seconds
      const timeout = setTimeout(() => {
        fetchLatestActualPrint();
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [isPast, currentEvent.actual, isFetchingActual, fetchLatestActualPrint]);

  // Instant trigger simulation
  const handleTriggerSimulate = async () => {
    try {
      setIsFetchingActual(true);
      tradingAudio.play('ORDER_SUBMITTED');
      const res = await fetch('/api/economic-calendar/trigger-release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: currentEvent.id })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setCurrentEvent(prev => ({
            ...prev,
            actual: json.data.actual,
            deviation: json.data.deviation,
            deviationStatus: json.data.deviationStatus,
            marketReaction: json.data.marketReaction,
            isPast: true,
            isJustReleased: true
          }));
          tradingAudio.play('ALERT');
          setShowSimulateSuccess(true);
          setTimeout(() => setShowSimulateSuccess(false), 3500);
        }
      }
    } catch (err) {
      console.error('Simulate release error:', err);
    } finally {
      setIsFetchingActual(false);
    }
  };

  const [selectedTimezone, setSelectedTimezone] = useState<string>(() => getStoredTimezone());

  useEffect(() => {
    const handleTzChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) setSelectedTimezone(customEvent.detail);
    };
    window.addEventListener('mountalgo_timezone_changed', handleTzChange);
    return () => window.removeEventListener('mountalgo_timezone_changed', handleTzChange);
  }, []);

  const hours = Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
  const minutes = Math.max(0, Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));
  const seconds = Math.max(0, Math.floor((diff % (1000 * 60)) / 1000));

  // Dynamic user selected timezone representation
  const formattedTz = formatTimeInTimezone(currentEvent.timestamp, selectedTimezone);
  const localTimeStr = formattedTz.timeWithSecsStr;
  const localDateStr = formattedTz.dateStr;
  const tzName = formattedTz.tzAbbr;

  const isHighImpact = currentEvent.impact === 'HIGH';
  const hasActual = Boolean(currentEvent.actual);
  const devStatus = currentEvent.deviationStatus || (hasActual ? 'BEAT' : null);

  const handleConsultAi = () => {
    const prompt = `Analisis skenario dan risiko rilis berita ekonomi "${currentEvent.event}" (${currentEvent.currency}) pada instrumen ${activeSymbol}. Prakiraan: ${currentEvent.forecast || '-'}, Sebelumnya: ${currentEvent.previous || '-'}, Hasil Aktual: ${currentEvent.actual || 'Belum rilis'}, Deviasi: ${currentEvent.deviation || '-'}. Bagaimana strategi posisi, lonjakan spread, dan zona likuiditas yang harus diwaspadai?`;
    if (onOpenAiAgent) {
      onOpenAiAgent(prompt);
    }
  };

  return (
    <div
      id="chart-news-event-modal-overlay"
      className="fixed inset-0 z-[10050] flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150"
    >
      {/* Translucent Backdrop - background outside modal/bar is visible */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Glassmorphic Container */}
      <div
        id="chart-news-event-modal-card"
        style={{
          borderColor: getThemeCardBorder(palette, false),
          boxShadow: `0 20px 50px rgba(0,0,0,0.85), 0 0 35px ${hexToRgba(palette.bull, 0.25)}`,
          background: getThemeModalGradient(palette, isLight),
        }}
        className="relative w-full max-w-lg border rounded-2xl flex flex-col overflow-hidden text-white font-sans backdrop-blur-2xl pointer-events-auto shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)]"
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

        {/* Header Bar */}
        <div 
          style={{
            background: `linear-gradient(90deg, ${hexToRgba(palette.bull, 0.12)} 0%, rgba(255,255,255,0.02) 50%, ${hexToRgba(palette.bear, 0.10)} 100%)`,
          }}
          className="flex items-center justify-between px-5 py-3.5 border-b border-white/10"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-2xl select-none">{currentEvent.flag}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold" style={{ color: palette.bull }}>
                  {currentEvent.currency} NEWS MILESTONE
                </span>
                <span
                  className={`text-[9px] font-mono px-2 py-0.5 rounded-md font-bold border uppercase tracking-wider ${
                    isHighImpact
                      ? 'bg-rose-500/20 text-white border-rose-500/40'
                      : 'bg-white/[0.04] text-zinc-300 border-white/10'
                  }`}
                >
                  {currentEvent.impact} IMPACT
                </span>
                {hasActual && (
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-md font-bold bg-emerald-500/20 text-white border border-emerald-500/40 animate-pulse">
                    LIVE ACTUAL
                  </span>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                {currentEvent.event}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TimezoneSelector variant="badge" />
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
              title="Tutup (Esc)"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Cluster Tabs Switcher */}
        {clusterEvents && clusterEvents.length > 1 && (
          <div className="px-5 py-2.5 bg-black/20 border-b border-white/10 flex gap-2 overflow-x-auto items-center scrollbar-thin select-none">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap shrink-0 mr-1">
              Daftar Cluster ({clusterEvents.length}):
            </span>
            {clusterEvents.map((evt) => {
              const isActive = evt.id === currentEvent.id;
              return (
                <button
                  key={evt.id}
                  onClick={() => {
                    setCurrentEvent(evt);
                    tradingAudio.play('PRESET');
                  }}
                  style={isActive ? {
                    borderColor: `${palette.bull}80`,
                    boxShadow: `0 0 10px ${palette.bull}25`
                  } : undefined}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-white/[0.08] text-white'
                      : 'bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <span className="text-sm">{evt.flag}</span>
                  <span className="text-white">{evt.event.length > 20 ? evt.event.substring(0, 20) + '...' : evt.event}</span>
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${evt.impact === 'HIGH' ? 'bg-rose-500' : evt.impact === 'MEDIUM' ? 'bg-amber-500' : ''}`}
                    style={evt.impact !== 'HIGH' && evt.impact !== 'MEDIUM' ? { backgroundColor: palette.bull } : undefined}
                  />
                </button>
              );
            })}
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Real-time Countdown or Live Actual Print Banner */}
          {hasActual ? (
            <div className="rounded-xl p-4 bg-gradient-to-r from-emerald-950/40 via-[#0a161d] to-cyan-950/40 border border-emerald-500/40 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-[0_0_25px_rgba(16,185,129,0.15)]">
              <div className="absolute top-2 right-3 flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                HASIL AKTUAL TERKONFIRMASI
              </div>

              <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                ANGKA AKTUAL RILIS RESMI
              </div>

              <div className="flex items-center gap-3 my-1">
                <span className="font-mono text-3xl sm:text-4xl font-black text-emerald-300 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                  {currentEvent.actual}
                </span>

                {currentEvent.deviation && (
                  <div className={`px-2.5 py-1 rounded-lg font-mono text-xs font-black border ${
                    devStatus === 'BEAT'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                      : devStatus === 'MISS'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                      : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  }`}>
                    {devStatus === 'BEAT' && <TrendingUp size={12} className="inline mr-1" />}
                    {devStatus === 'MISS' && <TrendingDown size={12} className="inline mr-1" />}
                    {currentEvent.deviation} ({devStatus})
                  </div>
                )}
              </div>

              {currentEvent.marketReaction && (
                <div className="mt-2 text-xs font-mono font-bold text-amber-300 bg-amber-950/30 px-3 py-1.5 rounded-lg border border-amber-500/30 w-full text-center">
                  ⚡ Reaksi Pasar: {currentEvent.marketReaction}
                </div>
              )}
            </div>
          ) : (
            <div 
              style={{
                background: getThemeCardGradient(palette, isLight, true),
                borderColor: getThemeCardBorder(palette, true),
                boxShadow: getThemeCardBoxShadow(palette, true),
              }}
              className="rounded-xl p-4 backdrop-blur-xl border flex flex-col items-center justify-center text-center relative overflow-hidden"
            >
              <div className="absolute top-2 right-3 flex items-center gap-1.5 text-[10px] font-mono text-zinc-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                SINKRON WAKTU REALTIME
              </div>

              <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-mono mb-1">
                <Clock size={14} style={{ color: palette.bull }} />
                <span>WAKTU MUNDUR MENUJU RILIS:</span>
              </div>

              {isPast ? (
                <div className="py-2 text-rose-400 font-mono font-black text-xl tracking-wider animate-pulse flex items-center gap-2">
                  <Flame size={20} />
                  <span>SEDANG RILIS • MEMUAT ANGKA AKTUAL...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 sm:gap-3 my-1">
                  {/* Hours */}
                  <div className="flex flex-col items-center">
                    <span className="font-mono text-2xl sm:text-3xl font-black text-white bg-white/[0.05] px-3 py-1 rounded-lg border border-white/10 shadow-md min-w-[54px]">
                      {hours.toString().padStart(2, '0')}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-400 mt-1 uppercase">Jam</span>
                  </div>
                  <span className="text-xl font-mono font-bold -mt-3" style={{ color: palette.bull }}>:</span>

                  {/* Minutes */}
                  <div className="flex flex-col items-center">
                    <span
                      style={{
                        color: palette.bull,
                        borderColor: `${palette.bull}50`,
                        boxShadow: `0 0 15px ${palette.bull}25`
                      }}
                      className="font-mono text-2xl sm:text-3xl font-black bg-white/[0.05] px-3 py-1 rounded-lg border min-w-[54px]"
                    >
                      {minutes.toString().padStart(2, '0')}
                    </span>
                    <span className="text-[9px] font-mono mt-1 uppercase font-bold" style={{ color: palette.bull }}>Menit</span>
                  </div>
                  <span className="text-xl font-mono font-bold -mt-3" style={{ color: palette.bull }}>:</span>

                  {/* Seconds */}
                  <div className="flex flex-col items-center">
                    <span className="font-mono text-2xl sm:text-3xl font-black text-rose-400 bg-white/[0.05] px-3 py-1 rounded-lg border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.2)] min-w-[54px]">
                      {seconds.toString().padStart(2, '0')}
                    </span>
                    <span className="text-[9px] font-mono text-rose-400 mt-1 uppercase font-bold">Detik</span>
                  </div>
                </div>
              )}

              <div className="text-[11px] font-mono text-zinc-400 mt-2">
                Tepat pada bar chart:{' '}
                <span className="text-white font-bold">{localTimeStr}</span> ({tzName}) •{' '}
                <span className="text-zinc-400">{localDateStr}</span>
              </div>
            </div>
          )}

          {/* Economic Data Metrics Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            <div 
              style={{
                background: getThemeCardGradient(palette, isLight, false),
                borderColor: getThemeCardBorder(palette, false),
              }}
              className="p-2.5 rounded-xl backdrop-blur-xl border text-center shadow-xs"
            >
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                Prakiraan
              </span>
              <span className="text-sm font-mono font-black mt-0.5 block" style={{ color: palette.bull }}>
                {currentEvent.forecast || '-'}
              </span>
            </div>
            <div 
              style={{
                background: getThemeCardGradient(palette, isLight, false),
                borderColor: getThemeCardBorder(palette, false),
              }}
              className="p-2.5 rounded-xl backdrop-blur-xl border text-center shadow-xs"
            >
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                Sebelumnya
              </span>
              <span className="text-sm font-mono font-black text-white mt-0.5 block">
                {currentEvent.previous || '-'}
              </span>
            </div>
            <div 
              style={{
                background: getThemeCardGradient(palette, isLight, false),
                borderColor: getThemeCardBorder(palette, false),
              }}
              className="p-2.5 rounded-xl backdrop-blur-xl border text-center shadow-xs"
            >
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                Hasil Aktual
              </span>
              <span className={`text-sm font-mono font-black mt-0.5 block ${
                hasActual ? 'text-emerald-400' : 'text-amber-300'
              }`}>
                {currentEvent.actual || 'Menunggu'}
              </span>
            </div>
          </div>

          {/* Description & Volatility Warning */}
          <div 
            style={{
              background: getThemeCardGradient(palette, isLight, false),
              borderColor: getThemeCardBorder(palette, false),
            }}
            className="p-3.5 rounded-xl backdrop-blur-xl border text-xs space-y-2 shadow-xs"
          >
            <div className="flex items-start gap-2 text-zinc-200 leading-relaxed">
              <Info size={14} className="shrink-0 mt-0.5" style={{ color: palette.bull }} />
              <span>{currentEvent.description || 'Pengumuman data ekonomi makro yang berpotensi menggerakkan likuiditas dan volatilitas pasar secara signifikan.'}</span>
            </div>

            {currentEvent.volatilityRisk === 'EXTREME' && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] font-mono">
                <AlertTriangle size={13} className="shrink-0 text-rose-400" />
                <span>
                  <strong>Peringatan Volatilitas Ekstrim:</strong> Waspadai pelebaran spread dan lonjakan slippage pada detik rilis data.
                </span>
              </div>
            )}

            {/* Instant Trigger Simulation Button for Testing */}
            {!hasActual && (
              <div className="pt-1 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleTriggerSimulate}
                  disabled={isFetchingActual}
                  className="text-[10.5px] font-mono hover:bg-white/[0.08] flex items-center gap-1.5 transition-colors cursor-pointer py-1.5 px-2.5 rounded-lg border border-white/10 bg-white/[0.04] text-white"
                >
                  <RefreshCw size={11} className={`text-zinc-400 ${isFetchingActual ? 'animate-spin text-white' : ''}`} />
                  <span className="text-white">{isFetchingActual ? 'Memproses Rilis...' : 'Uji Simulasi Rilis Angka Aktual'}</span>
                </button>

                {showSimulateSuccess && (
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Terpublikasi!
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
            <button
              onClick={handleConsultAi}
              style={{
                backgroundColor: palette.bull,
                color: isLight ? '#ffffff' : '#040d12',
                boxShadow: `0 0 20px ${palette.bull}40`
              }}
              className="w-full sm:flex-1 py-2.5 px-4 rounded-xl hover:brightness-110 font-mono text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Bot size={15} />
              <span>Analisis Skenario AI</span>
            </button>

            {onOpenFullCalendar && (
              <button
                onClick={onOpenFullCalendar}
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Calendar size={14} className="text-zinc-400" />
                <span>Kalender Lengkap</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartNewsEventModal;
