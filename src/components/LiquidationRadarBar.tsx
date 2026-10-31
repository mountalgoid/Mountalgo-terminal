import React, { useState, useMemo, useCallback } from 'react';
import { 
  Zap, 
  AlertTriangle, 
  Flame, 
  Maximize2, 
  Minimize2, 
  X, 
  Compass, 
  Target, 
  Scale,
  HelpCircle,
  Activity,
  Layers
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { hexToRgba, getThemeModalGradient, getThemeCardBorder } from '../utils/themeGradient';
import { 
  PreciseHeatmapData,
  LiquidationCascadeCluster,
  HeatmapTimeframeMode,
  ClusterVisualGrade,
  CLUSTER_GRADE_COLORS,
  gradeClusterZone
} from '../utils/liquidityHeatmapEngine';

// [HEATMAP v4 GRADED ZONES] Time-aware visual grade helper
const gradeOf = (c: LiquidationCascadeCluster): ClusterVisualGrade => {
  if (c.visualGrade) return c.visualGrade;
  return gradeClusterZone(c.heatIntensity || 0.3, c.confidence || 60, c.recencyWeight || 0.7);
};

const GRADE_TIER_STYLE: Record<ClusterVisualGrade, string> = {
  S: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-400/50',
  A: 'bg-amber-500/20 text-amber-300 border-amber-400/50',
  B: 'bg-sky-500/20 text-sky-300 border-sky-400/50',
  C: 'bg-slate-500/20 text-slate-300 border-slate-400/50',
};

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
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
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
  const { palette, isLight } = useTheme();

  // Local UI State
  const [localDockPosition, setLocalDockPosition] = useState<RadarDockPosition>('docked-bottom');
  const [activeTab, setActiveTab] = useState<RadarTabType>('unified');
  const [localMinimized, setLocalMinimized] = useState(false);
  const [copiedPrice, setCopiedPrice] = useState<number | null>(null);

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

  const formatM = (usd: number) => `$${(usd / 1e6).toFixed(1)}M`;
  const formatPrice = (p: number) => {
    if (!p) return '0.00';
    return isForex || p < 10 ? p.toFixed(4) : p.toFixed(2);
  };

  const getSubCardStyle = useCallback((options?: { isAmberAlert?: boolean; isRoseAlert?: boolean }) => {
    const [darkR, darkG, darkB] = hexToRgbTuple(
      palette.dark && palette.dark !== '#000000' && palette.dark !== '#ffffff' ? palette.dark : '#060913',
      [6, 9, 19]
    );

    let borderCol = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.07)';
    let bg = '';

    if (options?.isRoseAlert) {
      borderCol = isLight ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.3)';
      bg = isLight 
        ? 'linear-gradient(135deg, rgba(254, 242, 242, 0.90) 0%, rgba(255, 255, 255, 0.95) 100%)'
        : 'linear-gradient(135deg, rgba(159, 18, 57, 0.25) 0%, rgba(15, 23, 42, 0.45) 100%)';
    } else if (options?.isAmberAlert) {
      borderCol = isLight ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.3)';
      bg = isLight
        ? 'linear-gradient(135deg, rgba(254, 252, 232, 0.90) 0%, rgba(255, 255, 255, 0.95) 100%)'
        : 'linear-gradient(135deg, rgba(120, 85, 0, 0.22) 0%, rgba(15, 23, 42, 0.45) 100%)';
    } else {
      bg = isLight
        ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(241, 245, 249, 0.75) 100%)'
        : `linear-gradient(135deg, rgba(${darkR + 4}, ${darkG + 6}, ${darkB + 10}, 0.6) 0%, rgba(11, 15, 26, 0.5) 100%)`;
    }

    return {
      background: bg,
      borderColor: borderCol,
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
    };
  }, [palette, isLight]);

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
  const hazardLabel = isHighHazard ? 'CASCADE HAZARD' : isModerateHazard ? 'MODERATE' : 'STABLE';

  // Gravity Magnet Info
  const isBullMagnet = gravity?.dominantSide === 'bullish_magnet';
  const isBearMagnet = gravity?.dominantSide === 'bearish_magnet';
  const magnetColor = isBullMagnet ? palette.bull : isBearMagnet ? palette.bear : (palette.poc || '#eab308');
  const magnetPullPct = gravity ? Math.round(Math.abs(gravity.netImbalanceRatio) * 100) : 0;
  const magnetDistPct = gravity?.pullDistancePct ?? 0;

  // ---------------------------------------------------------------------------
  // MINIMIZED VIEW: Clean, single button docked neatly on chart toolbar
  // ---------------------------------------------------------------------------
  if (activeMinimized) {
    return (
      <button 
        onClick={(e) => { e.stopPropagation(); setActiveMinimized(false); }}
        className={`h-7 px-2.5 rounded-lg border shadow-xl backdrop-blur-xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all cursor-pointer select-none ${
          isLight ? 'bg-white/95 border-zinc-200 text-zinc-800' : 'bg-[var(--color-panel)]/95 border-[var(--color-border)] text-white'
        }`}
        style={{ borderColor: hexToRgba(hazardColor, 0.5) }}
        title="Buka Liquidation Heatmap Radar"
      >
        <Flame size={13} style={{ color: hazardColor }} />
        <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Heatmap</span>
        <span 
          className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-sm"
          style={{ backgroundColor: `${hazardColor}20`, color: hazardColor }}
        >
          {hazardScore}
        </span>
        <span className="text-[9px] text-[var(--color-text-muted)] font-mono hidden sm:inline">
          {formatCompactUSD(totalLiqUsd)}
        </span>
        <Maximize2 size={10} className="opacity-50 ml-0.5" />
      </button>
    );
  }

  // Position CSS mapping for floating mode if not docked
  const positionClasses = {
    'bottom-left': 'bottom-12 left-4 max-w-[620px]',
    'bottom-right': 'bottom-12 right-16 max-w-[620px]',
    'top-left': 'top-14 left-4 max-w-[620px]',
    'top-right': 'top-14 right-16 max-w-[620px]',
    'docked-bottom': 'bottom-0 left-0 right-0 max-w-full rounded-none border-x-0 border-b-0',
    'side-left': 'top-0 left-0 bottom-0 w-[320px] rounded-none border-y-0 border-l-0',
    'side-right': 'top-0 right-0 bottom-0 w-[320px] rounded-none border-y-0 border-r-0',
  }[activeDockPosition];

  // ---------------------------------------------------------------------------
  // FULL EXPANDED VIEW: Streamlined, high-density institutional HUD
  // ---------------------------------------------------------------------------
  return (
    <div 
      style={{
        background: getThemeModalGradient(palette, isLight),
        borderColor: getThemeCardBorder(palette, false),
      }}
      className={`${
        isReallySeparate 
          ? `${activeDockPosition.startsWith('side') ? 'w-[320px] h-full overflow-y-auto' : 'w-full'} border` 
          : `absolute ${positionClasses} z-[35] max-w-full border shadow-2xl`
      } rounded-xl font-mono text-[10px] text-[var(--color-text)] select-none transition-all duration-150 backdrop-blur-2xl p-2.5 relative overflow-hidden flex flex-col max-h-[250px]`}
    >
      {/* Top Accent Line */}
      <div 
        className="h-[2px] w-full -mx-2.5 -mt-2.5 mb-2 shrink-0"
        style={{
          background: `linear-gradient(90deg, ${palette.bull} 0%, ${palette.poc || '#6366f1'} 50%, ${palette.bear} 100%)`
        }}
      />

      {/* 1. COMPACT HEADER BAR */}
      <div className={`flex flex-wrap ${isSideMode ? 'flex-col items-start gap-1.5' : 'items-center justify-between gap-1.5'} border-b border-[var(--color-border)] pb-1.5 shrink-0`}>
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <div className="p-1 rounded bg-[var(--color-panel)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
            <Flame size={12} style={{ color: hazardColor }} />
          </div>
          <span className="font-bold text-[11px] tracking-wider text-[var(--color-text)]">LIQUIDITY HEATMAP</span>
          
          {/* Status Badge */}
          <span 
            className="text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider"
            style={{ backgroundColor: `${hazardColor}20`, color: hazardColor, border: `1px solid ${hazardColor}40` }}
          >
            {hazardLabel} {hazardScore}
          </span>

          <span className="text-[9px] text-[var(--color-text-muted)] font-mono">
            {symbol} <strong className="text-[var(--color-text)]">${formatPrice(currentPrice)}</strong>
          </span>

          {/* Timeframe Mode Selector */}
          {onSelectTimeframeMode && (
            <div className="flex items-center gap-0.5 border border-[var(--color-border)] rounded p-0.5 bg-[var(--color-panel)]/80 ml-1">
              {[
                { id: 'tick', label: '1T' },
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
                      backgroundColor: palette.poc || palette.bull,
                      color: '#000000',
                    } : {}}
                    className={`h-5 text-[8px] px-1.5 rounded font-mono font-bold transition-all cursor-pointer ${
                      isActive ? 'font-black' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                    }`}
                  >
                    {tf.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          {/* Dock Position Switcher */}
          <div className="flex items-center border border-[var(--color-border)] rounded p-0.5 bg-[var(--color-panel)]/80 text-[8px]">
            <button 
              onClick={() => setActiveDockPosition('docked-bottom')} 
              className={`h-5 px-1.5 rounded font-bold cursor-pointer transition-colors ${activeDockPosition === 'docked-bottom' ? 'bg-zinc-100 text-zinc-950 font-black' : 'text-[var(--color-text-muted)] hover:text-white'}`} 
              title="Dock Bawah"
            >
              Bawah
            </button>
            <button 
              onClick={() => setActiveDockPosition('side-left')} 
              className={`h-5 px-1.5 rounded font-bold cursor-pointer transition-colors ${activeDockPosition === 'side-left' ? 'bg-zinc-100 text-zinc-950 font-black' : 'text-[var(--color-text-muted)] hover:text-white'}`} 
              title="Dock Kiri"
            >
              Kiri
            </button>
            <button 
              onClick={() => setActiveDockPosition('side-right')} 
              className={`h-5 px-1.5 rounded font-bold cursor-pointer transition-colors ${activeDockPosition === 'side-right' ? 'bg-zinc-100 text-zinc-950 font-black' : 'text-[var(--color-text-muted)] hover:text-white'}`} 
              title="Dock Kanan"
            >
              Kanan
            </button>
          </div>

          {onOpenGuide && (
            <button
              onClick={onOpenGuide}
              className="h-5 px-1.5 rounded bg-[var(--color-panel)] hover:bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:text-white border border-[var(--color-border)] transition-colors flex items-center gap-1 cursor-pointer font-bold text-[8px]"
              title="Panduan Heatmap"
            >
              <HelpCircle size={10} />
              <span className="hidden sm:inline">Panduan</span>
            </button>
          )}

          <button
            onClick={() => setActiveMinimized(true)}
            className="h-5 px-1.5 rounded bg-[var(--color-panel)] hover:bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:text-white border border-[var(--color-border)] transition-colors flex items-center justify-center cursor-pointer font-bold"
            title="Minimize ke Toolbar"
          >
            <Minimize2 size={10} />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="h-5 px-1.5 rounded bg-[var(--color-panel)] hover:bg-rose-500/20 text-[var(--color-text-muted)] hover:text-rose-400 border border-[var(--color-border)] transition-colors flex items-center justify-center cursor-pointer font-bold"
              title="Tutup Radar"
            >
              <X size={10} />
            </button>
          )}
        </div>
      </div>

      {/* 2. TAB SELECTOR BAR */}
      <div className="flex items-center gap-1 py-1 overflow-x-auto no-scrollbar shrink-0">
        {[
          { id: 'unified' as const, label: 'Overview' },
          { id: 'liquidation' as const, label: `Pools (${radar?.clusters?.length || 0})` },
          { id: 'gravity' as const, label: 'Magnet & VPIN' },
          { id: 'hawkes' as const, label: 'Hawkes' },
          { id: 'execution' as const, label: 'Execution & Arb' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`h-5 px-2 rounded text-[8.5px] font-bold cursor-pointer transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-zinc-100 text-zinc-950 font-black shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-panel)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. SCROLLABLE TAB CONTENT AREA */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-0.5 space-y-2 mt-0.5">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'unified' && (
          <div className="space-y-1.5">
            {/* Split Liquidation Bar */}
            <div style={getSubCardStyle()} className="p-1.5 rounded border space-y-1">
              <div className="flex items-center justify-between text-[8.5px] flex-wrap">
                <span className="text-[var(--color-text-muted)]">
                  Total Notional: <strong className="text-[var(--color-text)]">{formatCompactUSD(totalLiqUsd)}</strong>
                </span>
                <div className="flex items-center gap-2 font-bold">
                  <span style={{ color: palette.bull }}>LONG {longLiqPct.toFixed(0)}% ({formatCompactUSD(totalLongLiq)})</span>
                  <span className="text-zinc-600">|</span>
                  <span style={{ color: palette.bear }}>SHORT {shortLiqPct.toFixed(0)}% ({formatCompactUSD(totalShortLiq)})</span>
                </div>
              </div>

              {/* Progress Split */}
              <div className="w-full h-2 bg-[var(--color-panel)] rounded-sm overflow-hidden flex border border-[var(--color-border)]">
                <div 
                  style={{ width: `${longLiqPct}%`, backgroundColor: palette.bull }}
                  className="h-full transition-all duration-500"
                />
                <div 
                  style={{ width: `${shortLiqPct}%`, backgroundColor: palette.bear }}
                  className="h-full transition-all duration-500"
                />
              </div>

              {/* Imminent alert or Safe zone */}
              {radar?.imminentCluster ? (
                <div 
                  style={getSubCardStyle({ isRoseAlert: true })}
                  className="flex items-center justify-between border p-1 rounded text-[8.5px]"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <AlertTriangle size={11} className="text-rose-400 shrink-0" />
                    <span className="font-bold text-rose-300 truncate">
                      Kritis: {radar.imminentCluster.leverageTier} {radar.imminentCluster.side === 'short_liq' ? 'Short' : 'Long'} @ ${formatPrice(radar.imminentCluster.price)}
                    </span>
                    <span className="text-amber-300 font-mono">({radar.imminentCluster.distanceTicks}T / {radar.imminentCluster.distanceBps} bps)</span>
                  </div>
                  {onJumpToPrice && (
                    <button
                      onClick={() => onJumpToPrice(radar.imminentCluster!.price)}
                      className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded text-[7.5px] cursor-pointer shrink-0"
                    >
                      Lihat Chart
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-[8px] text-[var(--color-text-muted)] flex items-center justify-between px-1">
                  <span>{radar?.summary || 'Struktur likuidasi seimbang & stabil'}</span>
                  <span className="text-emerald-400 font-bold">🟢 Zona Aman</span>
                </div>
              )}
            </div>

            {/* 4 Pillars Grid */}
            <div className={`grid ${isSideMode ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'} gap-1.5 text-[8.5px]`}>
              {/* Pillar 1: Magnet */}
              <div style={getSubCardStyle()} className="p-1.5 rounded border">
                <div className="flex items-center justify-between text-[7.5px] text-[var(--color-text-muted)] font-bold">
                  <span>🧲 MAGNET</span>
                  <span style={{ color: magnetColor }}>{isBullMagnet ? '▲ BULL' : isBearMagnet ? '▼ BEAR' : '■ MID'}</span>
                </div>
                <div style={{ color: magnetColor }} className="text-[11px] font-black my-0.5 font-mono">
                  {gravity?.magnetPriceFormatted || '—'}
                </div>
                <div className="text-[7.5px] text-[var(--color-text-muted)] flex justify-between">
                  <span>Pull:</span>
                  <span className="font-bold text-[var(--color-text)]">{magnetPullPct}%</span>
                </div>
                <div className="w-full bg-[var(--color-panel)] h-1 rounded overflow-hidden mt-1">
                  <div style={{ width: `${Math.min(100, magnetPullPct)}%` }} className="h-full bg-cyan-400" />
                </div>
              </div>

              {/* Pillar 2: VPIN */}
              <div style={getSubCardStyle()} className="p-1.5 rounded border">
                <div className="flex items-center justify-between text-[7.5px] text-[var(--color-text-muted)] font-bold">
                  <span>🧪 VPIN</span>
                  <span className={vpin && vpin.vpin >= 60 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                    {vpin && vpin.vpin >= 60 ? 'TOXIC' : 'NORMAL'}
                  </span>
                </div>
                <div className={`text-[11px] font-black my-0.5 font-mono ${vpin && vpin.vpin >= 60 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {vpin ? `${vpin.vpin}%` : '32%'}
                </div>
                <div className="text-[7.5px] text-[var(--color-text-muted)] flex justify-between">
                  <span>Refill:</span>
                  <span className="font-bold text-[var(--color-text)]">{vpin ? `${vpin.replenishmentVelocityMs}ms` : '180ms'}</span>
                </div>
                <div className="w-full bg-[var(--color-panel)] h-1 rounded overflow-hidden mt-1">
                  <div style={{ width: `${vpin ? vpin.vpin : 32}%` }} className={`h-full ${vpin && vpin.vpin >= 60 ? 'bg-rose-500' : 'bg-emerald-400'}`} />
                </div>
              </div>

              {/* Pillar 3: OFI */}
              <div style={getSubCardStyle()} className="p-1.5 rounded border">
                <div className="flex items-center justify-between text-[7.5px] text-[var(--color-text-muted)] font-bold">
                  <span>⚖️ OFI</span>
                  <span className={ofi && ofi.ofiRatio > 0 ? 'text-emerald-400' : ofi && ofi.ofiRatio < 0 ? 'text-rose-400' : 'text-[var(--color-text-muted)]'}>
                    {ofi && ofi.ofiRatio > 0 ? '+BUY' : ofi && ofi.ofiRatio < 0 ? '-SELL' : '0.0'}
                  </span>
                </div>
                <div className={`text-[11px] font-black my-0.5 font-mono ${ofi && ofi.ofiRatio > 0 ? 'text-emerald-400' : ofi && ofi.ofiRatio < 0 ? 'text-rose-400' : 'text-[var(--color-text)]'}`}>
                  {ofi ? `${ofi.ofiRatio > 0 ? '+' : ''}${ofi.ofiRatio}` : '+0.24'}
                </div>
                <div className="text-[7.5px] text-[var(--color-text-muted)] flex justify-between">
                  <span>Kyle's λ:</span>
                  <span className="font-bold text-[var(--color-text)]">{ofi ? (ofi.kylesLambdaAvg * 1e4).toFixed(1) : '2.1'}e-4</span>
                </div>
                <div className="w-full bg-[var(--color-panel)] h-1 rounded overflow-hidden mt-1">
                  <div style={{ width: `${Math.min(100, Math.abs(ofi?.ofiRatio || 0.2) * 100)}%` }} className={`h-full ${(ofi?.ofiRatio || 0) >= 0 ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                </div>
              </div>

              {/* Pillar 4: Hawkes */}
              <div style={getSubCardStyle()} className="p-1.5 rounded border">
                <div className="flex items-center justify-between text-[7.5px] text-[var(--color-text-muted)] font-bold">
                  <span>⚡ HAWKES</span>
                  <span className={hawkes?.hazardLevel.includes('CRITICAL') ? 'text-rose-400 font-bold' : hawkes?.hazardLevel.includes('ELEVATED') ? 'text-amber-400' : 'text-emerald-400'}>
                    {hawkes?.hazardLevel ? hawkes.hazardLevel.split('_')[0] : 'NORMAL'}
                  </span>
                </div>
                <div className={`text-[11px] font-black my-0.5 font-mono ${hawkes?.hazardLevel.includes('CRITICAL') ? 'text-rose-400' : hawkes?.hazardLevel.includes('ELEVATED') ? 'text-amber-400' : 'text-emerald-400'}`}>
                  λ: {hawkes ? hawkes.intensityLambda : '1.15'}
                </div>
                <div className="text-[7.5px] text-[var(--color-text-muted)] flex justify-between">
                  <span>Evap:</span>
                  <span className="font-bold text-[var(--color-text)]">{hawkes ? `${hawkes.liquidityEvaporationPct}%` : '8%'}</span>
                </div>
                <div className="w-full bg-[var(--color-panel)] h-1 rounded overflow-hidden mt-1">
                  <div style={{ width: `${hawkes ? Math.min(100, hawkes.liquidityEvaporationPct) : 8}%` }} className={`h-full ${hawkes?.hazardLevel.includes('CRITICAL') ? 'bg-rose-500' : 'bg-emerald-400'}`} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LIQUIDATION POOLS */}
        {activeTab === 'liquidation' && (
          <div className="space-y-1.5">
            {/* Precision Meta Strip */}
            {radar && (
              <div style={getSubCardStyle()} className="p-1.5 rounded border space-y-1">
                <div className="flex items-center justify-between text-[7.5px] text-[var(--color-text-muted)] font-mono flex-wrap gap-1">
                  <span>RV {radar.relVolume?.toFixed(2)} · ATR {radar.atrPct?.toFixed(2)}% · OCR {radar.maxOcrTicks ?? 0}T</span>
                  <span>Pivot ST ${formatPrice(radar.pivotsUsed?.shortTerm ?? 0)} · MT ${formatPrice(radar.pivotsUsed?.mediumTerm ?? 0)}</span>
                </div>

                {/* Grade Counts */}
                {radar.gradeCounts && (
                  <div className="flex items-center gap-1 flex-wrap">
                    {(['S', 'A', 'B', 'C'] as ClusterVisualGrade[]).map((g) => {
                      const count = radar.gradeCounts?.[g] ?? 0;
                      const gColor = CLUSTER_GRADE_COLORS[g];
                      return (
                        <div
                          key={g}
                          style={{
                            borderColor: count > 0 ? `${gColor}50` : 'var(--color-border)',
                            backgroundColor: count > 0 ? `${gColor}12` : 'transparent',
                          }}
                          className={`flex items-center gap-1 rounded px-1 py-0.2 text-[7.5px] font-mono border ${count > 0 ? 'opacity-100' : 'opacity-40'}`}
                        >
                          <span className="font-black" style={{ color: gColor }}>{g}</span>
                          <span className="text-[var(--color-text-muted)]">×{count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Clusters List */}
            <div className="space-y-1">
              {radar && radar.clusters && radar.clusters.length > 0 ? (
                radar.clusters.map((c, idx) => {
                  const isShort = c.side === 'short_liq';
                  const col = c.color || (isShort ? palette.bull : palette.bear);
                  const isImm = c.isImminent;
                  const maxVol = Math.max(...radar.clusters.map((x) => x.estimatedNotionalUsd), 1);
                  const volPct = Math.min(100, Math.max(10, (c.estimatedNotionalUsd / maxVol) * 100));
                  const vGrade = gradeOf(c);
                  const vGradeColor = c.gradeColor || CLUSTER_GRADE_COLORS[vGrade];

                  return (
                    <div 
                      key={idx}
                      style={getSubCardStyle({ isRoseAlert: isImm })}
                      className="p-1.5 rounded border transition-all flex flex-col gap-1 cursor-pointer hover:border-zinc-400"
                      onClick={() => onJumpToPrice && onJumpToPrice(c.price)}
                      title={`Klik untuk zoom ke level $${formatPrice(c.price)}`}
                    >
                      <div className="flex items-center justify-between text-[8.5px]">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span 
                            style={{ backgroundColor: `${col}20`, color: col, border: `1px solid ${col}50` }}
                            className="px-1 py-0.2 rounded font-black text-[7.5px]"
                          >
                            {c.leverageTier}
                          </span>
                          <span className="font-bold text-[var(--color-text)]">
                            ${formatPrice(c.price)}
                          </span>
                          <span 
                            style={{ borderColor: `${vGradeColor}50`, color: vGradeColor }}
                            className={`px-1 py-0.2 rounded font-black text-[7.5px] border ${GRADE_TIER_STYLE[vGrade]}`}
                          >
                            {vGrade}
                          </span>
                          <span className="text-[7.5px] text-[var(--color-text-muted)] truncate hidden sm:inline">
                            {isShort ? 'Short Squeeze' : 'Long Flush'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 font-mono shrink-0">
                          <span style={{ color: col }} className="font-bold">
                            {formatM(c.estimatedNotionalUsd)}
                          </span>
                          <span className="text-amber-300 text-[8px] bg-amber-400/10 px-1 py-0.2 rounded border border-amber-400/20">
                            {c.distanceTicks}T
                          </span>
                          <span className="text-[var(--color-text-muted)] text-[7.5px]">
                            ({c.distancePct >= 0 ? '+' : ''}{c.distancePct.toFixed(2)}%)
                          </span>
                          {isImm && (
                            <span className="px-1 py-0.2 rounded bg-rose-600 text-white font-black text-[7px]">
                              IMM
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Micro info strip & volume bar */}
                      <div className="flex items-center gap-1 text-[7px] text-[var(--color-text-muted)]">
                        <span>conf {c.confidence ?? 60}%</span>
                        <span>·</span>
                        <span>OCR {c.liquidationBufferTicks ?? 2}T</span>
                        <span>·</span>
                        <span>umur {c.clusterAgeBars ?? 0}b</span>
                        <div className="flex-1 bg-[var(--color-panel)] h-1 rounded overflow-hidden ml-1">
                          <div style={{ width: `${volPct}%` }} className={`h-full ${isShort ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-[var(--color-text-muted)] text-[8.5px]">
                  Tidak ada klaster likuidasi terdeteksi dalam jangkauan chart.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: GRAVITY & VPIN */}
        {activeTab === 'gravity' && (
          <div className="space-y-1.5 text-[8.5px]">
            <div style={getSubCardStyle()} className="p-1.5 rounded border space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-text-muted)] font-bold flex items-center gap-1">
                  <Compass size={11} /> LOB Gravity Vector
                </span>
                <span style={{ color: magnetColor }} className="font-bold">
                  {isBullMagnet ? '▲ PULL UPWARD' : isBearMagnet ? '▼ PULL DOWNWARD' : '■ BALANCED'}
                </span>
              </div>
              <div className="flex items-center justify-between p-1 rounded bg-[var(--color-panel)]/50">
                <div>
                  <div className="text-[7.5px] text-[var(--color-text-muted)]">TARGET MAGNET:</div>
                  <div style={{ color: magnetColor }} className="text-xs font-black font-mono">
                    {gravity?.magnetPriceFormatted || '—'}
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-[7.5px] text-[var(--color-text-muted)]">JARAK:</div>
                  <div className="text-[9px] font-bold text-[var(--color-text)]">
                    {magnetDistPct >= 0 ? '+' : ''}{magnetDistPct.toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <div style={getSubCardStyle()} className="p-1.5 rounded border space-y-0.5">
                <div className="text-[var(--color-text-muted)] font-bold flex justify-between">
                  <span>VPIN TOXICITY</span>
                  <span className={vpin && vpin.vpin >= 60 ? 'text-rose-400 font-bold' : 'text-cyan-300'}>{vpin?.vpin || 32}%</span>
                </div>
                <p className="text-[7.5px] text-[var(--color-text-muted)] leading-tight">
                  {vpin && vpin.vpin >= 60 ? 'Toksisitas tinggi (predatory flow)' : 'Order flow normal dan stabil'}
                </p>
              </div>

              <div style={getSubCardStyle()} className="p-1.5 rounded border space-y-0.5">
                <div className="text-[var(--color-text-muted)] font-bold flex justify-between">
                  <span>RESILIENSI LOB</span>
                  <span className="text-emerald-400 font-bold">{ofi?.marketResilience || 'Robust'}</span>
                </div>
                <p className="text-[7.5px] text-[var(--color-text-muted)] leading-tight">
                  Kyle's λ: {ofi ? (ofi.kylesLambdaAvg * 1e4).toFixed(1) : '2.1'}e-4
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: HAWKES CRASH */}
        {activeTab === 'hawkes' && (
          <div className="space-y-1.5 text-[8.5px]">
            <div style={getSubCardStyle()} className="p-1.5 rounded border space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-text-muted)] font-bold flex items-center gap-1">
                  <Activity size={11} /> Hawkes Process Early Warning
                </span>
                <span className={`px-1 rounded text-[7.5px] font-bold ${hawkes?.hazardLevel.includes('CRITICAL') ? 'text-rose-400 bg-rose-950/40' : 'text-emerald-400 bg-emerald-950/40'}`}>
                  {hawkes?.hazardLevel || 'NORMAL_FLOW'}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1 text-center pt-0.5">
                <div style={getSubCardStyle()} className="p-1 rounded border">
                  <div className="text-[7px] text-[var(--color-text-muted)]">ARRIVAL (λ)</div>
                  <div className="font-bold text-[var(--color-text)]">{hawkes?.intensityLambda || 1.15}</div>
                </div>
                <div style={getSubCardStyle()} className="p-1 rounded border">
                  <div className="text-[7px] text-[var(--color-text-muted)]">BRANCH (η)</div>
                  <div className="font-bold text-amber-400">{hawkes?.branchingRatioEta || 0.42}</div>
                </div>
                <div style={getSubCardStyle()} className="p-1 rounded border">
                  <div className="text-[7px] text-[var(--color-text-muted)]">CHURN (/S)</div>
                  <div className="font-bold text-emerald-400">{hawkes?.cancellationVelocityPerSec || 14}/s</div>
                </div>
                <div style={getSubCardStyle()} className="p-1 rounded border">
                  <div className="text-[7px] text-[var(--color-text-muted)]">EVAPORATION</div>
                  <div className={`font-bold ${hawkes && hawkes.liquidityEvaporationPct > 35 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {hawkes?.liquidityEvaporationPct || 8}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: EXECUTION & ARBITRAGE */}
        {activeTab === 'execution' && (
          <div className="space-y-1.5 text-[8.5px]">
            {almgren && (
              <div style={getSubCardStyle()} className="p-1.5 rounded border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-text-muted)] font-bold flex items-center gap-1">
                    <Target size={11} /> Almgren-Chriss Trajectory
                  </span>
                  <span className="text-emerald-400 font-bold">{formatM(almgren.totalNotionalUsd)}</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[8px]">
                  <div className="flex justify-between p-1 rounded bg-[var(--color-panel)]/50">
                    <span className="text-[var(--color-text-muted)]">Expected Cost:</span>
                    <span className="font-bold text-amber-400">${almgren.expectedCostUsd}</span>
                  </div>
                  <div className="flex justify-between p-1 rounded bg-[var(--color-panel)]/50">
                    <span className="text-[var(--color-text-muted)]">Market Risk:</span>
                    <span className="font-bold text-rose-400">${almgren.varianceRiskUsd}</span>
                  </div>
                </div>
              </div>
            )}

            {matrix && (
              <div style={getSubCardStyle()} className="p-1.5 rounded border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-text-muted)] font-bold flex items-center gap-1">
                    <Scale size={11} /> Cross-Exchange BBO
                  </span>
                  <span className="text-emerald-400 font-bold">{matrix.consolidatedSpreadBps} bps Spread</span>
                </div>
                <div className="flex items-center justify-between p-1 rounded bg-[var(--color-panel)]/50 text-[8px]">
                  <div>
                    <span style={{ color: palette.bull }}>${matrix.consolidatedBestBid}</span>
                    <span className="text-[var(--color-text-muted)]"> / </span>
                    <span style={{ color: palette.bear }}>${matrix.consolidatedBestAsk}</span>
                  </div>
                  <div className="text-emerald-400 font-bold">
                    {matrix.bestRoutingRecommendation}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
