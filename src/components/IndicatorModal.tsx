import { useState, useEffect } from 'react';

import { 
  IndicatorSettings, 
  PriceSource, 
  DEFAULT_INDICATOR_SETTINGS 
} from '../utils/indicators';
import { 
  Sliders, 
  X, 
  Sparkles, 
  Activity, 
  Layers, 
  Flame, 
  ChevronDown, 
  ChevronRight, 
  RotateCcw, 
  Search, 
  Palette, 
  SlidersHorizontal,
  Eye,
  EyeOff,
  BookOpen,
  Plus
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

import { LiquidityHeatmapGuideModal } from './LiquidityHeatmapGuideModal';
import { LeftVolumeProfileGuideModal } from './LeftVolumeProfileGuideModal';
import { CandleCvdGuideModal } from './CandleCvdGuideModal';

interface IndicatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: IndicatorSettings;
  onUpdateSettings: (newSettings: IndicatorSettings) => void;
  onOpenFootprintSettings?: () => void;
  initialFocusedKey?: string | null;
}

function sanitizeIndicatorSettings(settings?: Partial<IndicatorSettings> | null): IndicatorSettings {
  return {
    ...DEFAULT_INDICATOR_SETTINGS,
    ...(settings || {}),
    liquidityHeatmapConfig: {
      ...DEFAULT_INDICATOR_SETTINGS.liquidityHeatmapConfig,
      ...(settings?.liquidityHeatmapConfig || {}),
    },
    volumeProfileConfig: {
      ...DEFAULT_INDICATOR_SETTINGS.volumeProfileConfig,
      ...(settings?.volumeProfileConfig || {}),
    },
    ema20Config: {
      ...DEFAULT_INDICATOR_SETTINGS.ema20Config,
      ...(settings?.ema20Config || {}),
    },
    ema50Config: {
      ...DEFAULT_INDICATOR_SETTINGS.ema50Config,
      ...(settings?.ema50Config || {}),
    },
    ema200Config: {
      ...DEFAULT_INDICATOR_SETTINGS.ema200Config,
      ...(settings?.ema200Config || {}),
    },
    bollingerConfig: {
      ...DEFAULT_INDICATOR_SETTINGS.bollingerConfig,
      ...(settings?.bollingerConfig || {}),
    },
    superTrendConfig: {
      ...DEFAULT_INDICATOR_SETTINGS.superTrendConfig,
      ...(settings?.superTrendConfig || {}),
    },
    rsiConfig: {
      ...DEFAULT_INDICATOR_SETTINGS.rsiConfig,
      ...(settings?.rsiConfig || {}),
    },
    macdConfig: {
      ...DEFAULT_INDICATOR_SETTINGS.macdConfig,
      ...(settings?.macdConfig || {}),
    },
    icdCandlesConfig: {
      ...DEFAULT_INDICATOR_SETTINGS.icdCandlesConfig,
      ...(settings?.icdCandlesConfig || {}),
    },
  };
}

