import React, { useState, useMemo } from 'react';
import { 
  Eye, 
  EyeOff, 
  Settings, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Sliders, 
  Flame, 
  Activity, 
  TrendingUp, 
  BarChart2, 
  Layers, 
  Plus 
} from 'lucide-react';
import { 
  IndicatorSettings, 
  calculateEMA, 
  calculateBollingerBands, 
  calculateSuperTrend, 
  calculateRSI, 
  calculateMACD 
} from '../utils/indicators';
import { Candle } from './CustomChartWidget';

interface ChartIndicatorsLegendProps {
  candles: Candle[];
  indicators: IndicatorSettings;
  onUpdateIndicators: (newSettings: IndicatorSettings) => void;
  onOpenWizardTools: (focusKey?: string) => void;
  onOpenFootprintSettings?: () => void;
  isCleanMode?: boolean;
  className?: string;
}

export const ChartIndicatorsLegend: React.FC<ChartIndicatorsLegendProps> = ({
  candles,
  indicators,
  onUpdateIndicators,
  onOpenWizardTools,
  onOpenFootprintSettings,
  isCleanMode = false,
  className = '',
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Compute the latest numerical values of all active indicators
  const latestValues = useMemo(() => {
    if (!candles || candles.length === 0) return null;

    const latest = candles[candles.length - 1];

    // 1. EMAs
    let ema20Val: number | null = null;
    let ema50Val: number | null = null;
    let ema200Val: number | null = null;

    if (indicators.showEma20) {
      const series = calculateEMA(candles, indicators.ema20Config?.period || 20, indicators.ema20Config?.source || 'close');
      ema20Val = series[series.length - 1];
    }
    if (indicators.showEma50) {
      const series = calculateEMA(candles, indicators.ema50Config?.period || 50, indicators.ema50Config?.source || 'close');
      ema50Val = series[series.length - 1];
    }
    if (indicators.showEma200) {
      const series = calculateEMA(candles, indicators.ema200Config?.period || 200, indicators.ema200Config?.source || 'close');
      ema200Val = series[series.length - 1];
    }

    // 2. Bollinger Bands
    let bbUpper: number | null = null;
    let bbMid: number | null = null;
    let bbLower: number | null = null;
    if (indicators.showBollinger) {
      const bb = calculateBollingerBands(
        candles, 
        indicators.bollingerConfig?.period || 20, 
        indicators.bollingerConfig?.multiplier || 2.0, 
        indicators.bollingerConfig?.source || 'close'
      );
      bbUpper = bb.upper[bb.upper.length - 1];
      bbMid = bb.middle[bb.middle.length - 1];
      bbLower = bb.lower[bb.lower.length - 1];
    }

    // 3. SuperTrend
    let stVal: number | null = null;
    let stTrend: 1 | -1 | null = null;
    if (indicators.showSuperTrend) {
      const st = calculateSuperTrend(
        candles, 
        indicators.superTrendConfig?.atrPeriod || 10, 
        indicators.superTrendConfig?.factor || 3.0
      );
      stVal = st.supertrend[st.supertrend.length - 1];
      stTrend = st.trend[st.trend.length - 1];
    }

    // 4. RSI
    let rsiVal: number | null = null;
    if (indicators.showRSI) {
      const rsi = calculateRSI(candles, indicators.rsiConfig?.period || 14, indicators.rsiConfig?.source || 'close');
      rsiVal = rsi[rsi.length - 1];
    }

    // 5. MACD
    let macdLine: number | null = null;
    let signalLine: number | null = null;
    let histVal: number | null = null;
    if (indicators.showMACD) {
      const m = calculateMACD(
        candles, 
        indicators.macdConfig?.fastPeriod || 12, 
        indicators.macdConfig?.slowPeriod || 26, 
        indicators.macdConfig?.signalPeriod || 9, 
        indicators.macdConfig?.source || 'close'
      );
      macdLine = m.macd[m.macd.length - 1];
      signalLine = m.signal[m.signal.length - 1];
      histVal = m.histogram[m.histogram.length - 1];
    }

    // 6. Volume
    const volVal = latest.volume || 0;

    return {
      ema20Val,
      ema50Val,
      ema200Val,
      bbUpper,
      bbMid,
      bbLower,
      stVal,
      stTrend,
      rsiVal,
      macdLine,
      signalLine,
      histVal,
      volVal,
    };
  }, [candles, indicators]);

  if (isCleanMode) return null;

  // Build active items list
  const activeItems: {
    key: keyof IndicatorSettings;
    title: string;
    label: string;
    valueStr?: string;
    valueColor?: string;
    color: string;
    icon: React.ReactNode;
    onSettingsClick: () => void;
  }[] = [];

  // Liquidity Heatmap
  if (indicators.showLiquidityHeatmap) {
    activeItems.push({
      key: 'showLiquidityHeatmap',
      title: 'Liquidity Heatmap Depth',
      label: 'Heatmap',
      valueStr: 'Bookmap V5.17',
      color: '#06b6d4',
      icon: <Flame size={12} className="text-cyan-400" />,
      onSettingsClick: () => onOpenWizardTools('showLiquidityHeatmap'),
    });
  }

  // MTF Footprints
  if (indicators.showFootprints) {
    activeItems.push({
      key: 'showFootprints',
      title: 'MTF Footprints V7.2',
      label: 'Footprints',
      valueStr: 'Bid/Ask Delta',
      color: '#ec4899',
      icon: <Activity size={12} className="text-pink-400" />,
      onSettingsClick: () => {
        if (onOpenFootprintSettings) onOpenFootprintSettings();
        else onOpenWizardTools('showFootprints');
      },
    });
  }

  // SuperTrend
  if (indicators.showSuperTrend) {
    const isBull = latestValues?.stTrend === 1;
    activeItems.push({
      key: 'showSuperTrend',
      title: `SuperTrend (${indicators.superTrendConfig?.atrPeriod || 10}, ${indicators.superTrendConfig?.factor || 3})`,
      label: 'SuperTrend',
      valueStr: latestValues?.stVal ? `$${latestValues.stVal.toFixed(2)} (${isBull ? 'BUY' : 'SELL'})` : 'Active',
      valueColor: isBull ? '#10b981' : '#ef4444',
      color: isBull ? (indicators.superTrendConfig?.bullColor || '#10b981') : (indicators.superTrendConfig?.bearColor || '#ef4444'),
      icon: <TrendingUp size={12} style={{ color: isBull ? '#10b981' : '#ef4444' }} />,
      onSettingsClick: () => onOpenWizardTools('showSuperTrend'),
    });
  }

  // EMA 20
  if (indicators.showEma20) {
    activeItems.push({
      key: 'showEma20',
      title: `EMA ${indicators.ema20Config?.period || 20}`,
      label: `EMA ${indicators.ema20Config?.period || 20}`,
      valueStr: latestValues?.ema20Val ? `$${latestValues.ema20Val.toFixed(2)}` : undefined,
      color: indicators.ema20Config?.color || '#00e5ff',
      icon: <div className="w-2 h-2 rounded-full" style={{ backgroundColor: indicators.ema20Config?.color || '#00e5ff' }} />,
      onSettingsClick: () => onOpenWizardTools('showEma20'),
    });
  }

  // EMA 50
  if (indicators.showEma50) {
    activeItems.push({
      key: 'showEma50',
      title: `EMA ${indicators.ema50Config?.period || 50}`,
      label: `EMA ${indicators.ema50Config?.period || 50}`,
      valueStr: latestValues?.ema50Val ? `$${latestValues.ema50Val.toFixed(2)}` : undefined,
      color: indicators.ema50Config?.color || '#a855f7',
      icon: <div className="w-2 h-2 rounded-full" style={{ backgroundColor: indicators.ema50Config?.color || '#a855f7' }} />,
      onSettingsClick: () => onOpenWizardTools('showEma50'),
    });
  }

  // EMA 200
  if (indicators.showEma200) {
    activeItems.push({
      key: 'showEma200',
      title: `EMA ${indicators.ema200Config?.period || 200}`,
      label: `EMA ${indicators.ema200Config?.period || 200}`,
      valueStr: latestValues?.ema200Val ? `$${latestValues.ema200Val.toFixed(2)}` : undefined,
      color: indicators.ema200Config?.color || '#f59e0b',
      icon: <div className="w-2 h-2 rounded-full" style={{ backgroundColor: indicators.ema200Config?.color || '#f59e0b' }} />,
      onSettingsClick: () => onOpenWizardTools('showEma200'),
    });
  }

  // Bollinger Bands
  if (indicators.showBollinger) {
    activeItems.push({
      key: 'showBollinger',
      title: `BB (${indicators.bollingerConfig?.period || 20}, ${indicators.bollingerConfig?.multiplier || 2})`,
      label: 'Bollinger',
      valueStr: latestValues?.bbUpper && latestValues?.bbLower 
        ? `U: $${latestValues.bbUpper.toFixed(1)} | L: $${latestValues.bbLower.toFixed(1)}`
        : 'Active',
      color: indicators.bollingerConfig?.upperColor || '#3b82f6',
      icon: <Layers size={12} className="text-blue-400" />,
      onSettingsClick: () => onOpenWizardTools('showBollinger'),
    });
  }

  // Volume Profile
  if (indicators.showVolumeProfile) {
    activeItems.push({
      key: 'showVolumeProfile',
      title: 'Volume Profile (VPVR)',
      label: 'VPVR',
      valueStr: 'POC / VAH / VAL',
      color: '#f59e0b',
      icon: <BarChart2 size={12} className="text-amber-400" />,
      onSettingsClick: () => onOpenWizardTools('showVolumeProfile'),
    });
  }

  // Volume Histogram
  if (indicators.showVolume) {
    activeItems.push({
      key: 'showVolume',
      title: 'Volume Histogram',
      label: 'Volume',
      valueStr: latestValues?.volVal ? `${(latestValues.volVal > 1000 ? (latestValues.volVal / 1000).toFixed(1) + 'K' : latestValues.volVal.toFixed(0))}` : undefined,
      color: '#10b981',
      icon: <BarChart2 size={12} className="text-emerald-400" />,
      onSettingsClick: () => onOpenWizardTools('showVolume'),
    });
  }

  // CVD Volume Delta
  if (indicators.showVolumeDelta) {
    activeItems.push({
      key: 'showVolumeDelta',
      title: 'CVD Volume Delta',
      label: 'CVD Delta',
      valueStr: 'Oscillator',
      color: '#f59e0b',
      icon: <Activity size={12} className="text-amber-400" />,
      onSettingsClick: () => onOpenWizardTools('showVolumeDelta'),
    });
  }

  // CVD Candles
  if (indicators.showIcdCandles) {
    activeItems.push({
      key: 'showIcdCandles',
      title: 'CVD Candles (ICD)',
      label: 'CVD Candles',
      valueStr: 'Delta Candles',
      color: indicators.icdCandlesConfig?.lineColor || '#f59e0b',
      icon: <Activity size={12} className="text-amber-400" />,
      onSettingsClick: () => onOpenWizardTools('showIcdCandles'),
    });
  }

  // RSI
  if (indicators.showRSI) {
    const val = latestValues?.rsiVal;
    let rsiColor = '#8b5cf6';
    if (val !== null && val !== undefined) {
      if (val >= (indicators.rsiConfig?.overbought || 70)) rsiColor = '#ef4444';
      else if (val <= (indicators.rsiConfig?.oversold || 30)) rsiColor = '#10b981';
    }
    activeItems.push({
      key: 'showRSI',
      title: `RSI ${indicators.rsiConfig?.period || 14}`,
      label: `RSI ${indicators.rsiConfig?.period || 14}`,
      valueStr: val !== null && val !== undefined ? val.toFixed(1) : undefined,
      valueColor: rsiColor,
      color: indicators.rsiConfig?.rsiColor || '#8b5cf6',
      icon: <div className="w-2 h-2 rounded-full" style={{ backgroundColor: rsiColor }} />,
      onSettingsClick: () => onOpenWizardTools('showRSI'),
    });
  }

  // MACD
  if (indicators.showMACD) {
    activeItems.push({
      key: 'showMACD',
      title: 'MACD (12, 26, 9)',
      label: 'MACD',
      valueStr: latestValues?.histVal !== null && latestValues?.histVal !== undefined 
        ? `H: ${latestValues.histVal > 0 ? '+' : ''}${latestValues.histVal.toFixed(2)}`
        : 'Active',
      valueColor: (latestValues?.histVal || 0) >= 0 ? '#10b981' : '#ef4444',
      color: indicators.macdConfig?.macdColor || '#3b82f6',
      icon: <div className="w-2 h-2 rounded-full" style={{ backgroundColor: indicators.macdConfig?.macdColor || '#3b82f6' }} />,
      onSettingsClick: () => onOpenWizardTools('showMACD'),
    });
  }

  const toggleIndicator = (key: keyof IndicatorSettings) => {
    onUpdateIndicators({
      ...indicators,
      [key]: !indicators[key],
    });
  };

  const removeIndicator = (key: keyof IndicatorSettings) => {
    onUpdateIndicators({
      ...indicators,
      [key]: false,
    });
  };

  if (activeItems.length === 0) {
    return (
      <div className={`absolute top-12 left-3 z-30 pointer-events-auto ${className}`}>
        <button
          onClick={() => onOpenWizardTools()}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--color-panel)]/60 hover:bg-[var(--color-panel)]/80 border border-[var(--color-border)]/30 hover:border-cyan-500/40 backdrop-blur-xl text-[10px] font-mono text-zinc-400 hover:text-cyan-300 transition-all shadow-lg group cursor-pointer"
        >
          <Sliders size={12} className="text-cyan-400 group-hover:rotate-45 transition-transform" />
          <span>+ Hubungkan Wizard Tools</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`absolute top-12 left-3 z-30 pointer-events-auto flex flex-col gap-1 select-none font-mono ${className}`}>
      {/* Legend Header & Collapse Toggle */}
      <div className="flex items-center gap-1.5">
        <div 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--color-panel)]/60 hover:bg-[var(--color-panel)]/80 border border-[var(--color-border)]/30 hover:border-white/20 backdrop-blur-xl text-[9.5px] font-bold text-zinc-300 hover:text-white transition-colors cursor-pointer shadow-md"
        >
          <Sliders size={11} className="text-cyan-400" />
          <span>Wizard Tools ({activeItems.length})</span>
          {isCollapsed ? <ChevronDown size={10} /> : <ChevronUp size={10} />}
        </div>

        <button
          onClick={() => onOpenWizardTools()}
          title="Buka Wizard Tools Modal"
          className="p-1 rounded bg-[var(--color-panel)]/60 hover:bg-[var(--color-panel)]/80 border border-[var(--color-border)]/30 hover:border-cyan-500/40 text-zinc-400 hover:text-cyan-300 backdrop-blur-xl transition-all cursor-pointer shadow-md"
        >
          <Plus size={11} />
        </button>
      </div>

      {/* Expanded Indicator Rows */}
      {!isCollapsed && (
        <div className="flex flex-col gap-0.5 mt-0.5 max-h-[48vh] overflow-y-auto scrollbar-none pr-1">
          {activeItems.map((item) => (
            <div
              key={item.key}
              className="group flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--color-panel)]/65 hover:bg-[var(--color-panel)]/85 border border-[var(--color-border)]/20 hover:border-white/20 backdrop-blur-xl text-[10px] text-zinc-300 shadow transition-all duration-150"
            >
              {/* Indicator Color Dot / Icon */}
              <div className="flex items-center shrink-0">
                {item.icon}
              </div>

              {/* Title / Label */}
              <span className="font-bold text-white tracking-tight shrink-0">
                {item.label}
              </span>

              {/* Live Value */}
              {item.valueStr && (
                <span 
                  className="text-[9.5px] font-mono tracking-tight shrink-0"
                  style={{ color: item.valueColor || '#94a3b8' }}
                >
                  {item.valueStr}
                </span>
              )}

              {/* Quick Action Icons (Hover reveal) */}
              <div className="flex items-center gap-0.5 ml-auto opacity-70 group-hover:opacity-100 transition-opacity pl-1">
                {/* Quick Settings Gear */}
                <button
                  onClick={item.onSettingsClick}
                  title={`Konfigurasi ${item.title}`}
                  className="p-0.5 hover:bg-white/10 rounded text-zinc-400 hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  <Settings size={10} />
                </button>

                {/* Quick Toggle Eye */}
                <button
                  onClick={() => toggleIndicator(item.key)}
                  title={`Sembunyikan ${item.title}`}
                  className="p-0.5 hover:bg-white/10 rounded text-zinc-400 hover:text-emerald-300 transition-colors cursor-pointer"
                >
                  <Eye size={10} />
                </button>

                {/* Quick Remove X */}
                <button
                  onClick={() => removeIndicator(item.key)}
                  title={`Hapus ${item.title}`}
                  className="p-0.5 hover:bg-rose-500/20 rounded text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  <X size={10} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChartIndicatorsLegend;
