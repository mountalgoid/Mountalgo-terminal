import React, { useState, useMemo, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { 
  Zap, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Flame, 
  Layers, 
  Shield, 
  Maximize2, 
  Minimize2, 
  ChevronUp, 
  ChevronDown, 
  Sparkles, 
  Info, 
  X, 
  Gauge, 
  Compass, 
  Radio, 
  BarChart3, 
  Target, 
  Scale,
  RefreshCw,
  ExternalLink,
  Sliders,
  HelpCircle
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { hexToRgba, getThemeModalGradient, getThemeCardBorder } from '../utils/themeGradient';
import { 
  PreciseHeatmapData,
  LiquidationCascadeRadar,
  LiquidationCascadeCluster,
  HeatmapTimeframeMode
} from '../utils/liquidityHeatmapEngine';

export type RadarDockPosition = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' | 'docked-bottom' | 'side-left' | 'side-right';
export type RadarTabType = 'unified' | 'liquidation' | 'gravity' | 'hawkes' | 'execution';

function hexToRgbTuple(hex: string, defaultRgb: [number, number, number] = [6, 9, 19]): [number, number, number] {
  if (!hex) return defaultRgb;
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(char => char + char).join('');
  }
  if (cleanHex.length !== 6) return defaultRgb;
  const num = parseInt(cleanHex, 16);
  return [
    (num >> 16) & 255,
    (num >> 8) & 255,
    num & 255
  ];
}

interface LiquidationRadarBarProps {
  data: PreciseHeatmapData | null;
  symbol: string;
  currentPrice: number;
  isForex?: boolean;
  timeframeMode?: HeatmapTimeframeMode;
  onSelectTimeframeMode?: (mode: HeatmapTimeframeMode) => void;
  onJumpToPrice?: (price: number) => void;
  onOpenGuide?: () => void;
  onClose?: () => void;
  isMinimized?: boolean;
  setIsMinimized?: (val: boolean) => void;
  isSeparate?: boolean;
  dockPosition?: RadarDockPosition;
  setDockPosition?: (pos: RadarDockPosition) => void;
}

export const LiquidationRadarBar = React.memo(function LiquidationRadarBar({
  data,
  symbol,
  currentPrice,
  isForex = false,
  timeframeMode = 'tick',
  onSelectTimeframeMode,
  onJumpToPrice,
  onOpenGuide,
  onClose,
  isMinimized,
  setIsMinimized,
  isSeparate = false,
  dockPosition,
  setDockPosition,
}: LiquidationRadarBarProps) {
  const { palette, theme, isLight } = useTheme();

  const isEmerald = theme === 'Standard Spartan Edge Theme' || theme === 'Dark ICT Theme' || theme === 'MountAlgo Themes' || theme === 'DEX Deep';
  const isCyan = theme === 'MountAlgo Frost' || theme === 'Deep Sea';
  const isRose = theme === 'MountAlgo Cyber' || theme === 'Spartan Edge Theme';
  const isAmber = theme === 'Garuda Gold' || theme === 'Gear Protocol' || theme === 'MountAlgo Super Premium Theme';
  const isPurple = theme === 'MountAlgo Neon';

  const dynamicBgClass = isEmerald
    ? 'bg-gradient-to-br from-zinc-950 via-emerald-950/20 to-zinc-950 border-emerald-500/20 shadow-[0_0_25px_rgba(16,185,129,0.08)]'
    : isCyan
    ? 'bg-gradient-to-br from-zinc-950 via-cyan-950/20 to-zinc-950 border-cyan-500/20 shadow-[0_0_25px_rgba(6,182,212,0.08)]'
    : isRose
    ? 'bg-gradient-to-br from-zinc-950 via-rose-950/20 to-zinc-950 border-rose-500/20 shadow-[0_0_25px_rgba(244,63,94,0.08)]'
    : isAmber
    ? 'bg-gradient-to-br from-zinc-950 via-amber-950/20 to-zinc-950 border-amber-500/20 shadow-[0_0_25px_rgba(245,158,11,0.08)]'
    : isPurple
    ? 'bg-gradient-to-br from-zinc-950 via-purple-950/20 to-zinc-950 border-purple-500/20 shadow-[0_0_25px_rgba(168,85,247,0.08)]'
    : 'bg-gradient-to-br from-[var(--color-panel)] via-[var(--color-panel)]/90 to-[var(--color-panel)] border-[var(--color-border)] shadow-[0_12px_40px_rgba(0,0,0,0.8)]';

  const accentBorderClass = isEmerald
    ? 'border-emerald-500/30'
    : isCyan
    ? 'border-cyan-500/30'
    : isRose
    ? 'border-rose-500/30'
    : isAmber
    ? 'border-amber-500/30'
    : isPurple
    ? 'border-purple-500/30'
    : 'border-[var(--color-border)]';

  // Local UI State
  const [localDockPosition, setLocalDockPosition] = useState<RadarDockPosition>('bottom-left');
  const [activeTab, setActiveTab] = useState<RadarTabType>('unified');
  const [localMinimized, setLocalMinimized] = useState(false);
  const [showHelperModal, setShowHelperModal] = useState(false);
  const [copiedPrice, setCopiedPrice] = useState<number | null>(null);
  const [isAutoProtectionEnabled, setIsAutoProtectionEnabled] = useState(true);
  const [protectionActivated, setProtectionActivated] = useState(false);

  const activeDockPosition = dockPosition !== undefined ? dockPosition : localDockPosition;
  const setActiveDockPosition = setDockPosition !== undefined ? setDockPosition : setLocalDockPosition;

  const activeMinimized = isMinimized !== undefined ? isMinimized : localMinimized;
  const setActiveMinimized = setIsMinimized !== undefined ? setIsMinimized : setLocalMinimized;

  const isReallySeparate = activeDockPosition === 'docked-bottom' || activeDockPosition === 'side-left' || activeDockPosition === 'side-right' || isSeparate;
  const isSideMode = activeDockPosition === 'side-left' || activeDockPosition === 'side-right';

  const formatCompactUSD = (usd: number) => {
    if (!usd) return '$0';
    if (usd >= 1e9) return `$${(usd / 1e9).toFixed(2)}B`;
    if (usd >= 1e6) return `$${(usd / 1e6).toFixed(1)}M`;
    if (usd >= 1e3) return `$${(usd / 1e3).toFixed(1)}K`;
    return `$${usd.toFixed(0)}`;
  };

  const getSubCardStyle = useCallback((options?: { isAmberAlert?: boolean; isRoseAlert?: boolean; hoverable?: boolean }) => {
    const [darkR, darkG, darkB] = hexToRgbTuple(
      palette.dark && palette.dark !== '#000000' && palette.dark !== '#ffffff' ? palette.dark : '#060913',
      [6, 9, 19]
    );

    let borderCol = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.07)';
    let bg = '';

    if (options?.isRoseAlert) {
      borderCol = isLight ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.25)';
      bg = isLight 
        ? 'linear-gradient(135deg, rgba(254, 242, 242, 0.90) 0%, rgba(255, 255, 255, 0.95) 100%)'
        : 'linear-gradient(135deg, rgba(159, 18, 57, 0.22) 0%, rgba(15, 23, 42, 0.45) 100%)';
    } else if (options?.isAmberAlert) {
      borderCol = isLight ? 'rgba(245, 158, 11, 0.25)' : 'rgba(245, 158, 11, 0.25)';
      bg = isLight
        ? 'linear-gradient(135deg, rgba(254, 252, 232, 0.90) 0%, rgba(255, 255, 255, 0.95) 100%)'
        : 'linear-gradient(135deg, rgba(120, 85, 0, 0.20) 0%, rgba(15, 23, 42, 0.45) 100%)';
    } else {
      bg = isLight
        ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.70) 0%, rgba(241, 245, 249, 0.60) 100%)'
        : `linear-gradient(135deg, rgba(${darkR + 4}, ${darkG + 6}, ${darkB + 10}, 0.55) 0%, rgba(11, 15, 26, 0.45) 100%)`;
    }

    return {
      background: bg,
      borderColor: borderCol,
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.02)' : '0 2px 8px rgba(0,0,0,0.15)',
    };
  }, [palette, isLight]);

  // Fixed position mapping for minimized pill (always 'fixed' to avoid clipping by overflow-hidden parents)
  const minimizedFixedPosition = {
    'bottom-left': 'bottom-16 left-4 sm:left-12',
    'bottom-right': 'bottom-16 right-4 sm:right-20',
    'top-left': 'top-24 left-4 sm:left-12',
    'top-right': 'top-24 right-4 sm:right-20',
    'docked-bottom': 'bottom-24 left-4 sm:left-10',
    'side-left': 'bottom-16 left-4 sm:left-10',
    'side-right': 'bottom-16 right-4 sm:right-10',
  }[activeDockPosition];

  // If no data or liquidation radar not calculated, return null
  if (!data) return null;

  const radar = data.liquidationRadar;
  const gravity = data.gravityVector;
  const vpin = data.vpinMetric;
  const ofi = data.ofiMetric;
  const hawkes = data.hawkesWarning;
  const almgren = data.almgrenTrajectory;
  const matrix = data.crossExchangeMatrix;

  // Key metrics calculation
  const totalLongLiq = radar?.totalLongLiquidationUsd || 0;
  const totalShortLiq = radar?.totalShortLiquidationUsd || 0;
  const totalLiqUsd = totalLongLiq + totalShortLiq;
  const longLiqPct = totalLiqUsd > 0 ? (totalLongLiq / totalLiqUsd) * 100 : 50;
  const shortLiqPct = 100 - longLiqPct;

  const hazardScore = radar?.cascadeHazardScore ?? 35;
  const isHighHazard = radar?.overallCascadeHazard === 'HIGH_CASCADE_IMMINENT' || hazardScore >= 70;
  const isModerateHazard = radar?.overallCascadeHazard === 'MODERATE_RISK' || (hazardScore >= 40 && hazardScore < 70);

  const hazardColor = isHighHazard ? palette.bear : isModerateHazard ? palette.poc : palette.bull;
  const hazardBg = hazardColor + '26';
  const hazardBorder = hazardColor + '59';
  const hazardLabel = isHighHazard ? 'HIGH CASCADE IMMINENT' : isModerateHazard ? 'MODERATE RISK' : 'LOW RISK / STABLE';

  // Gravity Magnet Info
  const isBullMagnet = gravity?.dominantSide === 'bullish_magnet';
  const isBearMagnet = gravity?.dominantSide === 'bearish_magnet';
  const magnetColor = isBullMagnet ? palette.bull : isBearMagnet ? palette.bear : (palette.poc || '#eab308');
  const magnetPullPct = gravity ? Math.round(Math.abs(gravity.netImbalanceRatio) * 100) : 0;
  const magnetDistPct = gravity?.pullDistancePct ?? 0;

  // Format Helper
  const formatM = (usd: number) => `$${(usd / 1e6).toFixed(1)}M`;
  const formatPrice = (p: number) => {
    if (!p) return '0.00';
    return isForex || p < 10 ? p.toFixed(4) : p.toFixed(2);
  };

  const handleCopyPrice = (p: number) => {
    navigator.clipboard?.writeText(p.toString());
    setCopiedPrice(p);
    setTimeout(() => setCopiedPrice(null), 2000);
  };

  // Position CSS mapping
  const positionClasses = {
    'bottom-left': 'bottom-16 left-12 max-w-[620px]',
    'bottom-right': 'bottom-16 right-20 max-w-[620px]',
    'top-left': 'top-20 left-12 max-w-[620px]',
    'top-right': 'top-20 right-20 max-w-[620px]',
    'docked-bottom': 'bottom-0 left-0 right-0 max-w-full rounded-none border-x-0 border-b-0',
    'side-left': 'top-20 left-0 bottom-0 w-[320px] rounded-none border-y-0 border-l-0',
    'side-right': 'top-20 right-0 bottom-0 w-[320px] rounded-none border-y-0 border-r-0',
  }[activeDockPosition];

  // ---------------------------------------------------------------------------
  // MINIMIZED SMART MICRO-BADGE (Glassmorphism & Magnetic Drag Constraints)
  // ---------------------------------------------------------------------------
  if (activeMinimized) {
    const isHighRisk = hazardScore >= 70;
    const imminentPrice = radar?.imminentCluster?.price;

    return (
      <motion.div 
        drag
        dragMomentum={false}
        dragElastic={0.08}
        dragConstraints={{ left: 16, right: typeof window !== 'undefined' ? window.innerWidth - 180 : 400, top: 70, bottom: typeof window !== 'undefined' ? window.innerHeight - 80 : 600 }}
        className={`fixed z-[9600] cursor-grab active:cursor-grabbing select-none group ${minimizedFixedPosition} !important`}
        onDoubleClick={() => setActiveMinimized(false)}
      >
        <div 
          style={{
            background: getThemeModalGradient(palette, isLight),
            borderColor: getThemeCardBorder(palette, false),
            boxShadow: `0 12px 40px rgba(0,0,0,0.8), 0 0 20px ${hexToRgba(hazardColor, 0.35)}`
          }}
          className="relative flex items-center border rounded-xl p-1.5 shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:scale-105 active:scale-95 group overflow-hidden"
        >
          
          {/* Flash Pulse Radar Effect */}
          <div className="absolute inset-0 pointer-events-none">
            <div 
              className="absolute inset-0 rounded-sm animate-flash-pulse"
              style={{ 
                backgroundColor: `${hazardColor}20`,
                boxShadow: `0 0 24px 4px ${hazardColor}40`
              }} 
            />
          </div>

          {/* Holographic Glass Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

          {/* Flashing Critical Ring (Visible on High Risk) */}
          {isHighRisk && (
            <div className="absolute inset-0 rounded-sm border-2 border-rose-500/60 animate-flash-pulse pointer-events-none" style={{ animationDuration: '0.8s' }} />
          )}

          {/* Precision Orb Core */}
          <div className="relative flex items-center justify-center w-8 h-8">
            {/* Dynamic Glow Layer */}
            <div 
              className="absolute inset-0 rounded-full opacity-30 animate-pulse-glow"
              style={{ 
                backgroundColor: hazardColor,
                boxShadow: `0 0 20px ${hazardColor}`
              }}
            />
            
            {/* The Actual Gauge Circle */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="16"
                cy="16"
                r="14"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="transparent"
                className="text-white/10"
              />
              <motion.circle
                cx="16"
                cy="16"
                r="14"
                stroke="currentColor"
                strokeWidth="2"
                fill="transparent"
                strokeDasharray="88"
                initial={{ strokeDashoffset: 88 }}
                animate={{ strokeDashoffset: 88 - (88 * (hazardScore / 100)) }}
                className="transition-all duration-1000 ease-out"
                style={{ color: hazardColor }}
              />
            </svg>

            {/* Inner Core with Icon/Score */}
            <div 
              className="relative w-5 h-5 rounded-full border border-white/40 flex items-center justify-center shadow-inner z-10"
              style={{ backgroundColor: `${hazardColor}33` }}
            >
              <span className="text-[9px] font-black text-white leading-none tracking-tighter drop-shadow-md">
                {hazardScore}
              </span>
            </div>
          </div>

          {/* Smart Label Reveal (on hover) */}
          <div className="flex flex-col items-start overflow-hidden max-w-0 group-hover:max-w-[150px] transition-all duration-500 ease-in-out px-0 group-hover:pl-3 group-hover:pr-2">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[7px] font-black text-[var(--color-text-muted)] uppercase tracking-[0.2em] leading-none">RADAR {timeframeMode === 'tick' ? '⚡ 1T' : timeframeMode.toUpperCase()}</span>
              {imminentPrice && (
                <span className="text-[8px] font-black text-emerald-400 leading-none">@{imminentPrice.toLocaleString()}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold whitespace-nowrap leading-none text-[var(--color-text)]">
                {hazardLabel}
              </span>
              <div 
                className="w-1 h-1 rounded-full animate-ping bg-zinc-400"
              />
            </div>
          </div>

          {/* Expand Button (always visible) */}
          <button 
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setActiveMinimized(false);
            }}
            className="p-1.5 rounded-sm bg-[var(--color-panel)]/80 hover:bg-[var(--color-bg)] text-[var(--color-text)] hover:text-white transition-all transform hover:rotate-180 shrink-0 ml-1 border border-[var(--color-border)]/50"
            title="Maximize Control Bar"
          >
            <Maximize2 size={12} />
          </button>
        </div>
      </motion.div>
    );
  }

  // ---------------------------------------------------------------------------
  // FULL EXPANDED RADAR BAR (Glassmorphism & Adaptive Layout)
  // ---------------------------------------------------------------------------
  return (
    <div 
      style={{
        background: getThemeModalGradient(palette, isLight),
        borderColor: getThemeCardBorder(palette, false),
        boxShadow: `0 20px 50px rgba(0,0,0,0.85), 0 0 25px ${hexToRgba(palette.poc || palette.bull, 0.2)}`
      }}
      className={`${
        isReallySeparate 
          ? `${activeDockPosition.startsWith('side') ? 'w-[320px] h-full overflow-y-auto' : 'w-full'} border` 
          : `absolute ${positionClasses} z-[35] max-w-full border shadow-2xl`
      } rounded-xl font-mono text-[10px] text-[var(--color-text)] select-none transition-all duration-200 ease-out space-y-2.5 backdrop-blur-2xl p-3 relative overflow-hidden`}
    >
      {/* Accent Gradient Line */}
      <div 
        className="h-[2px] w-full -mx-3 -mt-3 mb-2.5 shrink-0"
        style={{
          background: `linear-gradient(90deg, ${palette.bull} 0%, ${palette.poc || '#6366f1'} 50%, ${palette.bear} 100%)`
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-950/40 via-transparent to-zinc-950/40 pointer-events-none" />

      {/* ⚠️ HIGH HAZARD RISK PROTECTION ALERT BANNER */}
      {isHighHazard && isAutoProtectionEnabled && (
        <div className="relative flex flex-wrap items-center justify-between gap-2 bg-rose-950/60 backdrop-blur-md border border-rose-500/50 p-2 rounded-sm text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.25)] animate-pulse">
          <div className="flex items-center gap-1.5 min-w-0">
            <AlertTriangle size={14} className="text-[var(--color-text)] shrink-0 animate-bounce" />
            <span className="font-bold text-[9.5px] truncate">
              ⚠️ HIGH HAZARD ALERT (Score: {hazardScore}) — Imminent Cascade Detected!
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setProtectionActivated(true)}
              className={`h-6 px-2 rounded-sm text-[8.5px] font-bold transition-all cursor-pointer ${
                protectionActivated 
                  ? 'bg-emerald-500 text-black border border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]' 
                  : 'bg-rose-500 hover:bg-rose-400 text-white shadow-[0_0_10px_rgba(244,63,94,0.3)]'
              }`}
            >
              {protectionActivated ? '✓ Protected (Drawdown Active)' : '🛡️ Aktifkan Drawdown Protection'}
            </button>
            <button 
              onClick={() => setIsAutoProtectionEnabled(false)}
              className="text-[var(--color-text-muted)] hover:text-white p-0.5 cursor-pointer"
              title="Tutup Alert Peringatan Risiko"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}
      {/* 1. TOP HEADER BAR */}
      <div className={`relative flex flex-wrap ${isSideMode ? 'flex-col items-start gap-2.5' : 'items-center justify-between gap-2'} border-b border-[var(--color-border)] pb-2`}>
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <div className="p-1 rounded-sm bg-[var(--color-panel)] border border-[var(--color-border)] text-white flex items-center justify-center shrink-0">
            <Flame size={13} className="text-[var(--color-text)] animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-xs tracking-wider text-[var(--color-text)]">LIQUIDATION RADAR</span>
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider bg-[var(--color-panel)] border border-[var(--color-border)] text-[var(--color-text)]"
              >
                {hazardLabel}
              </span>
 
              {/* Timeframe Mode Selector (Per Tick 1T, 10T, 50T, 100T, Candle) */}
              {onSelectTimeframeMode && (
                <div 
                  style={{
                    borderColor: hexToRgba(palette.bull, 0.3),
                    background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(10, 15, 30, 0.6)'
                  }}
                  className="flex items-center gap-0.5 border rounded-md p-0.5 backdrop-blur-md" 
                  title="Pilih Resolusi Timeframe Liquidation Heatmap"
                >
                  {[
                    { id: 'tick', label: '⚡ 1T' },
                    { id: '10t', label: '10T' },
                    { id: '50t', label: '50T' },
                    { id: '100t', label: '100T' },
                    { id: 'candle', label: 'Bar' },
                  ].map((tf) => {
                    const isActive = timeframeMode === tf.id;
                    return (
                      <button
                        key={tf.id}
                        onClick={() => onSelectTimeframeMode(tf.id as HeatmapTimeframeMode)}
                        style={isActive ? {
                          background: `linear-gradient(135deg, ${palette.bull} 0%, ${palette.poc || palette.bull} 100%)`,
                          color: '#000000',
                          boxShadow: `0 0 10px ${hexToRgba(palette.bull, 0.4)}`
                        } : {}}
                        className={`h-6 text-[8.5px] px-2 rounded font-mono transition-all cursor-pointer font-bold flex items-center justify-center ${
                          isActive
                            ? 'font-black scale-105'
                            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-white/10'
                        }`}
                      >
                        {tf.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="text-[9px] text-[var(--color-text-muted)] flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className="whitespace-nowrap">{symbol} Core</span>
              <span>•</span>
              <span className="whitespace-nowrap">Live: <strong className="text-[var(--color-text)]">${formatPrice(currentPrice)}</strong></span>
              <span>•</span>
              <span className="whitespace-nowrap text-[var(--color-text-muted)] font-mono font-bold flex items-center gap-1">
                <Zap size={10} className="text-[var(--color-text-muted)]" />
                {timeframeMode === 'tick' ? 'Per-Tick (1T)' : `${timeframeMode.toUpperCase()}`}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className={`flex items-center gap-1 flex-wrap ${isSideMode ? 'w-full justify-between' : ''}`}>
          {/* Dock Position Switcher */}
          <div className="flex items-center gap-0.5 border border-[var(--color-border)] rounded-sm p-0.5 bg-[var(--color-panel)]/80">
            <button 
              onClick={() => setActiveDockPosition('docked-bottom')} 
              className={`h-6 px-2 rounded-sm text-[8.5px] font-bold border transition-all cursor-pointer ${activeDockPosition === 'docked-bottom' ? 'bg-zinc-100 text-zinc-950 border-zinc-200' : 'text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-bg)] border-transparent'}`} 
              title="Pisah ke Panel Bawah (Full Width)"
            >
              Bawah
            </button>
            <button 
              onClick={() => setActiveDockPosition('side-left')} 
              className={`h-6 px-2 rounded-sm text-[8.5px] font-bold border transition-all cursor-pointer ${activeDockPosition === 'side-left' ? 'bg-zinc-100 text-zinc-950 border-zinc-200' : 'text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-bg)] border-transparent'}`} 
              title="Pisah ke Samping Kiri"
            >
              Kiri
            </button>
            <button 
              onClick={() => setActiveDockPosition('side-right')} 
              className={`h-6 px-2 rounded-sm text-[8.5px] font-bold border transition-all cursor-pointer ${activeDockPosition === 'side-right' ? 'bg-zinc-100 text-zinc-950 border-zinc-200' : 'text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-bg)] border-transparent'}`} 
              title="Pisah ke Samping Kanan"
            >
              Kanan
            </button>
          </div>

          {/* Help & Guide Button */}
          {onOpenGuide && (
            <button
              onClick={onOpenGuide}
              className="h-6 px-2 rounded-sm bg-[var(--color-panel)] hover:bg-[var(--color-bg)] text-[var(--color-text)] border border-[var(--color-border)] transition-colors flex items-center gap-1 cursor-pointer font-bold"
              title="Buka Panduan Liquidation & Heatmap"
            >
              <HelpCircle size={11} className="text-[var(--color-text-muted)]" />
              <span className="hidden sm:inline text-[8.5px]">Panduan</span>
            </button>
          )}

          {/* Minimize Button */}
          <button
            onClick={() => setActiveMinimized(true)}
            className="h-6 px-2 rounded-sm bg-[var(--color-panel)] hover:bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:text-white border border-[var(--color-border)] transition-colors flex items-center justify-center cursor-pointer font-bold"
            title="Minimize Bar ke Mode Ringkas (Pill)"
          >
            <Minimize2 size={11} className="text-[var(--color-text-muted)]" />
          </button>
        </div>
      </div>

      {/* 2. TAB SELECTOR BAR */}
      <div className="relative flex items-center gap-1 bg-[var(--color-panel)]/80 p-0.5 rounded-sm border border-[var(--color-border)] overflow-x-auto no-scrollbar max-w-full">
        <button
          onClick={() => setActiveTab('unified')}
          className={`h-6 flex items-center gap-1.5 px-2.5 rounded-sm transition-all text-[9.5px] font-bold whitespace-nowrap cursor-pointer shrink-0 ${
            activeTab === 'unified' 
              ? 'bg-zinc-100 text-zinc-950'
              : 'text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-panel)]'
          }`}
        >
          <Sparkles size={11} className={activeTab === 'unified' ? 'text-zinc-950' : 'text-[var(--color-text-muted)]'} />
          <span>Radar Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('liquidation')}
          className={`h-6 flex items-center gap-1.5 px-2.5 rounded-sm transition-all text-[9.5px] font-bold whitespace-nowrap cursor-pointer shrink-0 ${
            activeTab === 'liquidation' 
              ? 'bg-zinc-100 text-zinc-950'
              : 'text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-panel)]'
          }`}
        >
          <Flame size={11} className={activeTab === 'liquidation' ? 'text-zinc-950' : 'text-[var(--color-text-muted)]'} />
          <span>Klaster Likuidasi ({radar?.clusters?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('gravity')}
          className={`h-6 flex items-center gap-1.5 px-2.5 rounded-sm transition-all text-[9.5px] font-bold whitespace-nowrap cursor-pointer shrink-0 ${
            activeTab === 'gravity' 
              ? 'bg-zinc-100 text-zinc-950'
              : 'text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-panel)]'
          }`}
        >
          <Compass size={11} className={activeTab === 'gravity' ? 'text-zinc-950' : 'text-[var(--color-text-muted)]'} />
          <span>Magnet & VPIN</span>
        </button>

        <button
          onClick={() => setActiveTab('hawkes')}
          className={`h-6 flex items-center gap-1.5 px-2.5 rounded-sm transition-all text-[9.5px] font-bold whitespace-nowrap cursor-pointer shrink-0 ${
            activeTab === 'hawkes' 
              ? 'bg-zinc-100 text-zinc-950'
              : 'text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-panel)]'
          }`}
        >
          <Activity size={11} className={activeTab === 'hawkes' ? 'text-zinc-950' : 'text-[var(--color-text-muted)]'} />
          <span>Flash-Crash Hawkes</span>
        </button>

        <button
          onClick={() => setActiveTab('execution')}
          className={`h-6 flex items-center gap-1.5 px-2.5 rounded-sm transition-all text-[9.5px] font-bold whitespace-nowrap cursor-pointer shrink-0 ${
            activeTab === 'execution' 
              ? 'bg-zinc-100 text-zinc-950'
              : 'text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-panel)]'
          }`}
        >
          <Target size={11} className={activeTab === 'execution' ? 'text-zinc-950' : 'text-[var(--color-text-muted)]'} />
          <span>Eksekusi & Arb</span>
        </button>
      </div>

      {/* 3. TAB CONTENT AREA */}

      {/* ── TAB 1: UNIFIED OVERVIEW ── */}
      {activeTab === 'unified' && (
        <div className="space-y-2.5 animate-fadeIn">
          {/* Panduan Radar */}
          <div 
            style={getSubCardStyle()}
            className="p-2 rounded-sm border text-[8.5px] text-[var(--color-text-muted)] leading-relaxed"
          >
            <strong className="text-[var(--color-text)] flex items-center gap-1 mb-1"><Info size={10} className="text-[var(--color-text-muted)]" /> Petunjuk: Unified Overview</strong>
            Ringkasan 360° yang mengagregasikan risiko likuidasi (Notional Ratio), tarikan gravitasi buku order, dan status kesehatan mikrostruktur secara real-time. Berguna untuk mendeteksi arah bias institusional secara instan (Apakah Smart Money sedang memburu posisi Long atau Short).
          </div>
          {/* Section A: Visual Long vs Short Liquidation Bar Chart */}
          <div 
            style={getSubCardStyle()}
            className="p-2.5 rounded-sm border space-y-2"
          >
            <div className="flex items-center justify-between text-[9px] flex-wrap gap-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[var(--color-text-muted)] uppercase font-bold">Distribusi Pool Likuidasi:</span>
                <span className="text-[var(--color-text)] font-bold">{formatCompactUSD(totalLiqUsd)} Total Notional</span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: palette.bull }} className="font-extrabold">
                  LONG {longLiqPct.toFixed(0)}% ({formatCompactUSD(totalLongLiq)})
                </span>
                <span className="text-zinc-600">|</span>
                <span style={{ color: palette.bear }} className="font-extrabold">
                  SHORT {shortLiqPct.toFixed(0)}% ({formatCompactUSD(totalShortLiq)})
                </span>
              </div>
            </div>

            {/* Split Liquidation Ratio Bar (High Performance Visual Chart) */}
            <div className="w-full h-3.5 bg-[var(--color-panel)] rounded-sm overflow-hidden flex p-0.5 border border-[var(--color-border)] relative shadow-inner">
              <div 
                style={{ width: `${longLiqPct}%`, backgroundColor: palette.bull }}
                className="h-full rounded-l-sm transition-all duration-700 ease-out flex items-center justify-center text-[8px] font-black text-black"
              >
                {longLiqPct > 15 && `${longLiqPct.toFixed(0)}%`}
              </div>
              <div 
                style={{ width: `${shortLiqPct}%`, backgroundColor: palette.bear }}
                className="h-full rounded-r-sm transition-all duration-700 ease-out flex items-center justify-center text-[8px] font-black text-white"
              >
                {shortLiqPct > 15 && `${shortLiqPct.toFixed(0)}%`}
              </div>
            </div>

            {/* Imminent Cluster Alert / Summary */}
            {radar?.imminentCluster ? (
              <div 
                style={getSubCardStyle({ isRoseAlert: true })}
                className="flex items-center justify-between border p-2 rounded-sm text-[var(--color-text)] flex-wrap gap-1"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <AlertTriangle size={13} className="text-rose-400 animate-bounce shrink-0" />
                  <span className="font-bold text-[9.5px]">
                    Klaster Kritis Terdekat: {radar.imminentCluster.leverageTier} {radar.imminentCluster.side === 'short_liq' ? 'Short' : 'Long'} Liq @ ${formatPrice(radar.imminentCluster.price)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[8.5px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-1.5 py-0.5 rounded-sm font-mono font-black flex items-center gap-1">
                    <Zap size={10} />
                    {radar.imminentCluster.distanceTicks} Ticks
                  </span>
                  <span className="text-[8.5px] bg-rose-900/50 px-1.5 py-0.5 rounded-sm font-mono font-bold">
                    {radar.imminentCluster.distancePct.toFixed(2)}% ({radar.imminentCluster.distanceBps} bps)
                  </span>
                  {onJumpToPrice && (
                    <button
                      onClick={() => onJumpToPrice(radar.imminentCluster!.price)}
                      className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-sm text-[8.5px] transition-transform active:scale-95 cursor-pointer"
                    >
                      Lihat Chart
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-[9px] text-[var(--color-text-muted)] flex items-center justify-between px-1">
                <span>{radar?.summary || 'Struktur likuidasi seimbang dan stabil'}</span>
                <span className="text-emerald-400 font-bold">🟢 Zona Aman</span>
              </div>
            )}
          </div>

          {/* Section B: Grid Metric Cards (4 Pillars of Microstructure) */}
          <div className={`grid ${isSideMode ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'} gap-2 text-[9.5px]`}>
            {/* 1. Liquidity Magnet Gravity */}
            <div 
              style={getSubCardStyle()}
              className="p-2 rounded-sm border flex flex-col justify-between"
            >
              <div className="text-[8.5px] text-[var(--color-text-muted)] font-bold flex items-center justify-between">
                <span>🧲 MAGNET LIKUIDITAS</span>
                <span style={{ color: magnetColor }}>{isBullMagnet ? '▲ BULL' : isBearMagnet ? '▼ BEAR' : '■ MID'}</span>
              </div>
              <div className="my-1">
                <div style={{ color: magnetColor }} className="text-xs font-black">
                  {gravity?.magnetPriceFormatted || '—'}
                </div>
                <div className="text-[8.5px] text-[var(--color-text-muted)] flex items-center justify-between mt-0.5">
                  <span>Kekuatan Tarik:</span>
                  <span className="font-bold text-[var(--color-text)]">{magnetPullPct}%</span>
                </div>
              </div>
              <div className="w-full bg-[var(--color-panel)]/80 border border-[var(--color-border)] h-1.5 rounded-full overflow-hidden p-0.5 shadow-inner">
                <div 
                  style={{ width: `${Math.min(100, magnetPullPct)}%` }}
                  className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]"
                />
              </div>
            </div>

            {/* 2. VPIN Toxicity */}
            <div 
              style={getSubCardStyle()}
              className="p-2 rounded-sm border flex flex-col justify-between"
            >
              <div className="text-[8.5px] text-[var(--color-text-muted)] font-bold flex items-center justify-between">
                <span>🧪 VPIN TOKSISITAS</span>
                <span className={vpin && vpin.vpin >= 60 ? 'font-bold text-rose-400' : 'text-emerald-400'}>
                  {vpin && vpin.vpin >= 60 ? 'TOXIC' : 'NORMAL'}
                </span>
              </div>
              <div className="my-1">
                <div className={`text-xs font-black ${vpin && vpin.vpin >= 60 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {vpin ? `${vpin.vpin}%` : '32%'}
                </div>
                <div className="text-[8.5px] text-[var(--color-text-muted)] flex items-center justify-between mt-0.5">
                  <span>Refill LOB:</span>
                  <span className="font-bold text-[var(--color-text)]">{vpin ? `${vpin.replenishmentVelocityMs}ms` : '180ms'}</span>
                </div>
              </div>
              <div className="w-full bg-[var(--color-panel)]/80 border border-[var(--color-border)] h-1.5 rounded-full overflow-hidden p-0.5 shadow-inner">
                <div 
                  style={{ width: `${vpin ? vpin.vpin : 32}%` }}
                  className={`h-full rounded-full transition-all duration-300 ${
                    vpin && vpin.vpin >= 60 
                      ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 shadow-[0_0_8px_rgba(244,63,94,0.5)]' 
                      : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                  }`}
                />
              </div>
            </div>

            {/* 3. Order Flow Imbalance (OFI) */}
            <div 
              style={getSubCardStyle()}
              className="p-2 rounded-sm border flex flex-col justify-between"
            >
              <div className="text-[8.5px] text-[var(--color-text-muted)] font-bold flex items-center justify-between">
                <span>⚖️ OFI IMBALANCE</span>
                <span className={ofi && ofi.ofiRatio > 0 ? 'text-emerald-400' : ofi && ofi.ofiRatio < 0 ? 'text-rose-400' : 'text-[var(--color-text-muted)]'}>
                  {ofi && ofi.ofiRatio > 0 ? '+BUY' : ofi && ofi.ofiRatio < 0 ? '-SELL' : '0.0'}
                </span>
              </div>
              <div className="my-1">
                <div className={`text-xs font-black ${ofi && ofi.ofiRatio > 0 ? 'text-emerald-400' : ofi && ofi.ofiRatio < 0 ? 'text-rose-400' : 'text-[var(--color-text)]'}`}>
                  {ofi ? `${ofi.ofiRatio > 0 ? '+' : ''}${ofi.ofiRatio}` : '+0.24'}
                </div>
                <div className="text-[8.5px] text-[var(--color-text-muted)] flex items-center justify-between mt-0.5">
                  <span>Kyle's λ Impact:</span>
                  <span className="font-bold text-[var(--color-text)]">{ofi ? (ofi.kylesLambdaAvg * 1e4).toFixed(1) : '2.1'}e-4</span>
                </div>
              </div>
              <div className="w-full bg-[var(--color-panel)]/80 border border-[var(--color-border)] h-1.5 rounded-full overflow-hidden p-0.5 shadow-inner">
                <div 
                  style={{ width: `${Math.min(100, Math.abs(ofi?.ofiRatio || 0.2) * 100)}%` }}
                  className={`h-full rounded-full transition-all duration-300 ${
                    (ofi?.ofiRatio || 0) >= 0 
                      ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]' 
                      : 'bg-gradient-to-r from-rose-500 via-pink-500 to-red-600 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                  }`}
                />
              </div>
            </div>

            {/* 4. Hawkes Flash Crash Alert */}
            <div 
              style={getSubCardStyle()}
              className="p-2 rounded-sm border flex flex-col justify-between"
            >
              <div className="text-[8.5px] text-[var(--color-text-muted)] font-bold flex items-center justify-between">
                <span>⚡ HAWKES RADAR</span>
                <span className={hawkes?.hazardLevel.includes('CRITICAL') ? 'font-bold text-rose-400' : hawkes?.hazardLevel.includes('ELEVATED') ? 'text-amber-400' : 'text-emerald-400'}>
                  {hawkes?.hazardLevel ? hawkes.hazardLevel.split('_')[0] : 'NORMAL'}
                </span>
              </div>
              <div className="my-1">
                <div className={`text-xs font-black ${hawkes?.hazardLevel.includes('CRITICAL') ? 'text-rose-400' : hawkes?.hazardLevel.includes('ELEVATED') ? 'text-amber-400' : 'text-emerald-400'}`}>
                  λ: {hawkes ? hawkes.intensityLambda : '1.15'}
                </div>
                <div className="text-[8.5px] text-[var(--color-text-muted)] flex items-center justify-between mt-0.5">
                  <span>Evaporation:</span>
                  <span className="font-bold text-[var(--color-text)]">{hawkes ? `${hawkes.liquidityEvaporationPct}%` : '8%'}</span>
                </div>
              </div>
              <div className="w-full bg-[var(--color-panel)]/80 border border-[var(--color-border)] h-1.5 rounded-full overflow-hidden p-0.5 shadow-inner">
                <div 
                  style={{ width: `${hawkes ? Math.min(100, hawkes.liquidityEvaporationPct) : 8}%` }}
                  className={`h-full rounded-full transition-all duration-300 ${
                    hawkes?.hazardLevel.includes('CRITICAL') 
                      ? 'bg-gradient-to-r from-rose-500 via-pink-600 to-red-600 shadow-[0_0_8px_rgba(244,63,94,0.5)]' 
                      : hawkes?.hazardLevel.includes('ELEVATED') 
                      ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]' 
                      : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: LIQUIDATION POOLS & LEVERAGE TIERS ── */}
      {activeTab === 'liquidation' && (
        <div className="space-y-2.5 animate-fadeIn">
          {/* Panduan Radar */}
          <div 
            style={getSubCardStyle()}
            className="p-2 rounded-sm border text-[8.5px] text-[var(--color-text-muted)] leading-relaxed"
          >
            <strong className="text-[var(--color-text)] flex items-center gap-1 mb-1"><Flame size={10} className="text-[var(--color-text-muted)]" /> Petunjuk: Klaster Likuidasi</strong>
            Memetakan titik-titik jebakan (*Liquidation Clusters*) tempat stop-loss ritel bertumpuk berdasarkan estimasi *leverage* (10x - 100x). Harga memiliki tendensi magnetis untuk menyapu klaster-klaster dengan nilai *Notional USD* tinggi sebelum melakukan pembalikan tren (Stop-Hunt).
          </div>
          <div className="flex items-center justify-between text-[9px] pb-1 border-b border-[var(--color-border)] text-[var(--color-text-muted)]">
            <span>Klaster Likuidasi Leverage (100x, 50x, 25x, 10x)</span>
            <span>Jarak & Volume Notional</span>
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar pr-1">
            {radar && radar.clusters && radar.clusters.length > 0 ? (
              radar.clusters.map((c, idx) => {
                const isShort = c.side === 'short_liq';
                const col = c.color || (isShort ? palette.bull : palette.bear);
                const isImm = c.isImminent;
                const maxVol = Math.max(...radar.clusters.map((x) => x.estimatedNotionalUsd), 1);
                const volPct = Math.min(100, Math.max(10, (c.estimatedNotionalUsd / maxVol) * 100));

                return (
                  <div 
                    key={idx}
                    style={getSubCardStyle({ isRoseAlert: isImm })}
                    className="p-2 rounded-sm border transition-all flex flex-col gap-1.5 cursor-pointer hover:opacity-90 shadow-sm"
                    onClick={() => onJumpToPrice && onJumpToPrice(c.price)}
                    title={`Klik untuk jump ke level $${formatPrice(c.price)}`}
                  >
                    <div className="flex items-center justify-between text-[9.5px]">
                      <div className="flex items-center gap-2">
                        <span 
                          style={{ backgroundColor: `${col}25`, color: col, border: `1px solid ${col}60` }}
                          className="px-1.5 py-0.5 rounded-sm font-black text-[8.5px]"
                        >
                          {c.leverageTier}
                        </span>
                        <span className="font-bold text-[var(--color-text)]">
                          ${formatPrice(c.price)}
                        </span>
                        <span className="text-[8px] uppercase tracking-wider text-[var(--color-text-muted)]">
                          {isShort ? '💥 Short Squeeze' : '💥 Long Flush'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 font-mono">
                        <span style={{ color: col }} className="font-bold">
                          {formatM(c.estimatedNotionalUsd)}
                        </span>
                        <span className="text-amber-300/90 text-[8.5px] font-bold bg-amber-400/10 px-1 py-0.5 rounded-sm border border-amber-400/20">
                          {c.distanceTicks}T
                        </span>
                        <span className="text-[var(--color-text-muted)] text-[8.5px]">
                          ({c.distancePct >= 0 ? '+' : ''}{c.distancePct.toFixed(2)}% / {c.distanceBps} bps)
                        </span>
                        {isImm && (
                          <span className="px-1 py-0.2 rounded-sm bg-rose-600 text-white font-black text-[7.5px] animate-pulse">
                            IMMINENT
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Proportional Volume Bar */}
                    <div className="w-full bg-[var(--color-panel)]/80 border border-[var(--color-border)] h-1.5 rounded-full overflow-hidden p-0.5 shadow-inner">
                      <div 
                        style={{ width: `${volPct}%` }}
                        className={`h-full rounded-full transition-all duration-300 ${
                          isShort 
                            ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]' 
                            : 'bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                        }`}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-[var(--color-text-muted)] text-[9.5px]">
                Tidak ada klaster likuidasi berisiko tinggi dalam radius saat ini.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: GRAVITY & VPIN TOXICITY ── */}
      {activeTab === 'gravity' && (
        <div className="space-y-3 animate-fadeIn">
          {/* Panduan Radar */}
          <div 
            style={getSubCardStyle()}
            className="p-2 rounded-sm border text-[8.5px] text-[var(--color-text-muted)] leading-relaxed"
          >
            <strong className="text-[var(--color-text)] flex items-center gap-1 mb-1"><Compass size={10} className="text-[var(--color-text-muted)]" /> Petunjuk: Order Book Gravity & VPIN</strong>
            Mengukur massa pasif di Limit Order Book. Bullish/Bearish Magnet mendeteksi tembok order (*Spoofing/Iceberg*) yang menarik harga. VPIN mendeteksi pergerakan diam-diam dari institusi sebelum volatilitas terjadi.
          </div>
          {/* Gravity Magnet Detailed Vector */}
          <div 
            style={getSubCardStyle()}
            className="p-2.5 rounded-sm border space-y-2"
          >
            <div className="flex items-center justify-between text-[9px]">
              <span className="text-[var(--color-text-muted)] uppercase font-bold flex items-center gap-1">
                <Compass size={12} className="text-[var(--color-text-muted)]" />
                Vektor Gravitasi Magnet Order Book (LOB Gravity)
              </span>
              <span style={{ color: magnetColor }} className="font-bold">
                {isBullMagnet ? '▲ PULL UPWARD (BULL)' : isBearMagnet ? '▼ PULL DOWNWARD (BEAR)' : '■ BALANCED'}
              </span>
            </div>

            <div 
              style={getSubCardStyle()}
              className="flex items-center justify-between p-2 rounded-sm border"
            >
              <div>
                <div className="text-[8.5px] text-[var(--color-text-muted)]">TARGET HARGA MAGNET:</div>
                <div style={{ color: magnetColor }} className="text-sm font-black font-mono">
                  {gravity?.magnetPriceFormatted || '—'}
                </div>
              </div>
              <div className="text-right font-mono">
                <div className="text-[8.5px] text-[var(--color-text-muted)]">JARAK TARGET:</div>
                <div className="text-xs font-bold text-[var(--color-text)]">
                  {magnetDistPct >= 0 ? '+' : ''}{magnetDistPct.toFixed(2)}% ({((magnetDistPct * currentPrice) / 100).toFixed(2)} pts)
                </div>
              </div>
            </div>

            {/* Dominant Gravity Clusters */}
            {gravity && (gravity as any).dominantClusters && (gravity as any).dominantClusters.length > 0 && (
              <div className="space-y-1 pt-1">
                <div className="text-[8px] uppercase tracking-wider text-[var(--color-text-muted)] font-bold">Klaster Penarik Terkuat (HVN Walls):</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {(gravity as any).dominantClusters.slice(0, 2).map((gc: any, i: number) => (
                    <div 
                      key={i} 
                      style={getSubCardStyle()}
                      className="p-1.5 rounded-sm border flex items-center justify-between text-[8.5px]"
                    >
                      <span className="text-[var(--color-text)] font-bold">${formatPrice(gc.price)}</span>
                      <span style={{ color: gc.side === 'bid' ? palette.bull : palette.bear }}>
                        {gc.side.toUpperCase()} ({gc.pullWeight.toFixed(0)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* VPIN & OFI Deep Stats */}
          <div className="grid grid-cols-2 gap-2 text-[9px]">
            <div 
              style={getSubCardStyle()}
              className="p-2 rounded-sm border space-y-1"
            >
              <div className="text-[var(--color-text-muted)] font-bold flex items-center justify-between">
                <span>VPIN TOXICITY ENGINE</span>
                <span className={vpin && vpin.vpin >= 60 ? 'text-rose-400 font-bold' : 'text-cyan-300'}>{vpin?.vpin || 32}%</span>
              </div>
              <p className="text-[8px] text-[var(--color-text-muted)] leading-tight">
                {vpin && vpin.vpin >= 60 
                  ? '⚠️ Toksisitas Order Flow tinggi! HFT & Institusi sedang agresif menyapu likuiditas.' 
                  : '🟢 Order Flow normal. Penyediaan limit order stabil tanpa tanda-tanda predatory toxicity.'}
              </p>
            </div>

            <div 
              style={getSubCardStyle()}
              className="p-2 rounded-sm border space-y-1"
            >
              <div className="text-[var(--color-text-muted)] font-bold flex items-center justify-between">
                <span>RESILIENSI LOB & IMPACT</span>
                <span className="text-emerald-400 font-bold">{ofi?.marketResilience || 'Robust'}</span>
              </div>
              <p className="text-[8px] text-[var(--color-text-muted)] leading-tight">
                Koefisien elastisitas Kyle's Lambda menunjukkan pasar memiliki kedalaman institusional yang cukup untuk menyerap volume besar.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: FLASH CRASH & HAWKES ── */}
      {activeTab === 'hawkes' && (
        <div className="space-y-2.5 animate-fadeIn">
          {/* Panduan Radar */}
          <div 
            style={getSubCardStyle()}
            className="p-2 rounded-sm border text-[8.5px] text-[var(--color-text-muted)] leading-relaxed"
          >
            <strong className="text-[var(--color-text)] flex items-center gap-1 mb-1"><Activity size={10} className="text-[var(--color-text-muted)]" /> Petunjuk: Flash-Crash Hawkes Radar</strong>
            Mendeteksi anomali penarikan massal likuiditas (*Liquidity Evaporation*) melalui model matematika *Self-Exciting Hawkes Process*. Jika status menjadi "CRITICAL" atau λ melonjak tajam, waspadai risiko *Flash Crash* (slippage ekstrem) karena *market maker* sedang mencabut *order* mereka.
          </div>
          <div 
            style={getSubCardStyle({ isRoseAlert: hawkes?.hazardLevel.includes('CRITICAL') })}
            className="p-2.5 rounded-sm border space-y-2"
          >
            <div className="flex items-center justify-between text-[9px]">
              <span className="text-[var(--color-text-muted)] uppercase font-bold flex items-center gap-1">
                <Activity size={12} className="text-[var(--color-text-muted)]" />
                Hawkes Self-Exciting Process Early Warning Radar
              </span>
              <span 
                className={`px-1.5 py-0.2 rounded-sm font-bold text-[8.5px] ${
                  hawkes?.hazardLevel.includes('CRITICAL') ? 'bg-rose-950/40 text-rose-400 border border-rose-500/40' : 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/40'
                }`}
              >
                {hawkes?.hazardLevel || 'NORMAL_FLOW'}
              </span>
            </div>

            <div className={`grid ${isSideMode ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-4'} gap-2 text-[9px] text-center pt-1`}>
              <div 
                style={getSubCardStyle()}
                className="p-2 rounded-sm border"
              >
                <div className="text-[var(--color-text-muted)] text-[8px]">ARRIVAL INTENSITY (λ)</div>
                <div className="text-xs font-bold text-[var(--color-text)] mt-0.5">{hawkes?.intensityLambda || 1.15}</div>
              </div>
              <div 
                style={getSubCardStyle()}
                className="p-2 rounded-sm border"
              >
                <div className="text-[var(--color-text-muted)] text-[8px]">BRANCHING RATIO (η)</div>
                <div className="text-xs font-bold text-amber-400 mt-0.5">{hawkes?.branchingRatioEta || 0.42}</div>
              </div>
              <div 
                style={getSubCardStyle()}
                className="p-2 rounded-sm border"
              >
                <div className="text-[var(--color-text-muted)] text-[8px]">CANCEL CHURN (/SEC)</div>
                <div className="text-xs font-bold text-emerald-400 mt-0.5">{hawkes?.cancellationVelocityPerSec || 14}/s</div>
              </div>
              <div 
                style={getSubCardStyle()}
                className="p-2 rounded-sm border"
              >
                <div className="text-[var(--color-text-muted)] text-[8px]">LOB EVAPORATION</div>
                <div className={`text-xs font-bold mt-0.5 ${hawkes && hawkes.liquidityEvaporationPct > 35 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {hawkes?.liquidityEvaporationPct || 8}%
                </div>
              </div>
            </div>

            <div 
              style={getSubCardStyle()}
              className="p-2 rounded-sm border text-[8.5px] text-[var(--color-text-muted)] space-y-1"
            >
              <div className="font-bold text-[var(--color-text)] flex items-center gap-1">
                <Shield size={11} className="text-emerald-400" />
                Penjelasan Kuantitatif Hawkes:
              </div>
              <p>
                Proses Hawkes memodelkan efek penularan transaksi (*self-exciting cascade*). Jika branching ratio (η) mendekati 1.0, eksekusi satu order memicu pembatalan orderbook secara berantai yang memicu *Flash Crash* atau *Liquidity Vacuum*.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: EXECUTION & ARBITRAGE ── */}
      {activeTab === 'execution' && (
        <div className="space-y-2.5 animate-fadeIn">
          {/* Panduan Radar */}
          <div 
            style={getSubCardStyle()}
            className="p-2 rounded-sm border text-[8.5px] text-[var(--color-text-muted)] leading-relaxed"
          >
            <strong className="text-[var(--color-text)] flex items-center gap-1 mb-1"><Target size={10} className="text-[var(--color-text-muted)]" /> Petunjuk: Optimal Execution & Arbitrage</strong>
            Diadaptasi dari algoritma *Almgren-Chriss* untuk menghitung biaya slippage vs risiko volatilitas. Menampilkan konsolidasi kedalaman silang lintas-bursa (BBO) guna menemukan efisiensi rute order (*smart routing*) dan arbitrase latensi mikro.
          </div>
          {/* Almgren-Chriss Optimal Trajectory */}
          {almgren && (
            <div 
              style={getSubCardStyle()}
              className="p-2.5 rounded-sm border space-y-1.5"
            >
              <div className="flex items-center justify-between text-[9px]">
                <span className="text-[var(--color-text-muted)] uppercase font-bold flex items-center gap-1">
                  <Target size={12} className="text-[var(--color-text-muted)]" />
                  Almgren-Chriss Optimal Liquidation Trajectory
                </span>
                <span className="text-emerald-400 font-bold">{formatM(almgren.totalNotionalUsd)} Notional</span>
              </div>
              <div className={`grid ${isSideMode ? 'grid-cols-1' : 'grid-cols-2'} gap-2 text-[9px]`}>
                <div 
                  style={getSubCardStyle()}
                  className="p-1.5 rounded-sm border flex justify-between"
                >
                  <span className="text-[var(--color-text-muted)]">Expected Execution Cost:</span>
                  <span className="font-bold text-amber-400">${almgren.expectedCostUsd}</span>
                </div>
                <div 
                  style={getSubCardStyle()}
                  className="p-1.5 rounded-sm border flex justify-between"
                >
                  <span className="text-[var(--color-text-muted)]">Variance Market Risk:</span>
                  <span className="font-bold text-rose-400">${almgren.varianceRiskUsd}</span>
                </div>
              </div>
            </div>
          )}

          {/* Cross-Exchange Arbitrage & BBO */}
          {matrix && (
            <div 
              style={getSubCardStyle()}
              className="p-2.5 rounded-sm border space-y-1.5"
            >
              <div className="flex items-center justify-between text-[9px]">
                <span className="text-[var(--color-text-muted)] uppercase font-bold flex items-center gap-1">
                  <Scale size={12} className="text-[var(--color-text-muted)]" />
                  Consolidated Cross-Exchange BBO & Latency
                </span>
                <span className="text-emerald-400 font-bold">{matrix.consolidatedSpreadBps} bps Spread</span>
              </div>
              <div 
                style={getSubCardStyle()}
                className="flex items-center justify-between p-2 rounded-sm border text-[9px]"
              >
                <div>
                  <span className="text-[var(--color-text-muted)]">BBO: </span>
                  <span style={{ color: palette.bull }} className="font-bold">${matrix.consolidatedBestBid}</span>
                  <span className="text-[var(--color-text-muted)]"> / </span>
                  <span style={{ color: palette.bear }} className="font-bold">${matrix.consolidatedBestAsk}</span>
                </div>
                <div className="text-right text-emerald-400 font-bold text-[8.5px]">
                  {matrix.bestRoutingRecommendation}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. BOTTOM FOOTER BAR */}
      <div className={`flex ${isSideMode ? 'flex-col items-start gap-1.5' : 'items-center justify-between'} pt-1 border-t border-[var(--color-border)] text-[8.5px] text-[var(--color-text-muted)]`}>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-[var(--color-text)] tracking-wide">𝙈𝙤𝙪𝙣𝙩𝘼𝙡𝙜𝙤 Liquidity Heatmap Radar Bar</span>
          {copiedPrice && (
            <span className="text-emerald-400 font-bold animate-fadeIn">● Disalin ${formatPrice(copiedPrice)}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span>Tick Precision: Level 2 / LOB Depth</span>
        </div>
      </div>
    </div>
  );
});
