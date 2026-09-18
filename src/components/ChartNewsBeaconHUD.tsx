import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Flame,
  AlertTriangle,
  Clock,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  Bot,
  Zap,
  CheckCircle2,
  X
} from 'lucide-react';
import { ChartNewsEconomicEvent } from './ChartNewsEventModal';
import { tradingAudio } from '../utils/audioSynth';
import { useTheme } from '../context/ThemeContext';
import { getThemeBeaconGradient, getThemeCardBorder, getThemeCardBoxShadow } from '../utils/themeGradient';

interface ChartNewsBeaconHUDProps {
  events: ChartNewsEconomicEvent[];
  activeSymbol?: string;
  onSelectEvent: (event: ChartNewsEconomicEvent) => void;
  onOpenAiAgent?: (prompt: string) => void;
}

export const ChartNewsBeaconHUD: React.FC<ChartNewsBeaconHUDProps> = ({
  events,
  activeSymbol = 'BTCUSDT',
  onSelectEvent,
  onOpenAiAgent
}) => {
  const { palette, isLight } = useTheme();
  const [now, setNow] = useState<number>(Date.now());
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem('mountalgo_beacon_muted') === 'true';
    } catch {
      return false;
    }
  });
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  // Trigger sound only once per threshold (5m and 1m)
  const alerted5mRef = useRef<Set<string>>(new Set());
  const alerted1mRef = useRef<Set<string>>(new Set());

  // Real-time ticking 1-second countdown
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !isMuted;
    setIsMuted(next);
    try {
      localStorage.setItem('mountalgo_beacon_muted', String(next));
    } catch {
      // ignore
    }
  };

  // Find nearest upcoming or freshly released High/Medium impact event
  // Active window: upcoming within 15 minutes (diff <= 15m) OR freshly released within 3 minutes (diff >= -3m)
  const imminentEvent = useMemo(() => {
    if (!events || events.length === 0) return null;

    const relevant = events.filter(e => {
      if (e.impact === 'LOW') return false;
      const diff = e.timestamp - now;
      // In range between -3 minutes (past) to +15 minutes (future)
      return diff <= (15 * 60 * 1000) && diff >= -(3 * 60 * 1000);
    });

    if (relevant.length === 0) return null;

    // Sort: prioritizes closest to 0
    return relevant.sort((a, b) => {
      const diffA = Math.abs(a.timestamp - now);
      const diffB = Math.abs(b.timestamp - now);
      return diffA - diffB;
    })[0];
  }, [events, now]);

  // Audio alert monitoring
  useEffect(() => {
    if (!imminentEvent || isMuted || isDismissed) return;

    const diff = imminentEvent.timestamp - now;

    // 5-minute threshold (between 4m50s and 5m00s)
    if (diff <= 5 * 60 * 1000 && diff > 4.5 * 60 * 1000) {
      if (!alerted5mRef.current.has(imminentEvent.id)) {
        alerted5mRef.current.add(imminentEvent.id);
        tradingAudio.play('ALERT');
      }
    }

    // 1-minute threshold (between 50s and 60s)
    if (diff <= 60 * 1000 && diff > 50 * 1000) {
      if (!alerted1mRef.current.has(imminentEvent.id)) {
        alerted1mRef.current.add(imminentEvent.id);
        tradingAudio.play('SNIPER_ALERT');
      }
    }
  }, [imminentEvent, now, isMuted, isDismissed]);

  if (!imminentEvent || isDismissed) return null;

  const diff = imminentEvent.timestamp - now;
  const isPast = diff <= 0;
  const absDiff = Math.abs(diff);

  const mins = Math.floor(absDiff / 60000);
  const secs = Math.floor((absDiff % 60000) / 1000);
  const timeStr = `${mins.toString().padStart(2, '0')}m : ${secs.toString().padStart(2, '0')}s`;

  const isHighImpact = imminentEvent.impact === 'HIGH';
  const hasActual = Boolean(imminentEvent.actual);

  // If minimized: small floating pill
  if (isMinimized) {
    return (
      <div
        id="chart-news-beacon-hud-minimized"
        onClick={() => setIsMinimized(false)}
        style={{
          borderColor: isHighImpact ? undefined : getThemeCardBorder(palette, true),
          boxShadow: isHighImpact ? undefined : getThemeCardBoxShadow(palette, true),
          background: getThemeBeaconGradient(palette, isHighImpact, isLight),
        }}
        className={`absolute top-14 right-4 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-xl border ${isHighImpact ? 'border-rose-500/50 shadow-[0_4px_20px_rgba(244,63,94,0.35)]' : 'shadow-lg'} cursor-pointer hover:scale-105 transition-all select-none animate-in fade-in`}
      >
        <div className="relative flex items-center justify-center">
          <span className={`w-2.5 h-2.5 rounded-full ${isHighImpact ? 'bg-rose-500' : ''} animate-ping absolute`} style={{ backgroundColor: isHighImpact ? undefined : palette.bull }} />
          <span className={`w-2 h-2 rounded-full ${isHighImpact ? 'bg-rose-400' : ''} relative`} style={{ backgroundColor: isHighImpact ? undefined : palette.bull }} />
        </div>
        <span className="text-xs">{imminentEvent.flag}</span>
        <span className="text-[11px] font-mono font-bold" style={{ color: isHighImpact ? '#fca5a5' : palette.bull }}>
          {imminentEvent.currency} {isPast ? 'LIVE' : timeStr}
        </span>
        <ChevronDown size={13} className="text-zinc-400" />
      </div>
    );
  }

  return (
    <div
      id="chart-news-beacon-hud"
      className="absolute top-14 right-4 z-40 max-w-sm w-auto select-none pointer-events-auto animate-in fade-in duration-200"
    >
      <div
        style={{
          borderColor: isHighImpact ? undefined : getThemeCardBorder(palette, false),
          boxShadow: isHighImpact ? undefined : getThemeCardBoxShadow(palette, false),
          background: getThemeBeaconGradient(palette, isHighImpact, isLight),
        }}
        className={`relative rounded-xl backdrop-blur-2xl border ${isHighImpact ? 'border-rose-500/50 shadow-[0_8px_32px_rgba(0,0,0,0.8),0_0_25px_rgba(244,63,94,0.25)]' : 'border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]'} p-3 text-white font-sans overflow-hidden`}
      >
        {/* Top Accent Bar */}
        <div 
          className="absolute top-0 left-0 right-0 h-[2px] z-20"
          style={{
            backgroundColor: isHighImpact ? '#f43f5e' : palette.bull,
            boxShadow: isHighImpact ? '0 0 8px rgba(244,63,94,0.6)' : `0 0 8px ${palette.bull}`
          }}
        />

        {/* Radar Ping Glow Effect in Background */}
        <div
          className="absolute -top-6 -left-6 w-20 h-20 rounded-full blur-xl pointer-events-none animate-pulse"
          style={{ backgroundColor: isHighImpact ? 'rgba(244,63,94,0.15)' : `${palette.bull}15` }}
        />

        {/* Top Mini Header */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            {/* Visual Radar Beacon Animation */}
            <div className="relative flex items-center justify-center w-4 h-4">
              <span
                className={`w-3 h-3 rounded-full absolute ${isHighImpact ? 'bg-rose-500 animate-ping opacity-75' : 'animate-ping opacity-75'}`}
                style={{ backgroundColor: isHighImpact ? undefined : palette.bull }}
              />
              <span
                className={`w-2 h-2 rounded-full relative ${isHighImpact ? 'bg-rose-400 shadow-[0_0_8px_#f43f5e]' : ''}`}
                style={{
                  backgroundColor: isHighImpact ? undefined : palette.bull,
                  boxShadow: isHighImpact ? undefined : `0 0 8px ${palette.bull}`
                }}
              />
            </div>

            <span
              className={`text-[10px] font-mono font-black tracking-wider uppercase flex items-center gap-1 ${isHighImpact ? 'text-rose-300' : ''}`}
              style={{ color: isHighImpact ? undefined : palette.bull }}
            >
              <Flame size={12} className={isHighImpact ? 'text-rose-400' : ''} style={{ color: isHighImpact ? undefined : palette.bull }} />
              {isPast ? 'KATALIS BERITA BARU RILIS' : 'BEACON RISIKO BERITA TINGGI'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleToggleMute}
              className="p-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title={isMuted ? 'Nyalakan Audio Alert' : 'Bisukan Audio Alert'}
            >
              {isMuted ? <VolumeX size={12} className="text-rose-400" /> : <Volume2 size={12} className="text-zinc-400" />}
            </button>
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Kecilkan (Minimize)"
            >
              <ChevronUp size={12} />
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
              title="Tutup Beacon"
            >
              <X size={12} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="pt-2.5 pb-1 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg select-none">{imminentEvent.flag}</span>
              <div>
                <div className="text-xs font-bold text-white leading-tight line-clamp-1">
                  {imminentEvent.event}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 mt-0.5">
                  <span className="font-bold" style={{ color: palette.bull }}>{imminentEvent.currency}</span>
                  <span>•</span>
                  <span>Frc: <strong className="text-zinc-200">{imminentEvent.forecast || '-'}</strong></span>
                  <span>•</span>
                  <span>Prev: <strong className="text-zinc-300">{imminentEvent.previous || '-'}</strong></span>
                </div>
              </div>
            </div>

            {/* Countdown Badge */}
            <div className="text-right shrink-0">
              <div className={`px-2 py-1 rounded-lg font-mono text-xs font-black border shadow-inner ${
                isPast
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                  : mins < 3
                  ? 'bg-rose-500/25 text-rose-300 border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.4)] animate-pulse'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                {isPast ? '⚡ RILIS' : `⏱ ${timeStr}`}
              </div>
            </div>
          </div>

          {/* If event has actual print or market reaction */}
          {hasActual && (
            <div className="px-2.5 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-[10.5px] font-mono">
              <span className="text-zinc-300">Hasil Print:</span>
              <span className="font-black text-emerald-300 font-mono text-xs">{imminentEvent.actual}</span>
              {imminentEvent.deviation && (
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold">
                  {imminentEvent.deviation} ({imminentEvent.deviationStatus})
                </span>
              )}
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              onClick={() => onSelectEvent(imminentEvent)}
              className="flex-1 py-1.5 px-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-[11px] font-mono font-bold text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Zap size={12} className="text-zinc-400" />
              <span>Detail & Live Print</span>
            </button>

            {onOpenAiAgent && (
              <button
                onClick={() => {
                  onOpenAiAgent(
                    `Peringatan volatilitas katalis "${imminentEvent.event}" (${imminentEvent.currency}) pada ${activeSymbol}. Waktu rilis: ${isPast ? 'Baru rilis' : timeStr}. Berikan strategi navigasi risiko likuiditas dan pelebaran spread.`
                  );
                }}
                className="py-1.5 px-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-[11px] font-mono font-bold text-white transition-all flex items-center justify-center gap-1 cursor-pointer"
                title="Konsultasi MountAlgo AI"
              >
                <Bot size={12} className="text-zinc-400" />
                <span>AI Skenario</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartNewsBeaconHUD;
