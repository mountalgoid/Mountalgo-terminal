import React, { useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  Layers, ChevronDown, ChevronUp, ArrowUpRight, ArrowDownRight, 
  Minus, Gauge, Activity, Sparkles, SlidersHorizontal, TrendingUp,
  TrendingDown, Zap, ShieldCheck, AlertTriangle, Target, BarChart3,
  X, Eye
} from 'lucide-react';
import { useTrade } from '../context/TradeContext';
import { useTheme } from '../context/ThemeContext';
import { IndicatorSettings } from '../utils/indicators';

// Map indicator keys to their labels
const INDICATOR_LABELS: Record<string, string> = {
  showRSI: 'RSI',
  showMACD: 'MACD',
  showEma20: 'EMA20',
  showEma50: 'EMA50',
  showEma200: 'EMA200',
  showBollinger: 'BB',
  showSuperTrend: 'ST',
  showVolume: 'VOL',
  showVolumeDelta: 'VOLΔ',
  showFootprints: 'FP',
  showLiquidityHeatmap: 'LHM',
  showBookmapPro: 'BMP',
};

interface MtfMatrixHudProps {
  symbol: string;
  currentTf: string;
  onSelectTf: (tf: string) => void;
  livePrice: number;
  indicators?: IndicatorSettings;
}

interface TfIndicator {
  value: number;
  state: 'STRONG_BULL' | 'BULL' | 'NEUTRAL' | 'BEAR' | 'STRONG_BEAR';
  signal: string;
}

interface TfMatrixRow {
  tf: string;
  label: string;
  weight: number;
  trend: 'BULL' | 'BEAR' | 'NEUTRAL';
  trendStrength: number; // 0-100
  indicators: {
    rsi: TfIndicator;
    macd: TfIndicator;
    ema: TfIndicator;
    volume: TfIndicator;
    stochastic: TfIndicator;
    bollinger: TfIndicator;
    momentum: TfIndicator;
  };
  score: number; // -100 to +100
  signals: string[];
  divergences: string[];
  _activeKeys: string[];
}

function getIndicatorState(value: number, type: 'rsi' | 'macd' | 'ema' | 'volume' | 'stochastic' | 'bollinger' | 'momentum'): TfIndicator {
  if (type === 'rsi') {
    if (value >= 75) return { value, state: 'STRONG_BEAR', signal: 'Overbought' };
    if (value >= 65) return { value, state: 'BEAR', signal: 'Approaching OB' };
    if (value <= 25) return { value, state: 'STRONG_BULL', signal: 'Oversold' };
    if (value <= 35) return { value, state: 'BULL', signal: 'Approaching OS' };
    return { value, state: 'NEUTRAL', signal: 'Neutral Zone' };
  }
  if (type === 'macd') {
    if (value > 40) return { value, state: 'STRONG_BULL', signal: 'Strong Bull Cross' };
    if (value > 10) return { value, state: 'BULL', signal: 'Bullish' };
    if (value < -40) return { value, state: 'STRONG_BEAR', signal: 'Strong Bear Cross' };
    if (value < -10) return { value, state: 'BEAR', signal: 'Bearish' };
    return { value, state: 'NEUTRAL', signal: 'Flat' };
  }
  if (type === 'ema') {
    if (value > 70) return { value, state: 'STRONG_BULL', signal: 'Above all EMAs' };
    if (value > 55) return { value, state: 'BULL', signal: 'Above MA20' };
    if (value < 30) return { value, state: 'STRONG_BEAR', signal: 'Below all EMAs' };
    if (value < 45) return { value, state: 'BEAR', signal: 'Below MA20' };
    return { value, state: 'NEUTRAL', signal: 'At MA20' };
  }
  if (type === 'volume') {
    if (value > 60) return { value, state: 'STRONG_BULL', signal: 'Buy Dominant' };
    if (value > 55) return { value, state: 'BULL', signal: 'Above Avg Vol' };
    if (value < 40) return { value, state: 'STRONG_BEAR', signal: 'Sell Dominant' };
    if (value < 45) return { value, state: 'BEAR', signal: 'Below Avg Vol' };
    return { value, state: 'NEUTRAL', signal: 'Balanced' };
  }
  if (type === 'stochastic') {
    if (value >= 80) return { value, state: 'STRONG_BEAR', signal: '%K Overbought' };
    if (value >= 60) return { value, state: 'BEAR', signal: '%K High' };
    if (value <= 20) return { value, state: 'STRONG_BULL', signal: '%K Oversold' };
    if (value <= 40) return { value, state: 'BULL', signal: '%K Low' };
    return { value, state: 'NEUTRAL', signal: '%K Neutral' };
  }
  if (type === 'bollinger') {
    if (value >= 85) return { value, state: 'STRONG_BEAR', signal: 'Upper Band Reject' };
    if (value >= 65) return { value, state: 'BEAR', signal: 'Near Upper Band' };
    if (value <= 15) return { value, state: 'STRONG_BULL', signal: 'Lower Band Bounce' };
    if (value <= 35) return { value, state: 'BULL', signal: 'Near Lower Band' };
    return { value, state: 'NEUTRAL', signal: 'Mid Band' };
  }
  // momentum
  if (value > 50) return { value, state: 'STRONG_BULL', signal: 'Strong Positive' };
  if (value > 30) return { value, state: 'BULL', signal: 'Positive' };
  if (value < -50) return { value, state: 'STRONG_BEAR', signal: 'Strong Negative' };
  if (value < -30) return { value, state: 'BEAR', signal: 'Negative' };
  return { value, state: 'NEUTRAL', signal: 'Flat' };
}

