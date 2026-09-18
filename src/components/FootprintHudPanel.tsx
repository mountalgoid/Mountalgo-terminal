import React, { useState } from 'react';
import { 
  BarChart3, 
  PieChart, 
  LineChart, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Layers, 
  Maximize2, 
  Minimize2,
  Zap,
  Info
} from 'lucide-react';
import { FootprintCandleData, formatVol } from '../utils/footprints';
import { useTheme } from '../context/ThemeContext';
import { 
  hexToRgba, 
  getThemeModalGradient, 
  getThemeCardBorder, 
  getThemeCardGradient, 
  getThemeCardBoxShadow 
} from '../utils/themeGradient';

interface FootprintHudPanelProps {
  footprintData: FootprintCandleData[];
  symbol: string;
  timeframe: string;
  position?: 'bottom' | 'left' | 'right';
  onPositionChange?: (pos: 'bottom' | 'left' | 'right') => void;
  onClose?: () => void;
}

const FootprintHudPanel = React.memo(function FootprintHudPanel({
  footprintData,
  symbol,
  timeframe,
  position = 'bottom',
  onPositionChange,
  onClose
}: FootprintHudPanelProps) {
  const { palette, isLight } = useTheme();
  const [activeTab, setActiveTab] = useState<'all' | 'charts' | 'distribution'>('all');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [panelWidth, setPanelWidth] = useState<'narrow' | 'medium' | 'wide'>('narrow');

  if (!footprintData || footprintData.length === 0) {
    return null;
  }

  // Get recent footprint candles (last 12 bars)
  const recentBars = footprintData.slice(-12);
  const currentBar = footprintData[footprintData.length - 1];

  // Aggregate stats
  const totalBuyVol = recentBars.reduce((acc, b) => acc + (b.totalVolume + b.delta) / 2, 0);
  const totalSellVol = recentBars.reduce((acc, b) => acc + (b.totalVolume - b.delta) / 2, 0);
  const aggregateVol = totalBuyVol + totalSellVol;
  const buyPct = aggregateVol > 0 ? (totalBuyVol / aggregateVol) * 100 : 50;
  const sellPct = 100 - buyPct;

  const currentDelta = currentBar ? currentBar.delta : 0;
  const currentVol = currentBar ? currentBar.totalVolume : 1;
  const currentCvd = currentBar ? currentBar.cumulativeDelta : 0;
  const currentPoc = currentBar ? currentBar.pocPrice : 0;
  const currentVah = currentBar ? currentBar.vahPrice : 0;
  const currentVal = currentBar ? currentBar.valPrice : 0;

  // Institutional VPIN Toxicity & Velocity
  const totalAbsDelta = recentBars.reduce((acc, b) => acc + Math.abs(b.delta), 0);
  const vpinPct = aggregateVol > 0 ? Math.min(98, Math.max(15, Math.round((totalAbsDelta / aggregateVol) * 100))) : 45;
  const isToxic = vpinPct >= 62;
  const hftRefillMs = Math.round(90 + (100 - vpinPct) * 2.5);

  // Institutional Logic
  const absorptionSignal = currentBar?.divergenceType;
  const imbalanceSignal = (currentBar?.stackedBuyZones.length || 0) > 0 || (currentBar?.stackedSellZones.length || 0) > 0;
  const trappedSignal = currentBar?.trappedTradersSignal;

  // Max values for chart scaling
  const maxBarVol = Math.max(...recentBars.map(b => b.totalVolume), 1);

  const isVertical = position === 'left' || position === 'right';

  // Width class mapping for vertical mode
  const widthClass = panelWidth === 'narrow' ? 'w-80 sm:w-88 md:w-96' : panelWidth === 'medium' ? 'w-96 sm:w-[420px] md:w-[460px]' : 'w-[420px] sm:w-[480px] md:w-[540px]';

  // Minimized Compact Bar View
  if (isMinimized) {
    // Vertical side dock minimized state (Left or Right)
    if (position === 'left' || position === 'right') {
      return (
        <div 
          style={{
            background: getThemeModalGradient(palette, isLight),
            borderColor: getThemeCardBorder(palette, false)
          }}
          className={`backdrop-blur-2xl text-[var(--color-text)] font-sans text-xs select-none shadow-2xl flex flex-col items-center justify-between py-2.5 px-1 z-20 shrink-0 ${
            position === 'left' ? 'border-r w-11 sm:w-12 h-full' : 'border-l w-11 sm:w-12 h-full'
          }`}
        >
          {/* Top Control */}
          <div className="flex flex-col items-center gap-2 font-mono text-[10px]">
            <button
              onClick={() => setIsMinimized(false)}
              style={{ color: palette.poc }}
              className="p-1.5 bg-[var(--color-input-bg)] border border-[var(--color-input-border)] hover:border-cyan-400 rounded-lg cursor-pointer transition-all hover:scale-110 shadow-sm"
              title="Buka / Expand Footprint HUD"
            >
              <Maximize2 size={13} />
            </button>

            <div 
              style={{ backgroundColor: `${palette.bull}25`, borderColor: palette.bull, color: palette.bull }}
              className="p-1.5 rounded-lg border flex items-center justify-center shadow-sm"
              title="Footprint HUD Minimized"
            >
              <BarChart3 size={13} />
            </div>

            <div className="[writing-mode:vertical-lr] rotate-180 uppercase tracking-widest font-extrabold text-[var(--color-text-muted)] text-[9px] my-2 select-none">
              FOOTPRINT
            </div>
          </div>

          {/* Center Vertical Compact Metrics */}
          <div className="flex flex-col items-center gap-3 font-mono text-[9px]">
            <div className="flex flex-col items-center text-center" title={`Volume Total: ${formatVol(currentVol)}`}>
              <span className="text-[7.5px] text-[var(--color-text-muted)] font-bold uppercase tracking-tighter">VOL</span>
              <span className="text-[var(--color-text)] font-bold">{formatVol(currentVol)}</span>
            </div>

            <div className="flex flex-col items-center text-center" title={`Delta: ${currentDelta >= 0 ? '+' : ''}${formatVol(currentDelta)}`}>
              <span className="text-[7.5px] text-[var(--color-text-muted)] font-bold uppercase tracking-tighter">DLT</span>
              <span className="font-bold font-mono" style={{ color: currentDelta >= 0 ? palette.bull : palette.bear }}>
                {currentDelta >= 0 ? '+' : ''}{formatVol(currentDelta)}
              </span>
            </div>

            <div className="flex flex-col items-center text-center hidden sm:flex" title={`CVD: ${currentCvd >= 0 ? '+' : ''}${formatVol(currentCvd)}`}>
              <span className="text-[7.5px] text-[var(--color-text-muted)] font-bold uppercase tracking-tighter">CVD</span>
              <span className="text-sky-400 font-bold">
                {currentCvd >= 0 ? '+' : ''}{formatVol(currentCvd)}
              </span>
            </div>
          </div>

          {/* Bottom Expand Label */}
          <button
            onClick={() => setIsMinimized(false)}
            style={{ color: palette.poc }}
            className="text-[9px] font-mono hover:opacity-80 cursor-pointer [writing-mode:vertical-lr] rotate-180 font-bold py-1 transition-colors uppercase tracking-wider"
            title="Klik untuk membuka Footprint HUD"
          >
            BUKA HUD
          </button>
        </div>
      );
    }

    // Horizontal top or bottom minimized state
    return (
      <div 
        style={{
          background: getThemeModalGradient(palette, isLight),
          borderColor: getThemeCardBorder(palette, false)
        }}
        className={`backdrop-blur-2xl text-[var(--color-text)] font-sans text-xs select-none shadow-2xl flex items-center justify-between px-3 py-1.5 chart-layer-indicators-hud ${
          position === 'bottom' ? 'border-t w-full' : 'border-b w-full'
        }`}
      >
        <div className="flex items-center gap-3 font-mono text-[10.5px] overflow-x-auto no-scrollbar">
          <div 
            style={{ backgroundColor: `${palette.bull}25`, borderColor: palette.bull, color: palette.bull }}
            className="p-1 rounded border flex items-center justify-center shrink-0 animate-pulse"
          >
            <BarChart3 size={12} />
          </div>
          <span className="font-bold text-[var(--color-text)] uppercase tracking-tight shrink-0 flex items-center gap-1.5">
            FOOTPRINT HUD
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
          </span>
          <span className="text-[var(--color-text-muted)] font-semibold shrink-0">Vol: <strong className="text-[var(--color-text)]">{formatVol(currentVol)}</strong></span>
          <span className="font-bold shrink-0 transition-all duration-300" style={{ color: currentDelta >= 0 ? palette.bull : palette.bear }}>
            Delta: {currentDelta >= 0 ? '+' : ''}{formatVol(currentDelta)}
          </span>
          <span className="font-bold shrink-0 hidden sm:inline" style={{ color: currentCvd >= 0 ? palette.bull : palette.bear }}>
            CVD: {currentCvd >= 0 ? '+' : ''}{formatVol(currentCvd)}
          </span>
        </div>

        <button
          onClick={() => setIsMinimized(false)}
          style={{ color: palette.poc }}
          className="px-2 py-0.5 bg-[var(--color-input-bg)] border border-[var(--color-input-border)] hover:border-cyan-400 rounded font-bold font-mono text-[10px] cursor-pointer flex items-center gap-1 transition-colors shrink-0"
          title="Buka / Expand Footprint HUD"
        >
          <Maximize2 size={11} />
          <span>Buka HUD</span>
        </button>
      </div>
    );
  }

  return (
    <div 
      style={{
        background: getThemeModalGradient(palette, isLight),
        borderColor: getThemeCardBorder(palette, false),
        boxShadow: `0 20px 50px rgba(0,0,0,0.85), 0 0 25px ${hexToRgba(palette.bull, 0.2)}`
      }}
      className={`relative text-[var(--color-text)] font-sans text-xs select-none shadow-2xl transition-all flex flex-col backdrop-blur-2xl overflow-hidden ${
        position === 'left' 
          ? `${widthClass} border-r h-full chart-layer-indicators-hud shrink-0` 
          : position === 'right' 
          ? `${widthClass} border-l h-full chart-layer-indicators-hud shrink-0` 
          : 'w-full border-t'
      }`}
    >
      {/* Top Accent Gradient Bar like News Bar & Calendar News */}
      <div 
        className="absolute top-0 left-0 right-0 h-[2.5px] z-20 pointer-events-none"
        style={{
          background: `linear-gradient(90deg, ${palette.bull} 0%, ${palette.poc || '#6366f1'} 50%, ${palette.bear} 100%)`,
          boxShadow: `0 0 10px ${hexToRgba(palette.bull, 0.4)}`
        }}
      />
      {/* Header Bar */}
      <div className="bg-[var(--color-panel-header)] px-2.5 py-1.5 border-b border-[var(--color-border)] flex flex-wrap items-center justify-between gap-1.5 shrink-0">
        <div className="flex items-center gap-1.5">
          <div 
            style={{ backgroundColor: `${palette.bull}25`, borderColor: palette.bull, color: palette.bull }}
            className="p-1 rounded border flex items-center justify-center shrink-0"
          >
            <BarChart3 size={13} />
          </div>
          <span className="font-bold text-[var(--color-text)] font-mono tracking-tight text-[11px] truncate">
            FOOTPRINT HUD
          </span>
          <span className="text-[9.5px] bg-[var(--color-card)] text-[var(--color-text-muted)] px-1 py-0.5 rounded font-mono hidden xs:inline border border-[var(--color-border)]">
            {symbol} ({timeframe})
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Position Switcher: Left, Bottom, Right */}
          {onPositionChange && (
            <div className="flex items-center bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded p-0.5 text-[10px]">
              <button
                onClick={() => onPositionChange('left')}
                style={position === 'left' ? { color: palette.poc } : {}}
                className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors flex items-center gap-0.5 ${
                  position === 'left' ? 'bg-[var(--color-hover)] font-bold' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
                title="Pindah HUD ke Kiri Chart"
              >
                <span>👈</span>
                <span className="hidden sm:inline">Kiri</span>
              </button>
              <button
                onClick={() => onPositionChange('bottom')}
                style={position === 'bottom' ? { color: palette.poc } : {}}
                className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors flex items-center gap-0.5 ${
                  position === 'bottom' ? 'bg-[var(--color-hover)] font-bold' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
                title="Pindah HUD ke Bawah Chart"
              >
                <span>👇</span>
                <span className="hidden sm:inline">Bawah</span>
              </button>
              <button
                onClick={() => onPositionChange('right')}
                style={position === 'right' ? { color: palette.poc } : {}}
                className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors flex items-center gap-0.5 ${
                  position === 'right' ? 'bg-[var(--color-hover)] font-bold' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
                title="Pindah HUD ke Kanan Chart"
              >
                <span>👉</span>
                <span className="hidden sm:inline">Kanan</span>
              </button>
            </div>
          )}

          {/* Width Size Switcher for Vertical Mode */}
          {isVertical && (
            <div className="flex items-center bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded p-0.5 text-[9.5px] font-mono">
              <button
                onClick={() => setPanelWidth('narrow')}
                className={`px-1 py-0.5 rounded cursor-pointer ${
                  panelWidth === 'narrow' ? 'bg-[var(--color-hover)] text-[var(--color-text)] font-bold' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
                title="Lebar Ramping (Narrow)"
              >
                S
              </button>
              <button
                onClick={() => setPanelWidth('medium')}
                className={`px-1 py-0.5 rounded cursor-pointer ${
                  panelWidth === 'medium' ? 'bg-[var(--color-hover)] text-[var(--color-text)] font-bold' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
                title="Lebar Sedang (Medium)"
              >
                M
              </button>
              <button
                onClick={() => setPanelWidth('wide')}
                className={`px-1 py-0.5 rounded cursor-pointer ${
                  panelWidth === 'wide' ? 'bg-[var(--color-hover)] text-[var(--color-text)] font-bold' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
                title="Lebar Luas (Wide)"
              >
                L
              </button>
            </div>
          )}

          {/* Minimize Button */}
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 bg-[var(--color-input-bg)] border border-[var(--color-input-border)] hover:border-[var(--color-border)] rounded text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer"
            title="Minimize HUD"
          >
            <Minimize2 size={12} />
          </button>
        </div>
      </div>

      {/* Grid Charts Container */}
      <div className={`p-2.5 sm:p-3 grid gap-3 overflow-y-auto custom-scrollbar ${
        isVertical 
          ? 'grid-cols-1 flex-1 max-h-full min-h-0' 
          : `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${isExpanded ? 'max-h-[600px]' : 'max-h-[420px]'}`
      }`}>
        
        {/* 1. COLUMN CHART: Buy Vol vs Sell Vol per Bar */}
        {(activeTab === 'all' || activeTab === 'charts') && (
          <div 
            style={{
              borderColor: getThemeCardBorder(palette, false),
              boxShadow: getThemeCardBoxShadow(palette, false),
              background: getThemeCardGradient(palette, isLight, false),
            }}
            className="group relative p-3 pl-4 rounded-xl border transition-all duration-300 flex flex-col justify-between backdrop-blur-xl hover:border-white/30 overflow-hidden min-h-[175px]"
          >
            {/* Side Theme Accent Bar */}
            <div 
              className="absolute left-0 top-0 bottom-0 w-[3.5px]"
              style={{
                backgroundColor: palette.bull,
                boxShadow: `0 0 10px ${hexToRgba(palette.bull, 0.5)}`
              }}
            />
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-[var(--color-text-muted)] font-mono text-[11px] flex items-center gap-1">
                <BarChart3 size={13} style={{ color: palette.poc }} /> Column Chart (Buy/Sell Vol)
              </span>
              <div className="flex gap-1">
                {absorptionSignal && (
                  <span 
                    style={{
                      backgroundColor: absorptionSignal === 'BUY_ABSORPTION' ? `${palette.bull}20` : 'rgba(244,63,94,0.2)',
                      color: absorptionSignal === 'BUY_ABSORPTION' ? palette.bull : '#fb7185'
                    }}
                    className="px-1.5 py-0.5 rounded text-[9px] font-black animate-pulse"
                  >
                    {absorptionSignal.replace('_', ' ')}
                  </span>
                )}
                {imbalanceSignal && (
                  <span 
                    style={{ backgroundColor: `${palette.poc}20`, color: palette.poc, borderColor: `${palette.poc}30` }}
                    className="px-1.5 py-0.5 rounded text-[9px] font-black border"
                  >
                    IMBALANCE
                  </span>
                )}
              </div>
            </div>

            {/* SVG Column Chart */}
            <div className="w-full h-24 flex items-end justify-between gap-1 pt-2 pb-1 border-b border-[var(--color-border)]">
              {recentBars.map((b, idx) => {
                const buyV = Math.max(0, (b.totalVolume + b.delta) / 2);
                const sellV = Math.max(0, (b.totalVolume - b.delta) / 2);
                const buyH = (buyV / maxBarVol) * 100;
                const sellH = (sellV / maxBarVol) * 100;

                const isLast = idx === recentBars.length - 1;
                return (
                  <div key={idx} className="flex-1 flex items-end justify-center gap-0.5 h-full group relative">
                    {/* Sell Column */}
                    <div 
                      style={{ height: `${Math.max(4, sellH)}%`, backgroundColor: palette.bear }}
                      className={`w-1/2 rounded-t-xs transition-all duration-300 ease-out opacity-80 group-hover:opacity-100 ${isLast ? 'shadow-[0_0_8px_rgba(239,68,68,0.5)]' : ''}`}
                    />
                    {/* Buy Column */}
                    <div 
                      style={{ height: `${Math.max(4, buyH)}%`, backgroundColor: palette.bull }}
                      className={`w-1/2 rounded-t-xs transition-all duration-300 ease-out opacity-80 group-hover:opacity-100 ${isLast ? 'shadow-[0_0_8px_rgba(34,197,94,0.5)]' : ''}`}
                    />

                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col bg-[var(--color-panel)] border border-[var(--color-border)] rounded p-1 text-[9px] font-mono z-20 whitespace-nowrap shadow-xl">
                      <span style={{ color: palette.bull }}>Buy: {formatVol(buyV)}</span>
                      <span style={{ color: palette.bear }}>Sell: {formatVol(sellV)}</span>
                      <span className="text-[var(--color-text-muted)]">Total: {formatVol(b.totalVolume)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-[var(--color-text-muted)] pt-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-xs" style={{ backgroundColor: palette.bull }} />
                <span>Buy Vol</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-xs" style={{ backgroundColor: palette.bear }} />
                <span>Sell Vol</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. PIE / DONUT CHART: Buy % vs Sell % Ratio */}
        {(activeTab === 'all' || activeTab === 'distribution') && (
          <div 
            style={{
              borderColor: getThemeCardBorder(palette, false),
              boxShadow: getThemeCardBoxShadow(palette, false),
              background: getThemeCardGradient(palette, isLight, false),
            }}
            className="group relative p-3 pl-4 rounded-xl border transition-all duration-300 flex flex-col justify-between backdrop-blur-xl hover:border-white/30 overflow-hidden min-h-[175px]"
          >
            {/* Side Theme Accent Bar */}
            <div 
              className="absolute left-0 top-0 bottom-0 w-[3.5px]"
              style={{
                backgroundColor: palette.poc || palette.bull,
                boxShadow: `0 0 10px ${hexToRgba(palette.poc || palette.bull, 0.5)}`
              }}
            />
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-[var(--color-text-muted)] font-mono text-[11px] flex items-center gap-1">
                <PieChart size={13} style={{ color: palette.poc }} /> Pie Chart (Buy/Sell Ratio)
              </span>
              <span className="text-[10px] text-[var(--color-text-muted)] font-mono">12-Bar Share</span>
            </div>

            <div className="flex items-center justify-around h-24 my-1">
              {/* SVG Donut Pie */}
              <div className="relative w-20 h-20 flex items-center justify-center">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  {/* Circle background (Sell share) */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={palette.bear}
                    strokeWidth="4"
                  />
                  {/* Circle foreground (Buy share) */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={palette.bull}
                    strokeWidth="4"
                    strokeDasharray={`${buyPct}, 100`}
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-[11px] font-bold text-[var(--color-text)] font-mono">{buyPct.toFixed(0)}%</span>
                  <span className="block text-[8px] text-[var(--color-text-muted)] uppercase font-mono">Buy</span>
                </div>
              </div>

              {/* Pie Details Stats */}
              <div className="space-y-1 font-mono text-[10.5px]">
                <div>
                  <span className="text-[var(--color-text-muted)] text-[9.5px]">Agg Buy: </span>
                  <span style={{ color: palette.bull }} className="font-bold">{formatVol(totalBuyVol)} ({buyPct.toFixed(1)}%)</span>
                </div>
                <div>
                  <span className="text-[var(--color-text-muted)] text-[9.5px]">Agg Sell: </span>
                  <span style={{ color: palette.bear }} className="font-bold">{formatVol(totalSellVol)} ({sellPct.toFixed(1)}%)</span>
                </div>
                <div className="pt-1 border-t border-[var(--color-border)]">
                  <span className="text-[var(--color-text-muted)] text-[9.5px]">Dominance: </span>
                  <span className="font-bold" style={{ color: buyPct >= 50 ? palette.bull : palette.bear }}>
                    {buyPct >= 50 ? 'BUYERS ⚡' : 'SELLERS ⚡'}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-[9.5px] font-mono text-[var(--color-text-muted)] text-center">
              Akurasi Distribusi Agresif Market Order Flow
            </div>
          </div>
        )}

        {/* 3. LINE / AREA CHART: CVD Trajectory Line */}
        {(activeTab === 'all' || activeTab === 'charts') && (
          <div 
            style={{
              borderColor: getThemeCardBorder(palette, false),
              boxShadow: getThemeCardBoxShadow(palette, false),
              background: getThemeCardGradient(palette, isLight, false),
            }}
            className="group relative p-3 pl-4 rounded-xl border transition-all duration-300 flex flex-col justify-between backdrop-blur-xl hover:border-white/30 overflow-hidden min-h-[175px]"
          >
            {/* Side Theme Accent Bar */}
            <div 
              className="absolute left-0 top-0 bottom-0 w-[3.5px]"
              style={{
                backgroundColor: currentCvd >= 0 ? palette.bull : palette.bear,
                boxShadow: `0 0 10px ${hexToRgba(currentCvd >= 0 ? palette.bull : palette.bear, 0.5)}`
              }}
            />
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-[var(--color-text-muted)] font-mono text-[11px] flex items-center gap-1">
                <LineChart size={13} className="text-blue-400" /> Line Chart (Cumulative Delta)
              </span>
              <span className="text-[10px] text-[var(--color-text-muted)] font-mono">CVD Trend</span>
            </div>

            {/* SVG Line / Area Chart */}
            <div className="w-full h-24 relative flex items-center">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 200 60" preserveAspectRatio="none">
                {(() => {
                  const cvdValues = recentBars.map(b => b.cumulativeDelta);
                  const minCvd = Math.min(...cvdValues, 0);
                  const maxCvd = Math.max(...cvdValues, 1);
                  const range = Math.max(1, maxCvd - minCvd);

                  const points = cvdValues.map((val, idx) => {
                    const x = (idx / (cvdValues.length - 1 || 1)) * 200;
                    const y = 55 - ((val - minCvd) / range) * 50;
                    return `${x.toFixed(1)},${y.toFixed(1)}`;
                  }).join(' ');

                  const firstX = 0;
                  const lastX = 200;
                  const areaPoints = `${firstX},60 ${points} ${lastX},60`;

                  const isPositiveCvd = currentCvd >= 0;
                  const activeColor = isPositiveCvd ? palette.bull : palette.bear;

                  return (
                    <>
                      <defs>
                        <linearGradient id="cvdAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={activeColor} stopOpacity="0.35" />
                          <stop offset="100%" stopColor={activeColor} stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      {/* Area fill */}
                      <polygon points={areaPoints} fill="url(#cvdAreaGrad)" />
                      {/* Line stroke */}
                      <polyline
                        fill="none"
                        stroke={activeColor}
                        strokeWidth="2"
                        points={points}
                      />
                    </>
                  );
                })()}
              </svg>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono pt-1.5 border-t border-[var(--color-border)]">
              <span className="text-[var(--color-text-muted)]">Current CVD:</span>
              <span className="font-bold" style={{ color: currentCvd >= 0 ? palette.bull : palette.bear }}>
                {currentCvd >= 0 ? '+' : ''}{formatVol(currentCvd)}
              </span>
            </div>
          </div>
        )}

        {/* 4. BAR CHART: Horizontal Delta Levels Profile */}
        {(activeTab === 'all' || activeTab === 'distribution') && currentBar && currentBar.levels && (
          <div 
            style={{
              borderColor: getThemeCardBorder(palette, false),
              boxShadow: getThemeCardBoxShadow(palette, false),
              background: getThemeCardGradient(palette, isLight, false),
            }}
            className="group relative p-3 pl-4 rounded-xl border transition-all duration-300 flex flex-col justify-between backdrop-blur-xl hover:border-white/30 overflow-hidden min-h-[175px]"
          >
            {/* Side Theme Accent Bar */}
            <div 
              className="absolute left-0 top-0 bottom-0 w-[3.5px]"
              style={{
                backgroundColor: palette.poc,
                boxShadow: `0 0 10px ${hexToRgba(palette.poc, 0.5)}`
              }}
            />
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-[var(--color-text-muted)] font-mono text-[11px] flex items-center gap-1">
                <BarChart3 size={13} style={{ color: palette.poc }} className="transform rotate-90" /> Bar Chart (Delta Levels)
              </span>
              <span className="text-[10px] text-[var(--color-text-muted)] font-mono">Bar Profile</span>
            </div>

            {/* Horizontal Bar Chart */}
            <div className="space-y-1 my-1">
              {currentBar.levels.slice(-5).reverse().map((lvl, idx) => {
                const maxLvlVol = Math.max(...currentBar.levels.map(l => l.totalVol), 1);
                const bW = (lvl.askVol / maxLvlVol) * 100;
                const sW = (lvl.bidVol / maxLvlVol) * 100;

                return (
                  <div key={idx} className="flex items-center gap-1.5 text-[9.5px] font-mono">
                    <span className="w-12 text-[var(--color-text-muted)] text-right truncate">${lvl.price.toFixed(1)}</span>
                    <div className="flex-1 bg-[var(--color-input-bg)] h-3.5 rounded flex items-center overflow-hidden px-1">
                      {/* Sell Bar */}
                      <div 
                        style={{ width: `${sW}%`, backgroundColor: palette.bear }}
                        className="h-2 rounded-xs opacity-80"
                      />
                      {/* Buy Bar */}
                      <div 
                        style={{ width: `${bW}%`, backgroundColor: palette.bull }}
                        className="h-2 rounded-xs opacity-80 ml-0.5"
                      />
                    </div>
                    <span className="w-10 text-[var(--color-text)] text-right">{lvl.askVol}/{lvl.bidVol}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[9.5px] font-mono text-[var(--color-text-muted)] pt-1">
              <span>POC: <strong style={{ color: palette.poc }}>${currentPoc.toFixed(2)}</strong></span>
              <span className="text-[var(--color-text)]">VAH: ${currentVah.toFixed(2)} | VAL: ${currentVal.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* 5. METRIC CARDS & REAL-TIME AUCTION STATUS */}
        {activeTab === 'all' && (
          <div 
            style={{
              borderColor: getThemeCardBorder(palette, false),
              boxShadow: getThemeCardBoxShadow(palette, false),
              background: getThemeCardGradient(palette, isLight, false),
            }}
            className="group relative p-3 pl-4 rounded-xl border transition-all duration-300 flex flex-col justify-between backdrop-blur-xl hover:border-white/30 overflow-hidden min-h-[175px]"
          >
            {/* Side Theme Accent Bar */}
            <div 
              className="absolute left-0 top-0 bottom-0 w-[3.5px]"
              style={{
                backgroundColor: palette.bull,
                boxShadow: `0 0 10px ${hexToRgba(palette.bull, 0.5)}`
              }}
            />
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-[var(--color-text-muted)] font-mono text-[11px] flex items-center gap-1">
                <Zap size={13} className="text-yellow-400" /> Key Metrics & Signals
              </span>
              <span className="text-[10px] text-[var(--color-text-muted)] font-mono">Real-time</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 font-mono text-[10px] my-1">
              <div className="bg-[var(--color-input-bg)] p-1.5 rounded border border-[var(--color-input-border)]">
                <span className="text-[var(--color-text-muted)] text-[9px] block">Current Delta</span>
                <span className="text-xs font-bold font-mono" style={{ color: currentDelta >= 0 ? palette.bull : palette.bear }}>
                  {currentDelta >= 0 ? '+' : ''}{formatVol(currentDelta)}
                </span>
              </div>

              <div className="bg-[var(--color-input-bg)] p-1.5 rounded border border-[var(--color-input-border)]">
                <span className="text-[var(--color-text-muted)] text-[9px] block">Current Volume</span>
                <span className="text-xs font-bold text-[var(--color-text)]">
                  {formatVol(currentVol)}
                </span>
              </div>

              <div className="bg-[var(--color-input-bg)] p-1.5 rounded border border-[var(--color-input-border)]">
                <span className="text-[var(--color-text-muted)] text-[9px] block">VPIN Toxicity</span>
                <span className={`text-xs font-bold font-mono ${isToxic ? 'text-rose-400 animate-pulse' : 'text-sky-400'}`}>
                  {vpinPct}% {isToxic ? '⚠️' : '⚡'}
                </span>
              </div>

              <div className="bg-[var(--color-input-bg)] p-1.5 rounded border border-[var(--color-input-border)]">
                <span className="text-[var(--color-text-muted)] text-[9px] block">HFT Refill Speed</span>
                <span className="text-xs font-bold" style={{ color: palette.poc }}>
                  {hftRefillMs}ms
                </span>
              </div>

              <div className="bg-[var(--color-input-bg)] p-1.5 rounded border border-[var(--color-input-border)]">
                <span className="text-[var(--color-text-muted)] text-[9px] block">Value Area High (VAH)</span>
                <span className="text-xs font-bold text-[var(--color-text)]">
                  ${currentVah.toFixed(2)}
                </span>
              </div>

              <div className="bg-[var(--color-input-bg)] p-1.5 rounded border border-[var(--color-input-border)]">
                <span className="text-[var(--color-text-muted)] text-[9px] block">Value Area Low (VAL)</span>
                <span className="text-xs font-bold text-[var(--color-text)]">
                  ${currentVal.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[9.5px] font-mono text-[var(--color-text-muted)] pt-1 border-t border-[var(--color-border)]">
              <span>Profile Shape: <strong style={{ color: palette.poc }}>{currentBar?.profileShape || 'BALANCED'}</strong></span>
              <span style={{ color: palette.poc }} className="font-bold">MountAlgo V7.2 HFT PRO</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
});

export default FootprintHudPanel;