export default function IndicatorModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onOpenFootprintSettings,
  initialFocusedKey,
}: IndicatorModalProps) {
  const [localSettings, setLocalSettings] = useState<IndicatorSettings>(() =>
    sanitizeIndicatorSettings(settings)
  );
  const [activeTab, setActiveTab] = useState<'all' | 'trend' | 'volatility' | 'oscillator' | 'orderflow'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && initialFocusedKey) {
      setExpandedKey(initialFocusedKey);
    }
  }, [isOpen, initialFocusedKey]);
  const [showLiquidityGuide, setShowLiquidityGuide] = useState(false);
  const [showLeftVpGuide, setShowLeftVpGuide] = useState(false);
  const [showIcdCandlesGuide, setShowIcdCandlesGuide] = useState(false);
  const { palette, theme } = useTheme();

  const isEmerald = theme === 'Standard Spartan Edge Theme' || theme === 'Dark ICT Theme' || theme === 'MountAlgo Themes' || theme === 'DEX Deep';
  const isCyan = theme === 'MountAlgo Frost' || theme === 'Deep Sea';
  const isRose = theme === 'MountAlgo Cyber' || theme === 'Spartan Edge Theme';
  const isAmber = theme === 'Garuda Gold' || theme === 'Gear Protocol' || theme === 'MountAlgo Super Premium Theme';
  const isPurple = theme === 'MountAlgo Neon';

  const dynamicBgClass = isEmerald
    ? 'bg-gradient-to-br from-zinc-950 via-emerald-950/25 to-zinc-950 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.06)]'
    : isCyan
    ? 'bg-gradient-to-br from-zinc-950 via-cyan-950/25 to-zinc-950 border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.06)]'
    : isRose
    ? 'bg-gradient-to-br from-zinc-950 via-rose-950/25 to-zinc-950 border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.06)]'
    : isAmber
    ? 'bg-gradient-to-br from-zinc-950 via-amber-950/25 to-zinc-950 border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.06)]'
    : isPurple
    ? 'bg-gradient-to-br from-zinc-950 via-purple-950/25 to-zinc-950 border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.06)]'
    : 'bg-gradient-to-br from-[var(--color-panel)] via-[var(--color-panel)]/90 to-[var(--color-panel)] border-[var(--color-border)]';

  const accentTextClass = isEmerald
    ? 'text-emerald-400'
    : isCyan
    ? 'text-cyan-400'
    : isRose
    ? 'text-rose-400'
    : isAmber
    ? 'text-amber-400'
    : isPurple
    ? 'text-purple-400'
    : 'text-zinc-300';

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

  useEffect(() => {
    setLocalSettings((prev) => {
      const sanitized = sanitizeIndicatorSettings(settings);
      if (JSON.stringify(prev) !== JSON.stringify(sanitized)) {
        return sanitized;
      }
      return prev;
    });
  }, [settings]);

  if (!isOpen) return null;

  const toggle = (key: keyof IndicatorSettings) => {
    const updated = { ...localSettings, [key]: !localSettings[key] };
    setLocalSettings(updated);
    onUpdateSettings(updated);
  };

  const updateSubConfig = <K extends keyof IndicatorSettings>(
    configKey: K,
    patch: Partial<NonNullable<IndicatorSettings[K]>>
  ) => {
    const currentConfig = (localSettings[configKey] as any) || {};
    const updated = {
      ...localSettings,
      [configKey]: {
        ...currentConfig,
        ...patch,
      },
    };
    setLocalSettings(updated);
    onUpdateSettings(updated);
  };

  const applyPreset = (preset: 'scalp' | 'day' | 'swing' | 'default') => {
    let updated: IndicatorSettings;
    if (preset === 'default') {
      updated = { ...DEFAULT_INDICATOR_SETTINGS };
    } else if (preset === 'scalp') {
      updated = {
        ...localSettings,
        showEma20: true,
        showSuperTrend: true,
        showRSI: true,
        showVolume: true,
        ema20Config: { ...localSettings.ema20Config!, period: 9 },
        superTrendConfig: { ...localSettings.superTrendConfig!, atrPeriod: 7, factor: 2.0 },
        rsiConfig: { ...localSettings.rsiConfig!, period: 7 },
      };
    } else if (preset === 'day') {
      updated = {
        ...localSettings,
        showEma20: true,
        showEma50: true,
        showBollinger: true,
        showMACD: true,
        showVolume: true,
        ema20Config: { ...localSettings.ema20Config!, period: 20 },
        ema50Config: { ...localSettings.ema50Config!, period: 50 },
        bollingerConfig: { ...localSettings.bollingerConfig!, period: 20, multiplier: 2.0 },
      };
    } else {
      // swing
      updated = {
        ...localSettings,
        showEma50: true,
        showEma200: true,
        showSuperTrend: true,
        showMACD: true,
        ema50Config: { ...localSettings.ema50Config!, period: 50 },
        ema200Config: { ...localSettings.ema200Config!, period: 200 },
        superTrendConfig: { ...localSettings.superTrendConfig!, atrPeriod: 14, factor: 3.5 },
      };
    }
    setLocalSettings(updated);
    onUpdateSettings(updated);
  };

  const indicatorList: {
    key: keyof IndicatorSettings;
    configKey?: keyof IndicatorSettings;
    title: string;
    description: string;
    badge: string;
    category: 'trend' | 'volatility' | 'oscillator' | 'orderflow';
    isBookmap?: boolean;
    isFootprint?: boolean;
    colorIndicator: string;
  }[] = [
    {
      key: 'showLiquidityHeatmap',
      configKey: 'liquidityHeatmapConfig',
      title: 'Liquidity Heatmap Depth Overlay (Real-time Limit Density)',
      description: 'Dynamic order book depth map rendering resting limit buy/sell density, historical depth trails, institutional resting walls, and liquidity absorption.',
      badge: 'ORDER FLOW PRO',
      category: 'orderflow',
      colorIndicator: palette.bull,
    },
    {
      key: 'showFootprints',
      title: 'MTF Footprints V7.2 𝙈𝙤𝙪𝙣𝙩𝘼𝙡𝙜𝙤 (Order Flow Profiler)',
      description: 'Institutional Multi-Timeframe Volume Profile, Bid/Ask & Delta Footprint, Diagonal Imbalances (3x-4x), HTF candle session, POC & S/R mitigations.',
      badge: 'ORDER FLOW PRO',
      category: 'orderflow',
      isFootprint: true,
      colorIndicator: palette.poc,
    },
    {
      key: 'showSuperTrend',
      configKey: 'superTrendConfig',
      title: '𝙈𝙤𝙪𝙣𝙩𝘼𝙡𝙜𝙤 SuperTrend AI Cloud',
      description: 'Calculates ATR-based dynamic volatility stop & instant BUY / SELL signal markers.',
      badge: 'PRO EXCLUSIVE',
      category: 'trend',
      colorIndicator: localSettings.superTrendConfig?.bullColor || palette.bull,
    },
    {
      key: 'showEma20',
      configKey: 'ema20Config',
      title: 'EMA 20 (Fast Trend)',
      description: 'Exponential Moving Average for immediate momentum direction and micro pullbacks.',
      badge: 'TREND',
      category: 'trend',
      colorIndicator: localSettings.ema20Config?.color || '#00e5ff',
    },
    {
      key: 'showEma50',
      configKey: 'ema50Config',
      title: 'EMA 50 (Intermediate Trend)',
      description: 'Exponential Moving Average baseline for intraday and swing trading pullbacks.',
      badge: 'TREND',
      category: 'trend',
      colorIndicator: localSettings.ema50Config?.color || '#a855f7',
    },
    {
      key: 'showEma200',
      configKey: 'ema200Config',
      title: 'EMA 200 (Macro / Golden Cross)',
      description: '200-period institutional baseline indicating macro bull/bear cycles.',
      badge: 'MACRO',
      category: 'trend',
      colorIndicator: localSettings.ema200Config?.color || '#f59e0b',
    },
    {
      key: 'showBollinger',
      configKey: 'bollingerConfig',
      title: 'Bollinger Bands (20, 2.0)',
      description: 'SMA baseline with dynamic upper and lower standard deviation volatility channels.',
      badge: 'VOLATILITY',
      category: 'volatility',
      colorIndicator: localSettings.bollingerConfig?.upperColor || '#3b82f6',
    },
    {
      key: 'showVolumeProfile',
      configKey: 'volumeProfileConfig',
      title: 'Volume Profile (VPVR Y-Axis Overlay)',
      description: 'Overlay profil volume horizontal pada sumbu Y (Price Axis) menampilkan distribusi volume, 70% Value Area (VAH/VAL), Point of Control (POC), dan High/Low Volume Nodes (HVN/LVN).',
      badge: 'ORDER FLOW PRO',
      category: 'orderflow',
      colorIndicator: palette.poc || '#f59e0b',
    },
    {
      key: 'showVolume',
      configKey: 'volumeConfig',
      title: 'Volume Histogram & Moving Average',
      description: 'Live tick transaction volume bars color-coded with dynamic SMA line.',
      badge: 'VOLUME',
      category: 'volatility',
      colorIndicator: palette.bull,
    },
    {
      key: 'showVolumeDelta',
      configKey: undefined,
      title: 'CVD (Cumulative Volume Delta) Oscillator',
      description: 'Institutional macro sub-panel tracking accumulated bid/ask delta to spot hidden iceberg divergencies.',
      badge: 'ORDER FLOW',
      category: 'oscillator',
      colorIndicator: '#f59e0b',
    },
    {
      key: 'showIcdCandles',
      configKey: 'icdCandlesConfig',
      title: 'CVD Candles',
      description: 'Oscillator sub-panel delta kumulatif profesional — dirender sebagai lilin (candles) dengan smoothing, tema presisi, SMA overlay & penanda divergensi tingkat lanjut.',
      badge: 'ORDER FLOW PRO',
      category: 'oscillator',
      colorIndicator: localSettings.icdCandlesConfig?.lineColor || '#f59e0b',
    },
    {
      key: 'showRSI',
      configKey: 'rsiConfig',
      title: 'RSI 14 (Relative Strength Index)',
      description: 'Oscillator (0-100) with customizable overbought and oversold dynamic bands.',
      badge: 'OSCILLATOR',
      category: 'oscillator',
      colorIndicator: localSettings.rsiConfig?.rsiColor || '#8b5cf6',
    },
    {
      key: 'showMACD',
      configKey: 'macdConfig',
      title: 'MACD (12, 26, 9) Histogram',
      description: 'Moving Average Convergence Divergence with fast/slow lines and signal crossover.',
      badge: 'OSCILLATOR',
      category: 'oscillator',
      colorIndicator: localSettings.macdConfig?.macdColor || '#3b82f6',
    },
  ];

  const filteredList = indicatorList.filter((item) => {
    const matchesTab = activeTab === 'all' || item.category === activeTab;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.badge.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const sources: { id: PriceSource; label: string }[] = [
    { id: 'close', label: 'Close (Penutupan)' },
    { id: 'open', label: 'Open (Pembukaan)' },
    { id: 'high', label: 'High (Tertinggi)' },
    { id: 'low', label: 'Low (Terendah)' },
    { id: 'hl2', label: 'HL/2 (Median)' },
    { id: 'hlc3', label: 'HLC/3 (Tipikal)' },
  ];

  return (
    <div className="fixed top-[60px] left-4 right-4 sm:left-auto bottom-4 z-modal-ultimate flex flex-col justify-start pointer-events-none animate-fadeIn">
      <CandleCvdGuideModal
        isOpen={showIcdCandlesGuide}
        onClose={() => setShowIcdCandlesGuide(false)}
      />
      <div 
        className="bg-[var(--color-panel)]/80 backdrop-blur-2xl rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.2)] w-full sm:w-[480px] md:w-[540px] overflow-hidden flex flex-col h-[calc(100vh-80px)] pointer-events-auto border relative"
        style={{ borderColor: `${palette.bull}40` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 pointer-events-none" />
        {/* Modal Header */}
        <div className="relative p-3.5 sm:p-4 border-b border-[var(--color-border)]/30 flex items-center justify-between bg-[var(--color-panel)]/40 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div>
              <span className="font-bold text-[var(--color-text)] text-sm sm:text-base flex items-center gap-1.5">
                Pengaturan Indikator & Algoritma Analitik
              </span>
              <span className="text-[10px] text-[var(--color-text-muted)] block font-mono">
                Preset & Parameter Kustomisasi Detail
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-1 rounded hover:bg-[var(--color-panel)] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Toolbar: Strategy Presets & Search */}
        <div className="relative p-3 bg-[var(--color-panel)]/40 border-b border-[var(--color-border)]/20 flex flex-col sm:flex-row gap-2.5 items-center justify-between">
          {/* Strategy Preset Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[11px] text-[var(--color-text-muted)] font-mono uppercase shrink-0">Preset:</span>
            <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
              <select
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    applyPreset(e.target.value as any);
                    e.target.value = "";
                  }
                }}
                className="bg-[var(--color-panel)]/60 border border-[var(--color-border)]/30 rounded-lg px-2.5 py-1.5 text-xs text-[var(--color-text)] font-semibold outline-none cursor-pointer hover:border-cyan-500/50 transition-colors min-w-[170px]"
              >
                <option value="" disabled>Pilih Preset Strategi...</option>
                <option value="scalp">⚡ Scalping (M1 / M5)</option>
                <option value="day">📈 Day Trade (M15 / H1)</option>
                <option value="swing">🌊 Swing (H4 / D1)</option>
                <option value="default">🔄 Reset Default</option>
              </select>
              <button
                type="button"
                onClick={() => applyPreset('default')}
                className="p-1.5 rounded-lg bg-[var(--color-panel)]/60 hover:bg-white/5 text-[var(--color-text-muted)] hover:text-white border border-[var(--color-border)]/30 cursor-pointer shrink-0 transition-colors"
                title="Reset Indikator ke Default"
              >
                <RotateCcw size={13} />
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-56">
            <Search size={13} className="absolute left-2.5 top-2.5 text-cyan-500" />
            <input
              type="text"
              placeholder="Cari indikator..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 bg-[var(--color-panel)]/60 border border-[var(--color-border)]/30 rounded-lg text-xs text-[var(--color-text)] focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="relative flex border-b border-[var(--color-border)]/20 bg-[var(--color-panel)]/40 px-3 gap-1 overflow-x-auto scrollbar-thin">
          {[
            { id: 'all', label: 'Semua Indikator' },
            { id: 'trend', label: 'Trend & Moving Average' },
            { id: 'volatility', label: 'Volatilitas & Volume' },
            { id: 'oscillator', label: 'Oscillator (RSI/MACD)' },
            { id: 'orderflow', label: 'Order Flow & Profiler' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={activeTab === tab.id ? { color: palette.bull, borderBottomColor: palette.bull } : {}}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-cyan-400 font-bold'
                  : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Indicator List & Detailed Accordion */}
        <div className="relative flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-[#181826]/60 custom-scrollbar">
          {filteredList.map((ind) => {
            const active = (localSettings as any)[ind.key];
            const isExpanded = expandedKey === ind.key;

            return (
              <div
                key={ind.key}
                className={`rounded-lg border transition-all ${
                  active
                    ? 'bg-[var(--color-panel)]/60 border-cyan-500/50'
                    : 'bg-[var(--color-panel)]/40 border-[var(--color-border)] hover:border-[var(--color-border)]/50'
                }`}
                style={active ? { borderColor: `${palette.bull}70`, backgroundColor: `${palette.bull}10` } : {}}
              >
                {/* Item Summary Header */}
                <div 
                  className="p-3 flex items-center justify-between gap-3 cursor-pointer"
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('button')) return;
                    if (ind.key === 'showFootprints') {
                        if (typeof window !== 'undefined') {
                             window.dispatchEvent(new CustomEvent('mountalgo_toggle_footprint', { detail: { active: !localSettings.showFootprints } }));
                        }
                    }
                    toggle(ind.key as keyof IndicatorSettings);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-3.5 h-3.5 rounded-full mt-1 flex-shrink-0"
                      style={{ backgroundColor: ind.colorIndicator }}
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[var(--color-text)] text-sm">{ind.title}</span>
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold border"
                          style={{
                            backgroundColor: `${palette.bull}20`,
                            color: palette.bull,
                            borderColor: `${palette.bull}50`,
                          }}
                        >
                          {ind.badge}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5 leading-relaxed">{ind.description}</p>

                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Guide Button for Heatmap, Bookmap & CVD Candles */}
                    {ind.key === 'showIcdCandles' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedKey('showIcdCandles');
                          setShowIcdCandlesGuide(true);
                        }}
                        className="text-amber-400 hover:text-amber-300 p-1 px-1.5 rounded bg-amber-500/10 border border-amber-500/30 cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                        title="Buka Panduan Penggunaan CVD Candles"
                      >
                        <BookOpen size={12} />
                        <span className="hidden sm:inline">Panduan</span>
                      </button>
                    )}

                    {ind.key === 'showLiquidityHeatmap' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowLiquidityGuide(true);
                        }}
                        className="text-amber-400 hover:text-amber-300 p-1 px-1.5 rounded bg-amber-500/10 border border-amber-500/30 cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                        title="Buka Panduan Lengkap"
                      >
                        <BookOpen size={12} />
                        <span className="hidden sm:inline">Panduan</span>
                      </button>
                    )}

                     {/* Expand Detail Settings Button */}
                    {ind.configKey && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedKey(isExpanded ? null : (ind.key as string));
                        }}
                        className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-1 rounded bg-[var(--color-panel)] border border-[var(--color-border)] cursor-pointer flex items-center gap-1 text-[10px]"
                        title="Atur Parameter Detail"
                      >
                        <SlidersHorizontal size={12} style={{ color: palette.bull }} />
                        <span className="hidden sm:inline">Detail</span>
                        {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      </button>
                    )}

                    {/* Toggle Switch */}
                    <div
                      className="w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer"
                      style={{
                        backgroundColor: active ? palette.bull : '#2a2a3e',
                      }}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          active ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </div>
                </div>



                {ind.isFootprint && onOpenFootprintSettings && (
                  <div className="px-3 pb-3 pt-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenFootprintSettings();
                      }}
                      className="text-[10px] font-mono px-2.5 py-1 rounded cursor-pointer transition-colors border flex items-center gap-1.5"
                      style={{
                        backgroundColor: `${palette.bull}20`,
                        borderColor: `${palette.bull}60`,
                        color: '#ffffff',
                      }}
                    >
                      <Flame size={12} style={{ color: palette.bull }} />
                      Konfigurasi MTF Footprints V7.2 & Cluster Delta
                    </button>
                  </div>
                )}

                {/* Detailed Configuration Drawer */}
                {isExpanded && ind.configKey && (
                  <div className="p-3 bg-[var(--color-panel)]/60 border-t border-[var(--color-border)]/30 space-y-3 animate-fadeIn text-xs rounded-b-xl">
                    {/* Volume Profile VPVR Config */}
                    {ind.configKey === 'volumeProfileConfig' && localSettings.volumeProfileConfig && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="text-[var(--color-text-muted)] block mb-1">Posisi Layout:</label>
                            <select
                              value={localSettings.volumeProfileConfig.layout}
                              onChange={(e) =>
                                updateSubConfig('volumeProfileConfig', {
                                  layout: e.target.value as 'right' | 'left',
                                })
                              }
                              className="w-full bg-[var(--color-panel)] border border-[var(--color-border)] rounded p-1.5 text-[var(--color-text)] font-medium"
                            >
                              <option value="right">Kanan (Melekat Sumbu Y / Price Axis)</option>
                              <option value="left">Kiri (Edge Kiri Chart)</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[var(--color-text-muted)] block mb-1">
                              Lebar Profil ({localSettings.volumeProfileConfig.widthPercent}%):
                            </label>
                            <input
                              type="range"
                              min="10"
                              max="35"
                              step="1"
                              value={localSettings.volumeProfileConfig.widthPercent}
                              onChange={(e) =>
                                updateSubConfig('volumeProfileConfig', {
                                  widthPercent: parseInt(e.target.value, 10),
                                })
                              }
                              className="w-full accent-[#f59e0b]"
                            />
                          </div>
                          <div>
                            <label className="text-[var(--color-text-muted)] block mb-1">
                              Value Area ({localSettings.volumeProfileConfig.valueAreaPercent}%):
                            </label>
                            <input
                              type="range"
                              min="50"
                              max="90"
                              step="5"
                              value={localSettings.volumeProfileConfig.valueAreaPercent}
                              onChange={(e) =>
                                updateSubConfig('volumeProfileConfig', {
                                  valueAreaPercent: parseInt(e.target.value, 10),
                                })
                              }
                              className="w-full accent-[#f59e0b]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[var(--color-text-muted)] block mb-1">Mode Pewarnaan Bar:</label>
                            <select
                              value={localSettings.volumeProfileConfig.colorMode}
                              onChange={(e) =>
                                updateSubConfig('volumeProfileConfig', {
                                  colorMode: e.target.value as 'upDown' | 'delta',
                                })
                              }
                              className="w-full bg-[var(--color-panel)] border border-[var(--color-border)] rounded p-1.5 text-[var(--color-text)] font-medium"
                            >
                              <option value="upDown">Dual Split (Buy Hijau / Sell Merah)</option>
                              <option value="delta">Net Delta Gradient</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[var(--color-text-muted)] block mb-1">
                              Opasitas ({Math.round(localSettings.volumeProfileConfig.opacity * 100)}%):
                            </label>
                            <input
                              type="range"
                              min="0.2"
                              max="1.0"
                              step="0.05"
                              value={localSettings.volumeProfileConfig.opacity}
                              onChange={(e) =>
                                updateSubConfig('volumeProfileConfig', {
                                  opacity: parseFloat(e.target.value),
                                })
                              }
                              className="w-full accent-[#f59e0b]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-[var(--color-border)]/50">
                          <label className="flex items-center gap-2 cursor-pointer text-[var(--color-text)]">
                            <input
                              type="checkbox"
                              checked={localSettings.volumeProfileConfig.showPocLine}
                              onChange={(e) =>
                                updateSubConfig('volumeProfileConfig', {
                                  showPocLine: e.target.checked,
                                })
                              }
                              className="rounded text-[#f59e0b] focus:ring-[#f59e0b]"
                            />
                            <span>Garis Ray POC</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-[var(--color-text)]">
                            <input
                              type="checkbox"
                              checked={localSettings.volumeProfileConfig.showVahValLines}
                              onChange={(e) =>
                                updateSubConfig('volumeProfileConfig', {
                                  showVahValLines: e.target.checked,
                                })
                              }
                              className="rounded text-[#f59e0b] focus:ring-[#f59e0b]"
                            />
                            <span>Garis VAH & VAL</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-[var(--color-text)]">
                            <input
                              type="checkbox"
                              checked={localSettings.volumeProfileConfig.showPocBadge}
                              onChange={(e) =>
                                updateSubConfig('volumeProfileConfig', {
                                  showPocBadge: e.target.checked,
                                })
                              }
                              className="rounded text-[#f59e0b] focus:ring-[#f59e0b]"
                            />
                            <span>Badge Sumbu Y</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-[var(--color-text)]">
                            <input
                              type="checkbox"
                              checked={localSettings.volumeProfileConfig.showHvnLvn}
                              onChange={(e) =>
                                updateSubConfig('volumeProfileConfig', {
                                  showHvnLvn: e.target.checked,
                                })
                              }
                              className="rounded text-[#f59e0b] focus:ring-[#f59e0b]"
                            />
                            <span>Highlight HVN/LVN</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Liquidity Heatmap Config */}
                    {ind.configKey === 'liquidityHeatmapConfig' && localSettings.liquidityHeatmapConfig && (
                      <div className={`backdrop-blur-2xl border rounded-md p-3.5 space-y-3.5 shadow-2xl max-w-full text-xs text-white ${dynamicBgClass}`}>
                        <button
                          onClick={() => setShowLiquidityGuide(true)}
                          className="w-full h-7 px-3 rounded-md text-xs font-bold text-white bg-[var(--color-panel)]/80 hover:bg-[var(--color-panel)] border border-[var(--color-border)] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                        >
                          <BookOpen size={13} className="text-white" />
                          <span className="text-white">📖 Panduan Lengkap & Strategi Trading Liquidity Heatmap</span>
                        </button>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                          <div>
                            <label className="text-zinc-400 font-medium block mb-1 text-[11px]">Timeframe Mode:</label>
                            <select
                              value={localSettings.liquidityHeatmapConfig.timeframeMode || 'tick'}
                              onChange={(e) =>
                                updateSubConfig('liquidityHeatmapConfig', {
                                  timeframeMode: e.target.value as any,
                                })
                              }
                              className="w-full h-7 bg-[var(--color-panel)]/90 border border-[var(--color-border)] rounded-md px-2 text-white font-semibold text-xs focus:outline-none focus:border-[var(--color-border)] cursor-pointer"
                            >
                              <option value="tick" className="bg-[var(--color-panel)] text-white">⚡ Per Tick (1T Realtime)</option>
                              <option value="10t" className="bg-[var(--color-panel)] text-white">⚡ 10 Ticks Agregasi</option>
                              <option value="50t" className="bg-[var(--color-panel)] text-white">⚡ 50 Ticks Micro-Swing</option>
                              <option value="100t" className="bg-[var(--color-panel)] text-white">⚡ 100 Ticks Sub-Session</option>
                              <option value="candle" className="bg-[var(--color-panel)] text-white">🕯️ Candle Bar Timeframe</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-zinc-400 font-medium block mb-1 text-[11px]">Palet Warna:</label>
                            <select
                              value={localSettings.liquidityHeatmapConfig.colorMode}
                              onChange={(e) =>
                                updateSubConfig('liquidityHeatmapConfig', {
                                  colorMode: e.target.value as any,
                                })
                              }
                              className="w-full h-7 bg-[var(--color-panel)]/90 border border-[var(--color-border)] rounded-md px-2 text-white font-medium text-xs focus:outline-none focus:border-[var(--color-border)] cursor-pointer"
                            >
                              <option value="theme" className="bg-[var(--color-panel)] text-white">Sinkron Tema Terminal ({theme})</option>
                            </select>
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-zinc-400 font-medium text-[11px]">Intensitas:</label>
                              <span className="text-white font-mono text-[11px] font-bold">
                                {localSettings.liquidityHeatmapConfig.intensity.toFixed(1)}x
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0.3"
                              max="2.5"
                              step="0.1"
                              value={localSettings.liquidityHeatmapConfig.intensity}
                              onChange={(e) =>
                                updateSubConfig('liquidityHeatmapConfig', {
                                  intensity: parseFloat(e.target.value) || 1.0,
                                })
                              }
                              className="w-full accent-white h-1.5 bg-[var(--color-panel)] rounded-md cursor-pointer mt-1"
                            />
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-zinc-400 font-medium text-[11px]">Opasitas:</label>
                              <span className="text-white font-mono text-[11px] font-bold">
                                {(localSettings.liquidityHeatmapConfig.opacity * 100).toFixed(0)}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0.1"
                              max="0.95"
                              step="0.05"
                              value={localSettings.liquidityHeatmapConfig.opacity}
                              onChange={(e) =>
                                updateSubConfig('liquidityHeatmapConfig', {
                                  opacity: parseFloat(e.target.value) || 0.7,
                                })
                              }
                              className="w-full accent-white h-1.5 bg-[var(--color-panel)] rounded-md cursor-pointer mt-1"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2.5 border-t border-[var(--color-border)]/60">
                          <div>
                            <label className="text-zinc-400 block mb-1 text-[11px]">Resolusi (Bins):</label>
                            <input
                              type="number"
                              min="24"
                              max="150"
                              step="4"
                              value={localSettings.liquidityHeatmapConfig.depthBins}
                              onChange={(e) =>
                                updateSubConfig('liquidityHeatmapConfig', {
                                  depthBins: Number(e.target.value) || 84,
                                })
                              }
                              className="w-full h-7 bg-[var(--color-panel)] border border-[var(--color-border)] rounded-md px-2 text-white font-mono text-xs focus:outline-none focus:border-[var(--color-border)]"
                            />
                          </div>
                          <div>
                            <label className="text-zinc-400 block mb-1 text-[11px]">Threshold Wall:</label>
                            <input
                              type="number"
                              min="1.2"
                              max="5.0"
                              step="0.2"
                              value={localSettings.liquidityHeatmapConfig.wallThreshold}
                              onChange={(e) =>
                                updateSubConfig('liquidityHeatmapConfig', {
                                  wallThreshold: parseFloat(e.target.value) || 2.0,
                                })
                              }
                              className="w-full h-7 bg-[var(--color-panel)] border border-[var(--color-border)] rounded-md px-2 text-white font-mono text-xs focus:outline-none focus:border-[var(--color-border)]"
                            />
                          </div>
                          <div>
                            <label className="text-zinc-400 block mb-1 text-[11px]">Filter Notional ($ USD):</label>
                            <input
                              type="number"
                              min="0"
                              max="5000000"
                              step="10000"
                              value={localSettings.liquidityHeatmapConfig.minNotionalFilter || 0}
                              placeholder="0 (Semua Level)"
                              onChange={(e) =>
                                updateSubConfig('liquidityHeatmapConfig', {
                                  minNotionalFilter: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-full h-7 bg-[var(--color-panel)] border border-[var(--color-border)] rounded-md px-2 text-white font-mono text-xs focus:outline-none focus:border-[var(--color-border)]"
                            />
                          </div>
                          <div>
                            <label className="text-zinc-400 block mb-1 text-[11px]">Simulasi Order ($ USD):</label>
                            <input
                              type="number"
                              min="10000"
                              max="10000000"
                              step="25000"
                              value={localSettings.liquidityHeatmapConfig.simulatedTradeSize || 250000}
                              onChange={(e) =>
                                updateSubConfig('liquidityHeatmapConfig', {
                                  simulatedTradeSize: parseFloat(e.target.value) || 250000,
                                })
                              }
                              className="w-full h-7 bg-[var(--color-panel)] border border-[var(--color-border)] rounded-md px-2 text-white font-mono text-xs focus:outline-none focus:border-[var(--color-border)]"
                            />
                          </div>
                        </div>

                        <div className="space-y-2 pt-2.5 border-t border-[var(--color-border)]/60">
                          <label className="flex items-center gap-2 cursor-pointer text-white bg-[var(--color-panel)]/60 p-2 rounded-md border border-[var(--color-border)]/50 hover:bg-[var(--color-panel)]/60 transition-all">
                            <input
                              type="checkbox"
                              checked={!!localSettings.liquidityHeatmapConfig.cleanMode}
                              onChange={(e) =>
                                updateSubConfig('liquidityHeatmapConfig', {
                                  cleanMode: e.target.checked,
                                })
                              }
                              className="rounded bg-[var(--color-panel)] border-[var(--color-border)] text-white focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                            />
                            <span className="text-white text-xs font-semibold">✨ Mode Rapi / Clean View (Sembunyikan label & visual clutter berlebih)</span>
                          </label>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <label className="flex items-center gap-2 cursor-pointer text-white bg-[var(--color-panel)]/60 backdrop-blur-md p-2 rounded-sm border border-[var(--color-border)] hover:bg-[var(--color-panel)]/60 transition-all">
                              <input
                                type="checkbox"
                                checked={Boolean(localSettings.liquidityHeatmapConfig.showVolumeBubbles)}
                                onChange={(e) =>
                                  updateSubConfig('liquidityHeatmapConfig', {
                                    showVolumeBubbles: e.target.checked,
                                  })
                                }
                                className="rounded-sm bg-[var(--color-panel)] border-[var(--color-border)] text-white focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                              />
                              <span className="text-white font-medium">Split 3D Volume Bubbles (Buy/Sell)</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer text-white bg-[var(--color-panel)]/60 backdrop-blur-md p-2 rounded-sm border border-[var(--color-border)] hover:bg-[var(--color-panel)]/60 transition-all">
                              <input
                                type="checkbox"
                                checked={localSettings.liquidityHeatmapConfig.showWhaleBubbles ?? true}
                                onChange={(e) =>
                                  updateSubConfig('liquidityHeatmapConfig', {
                                    showWhaleBubbles: e.target.checked,
                                  })
                                }
                                className="rounded-sm bg-[var(--color-panel)] border-[var(--color-border)] text-white focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                              />
                              <span className="flex items-center gap-1.5 font-bold text-white">
                                <span>🐋</span>
                                <span>Whale Order Flow & Institutional Volume Clusters</span>
                              </span>
                            </label>
                          </div>

                          {Boolean(localSettings.liquidityHeatmapConfig.showVolumeBubbles) && (
                             <div className="flex flex-col gap-2 p-2.5 bg-[var(--color-panel)]/80 border border-[var(--color-border)] rounded-sm text-xs">
                              <div className="flex items-center justify-between">
                                <span className="text-zinc-400 font-medium">Kalibrasi Ukuran Bubble:</span>
                                <span className="font-mono text-white font-bold">
                                  {Math.round((localSettings.liquidityHeatmapConfig.bubbleScale ?? 1.0) * 100)}%
                                </span>
                              </div>
                              <input
                                type="range"
                                min="40"
                                max="250"
                                step="5"
                                value={Math.round((localSettings.liquidityHeatmapConfig.bubbleScale ?? 1.0) * 100)}
                                onChange={(e) =>
                                  updateSubConfig('liquidityHeatmapConfig', {
                                    bubbleScale: Number(e.target.value) / 100,
                                  })
                                }
                                className="w-full accent-white cursor-pointer h-1.5 bg-[var(--color-panel)] rounded-sm"
                              />
                              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                                <span>Mode Skalasi:</span>
                                <select
                                  value={localSettings.liquidityHeatmapConfig.bubbleSizeMode || 'adaptive'}
                                  onChange={(e) =>
                                    updateSubConfig('liquidityHeatmapConfig', {
                                      bubbleSizeMode: e.target.value as any,
                                    })
                                  }
                                  className="h-6 bg-[var(--color-panel)] border border-[var(--color-border)] rounded-sm px-2 text-white text-xs focus:outline-none cursor-pointer"
                                >
                                  <option value="adaptive">🌟 Adaptif Proporsional</option>
                                  <option value="ultra_accurate_tick">⚡ Presisi 1-Tick</option>
                                  <option value="compact">📐 Kompak & Minimalis</option>
                                </select>
                              </div>
                            </div>
                          )}

                           {(localSettings.liquidityHeatmapConfig.showWhaleBubbles ?? true) && (
                            <div className="flex flex-col gap-2 p-2.5 bg-[var(--color-panel)]/80 border border-[var(--color-border)] rounded-sm text-xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-zinc-400 font-medium">Sensitivitas Ambang Volume Whale:</span>
                                <span className="font-mono text-white font-bold">
                                  {(localSettings.liquidityHeatmapConfig.whaleThresholdMultiplier ?? 2.2)?.toFixed(1)}x
                                </span>
                              </div>
                              <input
                                type="range"
                                min="12"
                                max="50"
                                step="2"
                                value={Math.round((localSettings.liquidityHeatmapConfig.whaleThresholdMultiplier ?? 2.2) * 10)}
                                onChange={(e) =>
                                  updateSubConfig('liquidityHeatmapConfig', {
                                    whaleThresholdMultiplier: Number(e.target.value) / 10,
                                  })
                                }
                                className="w-full accent-white cursor-pointer h-1.5 bg-[var(--color-panel)] rounded-sm"
                              />

                              <div className="flex items-center justify-between flex-wrap gap-1">
                                <span className="text-zinc-400 font-medium">Filter Transaksi Min (Notional USD):</span>
                                <select
                                  value={localSettings.liquidityHeatmapConfig.whaleMinNotionalUsd ?? 100000}
                                  onChange={(e) =>
                                    updateSubConfig('liquidityHeatmapConfig', {
                                      whaleMinNotionalUsd: Number(e.target.value),
                                    })
                                  }
                                  className="h-6 bg-[var(--color-panel)] border border-[var(--color-border)] rounded-sm px-2 text-white text-xs focus:outline-none cursor-pointer"
                                >
                                  <option value="0">Semua Kluster (0 USD)</option>
                                  <option value="50000">&gt; $50K USD</option>
                                  <option value="100000">&gt; $100K USD (Standar Whale)</option>
                                  <option value="250000">&gt; $250K USD (Heavy Orca)</option>
                                  <option value="500000">&gt; $500K USD (Mega Whale)</option>
                                  <option value="1000000">&gt; $1.0M+ USD (Titan)</option>
                                </select>
                              </div>

                              <div className="pt-2 border-t border-[var(--color-border)]/40 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <label className="flex items-center gap-2 cursor-pointer text-white">
                                  <input
                                    type="checkbox"
                                    checked={localSettings.liquidityHeatmapConfig.showWhaleHorizontalLines ?? true}
                                    onChange={(e) =>
                                      updateSubConfig('liquidityHeatmapConfig', {
                                        showWhaleHorizontalLines: e.target.checked,
                                      })
                                    }
                                    className="rounded-sm bg-[var(--color-panel)] border-[var(--color-border)] text-white focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                                  />
                                  <span className="text-white text-[11px] font-medium">Garis Level Whale</span>
                                </label>

                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-zinc-400 text-[11px]">Gaya:</span>
                                  <select
                                    value={localSettings.liquidityHeatmapConfig.whaleLineStyle ?? 'dashed'}
                                    onChange={(e) =>
                                      updateSubConfig('liquidityHeatmapConfig', {
                                        whaleLineStyle: e.target.value as 'dashed' | 'solid' | 'dotted',
                                      })
                                    }
                                    className="h-6 bg-[var(--color-panel)] border border-[var(--color-border)] rounded-sm px-2 text-white text-[11px] focus:outline-none cursor-pointer"
                                  >
                                    <option value="dashed">Dashed</option>
                                    <option value="solid">Solid</option>
                                    <option value="dotted">Dotted</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Grid Toggles Section */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-2.5 border-t border-[var(--color-border)]/60 text-xs">
                            <label className="flex items-center gap-2 cursor-pointer text-white bg-[var(--color-panel)]/40 p-2 rounded-md border border-[var(--color-border)]/40 hover:bg-[var(--color-panel)]/40 transition-all">
                              <input
                                type="checkbox"
                                checked={Boolean(localSettings.liquidityHeatmapConfig.showMicroPriceTrail)}
                                onChange={(e) =>
                                  updateSubConfig('liquidityHeatmapConfig', {
                                    showMicroPriceTrail: e.target.checked,
                                  })
                                }
                                className="rounded bg-[var(--color-panel)] border-[var(--color-border)] text-white focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                              />
                              <span className="font-semibold text-white">Sub-Tick Micro Price Trail</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer text-white bg-[var(--color-panel)]/40 p-2 rounded-md border border-[var(--color-border)]/40 hover:bg-[var(--color-panel)]/40 transition-all">
                              <input
                                type="checkbox"
                                checked={Boolean(localSettings.liquidityHeatmapConfig.showRightDomLadder)}
                                onChange={(e) =>
                                  updateSubConfig('liquidityHeatmapConfig', {
                                    showRightDomLadder: e.target.checked,
                                  })
                                }
                                className="rounded bg-[var(--color-panel)] border-[var(--color-border)] text-white focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                              />
                              <span className="text-white">Right DOM Depth Ladder & Spread</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer text-white bg-[var(--color-panel)]/40 p-2 rounded-md border border-[var(--color-border)]/40 hover:bg-[var(--color-panel)]/40 transition-all">
                              <input
                                type="checkbox"
                                checked={Boolean(localSettings.liquidityHeatmapConfig.showLeftVolumeProfile)}
                                onChange={(e) =>
                                  updateSubConfig('liquidityHeatmapConfig', {
                                    showLeftVolumeProfile: e.target.checked,
                                  })
                                }
                                className="rounded bg-[var(--color-panel)] border-[var(--color-border)] text-white focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                              />
                              <span className="font-semibold text-white">Left Volume Profile (VPVR)</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer text-white bg-[var(--color-panel)]/40 p-2 rounded-md border border-[var(--color-border)]/40 hover:bg-[var(--color-panel)]/40 transition-all">
                              <input
                                type="checkbox"
                                checked={Boolean(localSettings.liquidityHeatmapConfig.showVolumeDelta)}
                                onChange={(e) =>
                                  updateSubConfig('liquidityHeatmapConfig', {
                                    showVolumeDelta: e.target.checked,
                                  })
                                }
                                className="rounded bg-[var(--color-panel)] border-[var(--color-border)] text-white focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                              />
                              <span className="text-white">📊 Volume Delta Bar (Buy/Sell)</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer text-white bg-[var(--color-panel)]/40 p-2 rounded-md border border-[var(--color-border)]/40 hover:bg-[var(--color-panel)]/40 transition-all">
                              <input
                                type="checkbox"
                                checked={Boolean(localSettings.liquidityHeatmapConfig.showSpoofingAndIceberg)}
                                onChange={(e) =>
                                  updateSubConfig('liquidityHeatmapConfig', {
                                    showSpoofingAndIceberg: e.target.checked,
                                  })
                                }
                                className="rounded bg-[var(--color-panel)] border-[var(--color-border)] text-white focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                              />
                              <span className="text-white">⚠️ Spoofing & 🧊 Iceberg Detection</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer text-white bg-[var(--color-panel)]/40 p-2 rounded-md border border-[var(--color-border)]/40 hover:bg-[var(--color-panel)]/40 transition-all">
                              <input
                                type="checkbox"
                                checked={Boolean(localSettings.liquidityHeatmapConfig.showAbsorptionNodes)}
                                onChange={(e) =>
                                  updateSubConfig('liquidityHeatmapConfig', {
                                    showAbsorptionNodes: e.target.checked,
                                  })
                                }
                                className="rounded bg-[var(--color-panel)] border-[var(--color-border)] text-white focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                              />
                              <span className="text-white">💎 Liquidity Absorption Nodes</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer text-white bg-[var(--color-panel)]/40 p-2 rounded-md border border-[var(--color-border)]/40 hover:bg-[var(--color-panel)]/40 transition-all">
                              <input
                                type="checkbox"
                                checked={Boolean(localSettings.liquidityHeatmapConfig.autoNormalizeSpectrum)}
                                onChange={(e) =>
                                  updateSubConfig('liquidityHeatmapConfig', {
                                    autoNormalizeSpectrum: e.target.checked,
                                  })
                                }
                                className="rounded bg-[var(--color-panel)] border-[var(--color-border)] text-white focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                              />
                              <span className="text-white">⚡ Dynamic Spectrum (Z-Score)</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer text-white bg-[var(--color-panel)]/40 p-2 rounded-md border border-[var(--color-border)]/40 hover:bg-[var(--color-panel)]/40 transition-all">
                              <input
                                type="checkbox"
                                checked={Boolean(localSettings.liquidityHeatmapConfig.showLiquidityGravity)}
                                onChange={(e) =>
                                  updateSubConfig('liquidityHeatmapConfig', {
                                    showLiquidityGravity: e.target.checked,
                                  })
                                }
                                className="rounded bg-[var(--color-panel)] border-[var(--color-border)] text-white focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                              />
                              <span className="text-white">🧲 Liquidity Gravity Vector</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer text-white bg-[var(--color-panel)]/40 p-2 rounded-md border border-[var(--color-border)]/40 hover:bg-[var(--color-panel)]/40 transition-all">
                              <input
                                type="checkbox"
                                checked={Boolean(localSettings.liquidityHeatmapConfig.showVpinToxicity)}
                                onChange={(e) =>
                                  updateSubConfig('liquidityHeatmapConfig', {
                                    showVpinToxicity: e.target.checked,
                                  })
                                }
                                className="rounded bg-[var(--color-panel)] border-[var(--color-border)] text-white focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                              />
                              <span className="text-white">⚡ Flow Toxicity (VPIN)</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer text-white bg-[var(--color-panel)]/40 p-2 rounded-md border border-[var(--color-border)]/40 hover:bg-[var(--color-panel)]/40 transition-all">
                              <input
                                type="checkbox"
                                checked={Boolean(localSettings.liquidityHeatmapConfig.showCvdDivergence)}
                                onChange={(e) =>
                                  updateSubConfig('liquidityHeatmapConfig', {
                                    showCvdDivergence: e.target.checked,
                                  })
                                }
                                className="rounded bg-[var(--color-panel)] border-[var(--color-border)] text-white focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                              />
                              <span className="text-white">🔥 CVD Divergence Beams</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer text-white bg-[var(--color-panel)]/40 p-2 rounded-md border border-[var(--color-border)]/40 hover:bg-[var(--color-panel)]/40 transition-all">
                              <input
                                type="checkbox"
                                checked={Boolean(localSettings.liquidityHeatmapConfig.showLiquidityVacuums)}
                                onChange={(e) =>
                                  updateSubConfig('liquidityHeatmapConfig', {
                                    showLiquidityVacuums: e.target.checked,
                                  })
                                }
                                className="rounded bg-[var(--color-panel)] border-[var(--color-border)] text-white focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                              />
                              <span className="text-white">⚠️ Liquidity Vacuum Radar</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer text-white bg-[var(--color-panel)]/40 p-2 rounded-md border border-[var(--color-border)]/40 hover:bg-[var(--color-panel)]/40 transition-all">
                              <input
                                type="checkbox"
                                checked={Boolean(localSettings.liquidityHeatmapConfig.showOfiAndLambda)}
                                onChange={(e) =>
                                  updateSubConfig('liquidityHeatmapConfig', {
                                    showOfiAndLambda: e.target.checked,
                                  })
                                }
                                className="rounded bg-[var(--color-panel)] border-[var(--color-border)] text-white focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                              />
                              <span className="text-white">📊 OFI & Kyle's Lambda Index</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer text-white bg-[var(--color-panel)]/40 p-2 rounded-md border border-[var(--color-border)]/40 hover:bg-[var(--color-panel)]/40 transition-all">
                              <input
                                type="checkbox"
                                checked={Boolean(localSettings.liquidityHeatmapConfig.showAgingDecay)}
                                onChange={(e) =>
                                  updateSubConfig('liquidityHeatmapConfig', {
                                    showAgingDecay: e.target.checked,
                                  })
                                }
                                className="rounded bg-[var(--color-panel)] border-[var(--color-border)] text-white focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                              />
                              <span className="text-white">⏳ Resting Limit Half-Life Aging</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer text-white bg-[var(--color-panel)]/40 p-2 rounded-md border border-[var(--color-border)]/40 hover:bg-[var(--color-panel)]/40 transition-all">
                              <input
                                type="checkbox"
                                checked={Boolean(localSettings.liquidityHeatmapConfig.showLayeringDetector)}
                                onChange={(e) =>
                                  updateSubConfig('liquidityHeatmapConfig', {
                                    showLayeringDetector: e.target.checked,
                                  })
                                }
                                className="rounded bg-[var(--color-panel)] border-[var(--color-border)] text-white focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                              />
                              <span className="text-white">🛡️ Multi-Tier Layering Detector</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer text-white bg-[var(--color-panel)]/40 p-2 rounded-md border border-[var(--color-border)]/40 hover:bg-[var(--color-panel)]/40 transition-all">
                              <input
                                type="checkbox"
                                checked={Boolean(localSettings.liquidityHeatmapConfig.showSweepPredictor)}
                                onChange={(e) =>
                                  updateSubConfig('liquidityHeatmapConfig', {
                                    showSweepPredictor: e.target.checked,
                                  })
                                }
                                className="rounded bg-[var(--color-panel)] border-[var(--color-border)] text-white focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                              />
                              <span className="text-white">🎯 Liquidity Sweep Predictor</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer text-white bg-[var(--color-panel)]/40 p-2 rounded-md border border-[var(--color-border)]/40 hover:bg-[var(--color-panel)]/40 transition-all">
                              <input
                                type="checkbox"
                                checked={Boolean(localSettings.liquidityHeatmapConfig.showSlippageSimulator)}
                                onChange={(e) =>
                                  updateSubConfig('liquidityHeatmapConfig', {
                                    showSlippageSimulator: e.target.checked,
                                  })
                                }
                                className="rounded bg-[var(--color-panel)] border-[var(--color-border)] text-white focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                              />
                              <span className="text-white">📉 Pre-Trade Slippage Simulator</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer text-white bg-[var(--color-panel)]/40 p-2 rounded-md border border-[var(--color-border)]/40 hover:bg-[var(--color-panel)]/40 transition-all">
                              <input
                                type="checkbox"
                                checked={Boolean(localSettings.liquidityHeatmapConfig.showCrosshairInspector)}
                                onChange={(e) =>
                                  updateSubConfig('liquidityHeatmapConfig', {
                                    showCrosshairInspector: e.target.checked,
                                  })
                                }
                                className="rounded bg-[var(--color-panel)] border-[var(--color-border)] text-white focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                              />
                              <span className="text-white">🔍 Crosshair FIFO Queue Inspector</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer text-white bg-[var(--color-panel)]/40 p-2 rounded-md border border-[var(--color-border)]/40 hover:bg-[var(--color-panel)]/40 transition-all">
                              <input
                                type="checkbox"
                                checked={Boolean(localSettings.liquidityHeatmapConfig.showGexGammaOverlay)}
                                onChange={(e) =>
                                  updateSubConfig('liquidityHeatmapConfig', {
                                    showGexGammaOverlay: e.target.checked,
                                  })
                                }
                                className="rounded bg-[var(--color-panel)] border-[var(--color-border)] text-white focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                              />
                              <span className="text-white">📈 Option Gamma Exposure (GEX)</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer text-white bg-[var(--color-panel)]/40 p-2 rounded-md border border-[var(--color-border)]/40 hover:bg-[var(--color-panel)]/40 transition-all">
                              <input
                                type="checkbox"
                                checked={Boolean(localSettings.liquidityHeatmapConfig.showHawkesFlashCrashWarning)}
                                onChange={(e) =>
                                  updateSubConfig('liquidityHeatmapConfig', {
                                    showHawkesFlashCrashWarning: e.target.checked,
                                  })
                                }
                                className="rounded bg-[var(--color-panel)] border-[var(--color-border)] text-white focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                              />
                              <span className="text-white">⚡ Hawkes Flash-Crash Early Warning</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer text-white bg-[var(--color-panel)]/40 p-2 rounded-md border border-[var(--color-border)]/40 hover:bg-[var(--color-panel)]/40 transition-all">
                              <input
                                type="checkbox"
                                checked={Boolean(localSettings.liquidityHeatmapConfig.showAlmgrenChrissTrajectory)}
                                onChange={(e) =>
                                  updateSubConfig('liquidityHeatmapConfig', {
                                    showAlmgrenChrissTrajectory: e.target.checked,
                                  })
                                }
                                className="rounded bg-[var(--color-panel)] border-[var(--color-border)] text-white focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                              />
                              <span className="text-white">🎯 Almgren-Chriss Trajectory</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer text-white bg-[var(--color-panel)]/40 p-2 rounded-md border border-[var(--color-border)]/40 hover:bg-[var(--color-panel)]/40 transition-all">
                              <input
                                type="checkbox"
                                checked={Boolean(localSettings.liquidityHeatmapConfig.showCrossExchangeMatrix)}
                                onChange={(e) =>
                                  updateSubConfig('liquidityHeatmapConfig', {
                                    showCrossExchangeMatrix: e.target.checked,
                                  })
                                }
                                className="rounded bg-[var(--color-panel)] border-[var(--color-border)] text-white focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                              />
                              <span className="text-white">🌐 Cross-Exchange Arbitrage Matrix</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer text-white bg-[var(--color-panel)]/40 p-2 rounded-md border border-[var(--color-border)]/40 hover:bg-[var(--color-panel)]/40 transition-all">
                              <input
                                type="checkbox"
                                checked={Boolean(localSettings.liquidityHeatmapConfig.showLiquidationRadar)}
                                onChange={(e) =>
                                  updateSubConfig('liquidityHeatmapConfig', {
                                    showLiquidationRadar: e.target.checked,
                                  })
                                }
                                className="rounded bg-[var(--color-panel)] border-[var(--color-border)] text-white focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                              />
                              <span className="text-white">💥 Liquidation Cascade Radar</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer text-white bg-[var(--color-panel)]/40 p-2 rounded-md border border-[var(--color-border)]/40 hover:bg-[var(--color-panel)]/40 transition-all">
                              <input
                                type="checkbox"
                                checked={Boolean(localSettings.liquidityHeatmapConfig.showSubTickVector)}
                                onChange={(e) =>
                                  updateSubConfig('liquidityHeatmapConfig', {
                                    showSubTickVector: e.target.checked,
                                  })
                                }
                                className="rounded bg-[var(--color-panel)] border-[var(--color-border)] text-white focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                              />
                              <span className="text-white">⚡ Sub-Tick Price Action Vector</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* EMA 20 Config */}
                    {ind.configKey === 'ema20Config' && localSettings.ema20Config && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[var(--color-text-muted)] block mb-1">Periode (Length):</label>
                          <input
                            type="number"
                            min="1"
                            max="500"
                            value={localSettings.ema20Config.period}
                            onChange={(e) =>
                              updateSubConfig('ema20Config', { period: Number(e.target.value) || 20 })
                            }
                            className="w-full bg-[var(--color-panel)] border border-[var(--color-border)] rounded p-1.5 text-[var(--color-text)] font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[var(--color-text-muted)] block mb-1">Sumber Harga (Source):</label>
                          <select
                            value={localSettings.ema20Config.source}
                            onChange={(e) =>
                              updateSubConfig('ema20Config', { source: e.target.value as PriceSource })
                            }
                            className="w-full bg-[var(--color-panel)] border border-[var(--color-border)] rounded p-1.5 text-[var(--color-text)]"
                          >
                            {sources.map((s) => (
                              <option key={s.id} value={s.id}>{s.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[var(--color-text-muted)] block mb-1">Warna Garis:</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={localSettings.ema20Config.color}
                              onChange={(e) => updateSubConfig('ema20Config', { color: e.target.value })}
                              className="w-8 h-8 rounded border border-[var(--color-border)] bg-transparent cursor-pointer"
                            />
                            <span className="font-mono text-[11px] text-gray-300">{localSettings.ema20Config.color}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* EMA 50 Config */}
                    {ind.configKey === 'ema50Config' && localSettings.ema50Config && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[var(--color-text-muted)] block mb-1">Periode (Length):</label>
                          <input
                            type="number"
                            min="1"
                            max="500"
                            value={localSettings.ema50Config.period}
                            onChange={(e) =>
                              updateSubConfig('ema50Config', { period: Number(e.target.value) || 50 })
                            }
                            className="w-full bg-[var(--color-panel)] border border-[var(--color-border)] rounded p-1.5 text-[var(--color-text)] font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[var(--color-text-muted)] block mb-1">Sumber Harga:</label>
                          <select
                            value={localSettings.ema50Config.source}
                            onChange={(e) =>
                              updateSubConfig('ema50Config', { source: e.target.value as PriceSource })
                            }
                            className="w-full bg-[var(--color-panel)] border border-[var(--color-border)] rounded p-1.5 text-[var(--color-text)]"
                          >
                            {sources.map((s) => (
                              <option key={s.id} value={s.id}>{s.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[var(--color-text-muted)] block mb-1">Warna Garis:</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={localSettings.ema50Config.color}
                              onChange={(e) => updateSubConfig('ema50Config', { color: e.target.value })}
                              className="w-8 h-8 rounded border border-[var(--color-border)] bg-transparent cursor-pointer"
                            />
                            <span className="font-mono text-[11px] text-gray-300">{localSettings.ema50Config.color}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* EMA 200 Config */}
                    {ind.configKey === 'ema200Config' && localSettings.ema200Config && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[var(--color-text-muted)] block mb-1">Periode (Length):</label>
                          <input
                            type="number"
                            min="1"
                            max="1000"
                            value={localSettings.ema200Config.period}
                            onChange={(e) =>
                              updateSubConfig('ema200Config', { period: Number(e.target.value) || 200 })
                            }
                            className="w-full bg-[var(--color-panel)] border border-[var(--color-border)] rounded p-1.5 text-[var(--color-text)] font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[var(--color-text-muted)] block mb-1">Sumber Harga:</label>
                          <select
                            value={localSettings.ema200Config.source}
                            onChange={(e) =>
                              updateSubConfig('ema200Config', { source: e.target.value as PriceSource })
                            }
                            className="w-full bg-[var(--color-panel)] border border-[var(--color-border)] rounded p-1.5 text-[var(--color-text)]"
                          >
                            {sources.map((s) => (
                              <option key={s.id} value={s.id}>{s.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[var(--color-text-muted)] block mb-1">Warna Garis:</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={localSettings.ema200Config.color}
                              onChange={(e) => updateSubConfig('ema200Config', { color: e.target.value })}
                              className="w-8 h-8 rounded border border-[var(--color-border)] bg-transparent cursor-pointer"
                            />
                            <span className="font-mono text-[11px] text-gray-300">{localSettings.ema200Config.color}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Bollinger Bands Config */}
                    {ind.configKey === 'bollingerConfig' && localSettings.bollingerConfig && (
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="text-[var(--color-text-muted)] block mb-1">Periode SMA:</label>
                            <input
                              type="number"
                              min="2"
                              max="200"
                              value={localSettings.bollingerConfig.period}
                              onChange={(e) =>
                                updateSubConfig('bollingerConfig', { period: Number(e.target.value) || 20 })
                              }
                              className="w-full bg-[var(--color-panel)] border border-[var(--color-border)] rounded p-1.5 text-[var(--color-text)] font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[var(--color-text-muted)] block mb-1">Standar Deviasi (Multiplier):</label>
                            <input
                              type="number"
                              step="0.1"
                              min="0.5"
                              max="10"
                              value={localSettings.bollingerConfig.multiplier}
                              onChange={(e) =>
                                updateSubConfig('bollingerConfig', { multiplier: Number(e.target.value) || 2.0 })
                              }
                              className="w-full bg-[var(--color-panel)] border border-[var(--color-border)] rounded p-1.5 text-[var(--color-text)] font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[var(--color-text-muted)] block mb-1">Sumber Data:</label>
                            <select
                              value={localSettings.bollingerConfig.source}
                              onChange={(e) =>
                                updateSubConfig('bollingerConfig', { source: e.target.value as PriceSource })
                              }
                              className="w-full bg-[var(--color-panel)] border border-[var(--color-border)] rounded p-1.5 text-[var(--color-text)]"
                            >
                              {sources.map((s) => (
                                <option key={s.id} value={s.id}>{s.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[var(--color-border)]">
                          <div>
                            <label className="text-[var(--color-text-muted)] block mb-1">Warna Band Atas:</label>
                            <input
                              type="color"
                              value={localSettings.bollingerConfig.upperColor}
                              onChange={(e) => updateSubConfig('bollingerConfig', { upperColor: e.target.value })}
                              className="w-8 h-8 rounded border border-[var(--color-border)] bg-transparent cursor-pointer"
                            />
                          </div>
                          <div>
                            <label className="text-[var(--color-text-muted)] block mb-1">Warna Garis Tengah:</label>
                            <input
                              type="color"
                              value={localSettings.bollingerConfig.middleColor}
                              onChange={(e) => updateSubConfig('bollingerConfig', { middleColor: e.target.value })}
                              className="w-8 h-8 rounded border border-[var(--color-border)] bg-transparent cursor-pointer"
                            />
                          </div>
                          <div>
                            <label className="text-[var(--color-text-muted)] block mb-1">Warna Band Bawah:</label>
                            <input
                              type="color"
                              value={localSettings.bollingerConfig.lowerColor}
                              onChange={(e) => updateSubConfig('bollingerConfig', { lowerColor: e.target.value })}
                              className="w-8 h-8 rounded border border-[var(--color-border)] bg-transparent cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SuperTrend Config */}
                    {ind.configKey === 'superTrendConfig' && localSettings.superTrendConfig && (
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="text-[var(--color-text-muted)] block mb-1">ATR Length:</label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={localSettings.superTrendConfig.atrPeriod}
                            onChange={(e) =>
                              updateSubConfig('superTrendConfig', { atrPeriod: Number(e.target.value) || 10 })
                            }
                            className="w-full bg-[var(--color-panel)] border border-[var(--color-border)] rounded p-1.5 text-[var(--color-text)] font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[var(--color-text-muted)] block mb-1">ATR Factor (Multiplier):</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0.5"
                            max="10"
                            value={localSettings.superTrendConfig.factor}
                            onChange={(e) =>
                              updateSubConfig('superTrendConfig', { factor: Number(e.target.value) || 3.0 })
                            }
                            className="w-full bg-[var(--color-panel)] border border-[var(--color-border)] rounded p-1.5 text-[var(--color-text)] font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[var(--color-text-muted)] block mb-1">Warna Bull (Buy):</label>
                          <input
                            type="color"
                            value={localSettings.superTrendConfig.bullColor}
                            onChange={(e) => updateSubConfig('superTrendConfig', { bullColor: e.target.value })}
                            className="w-8 h-8 rounded border border-[var(--color-border)] bg-transparent cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="text-[var(--color-text-muted)] block mb-1">Warna Bear (Sell):</label>
                          <input
                            type="color"
                            value={localSettings.superTrendConfig.bearColor}
                            onChange={(e) => updateSubConfig('superTrendConfig', { bearColor: e.target.value })}
                            className="w-8 h-8 rounded border border-[var(--color-border)] bg-transparent cursor-pointer"
                          />
                        </div>
                      </div>
                    )}

                    {/* CVD Candles Config */}
                    {ind.configKey === 'icdCandlesConfig' && localSettings.icdCandlesConfig && (
                      <div className="space-y-3">
                        <button
                          onClick={() => setShowIcdCandlesGuide(true)}
                          className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                        >
                          <BookOpen size={16} />
                          <span>📖 Buka Panduan Lengkap CVD Candles</span>
                        </button>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="text-[var(--color-text-muted)] block mb-1">Smoothing Length (1 = mentah):</label>
                            <input
                              type="number"
                              min="1"
                              max="50"
                              value={localSettings.icdCandlesConfig.length}
                              onChange={(e) =>
                                updateSubConfig('icdCandlesConfig', { length: Number(e.target.value) || 1 })
                              }
                              className="w-full bg-[var(--color-panel)] border border-[var(--color-border)] rounded p-1.5 text-[var(--color-text)] font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[var(--color-text-muted)] block mb-1">Style Tampilan:</label>
                            <select
                              value={localSettings.icdCandlesConfig.style}
                              onChange={(e) =>
                                updateSubConfig('icdCandlesConfig', { style: e.target.value as any })
                              }
                              className="w-full bg-[var(--color-panel)] border border-[var(--color-border)] rounded p-1.5 text-[var(--color-text)] font-medium"
                            >
                              <option value="candle">Candle (Rekomendasi)</option>
                              <option value="line">Line (Garis Kumulatif)</option>
                              <option value="histogram">Histogram</option>
                              <option value="both">Both (Garis + Histogram)</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[var(--color-text-muted)] block mb-1">Line Width:</label>
                            <input
                              type="number"
                              min="1"
                              max="4"
                              step="0.5"
                              value={localSettings.icdCandlesConfig.lineWidth}
                              onChange={(e) =>
                                updateSubConfig('icdCandlesConfig', { lineWidth: Number(e.target.value) || 2 })
                              }
                              className="w-full bg-[var(--color-panel)] border border-[var(--color-border)] rounded p-1.5 text-[var(--color-text)] font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[var(--color-text-muted)] block mb-1">
                              Pane Height: {localSettings.icdCandlesConfig.paneHeightPercent}%
                            </label>
                            <input
                              type="range"
                              min="8"
                              max="40"
                              step="1"
                              value={localSettings.icdCandlesConfig.paneHeightPercent}
                              onChange={(e) =>
                                updateSubConfig('icdCandlesConfig', { paneHeightPercent: Number(e.target.value) || 15 })
                              }
                              className="w-full accent-cyan-400 mt-2"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-[var(--color-border)]">
                          <div>
                            <label className="text-[var(--color-text-muted)] block mb-1">Warna Garis Kumulatif:</label>
                            <input
                              type="color"
                              value={localSettings.icdCandlesConfig.lineColor}
                              onChange={(e) => updateSubConfig('icdCandlesConfig', { lineColor: e.target.value })}
                              className="w-8 h-8 rounded border border-[var(--color-border)] bg-transparent cursor-pointer"
                            />
                          </div>
                          <div>
                            <label className="text-[var(--color-text-muted)] block mb-1">Warna Histogram Bull:</label>
                            <input
                              type="color"
                              value={localSettings.icdCandlesConfig.histBullColor}
                              onChange={(e) => updateSubConfig('icdCandlesConfig', { histBullColor: e.target.value })}
                              className="w-8 h-8 rounded border border-[var(--color-border)] bg-transparent cursor-pointer"
                            />
                          </div>
                          <div>
                            <label className="text-[var(--color-text-muted)] block mb-1">Warna Histogram Bear:</label>
                            <input
                              type="color"
                              value={localSettings.icdCandlesConfig.histBearColor}
                              onChange={(e) => updateSubConfig('icdCandlesConfig', { histBearColor: e.target.value })}
                              className="w-8 h-8 rounded border border-[var(--color-border)] bg-transparent cursor-pointer"
                            />
                          </div>
                          <div>
                            <label className="text-[var(--color-text-muted)] block mb-1">Warna SMA Overlay:</label>
                            <input
                              type="color"
                              value={localSettings.icdCandlesConfig.smaColor}
                              onChange={(e) => updateSubConfig('icdCandlesConfig', { smaColor: e.target.value })}
                              className="w-8 h-8 rounded border border-[var(--color-border)] bg-transparent cursor-pointer"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-[var(--color-border)]">
                          <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-[var(--color-text)]">
                            <input
                              type="checkbox"
                              checked={Boolean(localSettings.icdCandlesConfig.showSma)}
                              onChange={(e) => updateSubConfig('icdCandlesConfig', { showSma: e.target.checked })}
                              className="rounded bg-[var(--color-panel)] border-[var(--color-border)] text-cyan-500 focus:ring-0"
                            />
                            <span>Show SMA Overlay</span>
                          </label>
                          <div>
                            <label className="text-[var(--color-text-muted)] block mb-1">SMA Length:</label>
                            <input
                              type="number"
                              min="2"
                              max="100"
                              value={localSettings.icdCandlesConfig.smaLength}
                              onChange={(e) =>
                                updateSubConfig('icdCandlesConfig', { smaLength: Number(e.target.value) || 14 })
                              }
                              className="w-full bg-[var(--color-panel)] border border-[var(--color-border)] rounded p-1.5 text-[var(--color-text)] font-mono"
                            />
                          </div>
                          <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-[var(--color-text)]">
                            <input
                              type="checkbox"
                              checked={Boolean(localSettings.icdCandlesConfig.showZeroLine)}
                              onChange={(e) => updateSubConfig('icdCandlesConfig', { showZeroLine: e.target.checked })}
                              className="rounded bg-[var(--color-panel)] border-[var(--color-border)] text-cyan-500 focus:ring-0"
                            />
                            <span>Show Zero Line</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-[var(--color-text)]">
                            <input
                              type="checkbox"
                              checked={Boolean(localSettings.icdCandlesConfig.showDivergence)}
                              onChange={(e) => updateSubConfig('icdCandlesConfig', { showDivergence: e.target.checked })}
                              className="rounded bg-[var(--color-panel)] border-[var(--color-border)] text-cyan-500 focus:ring-0"
                            />
                            <span>Deteksi Divergensi Harga vs Delta</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* RSI Config */}
                    {ind.configKey === 'rsiConfig' && localSettings.rsiConfig && (
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="text-[var(--color-text-muted)] block mb-1">Periode RSI:</label>
                          <input
                            type="number"
                            min="2"
                            max="100"
                            value={localSettings.rsiConfig.period}
                            onChange={(e) =>
                              updateSubConfig('rsiConfig', { period: Number(e.target.value) || 14 })
                            }
                            className="w-full bg-[var(--color-panel)] border border-[var(--color-border)] rounded p-1.5 text-[var(--color-text)] font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[var(--color-text-muted)] block mb-1">Overbought Level:</label>
                          <input
                            type="number"
                            min="50"
                            max="99"
                            value={localSettings.rsiConfig.overbought}
                            onChange={(e) =>
                              updateSubConfig('rsiConfig', { overbought: Number(e.target.value) || 70 })
                            }
                            className="w-full bg-[var(--color-panel)] border border-[var(--color-border)] rounded p-1.5 text-[var(--color-text)] font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[var(--color-text-muted)] block mb-1">Oversold Level:</label>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={localSettings.rsiConfig.oversold}
                            onChange={(e) =>
                              updateSubConfig('rsiConfig', { oversold: Number(e.target.value) || 30 })
                            }
                            className="w-full bg-[var(--color-panel)] border border-[var(--color-border)] rounded p-1.5 text-[var(--color-text)] font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[var(--color-text-muted)] block mb-1">Warna Garis RSI:</label>
                          <input
                            type="color"
                            value={localSettings.rsiConfig.rsiColor}
                            onChange={(e) => updateSubConfig('rsiConfig', { rsiColor: e.target.value })}
                            className="w-8 h-8 rounded border border-[var(--color-border)] bg-transparent cursor-pointer"
                          />
                        </div>
                      </div>
                    )}

                    {/* MACD Config */}
                    {ind.configKey === 'macdConfig' && localSettings.macdConfig && (
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="text-[var(--color-text-muted)] block mb-1">Fast Length:</label>
                          <input
                            type="number"
                            min="2"
                            max="100"
                            value={localSettings.macdConfig.fastPeriod}
                            onChange={(e) =>
                              updateSubConfig('macdConfig', { fastPeriod: Number(e.target.value) || 12 })
                            }
                            className="w-full bg-[var(--color-panel)] border border-[var(--color-border)] rounded p-1.5 text-[var(--color-text)] font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[var(--color-text-muted)] block mb-1">Slow Length:</label>
                          <input
                            type="number"
                            min="5"
                            max="200"
                            value={localSettings.macdConfig.slowPeriod}
                            onChange={(e) =>
                              updateSubConfig('macdConfig', { slowPeriod: Number(e.target.value) || 26 })
                            }
                            className="w-full bg-[var(--color-panel)] border border-[var(--color-border)] rounded p-1.5 text-[var(--color-text)] font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[var(--color-text-muted)] block mb-1">Signal Length:</label>
                          <input
                            type="number"
                            min="2"
                            max="50"
                            value={localSettings.macdConfig.signalPeriod}
                            onChange={(e) =>
                              updateSubConfig('macdConfig', { signalPeriod: Number(e.target.value) || 9 })
                            }
                            className="w-full bg-[var(--color-panel)] border border-[var(--color-border)] rounded p-1.5 text-[var(--color-text)] font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[var(--color-text-muted)] block mb-1">Warna MACD Line:</label>
                          <input
                            type="color"
                            value={localSettings.macdConfig.macdColor}
                            onChange={(e) => updateSubConfig('macdConfig', { macdColor: e.target.value })}
                            className="w-8 h-8 rounded border border-[var(--color-border)] bg-transparent cursor-pointer"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[var(--color-panel)] border-t border-[var(--color-border)] flex justify-between items-center text-xs">
          <div className="text-[var(--color-text-muted)]">
            <span className="font-bold font-mono" style={{ color: palette.bull }}>
              {Object.keys(localSettings).filter((k) => k.startsWith('show') && (localSettings as any)[k]).length} Aktif
            </span>{' '}
            Indikator pada Canvas
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 font-bold rounded-lg cursor-pointer transition-opacity text-black shadow-lg"
            style={{
              backgroundColor: palette.bull,
            }}
          >
            Terapkan & Tutup
          </button>
        </div>
      </div>
      
      <LiquidityHeatmapGuideModal 
        isOpen={showLiquidityGuide} 
        onClose={() => setShowLiquidityGuide(false)} 
      />

      <LeftVolumeProfileGuideModal
        isOpen={showLeftVpGuide}
        onClose={() => setShowLeftVpGuide(false)}
      />


    </div>
  );
}

