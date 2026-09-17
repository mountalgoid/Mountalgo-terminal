import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Pause,
  Play,
  Volume2,
  VolumeX,
  X,
  Info
} from 'lucide-react';
import { ChartNewsEconomicEvent } from './ChartNewsEventModal';
import { tradingAudio } from '../utils/audioSynth';

interface NewsVolatilityGuardProps {
  events: ChartNewsEconomicEvent[];
  activeSymbol?: string;
  onOpenAiAgent?: (prompt: string) => void;
  className?: string;
}

export const NewsVolatilityGuard: React.FC<NewsVolatilityGuardProps> = ({
  events,
  activeSymbol = 'BTCUSDT',
  onOpenAiAgent,
  className = ''
}) => {
  const [now, setNow] = useState<number>(Date.now());
  const [isPaused, setIsPaused] = useState<boolean>(() => {
    try {
      return localStorage.getItem('mountalgo_scalping_paused') === 'true';
    } catch {
      return false;
    }
  });
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Check for high-impact events within the 2-minute danger window (-1 min to +2 mins)
  const dangerEvent = useMemo(() => {
    if (!events || events.length === 0) return null;

    const matched = events.find(e => {
      if (e.impact !== 'HIGH') return false;
      const diff = e.timestamp - now;
      // In danger zone: 2 minutes before release up to 1.5 minutes after release
      return diff <= (2 * 60 * 1000) && diff >= -(1.5 * 60 * 1000);
    });

    return matched || null;
  }, [events, now]);

  // Audio alert on entering danger zone
  useEffect(() => {
    if (dangerEvent && !isDismissed) {
      const diff = dangerEvent.timestamp - now;
      if (diff <= 120000 && diff > 115000) {
        tradingAudio.play('ALERT');
      }
    }
  }, [dangerEvent, now, isDismissed]);

  const togglePauseScalping = () => {
    const next = !isPaused;
    setIsPaused(next);
    try {
      localStorage.setItem('mountalgo_scalping_paused', String(next));
      window.dispatchEvent(new CustomEvent('mountalgo:scalping-paused-change', { detail: { isPaused: next } }));
      if (next) {
        tradingAudio.play('TAKE_PROFIT');
      } else {
        tradingAudio.play('CLICK');
      }
    } catch {
      // ignore
    }
  };

  if (!dangerEvent || isDismissed) return null;

  const diff = dangerEvent.timestamp - now;
  const isPast = diff <= 0;
  const absDiff = Math.abs(diff);
  const mins = Math.floor(absDiff / 60000);
  const secs = Math.floor((absDiff % 60000) / 1000);
  const countdownStr = isPast 
    ? `Rilis (${secs}s lalu)` 
    : `${mins.toString().padStart(2, '0')}m:${secs.toString().padStart(2, '0')}s`;

  return (
    <div
      id="news-volatility-guard-banner"
      className={`relative overflow-hidden rounded-xl border backdrop-blur-2xl transition-all duration-300 shadow-2xl ${
        isPaused 
          ? 'bg-gradient-to-r from-emerald-950/90 via-slate-900/95 to-cyan-950/90 border-emerald-500/50 shadow-[0_0_25px_rgba(16,185,129,0.25)]'
          : 'bg-gradient-to-r from-rose-950/90 via-slate-950/95 to-amber-950/90 border-rose-500/60 shadow-[0_0_25px_rgba(244,63,94,0.3)] animate-pulse'
      } ${className}`}
    >
      {/* Background Warning Glow */}
      <div className={`absolute top-0 right-0 w-48 h-full blur-2xl pointer-events-none opacity-20 ${isPaused ? 'bg-emerald-500' : 'bg-rose-600'}`} />

      <div className="relative px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-white font-sans text-xs">
        {/* Left Indicator & Info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`p-1.5 rounded-lg border flex items-center justify-center shrink-0 ${
            isPaused
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-500/25 border-rose-500/50 text-rose-300 animate-ping-slow'
          }`}>
            {isPaused ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-mono font-black uppercase tracking-wider text-[11px] ${
                isPaused ? 'text-emerald-300' : 'text-rose-300'
              }`}>
                {isPaused ? '🛡️ SCALPING GUARD AKTIF (RISIKO TERKUNCI)' : '⚠️ PERINGATAN PELEBARAN SPREAD EKSTRIM'}
              </span>

              <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-white/10 border border-white/15 text-zinc-200">
                ⏱ {countdownStr}
              </span>

              <span className="text-zinc-400 font-mono text-[10.5px]">
                {dangerEvent.flag} <strong>{dangerEvent.currency}</strong> - {dangerEvent.event}
              </span>
            </div>

            <div className="text-[10px] text-zinc-400 font-mono mt-0.5 flex items-center gap-2">
              <span className="text-amber-400 font-semibold">
                Estimasi Slippage: 3x-8x Normal
              </span>
              <span>•</span>
              <span className="text-zinc-400">
                Disarankan hindari eksekusi Market Order hingga rilis stabil.
              </span>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={togglePauseScalping}
            className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer shadow-md ${
              isPaused
                ? 'bg-emerald-500 text-black border-emerald-400 hover:bg-emerald-400 font-black'
                : 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400 font-black shadow-[0_0_15px_rgba(244,63,94,0.4)]'
            }`}
          >
            {isPaused ? (
              <>
                <Play size={13} className="fill-current" />
                <span>Lanjutkan Scalping</span>
              </>
            ) : (
              <>
                <Pause size={13} className="fill-current" />
                <span>Pause Scalping</span>
              </>
            )}
          </button>

          {onOpenAiAgent && (
            <button
              onClick={() => {
                onOpenAiAgent(
                  `Saya sedang bersiap menghadapi event berisiko tinggi "${dangerEvent.event}" (${dangerEvent.currency}). Hitungan mundur: ${countdownStr}. Berikan analisa dampak terhadap spread dan rekomendasi posisi order.`
                );
              }}
              className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-zinc-300 hover:text-white font-mono text-xs font-medium transition-colors cursor-pointer"
              title="Konsultasi Strategi Risiko"
            >
              Tanya AI
            </button>
          )}

          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors cursor-pointer"
            title="Sembunyikan Peringatan"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewsVolatilityGuard;
