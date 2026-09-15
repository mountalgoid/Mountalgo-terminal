import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Settings, Keyboard, BellRing, Monitor, Smartphone, RotateCw, LayoutGrid, Maximize, Minimize, MoreVertical, Wallet, Award, Crosshair, Contrast, SunMoon, Clock, Zap, Volume2, VolumeX, Lock, Unlock, TrendingUp, PieChart, ZoomIn, ZoomOut, Sparkles, Newspaper, Bot, Flame } from 'lucide-react';
import { useTrade } from '../context/TradeContext';
import { useTheme } from '../context/ThemeContext';
import { SystemPerformanceHud } from './SystemPerformanceHud';
import { tradingAudio, AudioProfile } from '../utils/audioSynth';
import { detectScreenResolution } from '../utils/resolutionDetector';

interface TopBarMenuProps {
  isZenMode: boolean;
  setIsZenMode: (v: boolean) => void;
  orientationOverride: 'auto' | 'landscape' | 'portrait';
  cycleOrientation: () => void;
  effectiveOrientation: string;
  isAppFullscreen: boolean;
  toggleNativeFullscreen: () => void;
  setIsAppSettingsOpen: (v: boolean) => void;
  setIsHotkeyModalOpen: (v: boolean) => void;
  setIsPriceAlertsOpen: (v: boolean) => void;
  setIsWorkspacePresetsOpen: (v: boolean) => void;
  fullscreenWidget: string | null;
  setFullscreenWidget: (v: string | null) => void;
  priceScaleMode?: 'linear' | 'logarithmic';
  onTogglePriceScaleMode?: () => void;
  isWorkspaceLocked?: boolean;
  onToggleWorkspaceLock?: (locked: boolean) => void;
  setIsHedgeModalOpen?: (v: boolean) => void;
  setIsEquityModalOpen?: (v: boolean) => void;
  setIsSniperHubOpen?: (v: boolean) => void;
  setIsNewsModalOpen?: (v: boolean) => void;
  setIsAiAgentModalOpen?: (v: boolean) => void;
  globalZoom?: number;
  setGlobalZoom?: (v: number) => void;
  zoomIn?: () => void;
  zoomOut?: () => void;
  resetZoom?: () => void;
}

