import React, { useState, useEffect } from 'react';
import { Clock, Globe, Zap, Eye, EyeOff, ShieldCheck, Activity, Flame } from 'lucide-react';
import { getStoredTimezone, formatTimeInTimezone, getTimezoneMeta } from '../utils/timezone';
import { TimezoneSelector } from './TimezoneSelector';

interface SessionDef {
  id: string;
  name: string;
  city: string;
  flag: string;
  openUtcHour: number; // UTC hour
  closeUtcHour: number; // UTC hour
  color: string;
  glow: string;
}

const GLOBAL_SESSIONS: SessionDef[] = [
  { id: 'sydney', name: 'Sydney', city: 'Sydney', flag: '🇦🇺', openUtcHour: 22, closeUtcHour: 7, color: 'text-sky-400', glow: 'rgba(56,189,248,0.3)' },
  { id: 'tokyo', name: 'Tokyo', city: 'Tokyo', flag: '🇯🇵', openUtcHour: 0, closeUtcHour: 9, color: 'text-rose-400', glow: 'rgba(251,113,133,0.3)' },
  { id: 'london', name: 'London', city: 'London', flag: '🇬🇧', openUtcHour: 8, closeUtcHour: 17, color: 'text-amber-400', glow: 'rgba(251,191,36,0.3)' },
  { id: 'newyork', name: 'New York', city: 'Wall St', flag: '🇺🇸', openUtcHour: 13, closeUtcHour: 22, color: 'text-emerald-400', glow: 'rgba(52,211,153,0.3)' }
];

interface MarketSessionsOverlayProps {
  isVisible?: boolean;
  onToggleVisibility?: (visible: boolean) => void;
  className?: string;
}