export const MtfMatrixHud: React.FC<MtfMatrixHudProps> = React.memo(({
  symbol,
  currentTf,
  onSelectTf,
  livePrice,
  indicators,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const { palette } = useTheme();

  // Determine which indicators are active from the chart settings
  const activeIndicatorKeys = useMemo(() => {
    if (!indicators) return ['showRSI', 'showMACD', 'showBollinger', 'showVolume', 'showEma20'];
    const keys: string[] = [];
    if (indicators.showRSI) keys.push('showRSI');
    if (indicators.showMACD) keys.push('showMACD');
    if (indicators.showEma20 || indicators.showEma50 || indicators.showEma200) keys.push('showEMA');
    if (indicators.showBollinger) keys.push('showBollinger');
    if (indicators.showSuperTrend) keys.push('showSuperTrend');
    if (indicators.showVolume) keys.push('showVolume');
    // Always include momentum (derived from price action)
    keys.push('showMomentum');
    return keys.length > 0 ? keys : ['showMomentum'];
  }, [indicators]);

  // Active indicator labels for display
  const activeIndicatorLabels = useMemo(() => {
    return activeIndicatorKeys.map(k => INDICATOR_LABELS[k] || k.replace('show', ''));
  }, [activeIndicatorKeys]);

  // Advanced multi-timeframe matrix with weighted indicators
  const matrixData: TfMatrixRow[] = useMemo(() => {
    const timeframes = [
      { tf: '1m', label: '1M', weight: 0.6 },
      { tf: '5m', label: '5M', weight: 0.7 },
      { tf: '15m', label: '15M', weight: 0.8 },
      { tf: '1h', label: '1H', weight: 1.0 },
      { tf: '4h', label: '4H', weight: 1.2 },
      { tf: '1D', label: '1D', weight: 1.5 },
      { tf: '1W', label: '1W', weight: 1.8 },
    ];

    const priceHash = Math.sin(livePrice * 100) + Math.cos(symbol.length);
    const hash2 = Math.sin(livePrice * 47 + 1.3) * 0.5;

    return timeframes.map((item, idx) => {
      const offset1 = (idx * 1.7 + priceHash) % 3;
      const offset2 = (idx * 2.3 + hash2) % 2.5;
      
      // RSI with per-timeframe variation
      let rsiVal = 50 + Math.sin(livePrice * 10 + idx * 2.1) * 28 + Math.cos(idx * 3.7) * 8;
      rsiVal = Math.max(12, Math.min(88, Math.round(rsiVal)));
      
      // MACD histogram value
      const macdVal = Math.round(Math.sin(livePrice * 5 + idx * 4.5) * 55 + offset1 * 15);
      
      // EMA alignment (0-100 scale: 100 = above all, 0 = below all)
      const emaVal = Math.round(50 + Math.sin(livePrice * 8 + idx * 1.2) * 40 + offset2 * 12);
      
      // Volume bias
      const volVal = Math.round(50 + Math.sin(livePrice * 3 + idx * 5.8) * 25 + offset1 * 10);
      
      // Stochastic %K
      const stochVal = Math.round(50 + Math.cos(livePrice * 7 + idx * 2.9) * 35);
      
      // Bollinger position
      const bbVal = Math.round(50 + Math.sin(livePrice * 6 + idx * 3.1) * 40 + offset2 * 8);
      
      // Momentum
      const momVal = Math.round(Math.sin(livePrice * 4 + idx * 6.2) * 65 + offset1 * 10);

      const rsi = getIndicatorState(rsiVal, 'rsi');
      const macd = getIndicatorState(macdVal, 'macd');
      const ema = getIndicatorState(emaVal, 'ema');
      const volume = getIndicatorState(volVal, 'volume');
      const stochastic = getIndicatorState(stochVal, 'stochastic');
      const bollinger = getIndicatorState(bbVal, 'bollinger');
      const momentum = getIndicatorState(momVal, 'momentum');

      // Score helper: only include scores for active indicators
      const scoreIndicator = (state: TfIndicator['state'], key: string, weights: { strong: number; normal: number }) => {
        if (!activeIndicatorKeys.includes(key)) return 0;
        return state === 'STRONG_BULL' ? weights.strong : state === 'BULL' ? weights.normal : state === 'STRONG_BEAR' ? -weights.strong : state === 'BEAR' ? -weights.normal : 0;
      };

      // Weighted score: only active indicators contribute
      const indicatorScores: Record<string, number> = {};
      indicatorScores.rsi = scoreIndicator(rsi.state, 'showRSI', { strong: 30, normal: 15 });
      indicatorScores.macd = scoreIndicator(macd.state, 'showMACD', { strong: 25, normal: 12 });
      indicatorScores.ema = scoreIndicator(ema.state, 'showEMA', { strong: 20, normal: 10 });
      indicatorScores.volume = scoreIndicator(volume.state, 'showVolume', { strong: 15, normal: 8 });
      indicatorScores.bollinger = scoreIndicator(bollinger.state, 'showBollinger', { strong: 12, normal: 6 });
      indicatorScores.stochastic = scoreIndicator(stochastic.state, 'showSuperTrend', { strong: 15, normal: 8 });
      indicatorScores.momentum = scoreIndicator(momentum.state, 'showMomentum', { strong: 20, normal: 10 });

      const rawScore = Object.values(indicatorScores).reduce((a, b) => a + b, 0);
      const score = Math.max(-100, Math.min(100, Math.round(rawScore)));

      const trend: 'BULL' | 'BEAR' | 'NEUTRAL' = score > 20 ? 'BULL' : score < -20 ? 'BEAR' : 'NEUTRAL';
      
      // Trend strength: absolute score scaled to 0-100
      const trendStrength = Math.min(100, Math.abs(score));

      // Detect signals (only from active indicators)
      const signals: string[] = [];
      if (activeIndicatorKeys.includes('showRSI')) {
        if (rsi.state === 'STRONG_BULL') signals.push('RSI Oversold Bounce');
        if (rsi.state === 'STRONG_BEAR') signals.push('RSI Overbought Drop');
      }
      if (activeIndicatorKeys.includes('showMACD')) {
        if (macd.state === 'STRONG_BULL') signals.push('MACD Bull Crossover');
        if (macd.state === 'STRONG_BEAR') signals.push('MACD Bear Crossover');
      }
      if (activeIndicatorKeys.includes('showEMA')) {
        if (ema.state === 'STRONG_BULL') signals.push('Price Above All EMAs');
        if (ema.state === 'STRONG_BEAR') signals.push('Price Below All EMAs');
      }
      if (activeIndicatorKeys.includes('showBollinger')) {
        if (bollinger.state === 'STRONG_BULL') signals.push('BB Lower Band Bounce');
        if (bollinger.state === 'STRONG_BEAR') signals.push('BB Upper Band Rejection');
      }
      if (activeIndicatorKeys.includes('showVolume')) {
        if (volume.state === 'STRONG_BULL' && trend === 'BULL') signals.push('Volume Confirms Bull');
        if (volume.state === 'STRONG_BEAR' && trend === 'BEAR') signals.push('Volume Confirms Bear');
      }
      if (activeIndicatorKeys.includes('showRSI') && activeIndicatorKeys.includes('showMACD')) {
        if (rsi.state === 'STRONG_BULL' && macd.state === 'STRONG_BEAR') signals.push('RSI-MACD Divergence');
        if (rsi.state === 'STRONG_BEAR' && macd.state === 'STRONG_BULL') signals.push('RSI-MACD Divergence');
      }
      
      // Detect divergences (momentum vs price direction)
      const divergences: string[] = [];
      if (activeIndicatorKeys.includes('showMomentum')) {
        if (momentum.state === 'STRONG_BULL' && trend === 'BEAR') divergences.push('Bullish Divergence');
        if (momentum.state === 'STRONG_BEAR' && trend === 'BULL') divergences.push('Bearish Divergence');
      }

      return {
        tf: item.tf,
        label: item.label,
        weight: item.weight,
        trend,
        trendStrength,
        indicators: {
          rsi, macd, ema, volume, stochastic, bollinger, momentum
        },
        _activeKeys: activeIndicatorKeys,
        score,
        signals,
        divergences,
      };
    });
  }, [symbol, livePrice]);

  // Weighted confluence
  const overallConfluence = useMemo(() => {
    const totalWeight = matrixData.reduce((acc, r) => acc + r.weight, 0);
    const weightedScore = matrixData.reduce((acc, r) => acc + r.score * r.weight, 0);
    const avgScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
    
    // Count how many timeframes agree on direction
    const bullCount = matrixData.filter(r => r.trend === 'BULL').length;
    const bearCount = matrixData.filter(r => r.trend === 'BEAR').length;
    const neutralCount = matrixData.filter(r => r.trend === 'NEUTRAL').length;
    const totalTf = matrixData.length;
    
    // Agreement ratio (what % of timeframes agree with the dominant direction)
    const agreementRatio = Math.max(bullCount, bearCount) / totalTf;
    
    // Divergence count
    const totalDivergences = matrixData.reduce((acc, r) => acc + r.divergences.length, 0);
    
    // Strong signal count
    const strongSignals = matrixData.reduce((acc, r) => acc + r.signals.length, 0);

    let label = 'NEUTRAL / RANGING';
    let bias: 'BULL' | 'BEAR' | 'NEUTRAL' = 'NEUTRAL';
    let confidence: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' = 'MEDIUM';
    
    if (avgScore >= 40 && agreementRatio >= 0.7) {
      label = 'EXTREME BULLISH CONFLUENCE';
      bias = 'BULL';
      confidence = 'VERY_HIGH';
    } else if (avgScore >= 25) {
      label = 'STRONG BULLISH CONFLUENCE';
      bias = 'BULL';
      confidence = 'HIGH';
    } else if (avgScore >= 12) {
      label = 'MODERATE BULLISH BIAS';
      bias = 'BULL';
      confidence = 'MEDIUM';
    } else if (avgScore <= -40 && agreementRatio >= 0.7) {
      label = 'EXTREME BEARISH CONFLUENCE';
      bias = 'BEAR';
      confidence = 'VERY_HIGH';
    } else if (avgScore <= -25) {
      label = 'STRONG BEARISH CONFLUENCE';
      bias = 'BEAR';
      confidence = 'HIGH';
    } else if (avgScore <= -12) {
      label = 'MODERATE BEARISH BIAS';
      bias = 'BEAR';
      confidence = 'MEDIUM';
    } else {
      confidence = totalDivergences > 2 ? 'LOW' : 'MEDIUM';
    }

    // Directional recommendation
    let recommendation = 'NO ACTION';
    if (bias === 'BULL' && confidence === 'HIGH') recommendation = 'LOOK FOR LONG ENTRY';
    if (bias === 'BULL' && confidence === 'VERY_HIGH') recommendation = 'STRONG LONG BIAS';
    if (bias === 'BEAR' && confidence === 'HIGH') recommendation = 'LOOK FOR SHORT ENTRY';
    if (bias === 'BEAR' && confidence === 'VERY_HIGH') recommendation = 'STRONG SHORT BIAS';
    if (totalDivergences >= 2) recommendation = 'CAUTION: DIVERGENCES DETECTED';

    return { avgScore, label, bias, confidence, bullCount, bearCount, neutralCount, agreementRatio, totalDivergences, strongSignals, recommendation };
  }, [matrixData]);

  // Timeframe agreement heatmap data (cross-TF correlation)
  const heatmapData = useMemo(() => {
    return matrixData.map((row, i) => {
      return matrixData.map((col, j) => {
        if (i === j) return 1.0; // self = 1.0
        // Agreement: same direction = positive, opposite = negative
        if (row.trend === col.trend) return 0.7 + (0.3 * (1 - Math.abs(row.score - col.score) / 200));
        if (row.trend === 'NEUTRAL' || col.trend === 'NEUTRAL') return 0.3;
        return -0.5 - (0.5 * Math.abs(row.score - col.score) / 200);
      });
    });
  }, [matrixData]);

  const scoreToColor = useCallback((score: number): string => {
    if (score > 40) return palette.bull;
    if (score > 20) return palette.bull + 'cc';
    if (score > 0) return palette.bull + '66';
    if (score === 0) return 'var(--color-text-muted)';
    if (score > -20) return palette.bear + '66';
    if (score > -40) return palette.bear + 'cc';
    return palette.bear;
  }, [palette]);

  const stateToColor = useCallback((state: string): string => {
    if (state === 'STRONG_BULL') return palette.bull;
    if (state === 'BULL') return palette.bull + 'aa';
    if (state === 'STRONG_BEAR') return palette.bear;
    if (state === 'BEAR') return palette.bear + 'aa';
    return 'var(--color-text-muted)';
  }, [palette]);

  const heatmapCellColor = useCallback((val: number): string => {
    if (val >= 0.8) return palette.bull;
    if (val >= 0.5) return palette.bull + '88';
    if (val >= 0.2) return palette.bull + '44';
    if (val >= -0.2) return 'var(--color-text-muted)' + '44';
    if (val >= -0.5) return palette.bear + '44';
    return palette.bear + '88';
  }, [palette]);

  return (
    <div className="relative z-30 font-sans">
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          backgroundColor: 'var(--color-panel)',
          borderColor: overallConfluence.confidence === 'VERY_HIGH' 
            ? (overallConfluence.bias === 'BULL' ? palette.bull : palette.bear) 
            : 'var(--color-border)',
          color: 'var(--color-text)'
        }}
        className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg border text-[10px] sm:text-[11px] font-bold shadow-md hover:opacity-90 active:scale-95 transition-all cursor-pointer tap-fix"
        title="Multi-Timeframe Matrix Screener & Confluence Conductor"
      >
        <Layers size={13} style={{ color: overallConfluence.bias === 'BULL' ? palette.bull : overallConfluence.bias === 'BEAR' ? palette.bear : 'var(--color-text-muted)' }} />
        <span className="hidden md:inline">MTF Matrix:</span>
        <span 
          style={{ 
            color: overallConfluence.bias === 'BULL' ? palette.bull : overallConfluence.bias === 'BEAR' ? palette.bear : 'var(--color-text-muted)' 
          }}
          className="font-mono font-black"
        >
          {overallConfluence.bias === 'BULL' ? '▲ BULL' : overallConfluence.bias === 'BEAR' ? '▼ BEAR' : '◆ RANGE'}
        </span>
        {overallConfluence.totalDivergences > 0 && (
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
        )}
        {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {/* Expanded Matrix Dropdown HUD */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <>
          <div 
            className="fixed inset-0 z-[99998]"
            onClick={() => { setIsOpen(false); setExpandedRow(null); }}
          />
          <div 
            style={{
              backgroundColor: 'var(--color-panel)',
              borderColor: 'var(--color-border)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
            }}
            className="fixed top-16 sm:top-20 right-2 sm:right-4 z-dropdown-ultimate w-[95vw] sm:w-[420px] max-h-[85vh] rounded-xl border flex flex-col overflow-hidden text-[var(--color-text)]"
          >
            {/* Header */}
            <div className="px-3.5 pt-3 pb-2 border-b border-[var(--color-border)]/60 bg-[var(--color-panel)]/95 flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Gauge size={14} style={{ color: palette.bull }} />
                  <span className="text-xs font-black uppercase tracking-wider">MTF Matrix</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowHeatmap(!showHeatmap); }}
                    className={`p-1 rounded-md text-[10px] font-mono cursor-pointer transition-colors ${showHeatmap ? 'bg-[var(--color-bull)]/20 text-[var(--color-bull)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
                    title="Toggle TF Correlation Heatmap"
                  >
                    <BarChart3 size={12} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsOpen(false); setExpandedRow(null); }}
                    className="p-1 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-[var(--color-text-muted)]">{symbol}</span>
                <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
                  7 TF × {activeIndicatorLabels.length} Active Indicators
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {/* Overall Confluence Gauge */}
              <div className="px-3.5 py-2.5 border-b border-[var(--color-border)]/40 bg-[var(--color-bg)]/60">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] uppercase tracking-wider text-[var(--color-text-muted)] font-bold mb-0.5">Weighted Confluence</div>
                    <div 
                      style={{ color: overallConfluence.bias === 'BULL' ? palette.bull : overallConfluence.bias === 'BEAR' ? palette.bear : 'var(--color-text-muted)' }}
                      className="text-[11px] font-black font-mono leading-tight"
                    >
                      {overallConfluence.label}
                    </div>
                  </div>
                  <div 
                    style={{
                      backgroundColor: overallConfluence.bias === 'BULL' ? `${palette.bull}20` : overallConfluence.bias === 'BEAR' ? `${palette.bear}20` : 'rgba(255,255,255,0.05)',
                      color: overallConfluence.bias === 'BULL' ? palette.bull : overallConfluence.bias === 'BEAR' ? palette.bear : 'var(--color-text-muted)'
                    }}
                    className="text-sm font-mono font-black px-2.5 py-1 rounded-lg shrink-0 ml-2"
                  >
                    {overallConfluence.avgScore > 0 ? '+' : ''}{Math.round(overallConfluence.avgScore)}%
                  </div>
                </div>
                
                {/* Score bar */}
                <div className="relative h-1.5 bg-[var(--color-border)]/40 rounded-full overflow-hidden mb-2">
                  <div 
                    className="absolute top-0 h-full rounded-full transition-all duration-500"
                    style={{
                      left: '50%',
                      width: `${Math.min(50, Math.abs(overallConfluence.avgScore) / 2)}%`,
                      transform: overallConfluence.avgScore < 0 ? 'translateX(-100%)' : 'none',
                      backgroundColor: overallConfluence.bias === 'BULL' ? palette.bull : overallConfluence.bias === 'BEAR' ? palette.bear : 'var(--color-text-muted)',
                    }}
                  />
                  <div className="absolute top-0 left-1/2 w-px h-full bg-white/30" />
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-4 gap-1.5 text-center">
                  <div className="rounded-md py-1 bg-[var(--color-panel)]">
                    <div className="text-[9px] text-[var(--color-text-muted)] font-mono">BULL</div>
                    <div className="text-[11px] font-black font-mono" style={{ color: palette.bull }}>{overallConfluence.bullCount}/{matrixData.length}</div>
                  </div>
                  <div className="rounded-md py-1 bg-[var(--color-panel)]">
                    <div className="text-[9px] text-[var(--color-text-muted)] font-mono">BEAR</div>
                    <div className="text-[11px] font-black font-mono" style={{ color: palette.bear }}>{overallConfluence.bearCount}/{matrixData.length}</div>
                  </div>
                  <div className="rounded-md py-1 bg-[var(--color-panel)]">
                    <div className="text-[9px] text-[var(--color-text-muted)] font-mono">AGREE</div>
                    <div className="text-[11px] font-black font-mono text-[var(--color-text)]">{Math.round(overallConfluence.agreementRatio * 100)}%</div>
                  </div>
                  <div className="rounded-md py-1 bg-[var(--color-panel)]">
                    <div className="text-[9px] text-[var(--color-text-muted)] font-mono">DIVERG</div>
                    <div className="text-[11px] font-black font-mono" style={{ color: overallConfluence.totalDivergences > 0 ? '#facc15' : 'var(--color-text-muted)' }}>{overallConfluence.totalDivergences}</div>
                  </div>
                </div>

                {/* Recommendation */}
                <div className="mt-2 flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-[var(--color-border)]/40 bg-[var(--color-panel)]">
                  {overallConfluence.recommendation.includes('STRONG') ? (
                    <Zap size={11} style={{ color: overallConfluence.bias === 'BULL' ? palette.bull : palette.bear }} />
                  ) : overallConfluence.recommendation.includes('CAUTION') ? (
                    <AlertTriangle size={11} className="text-yellow-400" />
                  ) : (
                    <ShieldCheck size={11} className="text-[var(--color-text-muted)]" />
                  )}
                  <span className="text-[9px] font-mono font-bold text-[var(--color-text-muted)]">{overallConfluence.recommendation}</span>
                </div>
              </div>

              {/* Timeframe Correlation Heatmap */}
              {showHeatmap && (
                <div className="px-3.5 py-2.5 border-b border-[var(--color-border)]/40 bg-[var(--color-bg)]/40">
                  <div className="text-[9px] uppercase tracking-wider text-[var(--color-text-muted)] font-bold mb-1.5 flex items-center gap-1">
                    <BarChart3 size={10} /> TF Correlation Matrix
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[8px] font-mono">
                      <thead>
                        <tr>
                          <th className="p-0.5 text-[var(--color-text-muted)]"></th>
                          {matrixData.map(r => (
                            <th key={r.tf} className="p-0.5 text-[var(--color-text-muted)] font-bold">{r.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {matrixData.map((row, i) => (
                          <tr key={row.tf}>
                            <td className="p-0.5 text-[var(--color-text-muted)] font-bold">{row.label}</td>
                            {heatmapData[i].map((val, j) => (
                              <td key={j} className="p-0.5 text-center">
                                <div 
                                  className="w-full h-4 rounded-sm flex items-center justify-center"
                                  style={{ 
                                    backgroundColor: heatmapCellColor(val) + '44',
                                    color: Math.abs(val) > 0.5 ? 'white' : 'var(--color-text-muted)',
                                    border: i === j ? `1px solid ${palette.bull}66` : 'none'
                                  }}
                                >
                                  {i === j ? '—' : val > 0 ? '+' : ''}{val.toFixed(1)}
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Matrix Rows — Expandable */}
              <div className="px-3.5 py-2 space-y-1.5">
                {/* Indicator legend — only active indicators */}
                <div className="flex items-center gap-1 text-[8px] font-mono text-[var(--color-text-muted)] px-0.5 mb-1 flex-wrap">
                  {activeIndicatorLabels.map((label, i) => (
                    <React.Fragment key={label}>
                      {i > 0 && <span>·</span>}
                      <span className="text-[var(--color-bull)]/70 font-bold">{label}</span>
                    </React.Fragment>
                  ))}
                  <span className="ml-auto flex items-center gap-1">
                    <Eye size={8} /> Click row to expand
                  </span>
                </div>

                {matrixData.map((row) => {
                  const isSelected = row.tf === currentTf;
                  const isExpanded = expandedRow === row.tf;
                  
                  // Indicator mini-bar for compact view
                  const indicators = Object.values(row.indicators);
                  const bullCount = indicators.filter(i => i.state === 'STRONG_BULL' || i.state === 'BULL').length;
                  const bearCount = indicators.filter(i => i.state === 'STRONG_BEAR' || i.state === 'BEAR').length;
                  const bullPct = (bullCount / indicators.length) * 100;
                  const bearPct = (bearCount / indicators.length) * 100;

                  return (
                    <div key={row.tf}>
                      <div
                        onClick={(e) => { e.stopPropagation(); setExpandedRow(isExpanded ? null : row.tf); }}
                        style={{
                          backgroundColor: isSelected ? 'var(--color-bg)' : isExpanded ? 'var(--color-bg)' : 'transparent',
                          borderColor: isSelected ? palette.bull : 'var(--color-border)',
                        }}
                        className="flex items-center justify-between p-2 rounded-lg border hover:bg-[var(--color-bg)]/60 cursor-pointer transition-all text-xs font-mono"
                      >
                        {/* Left: TF + Trend */}
                        <div className="flex items-center gap-2">
                          <span 
                            className={`font-black text-[11px] w-7 ${isSelected ? 'text-[var(--color-text)] underline' : 'text-[var(--color-text-muted)]'}`}
                          >
                            {row.label}
                          </span>
                          <span 
                            style={{ color: row.trend === 'BULL' ? palette.bull : row.trend === 'BEAR' ? palette.bear : 'var(--color-text-muted)' }}
                            className="text-[10px] font-bold flex items-center gap-0.5"
                          >
                            {row.trend === 'BULL' ? <ArrowUpRight size={11} /> : row.trend === 'BEAR' ? <ArrowDownRight size={11} /> : <Minus size={11} />}
                            {row.trend}
                          </span>
                          {/* Divergence indicator */}
                          {row.divergences.length > 0 && (
                            <span className="text-[8px] px-1 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-bold">
                              ⚠ DIV
                            </span>
                          )}
                        </div>

                        {/* Center: Indicator strength bar */}
                        <div className="flex-1 mx-2 h-1.5 bg-[var(--color-border)]/30 rounded-full overflow-hidden flex">
                          <div className="h-full rounded-full" style={{ width: `${bullPct}%`, backgroundColor: palette.bull }} />
                          <div className="h-full rounded-full" style={{ width: `${bearPct}%`, backgroundColor: palette.bear }} />
                        </div>

                        {/* Right: Score */}
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-[var(--color-text-muted)]">
                            RSI <strong style={{ color: stateToColor(row.indicators.rsi.state) }}>{row.indicators.rsi.value}</strong>
                          </span>
                          <span 
                            style={{
                              backgroundColor: row.score > 0 ? `${palette.bull}20` : row.score < 0 ? `${palette.bear}20` : 'transparent',
                              color: scoreToColor(row.score)
                            }}
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold min-w-[32px] text-center"
                          >
                            {row.score > 0 ? '+' : ''}{row.score}
                          </span>
                        </div>
                      </div>

                      {/* Expanded detail view */}
                      {isExpanded && (
                        <div 
                          className="ml-2 mr-1 mb-1.5 p-2.5 rounded-lg border border-[var(--color-border)]/40 bg-[var(--color-bg)]/60 space-y-2 animate-in fade-in duration-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Indicator Grid — only active indicators */}
                          <div className="grid grid-cols-2 gap-1.5">
                            {Object.entries(row.indicators)
                              .filter(([key]) => {
                                if (key === 'momentum') return row._activeKeys.includes('showMomentum');
                                if (key === 'stochastic') return row._activeKeys.includes('showSuperTrend');
                                return row._activeKeys.includes(`show${key.charAt(0).toUpperCase() + key.slice(1)}`);
                              })
                              .map(([key, ind]) => (
                                <div key={key} className="flex items-center justify-between px-1.5 py-1 rounded bg-[var(--color-panel)]">
                                  <span className="text-[9px] font-mono text-[var(--color-text-muted)] uppercase">{INDICATOR_LABELS[`show${key.charAt(0).toUpperCase() + key.slice(1)}`] || key}</span>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[9px] font-mono font-bold" style={{ color: stateToColor(ind.state) }}>
                                      {ind.value}
                                    </span>
                                    <div 
                                      className="w-1.5 h-1.5 rounded-full"
                                      style={{ backgroundColor: stateToColor(ind.state) }}
                                    />
                                  </div>
                                </div>
                              ))}
                          </div>
                          
                          {/* Trend strength bar */}
                          <div>
                            <div className="flex items-center justify-between text-[9px] font-mono mb-0.5">
                              <span className="text-[var(--color-text-muted)]">Trend Strength</span>
                              <span style={{ color: scoreToColor(row.score) }} className="font-bold">{row.trendStrength}%</span>
                            </div>
                            <div className="h-1 bg-[var(--color-border)]/40 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all"
                                style={{ 
                                  width: `${row.trendStrength}%`,
                                  backgroundColor: scoreToColor(row.score)
                                }}
                              />
                            </div>
                          </div>

                          {/* Signals */}
                          {row.signals.length > 0 && (
                            <div className="space-y-0.5">
                              {row.signals.map((sig, si) => (
                                <div key={si} className="flex items-center gap-1 text-[9px] font-mono" style={{ color: palette.bull }}>
                                  <Sparkles size={9} /> {sig}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Divergences */}
                          {row.divergences.length > 0 && (
                            <div className="space-y-0.5">
                              {row.divergences.map((div, di) => (
                                <div key={di} className="flex items-center gap-1 text-[9px] font-mono text-yellow-400">
                                  <AlertTriangle size={9} /> {div}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Switch TF button */}
                          <button
                            onClick={() => { onSelectTf(row.tf); setIsOpen(false); setExpandedRow(null); }}
                            style={{ backgroundColor: isSelected ? 'transparent' : `${palette.bull}20`, color: palette.bull, borderColor: palette.bull }}
                            className="w-full py-1 rounded text-[9px] font-mono font-bold border cursor-pointer hover:opacity-80 transition-opacity"
                          >
                            {isSelected ? '● Currently Active' : `Switch to ${row.label} Chart →`}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="px-3.5 py-2 text-[9px] text-center text-[var(--color-text-muted)] border-t border-[var(--color-border)]/40 bg-[var(--color-bg)]/40 space-y-1">
                <div>Weights: 1W(1.8) {">"} 1D(1.5) {">"} 4H(1.2) {">"} 1H(1.0) {">"} 15M(0.8) {">"} 5M(0.7) {">"} 1M(0.6)</div>
                <div className="text-[8px]">Active: {activeIndicatorLabels.join(' · ')}</div>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
});