export const TopBarMenu: React.FC<TopBarMenuProps> = ({
  isZenMode, setIsZenMode, orientationOverride, cycleOrientation,
  effectiveOrientation, isAppFullscreen, toggleNativeFullscreen,
  setIsAppSettingsOpen, setIsHotkeyModalOpen, setIsPriceAlertsOpen,
  setIsWorkspacePresetsOpen,
  fullscreenWidget, setFullscreenWidget,
  priceScaleMode = 'linear',
  onTogglePriceScaleMode,
  isWorkspaceLocked = false,
  onToggleWorkspaceLock,
  setIsHedgeModalOpen,
  setIsEquityModalOpen,
  setIsSniperHubOpen,
  setIsNewsModalOpen,
  setIsAiAgentModalOpen,
  globalZoom,
  setGlobalZoom,
  zoomIn,
  zoomOut,
  resetZoom,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isZoomDropdownOpen, setIsZoomDropdownOpen] = useState(false);
  const zoomMenuRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const portalMenuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number }>({ top: 0, right: 12 });
  const { 
    hotkeyMode, 
    setIsAccountModalOpen, 
    activeAccount,
    setIsJournalModalOpen,
    chartSyncCrosshair,
    setChartSyncCrosshair,
    isInstantTradeEnabled,
    setIsInstantTradeEnabled
  } = useTrade();
  const {
    palette,
    isHighContrast,
    setIsHighContrast,
    isAutoOsTheme,
    setIsAutoOsTheme,
    isSystemDark
  } = useTheme();

  // Session Duration Tracker State & Persistence
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const updateElapsed = () => {
      const start = localStorage.getItem('mountalgo_session_start');
      if (start) {
        const parsed = parseInt(start, 10);
        setElapsedSeconds(Math.max(0, Math.floor((Date.now() - parsed) / 1000)));
      } else {
        const now = Date.now();
        localStorage.setItem('mountalgo_session_start', String(now));
        setElapsedSeconds(0);
      }
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleResetSession = () => {
    const now = Date.now();
    localStorage.setItem('mountalgo_session_start', String(now));
    setElapsedSeconds(0);
  };

  const formatDuration = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return [
      h.toString().padStart(2, '0'),
      m.toString().padStart(2, '0'),
      s.toString().padStart(2, '0')
    ].join(':');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        if (portalMenuRef.current && portalMenuRef.current.contains(target)) {
          return;
        }
        setIsOpen(false);
      }
      if (zoomMenuRef.current && !zoomMenuRef.current.contains(target)) {
        setIsZoomDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, [isOpen]);

  // Uniform toolbar button class — ensures every button has consistent sleek glassmorphism styling
  const btnClass = "flex items-center gap-1.5 h-7 px-2 rounded-sm text-xs font-bold border border-[var(--color-border)] bg-[var(--color-panel)] hover:bg-[var(--color-hover)] text-[var(--color-text)] cursor-pointer transition-colors shrink-0";
  const btnStyle = {};

  return (
    <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 ml-auto shrink-0 relative" ref={menuRef}>
      {/* Real-time System Performance (FPS & Memory) Telemetry HUD - Desktop only */}
      <div className="hidden xl:block">
        <SystemPerformanceHud />
      </div>

      {/* Session Duration Tracker - Hidden on smallest screens */}
      <div 
        style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
        className="hidden md:flex items-center gap-1.5 h-7 text-xs px-2 rounded-sm border border-[var(--color-border)] font-mono font-bold text-[var(--color-text)] shrink-0 bg-[var(--color-panel)]"
        title="Durasi Sesi Perdagangan Aktif"
      >
        <Clock size={12} className="text-[var(--color-text-muted)] shrink-0 animate-pulse" />
        <span className="tabular-nums">{formatDuration(elapsedSeconds)}</span>
        <button 
          onClick={handleResetSession}
          className="p-0.5 rounded hover:bg-white/10 text-[var(--color-text-muted)] hover:text-red-400 cursor-pointer transition-colors ml-0.5"
          title="Mulai Sesi Baru"
        >
          <RotateCw size={9} />
        </button>
      </div>

      {/* Active Account Pill */}
      <button
        onClick={() => setIsAccountModalOpen(true)}
        
        className={`${btnClass} text-[var(--color-text)]`}
        title="Kelola Akun Broker Real & Demo"
      >
        <Wallet size={14} className="hidden sm:block shrink-0 text-[var(--color-text-muted)]" />
        <span className="hidden sm:inline truncate">{activeAccount.broker}</span>
        <span 
          style={{ 
            backgroundColor: activeAccount.isReal ? 'rgba(34,197,94,0.2)' : 'rgba(234,179,8,0.2)',
            color: activeAccount.isReal ? '#22c55e' : '#eab308'
          }} 
          className="text-[7px] sm:text-[8px] md:text-[9px] px-0.5 sm:px-1 md:px-1.5 py-0.5 rounded font-mono font-bold shrink-0"
        >
          {activeAccount.isReal ? 'REAL' : 'DEMO'}
        </span>
      </button>

      {/* Workspace Presets 1-Click Switcher */}
      <button
        onClick={() => setIsWorkspacePresetsOpen(true)}
        
        className={`${btnClass} text-[var(--color-text)]`}
        title="Buka Workspace Presets"
      >
        <LayoutGrid size={14} className="shrink-0 text-[var(--color-text-muted)]" />
        <span className="hidden lg:inline">Presets</span>
      </button>

      {/* Global Scroll Zoom Controller Badge & Presets Menu */}
      {globalZoom !== undefined && zoomIn && zoomOut && resetZoom && setGlobalZoom && (
        <div className="relative flex items-center shrink-0" ref={zoomMenuRef}>
          <div 
            
            className={`${btnClass} !p-0.5 flex items-center gap-0.5 select-none text-[var(--color-text)]`}
            onWheel={(e) => {
              e.stopPropagation();
              if (e.deltaY < 0) zoomIn();
              else if (e.deltaY > 0) zoomOut();
            }}
          >
            <button
              onClick={zoomOut}
              disabled={globalZoom <= 50}
              className="p-1 hover:bg-white/10 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-30 cursor-pointer transition-colors"
              title="Zoom Out Global (Scroll Down / Ctrl + Wheel Down)"
            >
              <ZoomOut size={12} />
            </button>
            <button
              onClick={() => setIsZoomDropdownOpen(!isZoomDropdownOpen)}
              style={{ color: palette.bull }}
              className="px-1 py-0.5 hover:bg-white/10 rounded font-mono font-bold cursor-pointer transition-colors flex items-center gap-0.5 text-[10px]"
              title="Scroll mouse wheel di sini atau gunakan Ctrl+Scroll di mana saja untuk Zoom UI Global. Klik untuk opsi preset."
            >
              <span>{globalZoom}%</span>
            </button>
            <button
              onClick={zoomIn}
              disabled={globalZoom >= 175}
              className="p-1 hover:bg-white/10 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-30 cursor-pointer transition-colors"
              title="Zoom In Global (Scroll Up / Ctrl + Wheel Up)"
            >
              <ZoomIn size={12} />
            </button>
          </div>

          {/* Zoom Presets Dropdown Menu */}
          {isZoomDropdownOpen && (() => {
            const res = detectScreenResolution();
            return (
              <div className="absolute top-full right-0 mt-1 w-56 bg-zinc-950/95 border border-zinc-800 rounded-2xl shadow-2xl backdrop-blur-xl p-2 z-[10005] font-mono text-xs animate-in fade-in zoom-in-95 duration-150">
                {/* Auto Resolution Detector Info Box */}
                <div 
                  style={{ backgroundColor: `${palette.bull}15`, borderColor: `${palette.bull}35` }}
                  className="mb-2 p-2 rounded-xl border text-[10px]"
                >
                  <div className="flex items-center justify-between font-bold mb-0.5" style={{ color: palette.bull }}>
                    <span className="flex items-center gap-1">
                      <span>{res.icon}</span>
                      <span>DETEKSI MONITOR</span>
                    </span>
                    <span 
                      style={{ backgroundColor: `${palette.bull}25`, color: palette.bull, borderColor: `${palette.bull}50` }}
                      className="text-[9px] px-1.5 py-0.5 rounded-full border font-bold"
                    >
                      Auto
                    </span>
                  </div>
                  <div className="text-white font-bold text-[11px] truncate">{res.shortLabel}</div>
                  <div className="text-zinc-400 text-[9px] flex items-center justify-between mt-0.5">
                    <span>{res.screenWidth}x{res.screenHeight} ({res.devicePixelRatio}x DPI)</span>
                    <span style={{ color: palette.bull }} className="font-bold">Anti-Blur Sharp</span>
                  </div>

                  <button
                    onClick={() => {
                      setGlobalZoom(res.recommendedZoom);
                      setIsZoomDropdownOpen(false);
                    }}
                    style={{ backgroundColor: palette.bull, color: '#000000' }}
                    className="mt-1.5 w-full py-1 px-2 rounded-lg font-black text-[10px] transition-all cursor-pointer shadow-md flex items-center justify-center gap-1 active:scale-95 hover:brightness-110"
                    title={`Optimal UI Zoom untuk ${res.shortLabel}`}
                  >
                    <Sparkles size={11} />
                    <span>Auto-Scale UI ({res.recommendedZoom}%)</span>
                  </button>
                </div>

                <div className="text-[10px] text-zinc-400 px-1 py-0.5 font-bold border-b border-zinc-800/80 mb-1 flex items-center justify-between">
                  <span>PRESET ZOOM MANUAL</span>
                  <span className="text-[9px] font-bold" style={{ color: palette.bull }}>Ctrl+Scroll</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {[60, 75, 85, 90, 100, 110, 125, 150, 175].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => {
                        setGlobalZoom(preset);
                        setIsZoomDropdownOpen(false);
                      }}
                      style={globalZoom === preset ? { backgroundColor: `${palette.bull}25`, color: palette.bull, borderColor: `${palette.bull}50` } : {}}
                      className={`px-2 py-1 rounded-lg text-center text-xs transition-all cursor-pointer ${
                        globalZoom === preset
                          ? 'font-bold border shadow-sm'
                          : 'text-zinc-300 bg-zinc-900/60 hover:bg-zinc-800 hover:text-white border border-zinc-800/60'
                      }`}
                    >
                      {preset}%
                    </button>
                  ))}
                </div>
                <div className="border-t border-zinc-800/80 mt-1.5 pt-1.5 flex flex-col gap-1">
                  <button
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('mountalgo-auto-center'));
                      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                      setIsZoomDropdownOpen(false);
                    }}
                    style={{ backgroundColor: `${palette.bull}20`, color: palette.bull, borderColor: `${palette.bull}40` }}
                    className="w-full text-center py-1 rounded-lg font-bold text-[10.5px] transition-all cursor-pointer flex items-center justify-center gap-1 border active:scale-95 hover:brightness-110"
                    title="Smooth Auto-Center Layout & Charts ke koordinat awal"
                  >
                    <Crosshair size={11} style={{ color: palette.bull }} />
                    <span>Auto-Center Layout</span>
                  </button>

                  <button
                    onClick={() => {
                      resetZoom();
                      setIsZoomDropdownOpen(false);
                    }}
                    className="w-full text-center py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-amber-400 font-bold text-[10.5px] transition-colors cursor-pointer flex items-center justify-center gap-1 border border-zinc-800"
                  >
                    <RotateCw size={10} />
                    Reset Zoom (100%)
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Lock Workspace Status Indicator / Quick Unlock Button */}
      {isWorkspaceLocked && (
        <button
          onClick={() => onToggleWorkspaceLock ? onToggleWorkspaceLock(false) : setIsAppSettingsOpen(true)}
          
          className={`${btnClass} animate-in fade-in duration-200`}
          title="Workspace Terkunci: Pergeseran pembagi & penutupan widget dinonaktifkan untuk stabilitas trading volatilitas tinggi. Klik untuk membuka."
        >
          <Lock size={12} className="shrink-0 text-amber-400" />
          <span className="hidden sm:inline font-mono">Locked</span>
        </button>
      )}

      {/* Trade Journal & Analytics Quick Button */}
      <button
        onClick={() => setIsJournalModalOpen(true)}
        
        className={`${btnClass} text-[var(--color-text)] hidden md:flex`}
        title="Buka Trade Journal & Performance Analytics"
      >
        <Award size={12} className="shrink-0 text-[var(--color-text-muted)]" />
        <span className="hidden lg:inline">Journal</span>
      </button>

      {/* Real-Time News Feeds & Economic Calendar Button */}
      {setIsNewsModalOpen && (
        <button
          onClick={() => setIsNewsModalOpen(true)}
          style={{
            borderColor: `${palette.bull}40`,
            backgroundColor: `${palette.bull}12`,
            color: palette.bull
          }}
          className={`${btnClass} flex items-center gap-1.5 font-bold hover:brightness-125 shadow-sm transition-all`}
          title="Buka Real-Time Financial News Feeds & Kalender Berita Ekonomi Realtime"
        >
          <Newspaper size={13} style={{ color: palette.bull }} className="shrink-0" />
          <span className="hidden md:inline font-mono">News & Kalender</span>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse hidden sm:inline" style={{ backgroundColor: palette.bull }} />
        </button>
      )}

      {/* MountAlgo AI Agent Terminal Button */}
      {setIsAiAgentModalOpen && (
        <button
          onClick={() => setIsAiAgentModalOpen(true)}
          style={{
            borderColor: `${palette.bull}50`,
            background: `linear-gradient(135deg, ${palette.bull}25, ${palette.poc}18)`,
            boxShadow: `0 0 12px ${palette.bull}20`
          }}
          className={`${btnClass} flex items-center gap-1.5 font-bold hover:brightness-125 text-white shadow-sm transition-all animate-in fade-in`}
          title="Buka MountAlgo Quant AI Agent Terminal (Gemini 3.8 Flash)"
        >
          <Bot size={13} style={{ color: palette.bull }} className="shrink-0 animate-pulse" />
          <span className="hidden sm:inline font-mono">AI Agent</span>
          <span 
            style={{ backgroundColor: `${palette.bull}30`, color: palette.bull, borderColor: `${palette.bull}50` }}
            className="px-1 py-0.2 rounded text-[8px] border font-mono hidden xl:inline"
          >
            FLASH
          </span>
        </button>
      )}

      {/* Cross-Account Equity Aggregator Quick Button */}
      {setIsEquityModalOpen && (
        <button
          onClick={() => setIsEquityModalOpen(true)}
          
          className={`${btnClass} hidden sm:flex font-bold hover:brightness-125`}
          title="Buka Unified Cross-Account Net Worth Aggregator"
        >
          <PieChart size={12} className="shrink-0" style={{ color: palette.bull }} />
          <span className="hidden lg:inline font-mono">Net Worth</span>
        </button>
      )}

      {fullscreenWidget && (
        <button
          onClick={() => setFullscreenWidget(null)}
          
          className={`${btnClass}`}
          title="Kembali ke tampilan Multi-Layout Grid"
        >
          <LayoutGrid size={13} className="shrink-0" />
          <span className="hidden sm:inline">Multi</span>
        </button>
      )}

      <button
        onClick={() => setIsZenMode(true)}
        
        className={`${btnClass}`}
        title="Minimize Semua Layout (Zen Mode)"
      >
        <Maximize size={13} className="shrink-0" />
        <span className="hidden sm:inline">Zen</span>
      </button>

      {/* Main Dropdown Menu for everything else */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          
          ref={buttonRef}
          className={`${btnClass} justify-center`}
          title="Menu Terminal"
          aria-label="Menu Terminal"
        >
          <MoreVertical size={14} />
        </button>

        {isOpen && createPortal(
          <>
            <div 
              className="fixed inset-0 z-[99998] bg-black/40 backdrop-blur-[1px]"
              onClick={() => setIsOpen(false)}
            />
            <div 
              style={{ 
                top: menuPos.top,
                right: Math.min(menuPos.right, window.innerWidth - 272),
              }}
              ref={portalMenuRef}
              className="fixed w-64 sm:w-72 rounded-2xl border border-white/15 bg-[#04060e]/95 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] z-dropdown-ultimate overflow-hidden text-xs sm:text-sm animate-in slide-in-from-top-2 fade-in duration-150 flex flex-col max-h-[calc(100vh-60px)] sm:max-h-[calc(100vh-80px)]"
            >
              <div className="p-1 sm:p-1.5 space-y-0.5 flex flex-col overflow-y-auto max-h-[calc(100vh-70px)] sm:max-h-[calc(100vh-90px)] custom-scrollbar">
                <button
                  onClick={() => { setIsAccountModalOpen(true); setIsOpen(false); }}
                  className="flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-md sm:rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors w-full text-left cursor-pointer active:bg-white/20 min-h-[36px] sm:min-h-[42px]"
                >
                  <Wallet size={14} className="text-[var(--color-text-muted)]" />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-semibold text-[11px] sm:text-xs text-[var(--color-text)]">Kelola Akun Broker</span>
                    <span className="text-[9px] sm:text-[10px] text-[var(--color-text-muted)] truncate">{activeAccount.name} ({activeAccount.broker})</span>
                  </div>
                  <span 
                    style={{ 
                      backgroundColor: activeAccount.isReal ? 'rgba(34,197,94,0.2)' : 'rgba(234,179,8,0.2)',
                      color: activeAccount.isReal ? '#22c55e' : '#eab308'
                    }} 
                    className="text-[8px] sm:text-[9px] font-mono px-1 sm:px-1.5 py-0.5 rounded font-bold shrink-0"
                  >
                    {activeAccount.isReal ? 'REAL' : 'DEMO'}
                  </span>
                </button>

                <button
                  onClick={() => { setIsJournalModalOpen(true); setIsOpen(false); }}
                  className="flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-md sm:rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors w-full text-left cursor-pointer active:bg-white/20 min-h-[36px] sm:min-h-[42px]"
                >
                  <Award size={14} className="text-[var(--color-text-muted)]" />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-semibold text-[11px] sm:text-xs text-[var(--color-text)]">Trade Journal & Analytics</span>
                    <span className="text-[9px] sm:text-[10px] text-[var(--color-text-muted)]">Kurva Equity & Statistik</span>
                  </div>
                </button>

                {setIsNewsModalOpen && (
                  <button
                    onClick={() => { setIsNewsModalOpen(true); setIsOpen(false); }}
                    className="flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-md sm:rounded-lg hover:bg-cyan-500/10 transition-colors w-full text-left cursor-pointer active:bg-cyan-500/20 min-h-[36px] sm:min-h-[42px]"
                  >
                    <Newspaper size={14} className="text-cyan-400" />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-semibold text-[11px] sm:text-xs text-white flex items-center gap-1.5">
                        News & Kalender Realtime
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      </span>
                      <span className="text-[9px] sm:text-[10px] text-cyan-300/80">Macro Releases & Market News</span>
                    </div>
                  </button>
                )}

                {setIsAiAgentModalOpen && (
                  <button
                    onClick={() => { setIsAiAgentModalOpen(true); setIsOpen(false); }}
                    className="flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-md sm:rounded-lg bg-gradient-to-r from-cyan-950/40 to-blue-950/30 hover:from-cyan-900/50 hover:to-blue-900/40 border border-cyan-500/30 transition-colors w-full text-left cursor-pointer active:scale-98 min-h-[36px] sm:min-h-[42px]"
                  >
                    <Bot size={14} className="text-cyan-400 animate-pulse" />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-semibold text-[11px] sm:text-xs text-white flex items-center gap-1.5">
                        MountAlgo AI Agent
                        <span className="text-[8px] font-mono px-1 rounded bg-cyan-500/20 text-cyan-300 font-bold">GEMINI 3.8</span>
                      </span>
                      <span className="text-[9px] sm:text-[10px] text-zinc-400">Order Flow & Setup Assistant</span>
                    </div>
                  </button>
                )}

                <div className="h-px w-full bg-[var(--color-border)] my-1" />

                {/* Global Price Scale Toggle (Log / Lin) */}
                {onTogglePriceScaleMode && (
                  <button
                    onClick={() => { onTogglePriceScaleMode(); }}
                    className="flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-md sm:rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors w-full text-left cursor-pointer active:bg-white/20"
                  >
                    <TrendingUp size={14} className={priceScaleMode === 'logarithmic' ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'} />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-semibold text-[11px] sm:text-xs text-[var(--color-text)]">Skala Harga (Semua Chart)</span>
                      <span className="text-[9px] sm:text-[10px] text-[var(--color-text-muted)]">
                        {priceScaleMode === 'logarithmic' ? 'Mode Logaritmik Aktif' : 'Mode Linear Aktif'}
                      </span>
                    </div>
                    <span 
                      style={{
                        backgroundColor: priceScaleMode === 'logarithmic' ? 'var(--color-box-bull)' : 'rgba(255,255,255,0.08)',
                        color: priceScaleMode === 'logarithmic' ? 'var(--color-bull)' : 'var(--color-text-muted)'
                      }}
                      className="text-[8px] sm:text-[9px] font-mono font-bold px-1 sm:px-1.5 py-0.5 rounded shrink-0"
                    >
                      {priceScaleMode === 'logarithmic' ? 'LOG' : 'LIN'}
                    </span>
                  </button>
                )}

                {/* Lock Workspace Toggle */}
                {onToggleWorkspaceLock && (
                  <button
                    onClick={() => { onToggleWorkspaceLock(!isWorkspaceLocked); }}
                    className="flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-md sm:rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors w-full text-left cursor-pointer active:bg-white/20"
                  >
                    {isWorkspaceLocked ? <Lock size={14} className="text-amber-400" /> : <Unlock size={14} className="text-gray-400" />}
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-semibold text-[11px] sm:text-xs text-[var(--color-text)]">Lock Workspace</span>
                      <span className="text-[9px] sm:text-[10px] text-[var(--color-text-muted)]">Kunci posisi & penutupan widget</span>
                    </div>
                    <span 
                      style={{
                        backgroundColor: isWorkspaceLocked ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.08)',
                        color: isWorkspaceLocked ? '#f59e0b' : 'var(--color-text-muted)'
                      }}
                      className="text-[8px] sm:text-[9px] font-mono font-bold px-1 sm:px-1.5 py-0.5 rounded shrink-0"
                    >
                      {isWorkspaceLocked ? 'LOCKED' : 'UNLOCKED'}
                    </span>
                  </button>
                )}

                <button
                  onClick={() => { setChartSyncCrosshair(!chartSyncCrosshair); }}
                  className="flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-md sm:rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors w-full text-left cursor-pointer active:bg-white/20"
                >
                  <Crosshair size={14} style={{ color: chartSyncCrosshair ? 'var(--color-bull)' : 'var(--color-text-muted)' }} />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-semibold text-[11px] sm:text-xs text-[var(--color-text)]">Sync Crosshair</span>
                    <span className="text-[9px] sm:text-[10px] text-[var(--color-text-muted)]">Sinkron kursor antar chart</span>
                  </div>
                  <span 
                    style={{
                      backgroundColor: chartSyncCrosshair ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.08)',
                      color: chartSyncCrosshair ? '#22c55e' : 'var(--color-text-muted)'
                    }}
                    className="text-[8px] sm:text-[9px] font-mono font-bold px-1 sm:px-1.5 py-0.5 rounded shrink-0"
                  >
                    {chartSyncCrosshair ? 'ON' : 'OFF'}
                  </span>
                </button>

                <button
                  onClick={() => { cycleOrientation(); setIsOpen(false); }}
                  className="flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-md sm:rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors w-full text-left cursor-pointer active:bg-white/20 min-h-[36px] sm:min-h-[42px]"
                >
                  {effectiveOrientation === 'portrait' ? <Smartphone size={14} className="text-[var(--color-text-muted)]" /> : <Monitor size={14} className="text-[var(--color-text-muted)]" />}
                  <div className="flex flex-col flex-1">
                    <span className="font-semibold text-[11px] sm:text-xs text-[var(--color-text)]">Orientasi Layar</span>
                    <span className="text-[9px] sm:text-[10px] text-[var(--color-text-muted)] font-mono uppercase">{orientationOverride === 'auto' ? `Auto (${effectiveOrientation})` : orientationOverride}</span>
                  </div>
                  <RotateCw size={12} className="ml-auto opacity-40 shrink-0" />
                </button>

                <button
                  onClick={() => { setIsHighContrast(!isHighContrast); }}
                  className="flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-md sm:rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors w-full text-left cursor-pointer active:bg-white/20"
                >
                  <Contrast size={14} style={{ color: isHighContrast ? palette.bull : 'var(--color-text-muted)' }} />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-semibold text-[11px] sm:text-xs text-[var(--color-text)]">Mode Kontras Tinggi</span>
                    <span className="text-[9px] sm:text-[10px] text-[var(--color-text-muted)]">Volatilitas tinggi</span>
                  </div>
                  <span 
                    style={{
                      backgroundColor: isHighContrast ? `${palette.bull}25` : 'rgba(255,255,255,0.08)',
                      color: isHighContrast ? palette.bull : 'var(--color-text-muted)'
                    }}
                    className="text-[8px] sm:text-[9px] font-mono font-bold px-1 sm:px-1.5 py-0.5 rounded shrink-0"
                  >
                    {isHighContrast ? 'ON' : 'OFF'}
                  </span>
                </button>

                <button
                  onClick={() => { setIsAutoOsTheme(!isAutoOsTheme); }}
                  className="flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-md sm:rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors w-full text-left cursor-pointer active:bg-white/20"
                >
                  <SunMoon size={14} style={{ color: isAutoOsTheme ? 'var(--color-bull)' : 'var(--color-text-muted)' }} />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-semibold text-[11px] sm:text-xs text-[var(--color-text)]">Auto OS Color Scheme</span>
                    <span className="text-[9px] sm:text-[10px] text-[var(--color-text-muted)]">
                      {isSystemDark ? 'Deteksi OS: Dark' : 'Deteksi OS: Light'}
                    </span>
                  </div>
                  <span 
                    style={{
                      backgroundColor: isAutoOsTheme ? 'var(--color-box-bull)' : 'rgba(255,255,255,0.08)',
                      color: isAutoOsTheme ? 'var(--color-bull)' : 'var(--color-text-muted)'
                    }}
                    className="text-[8px] sm:text-[9px] font-mono font-bold px-1 sm:px-1.5 py-0.5 rounded shrink-0"
                  >
                    {isAutoOsTheme ? 'AUTO' : 'MANUAL'}
                  </span>
                </button>

                <div className="h-px w-full bg-[var(--color-border)] my-1" />

                <button
                  onClick={() => { setIsWorkspacePresetsOpen(true); setIsOpen(false); }}
                  className="flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-md sm:rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors w-full text-left cursor-pointer active:bg-white/20 min-h-[36px] sm:min-h-[42px]"
                >
                  <LayoutGrid size={14} className="text-[var(--color-text-muted)]" />
                  <span className="font-semibold text-[11px] sm:text-xs text-[var(--color-text)] flex-1">Workspace Presets</span>
                  <span style={{ backgroundColor: 'var(--color-box-bull)', color: 'var(--color-bull)' }} className="text-[8px] sm:text-[9px] font-mono px-1 sm:px-1.5 py-0.5 rounded font-bold shrink-0">
                    LAYOUTS
                  </span>
                </button>

                <button
                  onClick={() => { setIsInstantTradeEnabled(!isInstantTradeEnabled); }}
                  className="flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-md sm:rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors w-full text-left cursor-pointer active:bg-white/20 min-h-[36px] sm:min-h-[42px]"
                >
                  <Zap size={14} style={{ color: isInstantTradeEnabled ? palette.bull : 'var(--color-text-muted)' }} className={isInstantTradeEnabled ? 'drop-shadow-[0_0_6px_rgba(34,197,94,0.6)]' : ''} />
                  <span className="font-semibold text-[11px] sm:text-xs flex-1" style={{ color: isInstantTradeEnabled ? palette.bull : 'var(--color-text)' }}>Order Instan</span>
                  <span style={{ backgroundColor: isInstantTradeEnabled ? `${palette.bull}25` : 'rgba(255,255,255,0.08)', color: isInstantTradeEnabled ? palette.bull : 'var(--color-text-muted)' }} className="text-[8px] sm:text-[9px] font-mono px-1 sm:px-1.5 py-0.5 rounded font-bold shrink-0">
                    {isInstantTradeEnabled ? 'ON' : 'OFF'}
                  </span>
                </button>

                <button
                  onClick={() => { setIsHotkeyModalOpen(true); setIsOpen(false); }}
                  className="flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-md sm:rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors w-full text-left cursor-pointer active:bg-white/20 min-h-[36px] sm:min-h-[42px]"
                >
                  <Keyboard size={14} className="text-[var(--color-text-muted)]" />
                  <span className="font-semibold text-[11px] sm:text-xs text-[var(--color-text)] flex-1">Hotkeys Eksekusi</span>
                  <span style={{ backgroundColor: 'var(--color-box-bull)', color: 'var(--color-bull)' }} className="text-[8px] sm:text-[9px] font-mono px-1 sm:px-1.5 py-0.5 rounded font-bold shrink-0">
                    {hotkeyMode === 'shift' ? '⇧B/S' : 'B/S'}
                  </span>
                </button>
                
                <button
                  onClick={() => {
                    const currentProf = tradingAudio.getConfig().profile;
                    const nextProf: AudioProfile = 
                      currentProf === 'INSTITUTIONAL' ? 'VOICE_ONLY' :
                      currentProf === 'VOICE_ONLY' ? 'CHIME_ONLY' :
                      currentProf === 'CHIME_ONLY' ? 'SCALPER_TURBO' :
                      currentProf === 'SCALPER_TURBO' ? 'STEALTH' : 'INSTITUTIONAL';
                    tradingAudio.setAudioProfile(nextProf);
                    if (nextProf !== 'STEALTH') tradingAudio.play('PRESET');
                  }}
                  className="flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-md sm:rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors w-full text-left cursor-pointer active:bg-white/20 min-h-[36px] sm:min-h-[42px]"
                >
                  {tradingAudio.getConfig().profile === 'STEALTH' ? (
                    <VolumeX size={14} className="text-red-400" />
                  ) : (
                    <Volume2 size={14} className="text-[var(--color-text-muted)]" />
                  )}
                  <span className="font-semibold text-[11px] sm:text-xs text-[var(--color-text)] flex-1">
                    Audio & Voice Alert
                  </span>
                  <span 
                    style={{ 
                      backgroundColor: tradingAudio.getConfig().profile === 'STEALTH' ? 'rgba(239,68,68,0.15)' : 'var(--color-box-bull)', 
                      color: tradingAudio.getConfig().profile === 'STEALTH' ? '#ef4444' : 'var(--color-bull)' 
                    }} 
                    className="text-[8px] sm:text-[9px] font-mono px-1 sm:px-1.5 py-0.5 rounded font-bold shrink-0"
                  >
                    {tradingAudio.getConfig().profile}
                  </span>
                </button>

                <button
                  onClick={() => { setIsPriceAlertsOpen(true); setIsOpen(false); }}
                  className="flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-md sm:rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors w-full text-left cursor-pointer active:bg-white/20 min-h-[36px] sm:min-h-[42px]"
                >
                  <BellRing size={14} className="text-[var(--color-text-muted)]" />
                  <span className="font-semibold text-[11px] sm:text-xs text-[var(--color-text)] flex-1">Price Alerts</span>
                </button>

                <button
                  onClick={() => { setIsAppSettingsOpen(true); setIsOpen(false); }}
                  className="flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-md sm:rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors w-full text-left cursor-pointer active:bg-white/20 min-h-[36px] sm:min-h-[42px]"
                >
                  <Settings size={14} className="text-[var(--color-text-muted)]" />
                  <span className="font-semibold text-[11px] sm:text-xs text-[var(--color-text)] flex-1">Pengaturan & Tema</span>
                </button>

                <div className="h-px w-full bg-[var(--color-border)] my-1" />

                <button
                  onClick={() => { toggleNativeFullscreen(); setIsOpen(false); }}
                  className="flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-md sm:rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors w-full text-left cursor-pointer active:bg-white/20 min-h-[36px] sm:min-h-[42px]"
                >
                  {isAppFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
                  <span className="font-semibold text-[11px] sm:text-xs text-[var(--color-text)] flex-1">
                    {isAppFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
                  </span>
                </button>
              </div>
            </div>
          </>,
          document.body
        )}
      </div>
    </div>
  );
};