export const MarketSessionsOverlay: React.FC<MarketSessionsOverlayProps> = ({
  isVisible: propIsVisible,
  onToggleVisibility,
  className = ''
}) => {
  const [selectedTz, setSelectedTz] = useState<string>(() => getStoredTimezone());
  const [now, setNow] = useState<Date>(new Date());
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isVisible, setIsVisible] = useState<boolean>(() => {
    if (typeof propIsVisible === 'boolean') return propIsVisible;
    return localStorage.getItem('mountalgo_show_market_sessions') !== 'false';
  });

  useEffect(() => {
    if (typeof propIsVisible === 'boolean') {
      setIsVisible(propIsVisible);
    }
  }, [propIsVisible]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleTzChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) setSelectedTz(customEvent.detail);
    };
    window.addEventListener('mountalgo_timezone_changed', handleTzChange);
    return () => window.removeEventListener('mountalgo_timezone_changed', handleTzChange);
  }, []);

  const handleToggle = () => {
    const next = !isVisible;
    setIsVisible(next);
    localStorage.setItem('mountalgo_show_market_sessions', next ? 'true' : 'false');
    if (onToggleVisibility) onToggleVisibility(next);
  };

  const formattedNow = formatTimeInTimezone(now, selectedTz);
  const utcHour = now.getUTCHours();
  const utcMin = now.getUTCMinutes();
  const currentUtcDec = utcHour + utcMin / 60;

  // Calculate active status for each session
  const sessionStatuses = GLOBAL_SESSIONS.map(s => {
    let isOpen = false;
    if (s.openUtcHour < s.closeUtcHour) {
      isOpen = currentUtcDec >= s.openUtcHour && currentUtcDec < s.closeUtcHour;
    } else {
      // Overnight session (e.g. Sydney 22:00 - 07:00 UTC)
      isOpen = currentUtcDec >= s.openUtcHour || currentUtcDec < s.closeUtcHour;
    }

    // Time to close / open
    let minsRemaining = 0;
    if (isOpen) {
      let closeDec = s.closeUtcHour;
      if (closeDec <= s.openUtcHour && currentUtcDec >= s.openUtcHour) {
        closeDec += 24;
      }
      minsRemaining = Math.floor((closeDec - currentUtcDec) * 60);
    } else {
      let openDec = s.openUtcHour;
      if (openDec <= currentUtcDec) {
        openDec += 24;
      }
      minsRemaining = Math.floor((openDec - currentUtcDec) * 60);
    }

    const hrs = Math.floor(minsRemaining / 60);
    const mins = minsRemaining % 60;
    const countdownStr = `${hrs}j ${mins}m`;

    return { ...s, isOpen, hrs, mins, countdownStr };
  });

  const isWeekend = now.getUTCDay() === 0 || now.getUTCDay() === 6 || (now.getUTCDay() === 5 && utcHour >= 22) || (now.getUTCDay() === 0 && utcHour < 21);
  const activeSessions = isWeekend ? [] : sessionStatuses.filter(s => s.isOpen);
  const isLondonNyOverlap = !isWeekend && sessionStatuses.find(s => s.id === 'london')?.isOpen && sessionStatuses.find(s => s.id === 'newyork')?.isOpen;
  const isTokyoLondonOverlap = !isWeekend && sessionStatuses.find(s => s.id === 'tokyo')?.isOpen && sessionStatuses.find(s => s.id === 'london')?.isOpen;

  if (!isVisible) {
    return (
      <div className={`inline-block ${className}`}>
        <button
          onClick={handleToggle}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#090d16]/90 border border-cyan-500/30 text-[11px] font-mono text-zinc-400 hover:text-cyan-300 transition-all cursor-pointer shadow-lg backdrop-blur-xl"
          title="Tampilkan Overlay Sesi Pasar"
        >
          <Eye size={12} className="text-cyan-400" />
          <span>Sesi Pasar [OFF]</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`font-mono text-xs ${className}`}>
      <div className="bg-gradient-to-r from-[#090d16]/95 via-[#06080f]/95 to-[#04060a]/95 border border-cyan-500/30 rounded-xl p-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(6,182,212,0.15)] backdrop-blur-2xl text-white">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between gap-3 pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-cyan-400 animate-pulse" />
            <span className="font-bold text-cyan-300 text-[11px] tracking-wide">SESI PASAR GLOBAL</span>
            {isWeekend ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold flex items-center gap-1">
                <ShieldCheck size={10} /> PASAR TUTUP - LIBUR AKHIR PEKAN (WEEKEND PAUSE)
              </span>
            ) : isLondonNyOverlap ? (
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] font-black animate-pulse flex items-center gap-1">
                <Flame size={10} /> OVERLAP LIKUIDITAS TINGGI (LONDON + NY)
              </span>
            ) : isTokyoLondonOverlap ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black flex items-center gap-1">
                <Zap size={10} /> OVERLAP ASIA + EROPA
              </span>
            ) : activeSessions.length > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold">
                {activeSessions.length} SESI BUKA
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 text-[9px]">
                PASAR TUTUP
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Live Synchronized Clock */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/50 border border-cyan-500/30 text-[10.5px]">
              <Clock size={11} className="text-cyan-400" />
              <span className="font-bold text-white">{formattedNow.timeWithSecsStr}</span>
              <span className="text-cyan-400 font-bold">{formattedNow.tzAbbr}</span>
            </div>

            {/* Timezone Selector Modal Trigger */}
            <TimezoneSelector variant="badge" />

            {/* Toggle Visibility Switch */}
            <button
              onClick={handleToggle}
              className="p-1 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Sembunyikan Overlay Sesi Pasar"
            >
              <EyeOff size={13} />
            </button>
          </div>
        </div>

        {/* Sessions Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
          {sessionStatuses.map(s => (
            <div
              key={s.id}
              className={`p-2 rounded-lg border transition-all ${
                s.isOpen
                  ? 'bg-gradient-to-b from-cyan-950/40 to-blue-950/20 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                  : 'bg-black/30 border-white/5 opacity-60 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">{s.flag}</span>
                  <span className="font-bold text-[11px] text-white">{s.name}</span>
                </div>
                <span className={`w-2 h-2 rounded-full ${s.isOpen ? 'bg-emerald-400 animate-ping' : 'bg-zinc-600'}`} />
              </div>

              <div className="mt-1 flex items-center justify-between text-[9.5px]">
                <span className={s.isOpen ? s.color : 'text-zinc-500'}>
                  {s.isOpen ? 'BUKA' : 'TUTUP'}
                </span>
                <span className="text-zinc-400 font-mono">
                  {s.isOpen ? `Tutup: ${s.countdownStr}` : `Buka: ${s.countdownStr}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MarketSessionsOverlay;
