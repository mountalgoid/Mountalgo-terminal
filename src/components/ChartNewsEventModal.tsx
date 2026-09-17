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
}

export const ChartNewsEventModal: React.FC<ChartNewsEventModalProps> = ({
  event: initialEvent,
  onClose,
  onOpenFullCalendar,
  onOpenAiAgent,
  activeSymbol = 'BTCUSDT'
}) => {
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
      {/* Dramatic Blur Glassmorphism Backdrop */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Glassmorphic Container */}
      <div
        id="chart-news-event-modal-card"
        className="relative w-full max-w-lg bg-gradient-to-b from-[#0c121e]/95 via-[#080d17]/95 to-[#04070d]/95 border border-cyan-500/40 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_35px_rgba(6,182,212,0.2)] flex flex-col overflow-hidden text-white font-sans backdrop-blur-2xl pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-gradient-to-r from-cyan-950/40 via-transparent to-rose-950/30">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl select-none">{currentEvent.flag}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-cyan-400">
                  {currentEvent.currency} NEWS MILESTONE
                </span>
                <span
                  className={`text-[9px] font-mono px-2 py-0.5 rounded font-black border uppercase tracking-wider ${
                    isHighImpact
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {currentEvent.impact} IMPACT
                </span>
                {hasActual && (
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
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
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Tutup (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

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
            <div className="rounded-xl p-4 bg-gradient-to-r from-rose-950/30 via-[#0a101d] to-cyan-950/30 border border-white/10 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-inner">
              <div className="absolute top-2 right-3 flex items-center gap-1.5 text-[10px] font-mono text-cyan-300/80">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                SINKRON WAKTU REALTIME
              </div>

              <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-mono mb-1">
                <Clock size={14} className="text-cyan-400" />
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
                    <span className="font-mono text-2xl sm:text-3xl font-black text-white bg-black/50 px-3 py-1 rounded-lg border border-white/10 shadow-lg min-w-[54px]">
                      {hours.toString().padStart(2, '0')}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-400 mt-1 uppercase">Jam</span>
                  </div>
                  <span className="text-xl font-mono text-cyan-400 font-bold -mt-3">:</span>

                  {/* Minutes */}
                  <div className="flex flex-col items-center">
                    <span className="font-mono text-2xl sm:text-3xl font-black text-cyan-300 bg-black/50 px-3 py-1 rounded-lg border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)] min-w-[54px]">
                      {minutes.toString().padStart(2, '0')}
                    </span>
                    <span className="text-[9px] font-mono text-cyan-400 mt-1 uppercase font-bold">Menit</span>
                  </div>
                  <span className="text-xl font-mono text-cyan-400 font-bold -mt-3">:</span>

                  {/* Seconds */}
                  <div className="flex flex-col items-center">
                    <span className="font-mono text-2xl sm:text-3xl font-black text-rose-400 bg-black/50 px-3 py-1 rounded-lg border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.2)] min-w-[54px]">
                      {seconds.toString().padStart(2, '0')}
                    </span>
                    <span className="text-[9px] font-mono text-rose-400 mt-1 uppercase font-bold">Detik</span>
                  </div>
                </div>
              )}

              <div className="text-[11px] font-mono text-zinc-400 mt-2">
                Tepat pada bar chart:{' '}
                <span className="text-white font-bold">{localTimeStr}</span> ({tzName}) •{' '}
                <span className="text-zinc-300">{localDateStr}</span>
              </div>
            </div>
          )}

          {/* Economic Data Metrics Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-center">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                Prakiraan
              </span>
              <span className="text-sm font-mono font-black text-cyan-300 mt-0.5 block">
                {currentEvent.forecast || '-'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-center">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                Sebelumnya
              </span>
              <span className="text-sm font-mono font-black text-zinc-300 mt-0.5 block">
                {currentEvent.previous || '-'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-center">
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
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 text-xs space-y-2">
            <div className="flex items-start gap-2 text-zinc-300 leading-relaxed">
              <Info size={14} className="text-cyan-400 shrink-0 mt-0.5" />
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
                  className="text-[10.5px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors cursor-pointer py-1 px-2 rounded bg-cyan-950/30 border border-cyan-500/30"
                >
                  <RefreshCw size={11} className={isFetchingActual ? 'animate-spin' : ''} />
                  <span>{isFetchingActual ? 'Memproses Rilis...' : '⚡ Uji Simulasi Rilis Angka Aktual Sekarang'}</span>
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
              className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono text-xs font-black shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Bot size={15} />
              <span>Analisis Skenario AI</span>
            </button>

            {onOpenFullCalendar && (
              <button
                onClick={onOpenFullCalendar}
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-zinc-300 hover:text-white font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Calendar size={14} />
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
