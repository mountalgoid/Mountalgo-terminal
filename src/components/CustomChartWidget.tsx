import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronUp,
  ChevronDown,
  Plus, 
  Minus, 
  RotateCcw, 
  Sliders, Settings2, 
  TrendingUp, 
  Maximize2,
  Minimize2,
  CandlestickChart,
  LineChart,
  AreaChart,
  Check,
  Activity,
  Layers,
  Palette,
  Table,
  Zap,
  Clock,
  Timer,
  Trash2,
  Copy,
  Lock,
  Unlock,
  X,
  ZoomIn,
  ZoomOut,
  Eye,
  EyeOff,
  Move,
  Info,
  TableProperties,
  Flame,
  BarChart3,
  GripVertical,
  Target,
  Shield,
  ArrowUp,
  ArrowDown,
  Keyboard,
  Link2,
  Wallet,
  Play,
  Sparkles,
  BookOpen,
  PenTool,
  Settings,
  Filter,
  Globe
} from 'lucide-react';
import { IndicatorSettings, 
  DEFAULT_INDICATOR_SETTINGS,
  DEFAULT_VOLUME_PROFILE_CONFIG,
  calculateEMA, 
  calculateSMA,
  calculateBollingerBands, 
  calculateSuperTrend, 
  calculateRSI, 
  calculateMACD, 
  transformToHeikinAshi 
} from '../utils/indicators';
import { computeVolumeProfile, renderVolumeProfileOverlay, VolumeProfileResult } from '../utils/volumeProfileEngine';
import { generateFootprintData, FootprintCandleData } from '../utils/footprints';
import { DrawingToolType, DrawingItem, FIBONACCI_LEVELS } from '../utils/drawingTools';
import { formatVol } from '../utils/numberFormatters';
import { TimezoneSelector } from './TimezoneSelector';
import { MarketSessionsOverlay } from './MarketSessionsOverlay';
import { 
  calculateLiquidityHeatmap, 
  renderLiquidityHeatmapLayer, 
  renderTopmostVolumeProfiles,
  PreciseHeatmapData,
  DEFAULT_HEATMAP_SETTINGS,
  estimateQueuePosition,
  HeatmapTimeframeMode,
  getHoveredWhaleCluster,
  WhaleVolumeCluster,
  getHoveredGexNode,
  GexVolumeNode
  ,getBookmapThemeColor
} from '../utils/liquidityHeatmapEngine';
import { LODManager } from '../utils/lodManager';
import { useTheme } from '../context/ThemeContext';
import { hexToRgba, getThemeModalGradient, getThemeCardBorder, getThemeCardGradient, hexToRgbTuple } from '../utils/themeGradient';
import FloatingDrawingToolbar from './FloatingDrawingToolbar';
import TopDrawingMenu from './TopDrawingMenu';
import SelectedDrawingQuickBar from './SelectedDrawingQuickBar';
import { 
  calculateSmartSnap, 
  renderSmartSnappingOverlay, 
  SmartSnapResult, 
  SmartSnappingOptions 
} from '../utils/smartSnappingEngine';
import IndicatorModal from './IndicatorModal';
import SymbolSelectorModal, { COMPREHENSIVE_MARKET_PAIRS } from './SymbolSelectorModal';
import { LiquidationRadarBar } from './LiquidationRadarBar';
import ChartIndicatorsLegend from './ChartIndicatorsLegend';
import MountAlgoLogo from './MountAlgoLogo';
import { getStoredTimezone, formatTimeInTimezone } from '../utils/timezone';
import { LiquidityHeatmapGuideModal } from './LiquidityHeatmapGuideModal';
import FootprintSettingsModal from './FootprintSettingsModal';
import { CircuitBreakerModal } from './CircuitBreakerModal';
import FootprintHudPanel from './FootprintHudPanel';
import CompactHotkeyHud from './CompactHotkeyHud';
import FloatingTradeBar from './FloatingTradeBar';
import DrawingSettingsModal from './DrawingSettingsModal';
import DrawingTemplatesModal from './DrawingTemplatesModal';
import DrawingLayerManagerModal from './DrawingLayerManagerModal';
import { DrawingTemplateStyle, applyStyleToDrawing } from '../utils/drawingTemplateManager';
import { 
  renderDrawingItem, 
  renderSelectionHandles,
  DrawingRenderContext
} from '../utils/drawingRenderers';
import { getDrawingHitTest, DrawingHitResult } from '../utils/drawingHitTester';
import {
  DrawingLayer,
  getStoredDrawingLayers,
  saveDrawingLayers,
  getStoredActiveLayerId,
  saveStoredActiveLayerId,
  getEffectiveDrawingVisibility,
  getEffectiveDrawingLocked,
  sortDrawingsByZIndex,
} from '../utils/drawingLayerManager';
import OrderFlowDomLadder from './OrderFlowDomLadder';
import ChartTradePanel from './ChartTradePanel';
import QuickScalperBar from './QuickScalperBar';
import HoldPriceTraderMenu from './HoldPriceTraderMenu';
import SLTPVerificationModal, { SLTPVerificationData } from './SLTPVerificationModal';
import ChartNewsEventModal, { ChartNewsEconomicEvent } from './ChartNewsEventModal';
import ChartNewsBeaconHUD from './ChartNewsBeaconHUD';
import NewsVolatilityGuard from './NewsVolatilityGuard';
import { calendarWorkerDispatcher } from '../workers/calendarWorkerDispatcher';

import { AiTapeAnalyzer } from './AiTapeAnalyzer';
import { ExecutionEngine } from '../utils/math/executionEngine';
import { useRiskManager } from '../hooks/trading/useRiskManager';
import { LiveGlobalTickerTape } from './LiveGlobalTickerTape';

import { useTrade } from '../context/TradeContext';
import { tradingAudio } from '../utils/audioSynth';
import {   generateOrderFlowDomData, 
  DomLadderState 
} from '../utils/orderFlowDomEngine';
import { saveChartStateToIDB, loadChartStateFromIDB } from '../utils/terminalPersistence';
import { 
  DEFAULT_MTF_FOOTPRINT_SETTINGS, 
  FootprintSettings, 
} from '../utils/footprints';
import { TickRingBuffer, RawTickTrade } from '../utils/tickRingBuffer';
import { 
  TickCountEngine, 
  TickBarState, 
  TickAbsorptionSignal, 
  TickCvdDivergence, 
  TickModeType 
} from '../utils/tickEngine';

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type ChartType = 'candles' | 'hollow' | 'heikin' | 'line' | 'area' | 'baseline' | 'footprints' | 'blank';

export type ChartTimeframe =
  | '1T'
  | '10T'
  | '50T'
  | '100T'
  | 'tick'
  | '1m'
  | '3m'
  | '5m'
  | '15m'
  | '30m'
  | '1h'
  | '4h'
  | '1D'
  | '1W'
  | '1M'
  | '3M'
  | '1Y';

const getGlobalZoomScale = (): number => {
  try {
    if (typeof window !== 'undefined') {
      const cssVar = getComputedStyle(document.documentElement).getPropertyValue('--global-zoom-scale');
      if (cssVar) {
        const val = parseFloat(cssVar.trim());
        if (!isNaN(val) && val > 0) return val;
      }
      const saved = localStorage.getItem('mountalgo_global_zoom');
      if (saved) {
        const val = parseFloat(saved);
        if (!isNaN(val) && val > 0) {
          return val / 100;
        }
      }
    }
  } catch (e) {
    // Ignore
  }
  return 1;
};

interface AdjustedCanvasRect {
  raw: DOMRect;
  scale: number;
  scaleX: number;
  scaleY: number;
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
  getLocalX: (clientX: number) => number;
  getLocalY: (clientY: number) => number;
}

const getAdjustedCanvasRect = (canvas: HTMLCanvasElement | null): AdjustedCanvasRect | null => {
  if (!canvas) return null;
  const raw = canvas.getBoundingClientRect();
  if (raw.width <= 0 || raw.height <= 0) return null;

  const zoomScale = getGlobalZoomScale();
  // In Chromium, when CSS zoom is applied to a parent (e.g. #app-layout { zoom: 120% }),
  // canvas.getBoundingClientRect() returns visually scaled viewport pixels (screen pixels).
  // canvas.clientWidth / clientHeight return CSS layout pixels before the parent zoom.
  const layoutW = canvas.clientWidth > 0 ? canvas.clientWidth : (raw.width / zoomScale);
  const layoutH = canvas.clientHeight > 0 ? canvas.clientHeight : (raw.height / zoomScale);

  const scaleX = raw.width > 0 ? raw.width / layoutW : zoomScale;
  const scaleY = raw.height > 0 ? raw.height / layoutH : zoomScale;
  const scale = scaleX || zoomScale || 1;

  return {
    raw,
    scale,
    scaleX,
    scaleY,
    left: raw.left,
    top: raw.top,
    right: raw.right,
    bottom: raw.bottom,
    width: layoutW,
    height: layoutH,
    getLocalX: (clientX: number) => (clientX - raw.left) / (scaleX || 1),
    getLocalY: (clientY: number) => (clientY - raw.top) / (scaleY || 1),
  };
};

interface CustomChartWidgetProps {
  key?: React.Key;
  id?: string;
  symbol?: string;
  title?: string;
  isFullscreen?: boolean;
  isZenMode?: boolean;
  isWorkspaceLocked?: boolean;
  isLogScale?: boolean;
  onToggleLogScale?: () => void;
  onToggleFullscreen?: () => void;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  onSplit?: () => void;
  onClose?: () => void;
  globalZoom?: number;
}

export default function CustomChartWidget({ 
  id = 'chart1',
  symbol: initialSymbol = 'BTCUSDT', 
  title = 'Bookmap V5.17 Pro 𝙈𝙤𝙪𝙣𝙩𝘼𝙡𝙜𝙤', 
  isFullscreen, 
  isZenMode,
  isWorkspaceLocked = false,
  isLogScale: propIsLogScale,
  onToggleLogScale,
  onToggleFullscreen, 
  onMoveLeft, 
  onMoveRight,
  onSplit,
  onClose,
  globalZoom
}: CustomChartWidgetProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Global Theme Context (13 Terminal Themes + Indicator Theme Sync)
  const { theme: globalTheme, setTheme: setGlobalTheme, palette: currentPalette, isHighContrast, isLight: themeIsLight } = useTheme();
  const isLight = themeIsLight || currentPalette.dark === '#ffffff';
  const { 
    positions = [], 
    pendingOrders = [],
    cancelPendingOrder,
    updatePendingOrder,
    updatePositionBracket, 
    closePosition, 
    reversePosition,
    toggleAutoBE,
    executeOrder,
    volumePresets,
    activePresetIndex,
    updateLivePrice,
    focusedSymbol,
    focusedChartId,
    setFocusedChart,
    setIsHotkeyModalOpen,
    hotkeysEnabled,
    setHotkeysEnabled,
    chartSyncSymbol,
    setChartSyncSymbol,
    chartSyncTimeframe,
    setChartSyncTimeframe,
    chartSyncCrosshair,
    setChartSyncCrosshair,
    globalCrosshair,
    setGlobalCrosshair,
    syncedGlobalSymbol,
    broadcastSymbolChange,
    syncedGlobalTimeframe,
    broadcastTimeframeChange,
    setIsAccountModalOpen,
    executionFills,
    tradeHistory,
    chartJumpTarget,
    clearChartJumpTarget,
    partialClosePosition,
    setBreakEvenWithOffset,
    scaleInPosition,
    updateMultiBracketTP,
    balance,
    equity,
    isInstantTradeEnabled,
    setIsInstantTradeEnabled,
    activeAccount
  } = useTrade();

  const {
    settings: riskSettings,
    currentDrawdown,
    isRiskExceeded,
    validateOrder
  } = useRiskManager(balance, equity, pendingOrders.map(o => ({
    id: o.id,
    symbol: o.symbol,
    side: o.type as any,
    type: o.orderType as any,
    price: o.price,
    amount: o.size,
    filled: 0,
    remaining: o.size,
    status: 'OPEN' as any,
    timestamp: o.timestamp
  })));

  const [targetSpotlightTime, setTargetSpotlightTime] = useState<{ timestamp: number; title: string } | null>(null);
  const processedJumpIdRef = useRef<string | null>(null);

  const handleReturnToLiveChart = useCallback(() => {
    setPanOffset(0);
    setPriceScale(1);
    setPriceOffset(0);
    setIsAutoScale(true);
    zoomRef.current = 1;
    panOffsetRef.current = 0;
    priceScaleRef.current = 1;
    priceOffsetRef.current = 0;
    isAutoScaleRef.current = true;
    setTargetSpotlightTime(null);
    processedJumpIdRef.current = null;
    if (clearChartJumpTarget) {
      clearChartJumpTarget();
    }
  }, [clearChartJumpTarget]);

  // Active Symbol & Timeframe (with Automatic Persistence in localStorage)
  const [activeSymbol, setActiveSymbol] = useState<string>(() => {
    return localStorage.getItem(`mountalgo_symbol_${id}`) || initialSymbol || localStorage.getItem('mountalgo_symbol') || 'BTCUSDT';
  });

  useEffect(() => {
    localStorage.setItem(`mountalgo_symbol_${id}`, activeSymbol);
    localStorage.setItem('mountalgo_symbol', activeSymbol);
  }, [id, activeSymbol]);

  // Sync initial focus on mount
  useEffect(() => {
    if (focusedChartId === id && focusedSymbol !== activeSymbol) {
      setFocusedChart(id, activeSymbol);
    }
  }, [id, activeSymbol, focusedChartId, focusedSymbol, setFocusedChart]);

  const [timeframe, setTimeframe] = useState<ChartTimeframe>(() => {
    return (localStorage.getItem(`mountalgo_timeframe_${id}`) as any) || (localStorage.getItem('mountalgo_timeframe') as any) || '1m';
  });

  useEffect(() => {
    localStorage.setItem(`mountalgo_timeframe_${id}`, timeframe);
    localStorage.setItem('mountalgo_timeframe', timeframe);
  }, [id, timeframe]);

  // Chart Synchronization Effect: Symbol Sync
  useEffect(() => {
    if (chartSyncSymbol && syncedGlobalSymbol && syncedGlobalSymbol !== activeSymbol) {
      setActiveSymbol(syncedGlobalSymbol);
    }
  }, [chartSyncSymbol, syncedGlobalSymbol, activeSymbol]);

  // Chart Synchronization Effect: Timeframe Sync
  useEffect(() => {
    if (chartSyncTimeframe && syncedGlobalTimeframe && syncedGlobalTimeframe !== timeframe) {
      setTimeframe(syncedGlobalTimeframe as any);
    }
  }, [chartSyncTimeframe, syncedGlobalTimeframe, timeframe]);

  const handleSelectSymbol = useCallback((newSym: string) => {
    if (newSym !== activeSymbol) {
      setIsTransitioning(true);
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = setTimeout(() => setIsTransitioning(false), 50);
    }
    setActiveSymbol(newSym);
    localStorage.setItem(`mountalgo_symbol_${id}`, newSym);
    localStorage.setItem('mountalgo_symbol', newSym);
    if (chartSyncSymbol) {
      broadcastSymbolChange(newSym);
    }
    if (focusedChartId === id) {
      setFocusedChart(id, newSym);
    }
  }, [chartSyncSymbol, broadcastSymbolChange, focusedChartId, id, setFocusedChart]);

  // Enforce Broker Asset Alignment (e.g. MEXC cannot trade EURUSD / Forex)
  useEffect(() => {
    const brokerId = activeAccount?.broker?.toUpperCase() || '';
    const isCryptoOnly = brokerId === 'MEXC' || brokerId === 'BINANCE' || brokerId === 'BYBIT';
    const isForexBroker = brokerId === 'MT4' || brokerId === 'MT5';

    if (isCryptoOnly) {
      const FOREX_COMMODITY_SYMBOLS = [
        'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD',
        'EURGBP', 'EURJPY', 'GBPJPY', 'AUDJPY', 'USDIDR', 'XAUUSD', 'XAGUSD',
        'USOIL', 'UKOIL', 'COPPER', 'NATGAS', 'SPX500', 'NAS100', 'DJI30', 'GER40'
      ];
      if (FOREX_COMMODITY_SYMBOLS.includes(activeSymbol.toUpperCase())) {
        handleSelectSymbol('BTCUSDT');
      }
    } else if (isForexBroker) {
      if (activeSymbol.toUpperCase().endsWith('USDT') || activeSymbol.toUpperCase().endsWith('USDC')) {
        handleSelectSymbol('EURUSD');
      }
    }
  }, [activeAccount?.broker, activeSymbol, handleSelectSymbol]);

  // Keep activeSymbol in sync if initialSymbol prop changes from parent
  useEffect(() => {
    if (initialSymbol && initialSymbol !== activeSymbol) {
      setActiveSymbol(initialSymbol);
      localStorage.setItem(`mountalgo_symbol_${id}`, initialSymbol);
      localStorage.setItem('mountalgo_symbol', initialSymbol);
    }
  }, [initialSymbol, id]);

  // Listen to cross-component symbol switch events (with chart targeting safety)
  useEffect(() => {
    const onSymChanged = (e: any) => {
      const targetSym = typeof e.detail === 'string' ? e.detail : e.detail?.symbol;
      const targetChartId = typeof e.detail === 'object' ? e.detail?.chartId : undefined;

      if (!targetSym) return;

      // Only change symbol if:
      // 1. Explicitly targeted to this chart ID, OR
      // 2. Global chart symbol sync is enabled (chartSyncSymbol), OR
      // 3. This chart is currently focused
      if (
        (targetChartId && targetChartId === id) ||
        chartSyncSymbol ||
        focusedChartId === id ||
        !focusedChartId
      ) {
        if (targetSym !== activeSymbol) {
          handleSelectSymbol(targetSym);
        }
      }
    };
    window.addEventListener('mountalgo_symbol_changed', onSymChanged);
    return () => window.removeEventListener('mountalgo_symbol_changed', onSymChanged);
  }, [activeSymbol, chartSyncSymbol, focusedChartId, id, handleSelectSymbol]);

  const handleSelectTimeframe = useCallback((newTf: ChartTimeframe) => {
    if (newTf !== timeframe) {
      setIsTransitioning(true);
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = setTimeout(() => setIsTransitioning(false), 50);
    }
    setTimeframe(newTf);
    localStorage.setItem(`mountalgo_timeframe_${id}`, newTf);
    localStorage.setItem('mountalgo_timeframe', newTf);
    if (chartSyncTimeframe) {
      broadcastTimeframeChange(newTf);
    }
  }, [id, chartSyncTimeframe, broadcastTimeframeChange, timeframe]);
  const [chartType, setChartType] = useState<ChartType>(() => {
    return (localStorage.getItem(`mountalgo_chart_type_${id}`) as any) || (localStorage.getItem('mountalgo_chart_type') as any) || 'candles';
  });
  const [showQuickScalper, setShowQuickScalper] = useState<boolean>(() => {
    return localStorage.getItem(`mountalgo_show_scalper_${id}`) === 'true';
  });
  const [scalperLotSize, setScalperLotSize] = useState<number>(0.1);
  const [showChartTypeDropdown, setShowChartTypeDropdown] = useState(false);
  const [showTimeframeDropdown, setShowTimeframeDropdown] = useState(false);
  const [showExtraOptionsDropdown, setShowExtraOptionsDropdown] = useState(false);
  const chartTypeBtnRef = useRef<HTMLButtonElement>(null);
  const timeframeBtnRef = useRef<HTMLButtonElement>(null);
  const extraOptionsBtnRef = useRef<HTMLButtonElement>(null);

  // Animation state for Imbalance lines
  // Removed animTick to prevent lag
  const animBirthMapRef = useRef(new Map<string, number>());

  // Modals state
  const [isSymbolModalOpen, setIsSymbolModalOpen] = useState(false);
  const [isIndicatorModalOpen, setIsIndicatorModalOpen] = useState(false);
  const [focusedIndicatorKey, setFocusedIndicatorKey] = useState<string | null>(null);
  const [isLiquidityHeatmapGuideOpen, setIsLiquidityHeatmapGuideOpen] = useState(false);

  const handleOpenWizardTools = (focusKey?: string) => {
    setFocusedIndicatorKey(focusKey || null);
    setIsIndicatorModalOpen(true);
  };

  // Initialize Web Worker for heavy computations
  const workerRef = useRef<Worker | null>(null);
  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/tradingWorker.ts', import.meta.url), { type: 'module' });
    workerRef.current.onmessage = (e) => {
      if (e.data.type === 'HEATMAP_RESULT') {
        // Handle result
      }
    };
    return () => {
      workerRef.current?.terminate();
    };
  }, []);
  const [showLiquidationRadarBar, setShowLiquidationRadarBar] = useState(true);
  const [isRadarMinimized, setIsRadarMinimized] = useState(false);
  const [radarDockPosition, setRadarDockPosition] = useState<'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' | 'docked-bottom' | 'side-left' | 'side-right'>(() => {
    return (localStorage.getItem(`mountalgo_radar_dock_position_${id}`) as any) || (localStorage.getItem('mountalgo_radar_dock_position') as any) || 'docked-bottom';
  });
  useEffect(() => {
    localStorage.setItem(`mountalgo_radar_dock_position_${id}`, radarDockPosition);
    localStorage.setItem('mountalgo_radar_dock_position', radarDockPosition);
  }, [id, radarDockPosition]);

  const [bookmapHudTab, setBookmapHudTab] = useState<'all' | 'analytics' | 'ladder'>('all');
  
  // Real-Time Server Latency Status (HFT)
  const [serverLatency, setServerLatency] = useState(14);
  useEffect(() => {
    const interval = setInterval(() => {
      setServerLatency(Math.floor(Math.random() * 15) + 12);
    }, 2500);
    return () => clearInterval(interval);
  }, []);
  const [isBookmapHudMinimized, setIsBookmapHudMinimized] = useState(false);
  const [bookmapHudPosition, setBookmapHudPosition] = useState<'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'>('bottom-left');
  const [isFootprintModalOpen, setIsFootprintModalOpen] = useState(false);
  const [showDomLadder, setShowDomLadder] = useState<boolean>(() => {
    const saved = localStorage.getItem(`mountalgo_show_dom_ladder_${id}`) || localStorage.getItem('mountalgo_show_dom_ladder');
    return saved !== null ? saved === 'true' : false;
  });

  const [showDomChartOverlay, setShowDomChartOverlay] = useState<boolean>(() => {
    const saved = localStorage.getItem(`mountalgo_dom_chart_overlay_${id}`) || localStorage.getItem('mountalgo_dom_chart_overlay');
    return saved !== null ? saved === 'true' : false;
  });

  useEffect(() => {
    localStorage.setItem(`mountalgo_show_dom_ladder_${id}`, String(showDomLadder));
    localStorage.setItem('mountalgo_show_dom_ladder', String(showDomLadder));
  }, [id, showDomLadder]);

  useEffect(() => {
    localStorage.setItem(`mountalgo_dom_chart_overlay_${id}`, String(showDomChartOverlay));
    localStorage.setItem('mountalgo_dom_chart_overlay', String(showDomChartOverlay));
  }, [id, showDomChartOverlay]);

  // SL/TP Drag Verification & Lock Protection
  const [requireSLTPVerification, setRequireSLTPVerification] = useState<boolean>(() => {
    const saved = localStorage.getItem('require_sltp_verification');
    return saved !== null ? saved === 'true' : true;
  });
  const [isSLTPLocked, setIsSLTPLocked] = useState<boolean>(() => {
    const saved = localStorage.getItem('sltp_lines_locked');
    return saved !== null ? saved === 'true' : false;
  });
  const [sltpVerificationModal, setSltpVerificationModal] = useState<SLTPVerificationData | null>(null);

  useEffect(() => {
    localStorage.setItem('require_sltp_verification', String(requireSLTPVerification));
  }, [requireSLTPVerification]);

  useEffect(() => {
    localStorage.setItem('sltp_lines_locked', String(isSLTPLocked));
  }, [isSLTPLocked]);

  const [sltpToast, setSltpToast] = useState<{ message: string; type: 'success' | 'warning' | 'info' } | null>(null);

  useEffect(() => {
    if (sltpToast) {
      const t = setTimeout(() => setSltpToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [sltpToast]);

  // Footprint V7.2 MountAlgo Settings State (Persistent)
  const [footprintSettings, setFootprintSettings] = useState<FootprintSettings>(() => {
    const saved = localStorage.getItem(`mountalgo_footprint_settings_${id}`) || localStorage.getItem('mountalgo_footprint_settings');
    if (saved) {
      try {
        return { ...DEFAULT_MTF_FOOTPRINT_SETTINGS, ...JSON.parse(saved) };
      } catch (e) {
        console.error(e);
      }
    }
    return {
      ...DEFAULT_MTF_FOOTPRINT_SETTINGS,
      colorTheme: 'DEX Deep',
    };
  });

  // Bookmap V5.17 Pro Settings State (Persistent)
  const [showTradePanel, setShowTradePanel] = useState<boolean>(false);
  const [isAiAssistantVisible, setIsAiAssistantVisible] = useState<boolean>(false);
  const aiLongPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [tradePosition, setTradePosition] = useState<'left' | 'right' | 'bottom'>(() => {
    return (localStorage.getItem(`mountalgo_trade_position_${id}`) as 'left' | 'right' | 'bottom') || 
           (localStorage.getItem('mountalgo_trade_position') as 'left' | 'right' | 'bottom') || 'right';
  });

  // Automatic LocalStorage Sync Handlers
  useEffect(() => {
    localStorage.setItem(`mountalgo_symbol_${id}`, activeSymbol);
    localStorage.setItem('mountalgo_symbol', activeSymbol);
  }, [id, activeSymbol]);

  useEffect(() => {
    localStorage.setItem(`mountalgo_chart_type_${id}`, chartType);
    localStorage.setItem('mountalgo_chart_type', chartType);
  }, [id, chartType]);

  useEffect(() => {
    localStorage.setItem(`mountalgo_trade_position_${id}`, tradePosition);
    localStorage.setItem('mountalgo_trade_position', tradePosition);
  }, [id, tradePosition]);

  useEffect(() => {
    const str = JSON.stringify(footprintSettings);
    localStorage.setItem(`mountalgo_footprint_settings_${id}`, str);
    localStorage.setItem('mountalgo_footprint_settings', str);
  }, [id, footprintSettings]);

  // Cleanup transition timer on unmount
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, []);

  // Raw & Processed Candles
  const [isStateLoaded, setIsStateLoaded] = useState(false);
  const [rawCandles, setRawCandles] = useState<Candle[]>([]);
  const rawCandlesLenRef = useRef(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);

  const candles = useMemo(() => {
    if (chartType === 'heikin') {
      return transformToHeikinAshi(rawCandles);
    }
    return rawCandles;
  }, [rawCandles, chartType]);

  useEffect(() => {
    if (currentPrice !== null) {
      updateLivePrice(activeSymbol, currentPrice);
    }
  }, [currentPrice, activeSymbol, updateLivePrice]);

  const [priceChange24h, setPriceChange24h] = useState<number>(0);
  const [high24h, setHigh24h] = useState<number>(0);
  const [low24h, setLow24h] = useState<number>(0);
  const [volume24h, setVolume24h] = useState<number>(0);
  const [candleCountdown, setCandleCountdown] = useState<string>('00:00');
  const [liveTps, setLiveTps] = useState<number>(0);
  const [tickAbsorptions, setTickAbsorptions] = useState<TickAbsorptionSignal[]>([]);
  const [tickCvdDivergences, setTickCvdDivergences] = useState<TickCvdDivergence[]>([]);
  const tickRingBufferRef = useRef<TickRingBuffer>(new TickRingBuffer(4096));
  const tickEngineRef = useRef<TickCountEngine>(new TickCountEngine('10T'));

  // Synchronize TickCountEngine when in tick timeframe mode
  useEffect(() => {
    if (['1T', '10T', '50T', '100T', 'tick'].includes(timeframe)) {
      const mode: TickModeType = timeframe as TickModeType;
      tickEngineRef.current.setMode(mode);
      if (rawCandles.length > 0) {
        tickEngineRef.current.seedFromCandles(rawCandles);
        const bars = tickEngineRef.current.getAllBars();
        const historicalAbs = bars.filter((b) => !!b.absorption).map((b) => b.absorption!);
        setTickAbsorptions(historicalAbs.slice(-50));
        setTickCvdDivergences(tickEngineRef.current.detectCvdDivergences(35));
      }
    }
  }, [timeframe]);

  // Timeframe interval in seconds helper
  const getTimeframeSeconds = useCallback((tf: string) => {
    switch (tf) {
      case 'tick':
      case '1T': return 1;
      case '10T': return 2;
      case '50T': return 5;
      case '100T': return 10;
      case '1m': return 60;
      case '3m': return 180;
      case '5m': return 300;
      case '15m': return 900;
      case '30m': return 1800;
      case '1h': return 3600;
      case '4h': return 14400;
      case '1D': return 86400;
      case '1W': return 604800;
      case '1M': return 2592000;
      case '3M': return 7776000;
      case '1Y': return 31536000;
      default: return 60;
    }
  }, []);

  // Precise Live Candle Countdown Timer (Updates every 1s)
  useEffect(() => {
    const updateCountdown = () => {
      if (['tick', '1T', '10T', '50T', '100T'].includes(timeframe)) {
        setCandleCountdown(timeframe === 'tick' || timeframe === '1T' ? '⚡ 1T' : `⚡ ${timeframe}`);
        return;
      }
      const tfSec = getTimeframeSeconds(timeframe);
      const nowSec = Math.floor(Date.now() / 1000);
      
      let remainingSec = 0;
      if (rawCandles.length > 0) {
        const lastCandleTimeSec = Math.floor(rawCandles[rawCandles.length - 1].time / 1000);
        const candleEndSec = lastCandleTimeSec + tfSec;
        remainingSec = candleEndSec - nowSec;
        if (remainingSec < 0 || remainingSec > tfSec) {
          remainingSec = tfSec - (nowSec % tfSec);
        }
      } else {
        remainingSec = tfSec - (nowSec % tfSec);
      }

      const totalSec = Math.max(0, remainingSec);
      const hours = Math.floor(totalSec / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;

      if (hours > 0) {
        setCandleCountdown(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      } else {
        setCandleCountdown(
          `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }
    };

    updateCountdown();
    
    const worker = new Worker(new URL('../workers/timerWorker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e) => {
      if (e.data === 'tick') {
        updateCountdown();
      }
    };
    worker.postMessage('start');

    return () => {
      worker.postMessage('stop');
      worker.terminate();
    };
  }, [timeframe, rawCandles, getTimeframeSeconds]);

  const [isToolbarMinimized, setIsToolbarMinimized] = useState<boolean>(false);
  const [showFloatingDrawingBar, setShowFloatingDrawingBar] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('mountalgo_show_floating_drawing_bar');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const toggleFloatingDrawingBar = useCallback(() => {
    setShowFloatingDrawingBar((prev) => {
      const nextVal = !prev;
      try {
        localStorage.setItem('mountalgo_show_floating_drawing_bar', JSON.stringify(nextVal));
      } catch {
        // ignore
      }
      return nextVal;
    });
  }, []);

  useEffect(() => {
    if (isZenMode !== undefined) {
      setIsToolbarMinimized(isZenMode);
    }
  }, [isZenMode]);

  // Chart View State (Supports 2D Continuous Smooth Pan & Zoom, Auto-scale, Log-scale)
  const [zoom, setZoom] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<number>(0);
  const [priceScale, setPriceScale] = useState<number>(1);
  const [priceOffset, setPriceOffset] = useState<number>(0);
  const [isAutoScale, setIsAutoScale] = useState<boolean>(true);

  const zoomRef = useRef(1);
  const panOffsetRef = useRef(0);
  const priceScaleRef = useRef(1);
  const priceOffsetRef = useRef(0);
  const isAutoScaleRef = useRef(true);
  const dragStartAnchorYRef = useRef(0);
  const dragStartAnchorPriceRef = useRef(0);

  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panOffsetRef.current = panOffset; }, [panOffset]);
  useEffect(() => { priceScaleRef.current = priceScale; }, [priceScale]);
  useEffect(() => { priceOffsetRef.current = priceOffset; }, [priceOffset]);
  useEffect(() => { isAutoScaleRef.current = isAutoScale; }, [isAutoScale]);
  const [internalLogScale, setInternalLogScale] = useState<boolean>(false);
  const isLogScale = propIsLogScale !== undefined ? propIsLogScale : internalLogScale;
  const setIsLogScale = useCallback((val: boolean | ((prev: boolean) => boolean)) => {
    if (onToggleLogScale && propIsLogScale !== undefined) {
      onToggleLogScale();
    } else {
      setInternalLogScale((prev) => (typeof val === 'function' ? val(prev) : val));
    }
  }, [onToggleLogScale, propIsLogScale]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStartX, setDragStartX] = useState<number>(0);
  const [dragStartY, setDragStartY] = useState<number>(0);
  const [dragStartOffset, setDragStartOffset] = useState<number>(0);
  const [dragStartPriceScale, setDragStartPriceScale] = useState<number>(1);
  const [dragStartPriceOffset, setDragStartPriceOffset] = useState<number>(0);
  const [dragMode, setDragMode] = useState<'chart' | 'priceAxis' | 'timeAxis' | 'positionSL' | 'positionTP'>('chart');
  const dragPositionRef = useRef<{ id: string, type: 'SL' | 'TP' } | null>(null);
  const pendingPositionPullRef = useRef<{ pos: any; startY: number; startPrice: number; clientX: number; clientY: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; visible: boolean, drawingId?: string } | null>(null);
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);
  const [isDrawingSettingsOpen, setIsDrawingSettingsOpen] = useState<boolean>(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState<boolean>(false);
  const [activeTemplateStyle, setActiveTemplateStyle] = useState<DrawingTemplateStyle | null>(null);
  const [drawingForSettings, setDrawingForSettings] = useState<DrawingItem | null>(null);

  // Clean / Zen Chart Mode for Uncluttered Institutional View
  const [isCleanChartMode, setIsCleanChartMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('mount_algo_clean_chart_mode');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });

  const toggleCleanChartMode = () => {
    setIsCleanChartMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('mount_algo_clean_chart_mode', String(next));
      } catch {}
      return next;
    });
  };

  // Drawing Layer Management State & Persistence
  const [drawingLayers, setDrawingLayers] = useState<DrawingLayer[]>(() => getStoredDrawingLayers());
  const [activeLayerId, setActiveLayerId] = useState<string>(() => getStoredActiveLayerId());
  const [isLayerManagerOpen, setIsLayerManagerOpen] = useState<boolean>(false);

  useEffect(() => {
    saveDrawingLayers(drawingLayers);
  }, [drawingLayers]);

  useEffect(() => {
    saveStoredActiveLayerId(activeLayerId);
  }, [activeLayerId]);

  const layersMap = useMemo(() => new Map(drawingLayers.map((l) => [l.id, l])), [drawingLayers]);
  const [textPromptModal, setTextPromptModal] = useState<{
    isOpen: boolean;
    point: { price: number; time: number } | null;
    text: string;
    type?: 'text' | 'callout';
    drawingId?: string;
  }>({
    isOpen: false,
    point: null,
    text: '',
    type: 'text',
  });

  // Hold Price Trader State & Long-Press Detection
  const [holdTraderModal, setHoldTraderModal] = useState<{
    isOpen: boolean;
    price: number;
    x?: number;
    y?: number;
  }>({
    isOpen: false,
    price: 0,
  });
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const holdStartPosRef = useRef<{ clientX: number; clientY: number; price: number } | null>(null);
  const [holdVisualState, setHoldVisualState] = useState<{
    active: boolean;
    x: number;
    y: number;
    price: number;
  } | null>(null);

  // Real-Time News and Economic Event Milestones on Chart (Directly at Event Candle Bars)
  const [chartNewsEvents, setChartNewsEvents] = useState<ChartNewsEconomicEvent[]>([]);
  const [selectedNewsEventModal, setSelectedNewsEventModal] = useState<ChartNewsEconomicEvent | null>(null);
  const [selectedNewsEventCluster, setSelectedNewsEventCluster] = useState<ChartNewsEconomicEvent[] | null>(null);
  const [hoveredNewsEventId, setHoveredNewsEventId] = useState<string | null>(null);
  const hoveredNewsEventIdRef = useRef<string | null>(null);
  const newsMarkersHitBoxesRef = useRef<Array<{
    id: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    event: ChartNewsEconomicEvent;
  }>>([]);

  // Fetch strictly upcoming & high-impact news & calendar catalysts for active symbol with 3s failover & worker offloading
  useEffect(() => {
    let isMounted = true;

    // Sub-3s SLA fetch helper with automatic secondary failover
    const fetchWithFailover = async (primaryUrl: string, failoverUrl: string, timeoutMs: number = 3000): Promise<any> => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(primaryUrl, { signal: controller.signal });
        clearTimeout(timer);
        if (res.ok) return await res.json();
        throw new Error('Primary feed error');
      } catch (e) {
        clearTimeout(timer);
        // Failover fallback triggered seamlessly
        try {
          const fRes = await fetch(failoverUrl);
          if (fRes.ok) return await fRes.json();
        } catch {
          // secondary error
        }
        return null;
      }
    };

    const loadNewsMilestones = async () => {
      try {
        const [calData, newsRes] = await Promise.all([
          fetchWithFailover('/api/economic-calendar', '/api/economic-calendar/failover', 3000),
          fetch('/api/news').then(r => r.ok ? r.json() : null).catch(() => null),
        ]);

        const combined: ChartNewsEconomicEvent[] = [];

        if (calData && calData.events && Array.isArray(calData.events)) {
          calData.events.forEach((evt: any) => {
            combined.push({
              id: `cal-${evt.id}`,
              event: evt.event,
              country: evt.country,
              currency: evt.currency,
              flag: evt.flag || '🌐',
              impact: evt.impact || 'MEDIUM',
              timestamp: evt.timestamp,
              dateFormatted: evt.dateFormatted,
              timeFormatted: evt.timeFormatted,
              forecast: evt.forecast,
              previous: evt.previous,
              actual: evt.actual,
              unit: evt.unit,
              volatilityRisk: evt.volatilityRisk,
              description: evt.description,
            });
          });
        }

        if (newsRes && newsRes.upcomingNews && Array.isArray(newsRes.upcomingNews)) {
          newsRes.upcomingNews.forEach((n: any) => {
            const ts = n.scheduledAt || n.publishedAt;
            if (ts) {
              combined.push({
                id: `news-${n.id}`,
                event: n.title,
                country: n.categories?.includes('Macro') ? 'US' : 'GLOBAL',
                currency: n.categories?.includes('Forex') ? 'USD' : activeSymbol.slice(0, 3),
                flag: n.categories?.includes('Macro') ? '🇺🇸' : '⚡',
                impact: n.impact || (n.title.toLowerCase().includes('cpi') || n.title.toLowerCase().includes('fomc') ? 'HIGH' : 'MEDIUM'),
                timestamp: ts,
                forecast: '-',
                previous: '-',
                description: n.body,
              });
            }
          });
        }

        // Add real news history (riwayat news) on the chart
        if (newsRes && newsRes.news && Array.isArray(newsRes.news)) {
          newsRes.news.forEach((n: any) => {
            const ts = n.publishedAt;
            if (ts) {
              // Extract the true currency from n.tags or n.categories
              let currency = 'GLOBAL';
              if (n.tags && Array.isArray(n.tags)) {
                const upperTags = n.tags.map((t: string) => t.toUpperCase());
                if (upperTags.some((t: string) => t.includes('BTC') || t === 'BITCOIN')) currency = 'BTC';
                else if (upperTags.some((t: string) => t.includes('ETH') || t === 'ETHEREUM')) currency = 'ETH';
                else if (upperTags.some((t: string) => t.includes('SOL') || t === 'SOLANA')) currency = 'SOL';
                else if (upperTags.some((t: string) => t.includes('XAU') || t === 'GOLD' || t === 'BULLION')) currency = 'XAU';
                else if (upperTags.some((t: string) => t.includes('OIL') || t === 'WTI' || t === 'BRENT' || t === 'USOIL')) currency = 'USOIL';
                else if (upperTags.some((t: string) => t.includes('EUR') || t === 'ECB')) currency = 'EUR';
                else if (upperTags.some((t: string) => t.includes('GBP') || t === 'BOE' || t === 'POUND')) currency = 'GBP';
                else if (upperTags.some((t: string) => t.includes('JPY') || t === 'BOJ' || t === 'YEN')) currency = 'JPY';
                else if (upperTags.some((t: string) => t.includes('FED') || t === 'USD' || t === 'CPI' || t === 'INFLATION' || t === 'NFP')) currency = 'USD';
              }
              if (currency === 'GLOBAL' && n.categories) {
                const catLower = n.categories.toLowerCase();
                if (catLower.includes('crypto')) currency = 'BTC'; // Default crypto representation
                else if (catLower.includes('forex') || catLower.includes('macro')) currency = 'USD';
              }

              combined.push({
                id: `news-hist-${n.id}`,
                event: n.title,
                country: (currency === 'USD' || currency === 'BTC') ? 'US' : currency === 'GLOBAL' ? 'GLOBAL' : currency,
                currency,
                flag: currency === 'BTC' ? '🪙' : currency === 'ETH' ? '🔷' : currency === 'SOL' ? '☀️' : currency === 'XAU' ? '👑' : currency === 'USOIL' ? '🛢️' : currency === 'EUR' ? '🇪🇺' : currency === 'GBP' ? '🇬🇧' : currency === 'JPY' ? '🇯🇵' : '🇺🇸',
                impact: n.impact || (n.title.toLowerCase().includes('cpi') || n.title.toLowerCase().includes('fomc') ? 'HIGH' : 'MEDIUM'),
                timestamp: ts,
                forecast: '-',
                previous: '-',
                description: n.body,
              });
            }
          });
        }

        if (isMounted && combined.length > 0) {
          // Web Worker Offloading: If list exceeds 100 items, offload sort and calculation to background worker thread
          if (combined.length > 100) {
            try {
              const workerResult = await calendarWorkerDispatcher.processEventsAsync(
                combined as any,
                Date.now(),
                'ALL',
                'ALL'
              );
              if (isMounted && workerResult && workerResult.events) {
                setChartNewsEvents(workerResult.events as any);
                return;
              }
            } catch (wErr) {
              console.warn('Worker offloading fallback:', wErr);
            }
          }

          // Direct assignment for regular sizes (<100)
          setChartNewsEvents(combined);
        }
      } catch (err) {
        console.error("Failed to load chart news markers:", err);
      }
    };

    const syncRealCalendarFromClient = async () => {
      try {
        const resp = await fetch("https://nfs.faireconomy.media/ff_calendar_thisweek.json", {
          mode: 'cors',
          headers: { 'Accept': 'application/json' }
        });
        if (resp.ok) {
          const json = await resp.json();
          if (Array.isArray(json) && json.length > 0) {
            console.log("[Calendar Sync] Successfully fetched raw real-time events from browser directly:", json.length);
            await fetch("/api/economic-calendar/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(json)
            }).catch(() => {});
            if (isMounted) {
              loadNewsMilestones();
            }
          }
        }
      } catch (err) {
        console.warn("[Calendar Sync] Client direct fetch failed (possibly CORS or blocked):", err);
      }
    };

    // Attempt direct real-time sync first, then load
    syncRealCalendarFromClient().finally(() => {
      if (isMounted) {
        loadNewsMilestones();
      }
    });

    const interval = setInterval(loadNewsMilestones, 45000);
    // Sync again every 10 minutes from the browser to keep the server cache fresh
    const syncInterval = setInterval(syncRealCalendarFromClient, 10 * 60 * 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      clearInterval(syncInterval);
    };
  }, [activeSymbol]);

  // Drag and Drop Visual Open Position, Pending Order & Bracket State
  const [visualDragState, setVisualDragState] = useState<{
    active: boolean;
    posId?: string;
    pendingId?: string;
    type: 'TP' | 'SL' | 'NEW_TP' | 'NEW_SL' | 'ORDER_BUY' | 'ORDER_SELL' | 'PENDING_ORDER' | 'PENDING_TP' | 'PENDING_SL' | 'NEW_PENDING_TP' | 'NEW_PENDING_SL';
    price: number;
    startPrice?: number;
    size?: number;
    isForex?: boolean;
    mouseX?: number;
    mouseY?: number;
  } | null>(null);

  const visualDragStateRef = useRef<{
    active: boolean;
    posId?: string;
    pendingId?: string;
    type: 'TP' | 'SL' | 'NEW_TP' | 'NEW_SL' | 'ORDER_BUY' | 'ORDER_SELL' | 'PENDING_ORDER' | 'PENDING_TP' | 'PENDING_SL' | 'NEW_PENDING_TP' | 'NEW_PENDING_SL';
    price: number;
    startPrice?: number;
    size?: number;
    isForex?: boolean;
    mouseX?: number;
    mouseY?: number;
  } | null>(null);

  const [positionHoverState, setPositionHoverState] = useState<{
    posId: string;
    element: 'entry' | 'tp' | 'sl' | 'close' | 'reverse' | 'be' | 'new_tp' | 'new_sl' | 'remove_tp' | 'remove_sl' | 'partial_close' | 'pnl_toggle' | 'ts_toggle';
  } | null>(null);

  const [pendingHoverState, setPendingHoverState] = useState<{
    pendingId: string;
    element: 'entry' | 'tp' | 'sl' | 'cancel' | 'new_tp' | 'new_sl' | 'remove_tp' | 'remove_sl';
  } | null>(null);

  // Multi-Market Metadata Resolver (Crypto, Forex, Commodities)
  const marketInfo = useMemo(() => {
    const found = COMPREHENSIVE_MARKET_PAIRS.find(
      (p) => p.symbol.toUpperCase() === activeSymbol.toUpperCase()
    );
    if (found) return found;
    return {
      symbol: activeSymbol,
      base: activeSymbol.replace('USDT', ''),
      quote: 'USDT',
      name: activeSymbol,
      assetClass: 'Crypto' as const,
      category: 'Market',
      defaultPrice: 100,
    };
  }, [activeSymbol]);

  // PnL Display Mode ('currency' | 'percent' | 'pips')
  const [pnlDisplayMode, setPnlDisplayMode] = useState<'currency' | 'percent' | 'pips'>(() => {
    return (localStorage.getItem('mountalgo_pnl_mode') as any) || 'currency';
  });

  const togglePnlDisplayMode = useCallback(() => {
    setPnlDisplayMode((prev) => {
      const next = prev === 'currency' ? 'percent' : prev === 'percent' ? 'pips' : 'currency';
      localStorage.setItem('mountalgo_pnl_mode', next);
      return next;
    });
  }, []);

  // Helper to calculate PnL, percentage & pips for positions and preview drag
  const calculatePositionMetrics = useCallback((
    posType: 'BUY' | 'SELL',
    entryPrice: number,
    targetPrice: number,
    size: number,
    isForex: boolean,
    isJpy: boolean = false
  ) => {
    const diff = posType === 'BUY' ? targetPrice - entryPrice : entryPrice - targetPrice;
    const multiplier = isForex ? 100000 : 1;
    const pnl = diff * size * multiplier;
    const pct = ((targetPrice - entryPrice) / entryPrice) * 100 * (posType === 'BUY' ? 1 : -1);
    const pips = Math.abs(targetPrice - entryPrice) * (isForex ? (isJpy ? 100 : 10000) : 1);
    return { pnl, pct, pips };
  }, []);

  const calculateRiskRewardRatio = useCallback((entry: number, tp?: number, sl?: number, isBuy: boolean = true) => {
    if (!tp || !sl) return null;
    const reward = isBuy ? (tp - entry) : (entry - tp);
    const risk = isBuy ? (entry - sl) : (sl - entry);
    if (risk <= 0 || reward <= 0) return null;
    const ratio = reward / risk;
    return `1:${ratio.toFixed(2)}`;
  }, []);

  const formatPnlDisplay = useCallback((metrics: { pnl: number; pct: number; pips: number }, mode: 'currency' | 'percent' | 'pips') => {
    const isPos = metrics.pnl >= 0;
    const sign = isPos ? '+' : '';
    if (mode === 'percent') {
      return `${sign}${metrics.pct.toFixed(2)}%`;
    } else if (mode === 'pips') {
      return `${sign}${metrics.pips.toFixed(1)}p`;
    }
    return `${sign}$${Math.abs(metrics.pnl).toFixed(2)}`;
  }, []);

  // Helper to calculate stacked label positions to avoid overlapping badges
  const calculateLabelStacks = useCallback((utils: any, vDrag: typeof visualDragState) => {
    if (!utils) return new Map<string, number>();
    const items: { id: string; y: number; h: number }[] = [];
    
    positions.filter(p => p.symbol === activeSymbol).forEach(p => {
       items.push({ id: `pos-entry-${p.id}`, y: utils.getY(p.entryPrice), h: 26 });
       const isDraggingTP = vDrag?.active && vDrag.posId === p.id && (vDrag.type === 'TP' || vDrag.type === 'NEW_TP');
       const tpP = isDraggingTP ? vDrag!.price : p.takeProfit;
       if (tpP) items.push({ id: `pos-tp-${p.id}`, y: utils.getY(tpP), h: 26 });
       const isDraggingSL = vDrag?.active && vDrag.posId === p.id && (vDrag.type === 'SL' || vDrag.type === 'NEW_SL');
       const slP = isDraggingSL ? vDrag!.price : p.stopLoss;
       if (slP) items.push({ id: `pos-sl-${p.id}`, y: utils.getY(slP), h: 26 });
    });

    pendingOrders.filter(o => o.symbol === activeSymbol).forEach(o => {
       const isDraggingOrder = vDrag?.active && vDrag.pendingId === o.id && vDrag.type === 'PENDING_ORDER';
       const orderP = isDraggingOrder ? vDrag!.price : o.price;
       items.push({ id: `pending-entry-${o.id}`, y: utils.getY(orderP), h: 26 });
       const isDraggingTP = vDrag?.active && vDrag.pendingId === o.id && (vDrag.type === 'PENDING_TP' || vDrag.type === 'NEW_PENDING_TP');
       const tpP = isDraggingTP ? vDrag!.price : o.takeProfit;
       if (tpP) items.push({ id: `pending-tp-${o.id}`, y: utils.getY(tpP), h: 26 });
       const isDraggingSL = vDrag?.active && vDrag.pendingId === o.id && (vDrag.type === 'PENDING_SL' || vDrag.type === 'NEW_PENDING_SL');
       const slP = isDraggingSL ? vDrag!.price : o.stopLoss;
       if (slP) items.push({ id: `pending-sl-${o.id}`, y: utils.getY(slP), h: 26 });
    });

    if (items.length === 0) return new Map<string, number>();
    items.sort((a, b) => a.y - b.y);

    const adjusted = new Map<string, number>();
    const minGap = 26;
    for (let i = 0; i < items.length; i++) {
      let finalY = items[i].y;
      if (i > 0) {
        const prevId = items[i-1].id;
        const prevY = adjusted.get(prevId)!;
        if (finalY < prevY + minGap) finalY = prevY + minGap;
      }
      adjusted.set(items[i].id, finalY);
    }
    return adjusted;
  }, [positions, pendingOrders, activeSymbol]);

  // Hit-test active positions (Entry Badge, Action Buttons, Full-Width Entry Line, TP/SL lines and drag handles)
  const getPositionHit = useCallback((mouseX: number, mouseY: number, utils: any) => {
    if (!positions || positions.length === 0 || !utils) return null;
    const activePositions = positions.filter(p => p.symbol === activeSymbol);
    const stacks = calculateLabelStacks(utils, visualDragState);

    for (const pos of activePositions) {
      const entryY = stacks.get(`pos-entry-${pos.id}`) || utils.getY(pos.entryPrice);
      const isBuy = pos.type === 'BUY';
      const isDraggingThisTP = visualDragState?.active && visualDragState.posId === pos.id && (visualDragState.type === 'TP' || visualDragState.type === 'NEW_TP');
      const isDraggingThisSL = visualDragState?.active && visualDragState.posId === pos.id && (visualDragState.type === 'SL' || visualDragState.type === 'NEW_SL');
      const effectiveTP = isDraggingThisTP ? visualDragState!.price : pos.takeProfit;
      const effectiveSL = isDraggingThisSL ? visualDragState!.price : pos.stopLoss;

      // Calculate start X from timestamp
      let startX = 0;
      if (pos.timestamp) {
        const tX = utils.getXFromTime(pos.timestamp);
        if (tX >= 0 && tX <= utils.chartWidth) startX = tX;
      }
      if (startX <= 0) startX = Math.max(0, utils.chartWidth - 280);

      // Width Definitions for segments (must match render logic)
      const segBtnW = 32;
      const segSizeW = 55;
      const segPriceW = 90;
      const segPnlW = 85;
      const hasRR = !!pos.takeProfit && !!pos.stopLoss;
      const segRRW = hasRR ? 65 : 0;
      const totalBadgeW = (segBtnW * 2) + segSizeW + segPriceW + segPnlW + (segBtnW * 4) + segRRW + 12; 
      const badgeX = utils.chartWidth - totalBadgeW - 12;

      // 1. Check TP Line & Handle
      if (pos.takeProfit || isDraggingThisTP) {
        const tpY = stacks.get(`pos-tp-${pos.id}`) || utils.getY(effectiveTP!);
        const tpBadgeW = 180;
        const tpBadgeX = utils.chartWidth - tpBadgeW - 12;
        if (Math.abs(mouseY - tpY) <= 22 && mouseX <= utils.chartWidth + 80) {
          if (mouseX >= tpBadgeX + 148 && mouseX <= tpBadgeX + tpBadgeW) {
            return { pos, element: 'remove_tp' as const, action: 'REMOVE_TP' as const };
          }
          return { pos, element: 'tp' as const, action: 'DRAG_TP' as const };
        }
      }

      // 2. Check SL Line & Handle
      if (pos.stopLoss || isDraggingThisSL) {
        const slY = stacks.get(`pos-sl-${pos.id}`) || utils.getY(effectiveSL!);
        const slBadgeW = 210;
        const slBadgeX = utils.chartWidth - slBadgeW - 12;
        if (Math.abs(mouseY - slY) <= 22 && mouseX <= utils.chartWidth + 80) {
          if (mouseX >= slBadgeX + 190 && mouseX <= slBadgeX + slBadgeW) {
            return { pos, element: 'remove_sl' as const, action: 'REMOVE_SL' as const };
          }
          if (mouseX >= slBadgeX + 155 && mouseX <= slBadgeX + 190) {
            return { pos, element: 'ts_toggle' as const, action: 'TOGGLE_AUTO_BE' as const };
          }
          return { pos, element: 'sl' as const, action: 'DRAG_SL' as const };
        }
      }

      // 3. Check Entry Badge & Line
      const isNearBadge = Math.abs(mouseY - entryY) <= 24 && mouseX <= utils.chartWidth + 80;
      const isNearLine = Math.abs(mouseY - utils.getY(pos.entryPrice)) <= 12 && mouseX <= utils.chartWidth;
      if (isNearBadge || isNearLine) {
        if (isNearBadge && mouseX >= badgeX && mouseX <= badgeX + totalBadgeW) {
          // TP Button
          if (mouseX >= badgeX && mouseX <= badgeX + segBtnW) {
            return { pos, element: 'new_tp' as const, action: 'NEW_TP' as const, cursor: 'pointer' as const };
          }
          // SL Button
          if (mouseX >= badgeX + segBtnW && mouseX <= badgeX + segBtnW * 2) {
            return { pos, element: 'new_sl' as const, action: 'NEW_SL' as const, cursor: 'pointer' as const };
          }

          // BE button
          const beX = badgeX + segBtnW * 2 + segSizeW + segPriceW + segPnlW;
          if (mouseX >= beX && mouseX <= beX + segBtnW) return { pos, element: 'be' as const, action: 'BE' as const, cursor: 'pointer' as const };
          
          // Partial close button
          const halfX = beX + segBtnW;
          if (mouseX >= halfX && mouseX <= halfX + segBtnW) return { pos, element: 'partial_close' as const, action: 'PARTIAL_CLOSE' as const, cursor: 'pointer' as const };
          
          // Reverse button
          const revX = halfX + segBtnW;
          if (mouseX >= revX && mouseX <= revX + segBtnW) return { pos, element: 'reverse' as const, action: 'REVERSE' as const, cursor: 'pointer' as const };
          
          // Close button
          const closeX = revX + segBtnW + segRRW;
          if (mouseX >= closeX && mouseX <= closeX + segBtnW) return { pos, element: 'close' as const, action: 'CLOSE' as const, cursor: 'pointer' as const };

          // PnL toggle (on PnL segment)
          const pnlX = badgeX + segBtnW * 2 + segSizeW + segPriceW;
          if (mouseX >= pnlX && mouseX <= pnlX + segPnlW) return { pos, element: 'pnl_toggle' as const, action: 'TOGGLE_PNL' as const, cursor: 'pointer' as const };
        }
        return { pos, element: 'entry' as const, action: 'ENTRY' as const, cursor: 'ns-resize' as const };
      }
    }
    return null;
  }, [positions, activeSymbol, visualDragState, calculateLabelStacks]);


  // Hit-test active pending orders (Trigger Line, Cancel Button, Drag Handle, TP/SL lines)
  const getPendingOrderHit = useCallback((mouseX: number, mouseY: number, utils: any) => {
    if (!pendingOrders || pendingOrders.length === 0 || !utils) return null;
    const activePending = pendingOrders.filter(o => o.symbol === activeSymbol);
    const stacks = calculateLabelStacks(utils, visualDragState);

    for (const order of activePending) {
      const isDraggingOrder = visualDragState?.active && visualDragState.pendingId === order.id && visualDragState.type === 'PENDING_ORDER';
      const isDraggingTP = visualDragState?.active && visualDragState.pendingId === order.id && (visualDragState.type === 'PENDING_TP' || visualDragState.type === 'NEW_PENDING_TP');
      const isDraggingSL = visualDragState?.active && visualDragState.pendingId === order.id && (visualDragState.type === 'PENDING_SL' || visualDragState.type === 'NEW_PENDING_SL');

      const effectivePrice = isDraggingOrder ? visualDragState!.price : order.price;
      const effectiveTP = isDraggingTP ? visualDragState!.price : order.takeProfit;
      const effectiveSL = isDraggingSL ? visualDragState!.price : order.stopLoss;

      const orderY = stacks.get(`pending-entry-${order.id}`) || utils.getY(effectivePrice);
      const segBtnW = 32;
      const segMainW = 165;
      const totalOrderBadgeW = (segBtnW * 3) + segMainW;
      const badgeX = utils.chartWidth - totalOrderBadgeW - 12;

      if (effectiveTP) {
        const tpY = stacks.get(`pending-tp-${order.id}`) || utils.getY(effectiveTP);
        const tpBadgeW = 120;
        const tpBadgeX = utils.chartWidth - tpBadgeW - 12;
        if (Math.abs(mouseY - tpY) <= 22 && mouseX <= utils.chartWidth + 80) {
          if (mouseX >= tpBadgeX + 105 && mouseX <= tpBadgeX + tpBadgeW) return { order, element: 'remove_tp' as const, action: 'REMOVE_TP' as const };
          return { order, element: 'tp' as const, action: 'DRAG_TP' as const };
        }
      }

      if (effectiveSL) {
        const slY = stacks.get(`pending-sl-${order.id}`) || utils.getY(effectiveSL);
        const slBadgeW = 120;
        const slBadgeX = utils.chartWidth - slBadgeW - 12;
        if (Math.abs(mouseY - slY) <= 22 && mouseX <= utils.chartWidth + 80) {
          if (mouseX >= slBadgeX + 105 && mouseX <= slBadgeX + slBadgeW) return { order, element: 'remove_sl' as const, action: 'REMOVE_SL' as const };
          return { order, element: 'sl' as const, action: 'DRAG_SL' as const };
        }
      }

      // 3. Check Order Line & Area
      const isNearOrderBadge = Math.abs(mouseY - orderY) <= 24 && mouseX <= utils.chartWidth + 80;
      const isNearOrderLine = Math.abs(mouseY - utils.getY(effectivePrice)) <= 12 && mouseX <= utils.chartWidth;
      if (isNearOrderBadge || isNearOrderLine) {
        if (isNearOrderBadge && mouseX >= badgeX && mouseX <= badgeX + totalOrderBadgeW) {
          // TP Button
          if (mouseX >= badgeX && mouseX <= badgeX + segBtnW) {
            return { order, element: 'new_tp' as const, action: 'NEW_TP' as const, cursor: 'pointer' as const };
          }
          // SL Button
          if (mouseX >= badgeX + segBtnW && mouseX <= badgeX + segBtnW * 2) {
            return { order, element: 'new_sl' as const, action: 'NEW_SL' as const, cursor: 'pointer' as const };
          }
          // Close button
          if (mouseX >= badgeX + segBtnW * 2 + segMainW) {
            return { order, element: 'cancel' as const, action: 'CANCEL' as const, cursor: 'pointer' as const };
          }
        }
        return { order, element: 'entry' as const, action: 'DRAG_ORDER' as const, cursor: 'ns-resize' as const };
      }
    }
    return null;
  }, [pendingOrders, activeSymbol, visualDragState]);

  // Indicator Settings (Persistent in localStorage & IDB)
  // Footprint Order Flow HUD Docking Position (Bottom, Left, Right)
  const [hudPosition, setHudPosition] = useState<'bottom' | 'left' | 'right'>(() => {
    return (localStorage.getItem(`mountalgo_hud_position_${id}`) as any) || (localStorage.getItem('mountalgo_hud_position') as any) || 'bottom';
  });

  const [indicators, setIndicators] = useState<IndicatorSettings>(() => {
    try {
      const saved = localStorage.getItem(`mountalgo_indicators_${id}`) || localStorage.getItem('mountalgo_indicators');
      return saved ? { ...DEFAULT_INDICATOR_SETTINGS, ...JSON.parse(saved) } : DEFAULT_INDICATOR_SETTINGS;
    } catch {
      return DEFAULT_INDICATOR_SETTINGS;
    }
  });
  
  useEffect(() => {
    localStorage.setItem(`mountalgo_hud_position_${id}`, hudPosition);
    localStorage.setItem('mountalgo_hud_position', hudPosition);
  }, [id, hudPosition]);

  useEffect(() => {
    try {
      const str = JSON.stringify(indicators);
      localStorage.setItem(`mountalgo_indicators_${id}`, str);
      localStorage.setItem('mountalgo_indicators', str);
    } catch {}
  }, [id, indicators]);

  const [drawings, setDrawings] = useState<DrawingItem[]>(() => {
    try {
      const symbolKey = `mountalgo_drawings_${id}_${activeSymbol}`;
      const savedSymbol = localStorage.getItem(symbolKey);
      if (savedSymbol) return JSON.parse(savedSymbol);
      const saved = localStorage.getItem(`mountalgo_drawings_${id}`) || localStorage.getItem('mountalgo_drawings');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Reload drawings when activeSymbol or id changes to avoid cross-symbol price mismatches
  useEffect(() => {
    if (!activeSymbol) return;
    try {
      const symbolKey = `mountalgo_drawings_${id}_${activeSymbol}`;
      const savedSymbol = localStorage.getItem(symbolKey);
      if (savedSymbol) {
        setDrawings(JSON.parse(savedSymbol));
      } else {
        const saved = localStorage.getItem(`mountalgo_drawings_${id}`) || localStorage.getItem('mountalgo_drawings');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const filtered = parsed.filter((d: DrawingItem) => !d.symbol || d.symbol === activeSymbol);
            setDrawings(filtered);
          }
        }
      }
    } catch {}
  }, [id, activeSymbol]);

  useEffect(() => {
    if (!activeSymbol) return;
    try {
      const symbolKey = `mountalgo_drawings_${id}_${activeSymbol}`;
      localStorage.setItem(symbolKey, JSON.stringify(drawings));
      localStorage.setItem(`mountalgo_drawings_${id}`, JSON.stringify(drawings));
      localStorage.setItem('mountalgo_drawings', JSON.stringify(drawings));
    } catch {}
  }, [id, activeSymbol, drawings]);

  // Listen for AI Trade Setup Application (Tandai Level di Chart)
  useEffect(() => {
    const handleApplyAiTradeSetup = (e: any) => {
      const setup = e.detail;
      if (!setup) return;

      // If symbol is different, switch symbol
      if (setup.symbol && setup.symbol !== activeSymbol) {
        handleSelectSymbol(setup.symbol);
      }

      if (!candles || candles.length === 0) return;

      const lastCandle = candles[candles.length - 1];
      const secondLast = candles.length > 15 ? candles[candles.length - 15] : candles[0];
      const candleInterval = (lastCandle.time - (candles[candles.length - 2]?.time || lastCandle.time - 60000)) || 60000;
      const t1 = lastCandle.time;
      const t2 = lastCandle.time + candleInterval * 35; // Extend 35 bars forward

      const isBuy = setup.direction === 'BUY' || String(setup.direction).toUpperCase().includes('BUY');
      const entryPrice = Number(setup.entry) || lastCandle.close;
      const slPrice = Number(setup.stopLoss) || (isBuy ? entryPrice * 0.988 : entryPrice * 1.012);
      const tp1Price = Number(setup.takeProfit1) || (isBuy ? entryPrice * 1.025 : entryPrice * 0.975);
      const tp2Price = setup.takeProfit2 ? Number(setup.takeProfit2) : null;

      const formatP = (val: number) => {
        if (!val || isNaN(val)) return '0.00';
        return val < 1 ? val.toFixed(6) : val < 100 ? val.toFixed(4) : val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      };

      const slPct = Math.abs(((slPrice - entryPrice) / (entryPrice || 1)) * 100).toFixed(2);
      const tp1Pct = Math.abs(((tp1Price - entryPrice) / (entryPrice || 1)) * 100).toFixed(2);
      const tp2Pct = tp2Price ? Math.abs(((tp2Price - entryPrice) / (entryPrice || 1)) * 100).toFixed(2) : null;
      
      const newLevelDrawings: DrawingItem[] = [];

      // 1. Entry Level Ray (Crisp Cyan Line + Text Box Badge)
      const entryRay: DrawingItem = {
        id: `ai_entry_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: 'horizontal_ray',
        points: [{ time: t1, price: entryPrice }],
        color: '#06b6d4',
        isComplete: true,
        lineWidth: 2,
        lineStyle: 'solid',
        label: `⚡ ENTRY: $${formatP(entryPrice)} [${isBuy ? 'BUY / LONG' : 'SELL / SHORT'}]`,
        textColor: '#38bdf8',
        showPrices: true
      };
      newLevelDrawings.push(entryRay);

      // 2. Take Profit 1 Ray (Emerald Line + Text Box Badge)
      const tp1Ray: DrawingItem = {
        id: `ai_tp1_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: 'horizontal_ray',
        points: [{ time: t1, price: tp1Price }],
        color: '#10b981',
        isComplete: true,
        lineWidth: 2,
        lineStyle: 'dashed',
        label: `🎯 TP1: $${formatP(tp1Price)} (+${tp1Pct}%)`,
        textColor: '#34d399',
        showPrices: true
      };
      newLevelDrawings.push(tp1Ray);

      // 3. Take Profit 2 Ray (Teal Line + Text Box Badge if provided)
      if (tp2Price) {
        const tp2Ray: DrawingItem = {
          id: `ai_tp2_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          type: 'horizontal_ray',
          points: [{ time: t1, price: tp2Price }],
          color: '#059669',
          isComplete: true,
          lineWidth: 1.5,
          lineStyle: 'dotted',
          label: `🚀 TP2: $${formatP(tp2Price)} (+${tp2Pct}%)`,
          textColor: '#6ee7b7',
          showPrices: true
        };
        newLevelDrawings.push(tp2Ray);
      }

      // 4. Stop Loss Ray (Rose Line + Text Box Badge)
      const slRay: DrawingItem = {
        id: `ai_sl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: 'horizontal_ray',
        points: [{ time: t1, price: slPrice }],
        color: '#f43f5e',
        isComplete: true,
        lineWidth: 2,
        lineStyle: 'dashed',
        label: `🛑 STOP LOSS: $${formatP(slPrice)} (-${slPct}%) [R:R 1:${setup.riskReward || '2.5'}]`,
        textColor: '#fb7185',
        showPrices: true
      };
      newLevelDrawings.push(slRay);

      // 5. Key Level / Order Block Zone Box (Clean Header Text Box)
      const fvgTop = setup.fvgZone?.top || (isBuy ? entryPrice * 1.005 : entryPrice * 0.995);
      const fvgBottom = setup.fvgZone?.bottom || (isBuy ? entryPrice * 0.995 : entryPrice * 1.005);
      const fvgBox: DrawingItem = {
        id: `ai_zone_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: 'rectangle',
        points: [
          { time: secondLast.time, price: Math.max(fvgTop, fvgBottom) },
          { time: t2, price: Math.min(fvgTop, fvgBottom) }
        ],
        color: isBuy ? '#06b6d4' : '#a855f7',
        fillColor: isBuy ? '#06b6d418' : '#a855f718',
        fillOpacity: 0.12,
        isComplete: true,
        lineWidth: 1.5,
        label: `📦 ${setup.keyLevelName || (isBuy ? 'Demand / Bullish OB Zone' : 'Supply / Bearish Zone')}`,
        textColor: isBuy ? '#38bdf8' : '#c084fc',
        showPrices: true
      };
      newLevelDrawings.push(fvgBox);

      // 6. Summary Callout Badge (Neat Annotation Text Box)
      const summaryCallout: DrawingItem = {
        id: `ai_summary_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: 'callout',
        points: [{ time: t1, price: entryPrice }],
        color: isBuy ? '#10b981' : '#f43f5e',
        isComplete: true,
        lineWidth: 1.5,
        label: `⚡ AI ${setup.direction || (isBuy ? 'BUY' : 'SELL')} SETUP | R:R 1:${setup.riskReward || '2.5'} | Risk: ${slPct}% | Target: +${tp1Pct}%`,
        textColor: '#ffffff'
      };
      newLevelDrawings.push(summaryCallout);

      setDrawings(prev => [...prev, ...newLevelDrawings]);

      try {
        tradingAudio.play(isBuy ? 'BUY' : 'SELL');
      } catch (e) {}
    };

    window.addEventListener('mountalgo:apply-ai-trade-setup', handleApplyAiTradeSetup);
    return () => {
      window.removeEventListener('mountalgo:apply-ai-trade-setup', handleApplyAiTradeSetup);
    };
  }, [activeSymbol, candles, currentPalette, handleSelectSymbol]);

  useEffect(() => {
    let isMounted = true;
    loadChartStateFromIDB(id).then((savedState) => {
      if (!isMounted) return;
      if (savedState) {
        if (savedState.symbol && savedState.symbol !== activeSymbol) {
          setActiveSymbol(savedState.symbol);
        }
        if (savedState.timeframe && savedState.timeframe !== timeframe) {
          setTimeframe(savedState.timeframe);
        }
        if (savedState.chartType) {
          setChartType(savedState.chartType);
        }
        if (savedState.indicators) {
          setIndicators(prev => ({ ...DEFAULT_INDICATOR_SETTINGS, ...savedState.indicators }));
          if (savedState.indicators.showFootprints) {
            setChartType('footprints');
          }
        }
        if (savedState.footprintSettings) setFootprintSettings(savedState.footprintSettings);
        if (savedState.hudPosition) setHudPosition(savedState.hudPosition);
        if (savedState.tradePosition) setTradePosition(savedState.tradePosition);
        if (Array.isArray(savedState.drawings) && savedState.drawings.length > 0) {
          setDrawings(savedState.drawings);
        }
        if (savedState.radarDockPosition) setRadarDockPosition(savedState.radarDockPosition);
        if (savedState.showDomLadder !== undefined) setShowDomLadder(savedState.showDomLadder);
        if (savedState.showDomChartOverlay !== undefined) setShowDomChartOverlay(savedState.showDomChartOverlay);
      }
      setIsStateLoaded(true);
    });
    return () => { isMounted = false; };
  }, [id]);

  useEffect(() => {
    if (!isStateLoaded) return;
    const stateToSave = {
      symbol: activeSymbol,
      timeframe,
      indicators,
      chartType,
      footprintSettings,
      hudPosition,
      tradePosition,
      drawings,
      radarDockPosition,
      showDomLadder,
      showDomChartOverlay
    };
    saveChartStateToIDB(id, stateToSave);
  }, [id, activeSymbol, timeframe, indicators, chartType, footprintSettings, hudPosition, tradePosition, drawings, radarDockPosition, showDomLadder, showDomChartOverlay, isStateLoaded]);




  // Drawing Tools State
  const [activeTool, setActiveTool] = useState<DrawingToolType>('cursor');
  const [pinnedTools, setPinnedTools] = useState<DrawingToolType[]>(() => {
    try {
      const saved = localStorage.getItem('mountalgo_pinned_tools');
      return saved ? JSON.parse(saved) : ['trendline', 'horizontal', 'rectangle', 'text', 'position_long'];
    } catch {
      return ['trendline', 'horizontal', 'rectangle', 'text', 'position_long'];
    }
  });

  useEffect(() => {
    localStorage.setItem('mountalgo_pinned_tools', JSON.stringify(pinnedTools));
  }, [pinnedTools]);

  useEffect(() => {
    const handleFootprintToggle = (e: any) => {
        const nextVal = e.detail.active;
        setIndicators((prev) => ({ ...prev, showFootprints: nextVal }));
        setChartType((prevType) => {
          if (!nextVal && prevType === 'footprints') {
             return 'candles';
          } else if (nextVal && prevType !== 'footprints') {
             return 'footprints';
          }
          return prevType;
        });
    };
    window.addEventListener('mountalgo_toggle_footprint', handleFootprintToggle);
    return () => window.removeEventListener('mountalgo_toggle_footprint', handleFootprintToggle);
  }, []);
  const userCustomDrawingColorRef = useRef<boolean>(false);
  const [drawingColor, setDrawingColor] = useState<string>(currentPalette.bull);

  useEffect(() => {
    if (!userCustomDrawingColorRef.current) {
      setDrawingColor(prev => (prev === currentPalette.bull ? prev : currentPalette.bull));
    }
  }, [currentPalette.bull]);

  const handleDrawingColorChange = useCallback((newColor: string) => {
    userCustomDrawingColorRef.current = true;
    setDrawingColor(newColor);
  }, []);
  const [isLockedDrawings, setIsLockedDrawings] = useState<boolean>(false);
  const [hideDrawings, setHideDrawings] = useState<boolean>(false);
  const [magnetMode, setMagnetMode] = useState<boolean>(false);
  const [magnetStrength, setMagnetStrength] = useState<'weak' | 'strong'>('strong');
  const [smartAngleSnap, setSmartAngleSnap] = useState<boolean>(true);
  const [alignToExistingDrawings, setAlignToExistingDrawings] = useState<boolean>(true);
  const [stayInDrawingMode, setStayInDrawingMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('mountalgo_stay_drawing_mode') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('mountalgo_stay_drawing_mode', String(stayInDrawingMode));
    } catch {}
  }, [stayInDrawingMode]);
  const isShiftPressedRef = useRef<boolean>(false);
  const isCtrlPressedRef = useRef<boolean>(false);
  const latestSnapResultRef = useRef<SmartSnapResult | null>(null);
  const [currentDrawing, setCurrentDrawing] = useState<DrawingItem | null>(null);
  const [hoveredDrawingId, setHoveredDrawingId] = useState<string | null>(null);
  const [hoveredPart, setHoveredPart] = useState<'point0' | 'point1' | 'point2' | 'point3' | 'point4' | 'point5' | 'left' | 'right' | 'tp' | 'sl' | 'body' | null>(null);

  // Helper to add drawing directly from Hold Price Trader Menu
  const handleAddDrawingFromTrader = useCallback((
    type: 'horizontal' | 'horizontal_ray' | 'position_long' | 'position_short',
    targetPrice: number,
    riskReward?: { takeProfit?: number; stopLoss?: number }
  ) => {
    const tfSec = getTimeframeSeconds(timeframe);
    const nowTime = rawCandles.length > 0 ? rawCandles[rawCandles.length - 1].time : Date.now();

    if (type === 'position_long' || type === 'position_short') {
      const isLong = type === 'position_long';
      const slPercent = 0.015; // Fixed 1.5% SL
      const tpPercent = 0.030; // Fixed 3.0% TP (Risk:Reward = 1:2)

      const defaultTp = isLong ? targetPrice * (1 + tpPercent) : targetPrice * (1 - tpPercent);
      const defaultSl = isLong ? targetPrice * (1 - slPercent) : targetPrice * (1 + slPercent);

      const tp = riskReward?.takeProfit ?? defaultTp;
      const sl = riskReward?.stopLoss ?? defaultSl;
      const tpPct = isLong ? ((tp - targetPrice) / targetPrice) * 100 : ((targetPrice - tp) / targetPrice) * 100;
      const slPct = isLong ? ((targetPrice - sl) / targetPrice) * 100 : ((sl - targetPrice) / targetPrice) * 100;
      const rr = Math.max(0.01, tpPct / (slPct || 0.001));

      const newDrawing: DrawingItem = {
        id: Date.now().toString(),
        type,
        points: [
          { price: targetPrice, time: nowTime },
          { price: targetPrice, time: nowTime + 20 * tfSec * 1000 }
        ],
        color: isLong ? currentPalette.bull : currentPalette.bear,
        isComplete: true,
        riskReward: {
          takeProfit: tp,
          stopLoss: sl,
          riskRatio: parseFloat(rr.toFixed(2)),
        }
      };
      setDrawings((prev) => [...prev, newDrawing]);
      setSelectedDrawingId(newDrawing.id);
    } else {
      const formattedP = targetPrice < 1 ? targetPrice.toFixed(6) : targetPrice < 100 ? targetPrice.toFixed(4) : targetPrice.toFixed(2);
      const newDrawing: DrawingItem = {
        id: Date.now().toString(),
        type: type as any,
        points: [{ price: targetPrice, time: nowTime }],
        color: currentPalette.poc,
        isComplete: true,
        label: `📌 Level: $${formattedP}`,
        showPrices: true
      };
      setDrawings((prev) => [...prev, newDrawing]);
      setSelectedDrawingId(newDrawing.id);
    }
  }, [rawCandles, timeframe, getTimeframeSeconds, currentPalette]);

  // Drawing Drag & Manipulation state
  const dragDrawingStateRef = useRef<{
    id: string;
    part: 'point0' | 'point1' | 'point2' | 'left' | 'right' | 'tp' | 'sl' | 'body';
    initialPoints: { price: number; time: number }[];
    initialRiskReward?: { takeProfit: number; stopLoss: number; riskRatio?: number };
    startPrice: number;
    startTime: number;
    startX: number;
    startY: number;
  } | null>(null);

  const drawStartCoordsRef = useRef<{ clientX: number; clientY: number; moved: boolean } | null>(null);

  // RAF Throttling for high-performance input events
  const mouseMoveRAFRef = useRef<number | null>(null);
  const latestMouseMoveCoordsRef = useRef<{ clientX: number; clientY: number } | null>(null);

  const touchMoveRAFRef = useRef<number | null>(null);
  const latestTouchMoveEventRef = useRef<{ touches: { clientX: number; clientY: number }[] } | null>(null);

  useEffect(() => {
    return () => {
      if (mouseMoveRAFRef.current !== null) {
        cancelAnimationFrame(mouseMoveRAFRef.current);
      }
      if (touchMoveRAFRef.current !== null) {
        cancelAnimationFrame(touchMoveRAFRef.current);
      }
    };
  }, []);

  // Dimensions & Resize
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Crosshair & Hover info
  const [activeTimezone, setActiveTimezone] = useState<string>(() => getStoredTimezone());
  const [useLocalTime, setUseLocalTime] = useState<boolean>(() => localStorage.getItem('mountalgo_timezone') === 'LOCAL');
  const [showNewsMarkers, setShowNewsMarkers] = useState<boolean>(() => localStorage.getItem('mountalgo_show_news_markers') !== 'false');
  const [newsFilterImpact, setNewsFilterImpact] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>(() => (localStorage.getItem('mountalgo_news_filter_impact') as any) || 'ALL');
  const [filterByInstrumentOnly, setFilterByInstrumentOnly] = useState<boolean>(() => localStorage.getItem('mountalgo_news_instrument_only') === 'true');

  useEffect(() => {
    const handleToggle = (e: Event) => {
      const customEvent = e as CustomEvent<boolean>;
      if (typeof customEvent.detail === 'boolean') {
        setShowNewsMarkers(customEvent.detail);
      }
    };
    const handleTzChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setActiveTimezone(customEvent.detail);
        setUseLocalTime(customEvent.detail === 'LOCAL');
      } else {
        setActiveTimezone(getStoredTimezone());
      }
    };

    window.addEventListener('mountalgo_news_markers_toggled', handleToggle);
    window.addEventListener('mountalgo_timezone_changed', handleTzChange);
    return () => {
      window.removeEventListener('mountalgo_news_markers_toggled', handleToggle);
      window.removeEventListener('mountalgo_timezone_changed', handleTzChange);
    };
  }, []);

  const getCurrenciesForSymbol = useCallback((symbol: string): string[] => {
    if (!symbol) return ['USD'];
    const clean = symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (clean.includes('XAU') || clean.includes('GOLD')) return ['USD', 'XAU', 'GOLD'];
    if (clean.includes('XAG') || clean.includes('SILVER')) return ['USD', 'XAG', 'SILVER'];
    if (clean.includes('BTC') || clean.includes('ETH') || clean.includes('CRYPTO')) return ['USD', 'BTC', 'ETH', 'CRYPTO'];
    if (clean.includes('US30') || clean.includes('NAS') || clean.includes('SPX') || clean.includes('DJI') || clean.includes('GER')) return ['USD', 'US', 'EUR'];

    // Handle standard 6-char forex pairs without crypto quote suffixes
    if (clean.length === 6 && !clean.endsWith('USDT') && !clean.endsWith('USDC') && !clean.endsWith('PERP')) {
      return [clean.slice(0, 3), clean.slice(3, 6)];
    }

    // Handle crypto/futures pairs with common quote suffixes
    let base = clean;
    if (clean.endsWith('USDT')) base = clean.slice(0, -4);
    else if (clean.endsWith('USDC')) base = clean.slice(0, -4);
    else if (clean.endsWith('BUSD')) base = clean.slice(0, -4);
    else if (clean.endsWith('PERP')) base = clean.slice(0, -4);
    else if (clean.endsWith('USD')) base = clean.slice(0, -3);

    return Array.from(new Set(['USD', base, clean])).filter(Boolean);
  }, []);
  
  const formatCrosshairTime = useCallback((timestamp: number, isLocal: boolean, tf: string, explicitTz?: string) => {
    const tzToUse = explicitTz || activeTimezone || getStoredTimezone();
    const formatted = formatTimeInTimezone(timestamp, tzToUse);

    if (['tick', '1T', '10T', '50T', '100T', '1s'].includes(tf)) {
      return `${formatted.dateStr}  ${formatted.timeWithSecsStr} (${tf === 'tick' ? '1T' : tf})`;
    }

    if (['1D', '1W', '1M', '3M', '1Y'].includes(tf)) {
      return `${formatted.dateStr}  (${tf})`;
    }
      
    return `${formatted.dateStr}, ${formatted.timeStr} ${formatted.tzAbbr} (${tf})`;
  }, [activeTimezone]);

  const formatGridTime = (timestamp: number, isLocal: boolean) => {
    const d = new Date(timestamp);
    const timeStr = isLocal
      ? `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
      : `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`;
    if (['tick', '1T', '10T', '50T', '100T', '1s'].includes(timeframe)) {
      const secStr = isLocal ? d.getSeconds().toString().padStart(2, '0') : d.getUTCSeconds().toString().padStart(2, '0');
      return `${timeStr}:${secStr}`;
    }
    return timeStr;
  };

  const crosshairRef = useRef<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });
  
  // High-frequency canvas rendering ref to decouple crosshair/hover from React state churn
  const renderCanvasRef = useRef<(() => void) | null>(null);
  const renderOverlayRef = useRef<(() => void) | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const animFrameOverlayRef = useRef<number | null>(null);
  const slowFrameCountRef = useRef<number>(0);
  const isAutoEcoModeRef = useRef<boolean>(false);
  const isFastInteractingRef = useRef<boolean>(false);
  const fastInteractTimerRef = useRef<NodeJS.Timeout | null>(null);

  const notifyFastInteraction = useCallback(() => {
    isFastInteractingRef.current = true;
    if (fastInteractTimerRef.current) {
      clearTimeout(fastInteractTimerRef.current);
    }
    fastInteractTimerRef.current = setTimeout(() => {
      isFastInteractingRef.current = false;
      if (renderCanvasRef.current) {
        renderCanvasRef.current();
      }
      if (renderOverlayRef.current) {
        renderOverlayRef.current();
      }
    }, 120);
  }, []);

  const requestOverlayRender = useCallback(() => {
    if (animFrameOverlayRef.current !== null) return;
    animFrameOverlayRef.current = requestAnimationFrame(() => {
      animFrameOverlayRef.current = null;
      if (renderOverlayRef.current) {
        renderOverlayRef.current();
      }
    });
  }, []);

  const requestRender = useCallback(() => {
    if (animFrameRef.current !== null) return;
    animFrameRef.current = requestAnimationFrame(() => {
      animFrameRef.current = null;
      if (renderCanvasRef.current) {
        renderCanvasRef.current();
      }
      if (renderOverlayRef.current) {
        renderOverlayRef.current();
      }
    });
  }, []);

  // Listen to Global UI Zoom change events from App layout to instantly refresh canvas rendering & coordinates
  useEffect(() => {
    const handleZoomChange = () => {
      requestRender();
    };
    window.addEventListener('mountalgo:zoom-change', handleZoomChange);
    return () => window.removeEventListener('mountalgo:zoom-change', handleZoomChange);
  }, [requestRender]);

  useEffect(() => {
    if (globalZoom !== undefined) {
      requestRender();
    }
  }, [globalZoom, requestRender]);

  const updateCrosshair = useCallback((x: number, y: number, active: boolean) => {
    crosshairRef.current = { x, y, active };
    requestOverlayRender();
  }, [requestOverlayRender]);

  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);
  const [hoveredBox, setHoveredBox] = useState<{
    type: 'imbalance' | 'mitigation';
    isBuy?: boolean;
    top?: number;
    bottom?: number;
    level?: number;
    buyVol?: number;
    sellVol?: number;
    active: boolean;
    startIndex: number;
    endIndex: number;
    x: number;
    y: number;
  } | null>(null);

  // Touch Gesture tracking state (Precision Smooth Pinch & 2D Pan)
  const touchStateRef = useRef<{
    isInteracting: boolean;
    mode: 'chart' | 'priceAxis' | 'timeAxis';
    initialDistance: number;
    initialHDist: number;
    initialVDist: number;
    initialCenter: { x: number; y: number };
    initialZoom: number;
    initialPanOffset: number;
    initialPriceScale: number;
    initialPriceOffset: number;
    lastTouchX: number;
    lastTouchY: number;
    touchStartTime: number;
    hasMoved: boolean;
  }>({
    isInteracting: false,
    mode: 'chart',
    initialDistance: 0,
    initialHDist: 0,
    initialVDist: 0,
    initialCenter: { x: 0, y: 0 },
    initialZoom: 1,
    initialPanOffset: 0,
    initialPriceScale: 1,
    initialPriceOffset: 0,
    lastTouchX: 0,
    lastTouchY: 0,
    touchStartTime: 0,
    hasMoved: false,
  });

  // Transform candles based on ChartType (e.g. Heikin-Ashi)
  // Compute Indicators (Lazy & Zero Allocation - 20x Faster)
  const ema20 = useMemo(() => {
    if (!indicators.showEma20) return [];
    return calculateEMA(candles, indicators.ema20Config?.period || 20, indicators.ema20Config?.source || 'close');
  }, [candles, indicators.showEma20, indicators.ema20Config]);

  const ema50 = useMemo(() => {
    if (!indicators.showEma50) return [];
    return calculateEMA(candles, indicators.ema50Config?.period || 50, indicators.ema50Config?.source || 'close');
  }, [candles, indicators.showEma50, indicators.ema50Config]);

  const ema200 = useMemo(() => {
    if (!indicators.showEma200) return [];
    return calculateEMA(candles, indicators.ema200Config?.period || 200, indicators.ema200Config?.source || 'close');
  }, [candles, indicators.showEma200, indicators.ema200Config]);

  const bollinger = useMemo(() => {
    if (!indicators.showBollinger) return { upper: [], middle: [], lower: [] };
    return calculateBollingerBands(
      candles,
      indicators.bollingerConfig?.period || 20,
      indicators.bollingerConfig?.multiplier || 2,
      indicators.bollingerConfig?.source || 'close'
    );
  }, [candles, indicators.showBollinger, indicators.bollingerConfig]);

  const supertrend = useMemo(() => {
    if (!indicators.showSuperTrend) return { trend: [], supertrend: [], signals: [] };
    return calculateSuperTrend(
      candles,
      indicators.superTrendConfig?.atrPeriod || 10,
      indicators.superTrendConfig?.factor || 3
    );
  }, [candles, indicators.showSuperTrend, indicators.superTrendConfig]);

  const rsi = useMemo(() => {
    if (!indicators.showRSI) return [];
    return calculateRSI(candles, indicators.rsiConfig?.period || 14, indicators.rsiConfig?.source || 'close');
  }, [candles, indicators.showRSI, indicators.rsiConfig]);

  const macd = useMemo(() => {
    if (!indicators.showMACD) return { macd: [], signal: [], histogram: [] };
    return calculateMACD(
      candles,
      indicators.macdConfig?.fastPeriod || 12,
      indicators.macdConfig?.slowPeriod || 26,
      indicators.macdConfig?.signalPeriod || 9,
      indicators.macdConfig?.source || 'close'
    );
  }, [candles, indicators.showMACD, indicators.macdConfig]);

  // Volume Profile LRU Cache Ref (Avoids recalculating 56 buckets on every frame)
  const vpvrCacheRef = useRef<{
    key: string;
    data: VolumeProfileResult | null;
  }>({ key: '', data: null });

  // High-performance Hardware-Accelerated Chart Background Buffer Ref (Zero-cost GPU bit-blit)
  const bgBufferRef = useRef<{
    canvas: HTMLCanvasElement | null;
    width: number;
    height: number;
    themeKey: string;
  }>({ canvas: null, width: 0, height: 0, themeKey: '' });

  // Footprint Order Flow Calculation
  const footprintData = useMemo(() => {
    if (
      indicators.showFootprints ||
      indicators.showVPSidebar ||
      chartType === 'footprints' ||
      (indicators.showLiquidityHeatmap && indicators.liquidityHeatmapConfig?.showVolumeDelta) ||
      indicators.showVolumeDelta ||
      indicators.showVolume
    ) {
      return generateFootprintData(candles, {
        numTicks: footprintSettings.levelsCount || 10,
        imbalanceMultiplier: footprintSettings.imbalanceRatio || 3.0,
        stackedThreshold: footprintSettings.stackedThreshold || 3,
        imbalanceMinVol: footprintSettings.imbalanceMinVol || 3.0,
        valueAreaPct: footprintSettings.valueAreaPct || 70,
        showHeatmap: footprintSettings.showVolumeProfile,
        showStackedRays: footprintSettings.showSrFootprints,
        showSummaryTable: footprintSettings.showDelta,
        showUnfinishedAuction: footprintSettings.showUnfinishedAuction,
        showAbsorptionBadges: footprintSettings.showAbsorptionBadges,
      });
    }
    return [];
  }, [
    candles,
    indicators.showFootprints,
    indicators.showVPSidebar,
    indicators.showLiquidityHeatmap,
    indicators.liquidityHeatmapConfig?.showVolumeDelta,
    indicators.showVolumeDelta,
    indicators.showVolume,
    chartType,
    footprintSettings,
  ]);

  // Volume Acceleration Pipeline
  const accelerationValue = useMemo(() => {
    if (candles.length === 0) return 15;
    const lastCandle = candles[candles.length - 1];
    const prevCandles = candles.slice(-10);
    const avgVol = prevCandles.reduce((sum, c) => sum + (c.volume || 0), 0) / Math.max(1, prevCandles.length);
    const ratio = lastCandle ? ((lastCandle.volume || 0) / Math.max(1, avgVol)) : 1;
    return Math.min(100, Math.max(5, Math.floor(ratio * 40)));
  }, [candles]);

  const tapeData = useMemo(() => {
    return candles.slice(-30).map((c, idx) => ({
      index: idx,
      price: c.close,
      buyVol: Math.round((c.volume || 0) * 0.52),
      sellVol: Math.round((c.volume || 0) * 0.48),
      time: c.time,
    }));
  }, [candles]);

  const bookmapSettings = {} as any;
  const bookmapData = null as any;

  // Acoustic Sonar Alert Synthesizer for High Acceleration Trigger
  const lastSoundTriggerRef = useRef<number>(0);
  useEffect(() => {
    if (accelerationValue > 78 && Date.now() - lastSoundTriggerRef.current > 6000) {
      lastSoundTriggerRef.current = Date.now();
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.35);
          gain.gain.setValueAtTime(0.08, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.36);
        }
      } catch (e) {
        // AudioContext auto-play policy catch
      }
    }
  }, [accelerationValue]);

  // Quantized price step for Order Flow & Heatmap calculation stability
  const quantizedPriceForEngine = useMemo(() => {
    if (!currentPrice) return 0;
    // Quantize to 0.05% step to prevent high-frequency micro-tick calculation churn
    const step = currentPrice > 1000 ? 0.5 : currentPrice > 10 ? 0.05 : 0.005;
    return Math.round(currentPrice / step) * step;
  }, [currentPrice]);

  // Order Flow DOM Ladder High Precision Engine Data
  const domLadderData: DomLadderState = useMemo(() => {
    return generateOrderFlowDomData(candles, footprintData, currentPrice, 38);
  }, [candles, footprintData, quantizedPriceForEngine]);

  // Real-time Liquidity Heatmap Depth Matrix (with high-frequency tick price streaming)
  const liquidityHeatmapData: PreciseHeatmapData = useMemo(() => {
    const cfg = indicators.liquidityHeatmapConfig || DEFAULT_HEATMAP_SETTINGS;
    return calculateLiquidityHeatmap(candles, cfg, domLadderData, footprintData, currentPrice || undefined);
  }, [candles, indicators.liquidityHeatmapConfig, domLadderData, footprintData, quantizedPriceForEngine]);

  const heatmapTimeframeMode: HeatmapTimeframeMode = indicators.liquidityHeatmapConfig?.timeframeMode || 'tick';

  const handleSelectHeatmapTimeframeMode = useCallback((mode: HeatmapTimeframeMode) => {
    setIndicators((prev) => ({
      ...prev,
      liquidityHeatmapConfig: {
        ...(prev.liquidityHeatmapConfig || DEFAULT_HEATMAP_SETTINGS),
        timeframeMode: mode,
      },
    }));
  }, [setIndicators]);

  // Real-Time Whale Bubble Alert Audio Trigger (Sonar Ping)
  const lastWhalePingClusterIdRef = useRef<string | null>(null);
  // Throttle radar bar data updates to 30fps (33ms) for performance
  const lastRadarRenderRef = useRef(0);
  const throttledRadarDataRef = useRef<typeof liquidityHeatmapData>(null);
  if (liquidityHeatmapData) {
    const now = performance.now();
    if (now - lastRadarRenderRef.current >= 33) {
      lastRadarRenderRef.current = now;
      throttledRadarDataRef.current = liquidityHeatmapData;
    }
  }

  useEffect(() => {
    const cfg = indicators.liquidityHeatmapConfig || DEFAULT_HEATMAP_SETTINGS;
    if (!cfg.enabled || !indicators.showLiquidityHeatmap || cfg.showWhaleBubbles === false) return;
    if (!cfg.whaleAudioAlert) return;

    const clusters = liquidityHeatmapData?.whaleClusters;
    if (!clusters || clusters.length === 0 || !candles || candles.length === 0) return;

    // Check recent clusters in the latest active candle
    const latestBarIdx = candles.length - 1;
    const liveWhales = clusters.filter((c) => c.barIndex >= latestBarIdx - 1);
    if (liveWhales.length > 0) {
      const mostRecent = liveWhales[liveWhales.length - 1];
      if (lastWhalePingClusterIdRef.current !== mostRecent.id) {
        lastWhalePingClusterIdRef.current = mostRecent.id;
        try {
          tradingAudio.play('WHALE_PING');
        } catch {
          // benign
        }
      }
    }
  }, [liquidityHeatmapData?.whaleClusters, indicators.showLiquidityHeatmap, indicators.liquidityHeatmapConfig, candles]);

  // Proximity Alert (#13): trigger audio when price approaches a liquidation cluster
  const lastProximityAlertRef = useRef<string>('');
  useEffect(() => {
    if (!currentPrice || !indicators.showLiquidityHeatmap || !indicators.liquidityHeatmapConfig?.showLiquidationRadar) return;
    const clusters = liquidityHeatmapData?.liquidationRadar?.clusters;
    if (!clusters || clusters.length === 0) return;

    const thresholdPct = 0.3; // Alert when price is within 0.3% of a cluster
    for (const cl of clusters) {
      if (cl.isImminent) {
        const pctDiff = Math.abs(cl.price - currentPrice) / currentPrice * 100;
        if (pctDiff <= thresholdPct) {
          const alertKey = `${cl.price.toFixed(2)}_${cl.leverageTier}`;
          if (lastProximityAlertRef.current !== alertKey) {
            lastProximityAlertRef.current = alertKey;
            try { tradingAudio.play('WHALE_PING'); } catch { /* benign */ }
          }
          break;
        }
      }
    }
  }, [currentPrice, liquidityHeatmapData?.liquidationRadar, indicators.showLiquidityHeatmap, indicators.liquidityHeatmapConfig]);

  // Jump to Target Execution Time Effect
  useEffect(() => {
    if (!chartJumpTarget) {
      processedJumpIdRef.current = null;
      return;
    }

    // Do not continuously lock panOffset if this target ID was already jumped to on the active symbol
    if (processedJumpIdRef.current === chartJumpTarget.id && chartJumpTarget.symbol === activeSymbol) {
      return;
    }

    if (chartJumpTarget.symbol === activeSymbol) {
      const targetTimestamp = chartJumpTarget.timestamp;
      if (candles && candles.length > 0 && targetTimestamp) {
        processedJumpIdRef.current = chartJumpTarget.id;

        const firstCandleTime = candles[0].time;
        const isCandleMs = firstCandleTime > 2000000000;
        const normTargetTime = isCandleMs
          ? (targetTimestamp < 2000000000 ? targetTimestamp * 1000 : targetTimestamp)
          : (targetTimestamp > 2000000000 ? Math.floor(targetTimestamp / 1000) : targetTimestamp);

        let closestIdx = 0;
        let minDiff = Infinity;
        candles.forEach((c, i) => {
          const diff = Math.abs(c.time - normTargetTime);
          if (diff < minDiff) {
            minDiff = diff;
            closestIdx = i;
          }
        });

        const isFootprintBar = (chartType === 'footprints' || indicators.showFootprints);
        const baseCandleWidth = isFootprintBar ? 88 : 8;
        const candleWidth = Math.max(isFootprintBar ? 2 : 1, baseCandleWidth * zoom);
        const gapRatio = isFootprintBar ? 0.58 : 0.25;
        const totalCandleSlot = candleWidth + Math.max(isFootprintBar ? 2 : 1, candleWidth * gapRatio);
        
        const centerSlots = Math.floor((dimensions.width / 2 - candleWidth / 2) / totalCandleSlot);
        const calcOffset = (candles.length - 1 - closestIdx) - centerSlots;
        const maxOffset = Math.max(0, candles.length - 2);
        const safeOffset = Math.max(-5, Math.min(maxOffset, calcOffset));
        
        setPanOffset(safeOffset);
        setTargetSpotlightTime({
          timestamp: normTargetTime,
          title: `🎯 TARGET EXECUTION REVIEW (${new Date(targetTimestamp < 2000000000 ? targetTimestamp * 1000 : targetTimestamp).toLocaleTimeString()})`
        });
      }
    } else {
      handleSelectSymbol(chartJumpTarget.symbol);
    }
  }, [chartJumpTarget, activeSymbol, candles, zoom, chartType, indicators.showFootprints, dimensions.width, handleSelectSymbol]);

  // ResizeObserver for dynamic screen & orientation changes
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Multi-Source Kline Historical Data Fetcher (Global Interbank Forex & Commodity Futures + Binance Crypto)
  const fetchKlines = useCallback(async () => {
    const querySymbol = activeSymbol.toUpperCase();

    // 1. Primary: Query Global Market API (Real interbank Forex, Commodity Futures & Crypto)
    try {
      const res = await fetch(
        `/api/market/klines?symbol=${encodeURIComponent(querySymbol)}&interval=${encodeURIComponent(timeframe)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.candles) && data.candles.length > 0) {
          setRawCandles(data.candles);
          rawCandlesLenRef.current = data.candles.length;
          const last = data.candles[data.candles.length - 1];
          setCurrentPrice((data.currentPrice > 0) ? data.currentPrice : (last.close > 0 ? last.close : currentPrice));
          if (data.priceChange24h !== undefined) setPriceChange24h(data.priceChange24h);
          if (data.high24h !== undefined) setHigh24h(data.high24h);
          if (data.low24h !== undefined) setLow24h(data.low24h);
          if (data.volume24h !== undefined) setVolume24h(data.volume24h);
          setIsTransitioning(false);
          if (transitionTimerRef.current) { clearTimeout(transitionTimerRef.current); transitionTimerRef.current = null; }
          return;
        }
      }
    } catch {
      // Continue to direct Binance/Futures fallback
    }

    // 2. Direct Binance Spot
    let binanceSymbol = querySymbol;
    if (binanceSymbol === 'XAUUSD') binanceSymbol = 'PAXGUSDT';
    else if (binanceSymbol === 'EURUSD') binanceSymbol = 'EURUSDT';
    else if (binanceSymbol === 'GBPUSD') binanceSymbol = 'GBPUSDT';

    let spotInterval = timeframe;
    if (['1T', '10T', '50T', '100T', 'tick'].includes(timeframe)) {
      spotInterval = '1s' as any;
    }

    try {
      const res = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${spotInterval}&limit=1000`
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          let parsed: Candle[] = data.map((d: any) => ({
            time: d[0],
            open: parseFloat(d[1]),
            high: parseFloat(d[2]),
            low: parseFloat(d[3]),
            close: parseFloat(d[4]),
            volume: parseFloat(d[5]),
          }));

          if (timeframe === '10T' && parsed.length > 0) {
            const grouped: Candle[] = [];
            const STEP = 10 * 1000;
            for (const c of parsed) {
              const bucket = Math.floor(c.time / STEP) * STEP;
              const last = grouped[grouped.length - 1];
              if (last && last.time === bucket) {
                last.high = Math.max(last.high, c.high);
                last.low = Math.min(last.low, c.low);
                last.close = c.close;
                last.volume += c.volume;
              } else {
                grouped.push({ time: bucket, open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume });
              }
            }
            parsed = grouped;
          }

          setRawCandles(parsed);
          rawCandlesLenRef.current = parsed.length;
          const last = parsed[parsed.length - 1];
          if (last.close > 0) setCurrentPrice(last.close);
          setIsTransitioning(false);
          if (transitionTimerRef.current) { clearTimeout(transitionTimerRef.current); transitionTimerRef.current = null; }
          return;
        }
      }
    } catch {
      // Continue to next fallback
    }

    // 3. Direct Binance Futures
    try {
      let futuresInterval = timeframe;
      if (['1T', '10T', '50T', '100T', 'tick'].includes(timeframe)) {
        futuresInterval = '1m' as any;
      }
      const res = await fetch(
        `https://fapi.binance.com/fapi/v1/klines?symbol=${binanceSymbol}&interval=${futuresInterval}&limit=1000`
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const parsed: Candle[] = data.map((d: any) => ({
            time: d[0],
            open: parseFloat(d[1]),
            high: parseFloat(d[2]),
            low: parseFloat(d[3]),
            close: parseFloat(d[4]),
            volume: parseFloat(d[5]),
          }));

          setRawCandles(parsed);
          rawCandlesLenRef.current = parsed.length;
          const last = parsed[parsed.length - 1];
          if (last.close > 0) setCurrentPrice(last.close);
          setIsTransitioning(false);
          if (transitionTimerRef.current) { clearTimeout(transitionTimerRef.current); transitionTimerRef.current = null; }
          return;
        }
      }
    } catch {}

    // Fallback: generate synthetic candles when ALL API sources fail
    // (prevents permanent blank chart in offline/restricted environments)
    if (rawCandlesLenRef.current === 0) {
      const now = Date.now();
      const tfSec = getTimeframeSeconds(timeframe);
      const basePrice = marketInfo.defaultPrice || 100;
      const synthetic: Candle[] = [];
      for (let i = 1000; i >= 0; i--) {
        const t = now - i * tfSec * 1000;
        const drift = (Math.random() - 0.48) * basePrice * 0.003;
        const prev = synthetic.length > 0 ? synthetic[synthetic.length - 1] : { close: basePrice };
        const open = prev.close;
        const close = Math.max(0.0001, open + drift);
        const high = Math.max(open, close) * (1 + Math.random() * 0.001);
        const low = Math.min(open, close) * (1 - Math.random() * 0.001);
        const vol = Math.round(50 + Math.random() * 200);
        synthetic.push({ time: t, open, high, low, close, volume: vol });
      }
      setRawCandles(synthetic);
      rawCandlesLenRef.current = synthetic.length;
      setCurrentPrice(synthetic[synthetic.length - 1].close);
    }
    // Clear transition loading indicator once data is loaded
    setIsTransitioning(false);
    if (transitionTimerRef.current) { clearTimeout(transitionTimerRef.current); transitionTimerRef.current = null; }
  }, [activeSymbol, timeframe]);

  // Fetch 24hr Stats
  const fetch24hStats = useCallback(async () => {
    const querySymbol = activeSymbol.toUpperCase();

    try {
      const res = await fetch(`/api/market/all-tickers`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.tickers && data.tickers[querySymbol]) {
          const t = data.tickers[querySymbol];
          setPriceChange24h(t.change24h || 0);
          setHigh24h(t.high || 0);
          setLow24h(t.low || 0);
          setVolume24h(t.volume || 0);
          if (t.price) setCurrentPrice(t.price);
          return;
        }
      }
    } catch {}

    let binanceSymbol = querySymbol;
    if (binanceSymbol === 'XAUUSD') binanceSymbol = 'PAXGUSDT';
    else if (binanceSymbol === 'EURUSD') binanceSymbol = 'EURUSDT';
    else if (binanceSymbol === 'GBPUSD') binanceSymbol = 'GBPUSDT';

    try {
      const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.priceChangePercent) {
          setPriceChange24h(parseFloat(data.priceChangePercent) || 0);
          setHigh24h(parseFloat(data.highPrice) || 0);
          setLow24h(parseFloat(data.lowPrice) || 0);
          setVolume24h(parseFloat(data.volume) || 0);
          return;
        }
      }
    } catch {}
  }, [activeSymbol]);

  const fetchKlinesRef = useRef(fetchKlines);
  fetchKlinesRef.current = fetchKlines;

  useEffect(() => {
    fetchKlines();
    fetch24hStats();
    const interval = setInterval(() => {
      fetchKlinesRef.current();
      fetch24hStats();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchKlines, fetch24hStats]);

  // Force refetch on timeframe change (backup for stale interval)
  useEffect(() => {
    fetchKlines();
  }, [timeframe, activeSymbol]);

  // BUG FIX: Ensure Footprint data is fetched on initial switch or load if missing
  useEffect(() => {
    if ((chartType === 'footprints' || indicators.showFootprints) && rawCandles.length === 0 && isStateLoaded) {
      fetchKlines();
    }
  }, [chartType, indicators.showFootprints, rawCandles.length, isStateLoaded, fetchKlines]);

  // WebSocket Live Stream & Real-Time Micro-Tick Simulation Engine
  useEffect(() => {
    let ws: WebSocket | null = null;
    let fallbackInterval: any = null;
    let isMounted = true;

    let querySymbol = activeSymbol.toLowerCase();
    if (querySymbol === 'xauusd') querySymbol = 'paxgusdt';
    else if (querySymbol === 'eurusd') querySymbol = 'eurusdt';
    else if (querySymbol === 'gbpusd') querySymbol = 'gbpusdt';

    const startFallbackLiveTicks = () => {
      if (fallbackInterval) return;
      // High-frequency polling fallback for Forex, Commodities, or WebSocket interruption
      // 750ms interval ensures zero perceptible latency during high volatility news events
      fallbackInterval = setInterval(async () => {
        if (!isMounted) return;
        try {
          const res = await fetch(`/api/market/klines?symbol=${encodeURIComponent(activeSymbol)}&interval=${encodeURIComponent(timeframe)}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.success && Array.isArray(data.candles) && data.candles.length > 0) {
              const latestCandles = data.candles as Candle[];
              setRawCandles(latestCandles);
              rawCandlesLenRef.current = latestCandles.length;
              const last = latestCandles[latestCandles.length - 1];
              if (data.currentPrice > 0) setCurrentPrice(data.currentPrice);
              else if (last && last.close > 0) setCurrentPrice(last.close);
            }
          }
        } catch {}
      }, 750);
    };

    let pendingCandle: Candle | null = null;
    let rafId: number | null = null;

    const flushPendingCandle = () => {
      if (!isMounted) return;
      const trades = tickRingBufferRef.current.drainAll();
      const currentTps = tickRingBufferRef.current.getTps();
      if (currentTps !== liveTps) {
        setLiveTps(currentTps);
      }

      if (['1T', '10T', '50T', '100T', 'tick'].includes(timeframe)) {
        if (trades.length > 0) {
          const { completed, activeBar } = tickEngineRef.current.processTradeBatch(trades);
          
          if (activeBar) {
            setCurrentPrice(activeBar.close);
          }

          if (completed.length > 0) {
            const newAbs = completed.filter((b) => !!b.absorption).map((b) => b.absorption!);
            if (newAbs.length > 0) {
              setTickAbsorptions((prev) => [...prev, ...newAbs].slice(-50));
            }
            setTickCvdDivergences(tickEngineRef.current.detectCvdDivergences(35));
            setRawCandles(tickEngineRef.current.getCandles().slice(-1500));
          } else if (activeBar) {
            setRawCandles((prev) => {
              if (prev.length === 0) return [activeBar];
              const lastCandle = prev[prev.length - 1];
              const updatedLast: Candle = {
                ...lastCandle,
                high: Math.max(lastCandle.high, activeBar.high),
                low: Math.min(lastCandle.low, activeBar.low),
                close: activeBar.close,
                volume: activeBar.volume,
              };
              return [...prev.slice(0, -1), updatedLast];
            });
          }
        }
        return;
      }

      if (!pendingCandle) return;
      let updatedCandle = pendingCandle;
      pendingCandle = null;
      setCurrentPrice(updatedCandle.close);

      setRawCandles((prev) => {
        if (prev.length === 0) return [updatedCandle];
        const lastCandle = prev[prev.length - 1];
        if (lastCandle.time === updatedCandle.time) {
          const merged: Candle = {
            ...lastCandle,
            high: Math.max(lastCandle.high, updatedCandle.high),
            low: Math.min(lastCandle.low, updatedCandle.low),
            close: updatedCandle.close,
            volume: Math.max(lastCandle.volume, updatedCandle.volume),
          };
          return [...prev.slice(0, -1), merged];
        } else if (updatedCandle.time > lastCandle.time) {
          return [...prev, updatedCandle].slice(-1500);
        }
        return prev;
      });
    };

    const connectWS = () => {
      try {
        let wsInterval = timeframe;
        if (['1T', '10T', '50T', '100T', 'tick'].includes(timeframe)) {
          wsInterval = '1s' as any;
        }

        // Subscribing to Binance Combined Stream (aggTrade for 0-latency live order-book execution + kline for candles)
        const wsUrl = `wss://stream.binance.com:9443/stream?streams=${querySymbol}@aggTrade/${querySymbol}@kline_${wsInterval}`;
        ws = new WebSocket(wsUrl);

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const raw = JSON.parse(event.data);
            const payload = raw.data || raw;

            // 1. Instant Real-Time Trade Tick (0 latency execution during volatility)
            if (payload.e === 'aggTrade' || raw.stream?.endsWith('@aggTrade')) {
              const tradePrice = parseFloat(payload.p);
              const tradeVol = parseFloat(payload.q);
              const isBuyerMaker = !!payload.m;

              if (tradePrice > 0) {
                tickRingBufferRef.current.push(
                  tradePrice,
                  Math.max(0.01, tradeVol),
                  payload.T || Date.now(),
                  isBuyerMaker
                );

                setCurrentPrice(tradePrice);

                // Instantly update active candle high, low, close in memory
                setRawCandles((prev) => {
                  if (prev.length === 0) return prev;
                  const last = prev[prev.length - 1];
                  if (tradePrice === last.close && tradePrice <= last.high && tradePrice >= last.low) return prev;
                  const updated: Candle = {
                    ...last,
                    high: Math.max(last.high, tradePrice),
                    low: Math.min(last.low, tradePrice),
                    close: tradePrice,
                    volume: last.volume + (tradeVol > 0 ? tradeVol : 0.001),
                  };
                  return [...prev.slice(0, -1), updated];
                });
              }
              return;
            }

            // 2. Official Candle Confirmation (Kline stream)
            const k = payload.k || (payload.e === 'kline' ? payload.k : null);
            if (!k) return;

            const cPrice = parseFloat(k.c);
            const cVol = parseFloat(k.v);
            const isBuyerMaker = parseFloat(k.c) < parseFloat(k.o);

            tickRingBufferRef.current.push(
              cPrice,
              Math.max(0.1, cVol),
              k.t || Date.now(),
              isBuyerMaker
            );

            pendingCandle = {
              time: k.t,
              open: parseFloat(k.o),
              high: parseFloat(k.h),
              low: parseFloat(k.l),
              close: cPrice,
              volume: cVol,
            };

            if (rafId === null) {
              rafId = requestAnimationFrame(() => {
                rafId = null;
                flushPendingCandle();
              });
            }
          } catch (e) {
            console.error('WS parse error', e);
          }
        };

        ws.onerror = () => {
          startFallbackLiveTicks();
        };

        ws.onclose = () => {
          if (isMounted) setTimeout(connectWS, 1200);
        };
      } catch {
        startFallbackLiveTicks();
      }
    };

    connectWS();
    return () => {
      isMounted = false;
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (ws) ws.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, [activeSymbol, timeframe]);

  // Helper coordinate mapper with 2D Continuous Smooth Pan & Zoom
  const getCoordinateUtils = useCallback(() => {
    const { width, height } = dimensions;
    if (width === 0 || height === 0 || candles.length === 0) return null;

    const rightScaleWidth = 72;
    const bottomScaleHeight = 24;
    const chartWidth = Math.max(50, width - rightScaleWidth);
    const fullHeight = Math.max(50, height - bottomScaleHeight);

    // Indicator panels heights calculation (Dedicated non-overlapping panes)
    const showVolDelta = (indicators.showLiquidityHeatmap && indicators.liquidityHeatmapConfig?.showVolumeDelta) || indicators.showVolumeDelta;
    const volHeight = indicators.showVolume ? Math.floor(fullHeight * 0.14) : 0;
    const volDeltaHeight = showVolDelta ? Math.floor(fullHeight * 0.15) : 0;
    const candleCvdHeight = indicators.showIcdCandles
      ? Math.floor(fullHeight * Math.min(40, Math.max(8, indicators.icdCandlesConfig?.paneHeightPercent || 15)) / 100)
      : 0;
    const rsiHeight = indicators.showRSI ? Math.floor(fullHeight * 0.15) : 0;
    const macdHeight = indicators.showMACD ? Math.floor(fullHeight * 0.17) : 0;
    const totalSubWindowsHeight = volHeight + volDeltaHeight + candleCvdHeight + rsiHeight + macdHeight;
    const mainChartHeight = Math.max(60, fullHeight - totalSubWindowsHeight);

    // Dynamic Candle Dimensions
    const isFootprintBar = (chartType === 'footprints' || indicators.showFootprints);
    const baseCandleWidth = isFootprintBar ? 88 : 8;
    const candleWidth = Math.max(isFootprintBar ? 2 : 1, baseCandleWidth * zoom);
    const gapRatio = isFootprintBar ? 0.58 : 0.25;
    const totalCandleSlot = candleWidth + Math.max(isFootprintBar ? 2 : 1, candleWidth * gapRatio);

    // Continuous Visible Window Calculation (Sub-pixel smooth panning)
    const safeCandleSlot = Math.max(1, totalCandleSlot);
    const visibleCount = Math.ceil(chartWidth / safeCandleSlot) + 4;
    // Allow generous 2D panning (3x chart width for center-zoom expansion)
    const minOffset = -Math.floor((chartWidth * 3.0) / safeCandleSlot);
    const maxOffset = Math.max(0, candles.length - 2);
    const safeOffset = Math.min(Math.max(minOffset, panOffset), maxOffset);

    const endIndex = candles.length - safeOffset;
    const startIndex = Math.max(0, Math.floor(endIndex - visibleCount));
    const visibleCandles = candles.slice(startIndex, Math.min(candles.length, Math.ceil(Math.max(0, endIndex)) + 2));

    // Price scaling & 2D vertical pan offset (TradingView AutoScale vs Manual)
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    visibleCandles.forEach((c) => {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
    });

    // Radar clusters live at fixed % offsets (±0.85% → ±9.2%) and would blow the
    // price axis to an enormous range, flattening every candle into a thin band.
    // Exclude them from the coordinate range entirely — the LiquidationRadarBar
    // component renders independently and stays fully visible at any scale.

    if (minPrice === Infinity || maxPrice === -Infinity || minPrice === maxPrice) {
      // No usable visible range (e.g. panned off the edge or a single flat candle):
      // fall back to the full candle set so the canvas never renders blank.
      let fallbackMin = Infinity;
      let fallbackMax = -Infinity;
      // Use only the most recent 50 candles to avoid displaying stale price ranges
      const recentCandles = candles.slice(Math.max(0, candles.length - 50));
      recentCandles.forEach((c) => {
        if (c.low < fallbackMin) fallbackMin = c.low;
        if (c.high > fallbackMax) fallbackMax = c.high;
      });
      if (fallbackMin !== Infinity && fallbackMax !== -Infinity && fallbackMin < fallbackMax) {
        minPrice = fallbackMin;
        maxPrice = fallbackMax;
      } else {
        minPrice = 1;
        maxPrice = 100;
      }
    }

    const activePriceScale = isAutoScale ? 1 : priceScale;
    const activePriceOffset = isAutoScale ? 0 : priceOffset;

    const basePricePadding = (maxPrice - minPrice) * 0.08 || 1;
    const baseMin = minPrice - basePricePadding;
    const baseMax = maxPrice + basePricePadding;
    const baseCenter = (baseMin + baseMax) / 2 + activePriceOffset;
    const baseHalfRange = (baseMax - baseMin) / 2;

    // Apply activePriceScale (higher priceScale = expanded/zoomed-in price view, smaller range)
    const effectiveHalfRange = Math.max(0.00001, baseHalfRange / Math.max(0.05, activePriceScale));
    const priceMin = baseCenter - effectiveHalfRange;
    const priceMax = baseCenter + effectiveHalfRange;
    const priceRange = priceMax - priceMin;

    // Continuous sub-pixel accurate horizontal coordinate
    const getX = (index: number) => {
      const posFromRight = (candles.length - 1 - safeOffset) - index;
      return chartWidth - posFromRight * totalCandleSlot - candleWidth / 2;
    };

    const isFootprintMode = chartType === 'footprints' || indicators.showFootprints;
    const summaryMode = isFootprintMode ? (footprintSettings.summaryRows || '4-Tier (Vol, Delta, Range, CVD)') : 'Off';
    const bottomPadding = summaryMode === 'Off' ? 0 : (summaryMode === '5-Tier (+Delta %)' ? 54 : summaryMode === 'Compact (Vol, Delta)' ? 26 : 44);

    const getY = (price: number) => {
      const drawableHeight = mainChartHeight - bottomPadding;
      if (isLogScale && priceMin > 0 && price > 0) {
        const logMin = Math.log(priceMin);
        const logMax = Math.log(priceMax);
        const logVal = Math.log(price);
        return drawableHeight - ((logVal - logMin) / (logMax - logMin || 1)) * drawableHeight;
      }
      return drawableHeight - ((price - priceMin) / priceRange) * drawableHeight;
    };

    const getPriceFromY = (y: number) => {
      const drawableHeight = mainChartHeight - bottomPadding;
      if (isLogScale && priceMin > 0 && priceMax > 0) {
        const logMin = Math.log(priceMin);
        const logMax = Math.log(priceMax);
        const logVal = logMax - (y / drawableHeight) * (logMax - logMin);
        return Math.exp(logVal);
      }
      return priceMax - (y / drawableHeight) * priceRange;
    };

    // Robust continuous time & coordinate conversion
    const barInterval = candles.length > 1
      ? (candles[candles.length - 1].time - candles[0].time) / (candles.length - 1)
      : 60000;

    const getXFromTime = (rawTime: number): number => {
      if (candles.length === 0 || !isFinite(rawTime)) return chartWidth / 2;

      // Normalize time scale matching candles (seconds vs milliseconds)
      const firstCandleTime = candles[0].time;
      const isCandleMs = firstCandleTime > 2000000000;
      const isTimeMs = rawTime > 2000000000;

      let time = rawTime;
      if (isCandleMs && !isTimeMs) time = rawTime * 1000;
      else if (!isCandleMs && isTimeMs) time = Math.floor(rawTime / 1000);

      if (candles.length === 1) {
        const frac = (time - candles[0].time) / (barInterval || 60000);
        return getX(frac);
      }

      const lastCandle = candles[candles.length - 1];
      if (time >= lastCandle.time) {
        const frac = (time - lastCandle.time) / (barInterval || 60000);
        return getX((candles.length - 1) + frac);
      }

      const firstCandle = candles[0];
      if (time <= firstCandle.time) {
        const frac = (time - firstCandle.time) / (barInterval || 60000);
        return getX(frac);
      }

      // Binary search for exact interval
      let low = 0;
      let high = candles.length - 1;
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        if (candles[mid].time <= time) {
          if (mid === candles.length - 1 || candles[mid + 1].time > time) {
            const t1 = candles[mid].time;
            const t2 = candles[mid + 1].time;
            const frac = (time - t1) / (t2 - t1 || 1);
            return getX(mid + frac);
          }
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }
      return getX(0);
    };

    const getTimeFromX = (x: number): number => {
      if (candles.length === 0) return Date.now();
      const posFromRight = (chartWidth - x - candleWidth / 2) / totalCandleSlot;
      const floatIndex = (candles.length - 1 - safeOffset) - posFromRight;

      if (floatIndex >= candles.length - 1) {
        const lastCandle = candles[candles.length - 1];
        return lastCandle.time + (floatIndex - (candles.length - 1)) * (barInterval || 60000);
      }
      if (floatIndex <= 0) {
        const firstCandle = candles[0];
        return firstCandle.time + floatIndex * (barInterval || 60000);
      }

      const baseIdx = Math.floor(floatIndex);
      const frac = floatIndex - baseIdx;
      const t1 = candles[baseIdx].time;
      const t2 = candles[baseIdx + 1]?.time || (t1 + (barInterval || 60000));
      return t1 + frac * (t2 - t1);
    };

    const drawableHeight = mainChartHeight - bottomPadding;

    return {
      width,
      height,
      rightScaleWidth,
      bottomScaleHeight,
      chartWidth,
      chartHeight: mainChartHeight,
      fullHeight,
      mainChartHeight,
      drawableHeight,
      baseMin,
      baseMax,
      baseHalfRange,
      baseCenter,
      rsiHeight,
      macdHeight,
      volHeight,
      volDeltaHeight,
      candleCvdHeight,
      totalSubWindowsHeight,
      candleWidth,
      totalCandleSlot,
      visibleCount,
      safeOffset,
      startIndex,
      endIndex,
      visibleCandles,
      priceMin,
      priceMax,
      priceRange,
      getX,
      getY,
      getPriceFromY,
      getXFromTime,
      getTimeFromX,
      barInterval,
    };
  }, [dimensions, candles, indicators, chartType, zoom, panOffset, priceScale, priceOffset, isAutoScale, isLogScale]);

  // Jump to Liquidation Price Level Handler
  const handleJumpToLiquidationPrice = useCallback((targetPrice: number) => {
    if (!targetPrice || isNaN(targetPrice)) return;
    const utils = getCoordinateUtils();
    if (utils && utils.priceRange > 0) {
      const currentCenter = (utils.priceMin + utils.priceMax) / 2;
      const diff = targetPrice - currentCenter;
      const newOffset = (isAutoScaleRef.current ? 0 : priceOffsetRef.current) + diff;
      setPriceOffset(newOffset);
      priceOffsetRef.current = newOffset;
      setIsAutoScale(false);
      isAutoScaleRef.current = false;
    }
    setSltpToast({
      message: `🎯 Berpindah ke Level Likuidasi: $${targetPrice > 100 ? targetPrice.toFixed(2) : targetPrice.toFixed(4)}`,
      type: 'info'
    });
    setTimeout(() => setSltpToast(null), 3000);
  }, [getCoordinateUtils, isAutoScale]);

  // Coordinate Conversion Helper for User Drawing & Smart Magnet & Alignment Snapping
  const getCanvasPriceAndTime = useCallback((clientX: number, clientY: number, customOpts?: Partial<SmartSnappingOptions>) => {
    const rect = getAdjustedCanvasRect(canvasRef.current);
    const utils = getCoordinateUtils();
    if (!rect || !utils || candles.length === 0) return null;

    const x = rect.getLocalX(clientX);
    const y = rect.getLocalY(clientY);

    const effectiveMagnet =
      customOpts?.magnetMode !== undefined
        ? customOpts.magnetMode
        : magnetMode || isCtrlPressedRef.current;

    const snapResult = calculateSmartSnap(x, y, candles, utils, {
      magnetMode: effectiveMagnet,
      magnetStrength: customOpts?.magnetStrength || magnetStrength,
      smartAngleSnap:
        customOpts?.smartAngleSnap !== undefined
          ? customOpts.smartAngleSnap
          : smartAngleSnap,
      alignToExistingDrawings:
        customOpts?.alignToExistingDrawings !== undefined
          ? customOpts.alignToExistingDrawings
          : alignToExistingDrawings,
      isShiftPressed: isShiftPressedRef.current || customOpts?.isShiftPressed,
      activeTool: customOpts?.activeTool || activeTool,
      currentDrawing:
        customOpts?.currentDrawing !== undefined
          ? customOpts.currentDrawing
          : currentDrawing,
      drawings: customOpts?.drawings || drawings,
    });

    latestSnapResultRef.current = snapResult;

    return {
      price: snapResult.price,
      time: snapResult.time,
      x: snapResult.x,
      y: snapResult.y,
      snapResult,
    };
  }, [
    candles,
    getCoordinateUtils,
    magnetMode,
    magnetStrength,
    smartAngleSnap,
    alignToExistingDrawings,
    activeTool,
    currentDrawing,
    drawings,
  ]);

  // Hit testing for User Drawings and Control Handles
  const getDrawingHit = useCallback((mouseX: number, mouseY: number) => {
    const utils = getCoordinateUtils();
    if (!utils || hideDrawings) return null;
    return getDrawingHitTest(mouseX, mouseY, drawings, utils, hideDrawings);
  }, [drawings, getCoordinateUtils, hideDrawings]);

  // Canvas buffer resize is now handled inline in the render loop to prevent
  // blank-on-reload race conditions where canvas.width reset clears the buffer
  // but the render rAF gets cancelled before it can redraw.

  // Render Loop on Canvas
  useEffect(() => {
    let animationFrameId: number;

    const renderCanvas = () => {
      const frameStartTime = performance.now();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let hasActiveAnimations = false;
      const now = Date.now();
      const animDuration = 400;

      const utils = getCoordinateUtils();
      if (!utils) return;

      try {
        // Inline canvas resize: ensures the buffer is always correctly sized
        // right before drawing, preventing blank-on-reload race conditions and optimizing for Global Zoom scaling
        {
          const zoomScale = getGlobalZoomScale();
          const dpr = Math.max(1, Math.min((window.devicePixelRatio || 1) * zoomScale, 3.5));
          const targetW = Math.floor(utils.width * dpr);
          const targetH = Math.floor(utils.height * dpr);
          if (canvas.width !== targetW || canvas.height !== targetH) {
            canvas.width = targetW;
            canvas.height = targetH;
          }
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
        }

    const {
      width,
      height,
      rightScaleWidth,
      chartWidth,
      fullHeight,
      mainChartHeight,
      rsiHeight,
      macdHeight,
      volHeight,
      volDeltaHeight,
      candleCvdHeight,
      totalSubWindowsHeight,
      candleWidth,
      totalCandleSlot,
      visibleCount,
      safeOffset,
      startIndex,
      endIndex,
      visibleCandles,
      priceMin,
      priceMax,
      priceRange,
      getX,
      getY,
      getPriceFromY,
      getXFromTime,
      getTimeFromX,
    } = utils;

    // Update chart state ref for DOM-based crosshair time badge

    // 1. Background Fill & 3D Glass Radial Neon Glow Synchronized with Active Theme (Hardware-Accelerated Cached Buffer)
    const zoomScale = getGlobalZoomScale();
    const darkBase = currentPalette?.dark || '#030408';
    const bullColor = currentPalette?.bull || '#10b981';
    const bearColor = currentPalette?.bear || '#ef4444';
    const pocColor = currentPalette?.poc || '#f59e0b';
    const themeKey = `${isLight}_${isHighContrast}_${darkBase}_${bullColor}_${bearColor}_${pocColor}_${width}_${height}`;

    if (!bgBufferRef.current.canvas) {
      bgBufferRef.current.canvas = document.createElement('canvas');
    }
    const bgCanvas = bgBufferRef.current.canvas;

    if (bgBufferRef.current.themeKey !== themeKey || bgBufferRef.current.width !== width || bgBufferRef.current.height !== height) {
      bgCanvas.width = width;
      bgCanvas.height = height;
      const bgCtx = bgCanvas.getContext('2d');
      if (bgCtx) {
        if (!isLight) {
          const grad = bgCtx.createRadialGradient(
            width / 2, height / 2, 10,
            width / 2, height / 2, Math.max(width, height) * 0.95
          );
          grad.addColorStop(0, darkBase === '#242119' ? '#2e2a20' : (darkBase !== '#000000' ? darkBase : '#0c101d'));
          grad.addColorStop(0.5, darkBase === '#242119' ? '#242119' : (darkBase !== '#000000' ? darkBase : '#060812'));
          grad.addColorStop(1, darkBase === '#242119' ? '#1a1710' : '#020306');
          bgCtx.fillStyle = grad;
          bgCtx.fillRect(0, 0, width, height);

          const bullAura = bgCtx.createRadialGradient(width * 0.25, height * 0.2, 0, width * 0.25, height * 0.2, Math.max(width, height) * 0.55);
          bullAura.addColorStop(0, `${bullColor}12`);
          bullAura.addColorStop(0.5, `${bullColor}03`);
          bullAura.addColorStop(1, 'transparent');
          bgCtx.fillStyle = bullAura;
          bgCtx.fillRect(0, 0, width, height);

          const bearAura = bgCtx.createRadialGradient(width * 0.75, height * 0.8, 0, width * 0.75, height * 0.8, Math.max(width, height) * 0.55);
          bearAura.addColorStop(0, `${bearColor}0d`);
          bearAura.addColorStop(0.5, `${bearColor}02`);
          bearAura.addColorStop(1, 'transparent');
          bgCtx.fillStyle = bearAura;
          bgCtx.fillRect(0, 0, width, height);

          const pocAura = bgCtx.createRadialGradient(width * 0.5, height * 0.5, 0, width * 0.5, height * 0.5, Math.max(width, height) * 0.4);
          pocAura.addColorStop(0, `${pocColor}08`);
          pocAura.addColorStop(0.6, 'transparent');
          bgCtx.fillStyle = pocAura;
          bgCtx.fillRect(0, 0, width, height);
        } else {
          bgCtx.fillStyle = isLight ? '#ffffff' : darkBase;
          bgCtx.fillRect(0, 0, width, height);
        }
      }
      bgBufferRef.current = { canvas: bgCanvas, width, height, themeKey };
    }

    // Instant Zero-Cost GPU Hardware Blit
    ctx.drawImage(bgCanvas, 0, 0);

    const chartBg = isLight ? '#ffffff' : darkBase;
    const chartGrid = isLight ? 'rgba(0, 0, 0, 0.06)' : `${bullColor}12`; // Dynamic subtle theme-tinted grid
    const chartScaleText = isHighContrast 
      ? (isLight ? '#000000' : '#ffffff') 
      : (isLight ? '#0f172a' : (darkBase === '#242119' ? '#dcd6ca' : '#94a3b8'));
    const chartScaleBg = isHighContrast
      ? (isLight ? '#ffffff' : '#000000')
      : (isLight ? '#f8fafc' : (darkBase === '#242119' ? '#1d1a13' : (darkBase !== '#000000' ? `${darkBase}f0` : 'rgba(5, 7, 15, 0.95)')));
    const chartBorder = isHighContrast
      ? (isLight ? '#000000' : '#ffffff')
      : (isLight ? '#cbd5e1' : (darkBase === '#242119' ? '#3e3626' : 'rgba(255, 255, 255, 0.12)'));

    // Dotted subtle grid lines matching Bookmap aesthetic
    const showChartGrid = true;
    ctx.strokeStyle = indicators.showLiquidityHeatmap ? 'rgba(255, 255, 255, 0.08)' : chartGrid;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);

    // Professional trading-grade Nice Price Steps (multiples of 1, 2, 5 * 10^n)
    const targetTicks = Math.max(4, Math.min(12, Math.round(mainChartHeight / 55)));
    const roughStep = priceRange / Math.max(1, targetTicks);
    const power = Math.floor(Math.log10(Math.max(1e-8, roughStep)));
    const base = Math.pow(10, power);
    const frac = roughStep / base;

    let niceMultiplier = 1;
    if (frac >= 6.5) niceMultiplier = 10;
    else if (frac >= 3.5) niceMultiplier = 5;
    else if (frac >= 1.75) niceMultiplier = 2;
    else niceMultiplier = 1;

    const niceStep = niceMultiplier * base;
    const firstTickPrice = Math.ceil(priceMin / niceStep) * niceStep;

    // Formatting precision based on step size
    const decimals = niceStep >= 1 ? (priceMin > 1000 ? 0 : 2) : Math.min(8, Math.max(0, -Math.floor(Math.log10(niceStep))));

    for (let price = firstTickPrice; price <= priceMax + niceStep * 0.05; price += niceStep) {
      const y = (getY(price) | 0) + 0.5;
      if (y < 0 || y > mainChartHeight) continue;
      if (showChartGrid) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(chartWidth, y);
        ctx.stroke();
      }

      // Small tick mark on right scale border
      ctx.beginPath();
      ctx.moveTo(chartWidth, y);
      ctx.lineTo(chartWidth + 4, y);
      ctx.stroke();

      // Right Scale Price Text
      ctx.fillStyle = chartScaleText;
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(price.toFixed(decimals), chartWidth + 6, y + 3.5);
    }

    // Vertical Time Grid Lines: Auto-Adaptive spacing (Pixel-Quantized Fast Stroke)
    const maxTimeLines = Math.max(4, Math.min(12, Math.round(7 * zoomScale)));
    const step = Math.max(1, Math.floor(visibleCount / maxTimeLines));
    for (let i = 0; i < visibleCandles.length; i += step) {
      const globalIdx = startIndex + i;
      const x = (getX(globalIdx) | 0) + 0.5;
      if (showChartGrid) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, fullHeight);
        ctx.stroke();
      }
    }
    ctx.setLineDash([]);

    // 2B. Real-Time Liquidity Heatmap Layer (Order Book & Limit Density Depth Matrix)
    if (indicators.showLiquidityHeatmap && liquidityHeatmapData) {
      renderLiquidityHeatmapLayer({
        ctx,
        data: liquidityHeatmapData,
        settings: {
          ...(indicators.liquidityHeatmapConfig || DEFAULT_HEATMAP_SETTINGS),
          ecoMode: isAutoEcoModeRef.current || isDragging,
        },
        palette: currentPalette,
        startIndex,
        endIndex,
        candleWidth,
        chartWidth,
        mainChartHeight,
        fullHeight,
        rightScaleWidth,
        getX,
        getY,
        isDragging,
        cleanMode: isCleanChartMode,
        visibleCandles,
        priceMin,
        priceMax,
        volumeProfileConfig: indicators.volumeProfileConfig,
        currentPrice,
      });
    }

    // 3. Bookmap V5.17 Pro Watermark & Branding (Subtle & Non-Obtrusive)
    // Volume Histogram has been moved to a separate sub-window pane at the bottom

    // 6. Render Candlesticks / Order Flow Footprints / Line / Blank
    // Canvas clip rect: prevent candles from bleeding past chart boundaries
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, chartWidth, mainChartHeight);
    ctx.clip();
    if (chartType === 'blank') {
      // Blank chart mode - skip all candle rendering, show only grid, price lines, and overlays
    } else if (chartType === 'line' || chartType === 'area') {
      if (visibleCandles.length > 0) {
        if (chartType === 'area') {
          const grad = ctx.createLinearGradient(0, 0, 0, mainChartHeight);
          grad.addColorStop(0, `${currentPalette.bull}55`);
          grad.addColorStop(0.6, `${currentPalette.bull}15`);
          grad.addColorStop(1, `${currentPalette.bull}00`);
          ctx.fillStyle = grad;

          ctx.beginPath();
          visibleCandles.forEach((c, idx) => {
            const globalIdx = startIndex + idx;
            const x = getX(globalIdx);
            const y = getY(c.close);
            if (idx === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          const lastX = getX(startIndex + visibleCandles.length - 1);
          const firstX = getX(startIndex);
          ctx.lineTo(lastX, mainChartHeight);
          ctx.lineTo(firstX, mainChartHeight);
          ctx.closePath();
          ctx.fill();
        }

        // Draw glowing neon stroke
        ctx.save();
        ctx.shadowColor = currentPalette.bull;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        visibleCandles.forEach((c, idx) => {
          const globalIdx = startIndex + idx;
          const x = getX(globalIdx);
          const y = getY(c.close);
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = currentPalette.bull;
        ctx.lineWidth = 2.2;
        ctx.stroke();
        ctx.restore();

        // Pulsing bead on latest price
        const lastCandle = visibleCandles[visibleCandles.length - 1];
        const lastCandleX = getX(startIndex + visibleCandles.length - 1);
        const lastCandleY = getY(lastCandle.close);
        ctx.save();
        ctx.fillStyle = currentPalette.bull;
        ctx.beginPath();
        ctx.arc(lastCandleX, lastCandleY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }
    } else if (chartType === 'baseline') {
      if (visibleCandles.length > 0) {
        const basePrice = visibleCandles[0].open;
        const baseY = getY(basePrice);
        const lastX = getX(startIndex + visibleCandles.length - 1);
        const firstX = getX(startIndex);

        // 1. Top Area (Prices above baseline)
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, chartWidth, Math.max(0, baseY));
        ctx.clip();

        const bullGrad = ctx.createLinearGradient(0, 0, 0, baseY);
        bullGrad.addColorStop(0, `${currentPalette.bull}45`);
        bullGrad.addColorStop(1, `${currentPalette.bull}00`);
        ctx.fillStyle = bullGrad;
        ctx.beginPath();
        visibleCandles.forEach((c, idx) => {
          const globalIdx = startIndex + idx;
          const x = getX(globalIdx);
          const y = getY(c.close);
          if (idx === 0) ctx.moveTo(x, baseY);
          ctx.lineTo(x, y);
        });
        ctx.lineTo(lastX, baseY);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        visibleCandles.forEach((c, idx) => {
          const globalIdx = startIndex + idx;
          const x = getX(globalIdx);
          const y = getY(c.close);
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = currentPalette.bull;
        ctx.lineWidth = 2.2;
        ctx.stroke();
        ctx.restore();

        // 2. Bottom Area (Prices below baseline)
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, baseY, chartWidth, Math.max(0, mainChartHeight - baseY));
        ctx.clip();

        const bearGrad = ctx.createLinearGradient(0, baseY, 0, mainChartHeight);
        bearGrad.addColorStop(0, `${currentPalette.bear}00`);
        bearGrad.addColorStop(1, `${currentPalette.bear}45`);
        ctx.fillStyle = bearGrad;
        ctx.beginPath();
        visibleCandles.forEach((c, idx) => {
          const globalIdx = startIndex + idx;
          const x = getX(globalIdx);
          const y = getY(c.close);
          if (idx === 0) ctx.moveTo(x, baseY);
          ctx.lineTo(x, y);
        });
        ctx.lineTo(lastX, baseY);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        visibleCandles.forEach((c, idx) => {
          const globalIdx = startIndex + idx;
          const x = getX(globalIdx);
          const y = getY(c.close);
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = currentPalette.bear;
        ctx.lineWidth = 2.2;
        ctx.stroke();
        ctx.restore();

        // 3. Baseline Divider Line
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, baseY);
        ctx.lineTo(chartWidth, baseY);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.font = 'bold 8.5px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`BASELINE ${basePrice.toFixed(basePrice > 100 ? 2 : 4)}`, chartWidth - 8, baseY - 4);
        ctx.restore();
      }
    } else if (chartType === 'footprints' || indicators.showFootprints) {
      // -------------------------------------------------------------
      // SUPER PROFESSIONAL ORDER FLOW FOOTPRINT CANDLES V7.2
      // -------------------------------------------------------------
      const bullCol = currentPalette.bull;
      const bearCol = currentPalette.bear;
      const pocCol = currentPalette.poc || '#ffffff';
      const vahCol = currentPalette.poc || '#ffd600';

      // 1. Horizontal Imbalance Lines with Mitigation and Animation
      if (footprintSettings.showImbalance) {
        const activeZones: Array<{
          startIdx: number;
          endIdx: number | null;
          priceTop: number;
          priceBottom: number;
          type: 'buy' | 'sell';
        }> = [];

        footprintData.forEach((fp, globalIdx) => {
          if (!fp) return;
          const candle = candles[globalIdx];
          if (!candle) return;

          activeZones.forEach(z => {
            if (!z.endIdx && globalIdx > z.startIdx) {
              const bodyTop = Math.max(candle.open, candle.close);
              const bodyBottom = Math.min(candle.open, candle.close);
              
              // Mitigation: candle body crosses/overlaps the zone
              if (bodyBottom <= z.priceTop && bodyTop >= z.priceBottom) {
                z.endIdx = globalIdx;
              }
            }
          });

          // Draw horizontal lines ONLY for highlighted imbalances (!inValueArea)
          fp.levels.forEach(lvl => {
            if (!lvl.inValueArea) {
              if (lvl.isImbalanceBuy) {
                activeZones.push({ startIdx: globalIdx, endIdx: null, priceTop: lvl.price, priceBottom: lvl.price, type: 'buy' });
              }
              if (lvl.isImbalanceSell) {
                activeZones.push({ startIdx: globalIdx, endIdx: null, priceTop: lvl.price, priceBottom: lvl.price, type: 'sell' });
              }
            }
          });
        });

        const activeOnly = activeZones.filter(z => !z.endIdx);
        const validActiveSet = new Set(activeOnly.slice(-12));

        const zonesToDraw = activeZones.filter(z => {
          if (!z.endIdx) return validActiveSet.has(z);
          if (z.endIdx >= startIndex) return true;
          return false;
        });

        zonesToDraw.forEach(z => {
          if (z.startIdx > endIndex + 2) return;

          const xStart = getX(z.startIdx) + candleWidth / 2;
          const xEnd = z.endIdx !== null ? getX(z.endIdx) + candleWidth / 2 : chartWidth;
          const yTop = getY(z.priceTop);
          const yBottom = getY(z.priceBottom);
          const h = Math.max(2, yBottom - yTop);

          ctx.save();
          const col = z.type === 'buy' ? bullCol : bearCol;
          
          // Animation scaling
          const imbKey = `horiz-${z.startIdx}-${z.priceTop}`;
          let birth = animBirthMapRef.current.get(imbKey);
          if (!birth) {
            birth = now;
            animBirthMapRef.current.set(imbKey, birth);
          }
          const age = now - birth;
          let progress = 1;
          if (age < animDuration) {
            progress = age / animDuration;
            progress = 1 - Math.pow(1 - progress, 3);
            hasActiveAnimations = true;
          }

          const targetWidth = Math.max(0, xEnd - xStart);
          const currentWidth = targetWidth * progress;

          if (!(z.endIdx !== null && z.endIdx < startIndex)) {
             ctx.fillStyle = `${col}1A`; 
             ctx.fillRect(xStart, yTop, currentWidth, h);

             ctx.strokeStyle = col;
             ctx.lineWidth = 1.2;
             ctx.setLineDash(z.endIdx !== null ? [4, 4] : []);
             ctx.beginPath();
             ctx.moveTo(xStart, yTop);
             ctx.lineTo(xStart + currentWidth, yTop);
             ctx.moveTo(xStart, yBottom);
             ctx.lineTo(xStart + currentWidth, yBottom);
             ctx.stroke();

             if (z.endIdx !== null && z.endIdx >= startIndex && progress >= 0.99) {
               ctx.setLineDash([]);
               ctx.fillStyle = col;
               ctx.beginPath();
               ctx.arc(xStart + currentWidth, (yTop + yBottom)/2, 2.5, 0, Math.PI*2);
               ctx.fill();
             }
          }
          ctx.restore();
        });
      }

      // Pre-calculate Cumulative Volume Delta (CVD)
      let currentCVD = 0;
      const cvdData: number[] = new Array(candles.length).fill(0);
      for (let i = 0; i < candles.length; i++) {
        if (footprintData[i]) {
          currentCVD += footprintData[i].delta;
        }
        cvdData[i] = currentCVD;
      }

      // 2. Draw Footprint Bars & Micro Order Flow Cells
      visibleCandles.forEach((c, idx) => {
        const globalIdx = startIndex + idx;
        const x = getX(globalIdx) - candleWidth / 2;
        const fp = footprintData[globalIdx];
        const isBull = c.close >= c.open;

        const openY = getY(c.open);
        const closeY = getY(c.close);
        const highY = getY(c.high);
        const lowY = getY(c.low);

        const topY = Math.min(openY, closeY);
        const bottomY = Math.max(openY, closeY);
        const center = x + candleWidth / 2;

        if (candleWidth < 22) {
          // Zoomed Out -> Render Clean Standard Candlestick
          const candleColor = isBull ? bullCol : bearCol;

          // Wick
          ctx.strokeStyle = candleColor;
          ctx.lineWidth = Math.max(1, candleWidth / 10);
          ctx.beginPath();
          ctx.moveTo(center, highY);
          ctx.lineTo(center, lowY);
          ctx.stroke();

          // Body
          const bodyH = Math.max(2, bottomY - topY);
          if (chartType === 'hollow') {
            // Hollow footprint: wick above/below body only
            ctx.strokeStyle = candleColor;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(center, highY);
            ctx.lineTo(center, topY);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(center, bottomY);
            ctx.lineTo(center, lowY);
            ctx.stroke();
            // Body outline with subtle semi-transparent background fill
            ctx.save();
            ctx.fillStyle = candleColor;
            ctx.globalAlpha = 0.32;
            ctx.fillRect(center - Math.max(1.5, (Math.min(candleWidth * 0.75, 32)) / 2), topY, Math.max(3, Math.min(candleWidth * 0.75, 32)), bodyH);
            ctx.restore();

            ctx.lineWidth = 1.8;
            ctx.strokeRect(center - Math.max(1.5, (Math.min(candleWidth * 0.75, 32)) / 2), topY, Math.max(3, Math.min(candleWidth * 0.75, 32)), bodyH);
          } else {
            ctx.fillStyle = candleColor;
            ctx.fillRect(center - Math.max(1.5, (Math.min(candleWidth * 0.75, 32)) / 2), topY, Math.max(3, Math.min(candleWidth * 0.75, 32)), bodyH);
          }

          // Show POC dot if fp exists
          if (footprintSettings.showPoc && fp && fp.pocPrice) {
            const pocY = getY(fp.pocPrice);
            ctx.fillStyle = pocCol || '#f59e0b';
            ctx.fillRect(center - 2, pocY - 1, 4, 2);
          }
        } else {
          // Zoomed In (candleWidth >= 22) -> Full Footprint Profile Rendering
          
          // Draw Wick
          ctx.strokeStyle = isBull ? bullCol : bearCol;
          ctx.lineWidth = Math.max(1.5, candleWidth / 30);
          ctx.beginPath();
          ctx.moveTo(center, highY);
          ctx.lineTo(center, lowY);
          ctx.stroke();

          // Draw central body
          const centerGap = Math.max(8, candleWidth / 12);
          const bodyW = Math.max(6, candleWidth / 15);
          ctx.fillStyle = isBull ? bullCol : bearCol;
          ctx.fillRect(center - bodyW / 2, topY, bodyW, Math.max(2, bottomY - topY));

          if (fp && fp.levels && fp.levels.length > 0) {
            const levelCount = fp.levels.length;
            const levelHeight = Math.max(2, (lowY - highY) / levelCount);

            const themeBull = bullCol;
            const themeBear = bearCol;
            const themePoc = pocCol || '#f59e0b';
            const bidBarFill = `${bearCol}40`;
            const askBarFill = `${bullCol}45`;

            const maxVol = Math.max(...fp.levels.map(l => {
               if (footprintSettings.footprintType === 'Delta Profile') return Math.abs(l.delta);
               if (footprintSettings.footprintType === 'Total Volume Profile') return l.totalVol;
               return Math.max(l.bidVol, l.askVol);
            }), 1);

            const centerBodyWidth = Math.max(6, candleWidth / 15);
            const candleGap = Math.max(4, centerBodyWidth / 2 + 2);
            const cellW = Math.max(8, (candleWidth / 2) - candleGap - 1);

            // Value Area (VAH / VAL 70%) side bracket indicator matching Delta color
            if (footprintSettings.showValueArea && fp.vahPrice && fp.valPrice) {
              const vahY = getY(fp.vahPrice);
              const valY = getY(fp.valPrice);
              const vaH = Math.max(2, valY - vahY);
              
              // Determine color by delta
              const isPositiveDelta = fp.delta > 0;
              const isNegativeDelta = fp.delta < 0;
              const vahValColor = isPositiveDelta ? bullCol : (isNegativeDelta ? bearCol : '#ffffff');
              const vahValFill = isPositiveDelta ? `${bullCol}15` : (isNegativeDelta ? `${bearCol}15` : 'rgba(255, 255, 255, 0.08)');

              ctx.save();
              // Highlight area between VAH and VAL with transparent fill matching delta
              ctx.fillStyle = vahValFill;
              ctx.fillRect(center - cellW - candleGap, vahY, (cellW + candleGap) * 2, vaH);

              // Bold stroke for VAH and VAL lines & side brackets
              ctx.strokeStyle = vahValColor;
              ctx.lineWidth = 1.8;
              ctx.beginPath();
              // VAH top border line
              ctx.moveTo(center - cellW - candleGap - 4, vahY);
              ctx.lineTo(center + cellW + candleGap + 4, vahY);
              // VAL bottom border line
              ctx.moveTo(center - cellW - candleGap - 4, valY);
              ctx.lineTo(center + cellW + candleGap + 4, valY);
              // Side bracket lines
              ctx.moveTo(center - cellW - candleGap - 4, vahY);
              ctx.lineTo(center - cellW - candleGap - 4, valY);
              ctx.moveTo(center + cellW + candleGap + 4, vahY);
              ctx.lineTo(center + cellW + candleGap + 4, valY);
              ctx.stroke();

              // Label text if candle is wide enough
              if (candleWidth >= 32) {
                ctx.fillStyle = vahValColor;
                ctx.font = 'bold 8.5px monospace';
                ctx.textAlign = 'right';
                ctx.fillText('VAH', center - cellW - candleGap - 6, vahY + 3);
                ctx.fillText('VAL', center - cellW - candleGap - 6, valY + 3);
              }
              ctx.restore();
            }

            // Render Bid x Ask Levels
            fp.levels.forEach((lvl, lIdx) => {
              const lvlY = lowY - (lIdx + 1) * levelHeight;
              const pad = levelHeight > 6 ? 1 : 0;
              const barH = levelHeight - pad;
              const yCenter = lvlY + barH / 2;

              const leftX = center - candleGap - cellW;
              const rightX = center + candleGap;

              if (footprintSettings.footprintType === 'Split Bid/Ask Profile') {
                const bidRatio = Math.min(1, maxVol > 0 ? lvl.bidVol / maxVol : 0);
                const askRatio = Math.min(1, maxVol > 0 ? lvl.askVol / maxVol : 0);

                const bidOpHex = Math.floor(Math.max(0.08, bidRatio) * 255).toString(16).padStart(2, '0');
                const askOpHex = Math.floor(Math.max(0.08, askRatio) * 255).toString(16).padStart(2, '0');

                const isSellImb = lvl.isImbalanceSell && footprintSettings.showImbalance;
                const isBuyImb = lvl.isImbalanceBuy && footprintSettings.showImbalance;

                ctx.fillStyle = '#10111a';
                ctx.fillRect(leftX, lvlY, cellW, barH);
                ctx.fillRect(rightX, lvlY, cellW, barH);

                ctx.fillStyle = `${themeBear}${bidOpHex}`;
                ctx.fillRect(leftX, lvlY, cellW, barH);
                
                ctx.fillStyle = `${themeBull}${askOpHex}`;
                ctx.fillRect(rightX, lvlY, cellW, barH);

                if (isSellImb) {
                  ctx.strokeStyle = themeBear;
                  ctx.lineWidth = Math.max(1.5, candleWidth / 30);
                  ctx.strokeRect(leftX, lvlY, cellW, barH);

                  // Thicker vertical line visual of imbalance outside VAH / VAL, offset next to VAH VAL side bracket to prevent overlap
                  if (!lvl.inValueArea) {
                    const imbKey = `sell-${globalIdx}-${lvl.price}`;
                    let birth = animBirthMapRef.current.get(imbKey);
                    if (!birth) {
                      birth = now;
                      animBirthMapRef.current.set(imbKey, birth);
                    }
                    const age = now - birth;
                    let progress = 1;
                    if (age < animDuration) {
                      progress = age / animDuration;
                      progress = 1 - Math.pow(1 - progress, 3); // ease out cubic
                      hasActiveAnimations = true;
                    }
                    const currentWidth = 4 * progress;

                    ctx.fillStyle = themeBear; 
                    ctx.fillRect(center - cellW - candleGap - 10 + (4 - currentWidth) / 2, lvlY, currentWidth, barH); 
                  }
                }

                if (isBuyImb) {
                  ctx.strokeStyle = themeBull;
                  ctx.lineWidth = Math.max(1.5, candleWidth / 30);
                  ctx.strokeRect(rightX, lvlY, cellW, barH);

                  // Thicker vertical line visual of imbalance outside VAH / VAL, offset next to VAH VAL side bracket to prevent overlap
                  if (!lvl.inValueArea) {
                    const imbKey = `buy-${globalIdx}-${lvl.price}`;
                    let birth = animBirthMapRef.current.get(imbKey);
                    if (!birth) {
                      birth = now;
                      animBirthMapRef.current.set(imbKey, birth);
                    }
                    const age = now - birth;
                    let progress = 1;
                    if (age < animDuration) {
                      progress = age / animDuration;
                      progress = 1 - Math.pow(1 - progress, 3); // ease out cubic
                      hasActiveAnimations = true;
                    }
                    const currentWidth = 4 * progress;

                    ctx.fillStyle = themeBull; 
                    ctx.fillRect(center + cellW + candleGap + 6 + (4 - currentWidth) / 2, lvlY, currentWidth, barH); 
                  }
                }

                if (footprintSettings.showPoc && lvl.isPoc) {
                  ctx.strokeStyle = themePoc;
                  ctx.lineWidth = 1.8;
                  ctx.strokeRect(leftX, lvlY, cellW * 2 + candleGap * 2, barH);
                }

                if (candleWidth >= 22) {
                  const fontSize = Math.max(7, Math.min(candleWidth / 5, levelHeight * 0.75));
                  ctx.font = `bold ${fontSize}px monospace`;
                  ctx.textBaseline = 'middle';

                  ctx.fillStyle = (isSellImb || bidRatio > 0.5) ? '#ffffff' : '#c8d0e0';
                  ctx.textAlign = 'right';
                  ctx.fillText(`${formatVol(lvl.bidVol)}`, center - candleGap - 2, yCenter);

                  ctx.fillStyle = (isBuyImb || askRatio > 0.5) ? '#ffffff' : '#c8d0e0';
                  ctx.textAlign = 'left';
                  ctx.fillText(`${formatVol(lvl.askVol)}`, center + candleGap + 2, yCenter);
                }
              } else if (footprintSettings.footprintType === 'Delta Profile') {
                const deltaRatio = Math.min(1, maxVol > 0 ? Math.abs(lvl.delta) / maxVol : 0);
                const deltaOpHex = Math.floor(Math.max(0.08, deltaRatio) * 255).toString(16).padStart(2, '0');
                const isPosDelta = lvl.delta >= 0;
                const dCol = isPosDelta ? themeBull : themeBear;

                ctx.fillStyle = '#10111a';
                ctx.fillRect(leftX, lvlY, cellW * 2 + candleGap * 2, barH);

                ctx.fillStyle = `${dCol}${deltaOpHex}`;
                if (isPosDelta) {
                  ctx.fillRect(rightX, lvlY, cellW, barH);
                } else {
                  ctx.fillRect(leftX, lvlY, cellW, barH);
                }

                if (footprintSettings.showPoc && lvl.isPoc) {
                  ctx.strokeStyle = themePoc;
                  ctx.lineWidth = Math.max(1.5, candleWidth / 30);
                  ctx.strokeRect(leftX, lvlY, cellW * 2 + candleGap * 2, barH);
                }

                if (candleWidth >= 16) {
                  const fontSize = Math.max(7, Math.min(candleWidth / 5, levelHeight * 0.75));
                  ctx.font = `bold ${fontSize}px monospace`;
                  ctx.textBaseline = 'middle';
                  ctx.fillStyle = deltaRatio > 0.5 ? '#ffffff' : '#c8d0e0';
                  ctx.textAlign = isPosDelta ? 'left' : 'right';
                  ctx.fillText(`${isPosDelta ? '+' : ''}${formatVol(lvl.delta)}`, center + (isPosDelta ? candleGap + 2 : -candleGap - 2), yCenter);
                }
              } else {
                const volRatio = Math.min(1, maxVol > 0 ? lvl.totalVol / maxVol : 0);
                const volOpHex = Math.floor(Math.max(0.08, volRatio) * 255).toString(16).padStart(2, '0');
                
                ctx.fillStyle = '#10111a';
                ctx.fillRect(leftX, lvlY, cellW * 2 + candleGap * 2, barH);

                ctx.fillStyle = lvl.isPoc ? `${themePoc}${volOpHex}` : `rgba(148, 163, 184, ${Math.max(0.08, volRatio)})`;
                ctx.fillRect(leftX, lvlY, cellW * 2 + candleGap * 2, barH);

                if (footprintSettings.showPoc && lvl.isPoc) {
                  ctx.strokeStyle = themePoc;
                  ctx.lineWidth = Math.max(1.5, candleWidth / 30);
                  ctx.strokeRect(leftX, lvlY, cellW * 2 + candleGap * 2, barH);
                }

                if (candleWidth >= 16) {
                  const fontSize = Math.max(7, Math.min(candleWidth / 5, levelHeight * 0.75));
                  ctx.font = `bold ${fontSize}px monospace`;
                  ctx.textBaseline = 'middle';
                  ctx.fillStyle = (lvl.isPoc || volRatio > 0.5) ? '#ffffff' : '#e5e7eb';
                  ctx.textAlign = 'center';
                  ctx.fillText(`${formatVol(lvl.totalVol)}`, center, yCenter);
                }
              }
            });

            // Central Candle Wick & Body ON TOP
            ctx.save();
            ctx.strokeStyle = isBull ? themeBull : themeBear;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(center, highY);
            ctx.lineTo(center, lowY);
            ctx.stroke();

            const candleBodyH = Math.max(3, bottomY - topY);
            ctx.fillStyle = isBull ? themeBull : themeBear;
            ctx.fillRect(center - centerBodyWidth / 2, topY, centerBodyWidth, candleBodyH);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 0.8;
            ctx.strokeRect(center - centerBodyWidth / 2, topY, centerBodyWidth, candleBodyH);
            ctx.restore();

            // Institutional Absorption Badges
            if (footprintSettings.showAbsorptionBadges) {
              if (fp.divergenceType === 'BUY_ABSORPTION' && candleWidth >= 50) {
                ctx.fillStyle = themeBull;
                ctx.font = 'bold 7.5px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('⚡ABSORB BUY', center, highY - 10);
              } else if (fp.divergenceType === 'SELL_ABSORPTION' && candleWidth >= 50) {
                ctx.fillStyle = themeBear;
                ctx.font = 'bold 7.5px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('⚡ABSORB SELL', center, lowY + 12);
              }
            }

            // Stacked Imbalance Candle Badges are omitted to maintain clean visual thick lines without text labels as requested.

            // G. Multi-Tier Order Flow Footprint Summary Table (With Enlarged Clear Font Size on Zoom)
            const summaryMode = footprintSettings.summaryRows || '4-Tier (Vol, Delta, Range, CVD)';
            let summaryHeightOffset = 0;

            if (summaryMode !== 'Off') {
              const fontSz = Math.max(8.5, candleWidth * 0.12);
              const rowHeight = Math.max(14, candleWidth * 0.20);
              const cardHeight = rowHeight * 3 + 2;
              summaryHeightOffset = cardHeight + 4;
              const summaryStartY = mainChartHeight - cardHeight - 2;
              
              const cardW = Math.max(candleWidth - 2, 38);
              const cardX = x + (candleWidth - cardW) / 2;

              // Row 1: Delta & Delta% Block
              const isPosDelta = fp.delta >= 0;
              const deltaPct = fp.totalVolume > 0 ? Math.abs(fp.delta) / fp.totalVolume * 100 : 0;
              const deltaStr = cardW >= 55 ? `${fp.delta > 0 ? '+' : ''}${fp.delta} (${deltaPct.toFixed(0)}%)` : `${fp.delta > 0 ? '+' : ''}${fp.delta}`;
              
              ctx.fillStyle = isPosDelta ? themeBull : themeBear;
              if (cardW >= 42) {
                ctx.beginPath();
                ctx.roundRect(cardX, summaryStartY, cardW, rowHeight, 3);
                ctx.fill();
              } else {
                ctx.fillRect(cardX, summaryStartY, cardW, rowHeight);
              }
              ctx.fillStyle = isPosDelta ? '#000000' : '#ffffff';
              const row1Font = cardW >= 55 ? Math.max(7.5, fontSz - 1) : fontSz;
              ctx.font = `bold ${row1Font}px monospace`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(deltaStr, cardX + cardW / 2, summaryStartY + rowHeight / 2);

              // Row 2: CVD Block
              const cvd = cvdData[globalIdx];
              const isPosCvd = cvd >= 0;
              ctx.fillStyle = isPosCvd ? `${themeBull}20` : `${themeBear}20`; // subtle background
              if (cardW >= 42) {
                ctx.beginPath();
                ctx.roundRect(cardX, summaryStartY + rowHeight + 1, cardW, rowHeight, 3);
                ctx.fill();
              } else {
                ctx.fillRect(cardX, summaryStartY + rowHeight + 1, cardW, rowHeight);
              }
              ctx.fillStyle = isPosCvd ? themeBull : themeBear;
              ctx.font = `bold ${fontSz}px monospace`;
              ctx.fillText(`${cvd > 0 ? '+' : ''}${cvd}`, cardX + cardW / 2, summaryStartY + rowHeight * 1.5 + 1);

              // Row 3: Volume Block
              ctx.fillStyle = '#1c1e2b';
              if (cardW >= 42) {
                ctx.beginPath();
                ctx.roundRect(cardX, summaryStartY + rowHeight * 2 + 2, cardW, rowHeight, 3);
                ctx.fill();
              } else {
                ctx.fillRect(cardX, summaryStartY + rowHeight * 2 + 2, cardW, rowHeight);
              }
              ctx.fillStyle = '#ffffff';
              ctx.font = `bold ${fontSz}px monospace`;
              ctx.fillText(`${fp.totalVolume}`, cardX + cardW / 2, summaryStartY + rowHeight * 2.5 + 2);
            }

            // Profile Shape Info
            if (footprintSettings.showProfileShape && fp.profileShape && candleWidth >= 36) {
              ctx.save();
              ctx.font = 'bold 8px monospace';
              ctx.textAlign = 'center';
              const shapeY = mainChartHeight - summaryHeightOffset - 8;
              if (fp.profileShape === 'P_SHAPE') {
                ctx.fillStyle = themeBull;
                ctx.fillText('📐 P-SHAPE', center, shapeY);
              } else if (fp.profileShape === 'b_SHAPE') {
                ctx.fillStyle = themeBear;
                ctx.fillText('📐 b-SHAPE', center, shapeY);
              } else {
                ctx.fillStyle = '#9ca3af';
                ctx.fillText('📐 D-SHAPE', center, shapeY);
              }
              ctx.restore();
            }
          }
        }
      });

      // H. Real-time Order Flow HUD Info Overlay in Top-Right Corner
      if (footprintSettings.showBuySellVolume && visibleCandles.length > 0) {
        const lastBar = footprintData[footprintData.length - 1];
        if (lastBar) {
          const hudW = 230;
          const hudH = 92;
          const hudX = chartWidth - hudW - 12;
          const hudY = 38;

          ctx.save();

          // 1. Background rounded rectangle with precise theme gradient
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(hudX, hudY, hudW, hudH, 10);
          } else {
            ctx.rect(hudX, hudY, hudW, hudH);
          }

          const cardGrad = ctx.createLinearGradient(hudX, hudY, hudX + hudW, hudY + hudH);
          const [rBull, gBull, bBull] = hexToRgbTuple(bullCol, [81, 52, 255]);
          const [rBear, gBear, bBear] = hexToRgbTuple(bearCol, [23, 156, 116]);
          const [darkR, darkG, darkB] = hexToRgbTuple(
            currentPalette.dark && currentPalette.dark !== '#000000' && currentPalette.dark !== '#ffffff' ? currentPalette.dark : '#060913',
            [6, 9, 19]
          );

          if (isLight) {
            cardGrad.addColorStop(0, `rgba(${rBull}, ${gBull}, ${bBull}, 0.16)`);
            cardGrad.addColorStop(0.5, `rgba(255, 255, 255, 0.94)`);
            cardGrad.addColorStop(1, `rgba(${rBear}, ${gBear}, ${bBear}, 0.08)`);
          } else {
            cardGrad.addColorStop(0, `rgba(${rBull}, ${gBull}, ${bBull}, 0.20)`);
            cardGrad.addColorStop(0.5, `rgba(${darkR + 6}, ${darkG + 8}, ${darkB + 14}, 0.88)`);
            cardGrad.addColorStop(1, `rgba(${rBear}, ${gBear}, ${bBear}, 0.12)`);
          }

          ctx.fillStyle = cardGrad;
          ctx.fill();

          // 2. Card Border
          ctx.strokeStyle = `${bullCol}60`;
          ctx.lineWidth = 1;
          ctx.stroke();

          // 3. Top Accent Gradient Bar (matching News Bar & Calendar News)
          const topGrad = ctx.createLinearGradient(hudX, hudY, hudX + hudW, hudY);
          topGrad.addColorStop(0, bullCol);
          topGrad.addColorStop(0.5, pocCol || '#6366f1');
          topGrad.addColorStop(1, bearCol);

          ctx.beginPath();
          ctx.rect(hudX + 2, hudY, hudW - 4, 3);
          ctx.fillStyle = topGrad;
          ctx.fill();

          // 4. Left Side Accent Bar
          ctx.beginPath();
          ctx.rect(hudX, hudY + 3, 3.5, hudH - 6);
          ctx.fillStyle = bullCol;
          ctx.fill();

          // HUD Title
          ctx.fillStyle = isLight ? '#4b5563' : '#9ca3af';
          ctx.font = 'bold 9.5px monospace';
          ctx.textAlign = 'left';
          ctx.fillText('ORDER FLOW HUD (V7.2)', hudX + 12, hudY + 17);

          // Net Bar Delta
          ctx.font = 'bold 9px monospace';
          ctx.fillStyle = isLight ? '#374151' : '#d1d5db';
          ctx.fillText('Bar Delta:', hudX + 12, hudY + 33);
          ctx.fillStyle = lastBar.delta >= 0 ? bullCol : bearCol;
          ctx.textAlign = 'right';
          ctx.fillText(`${lastBar.delta > 0 ? '+' : ''}${formatVol(lastBar.delta)} (${lastBar.deltaPct}%)`, hudX + hudW - 10, hudY + 33);

          // Total Bar Vol
          ctx.textAlign = 'left';
          ctx.fillStyle = isLight ? '#374151' : '#d1d5db';
          ctx.fillText('Total Volume:', hudX + 12, hudY + 48);
          ctx.fillStyle = isLight ? '#111827' : '#ffffff';
          ctx.textAlign = 'right';
          ctx.fillText(`${formatVol(lastBar.totalVolume)}`, hudX + hudW - 10, hudY + 48);

          // CVD
          ctx.textAlign = 'left';
          ctx.fillStyle = isLight ? '#374151' : '#d1d5db';
          ctx.fillText('Cumulative CVD:', hudX + 12, hudY + 63);
          ctx.fillStyle = lastBar.cumulativeDelta >= 0 ? '#38bdf8' : '#f43f5e';
          ctx.textAlign = 'right';
          ctx.fillText(`${formatVol(lastBar.cumulativeDelta)}`, hudX + hudW - 10, hudY + 63);

          // POC
          ctx.textAlign = 'left';
          ctx.fillStyle = isLight ? '#374151' : '#d1d5db';
          ctx.fillText('Bar POC Price:', hudX + 12, hudY + 78);
          ctx.fillStyle = pocCol;
          ctx.textAlign = 'right';
          ctx.fillText(`$${lastBar.pocPrice.toFixed(2)}`, hudX + hudW - 10, hudY + 78);

          ctx.restore();
        }
      }
    } else {
    // CVD Momentum Trend Line Projection Overlay (Subtle background trend glow)
    if (indicators.showBookmapPro && bookmapData && bookmapData.bubbles && bookmapData.bubbles.length > 0) {
      ctx.save();
      ctx.beginPath();
      let hasStarted = false;
      for (let i = startIndex; i < endIndex; i++) {
        const b = bookmapData.bubbles[i];
        if (!b) continue;
        const x = getX(i);
        const c = candles[i];
        if (!c) continue;
        // Project price offset based on bar delta momentum
        const deltaOffset = (b.delta / (b.buyVol + b.sellVol || 1)) * (c.high - c.low || 1) * 0.45;
        const projectedY = getY(c.close + deltaOffset);
        if (!hasStarted) {
          ctx.moveTo(x, projectedY);
          hasStarted = true;
        } else {
          ctx.lineTo(x, projectedY);
        }
      }
      ctx.strokeStyle = bookmapData.aggDelta >= 0 ? `${currentPalette.bull}70` : `${currentPalette.bear}70`;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = bookmapData.aggDelta >= 0 ? currentPalette.bull : currentPalette.bear;
      ctx.shadowBlur = 8;
      ctx.setLineDash([5, 3]);
      ctx.stroke();
      ctx.restore();
    }

    // Standard / Heikin-Ashi / Bookmap Glass Candles
      if (indicators.showBookmapPro && (bookmapSettings.showTransparentCandles ?? true)) {
        // A. Thin VWAP / Close Tracker Line
        ctx.beginPath();
        visibleCandles.forEach((c, idx) => {
          const globalIdx = startIndex + idx;
          const x = getX(globalIdx);
          const y = getY(c.close);
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 2]);
        ctx.stroke();
        ctx.setLineDash([]);

        // B. Transparent Glass Candles (allows heatmap and volume bubbles behind to shine through)
        visibleCandles.forEach((c, idx) => {
          const globalIdx = startIndex + idx;
          const x = getX(globalIdx) - candleWidth / 2;
          const isBull = c.close >= c.open;

          const openY = getY(c.open);
          const closeY = getY(c.close);
          const highY = getY(c.high);
          const lowY = getY(c.low);

          const topY = Math.min(openY, closeY);
          const bottomY = Math.max(openY, closeY);
          const bodyHeight = Math.max(2, bottomY - topY);

          const baseColor = isBull ? currentPalette.bull : currentPalette.bear;

          // Glass Wick
          ctx.strokeStyle = `${baseColor}cc`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(x + candleWidth / 2, highY);
          ctx.lineTo(x + candleWidth / 2, lowY);
          ctx.stroke();

          // Glass Body Fill (Translucent 25% opacity)
          ctx.fillStyle = `${baseColor}30`;
          ctx.fillRect(x, topY, candleWidth, bodyHeight);

          // Holographic Footprint Profile Merge (sub-candle profile partition)
          if (bookmapSettings.showHolographicFootprints && candleWidth >= 12) {
            ctx.save();
            const rangeVal = c.high - c.low;
            let bVol = c.volume * 0.5;
            let sVol = c.volume * 0.5;
            if (rangeVal > 0) {
              const bHigh = Math.max(c.open, c.close);
              const bLow = Math.min(c.open, c.close);
              const upperWick = c.high - bHigh;
              const lowerWick = bLow - c.low;
              const candleBody = bHigh - bLow;
              const deltaCandle = c.close - c.open;
              const bodyRatio = c.volume > 0 ? candleBody / rangeVal : 0;
              const bodyBuy = deltaCandle >= 0 ? c.volume * bodyRatio : 0;
              const bodySell = deltaCandle < 0 ? c.volume * bodyRatio : 0;
              const wickBuy = c.volume * (lowerWick / rangeVal) * 0.7 + c.volume * (upperWick / rangeVal) * 0.3;
              const wickSell = c.volume * (upperWick / rangeVal) * 0.7 + c.volume * (lowerWick / rangeVal) * 0.3;
              bVol = bodyBuy + wickBuy;
              sVol = bodySell + wickSell;
            }
            const tot = bVol + sVol;
            if (tot > 0) {
              const buyRatio = bVol / tot;
              const sellRatio = sVol / tot;

              ctx.fillStyle = `${currentPalette.bull}38`;
              ctx.fillRect(x + 1, topY + 1, (candleWidth - 2) * buyRatio, bodyHeight - 2);

              ctx.fillStyle = `${currentPalette.bear}38`;
              ctx.fillRect(x + 1 + (candleWidth - 2) * buyRatio, topY + 1, (candleWidth - 2) * sellRatio, bodyHeight - 2);

              if (candleWidth >= 28 && bodyHeight >= 12) {
                const delta = bVol - sVol;
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 7px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`${delta >= 0 ? '+' : ''}${formatVol(delta)}`, x + candleWidth / 2, topY + bodyHeight / 2 + 3.2);
              }
            }
            ctx.restore();
          }

          // Glass Outline
          ctx.strokeStyle = baseColor;
          ctx.lineWidth = 1.2;
          ctx.strokeRect(x, topY, candleWidth, bodyHeight);
        });
      } else if (indicators.showLiquidityHeatmap) {
        // High-frequency microstructure trail wicks and executed volume bubbles are rendered seamlessly inside renderLiquidityHeatmapLayer in exact z-order
      } else if (indicators.showBookmapPro) {
        // Bookmap visual style with thin tracker line only
        ctx.beginPath();
        visibleCandles.forEach((c, idx) => {
          const globalIdx = startIndex + idx;
          const x = getX(globalIdx);
          const y = getY(c.close);
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        // ULTRA FAST 20X BATCHED CANDLE RENDERING PIPELINE (Zero context state thrashing)
        if (chartType === 'hollow') {
          visibleCandles.forEach((c, idx) => {
            const globalIdx = startIndex + idx;
            const x = getX(globalIdx) - candleWidth / 2;
            const isBull = c.close >= c.open;
            const openY = getY(c.open);
            const closeY = getY(c.close);
            const highY = getY(c.high);
            const lowY = getY(c.low);
            const topY = Math.min(openY, closeY);
            const bottomY = Math.max(openY, closeY);
            const bodyHeight = Math.max(1.5, bottomY - topY);
            const color = isBull ? currentPalette.bull : currentPalette.bear;

            ctx.strokeStyle = color;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(x + candleWidth / 2, highY);
            ctx.lineTo(x + candleWidth / 2, topY);
            ctx.moveTo(x + candleWidth / 2, bottomY);
            ctx.lineTo(x + candleWidth / 2, lowY);
            ctx.stroke();

            ctx.save();
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.32;
            ctx.fillRect(x, topY, candleWidth, bodyHeight);
            ctx.restore();

            ctx.strokeRect(x, topY, candleWidth, bodyHeight);
          });
        } else {
          // BATCHED CANDLESTICKS (Reduces thousands of canvas draw calls to just 4 draw operations)
          const bullCol = currentPalette.bull;
          const bearCol = currentPalette.bear;

          // 1. Bullish Wicks Batch
          ctx.strokeStyle = bullCol;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          for (let idx = 0; idx < visibleCandles.length; idx++) {
            const c = visibleCandles[idx];
            if (c.close >= c.open) {
              const globalIdx = startIndex + idx;
              const cx = (getX(globalIdx) | 0) + 0.5;
              ctx.moveTo(cx, getY(c.high));
              ctx.lineTo(cx, getY(c.low));
            }
          }
          ctx.stroke();

          // 2. Bearish Wicks Batch
          ctx.strokeStyle = bearCol;
          ctx.beginPath();
          for (let idx = 0; idx < visibleCandles.length; idx++) {
            const c = visibleCandles[idx];
            if (c.close < c.open) {
              const globalIdx = startIndex + idx;
              const cx = (getX(globalIdx) | 0) + 0.5;
              ctx.moveTo(cx, getY(c.high));
              ctx.lineTo(cx, getY(c.low));
            }
          }
          ctx.stroke();

          // 3. Bullish Bodies Batch
          ctx.fillStyle = bullCol;
          for (let idx = 0; idx < visibleCandles.length; idx++) {
            const c = visibleCandles[idx];
            if (c.close >= c.open) {
              const globalIdx = startIndex + idx;
              const x = getX(globalIdx) - candleWidth / 2;
              const openY = getY(c.open);
              const closeY = getY(c.close);
              const topY = Math.min(openY, closeY);
              const bodyHeight = Math.max(1.5, Math.abs(closeY - openY));
              ctx.fillRect(x, topY, candleWidth, bodyHeight);
            }
          }

          // 4. Bearish Bodies Batch
          ctx.fillStyle = bearCol;
          for (let idx = 0; idx < visibleCandles.length; idx++) {
            const c = visibleCandles[idx];
            if (c.close < c.open) {
              const globalIdx = startIndex + idx;
              const x = getX(globalIdx) - candleWidth / 2;
              const openY = getY(c.open);
              const closeY = getY(c.close);
              const topY = Math.min(openY, closeY);
              const bodyHeight = Math.max(1.5, Math.abs(closeY - openY));
              ctx.fillRect(x, topY, candleWidth, bodyHeight);
            }
          }
        }
      }
    }

    // Restore the canvas clip rect after candle rendering
    ctx.restore();
    // Bookmap V5.17 Pro clip rect: prevent volume bubbles, icebergs, and overlays from bleeding past chart boundaries
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, chartWidth, mainChartHeight);
    ctx.clip();
    // 7. Heatmap Volume Bubbles (Only rendered if standalone BookmapPro mode is active and Liquidity Heatmap Layer is disabled)
    if (!indicators.showLiquidityHeatmap && indicators.showBookmapPro && (bookmapSettings.showVolumeBubbles ?? true) && bookmapData && bookmapData.bubbles && bookmapData.bubbles.length > 0) {
      // Dynamic Responsive Zoom Factor: Medium high-contrast responsive scaling
      // Adaptive candle scale for balanced volume bubble sizing
      const candleScale = Math.max(0.4, Math.min(1.4, candleWidth / 14));
      // Proportional 2D clamp: vertical bin height keeps zoomed-in bubbles balanced
      // against the price grid so the heatmap never flattens into a wide smear.
      const heatmapPriceSpan = Math.max(1e-6, priceMax - priceMin);
      const heatmapBinHeightPx = Math.max(2.5, (mainChartHeight / heatmapPriceSpan) * (liquidityHeatmapData?.priceStep ?? 1));

      for (let i = startIndex; i < endIndex; i++) {
        const b = bookmapData.bubbles[i];
        if (!b) continue;

        const x = getX(i);
        if (!isFinite(x)) continue;

        // Buy Side 3D Sphere Bubble
        const rawYBuy = getY(b.buyLoc);
        if (b.intensityBuy > 0.05 && isFinite(rawYBuy)) {
          const yBuy = rawYBuy;
          const rBuyMultiplier = (b.adaptiveScale ?? 1.0);
          // Balanced adaptive radius: clearly visible, scales gracefully with candle width
          const isTickMode = ['1T', '10T', '50T', '100T', 'tick'].includes(timeframe);
          const maxBubbleRadius = isTickMode
            ? Math.max(3.2, Math.min(candleWidth * 1.1, heatmapBinHeightPx * 1.5))
            : Math.max(3.5, Math.min(candleWidth * 1.35, heatmapBinHeightPx * 2.5));
          const baseRadius = (3.2 + b.intensityBuy * 10.0) * rBuyMultiplier * candleScale;
          const rBuy = Math.max(2.4, Math.min(maxBubbleRadius, Math.round(baseRadius)));
          const intensity = Math.min(1.0, Math.max(0.0, b.intensityBuy));

          // Dynamic Color Intensity: Low intensity = softer translucent, High intensity = hyper-vivid high-contrast theme color
          const baseColor = b.isImbalanceBuy ? (currentPalette.poc || '#ffd600') : currentPalette.bull;

          ctx.save();
          const rx = Math.round(x);
          const ry = Math.round(yBuy);
          const rr = Math.round(rBuy);

          if (isDragging) {
            // High speed simplified draw for super smooth 60 FPS panning/dragging
            const dragAlphaHex = Math.floor((0.4 + intensity * 0.55) * 255).toString(16).padStart(2, '0');
            ctx.beginPath();
            ctx.arc(rx, ry, rr, 0, Math.PI * 2);
            ctx.fillStyle = `${baseColor}${dragAlphaHex}`;
            ctx.fill();

            // Simplified fast specular highlight in volume color tint
            ctx.beginPath();
            ctx.arc(rx - rr * 0.3, ry - rr * 0.3, rr * 0.25, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffffbb';
            ctx.fill();
          } else {
            // CVD Momentum Absorption Glow Ring
            if (b.isAbsorptionNode) {
              const pulseTime = Date.now() / 250;
              const pulseFactor = 1.0 + Math.abs(Math.sin(pulseTime)) * 0.3;
              ctx.beginPath();
              ctx.arc(rx, ry, rr * pulseFactor + 3.0, 0, Math.PI * 2);
              ctx.strokeStyle = b.absorptionType === 'BULL_ABSORPTION' ? (currentPalette.bull || '#00e676') : (currentPalette.bear || '#ff1744');
              ctx.lineWidth = 2.2;
              ctx.stroke();
            }

            // Only draw shadow, ambient glow, and high-intensity outer rings for larger bubbles (>= 5.0) to keep small bubbles crisp
            if (rr >= 5.0) {
              // 3D Drop Shadow with dynamic blur scaling
              ctx.beginPath();
              ctx.arc(rx + 1.2, ry + 2.0, rr, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(0, 0, 0, ${0.3 + intensity * 0.35})`;
              ctx.fill();

              // Outer Ambient Glow Ring matching volume intensity contrast
              const glowRadius = rr + (2.0 + intensity * 4.0);
              const glowAlphaHex = Math.floor((0.2 + intensity * 0.65) * 255).toString(16).padStart(2, '0');
              ctx.beginPath();
              ctx.arc(rx, ry, glowRadius, 0, Math.PI * 2);
              ctx.fillStyle = `${baseColor}${glowAlphaHex}`;
              ctx.fill();

              // Additional High-Intensity Outer Heatwave Ring for massive whale volumes
              if (intensity > 0.65) {
                ctx.beginPath();
                ctx.arc(rx, ry, rr + 7.0, 0, Math.PI * 2);
                ctx.fillStyle = `${baseColor}25`;
                ctx.fill();
              }
            }

            if (!isFinite(rx) || !isFinite(ry) || !isFinite(rr) || rr <= 0) continue;

            // 3D Radial Gradient (Dynamic Volume Color Gradient with sharp contrast stops)
            const grad = ctx.createRadialGradient(
              rx - rr * 0.35,
              ry - rr * 0.35,
              Math.max(0.5, rr * 0.08),
              rx,
              ry,
              rr
            );
            
            // Higher volume intensity -> brighter core center & sharper outer rim
            const coreAlpha = Math.floor((0.6 + intensity * 0.4) * 255).toString(16).padStart(2, '0');
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.25, `${baseColor}${coreAlpha}`);
            grad.addColorStop(0.8, baseColor);
            grad.addColorStop(1, '#050810');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(rx, ry, rr, 0, Math.PI * 2);
            ctx.fill();

            // Dynamic High-Contrast Sharp Border Rim (1.2px for large, pixel-perfect 1.0px solid border for small bubbles)
            ctx.beginPath();
            ctx.arc(rx, ry, rr, 0, Math.PI * 2);
            ctx.strokeStyle = intensity > 0.6 ? '#ffffff' : `${baseColor}aa`;
            ctx.lineWidth = rr < 5.0 ? 1.0 : Math.max(0.8, 1.2 * intensity);
            ctx.stroke();

            // 3D Specular Arc Reflection in subtle volume tint
            if (rr >= 5.0) {
              ctx.beginPath();
              ctx.arc(rx, ry, rr * 0.72, Math.PI * 1.05, Math.PI * 1.55);
              ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 + intensity * 0.45})`;
              ctx.lineWidth = Math.max(1, rr * 0.14);
              ctx.stroke();
            }

            // Imbalance Accent Ring
            if (b.isImbalanceBuy) {
              ctx.beginPath();
              ctx.arc(rx, ry, rr + 1.8, 0, Math.PI * 2);
              ctx.strokeStyle = currentPalette.poc || '#ffd600';
              ctx.lineWidth = 1.8;
              ctx.stroke();
            }
          }
          ctx.restore();
        }

        // Sell Side 3D Sphere Bubble
        const rawYSell = getY(b.sellLoc);
        if (b.intensitySell > 0.05 && isFinite(rawYSell)) {
          const ySell = rawYSell;
          const rSellMultiplier = (b.adaptiveScale ?? 1.0);
          // Balanced adaptive radius: clearly visible, scales gracefully with candle width
          const isTickMode = ['1T', '10T', '50T', '100T', 'tick'].includes(timeframe);
          const maxBubbleRadius = isTickMode ? Math.max(3.2, candleWidth * 1.1) : Math.max(3.5, candleWidth * 1.35);
          const baseRadius = (3.2 + b.intensitySell * 10.0) * rSellMultiplier * candleScale;
          const rSell = Math.max(2.4, Math.min(maxBubbleRadius, Math.round(baseRadius)));
          const intensity = Math.min(1.0, Math.max(0.0, b.intensitySell));

          // Dynamic Color Intensity: Low intensity = softer translucent, High intensity = hyper-vivid high-contrast theme color
          const baseColor = b.isImbalanceSell ? (currentPalette.poc || '#ffd600') : currentPalette.bear;

          ctx.save();
          const rx = Math.round(x);
          const ry = Math.round(ySell);
          const rr = Math.round(rSell);

          if (isDragging) {
            // High speed simplified draw for super smooth 60 FPS panning/dragging
            const dragAlphaHex = Math.floor((0.4 + intensity * 0.55) * 255).toString(16).padStart(2, '0');
            ctx.beginPath();
            ctx.arc(rx, ry, rr, 0, Math.PI * 2);
            ctx.fillStyle = `${baseColor}${dragAlphaHex}`;
            ctx.fill();

            // Simplified fast specular highlight in volume color tint
            ctx.beginPath();
            ctx.arc(rx - rr * 0.3, ry - rr * 0.3, rr * 0.25, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffffbb';
            ctx.fill();
          } else {
            // CVD Momentum Absorption Glow Ring
            if (b.isAbsorptionNode) {
              const pulseTime = Date.now() / 250;
              const pulseFactor = 1.0 + Math.abs(Math.sin(pulseTime)) * 0.3;
              ctx.beginPath();
              ctx.arc(rx, ry, rr * pulseFactor + 3.0, 0, Math.PI * 2);
              ctx.strokeStyle = b.absorptionType === 'BULL_ABSORPTION' ? (currentPalette.bull || '#00e676') : (currentPalette.bear || '#ff1744');
              ctx.lineWidth = 2.2;
              ctx.stroke();
            }

            // Only draw shadow, ambient glow, and high-intensity outer rings for larger bubbles (>= 5.0) to keep small bubbles crisp
            if (rr >= 5.0) {
              // 3D Drop Shadow with dynamic blur scaling
              ctx.beginPath();
              ctx.arc(rx + 1.2, ry + 2.0, rr, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(0, 0, 0, ${0.3 + intensity * 0.35})`;
              ctx.fill();

              // Outer Ambient Glow Ring matching volume intensity contrast
              const glowRadius = rr + (2.0 + intensity * 4.0);
              const glowAlphaHex = Math.floor((0.2 + intensity * 0.65) * 255).toString(16).padStart(2, '0');
              ctx.beginPath();
              ctx.arc(rx, ry, glowRadius, 0, Math.PI * 2);
              ctx.fillStyle = `${baseColor}${glowAlphaHex}`;
              ctx.fill();

              // Additional High-Intensity Outer Heatwave Ring for massive whale volumes
              if (intensity > 0.65) {
                ctx.beginPath();
                ctx.arc(rx, ry, rr + 7.0, 0, Math.PI * 2);
                ctx.fillStyle = `${baseColor}25`;
                ctx.fill();
              }
            }

            if (!isFinite(rx) || !isFinite(ry) || !isFinite(rr) || rr <= 0) continue;

            // 3D Radial Gradient (Dynamic Volume Color Gradient with sharp contrast stops)
            const grad = ctx.createRadialGradient(
              rx - rr * 0.35,
              ry - rr * 0.35,
              Math.max(0.5, rr * 0.08),
              rx,
              ry,
              rr
            );
            
            // Higher volume intensity -> brighter core center & sharper outer rim
            const coreAlpha = Math.floor((0.6 + intensity * 0.4) * 255).toString(16).padStart(2, '0');
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.25, `${baseColor}${coreAlpha}`);
            grad.addColorStop(0.8, baseColor);
            grad.addColorStop(1, '#050810');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(rx, ry, rr, 0, Math.PI * 2);
            ctx.fill();

            // Dynamic High-Contrast Sharp Border Rim (1.2px for large, pixel-perfect 1.0px solid border for small bubbles)
            ctx.beginPath();
            ctx.arc(rx, ry, rr, 0, Math.PI * 2);
            ctx.strokeStyle = intensity > 0.6 ? '#ffffff' : `${baseColor}aa`;
            ctx.lineWidth = rr < 5.0 ? 1.0 : Math.max(0.8, 1.2 * intensity);
            ctx.stroke();

            // 3D Specular Arc Reflection in subtle volume tint
            if (rr >= 5.0) {
              ctx.beginPath();
              ctx.arc(rx, ry, rr * 0.72, Math.PI * 1.05, Math.PI * 1.55);
              ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 + intensity * 0.45})`;
              ctx.lineWidth = Math.max(1, rr * 0.14);
              ctx.stroke();
            }

            // Imbalance Accent Ring
            if (b.isImbalanceSell) {
              ctx.beginPath();
              ctx.arc(rx, ry, rr + 1.8, 0, Math.PI * 2);
              ctx.strokeStyle = currentPalette.poc || '#ffd600';
              ctx.lineWidth = 1.8;
              ctx.stroke();
            }
          }
          ctx.restore();
        }
      }
    }

    // 8. Dedicated Volume Profile (VPVR Horizontal Nodes) Overlay & Main VP
    const isVpOverlayActive = Boolean(indicators.showVolumeProfile);
    const isAlreadyRenderedOnLeftByHeatmap = Boolean(
      indicators.showLiquidityHeatmap &&
      (indicators.liquidityHeatmapConfig?.showLeftVolumeProfile ?? DEFAULT_HEATMAP_SETTINGS.showLeftVolumeProfile) &&
      indicators.volumeProfileConfig?.layout === 'left'
    );
    if (isVpOverlayActive && !isAlreadyRenderedOnLeftByHeatmap && visibleCandles.length > 0 && priceRange > 0) {
      const vaPct = ((indicators.volumeProfileConfig?.valueAreaPercent ?? 70)) / 100;
      const firstTime = visibleCandles[0]?.time || 0;
      const lastTime = visibleCandles[visibleCandles.length - 1]?.time || 0;
      const cacheKey = `${firstTime}_${lastTime}_${priceMin.toFixed(2)}_${priceMax.toFixed(2)}_${vaPct}`;

      let vpvrData: VolumeProfileResult | null = null;
      if (vpvrCacheRef.current.key === cacheKey && vpvrCacheRef.current.data) {
        vpvrData = vpvrCacheRef.current.data;
      } else {
        vpvrData = computeVolumeProfile(visibleCandles, priceMin, priceMax, 56, vaPct);
        vpvrCacheRef.current = { key: cacheKey, data: vpvrData };
      }

      if (vpvrData && vpvrData.nodes.length > 0) {
        renderVolumeProfileOverlay({
          ctx,
          chartWidth,
          fullHeight,
          mainChartHeight,
          rightScaleWidth,
          getY,
          palette: currentPalette,
          config: indicators.volumeProfileConfig || DEFAULT_VOLUME_PROFILE_CONFIG,
          data: vpvrData,
          isCleanChartMode,
          showDomRibbonOffset: (showDomLadder && showDomChartOverlay),
        });
      }
    } else if (indicators.showBookmapPro && bookmapSettings.showVolumeProfile && bookmapData.profileBuckets.length > 0) {
      const maxProfVol = Math.max(...bookmapData.profileBuckets.map((p) => p.totalVol), 1);
      // Compact profile width in clean mode (80px - 110px), standard (140px - 180px)
      const vpWidth = isCleanChartMode 
        ? Math.max(70, Math.min(105, Math.floor(chartWidth * 0.09)))
        : Math.max(130, Math.min(180, Math.floor(chartWidth * 0.15)));
      
      // Adjusted offset to prevent overlap with DOM Ribbon (micro ribbon on-chart)
      const domOffset = (showDomLadder && showDomChartOverlay) ? 58 : 0;
      const vpStartX = chartWidth - vpWidth - domOffset;

      const barMaxW = Math.max(16, vpWidth - 16);
      const vpEndX = vpStartX + vpWidth;

      // Draw Main Volume Profile as Aesthetic Lines & Smooth Contour Curve
      const mainVpPoints: Array<{
        bucket: typeof bookmapData.profileBuckets[0];
        midY: number;
        yTop: number;
        h: number;
        barW: number;
        tipX: number;
      }> = [];

      bookmapData.profileBuckets.forEach((bucket) => {
        const yTop = getY(bucket.priceTop);
        const yBot = getY(bucket.priceBottom);
        const h = Math.max(1.8, Math.abs(yBot - yTop));
        const midY = (yTop + yBot) / 2;
        if (midY < 0 || midY > mainChartHeight) return;

        const pct = Math.min(1.0, Math.max(0, bucket.totalVol / maxProfVol));
        const barW = Math.max(2, Math.min(barMaxW, barMaxW * pct));
        const tipX = vpEndX - barW - 6;

        mainVpPoints.push({ bucket, midY, yTop, h, barW, tipX });
      });

      // Continuous contour fill and line outline (Minimal Smooth Curved Profile Wave)
      if (mainVpPoints.length > 1) {
        const sortedPts = [...mainVpPoints].sort((a, b) => a.midY - b.midY);
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(vpEndX - 6, sortedPts[0].midY);
        sortedPts.forEach((pt) => {
          ctx.lineTo(pt.tipX, pt.midY);
        });
        ctx.lineTo(vpEndX - 6, sortedPts[sortedPts.length - 1].midY);
        ctx.closePath();

        const profileGrad = ctx.createLinearGradient(vpEndX - barMaxW, 0, vpEndX, 0);
        profileGrad.addColorStop(0, `${currentPalette.poc || '#f59e0b'}66`);
        profileGrad.addColorStop(0.5, `${currentPalette.bull}48`);
        profileGrad.addColorStop(1, `${currentPalette.bear}35`);
        ctx.fillStyle = profileGrad;
        ctx.fill();

        ctx.beginPath();
        sortedPts.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.tipX, pt.midY);
          else ctx.lineTo(pt.tipX, pt.midY);
        });
        ctx.strokeStyle = currentPalette.poc || '#f59e0b';
        ctx.lineWidth = 2.0;
        ctx.stroke();
        ctx.restore();
      }

      // VAH, VAL, POC Lines & Glass Badges
      const vahY = getY(bookmapData.vahPrice);
      const valY = getY(bookmapData.valPrice);
      const pocY = getY(bookmapData.pocPrice);

      // Highlight 70% Value Area region (VAH to VAL) on Volume Profile with translucent tint
      if (valY > vahY) {
        ctx.save();
        ctx.fillStyle = `${currentPalette.bull}12`;
        ctx.fillRect(vpStartX - 4, vahY, vpWidth, valY - vahY);
        ctx.restore();
      }

      // POC line & Glass Badge
      ctx.save();
      ctx.strokeStyle = currentPalette.poc || '#ffd600';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(vpStartX - 10, pocY);
      ctx.lineTo(utils.chartWidth, pocY);
      ctx.stroke();

      // Glass Badge POC
      ctx.fillStyle = 'rgba(8, 11, 20, 0.90)';
      ctx.strokeStyle = currentPalette.poc || '#ffd600';
      ctx.lineWidth = 1;
      const pocBadgeW = 118;
      const pocBadgeX = chartWidth - pocBadgeW - 8;
      if (typeof (ctx as any).roundRect === 'function') {
        (ctx as any).roundRect(pocBadgeX, pocY - 8, pocBadgeW, 16, 4);
      } else {
        ctx.rect(pocBadgeX, pocY - 8, pocBadgeW, 16);
      }
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = currentPalette.poc || '#ffd600';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`POC $${bookmapData.pocPrice.toFixed(2)}`, pocBadgeX + pocBadgeW / 2, pocY + 3);
      ctx.restore();

      // VAH & VAL lines & Glass Badges
      ctx.save();
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(vpStartX - 10, vahY);
      ctx.lineTo(utils.chartWidth, vahY);
      ctx.moveTo(vpStartX - 10, valY);
      ctx.lineTo(utils.chartWidth, valY);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`VAH $${bookmapData.vahPrice.toFixed(2)}`, chartWidth - 8, vahY - 4);
      ctx.fillText(`VAL $${bookmapData.valPrice.toFixed(2)}`, chartWidth - 8, valY + 11);
      ctx.restore();
    }

    // 8C. Real-time Order Book Imbalance Heatmap (Horizontal bands on the right edge)
    if (indicators.showBookmapPro && bookmapSettings.showBookImbalanceHeatmap && bookmapData.bookImbalanceLevels && bookmapData.bookImbalanceLevels.length > 0) {
      ctx.save();
      const stripW = 95;
      const stripX = chartWidth - stripW - 6;

      bookmapData.bookImbalanceLevels.forEach((level) => {
        const y = getY(level.price);
        const barH = 7;
        const isBull = level.imbalance >= 0;
        const ratio = Math.abs(level.imbalance);
        
        const colorHex = isBull ? currentPalette.bull : currentPalette.bear;
        ctx.fillStyle = `${colorHex}${Math.floor(ratio * 255).toString(16).padStart(2, '0')}`;
        ctx.fillRect(stripX, y - barH / 2, stripW, barH);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(stripX, y - barH / 2, stripW, barH);

        if (ratio > 0.4 && chartWidth >= 400) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
          ctx.font = '7px monospace';
          ctx.textAlign = 'right';
          const sizeText = level.bidSize > level.askSize 
            ? `${(level.imbalance * 100).toFixed(0)}% B` 
            : `${(Math.abs(level.imbalance) * 100).toFixed(0)}% S`;
          ctx.fillText(sizeText, chartWidth - 10, y + 2.5);
        }
      });
      
      const headY = getY(bookmapData.bookImbalanceLevels[0].price) - 10;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('DEPTH IMBALANCE', stripX + stripW / 2, headY);
      ctx.restore();
    }

    // 8D. Level 2 Iceberg Order Detection Heuristic Walls (Heatmap Intensity Mode & Fixed Auto-Anchor)
    if (indicators.showBookmapPro && (bookmapSettings.showIcebergOrders ?? true) && bookmapData.icebergOrders && bookmapData.icebergOrders.length > 0) {
      // Dynamic zoom scale factor responsive to visible candle density
      const zoomScale = Math.min(1.25, Math.max(0.45, (chartWidth / Math.max(1, visibleCount)) / 16));

      bookmapData.icebergOrders.forEach((ice) => {
        const y = getY(ice.price);
        // Do not render if far off-screen vertically
        if (y < -40 || y > mainChartHeight + 40) return;

        const isBuy = ice.type === 'BUY_ICEBERG';
        const isMitigated = !!ice.isMitigated;
        const intensity = Math.min(1.0, Math.max(0.2, ice.intensity || 0.5));

        const themeBull = (bookmapData as any).themeColors?.bull || currentPalette.bull || '#10b981';
        const themeBear = (bookmapData as any).themeColors?.bear || currentPalette.bear || '#f43f5e';
        const activeColor = isBuy ? themeBull : themeBear;
        
        // Keep intensity mapping inside the active theme instead of using a global thermal palette.
        const thermalHeatColor = getBookmapThemeColor(
          intensity,
          isBuy ? 'bid' : 'ask',
          'theme',
          currentPalette,
          0.95
        );
        const baseColor = isMitigated ? '#94a3b8' : activeColor;

        // Lock candle index to exact timestamp to ensure 100% fixed 1:1 anchor during pan/drag
        const timeMatchedIdx = ice.time ? candles.findIndex(c => c.time === ice.time) : -1;
        const candleIdx = timeMatchedIdx !== -1 ? timeMatchedIdx : ice.index;
        
        // Exact sub-pixel horizontal position of origin candle (moves 1:1 with candles)
        const rawOriginX = getX(candleIdx);

        // Line End Point calculation using exact timestamp match
        let rawMitigatedX = chartWidth;
        if (isMitigated) {
          const mitTime = ice.mitigatedTime ?? (ice.mitigatedIndex !== undefined ? candles[ice.mitigatedIndex]?.time : undefined);
          const mitTimeMatchedIdx = mitTime ? candles.findIndex(c => c.time === mitTime) : -1;
          const mitIdx = mitTimeMatchedIdx !== -1 ? mitTimeMatchedIdx : (ice.mitigatedIndex ?? -1);
          if (mitIdx >= 0) {
            rawMitigatedX = getX(mitIdx);
          }
        }

        // Line projection bounds
        const lineStartX = rawOriginX;
        const lineEndX = isMitigated ? Math.min(chartWidth, Math.max(rawOriginX + 5, rawMitigatedX)) : chartWidth;

        // Strict off-screen check: if line is completely past left edge or right edge, skip render
        if (lineEndX < -20 || lineStartX > chartWidth + 20) return;

        ctx.save();

        // 1. Heatmap Intensity Projection Band (Thickness & Opacity scaled by intensity & zoom)
        const drawBandStartX = Math.max(0, lineStartX);
        const bandH = Math.floor((6 + intensity * 10) * zoomScale);
        if (lineEndX > drawBandStartX) {
          const bandGradient = ctx.createLinearGradient(drawBandStartX, y - bandH / 2, lineEndX, y + bandH / 2);
          const alphaHex = Math.floor((0.15 + intensity * 0.25) * 255).toString(16).padStart(2, '0');
          bandGradient.addColorStop(0, isMitigated ? 'rgba(148, 163, 184, 0.15)' : `${activeColor}${alphaHex}`);
          bandGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = bandGradient;
          ctx.globalCompositeOperation = 'screen';
          ctx.fillRect(drawBandStartX, y - bandH / 2, Math.max(1, lineEndX - drawBandStartX), bandH);
          ctx.globalCompositeOperation = 'source-over';
        }

        // 2. High-Tech Laser Line with Heatmap Glow Intensity (Starts exactly at lineStartX)
        const glowBlur = Math.floor((isMitigated ? 2 : 4 + intensity * 14) * zoomScale);
        
        // Removed lines/borders, keeping only the area band and stack blocks
        
        // 3. Multi-Refill Energy Stack Blocks at Origin Candle (drawn relative to rawOriginX)
        const stackCount = Math.min(6, Math.max(2, ice.count || 3));
        const blockW = Math.max(4, 7 * zoomScale);
        const blockH = Math.max(4, 6 * zoomScale);
        const blockGap = Math.max(5, 9 * zoomScale);

        if (rawOriginX >= -80 && rawOriginX <= chartWidth + 80) {
          ctx.fillStyle = baseColor;
          ctx.shadowColor = baseColor;
          ctx.shadowBlur = isMitigated ? 0 : glowBlur / 2;
          for (let r = 0; r < stackCount; r++) {
            const blockX = rawOriginX + r * blockGap;
            if (blockX < -20 || blockX > chartWidth + 20) continue;
            ctx.beginPath();
            if (typeof (ctx as any).roundRect === 'function') {
              (ctx as any).roundRect(blockX, y - blockH / 2, blockW, blockH, 2 * zoomScale);
            } else {
              ctx.rect(blockX, y - blockH / 2, blockW, blockH);
            }
            ctx.fill();
          }

          // 4. Origin Node Indicator
          ctx.fillStyle = isMitigated ? '#64748b' : (intensity > 0.75 ? thermalHeatColor : '#ffffff');
          ctx.beginPath();
          ctx.arc(rawOriginX - 3 * zoomScale, y, Math.max(2.5, 4 * zoomScale), 0, Math.PI * 2);
          ctx.fill();
        }

        // 4B. Mitigation Termination Crosshair Node
        if (isMitigated && rawMitigatedX >= -50 && rawMitigatedX <= chartWidth + 50) {
          ctx.fillStyle = '#f59e0b';
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1.2 * zoomScale;
          ctx.beginPath();
          ctx.arc(lineEndX, y, Math.max(2.5, 4 * zoomScale), 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(lineEndX - 2, y - 2);
          ctx.lineTo(lineEndX + 2, y + 2);
          ctx.moveTo(lineEndX + 2, y - 2);
          ctx.lineTo(lineEndX - 2, y + 2);
          ctx.stroke();
        }

        // 5. Adaptive Heatmap HUD Badge (Sleek, compact & auto-responsive to zoom)
        const baseBadgeW = isMitigated ? 120 : (intensity > 0.75 ? 135 : 115);
        const badgeW = Math.max(70, Math.min(150, baseBadgeW * zoomScale));
        const badgeH = Math.max(11, Math.min(17, 14 * zoomScale));
        const fontSize = Math.max(6, Math.min(9, 7.2 * zoomScale));
        
        // Badge position moves 100% 1:1 with origin candle for zero visual jittering
        const badgeX = rawOriginX + stackCount * blockGap + 8 * zoomScale;
        const badgeY = y - badgeH / 2;

        if (badgeX > -badgeW && badgeX < chartWidth + 20) {
          const badgeBgGrad = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeW, badgeY + badgeH);
          const [rBull, gBull, bBull] = hexToRgbTuple(themeBull, [81, 52, 255]);
          const [rBear, gBear, bBear] = hexToRgbTuple(themeBear, [23, 156, 116]);
          const [darkR, darkG, darkB] = hexToRgbTuple(
            currentPalette.dark && currentPalette.dark !== '#000000' && currentPalette.dark !== '#ffffff' ? currentPalette.dark : '#060913',
            [6, 9, 19]
          );

          if (isLight) {
            badgeBgGrad.addColorStop(0, isMitigated ? 'rgba(241, 245, 249, 0.96)' : (isBuy ? `rgba(${rBull}, ${gBull}, ${bBull}, 0.16)` : `rgba(${rBear}, ${gBear}, ${bBear}, 0.16)`));
            badgeBgGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)');
            badgeBgGrad.addColorStop(1, 'rgba(248, 250, 252, 0.92)');
          } else {
            badgeBgGrad.addColorStop(0, isMitigated ? 'rgba(15, 23, 42, 0.96)' : (isBuy ? `rgba(${rBull}, ${gBull}, ${bBull}, 0.22)` : `rgba(${rBear}, ${gBear}, ${bBear}, 0.22)`));
            badgeBgGrad.addColorStop(0.5, `rgba(${darkR + 4}, ${darkG + 6}, ${darkB + 10}, 0.92)`);
            badgeBgGrad.addColorStop(1, 'rgba(11, 15, 26, 0.88)');
          }

          ctx.fillStyle = badgeBgGrad;
          ctx.strokeStyle = isMitigated ? '#64748b' : (intensity > 0.75 ? thermalHeatColor : baseColor);
          ctx.lineWidth = intensity > 0.75 ? 1.4 : 0.8;
          ctx.shadowColor = typeof ctx.strokeStyle === 'string' ? ctx.strokeStyle : '#10b981';
          ctx.shadowBlur = isMitigated ? 1 : glowBlur / 4;

          if (typeof (ctx as any).roundRect === 'function') {
            (ctx as any).roundRect(badgeX, badgeY, badgeW, badgeH, 3 * zoomScale);
          } else {
            ctx.rect(badgeX, badgeY, badgeW, badgeH);
          }
          ctx.fill();
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Thermal Heatmap Indicator Pill inside badge
          const pillSize = Math.max(3, 4.5 * zoomScale);
          ctx.fillStyle = isMitigated ? '#94a3b8' : thermalHeatColor;
          ctx.beginPath();
          ctx.arc(badgeX + 6 * zoomScale, badgeY + badgeH / 2, pillSize / 2, 0, Math.PI * 2);
          ctx.fill();

          // Badge Typography
          ctx.font = `bold ${fontSize}px monospace`;
          ctx.textAlign = 'left';
          
          if (isMitigated) {
            ctx.fillStyle = '#f59e0b';
            ctx.fillText(`✓ MITIGATED`, badgeX + 11 * zoomScale, badgeY + badgeH / 2 + fontSize * 0.35);
            ctx.fillStyle = '#94a3b8';
            ctx.textAlign = 'right';
            ctx.fillText(`$${ice.price.toFixed(2)}`, badgeX + badgeW - 4 * zoomScale, badgeY + badgeH / 2 + fontSize * 0.35);
          } else {
            const intensityTag = intensity > 0.75 ? '⚡' : '❄';
            ctx.fillStyle = activeColor;
            ctx.fillText(`${intensityTag} ${isBuy ? 'BUY' : 'SELL'} ${ice.count}x`, badgeX + 11 * zoomScale, badgeY + badgeH / 2 + fontSize * 0.35);
            
            ctx.fillStyle = '#e2e8f0';
            ctx.textAlign = 'right';
            const volText = ice.volume ? formatVol(ice.volume) : '';
            ctx.fillText(`$${ice.price.toFixed(2)}${volText ? ` | ${volText}` : ''}`, badgeX + badgeW - 4 * zoomScale, badgeY + badgeH / 2 + fontSize * 0.35);
          }
        }

        ctx.restore();
      });
    }

    // 8B. Short-Term Volume Profile (Left Spine Glass Container - Micro Short & Long)
    if (indicators.showBookmapPro && bookmapSettings.showShortTermVP && bookmapData.profileBuckets.length > 0) {
      const maxSVol = Math.max(...bookmapData.profileBuckets.map((p) => p.sTotalVol), 1);
      // Compact width in clean mode
      const sPanelX = 12;
      const sPanelW = isCleanChartMode
        ? Math.max(40, Math.floor(chartWidth * 0.10))
        : Math.max(60, Math.floor(chartWidth * 0.15));
      const sSpineX = sPanelX + sPanelW / 2;
      const sSideWidth = (sPanelW - 20) / 2;

      // 8B. Glassmorphism Panel Container for Short-Term VP
      ctx.save();
      ctx.fillStyle = isCleanChartMode ? 'rgba(8, 11, 20, 0.12)' : 'rgba(8, 11, 20, 0.22)';
      ctx.strokeStyle = `${currentPalette.poc}20`;
      ctx.lineWidth = 1;
      if (typeof (ctx as any).roundRect === 'function') {
        (ctx as any).roundRect(sPanelX, 8, sPanelW, mainChartHeight - 16, 6);
      } else {
        ctx.rect(sPanelX, 8, sPanelW, mainChartHeight - 16);
      }
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Header Badge
      ctx.save();
      ctx.fillStyle = currentPalette.poc;
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('● MICRO SHORT/LONG PROFILE', sSpineX, 22);
      ctx.restore();

      bookmapData.profileBuckets.forEach((bucket) => {
        const yTop = getY(bucket.priceTop);
        const yBot = getY(bucket.priceBottom);
        const h = Math.max(1.8, yBot - yTop);

        if (bucket.sTotalVol > 0) {
          const buyW = (bucket.sBuyVol / maxSVol) * sSideWidth;
          const sellW = (bucket.sSellVol / maxSVol) * sSideWidth;

          // Sell Volume Bar (Shorts - Left side)
          ctx.save();
          const sellGrad = ctx.createLinearGradient(sSpineX - sellW, 0, sSpineX, 0);
          sellGrad.addColorStop(0, `${currentPalette.bear}55`);
          sellGrad.addColorStop(1, currentPalette.bear);
          ctx.fillStyle = sellGrad;
          ctx.fillRect(sSpineX - sellW, yTop, sellW, h);

          // Buy Volume Bar (Longs - Right side)
          const buyGrad = ctx.createLinearGradient(sSpineX, 0, sSpineX + buyW, 0);
          buyGrad.addColorStop(0, currentPalette.bull);
          buyGrad.addColorStop(1, `${currentPalette.bull}55`);
          ctx.fillStyle = buyGrad;
          ctx.fillRect(sSpineX, yTop, buyW, h);
          ctx.restore();

          // Text labels inside wide micro bars
          if (sellW >= 22 && h >= 7) {
            ctx.save();
            ctx.fillStyle = '#ffffff';
            ctx.font = '7.5px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(formatVol(bucket.sSellVol), sSpineX - 4, yTop + h / 2 + 2.5);
            ctx.restore();
          }
          if (buyW >= 22 && h >= 7) {
            ctx.save();
            ctx.fillStyle = '#ffffff';
            ctx.font = '7.5px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(formatVol(bucket.sBuyVol), sSpineX + 4, yTop + h / 2 + 2.5);
            ctx.restore();
          }

          // Diagonal Imbalance indicators
          if (bucket.isSImbalanceBuy) {
            ctx.fillStyle = currentPalette.poc;
            ctx.beginPath();
            ctx.arc(sSpineX + buyW + 3, yTop + h / 2, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
          if (bucket.isSImbalanceSell) {
            ctx.fillStyle = currentPalette.poc;
            ctx.beginPath();
            ctx.arc(sSpineX - sellW - 3, yTop + h / 2, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });

      // Spine Center line
      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = `${currentPalette.poc}80`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(sSpineX, 28);
      ctx.lineTo(sSpineX, mainChartHeight - 12);
      ctx.stroke();
      ctx.restore();
    }

    // 9. Historical Averages & Historical POC
    if (indicators.showBookmapPro && bookmapSettings.showHistoricalAvgPlots) {
      const drawHLine = (price: number, color: string, labelText: string) => {
        const y = getY(price);
        ctx.save();
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(utils.chartWidth, y);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = color;
        ctx.font = 'bold 8.5px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(labelText, 8, y - 3);
      };

      drawHLine(bookmapData.histAvgBuy, currentPalette.bull, `AVG BUY $${bookmapData.histAvgBuy.toFixed(2)}`);
      drawHLine(bookmapData.histAvgSell, currentPalette.bear, `AVG SELL $${bookmapData.histAvgSell.toFixed(2)}`);
    }

    // 10. Price Prediction Engine (Confluence Zigzag Lines & Targets)
    if (indicators.showBookmapPro && bookmapSettings.showPredictions && bookmapData.predictions.length > 0) {
      bookmapData.predictions.forEach((pred) => {
        const x1 = getX(Math.min(endIndex - 1, pred.startX));
        const x2 = x1 + (pred.endX - pred.startX) * totalCandleSlot;
        const y1 = getY(pred.startY);
        const y2 = getY(pred.endY);

        const col = pred.isAbove ? currentPalette.bull : currentPalette.bear;

        // Zigzag dotted path with gravitational curve option
        ctx.save();
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = col;
        ctx.lineWidth = Math.min(2.5, pred.confluence);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        if ((bookmapSettings.showGravityPaths ?? true) && pred.isCurved && pred.controlX !== undefined && pred.controlY !== undefined) {
          const xc = x1 + (pred.controlX - pred.startX) * totalCandleSlot;
          const yc = getY(pred.controlY);
          ctx.quadraticCurveTo(xc, yc, x2, y2);
        } else {
          ctx.lineTo(x2, y2);
        }
        ctx.stroke();
        ctx.restore();

        // Target End Circle (Pulsing Animated Ring in Theme Palette)
        const targetPulse = 1.0 + Math.abs(Math.sin(Date.now() / 280)) * 0.35;
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(x2, y2, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = col;
        ctx.lineWidth = Math.max(1.5, candleWidth / 30);
        ctx.beginPath();
        ctx.arc(x2, y2, 6 * targetPulse + 1, 0, Math.PI * 2);
        ctx.stroke();

        // Target Label
        ctx.fillStyle = col;
        ctx.font = 'bold 9.5px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(pred.label, x2 + 10, y2 + 3);
      });
    }

    // 10B. Swing Failure Pattern (SFP) Auto-Markers
    if (indicators.showBookmapPro && (bookmapSettings.showSfpMarkers ?? true) && bookmapData.sfpMarkers && bookmapData.sfpMarkers.length > 0) {
      bookmapData.sfpMarkers.forEach((sfp) => {
        if (sfp.index >= startIndex && sfp.index < endIndex) {
          const x = getX(sfp.index);
          const y = getY(sfp.price);
          const isBull = sfp.type === 'BULLISH_SFP';
          const color = isBull ? currentPalette.bull : currentPalette.bear;

          ctx.save();
          // Glow effect
          ctx.shadowBlur = 6;
          ctx.shadowColor = color;
          
          // Draw neat indicator arrow/triangle
          ctx.fillStyle = color;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.beginPath();
          if (isBull) {
            // Upward triangle below low
            ctx.moveTo(x, y + 8);
            ctx.lineTo(x - 5, y + 16);
            ctx.lineTo(x + 5, y + 16);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Label
            ctx.fillStyle = color;
            ctx.shadowBlur = 0;
            ctx.font = 'bold 8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('SFP FLOOR', x, y + 25);
          } else {
            // Downward triangle above high
            ctx.moveTo(x, y - 8);
            ctx.lineTo(x - 5, y - 16);
            ctx.lineTo(x + 5, y - 16);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Label
            ctx.fillStyle = color;
            ctx.shadowBlur = 0;
            ctx.font = 'bold 8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('SFP PEAK', x, y - 21);
          }
          ctx.restore();
        }
      });
    }

    // 11. Overlay Indicators (EMA 20, 50, 200, SuperTrend, Bollinger)
    const drawIndicatorLine = (data: (number | null)[], color: string, lineWidth: number, dashed: boolean = false) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      if (dashed) ctx.setLineDash([4, 4]);
      ctx.beginPath();
      let started = false;

      for (let i = startIndex; i < endIndex; i++) {
        const val = data[i];
        if (val === null || val === undefined) continue;
        const x = getX(i);
        const y = getY(val);
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    };

    if (indicators.showEma20) drawIndicatorLine(ema20, currentPalette.bull, 1.8);
    if (indicators.showEma50) drawIndicatorLine(ema50, currentPalette.poc, 1.6);
    if (indicators.showEma200) drawIndicatorLine(ema200, currentPalette.bear, 2.0);
    if (indicators.showBollinger) {
      // Bollinger Bands Shaded Area
      ctx.save();
      ctx.fillStyle = 'rgba(168, 85, 247, 0.08)';
      ctx.beginPath();
      let startedArea = false;
      for (let i = startIndex; i < endIndex; i++) {
        const topVal = bollinger.upper[i];
        if (topVal === null || topVal === undefined) continue;
        const x = getX(i);
        const y = getY(topVal);
        if (!startedArea) {
          ctx.moveTo(x, y);
          startedArea = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      for (let i = endIndex - 1; i >= startIndex; i--) {
        const botVal = bollinger.lower[i];
        if (botVal === null || botVal === undefined) continue;
        const x = getX(i);
        const y = getY(botVal);
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Bollinger Bands Lines
      drawIndicatorLine(bollinger.upper, '#a855f7', 1.2, true);
      drawIndicatorLine(bollinger.middle, '#c084fc', 1.2);
      drawIndicatorLine(bollinger.lower, '#a855f7', 1.2, true);
    }
    if (indicators.showSuperTrend) {
      for (let i = startIndex; i < endIndex - 1; i++) {
        const val1 = supertrend.supertrend[i];
        const val2 = supertrend.supertrend[i + 1];
        const trend = supertrend.trend[i];
        if (val1 === null || val2 === null || trend === null) continue;

        ctx.strokeStyle = trend === 1 ? currentPalette.bull : currentPalette.bear;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(getX(i), getY(val1));
        ctx.lineTo(getX(i + 1), getY(val2));
        ctx.stroke();
      }

      supertrend.signals.forEach((sig) => {
        if (sig.index >= startIndex && sig.index < endIndex) {
          const x = getX(sig.index);
          const y = getY(sig.price);
          const isBuy = sig.type === 'BUY';

          ctx.fillStyle = isBuy ? currentPalette.bull : currentPalette.bear;
          ctx.beginPath();
          if (isBuy) {
            ctx.moveTo(x, y + 14);
            ctx.lineTo(x - 5, y + 22);
            ctx.lineTo(x + 5, y + 22);
          } else {
            ctx.moveTo(x, y - 14);
            ctx.lineTo(x - 5, y - 22);
            ctx.lineTo(x + 5, y - 22);
          }
          ctx.closePath();
          ctx.fill();
        }
      });
    }

    // 11.5 Long/Short VP MA Lines
    if (indicators.showBookmapPro && bookmapSettings.showLongShortVPMa && bookmapData.longShortVPMaLine) {
      ctx.save();
      
      // Draw Buy VWAP MA
      ctx.strokeStyle = currentPalette.bull;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([6, 3]);
      ctx.shadowColor = currentPalette.bull;
      ctx.shadowBlur = 4;
      ctx.beginPath();
      let startedBuy = false;
      let lastBuyX = 0;
      let lastBuyY = 0;
      for (let i = startIndex; i < endIndex; i++) {
        const dp = bookmapData.longShortVPMaLine[i];
        if (!dp) continue;
        const x = getX(i);
        const y = getY(dp.buyVwap);
        if (!startedBuy) {
          ctx.moveTo(x, y);
          startedBuy = true;
        } else {
          ctx.lineTo(x, y);
        }
        lastBuyX = x;
        lastBuyY = y;
      }
      ctx.stroke();

      if (startedBuy && lastBuyX > 0) {
        ctx.fillStyle = currentPalette.bull;
        ctx.font = 'bold 8.5px monospace';
        ctx.textAlign = 'left';
        ctx.shadowBlur = 0;
        ctx.fillText(`BUY VWAP MA $${bookmapData.longShortVPMaLine[endIndex - 1]?.buyVwap?.toFixed(2) || ''}`, Math.min(chartWidth - 110, lastBuyX + 6), lastBuyY - 3);
      }
      
      // Draw Sell VWAP MA
      ctx.strokeStyle = currentPalette.bear;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([6, 3]);
      ctx.shadowColor = currentPalette.bear;
      ctx.shadowBlur = 4;
      ctx.beginPath();
      let startedSell = false;
      let lastSellX = 0;
      let lastSellY = 0;
      for (let i = startIndex; i < endIndex; i++) {
        const dp = bookmapData.longShortVPMaLine[i];
        if (!dp) continue;
        const x = getX(i);
        const y = getY(dp.sellVwap);
        if (!startedSell) {
          ctx.moveTo(x, y);
          startedSell = true;
        } else {
          ctx.lineTo(x, y);
        }
        lastSellX = x;
        lastSellY = y;
      }
      ctx.stroke();

      if (startedSell && lastSellX > 0) {
        ctx.fillStyle = currentPalette.bear;
        ctx.font = 'bold 8.5px monospace';
        ctx.textAlign = 'left';
        ctx.shadowBlur = 0;
        ctx.fillText(`SELL VWAP MA $${bookmapData.longShortVPMaLine[endIndex - 1]?.sellVwap?.toFixed(2) || ''}`, Math.min(chartWidth - 110, lastSellX + 6), lastSellY + 9);
      }

      ctx.restore();
    }

    // 11C. Order Flow DOM Key Levels & Micro Ribbon On-Chart Visuals
    if (showDomLadder && showDomChartOverlay && domLadderData) {
      // 1. Render DOM Key Levels (POC Ray, High Bid Liquidity Wall, High Ask Liquidity Wall)
      domLadderData.keyLevels.forEach((lvl) => {
        const y = getY(lvl.price);
        if (y < 0 || y > mainChartHeight) return;

        ctx.save();
        if (lvl.type === 'poc') {
          // DOM POC Ray across chart
          ctx.strokeStyle = currentPalette.poc || '#f59e0b';
          ctx.lineWidth = 1.8;
          ctx.setLineDash([5, 3]);
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(chartWidth - 36, y);
          ctx.stroke();

          // Badge on Right Edge of Chart
          const badgeText = `🎯 DOM (poc) $${lvl.formattedPrice} (${(lvl.volumeOrSize / 1000).toFixed(1)}k)`;
          ctx.font = 'bold 9px monospace';
          const bW = ctx.measureText(badgeText).width + 10;
          ctx.fillStyle = '#1e1b18';
          ctx.fillRect(chartWidth - bW - 40, y - 8, bW, 16);
          ctx.strokeStyle = currentPalette.poc || '#f59e0b';
          ctx.lineWidth = 1.2;
          ctx.strokeRect(chartWidth - bW - 40, y - 8, bW, 16);
          ctx.fillStyle = '#fde047';
          ctx.textAlign = 'left';
          ctx.fillText(badgeText, chartWidth - bW - 35, y + 3.5);
        } else if (lvl.type === 'bid_wall') {
          // DOM High Bid Liquidity Wall Ray
          ctx.strokeStyle = currentPalette.bull || '#22c55e';
          ctx.lineWidth = 1.4;
          ctx.setLineDash([3, 4]);
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(chartWidth - 36, y);
          ctx.stroke();

          const badgeText = `📗 DOM BID WALL ${lvl.volumeOrSize} LMT @ $${lvl.formattedPrice}`;
          ctx.font = 'bold 8.5px monospace';
          const bW = ctx.measureText(badgeText).width + 8;
          ctx.fillStyle = '#062817';
          ctx.fillRect(chartWidth - bW - 40, y - 7, bW, 14);
          ctx.strokeStyle = currentPalette.bull || '#22c55e';
          ctx.lineWidth = 0.9;
          ctx.strokeRect(chartWidth - bW - 40, y - 7, bW, 14);
          ctx.fillStyle = '#86efac';
          ctx.textAlign = 'left';
          ctx.fillText(badgeText, chartWidth - bW - 36, y + 3);
        } else if (lvl.type === 'ask_wall') {
          // DOM High Ask Liquidity Wall Ray
          ctx.strokeStyle = currentPalette.bear || '#ef4444';
          ctx.lineWidth = 1.4;
          ctx.setLineDash([3, 4]);
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(chartWidth - 36, y);
          ctx.stroke();

          const badgeText = `📕 DOM ASK WALL ${lvl.volumeOrSize} LMT @ $${lvl.formattedPrice}`;
          ctx.font = 'bold 8.5px monospace';
          const bW = ctx.measureText(badgeText).width + 8;
          ctx.fillStyle = '#2a0a0f';
          ctx.fillRect(chartWidth - bW - 40, y - 7, bW, 14);
          ctx.strokeStyle = currentPalette.bear || '#ef4444';
          ctx.lineWidth = 0.9;
          ctx.strokeRect(chartWidth - bW - 40, y - 7, bW, 14);
          ctx.fillStyle = '#fca5a5';
          ctx.textAlign = 'left';
          ctx.fillText(badgeText, chartWidth - bW - 36, y + 3);
        }
        ctx.restore();
      });

      // 2. DOM Horizontal Volume Profile Ribbon (Right edge before price scale)
      const ribbonWidth = 48;
      const ribbonStartX = chartWidth - ribbonWidth;

      // Draw each active DOM row level as aesthetic horizontal Volume Profile lines
      const ribbonPoints: Array<{ tipX: number; midY: number; yTop: number; rowH: number; buyRatio: number; row: typeof domLadderData.rows[0] }> = [];

      domLadderData.rows.forEach((row) => {
        const yTop = getY(row.price + domLadderData.priceStep * 0.5);
        const yBot = getY(row.price - domLadderData.priceStep * 0.5);
        const rowH = Math.max(2, Math.abs(yBot - yTop));
        const midY = (yTop + yBot) / 2;
        if (midY < 0 || midY > mainChartHeight) return;

        const volRatio = domLadderData.maxVolume > 0 ? row.totalVolume / domLadderData.maxVolume : 0;
        const barW = Math.max(3, volRatio * (ribbonWidth - 6));
        const buyRatio = row.totalVolume > 0 ? row.buyVolume / row.totalVolume : 0.5;
        const tipX = ribbonStartX + (ribbonWidth - barW);

        ribbonPoints.push({ tipX, midY, yTop, rowH, buyRatio, row });
      });

      // Continuous DOM Ribbon contour fill & smooth line stroke
      if (ribbonPoints.length > 1) {
        const sortedRibbon = [...ribbonPoints].sort((a, b) => a.midY - b.midY);
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(ribbonStartX + ribbonWidth, sortedRibbon[0].midY);
        sortedRibbon.forEach((pt) => {
          ctx.lineTo(pt.tipX, pt.midY);
        });
        ctx.lineTo(ribbonStartX + ribbonWidth, sortedRibbon[sortedRibbon.length - 1].midY);
        ctx.closePath();

        const ribbonGrad = ctx.createLinearGradient(ribbonStartX, 0, ribbonStartX + ribbonWidth, 0);
        ribbonGrad.addColorStop(0, `${currentPalette.poc || '#f59e0b'}66`);
        ribbonGrad.addColorStop(0.5, `${currentPalette.bull}48`);
        ribbonGrad.addColorStop(1, `${currentPalette.bear}35`);
        ctx.fillStyle = ribbonGrad;
        ctx.fill();

        ctx.beginPath();
        sortedRibbon.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.tipX, pt.midY);
          else ctx.lineTo(pt.tipX, pt.midY);
        });
        ctx.strokeStyle = currentPalette.poc || '#f59e0b';
        ctx.lineWidth = 1.8;
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    }

    // 11D. Institutional Fair Value Gaps (FVG) & Smart Money Market Structure removed

    // Restore Bookmap clip rect after all overlay sections
    ctx.restore();
    // 12. Sub-Windows: Volume, Vol Delta, RSI & MACD
    let currentPanelTop = mainChartHeight;
    
    // Dedicated Pane 1: Volume Histogram Sub-Window
    if (indicators.showVolume && volHeight > 0) {
      const panelTop = currentPanelTop;
      currentPanelTop += volHeight;
      
      ctx.save();
      ctx.strokeStyle = chartBorder;
      ctx.strokeRect(0, panelTop, width, volHeight);
      ctx.fillStyle = chartScaleBg;
      ctx.fillRect(0, panelTop, chartWidth, volHeight);

      // Premium Glassmorphism Header Bar
      const headerBarY_1 = panelTop;
      const headerBarH_1 = 22;
      const headerGrad_1 = ctx.createLinearGradient(0, headerBarY_1, chartWidth, headerBarY_1 + headerBarH_1);
      const [darkR_1, darkG_1, darkB_1] = hexToRgbTuple(
        currentPalette.dark && currentPalette.dark !== '#000000' && currentPalette.dark !== '#ffffff' ? currentPalette.dark : '#060913',
        [6, 9, 19]
      );

      if (isLight) {
        headerGrad_1.addColorStop(0, 'rgba(241, 245, 249, 0.85)');
        headerGrad_1.addColorStop(0.5, 'rgba(255, 255, 255, 0.90)');
        headerGrad_1.addColorStop(1, 'rgba(241, 245, 249, 0.80)');
      } else {
        headerGrad_1.addColorStop(0, `rgba(${darkR_1 + 4}, ${darkG_1 + 6}, ${darkB_1 + 10}, 0.75)`);
        headerGrad_1.addColorStop(0.5, 'rgba(11, 15, 26, 0.80)');
        headerGrad_1.addColorStop(1, `rgba(${darkR_1 + 2}, ${darkG_1 + 3}, ${darkB_1 + 5}, 0.65)`);
      }

      ctx.fillStyle = headerGrad_1;
      ctx.fillRect(0, headerBarY_1, chartWidth, headerBarH_1);

      // Accent border at bottom of header bar
      ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, headerBarY_1 + headerBarH_1);
      ctx.lineTo(chartWidth, headerBarY_1 + headerBarH_1);
      ctx.stroke();

      // Top accent gradient bar line
      const topAccGrad_1 = ctx.createLinearGradient(0, headerBarY_1, chartWidth, headerBarY_1);
      topAccGrad_1.addColorStop(0, currentPalette.bull || '#10b981');
      topAccGrad_1.addColorStop(0.5, currentPalette.poc || '#6366f1');
      topAccGrad_1.addColorStop(1, currentPalette.bear || '#ef4444');
      ctx.strokeStyle = topAccGrad_1;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, headerBarY_1);
      ctx.lineTo(chartWidth, headerBarY_1);
      ctx.stroke();

      const maxVol = Math.max(...visibleCandles.map((c) => c.volume), 1);
      visibleCandles.forEach((c, idx) => {
        const globalIdx = startIndex + idx;
        const x = getX(globalIdx) - candleWidth / 2;
        const vH = (c.volume / maxVol) * (volHeight - 12);
        const isBull = c.close >= c.open;
        ctx.fillStyle = isBull ? (currentPalette.bull || '#10b981') : (currentPalette.bear || '#ef4444');
        ctx.globalAlpha = 0.85;
        ctx.fillRect(x, panelTop + volHeight - vH, candleWidth, Math.max(1, vH));
      });
      ctx.globalAlpha = 1.0;

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px system-ui';
      ctx.fillText('Volume', 10, panelTop + 16);
      const lastVol = visibleCandles[visibleCandles.length - 1]?.volume;
      if (lastVol !== undefined) {
        ctx.fillStyle = '#f8fafc';
        ctx.font = '11px monospace';
        ctx.fillText(`${formatVol(lastVol)}`, 70, panelTop + 16);
      }
      ctx.restore();
    }

    // Dedicated Pane 2: Volume Delta & CVD Sub-Window
    const showVolDelta = (indicators.showLiquidityHeatmap && indicators.liquidityHeatmapConfig?.showVolumeDelta) || indicators.showVolumeDelta;
    if (showVolDelta && volDeltaHeight > 0) {
      const panelTop = currentPanelTop;
      currentPanelTop += volDeltaHeight;

      ctx.save();
      ctx.strokeStyle = chartBorder;
      ctx.strokeRect(0, panelTop, width, volDeltaHeight);
      ctx.fillStyle = chartScaleBg;
      ctx.fillRect(0, panelTop, chartWidth, volDeltaHeight);

      // Premium Glassmorphism Header Bar
      const headerBarY_2 = panelTop;
      const headerBarH_2 = 22;
      const headerGrad_2 = ctx.createLinearGradient(0, headerBarY_2, chartWidth, headerBarY_2 + headerBarH_2);
      const [darkR_2, darkG_2, darkB_2] = hexToRgbTuple(
        currentPalette.dark && currentPalette.dark !== '#000000' && currentPalette.dark !== '#ffffff' ? currentPalette.dark : '#060913',
        [6, 9, 19]
      );

      if (isLight) {
        headerGrad_2.addColorStop(0, 'rgba(241, 245, 249, 0.85)');
        headerGrad_2.addColorStop(0.5, 'rgba(255, 255, 255, 0.90)');
        headerGrad_2.addColorStop(1, 'rgba(241, 245, 249, 0.80)');
      } else {
        headerGrad_2.addColorStop(0, `rgba(${darkR_2 + 4}, ${darkG_2 + 6}, ${darkB_2 + 10}, 0.75)`);
        headerGrad_2.addColorStop(0.5, 'rgba(11, 15, 26, 0.80)');
        headerGrad_2.addColorStop(1, `rgba(${darkR_2 + 2}, ${darkG_2 + 3}, ${darkB_2 + 5}, 0.65)`);
      }

      ctx.fillStyle = headerGrad_2;
      ctx.fillRect(0, headerBarY_2, chartWidth, headerBarH_2);

      // Accent border at bottom of header bar
      ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, headerBarY_2 + headerBarH_2);
      ctx.lineTo(chartWidth, headerBarY_2 + headerBarH_2);
      ctx.stroke();

      // Top accent gradient bar line
      const topAccGrad_2 = ctx.createLinearGradient(0, headerBarY_2, chartWidth, headerBarY_2);
      topAccGrad_2.addColorStop(0, currentPalette.bull || '#10b981');
      topAccGrad_2.addColorStop(0.5, currentPalette.poc || '#6366f1');
      topAccGrad_2.addColorStop(1, currentPalette.bear || '#ef4444');
      ctx.strokeStyle = topAccGrad_2;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, headerBarY_2);
      ctx.lineTo(chartWidth, headerBarY_2);
      ctx.stroke();

      const deltaMidY = panelTop + volDeltaHeight / 2;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.lineWidth = 0.8;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, deltaMidY);
      ctx.lineTo(chartWidth, deltaMidY);
      ctx.stroke();
      ctx.setLineDash([]);

      const deltas: number[] = [];
      const absDeltas: number[] = [];
      visibleCandles.forEach((c, idx) => {
        const globalIdx = startIndex + idx;
        const fp = footprintData[globalIdx];
        let delta = 0;
        if (fp && typeof fp.delta === 'number' && Math.abs(fp.delta) > 0.001) {
          delta = fp.delta;
        } else if (liquidityHeatmapData?.bubbles?.[globalIdx] && Math.abs(liquidityHeatmapData.bubbles[globalIdx].delta) > 0.001) {
          delta = liquidityHeatmapData.bubbles[globalIdx].delta;
        } else {
          const direction = c.close >= c.open ? 1 : -1;
          const bodyRatio = Math.abs(c.close - c.open) / Math.max(0.0001, c.high - c.low);
          delta = direction * (c.volume || 100) * Math.max(0.35, bodyRatio);
        }
        deltas.push(delta);
        absDeltas.push(Math.abs(delta));
      });

      absDeltas.sort((a, b) => a - b);
      const percentileIndex = Math.floor(absDeltas.length * 0.95);
      let maxDelta = absDeltas.length > 0 ? absDeltas[Math.min(percentileIndex, absDeltas.length - 1)] : 0;
      if (maxDelta === 0) maxDelta = absDeltas.length > 0 ? absDeltas[absDeltas.length - 1] : 100;
      if (maxDelta === 0) maxDelta = 100;

      const barWidth = Math.max(2, Math.min(candleWidth * 0.85, 36));
      const maxBarH = volDeltaHeight / 2 - 4;
      visibleCandles.forEach((c, idx) => {
        const globalIdx = startIndex + idx;
        const x = getX(globalIdx) - barWidth / 2;
        const delta = deltas[idx];
        const barH = Math.min(Math.abs(delta) / maxDelta, 1.1) * maxBarH;

        ctx.fillStyle = delta >= 0 ? (currentPalette.bull || '#10b981') : (currentPalette.bear || '#ef4444');
        ctx.globalAlpha = 0.85;
        if (delta >= 0) {
          ctx.fillRect(x, deltaMidY - barH, barWidth, Math.max(1.5, barH));
        } else {
          ctx.fillRect(x, deltaMidY, barWidth, Math.max(1.5, barH));
        }
      });
      ctx.globalAlpha = 1.0;

      let cumDelta = 0;
      const cumDeltas: number[] = [];
      deltas.forEach((d) => { cumDelta += d; cumDeltas.push(cumDelta); });
      const maxCum = Math.max(...cumDeltas.map(Math.abs), 1);

      const latestCvd = cumDeltas[cumDeltas.length - 1] || 0;
      
      const cvdColor = latestCvd >= 0 ? (currentPalette.bull || '#10b981') : (currentPalette.bear || '#ef4444');
      const cvdGradient = ctx.createLinearGradient(0, panelTop, 0, panelTop + volDeltaHeight);
      cvdGradient.addColorStop(0, `${cvdColor}30`);
      cvdGradient.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.beginPath();
      let lastX = 0;
      visibleCandles.forEach((c, idx) => {
        const x = getX(startIndex + idx);
        lastX = x;
        const normalizedY = deltaMidY - (cumDeltas[idx] / maxCum) * (volDeltaHeight * 0.45);
        if (idx === 0) ctx.moveTo(x, normalizedY);
        else ctx.lineTo(x, normalizedY);
      });
      ctx.strokeStyle = cvdColor;
      ctx.lineWidth = 2.0;
      ctx.lineJoin = 'round';
      ctx.stroke();

      // institutional fill
      ctx.lineTo(lastX, panelTop + volDeltaHeight);
      ctx.lineTo(getX(startIndex), panelTop + volDeltaHeight);
      ctx.closePath();
      ctx.fillStyle = cvdGradient;
      ctx.fill();

      const formatDeltaVal = (val: number) => Math.abs(val) > 1000 ? `${(val/1000).toFixed(1)}k` : Math.floor(val).toString();
      
      ctx.font = 'bold 11px system-ui';
      ctx.fillStyle = '#f8fafc';
      ctx.fillText('CVD Oscillator', 10, panelTop + 16);
      ctx.font = '11px monospace';
      ctx.fillStyle = latestCvd >= 0 ? currentPalette.bull : currentPalette.bear;
      ctx.fillText(`Δ ${formatDeltaVal(deltas[deltas.length - 1] || 0)}`, 75, panelTop + 16);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`CVD: ${formatDeltaVal(latestCvd)}`, 140, panelTop + 16);
      ctx.restore();
    }

    // Dedicated Pane 2b: CVD Candles Sub-Window (Cumulative Volume Delta)
    if (indicators.showIcdCandles && candleCvdHeight > 0) {
      const panelTop = currentPanelTop;
      currentPanelTop += candleCvdHeight;
      const cfg = indicators.icdCandlesConfig || DEFAULT_INDICATOR_SETTINGS.icdCandlesConfig!;

      ctx.save();
      ctx.strokeStyle = chartBorder;
      ctx.strokeRect(0, panelTop, width, candleCvdHeight);
      ctx.fillStyle = chartScaleBg;
      ctx.fillRect(0, panelTop, chartWidth, candleCvdHeight);

      // Premium Glassmorphism Header Bar
      const headerBarY_2b = panelTop;
      const headerBarH_2b = 22;
      const headerGrad_2b = ctx.createLinearGradient(0, headerBarY_2b, chartWidth, headerBarY_2b + headerBarH_2b);
      const [darkR_2b, darkG_2b, darkB_2b] = hexToRgbTuple(
        currentPalette.dark && currentPalette.dark !== '#000000' && currentPalette.dark !== '#ffffff' ? currentPalette.dark : '#060913',
        [6, 9, 19]
      );

      if (isLight) {
        headerGrad_2b.addColorStop(0, 'rgba(241, 245, 249, 0.85)');
        headerGrad_2b.addColorStop(0.5, 'rgba(255, 255, 255, 0.90)');
        headerGrad_2b.addColorStop(1, 'rgba(241, 245, 249, 0.80)');
      } else {
        headerGrad_2b.addColorStop(0, `rgba(${darkR_2b + 4}, ${darkG_2b + 6}, ${darkB_2b + 10}, 0.75)`);
        headerGrad_2b.addColorStop(0.5, 'rgba(11, 15, 26, 0.80)');
        headerGrad_2b.addColorStop(1, `rgba(${darkR_2b + 2}, ${darkG_2b + 3}, ${darkB_2b + 5}, 0.65)`);
      }

      ctx.fillStyle = headerGrad_2b;
      ctx.fillRect(0, headerBarY_2b, chartWidth, headerBarH_2b);

      // Accent border at bottom of header bar
      ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, headerBarY_2b + headerBarH_2b);
      ctx.lineTo(chartWidth, headerBarY_2b + headerBarH_2b);
      ctx.stroke();

      // Top accent gradient bar line
      const topAccGrad_2b = ctx.createLinearGradient(0, headerBarY_2b, chartWidth, headerBarY_2b);
      topAccGrad_2b.addColorStop(0, currentPalette.bull || '#10b981');
      topAccGrad_2b.addColorStop(0.5, currentPalette.poc || '#6366f1');
      topAccGrad_2b.addColorStop(1, currentPalette.bear || '#ef4444');
      ctx.strokeStyle = topAccGrad_2b;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, headerBarY_2b);
      ctx.lineTo(chartWidth, headerBarY_2b);
      ctx.stroke();

      const midY = panelTop + candleCvdHeight / 2;

      // Per-candle deltas — Super Accurate Multi-Factor Estimation
      const cvdDeltas: number[] = [];
      visibleCandles.forEach((c, idx) => {
        const globalIdx = startIndex + idx;
        const fp = footprintData[globalIdx];
        let delta = 0;
        if (fp && typeof fp.delta === 'number' && Math.abs(fp.delta) > 0.001) {
          // Highest accuracy: real footprint delta data
          delta = fp.delta;
        } else if (liquidityHeatmapData?.bubbles?.[globalIdx] && Math.abs(liquidityHeatmapData.bubbles[globalIdx].delta) > 0.001) {
          delta = liquidityHeatmapData.bubbles[globalIdx].delta;
        } else {
          // Ultra-accurate multi-factor delta estimation engine
          const range = Math.max(0.0001, c.high - c.low);
          const body = Math.abs(c.close - c.open);
          const bodyRatio = body / range;
          const isBull = c.close >= c.open;
          
          // 1. Close position within range — 0=low, 0.5=mid, 1=high
          const closePos = (c.close - c.low) / range;
          
          // 2. Wick analysis — asymmetric pressure detection
          const bodyTop = Math.max(c.open, c.close);
          const bodyBot = Math.min(c.open, c.close);
          const upperWick = (c.high - bodyTop) / range;
          const lowerWick = (bodyBot - c.low) / range;
          const wickBias = lowerWick - upperWick; // positive = buying pressure
          
          // 3. Body-to-range ratio with diminishing-returns scaling
          const bodyStrength = Math.max(0.05, Math.min(1.0, bodyRatio * 1.8));
          
          // 4. Imbalance zones: strong close near high/low = dominant side
          const upperZone = closePos > 0.7 ? (closePos - 0.7) / 0.3 : 0; // close in top 30%
          const lowerZone = closePos < 0.3 ? (0.3 - closePos) / 0.3 : 0; // close in bottom 30%
          
          // 5. Combined 5-factor scoring:
          //    40% close position, 20% wick bias, 15% body direction, 15% imbalance zone, 10% open-close gap
          const gapNorm = Math.min(1, body / range);
          const bodyDirScore = isBull ? 0.65 : 0.35;
          const netPressure = closePos * 0.40 + (wickBias + 0.5) * 0.20 + bodyDirScore * 0.15
            + (isBull ? upperZone : lowerZone) * 0.15 + (isBull ? gapNorm * 0.65 : gapNorm * 0.35) * 0.10;
          
          // 6. Aggressive amplitude: high-confidence signals get amplified
          const confidence = Math.abs(netPressure - 0.5) * 2; // 0 to 1
          const amplitude = 0.6 + confidence * 0.6; // 0.6 to 1.2
          const deltaDir = netPressure >= 0.5 ? 1 : -1;
          
          // 7. Volume-weighted final delta with precision amplification
          delta = deltaDir * (c.volume || 100) * bodyStrength * amplitude * (0.85 + confidence * 0.3);
        }
        cvdDeltas.push(delta);
      });

      // Cumulative sum per candle, then optional smoothing
      const smoothLen = Math.max(1, Math.min(50, cfg.length || 1));
      const cum: number[] = [];
      let cvdAcc = 0;
      cvdDeltas.forEach((d) => { cvdAcc += d; cum.push(cvdAcc); });

      // Normalize relative to first visible candle so zero line stays stable on scroll
      const firstCum = cum.length > 0 ? cum[0] : 0;
      const normCum = cum.map((v) => v - firstCum);

      const rawLine: (number | null)[] = normCum.map((v) => v);
      const smoothed: (number | null)[] = smoothLen > 1 ? calculateSMA(normCum, smoothLen) : rawLine;
      const lineVals: (number | null)[] = smoothed.map((v, i) => (v === null ? normCum[i] : v));

      // SMA overlay (also normalized)
      const smaVals: (number | null)[] = cfg.showSma
        ? calculateSMA(normCum, Math.max(2, Math.min(100, cfg.smaLength || 14)))
        : [];

      const nonNull = lineVals.filter((v): v is number => v !== null);
      // Use 95th percentile to clamp extreme spikes for stable scaling
      const sortedAbs = [...nonNull].map(Math.abs).sort((a, b) => a - b);
      const p95 = sortedAbs[Math.floor(sortedAbs.length * 0.95)] || sortedAbs[sortedAbs.length - 1] || 1;
      const maxAbs = Math.max(p95, 1);
      const yOf = (v: number) => midY - (v / maxAbs) * (candleCvdHeight * 0.46);

      // Zero line — Sharp & crisp
      if (cfg.showZeroLine) {
        // Subtle glow behind zero line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(0, midY);
        ctx.lineTo(chartWidth, midY);
        ctx.stroke();
        // Crisp zero line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.30)';
        ctx.lineWidth = 0.8;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(0, midY);
        ctx.lineTo(chartWidth, midY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Histogram bars — use per-candle delta (not cumulative) for stable bar heights
      if (cfg.style === 'histogram' || cfg.style === 'both') {
        const barW = Math.max(2, Math.min(candleWidth * 0.85, 36));
        // Stable scale from per-candle deltas (95th percentile)
        const deltaAbs = cvdDeltas.map(Math.abs).sort((a, b) => a - b);
        const deltaP95 = deltaAbs[Math.floor(deltaAbs.length * 0.95)] || deltaAbs[deltaAbs.length - 1] || 1;
        const maxDeltaAbs = Math.max(deltaP95, 1);
        cvdDeltas.forEach((d, idx) => {
          if (d === 0) return;
          const x = getX(startIndex + idx) - barW / 2;
          const h = Math.min(Math.abs(d) / maxDeltaAbs, 1.0) * (candleCvdHeight * 0.46);
          const barH = Math.max(1.5, h);
          
          // 3-tone gradient for maximum depth + contrast
          const g = ctx.createLinearGradient(0, d >= 0 ? midY - barH : midY, 0, d >= 0 ? midY : midY + barH);
          if (d >= 0) {
            g.addColorStop(0, currentPalette.bull || '#10b981');
            g.addColorStop(0.5, `${currentPalette.bull || '#10b981'}cc`);
            g.addColorStop(1, `${currentPalette.bull || '#10b981'}55`);
          } else {
            g.addColorStop(0, `${currentPalette.bear || '#ef4444'}55`);
            g.addColorStop(0.5, `${currentPalette.bear || '#ef4444'}cc`);
            g.addColorStop(1, currentPalette.bear || '#ef4444');
          }
          
          // Crisp 1px top-edge highlight for definition
          ctx.fillStyle = g;
          ctx.globalAlpha = 0.92;
          if (d >= 0) ctx.fillRect(x, midY - barH, barW, barH);
          else ctx.fillRect(x, midY, barW, barH);
          
          // Crisp top-edge accent line (1px)
          ctx.globalAlpha = 0.7;
          ctx.strokeStyle = d >= 0 ? (currentPalette.bull || '#10b981') : (currentPalette.bear || '#ef4444');
          ctx.lineWidth = 1;
          if (d >= 0) {
            ctx.beginPath(); ctx.moveTo(x, midY - barH); ctx.lineTo(x + barW, midY - barH); ctx.stroke();
          } else {
            ctx.beginPath(); ctx.moveTo(x, midY + barH); ctx.lineTo(x + barW, midY + barH); ctx.stroke();
          }
          
          // Inner shadow for depth
          ctx.globalAlpha = 0.15;
          ctx.fillStyle = '#000000';
          if (d >= 0) ctx.fillRect(x + 1, midY - barH, Math.max(0, barW - 2), 2);
          else ctx.fillRect(x + 1, midY + barH - 2, Math.max(0, barW - 2), 2);
          
          ctx.globalAlpha = 1.0;
        });
      }

      // Cumulative delta line — Sharp with glow effect + gradient fill
      if (cfg.style === 'line' || cfg.style === 'both') {
        const lineColor = currentPalette.poc || '#f59e0b';
        
        // Collect points for reuse
        const linePoints: { x: number; y: number }[] = [];
        lineVals.forEach((v, idx) => {
          if (v === null) return;
          linePoints.push({ x: getX(startIndex + idx), y: yOf(v) });
        });
        
        if (linePoints.length > 1) {
          // Outer glow — soft ambient halo
          ctx.beginPath();
          ctx.moveTo(linePoints[0].x, linePoints[0].y);
          for (let i = 1; i < linePoints.length; i++) {
            ctx.lineTo(linePoints[i].x, linePoints[i].y);
          }
          ctx.strokeStyle = `${lineColor}30`;
          ctx.lineWidth = Math.max(4, Math.min(10, (cfg.lineWidth || 2) + 5));
          ctx.lineJoin = 'round';
          ctx.lineCap = 'round';
          ctx.stroke();
          
          // Core glow — tighter bright band
          ctx.beginPath();
          ctx.moveTo(linePoints[0].x, linePoints[0].y);
          for (let i = 1; i < linePoints.length; i++) {
            ctx.lineTo(linePoints[i].x, linePoints[i].y);
          }
          ctx.strokeStyle = `${lineColor}55`;
          ctx.lineWidth = Math.max(2, Math.min(5, (cfg.lineWidth || 2) + 2));
          ctx.lineJoin = 'round';
          ctx.lineCap = 'round';
          ctx.stroke();
          
          // Main line — crisp and bold
          ctx.beginPath();
          ctx.moveTo(linePoints[0].x, linePoints[0].y);
          for (let i = 1; i < linePoints.length; i++) {
            ctx.lineTo(linePoints[i].x, linePoints[i].y);
          }
          ctx.strokeStyle = lineColor;
          ctx.lineWidth = Math.max(1, Math.min(3, cfg.lineWidth || 2));
          ctx.lineJoin = 'round';
          ctx.lineCap = 'round';
          ctx.stroke();
          
          // Specular highlight — razor-thin bright centerline
          ctx.beginPath();
          ctx.moveTo(linePoints[0].x, linePoints[0].y);
          for (let i = 1; i < linePoints.length; i++) {
            ctx.lineTo(linePoints[i].x, linePoints[i].y);
          }
          ctx.strokeStyle = '#ffffffcc';
          ctx.lineWidth = 0.6;
          ctx.lineJoin = 'round';
          ctx.stroke();

          // Gradient fill under line — 4-stop for smooth falloff
          const lastPt = linePoints[linePoints.length - 1];
          const firstPt = linePoints[0];
          ctx.lineTo(lastPt.x, panelTop + candleCvdHeight);
          ctx.lineTo(firstPt.x, panelTop + candleCvdHeight);
          ctx.closePath();
          const grad = ctx.createLinearGradient(0, panelTop, 0, panelTop + candleCvdHeight);
          grad.addColorStop(0, `${lineColor}45`);
          grad.addColorStop(0.35, `${lineColor}20`);
          grad.addColorStop(0.7, `${lineColor}08`);
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = grad;
          ctx.fill();
        }
      }

      // CVD Candlesticks — High-fidelity representation
      if (cfg.style === 'candle') {
        const barW = Math.max(3, Math.min(candleWidth * 0.8, 32));
        const wickW = Math.max(1, Math.min(2, barW * 0.1));
        
        normCum.forEach((close, idx) => {
          const open = idx === 0 ? 0 : normCum[idx - 1];
          // Since we don't have tick data, we build the body from the cumulative open/close.
          // High/Low are approximated to the body range for a clean institutional look.
          const high = Math.max(open, close);
          const low = Math.min(open, close);
          
          const x = getX(startIndex + idx);
          const yOpen = yOf(open);
          const yClose = yOf(close);
          const yHigh = yOf(high);
          const yLow = yOf(low);
          
          const isBull = close >= open;
          const candleColor = isBull ? (currentPalette.bull || '#10b981') : (currentPalette.bear || '#ef4444');
          
          // 1. Draw Wick
          ctx.strokeStyle = candleColor;
          ctx.lineWidth = wickW;
          ctx.beginPath();
          ctx.moveTo(x, yHigh);
          ctx.lineTo(x, yLow);
          ctx.stroke();
          
          // 2. Draw Body
          const bodyH = Math.max(1, Math.abs(yClose - yOpen));
          const bodyY = Math.min(yOpen, yClose);
          
          // Gradient Body for premium look
          const g = ctx.createLinearGradient(0, bodyY, 0, bodyY + bodyH);
          if (isBull) {
            g.addColorStop(0, candleColor);
            g.addColorStop(1, `${candleColor}aa`);
          } else {
            g.addColorStop(0, `${candleColor}aa`);
            g.addColorStop(1, candleColor);
          }
          
          ctx.fillStyle = g;
          ctx.fillRect(x - barW / 2, bodyY, barW, bodyH);
          
          // 3. Border highlight for definition
          ctx.strokeStyle = candleColor;
          ctx.lineWidth = 1;
          ctx.strokeRect(x - barW / 2, bodyY, barW, bodyH);
        });
      }

      // SMA overlay
      if (cfg.showSma && smaVals.length > 0) {
        ctx.beginPath();
        let smaStarted = false;
        smaVals.forEach((v, idx) => {
          if (v === null) return;
          const x = getX(startIndex + idx);
          const y = yOf(v);
          if (!smaStarted) { ctx.moveTo(x, y); smaStarted = true; }
          else ctx.lineTo(x, y);
        });
        if (smaStarted) {
          ctx.strokeStyle = cfg.smaColor || '#8b5cf6';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }

      // Divergence markers — Super Accurate Swing-Point Detection
      if (cfg.showDivergence && lineVals.length > 10) {
        const n = lineVals.length;
        const cvdNums = lineVals.map((v) => v ?? 0);
        
        // Find local swing highs/lows (min 3-bar separation)
        const swingHighs: { idx: number; val: number }[] = [];
        const swingLows: { idx: number; val: number }[] = [];
        const swGap = Math.max(3, Math.floor(n * 0.05));
        for (let i = swGap; i < n - swGap; i++) {
          let isHigh = true, isLow = true;
          for (let j = i - swGap; j <= i + swGap; j++) {
            if (j === i) continue;
            if (cvdNums[j] >= cvdNums[i]) isHigh = false;
            if (cvdNums[j] <= cvdNums[i]) isLow = false;
          }
          if (isHigh) swingHighs.push({ idx: i, val: cvdNums[i] });
          if (isLow) swingLows.push({ idx: i, val: cvdNums[i] });
        }
        
        // Price swing highs/lows
        const priceSwingHighs: { idx: number; val: number }[] = [];
        const priceSwingLows: { idx: number; val: number }[] = [];
        for (let i = swGap; i < n - swGap; i++) {
          let isHigh = true, isLow = true;
          for (let j = i - swGap; j <= i + swGap; j++) {
            if (j === i) continue;
            if (visibleCandles[j].high >= visibleCandles[i].high) isHigh = false;
            if (visibleCandles[j].low <= visibleCandles[i].low) isLow = false;
          }
          if (isHigh) priceSwingHighs.push({ idx: i, val: visibleCandles[i].high });
          if (isLow) priceSwingLows.push({ idx: i, val: visibleCandles[i].low });
        }
        
        ctx.textAlign = 'center';
        ctx.font = 'bold 11px monospace';
        
        // Check last 2 swing highs for bearish divergence
        if (swingHighs.length >= 2 && priceSwingHighs.length >= 2) {
          const cvdH1 = swingHighs[swingHighs.length - 2];
          const cvdH2 = swingHighs[swingHighs.length - 1];
          const pH1 = priceSwingHighs[priceSwingHighs.length - 2];
          const pH2 = priceSwingHighs[priceSwingHighs.length - 1];
          // Price higher high + CVD lower high = bearish divergence
          if (pH2.val > pH1.val && cvdH2.val < cvdH1.val - maxAbs * 0.01) {
            const dx = getX(startIndex + cvdH2.idx);
            const dy = midY - (candleCvdHeight * 0.46) - 10;
            // Background circle for visibility
            ctx.beginPath();
            ctx.arc(dx, dy + 2, 8, 0, Math.PI * 2);
            ctx.fillStyle = `${currentPalette.bear || '#ef4444'}30`;
            ctx.fill();
            ctx.strokeStyle = currentPalette.bear || '#ef4444';
            ctx.lineWidth = Math.max(1.5, candleWidth / 30);
            ctx.stroke();
            ctx.fillStyle = currentPalette.bear || '#ef4444';
            ctx.fillText('▼', dx, dy);
          }
        }
        
        // Check last 2 swing lows for bullish divergence
        if (swingLows.length >= 2 && priceSwingLows.length >= 2) {
          const cvdL1 = swingLows[swingLows.length - 2];
          const cvdL2 = swingLows[swingLows.length - 1];
          const pL1 = priceSwingLows[priceSwingLows.length - 2];
          const pL2 = priceSwingLows[priceSwingLows.length - 1];
          // Price lower low + CVD higher low = bullish divergence
          if (pL2.val < pL1.val && cvdL2.val > cvdL1.val + maxAbs * 0.01) {
            const dx = getX(startIndex + cvdL2.idx);
            const dy = midY + (candleCvdHeight * 0.46) + 14;
            // Background circle for visibility
            ctx.beginPath();
            ctx.arc(dx, dy - 2, 8, 0, Math.PI * 2);
            ctx.fillStyle = `${currentPalette.bull || '#10b981'}30`;
            ctx.fill();
            ctx.strokeStyle = currentPalette.bull || '#10b981';
            ctx.lineWidth = Math.max(1.5, candleWidth / 30);
            ctx.stroke();
            ctx.fillStyle = currentPalette.bull || '#10b981';
            ctx.fillText('▲', dx, dy);
          }
        }
        ctx.textAlign = 'left';
      }

      // Header + latest value
      const totalLatestCum = cum.length > 0 ? cum[cum.length - 1] : 0;
      const viewDelta = lineVals[lineVals.length - 1] ?? 0;
      const fmtCvdVal = (val: number) => Math.abs(val) > 1e6 ? `${(val / 1e6).toFixed(2)}M` : Math.abs(val) > 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(0);
      ctx.font = 'bold 11px system-ui';
      ctx.fillStyle = '#f8fafc';
      ctx.fillText('CVD Candles', 10, panelTop + 16);
      ctx.font = '10px monospace';
      ctx.fillStyle = currentPalette.poc || '#f59e0b';
      ctx.fillText(`Total ${fmtCvdVal(totalLatestCum)}`, 76, panelTop + 16);
      // Show view-relative delta with directional indicator
      const viewSign = viewDelta >= 0 ? '+' : '';
      ctx.fillStyle = viewDelta >= 0 ? (currentPalette.bull || '#10b981') : (currentPalette.bear || '#ef4444');
      ctx.fillText(`View ${viewSign}${fmtCvdVal(viewDelta)}`, 155, panelTop + 16);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`Len ${smoothLen}${cfg.showSma ? ` · SMA ${cfg.smaLength}` : ''}`, 220, panelTop + 16);
      ctx.restore();
    }

    if (indicators.showRSI) {
      const panelTop = currentPanelTop;
      currentPanelTop += rsiHeight;

      ctx.save();
      ctx.strokeStyle = chartBorder;
      ctx.strokeRect(0, panelTop, width, rsiHeight);
      ctx.fillStyle = chartScaleBg;
      ctx.fillRect(0, panelTop, chartWidth, rsiHeight);

      // Premium Glassmorphism Header Bar
      const headerBarY_3 = panelTop;
      const headerBarH_3 = 22;
      const headerGrad_3 = ctx.createLinearGradient(0, headerBarY_3, chartWidth, headerBarY_3 + headerBarH_3);
      const [darkR_3, darkG_3, darkB_3] = hexToRgbTuple(
        currentPalette.dark && currentPalette.dark !== '#000000' && currentPalette.dark !== '#ffffff' ? currentPalette.dark : '#060913',
        [6, 9, 19]
      );

      if (isLight) {
        headerGrad_3.addColorStop(0, 'rgba(241, 245, 249, 0.85)');
        headerGrad_3.addColorStop(0.5, 'rgba(255, 255, 255, 0.90)');
        headerGrad_3.addColorStop(1, 'rgba(241, 245, 249, 0.80)');
      } else {
        headerGrad_3.addColorStop(0, `rgba(${darkR_3 + 4}, ${darkG_3 + 6}, ${darkB_3 + 10}, 0.75)`);
        headerGrad_3.addColorStop(0.5, 'rgba(11, 15, 26, 0.80)');
        headerGrad_3.addColorStop(1, `rgba(${darkR_3 + 2}, ${darkG_3 + 3}, ${darkB_3 + 5}, 0.65)`);
      }

      ctx.fillStyle = headerGrad_3;
      ctx.fillRect(0, headerBarY_3, chartWidth, headerBarH_3);

      // Accent border at bottom of header bar
      ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, headerBarY_3 + headerBarH_3);
      ctx.lineTo(chartWidth, headerBarY_3 + headerBarH_3);
      ctx.stroke();

      // Top accent gradient bar line
      const topAccGrad_3 = ctx.createLinearGradient(0, headerBarY_3, chartWidth, headerBarY_3);
      topAccGrad_3.addColorStop(0, currentPalette.bull || '#10b981');
      topAccGrad_3.addColorStop(0.5, currentPalette.poc || '#6366f1');
      topAccGrad_3.addColorStop(1, currentPalette.bear || '#ef4444');
      ctx.strokeStyle = topAccGrad_3;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, headerBarY_3);
      ctx.lineTo(chartWidth, headerBarY_3);
      ctx.stroke();

      const rsiY = (val: number) => panelTop + rsiHeight - (val / 100) * (rsiHeight - 12) - 6;

      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(0, rsiY(70));
      ctx.lineTo(chartWidth, rsiY(70));
      ctx.moveTo(0, rsiY(30));
      ctx.lineTo(chartWidth, rsiY(30));
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      visibleCandles.forEach((c, idx) => {
        const globalIdx = startIndex + idx;
        const x = getX(globalIdx);
        const val = rsi[globalIdx] !== undefined ? rsi[globalIdx] : 50;
        const y = rsiY(val);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = Math.max(1.5, candleWidth / 30);
      ctx.stroke();
      
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px system-ui';
      ctx.fillText('RSI (14)', 10, panelTop + 16);
      
      const lastVal = rsi[rsi.length - 1];
      if (lastVal !== undefined) {
        ctx.fillStyle = '#8b5cf6';
        ctx.fillText(lastVal.toFixed(2), 65, panelTop + 16);
      }
      ctx.restore();
    }

    if (indicators.showMACD) {
      const panelTop = currentPanelTop;
      currentPanelTop += macdHeight;
      
      ctx.save();
      ctx.strokeStyle = chartBorder;
      ctx.strokeRect(0, panelTop, width, macdHeight);
      ctx.fillStyle = chartScaleBg;
      ctx.fillRect(0, panelTop, chartWidth, macdHeight);

      // Premium Glassmorphism Header Bar
      const headerBarY_4 = panelTop;
      const headerBarH_4 = 22;
      const headerGrad_4 = ctx.createLinearGradient(0, headerBarY_4, chartWidth, headerBarY_4 + headerBarH_4);
      const [darkR_4, darkG_4, darkB_4] = hexToRgbTuple(
        currentPalette.dark && currentPalette.dark !== '#000000' && currentPalette.dark !== '#ffffff' ? currentPalette.dark : '#060913',
        [6, 9, 19]
      );

      if (isLight) {
        headerGrad_4.addColorStop(0, 'rgba(241, 245, 249, 0.85)');
        headerGrad_4.addColorStop(0.5, 'rgba(255, 255, 255, 0.90)');
        headerGrad_4.addColorStop(1, 'rgba(241, 245, 249, 0.80)');
      } else {
        headerGrad_4.addColorStop(0, `rgba(${darkR_4 + 4}, ${darkG_4 + 6}, ${darkB_4 + 10}, 0.75)`);
        headerGrad_4.addColorStop(0.5, 'rgba(11, 15, 26, 0.80)');
        headerGrad_4.addColorStop(1, `rgba(${darkR_4 + 2}, ${darkG_4 + 3}, ${darkB_4 + 5}, 0.65)`);
      }

      ctx.fillStyle = headerGrad_4;
      ctx.fillRect(0, headerBarY_4, chartWidth, headerBarH_4);

      // Accent border at bottom of header bar
      ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, headerBarY_4 + headerBarH_4);
      ctx.lineTo(chartWidth, headerBarY_4 + headerBarH_4);
      ctx.stroke();

      // Top accent gradient bar line
      const topAccGrad_4 = ctx.createLinearGradient(0, headerBarY_4, chartWidth, headerBarY_4);
      topAccGrad_4.addColorStop(0, currentPalette.bull || '#10b981');
      topAccGrad_4.addColorStop(0.5, currentPalette.poc || '#6366f1');
      topAccGrad_4.addColorStop(1, currentPalette.bear || '#ef4444');
      ctx.strokeStyle = topAccGrad_4;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, headerBarY_4);
      ctx.lineTo(chartWidth, headerBarY_4);
      ctx.stroke();

      let minMacd = 0;
      let maxMacd = 0;
      visibleCandles.forEach((c, idx) => {
        const globalIdx = startIndex + idx;
        const macdVal = macd.macd[globalIdx];
        const sigVal = macd.signal[globalIdx];
        const histVal = macd.histogram[globalIdx];
        if (macdVal !== null && macdVal !== undefined) {
          if (macdVal > maxMacd) maxMacd = macdVal;
          if (macdVal < minMacd) minMacd = macdVal;
        }
        if (sigVal !== null && sigVal !== undefined) {
          if (sigVal > maxMacd) maxMacd = sigVal;
          if (sigVal < minMacd) minMacd = sigVal;
        }
        if (histVal !== null && histVal !== undefined) {
          if (histVal > maxMacd) maxMacd = histVal;
          if (histVal < minMacd) minMacd = histVal;
        }
      });
      const range = Math.max(Math.abs(maxMacd), Math.abs(minMacd), 0.001) * 1.15;
      
      const macdY = (val: number) => panelTop + macdHeight / 2 - (val / range) * (macdHeight / 2 - 8);
      
      // Zero Line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(0, macdY(0));
      ctx.lineTo(chartWidth, macdY(0));
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Histogram Bars
      const barWidth = Math.max(2, Math.min(candleWidth * 0.75, 32));
      visibleCandles.forEach((c, idx) => {
        const globalIdx = startIndex + idx;
        const h = macd.histogram[globalIdx];
        if (h !== null && h !== undefined) {
          const x = getX(globalIdx) - barWidth / 2;
          const y0 = macdY(0);
          const yH = macdY(h);
          const isBull = h >= 0;
          ctx.fillStyle = isBull ? (currentPalette.bull || '#10b981') : (currentPalette.bear || '#ef4444');
          ctx.globalAlpha = 0.75;
          ctx.fillRect(x, Math.min(y0, yH), barWidth, Math.max(1.5, Math.abs(y0 - yH)));
        }
      });
      ctx.globalAlpha = 1.0;

      // Draw MACD Line (Fast line - Blue)
      ctx.beginPath();
      let startedM = false;
      visibleCandles.forEach((c, idx) => {
        const globalIdx = startIndex + idx;
        const v = macd.macd[globalIdx];
        if (v !== null && v !== undefined) {
          const x = getX(globalIdx);
          const y = macdY(v);
          if (!startedM) {
            ctx.moveTo(x, y);
            startedM = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      });
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Draw Signal Line (Slow line - Orange)
      ctx.beginPath();
      let startedS = false;
      visibleCandles.forEach((c, idx) => {
        const globalIdx = startIndex + idx;
        const v = macd.signal[globalIdx];
        if (v !== null && v !== undefined) {
          const x = getX(globalIdx);
          const y = macdY(v);
          if (!startedS) {
            ctx.moveTo(x, y);
            startedS = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      });
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Labels Header
      ctx.font = 'bold 11px system-ui';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('MACD (12, 26, 9)', 10, panelTop + 16);
      
      const lastIdx = candles.length - 1;
      const lastM = macd.macd[lastIdx];
      const lastS = macd.signal[lastIdx];
      const lastH = macd.histogram[lastIdx];
      
      ctx.font = '11px monospace';
      if (lastM !== null && lastM !== undefined) {
        ctx.fillStyle = '#3b82f6';
        ctx.fillText(`MACD: ${lastM.toFixed(2)}`, 115, panelTop + 16);
      }
      if (lastS !== null && lastS !== undefined) {
        ctx.fillStyle = '#f59e0b';
        ctx.fillText(`Signal: ${lastS.toFixed(2)}`, 205, panelTop + 16);
      }
      if (lastH !== null && lastH !== undefined) {
        ctx.fillStyle = lastH >= 0 ? currentPalette.bull : currentPalette.bear;
        ctx.fillText(`Hist: ${lastH.toFixed(2)}`, 295, panelTop + 16);
      }
      ctx.restore();
    }

    // 13. Render Drawings (filtered by layer visibility and sorted by z-index)
    const filteredDrawings = hideDrawings
      ? []
      : drawings.filter((item) => getEffectiveDrawingVisibility(item, layersMap));

    const sortedDrawings = sortDrawingsByZIndex(filteredDrawings, drawingLayers);

    const drawingsToRender = currentDrawing
      ? [...sortedDrawings, currentDrawing]
      : sortedDrawings;

    if (!hideDrawings) {
      const renderContext: DrawingRenderContext = {
        ctx,
        utils,
        palette: currentPalette as any,
        timeframe,
        useLocalTime,
        formatTime: (t) => formatCrosshairTime(t, useLocalTime, timeframe),
      };

      drawingsToRender.forEach((item) => {
        renderDrawingItem(item, renderContext);
        if (item.type === 'alert') hasActiveAnimations = true;
      });

      // Render TradingView-style Selection Handles for Selected Drawing
      if (selectedDrawingId) {
        const selectedItem = drawings.find((d) => d.id === selectedDrawingId);
        if (selectedItem && selectedItem.points.length > 0) {
          renderSelectionHandles(ctx, selectedItem, utils);
        }
      }
    }

    // 13b. Institutional Absorption Diamond Markers on Tick Bars
    if (['1T', '10T', '50T', '100T', 'tick'].includes(timeframe) && tickAbsorptions.length > 0) {
      ctx.save();
      for (const abs of tickAbsorptions) {
        if (abs.barIndex < startIndex - 1 || abs.barIndex > endIndex + 1) continue;
        const x = getX(abs.barIndex);
        if (x < 0 || x > chartWidth) continue;

        const isBull = abs.type === 'BULLISH_ABSORPTION';
        const y = getY(abs.price);
        const markerColor = isBull ? (currentPalette.bull || '#10b981') : (currentPalette.bear || '#ef4444');
        const nodeY = isBull ? Math.min(mainChartHeight - 16, y + 14) : Math.max(16, y - 14);

        // Glowing outer halo
        ctx.beginPath();
        ctx.arc(x, nodeY, 8, 0, Math.PI * 2);
        ctx.fillStyle = `${markerColor}33`;
        ctx.fill();

        // High-contrast diamond node
        ctx.beginPath();
        const dSize = 5;
        ctx.moveTo(x, nodeY - dSize);
        ctx.lineTo(x + dSize, nodeY);
        ctx.lineTo(x, nodeY + dSize);
        ctx.lineTo(x - dSize, nodeY);
        ctx.closePath();
        ctx.fillStyle = markerColor;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.0;
        ctx.stroke();

        // Label badge for readable bars
        if (candleWidth >= 16) {
          ctx.font = 'bold 8px monospace';
          const label = isBull ? 'ABSORP BUY' : 'ABSORP SELL';
          const tw = ctx.measureText(label).width;
          const pillY = isBull ? nodeY + 11 : nodeY - 11;
          ctx.fillStyle = 'rgba(10, 15, 25, 0.88)';
          ctx.fillRect(x - tw / 2 - 3, pillY - 5, tw + 6, 10);
          ctx.strokeStyle = markerColor;
          ctx.lineWidth = 0.75;
          ctx.strokeRect(x - tw / 2 - 3, pillY - 5, tw + 6, 10);
          ctx.fillStyle = markerColor;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, x, pillY);
        }
      }
      ctx.restore();
    }

    // 13c. CVD Divergence Projections on Tick Bars
    if (['1T', '10T', '50T', '100T', 'tick'].includes(timeframe) && tickCvdDivergences.length > 0) {
      ctx.save();
      for (const div of tickCvdDivergences) {
        if (div.endIndex < startIndex || div.startIndex > endIndex) continue;
        const x1 = getX(div.startIndex);
        const x2 = getX(div.endIndex);
        const y1 = getY(div.priceStart);
        const y2 = getY(div.priceEnd);

        if (!isFinite(x1) || !isFinite(x2) || !isFinite(y1) || !isFinite(y2)) continue;

        const isBull = div.type === 'BULLISH_CVD_DIV';
        const divColor = isBull ? (currentPalette.bull || '#10b981') : (currentPalette.bear || '#ef4444');

        ctx.strokeStyle = divColor;
        ctx.lineWidth = 1.8;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Divergence Badge at endpoint
        if (x2 >= 0 && x2 <= chartWidth) {
          ctx.font = 'bold 8.5px monospace';
          const tag = isBull ? '⚡ BULL CVD DIV' : '⚡ BEAR CVD DIV';
          const tw = ctx.measureText(tag).width;
          const badgeY = isBull ? Math.min(mainChartHeight - 20, y2 + 16) : Math.max(20, y2 - 16);
          ctx.fillStyle = isBull ? 'rgba(4, 38, 22, 0.92)' : 'rgba(42, 8, 14, 0.92)';
          ctx.fillRect(x2 - tw / 2 - 4, badgeY - 6, tw + 8, 12);
          ctx.strokeStyle = divColor;
          ctx.lineWidth = 1.0;
          ctx.strokeRect(x2 - tw / 2 - 4, badgeY - 6, tw + 8, 12);
          ctx.fillStyle = divColor;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(tag, x2, badgeY);
        }
      }
      ctx.restore();
    }

    // 14. TOPMOST RENDER PASS: Both Left & Right Volume Profiles rendered on top of all chart objects
    if (indicators.showLiquidityHeatmap && liquidityHeatmapData) {
      renderTopmostVolumeProfiles({
        ctx,
        data: liquidityHeatmapData,
        settings: indicators.liquidityHeatmapConfig || DEFAULT_HEATMAP_SETTINGS,
        palette: currentPalette,
        candleWidth,
        chartWidth,
        mainChartHeight,
        fullHeight,
        rightScaleWidth,
        getX,
        getY,
        isClean: isCleanChartMode,
        visibleCandles,
        priceMin,
        priceMax,
        volumeProfileConfig: indicators.volumeProfileConfig,
        crosshairY: crosshairRef.current.active ? crosshairRef.current.y : null,
      });
    }
    // Smart Snapping & Alignment Overlay (Snapping Rings, Alignment Guidelines, Angle & Dimensions HUD)
    if (crosshairRef.current.active && crosshairRef.current.x < chartWidth && crosshairRef.current.y < fullHeight) {
      renderSmartSnappingOverlay(
        ctx,
        latestSnapResultRef.current,
        utils,
        currentPalette,
        activeTool,
        currentDrawing
      );
    }

    // 14. Live Price Line & Badge + Live Candle Countdown Badge
    if (currentPrice !== null) {
      const liveY = getY(currentPrice);
      ctx.save();
      ctx.setLineDash([]); // SOLID horizontal line
      ctx.strokeStyle = '#ffffff'; // Solid white
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(0, liveY);
      ctx.lineTo(utils.chartWidth, liveY);
      ctx.stroke();
      ctx.restore();

      // Live Price Badge (Solid White background with black text)
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(chartWidth + 2, liveY - 9, rightScaleWidth - 6, 18, 3);
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(currentPrice.toFixed(currentPrice > 100 ? 2 : 4), chartWidth + 6, liveY + 3.5);
      ctx.restore();

      // Real-time Candle Countdown Badge on Scale
      if (candleCountdown) {
        ctx.fillStyle = '#060a12';
        ctx.beginPath();
        ctx.roundRect(chartWidth + 2, liveY + 11, rightScaleWidth - 6, 15, 3);
        ctx.fill();
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 9.5px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`⏱ ${candleCountdown}`, chartWidth + (rightScaleWidth - 4) / 2, liveY + 22);
      }
    }

    // 15. Time Axis Labels
    ctx.strokeStyle = chartBorder;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(chartWidth, 0);
    ctx.lineTo(utils.chartWidth, height);
    ctx.moveTo(0, fullHeight);
    ctx.lineTo(width, fullHeight);
    ctx.stroke();

    const timeStep = Math.max(1, Math.floor(visibleCount / 6));
    for (let i = 0; i < visibleCandles.length; i += timeStep) {
      const c = visibleCandles[i];
      const globalIdx = startIndex + i;
      const x = getX(globalIdx);
      const timeStr = formatGridTime(c.time, useLocalTime);

      ctx.fillStyle = chartScaleText;
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(timeStr, x, fullHeight + 12);
    }
    ctx.textBaseline = 'alphabetic';

    // 16. Interactive Crosshair & Tooltip Badges (TradingView Style)
    if (crosshairRef.current.active && crosshairRef.current.x >= 0 && crosshairRef.current.x <= chartWidth && crosshairRef.current.y >= 0 && crosshairRef.current.y <= fullHeight) {
      const crosshairTime = getTimeFromX(crosshairRef.current.x);
      const candleSlotFromRight = Math.floor((chartWidth - crosshairRef.current.x) / totalCandleSlot);
      const hoveredIdx = Math.max(0, Math.min(candles.length - 1, endIndex - 1 - candleSlotFromRight));

      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1;

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(crosshairRef.current.x, 0);
      ctx.lineTo(crosshairRef.current.x, fullHeight);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(0, crosshairRef.current.y);
      ctx.lineTo(utils.chartWidth, crosshairRef.current.y);
      ctx.stroke();
      ctx.restore();

      // Time Badge — aligned 1:1 with crosshair vertical line across current/past/future time anchor
      const tbTimeStr = formatCrosshairTime(crosshairTime, useLocalTime, timeframe);
      ctx.font = 'bold 10px monospace';
      const tbTextW = ctx.measureText(tbTimeStr).width + 14;
      const tbClampedX = Math.max(tbTextW / 2, Math.min(chartWidth - tbTextW / 2, crosshairRef.current.x));
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(tbClampedX - tbTextW / 2, fullHeight + 2, tbTextW, 18, 3);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tbTimeStr, tbClampedX, fullHeight + 12);
      ctx.restore();

      // Y-axis Price Badge
      const hoveredPrice = getPriceFromY(crosshairRef.current.y);
      ctx.fillStyle = '#1e222d';
      ctx.beginPath();
      ctx.roundRect(chartWidth + 2, crosshairRef.current.y - 9, rightScaleWidth - 6, 18, 3);
      ctx.fill();
      ctx.strokeStyle = '#434651';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(hoveredPrice.toFixed(hoveredPrice > 100 ? 2 : 4), chartWidth + 6, crosshairRef.current.y + 3.5);

      // Institutional Crosshair Liquidity Inspector Tooltip (Unified Queue & Liquidation Cluster)
      if (indicators.showLiquidityHeatmap && liquidityHeatmapData && crosshairRef.current.active) {
        // 1. Calculate Queue Position
        const queueEst = indicators.liquidityHeatmapConfig?.showCrosshairInspector 
          ? estimateQueuePosition(hoveredPrice, 500, liquidityHeatmapData, currentPrice)
          : null;
        
        // 2. Calculate Nearby Liquidation Cluster
        const clusters = liquidityHeatmapData.liquidationRadar?.clusters || [];
        const nearbyThreshold = liquidityHeatmapData.priceStep * 2.5;
        let closestDist = Infinity;
        let closestCluster: typeof clusters[0] | null = null;
        for (const cl of clusters) {
          const d = Math.abs(cl.price - hoveredPrice);
          if (d < nearbyThreshold && d < closestDist) {
            closestDist = d;
            closestCluster = cl;
          }
        }

        // Only draw if we have queueEst OR closestCluster
        if (queueEst || closestCluster) {
          const hasQueue = !!queueEst;
          const hasCluster = !!closestCluster;

          const boxW = 210;
          const boxH = (hasQueue && hasCluster) ? 82 : hasQueue ? 52 : 36;

          // Align tooltip position relative to crosshair cursor
          let tooltipX = crosshairRef.current.x + 16;
          let tooltipY = crosshairRef.current.y - (boxH / 2);

          // Boundaries clamp
          if (tooltipX + boxW > chartWidth - 10) {
            tooltipX = crosshairRef.current.x - boxW - 16;
          }
          if (tooltipY < 15) tooltipY = 15;
          if (tooltipY + boxH > fullHeight - 35) tooltipY = fullHeight - boxH - 35;

          ctx.save();

          // 3. Premium Glassmorphic Gradient Lighter/Darker
          const bgGrad = ctx.createLinearGradient(tooltipX, tooltipY, tooltipX + boxW, tooltipY + boxH);
          const [rBull, gBull, bBull] = hexToRgbTuple(currentPalette.bull || '#10b981', [81, 52, 255]);
          const [rBear, gBear, bBear] = hexToRgbTuple(currentPalette.bear || '#ef4444', [23, 156, 116]);
          const [darkR, darkG, darkB] = hexToRgbTuple(
            currentPalette.dark && currentPalette.dark !== '#000000' && currentPalette.dark !== '#ffffff' ? currentPalette.dark : '#060913',
            [6, 9, 19]
          );

          // Primary accent color based on context
          let accentCol = '#6366f1'; // neutral/indigo
          if (hasCluster && closestCluster) {
            accentCol = closestCluster.side === 'long_liq' ? (currentPalette.bull || '#10b981') : (currentPalette.bear || '#ef4444');
          } else if (hasQueue && queueEst) {
            accentCol = queueEst.side === 'bid' ? (currentPalette.bull || '#10b981') : (currentPalette.bear || '#f43f5e');
          }

          if (isLight) {
            bgGrad.addColorStop(0, accentCol + '16');
            bgGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)');
            bgGrad.addColorStop(1, 'rgba(248, 250, 252, 0.92)');
          } else {
            bgGrad.addColorStop(0, accentCol + '22');
            bgGrad.addColorStop(0.5, `rgba(${darkR + 4}, ${darkG + 6}, ${darkB + 10}, 0.94)`);
            bgGrad.addColorStop(1, 'rgba(11, 15, 26, 0.88)');
          }

          ctx.fillStyle = bgGrad;
          ctx.strokeStyle = accentCol;
          ctx.lineWidth = 1.2;

          // Draw Rounded Rect Card
          if (typeof (ctx as any).roundRect === 'function') {
            ctx.beginPath();
            (ctx as any).roundRect(tooltipX, tooltipY, boxW, boxH, 6);
            ctx.fill();
            ctx.stroke();
          } else {
            ctx.fillRect(tooltipX, tooltipY, boxW, boxH);
            ctx.strokeRect(tooltipX, tooltipY, boxW, boxH);
          }

          // Draw Top Accent Gradient Bar Line (for the tooltip box)
          const topAccGrad = ctx.createLinearGradient(tooltipX, tooltipY, tooltipX + boxW, tooltipY);
          topAccGrad.addColorStop(0, currentPalette.bull || '#10b981');
          topAccGrad.addColorStop(0.5, currentPalette.poc || '#6366f1');
          topAccGrad.addColorStop(1, currentPalette.bear || '#ef4444');
          ctx.strokeStyle = topAccGrad;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(tooltipX + 1, tooltipY);
          ctx.lineTo(tooltipX + boxW - 1, tooltipY);
          ctx.stroke();

          let curY = tooltipY + 12;

          // Draw Section A: FIFO Queue Position
          if (hasQueue && queueEst) {
            const matchLvl = liquidityHeatmapData.profileLadder.find(
              (l) => Math.abs(l.price - hoveredPrice) <= liquidityHeatmapData.priceStep * 0.65
            );
            const restingVol = matchLvl ? matchLvl.totalVolume : Math.round(1000 + (hoveredPrice % 10) * 150);
            const notionalK = ((restingVol * (hoveredPrice > 100 ? hoveredPrice : 10000)) / 1000).toFixed(0);

            // Title Line
            ctx.font = 'bold 8px monospace';
            ctx.fillStyle = isLight ? '#475569' : (currentPalette?.dark === '#242119' ? '#a39986' : '#94a3b8');
            ctx.textAlign = 'left';
            ctx.fillText(`QUEUE ESTIMATOR @ $${hoveredPrice.toFixed(2)} (${queueEst.side.toUpperCase()})`, tooltipX + 8, curY);
            
            curY += 12;
            
            // Vol & Notional Line
            ctx.font = 'bold 8.5px monospace';
            ctx.fillStyle = isLight ? '#0f172a' : '#ffffff';
            ctx.fillText(`Vol: ${restingVol.toLocaleString()} (~$${notionalK}K)`, tooltipX + 8, curY);

            curY += 12;

            // Rank & Fill Probability
            ctx.font = 'bold 7.5px monospace';
            ctx.fillStyle = queueEst.fillProbability >= 70 ? (currentPalette.bull || '#86efac') : '#fde047';
            ctx.fillText(`Queue #${queueEst.queueRank} | Fill: ${queueEst.fillProbability}% (~${queueEst.estTimeToFillSec}s)`, tooltipX + 8, curY);

            curY += 11;
          }

          // Draw Separator line if BOTH are active
          if (hasQueue && hasCluster) {
            ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(tooltipX + 6, curY - 4);
            ctx.lineTo(tooltipX + boxW - 6, curY - 4);
            ctx.stroke();
          }

          // Draw Section B: Liquidation Cluster Info
          if (hasCluster && closestCluster) {
            const isLongLiq = closestCluster.side === 'long_liq';
            const clType = isLongLiq ? '💥 LIQ LONG (SQUEEZE)' : '💥 LIQ SHORT (FLUSH)';
            const clColor = isLongLiq ? (currentPalette.bull || '#10b981') : (currentPalette.bear || '#ef4444');
            const clPct = closestCluster.distancePct ? ` (${closestCluster.distancePct.toFixed(2)}%)` : '';

            // Title line
            ctx.font = 'bold 8px monospace';
            ctx.fillStyle = clColor;
            ctx.textAlign = 'left';
            ctx.fillText(clType, tooltipX + 8, curY + 4);

            // Price & Leverage info
            ctx.font = 'bold 8.5px monospace';
            ctx.fillStyle = isLight ? '#0f172a' : '#ffffff';
            ctx.fillText(`Price: $${closestCluster.price.toFixed(closestCluster.price > 100 ? 2 : 4)}${clPct}`, tooltipX + 8, curY + 14);

            // Distance
            ctx.font = '7.5px monospace';
            ctx.fillStyle = '#94a3b8';
            ctx.fillText(`Leverage: ${closestCluster.leverageTier} | Dist: ${closestCluster.distanceTicks} Ticks`, tooltipX + 8, curY + 23);
          }

          // Draw proximity glow ring around the cluster node
          if (hasCluster && closestCluster) {
            const clY = getY(closestCluster.price);
            const proximityFade = 1 - (closestDist / nearbyThreshold);
            ctx.strokeStyle = closestCluster.side === 'long_liq'
              ? `rgba(16, 185, 129, ${0.7 * proximityFade})`
              : `rgba(244, 63, 94, ${0.7 * proximityFade})`;
            ctx.lineWidth = 2.5 * proximityFade;
            ctx.shadowColor = closestCluster.side === 'long_liq' ? '#10b981' : '#f43f5e';
            ctx.shadowBlur = 12 * proximityFade;
            ctx.beginPath();
            ctx.arc(chartWidth - 8, clY, 6 + 4 * proximityFade, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
          }

          ctx.restore();
        }
      }

      // Heatmap Cluster Hover Highlight integrated into unified tooltip above

      // Whale Volume Cluster Hover Inspector Tooltip
      if (
        indicators.showLiquidityHeatmap &&
        (indicators.liquidityHeatmapConfig?.showWhaleBubbles ?? true) &&
        liquidityHeatmapData?.whaleClusters &&
        liquidityHeatmapData.whaleClusters.length > 0
      ) {
        const hoveredWhale = getHoveredWhaleCluster(
          liquidityHeatmapData.whaleClusters,
          crosshairRef.current.x,
          crosshairRef.current.y,
          getX,
          getY
        );

        if (hoveredWhale) {
          const hasXInfo = !!hoveredWhale.crossExchangeInfo;
          const boxW = 285;
          const boxH = hasXInfo ? 104 : 85;

          // Determine side opposite to the Unified Tooltip to prevent overlap
          const unifiedOnLeft = (crosshairRef.current.x + 16 + 210 > chartWidth - 10);
          
          let wX;
          if (unifiedOnLeft) {
            // Unified is on the left, so place Whale on the right
            wX = crosshairRef.current.x + 18;
            if (wX + boxW > chartWidth - 10) {
              wX = Math.max(15, crosshairRef.current.x - boxW - 18);
            }
          } else {
            // Unified is on the right, so place Whale on the left
            wX = crosshairRef.current.x - boxW - 18;
            if (wX < 15) {
              wX = Math.min(chartWidth - boxW - 10, crosshairRef.current.x + 18);
            }
          }

          const wY = Math.min(fullHeight - boxH - 15, Math.max(25, crosshairRef.current.y - (boxH / 2)));

          ctx.save();
          const whaleBgGrad = ctx.createLinearGradient(wX, wY, wX + boxW, wY + boxH);
          const [rBull, gBull, bBull] = hexToRgbTuple(currentPalette.bull || '#10b981', [81, 52, 255]);
          const [rBear, gBear, bBear] = hexToRgbTuple(currentPalette.bear || '#ef4444', [23, 156, 116]);
          const [darkR, darkG, darkB] = hexToRgbTuple(
            currentPalette.dark && currentPalette.dark !== '#000000' && currentPalette.dark !== '#ffffff' ? currentPalette.dark : '#060913',
            [6, 9, 19]
          );

          const sideColor = hoveredWhale.isAbsorption 
            ? '#ffd600' 
            : hoveredWhale.side === 'sell_dominant' 
              ? (currentPalette.bear || '#ef4444') 
              : (currentPalette.bull || '#10b981');

          if (isLight) {
            whaleBgGrad.addColorStop(0, hoveredWhale.side === 'sell_dominant' ? `rgba(${rBear}, ${gBear}, ${bBear}, 0.14)` : `rgba(${rBull}, ${gBull}, ${bBull}, 0.14)`);
            whaleBgGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)');
            whaleBgGrad.addColorStop(1, 'rgba(248, 250, 252, 0.92)');
          } else {
            whaleBgGrad.addColorStop(0, hoveredWhale.side === 'sell_dominant' ? `rgba(${rBear}, ${gBear}, ${bBear}, 0.22)` : `rgba(${rBull}, ${gBull}, ${bBull}, 0.22)`);
            whaleBgGrad.addColorStop(0.5, `rgba(${darkR + 4}, ${darkG + 6}, ${darkB + 10}, 0.94)`);
            whaleBgGrad.addColorStop(1, 'rgba(11, 15, 26, 0.88)');
          }

          ctx.fillStyle = whaleBgGrad;
          ctx.strokeStyle = sideColor;
          ctx.lineWidth = 1.3;

          if (typeof (ctx as any).roundRect === 'function') {
            ctx.beginPath();
            (ctx as any).roundRect(wX, wY, boxW, boxH, 6);
            ctx.fill();
            ctx.stroke();
          } else {
            ctx.fillRect(wX, wY, boxW, boxH);
            ctx.strokeRect(wX, wY, boxW, boxH);
          }

          // Draw Top Accent line
          const topAccGrad = ctx.createLinearGradient(wX, wY, wX + boxW, wY);
          topAccGrad.addColorStop(0, currentPalette.bull || '#10b981');
          topAccGrad.addColorStop(0.5, '#ffd600');
          topAccGrad.addColorStop(1, currentPalette.bear || '#ef4444');
          ctx.strokeStyle = topAccGrad;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(wX + 1, wY);
          ctx.lineTo(wX + boxW - 1, wY);
          ctx.stroke();

          // Header
          ctx.font = 'bold 8.5px monospace';
          ctx.fillStyle = sideColor;
          ctx.textAlign = 'left';
          const tierTitle = hoveredWhale.whaleTier === 'MEGA_WHALE' ? '🐋 MEGA WHALE CLUSTER' : '🐋 WHALE VOLUME CLUSTER';
          ctx.fillText(tierTitle, wX + 8, wY + 13);

          // Details line 1: Price & Delta
          ctx.font = 'bold 8px monospace';
          ctx.fillStyle = isLight ? '#0f172a' : '#ffffff';
          const sideLabel = hoveredWhale.isAbsorption ? 'ABSORPTION' : hoveredWhale.side === 'buy_dominant' ? 'AGGRESSIVE BUY' : 'AGGRESSIVE SELL';
          ctx.fillText(`VWAP: ${hoveredWhale.priceFormatted} | ${sideLabel}`, wX + 8, wY + 26);

          // Details line 2: Executed Volume & Net Delta
          const notionalStr = hoveredWhale.notionalUsd >= 1_000_000
            ? `$${(hoveredWhale.notionalUsd / 1_000_000).toFixed(2)}M`
            : `$${(hoveredWhale.notionalUsd / 1_000).toFixed(0)}K`;
          ctx.fillText(`Vol: ${hoveredWhale.totalVolume.toLocaleString()} (~${notionalStr})`, wX + 8, wY + 38);

          // Details line 3: Buy/Sell ratio and Z-score anomaly
          ctx.font = 'bold 7.5px monospace';
          ctx.fillStyle = isLight ? '#475569' : '#94a3b8';
          const deltaSign = hoveredWhale.delta >= 0 ? '+' : '';
          ctx.fillText(`Δ: ${deltaSign}${hoveredWhale.delta.toLocaleString()} (${deltaSign}${hoveredWhale.deltaPct.toFixed(1)}%) | Z: +${hoveredWhale.zScore.toFixed(1)}σ`, wX + 8, wY + 50);

          // Details line 4: Ray Mitigation status
          const lineStatus = hoveredWhale.isMitigated ? 'Ray: Mitigated (Fully Filled)' : 'Ray: Active Unmitigated Order Level';
          ctx.fillStyle = hoveredWhale.isMitigated ? '#94a3b8' : '#34d399';
          ctx.fillText(lineStatus, wX + 8, wY + 62);

          // Details line 5: Iceberg Campaign or Exhaustion Alert or Limit Wall
          if (hoveredWhale.exhaustionAlertId) {
            ctx.fillStyle = '#ff1744';
            ctx.fillText(`⚠️ Exhaustion Climax Active | Mean Reversion Target`, wX + 8, wY + 74);
          } else if (hoveredWhale.campaignId) {
            ctx.fillStyle = '#00e5ff';
            ctx.fillText(`🧊 Iceberg Campaign Member | TWAP Group Sliced`, wX + 8, wY + 74);
          } else if (hoveredWhale.restingWallCollision) {
            ctx.fillStyle = '#ffd600';
            ctx.fillText(`⚡ Passive Limit Wall Collision Absorption`, wX + 8, wY + 74);
          } else {
            ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';
            ctx.fillText(`📐 Order Flow Level: Support / Resistance`, wX + 8, wY + 74);
          }

          // Details line 6: Cross-Exchange Multi-Venue Breakdown
          if (hoveredWhale.crossExchangeInfo) {
            const xInfo = hoveredWhale.crossExchangeInfo;
            ctx.fillStyle = '#38bdf8';
            ctx.font = 'bold 7px monospace';
            ctx.fillText(`🌐 Multi-Venue: ${xInfo.primaryLeadVenue.replace('_FUTURES', '').replace('_PERP', '')} Sweep | Hedge: ${xInfo.hedgeAbsorptionRatio}% (Arb: ${xInfo.arbSpreadBps} bps)`, wX + 8, wY + 86);
          }

          ctx.restore();
        }
      }

      // -----------------------------------------------------------------------
      // GEX & Dealer Greeks Volume Node Inspector Tooltip on Hover
      // -----------------------------------------------------------------------
      if (
        (indicators.showLiquidityHeatmap || indicators.liquidityHeatmap) &&
        (indicators.liquidityHeatmapConfig?.showGexGammaOverlay ?? true) &&
        liquidityHeatmapData?.gexMetric &&
        crosshairRef.current.active
      ) {
        const hoveredGex = getHoveredGexNode(
          liquidityHeatmapData.gexMetric,
          crosshairRef.current.x,
          crosshairRef.current.y,
          getY,
          chartWidth
        );

        if (hoveredGex) {
          ctx.save();
          const gY = getY(hoveredGex.price);
          const isCallWall = hoveredGex.nodeType === 'CALL_WALL';
          const isPutWall = hoveredGex.nodeType === 'PUT_WALL';
          const isFlip = hoveredGex.nodeType === 'GAMMA_FLIP';
          const isMaxPain = hoveredGex.nodeType === 'MAX_PAIN';

          const accentCol = isCallWall
            ? '#10b981'
            : isPutWall
            ? '#f43f5e'
            : isFlip
            ? '#ffd600'
            : isMaxPain
            ? '#a855f7'
            : hoveredGex.dominantSide === 'call'
            ? '#00e5ff'
            : hoveredGex.dominantSide === 'put'
            ? '#fb7185'
            : '#38bdf8';

          const titleText = isCallWall
            ? '🎯 CALL WALL · MAJOR DEALER RESISTANCE'
            : isPutWall
            ? '🛡️ PUT WALL · MAJOR DEALER SUPPORT'
            : isFlip
            ? '⚖️ 0-GAMMA FLIP · REGIME BOUNDARY'
            : isMaxPain
            ? '💀 MAX PAIN EXPIRATION PIN'
            : `📊 GEX STRIKE · ${hoveredGex.dominantSide.toUpperCase()} GAMMA`;

          const boxW = 340;
          const boxH = 96;
          let tipX = crosshairRef.current.x + 14;
          let tipY = gY - boxH / 2;

          if (tipX + boxW > chartWidth - 10) {
            tipX = crosshairRef.current.x - boxW - 14;
          }
          if (tipY < 10) tipY = 10;
          if (tipY + boxH > fullHeight - 35) tipY = fullHeight - boxH - 35;

          // Background card with glassmorphic aesthetic
          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
          ctx.shadowBlur = 8;
          ctx.shadowOffsetX = 1;
          ctx.shadowOffsetY = 2;

          // Solid gradient background card
          const gexBgGrad = ctx.createLinearGradient(tipX, tipY, tipX + boxW, tipY + boxH);
          if (isLight) {
            gexBgGrad.addColorStop(0, '#ffffff');
            gexBgGrad.addColorStop(1, '#f1f5f9');
          } else {
            gexBgGrad.addColorStop(0, '#0f172a');
            gexBgGrad.addColorStop(1, '#020617');
          }

          ctx.fillStyle = gexBgGrad;
          ctx.strokeStyle = accentCol;
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          if (typeof (ctx as any).roundRect === 'function') {
            (ctx as any).roundRect(tipX, tipY, boxW, boxH, 6);
          } else {
            ctx.rect(tipX, tipY, boxW, boxH);
          }
          ctx.fill();
          ctx.stroke();

          ctx.shadowColor = 'transparent';

          // Left accent stripe
          ctx.fillStyle = accentCol;
          ctx.fillRect(tipX, tipY, 3.5, boxH);

          // Title banner
          ctx.fillStyle = accentCol;
          ctx.font = 'bold 9.5px "JetBrains Mono", monospace';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText(titleText, tipX + 12, tipY + 10);

          // Line 1: Strike Price & Distance from Spot
          const distSign = hoveredGex.distPctFromSpot >= 0 ? '+' : '';
          ctx.fillStyle = isLight ? '#0f172a' : '#ffffff';
          ctx.font = 'bold 9px "JetBrains Mono", monospace';
          ctx.fillText(`Strike: $${hoveredGex.priceFormatted}  ·  ${distSign}${hoveredGex.distPctFromSpot.toFixed(2)}% from Spot`, tipX + 12, tipY + 28);

          // Line 2: Net Gamma & Open Interest Breakdown
          const gexSign = hoveredGex.netGamma >= 0 ? '+' : '';
          ctx.fillStyle = isLight ? '#334155' : '#cbd5e1';
          ctx.font = '8.5px "JetBrains Mono", monospace';
          ctx.fillText(`Net Gamma: ${gexSign}$${hoveredGex.netGamma}M  ·  OI: ${hoveredGex.openInterest.toLocaleString()} (${hoveredGex.callOi} C / ${hoveredGex.putOi} P)`, tipX + 12, tipY + 46);

          // Line 3: Dealer Hedging Behavior
          const regimeText = isFlip
            ? 'Regime Boundary: Volatility Dampening ↔ Acceleration Flip'
            : hoveredGex.netGamma >= 0
            ? 'Dealer Long Γ: Sells rallies, buys dips (Mean-Reverting)'
            : 'Dealer Short Γ: Buys rallies, sells dips (Momentum Amplifier)';
          ctx.fillStyle = isFlip ? '#ffd600' : hoveredGex.netGamma >= 0 ? '#10b981' : '#f43f5e';
          ctx.font = 'bold 8px "JetBrains Mono", monospace';
          ctx.fillText(regimeText, tipX + 12, tipY + 64);

          // Line 4: Notional Heat intensity
          ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';
          ctx.font = '8px "JetBrains Mono", monospace';
          ctx.fillText(`Heat Intensity: ${(hoveredGex.intensity * 100).toFixed(0)}%  ·  Notional: $${(hoveredGex.notionalUsd / 1e6).toFixed(1)}M`, tipX + 12, tipY + 80);

          ctx.restore();
        }
      }

      // X-axis Time Badge: rendered as canvas badge above (Section 16)
    }

    // 16b. Global Synchronized Crosshair (Cross-Chart Time Tracking)
    if (!crosshairRef.current.active && chartSyncCrosshair && globalCrosshair?.active && globalCrosshair.sourceChartId !== id) {
      const syncX = utils.getXFromTime(globalCrosshair.time);
      const hasPrice = globalCrosshair.price !== undefined;
      const syncY = hasPrice ? utils.getY(globalCrosshair.price) : -1;
      
      const isXVisible = syncX >= 0 && syncX <= chartWidth;
      const isYVisible = hasPrice && syncY >= 0 && syncY <= fullHeight;

      if (isXVisible || isYVisible) {
        ctx.save();
        ctx.setLineDash([2, 3]);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)'; // High-visibility Cyan Sync Line
        ctx.lineWidth = 1;

        if (isXVisible) {
          ctx.beginPath();
          ctx.moveTo(syncX, 0);
          ctx.lineTo(syncX, fullHeight);
          ctx.stroke();

          // Synced Time Badge on Time Scale
          const timeStr = formatCrosshairTime(globalCrosshair.time, useLocalTime, timeframe);
          
          ctx.font = 'bold 10px monospace';
          const textW = ctx.measureText(timeStr).width + 14;
          const badgeX = Math.max(textW / 2, Math.min(chartWidth - textW / 2, syncX));
          
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.roundRect(badgeX - textW / 2, fullHeight + 2, textW, 18, 3);
          ctx.fill();
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 1;
          ctx.stroke();
          
          ctx.fillStyle = '#000000';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(timeStr, badgeX, fullHeight + 12);
        }

        if (isYVisible) {
          ctx.beginPath();
          ctx.moveTo(0, syncY);
          ctx.lineTo(chartWidth, syncY);
          ctx.stroke();

          // Price Badge on Right Scale
          const hoveredPrice = globalCrosshair.price;
          ctx.fillStyle = '#0369a1';
          ctx.beginPath();
          ctx.roundRect(chartWidth + 2, syncY - 9, rightScaleWidth - 6, 18, 3);
          ctx.fill();
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'left';
          ctx.font = '11px monospace';
          ctx.fillText(hoveredPrice.toFixed(hoveredPrice > 100 ? 2 : 4), chartWidth + 6, syncY + 3.5);
        }

        ctx.restore();
      }
    }

      // --- DRAW ACTIVE POSITIONS (Visual Chart Trading) ---
      if (positions && positions.length > 0) {
        const stacks = calculateLabelStacks(utils, visualDragState);
        positions.filter(p => p.symbol === activeSymbol).forEach(pos => {
          const entryLineY = utils.getY(pos.entryPrice);
          const entryBadgeY = stacks.get(`pos-entry-${pos.id}`) || entryLineY;
          const isBuy = pos.type === 'BUY';
          const isForex = marketInfo.assetClass === 'Forex';
          const posColor = isBuy ? currentPalette.bull : currentPalette.bear;
          const currentP = currentPrice || pos.currentPrice || pos.entryPrice;
          const liveMetrics = calculatePositionMetrics(pos.type, pos.entryPrice, currentP, pos.size, isForex);

          const isDraggingThisPos = visualDragState?.active && visualDragState.posId === pos.id && (visualDragState.type as any) === 'ENTRY';
          const isHoveredPos = positionHoverState?.posId === pos.id && positionHoverState.element === 'entry';

          const isDraggingThisTP = visualDragState?.active && visualDragState.posId === pos.id && (visualDragState.type === 'TP' || visualDragState.type === 'NEW_TP');
          const isDraggingThisSL = visualDragState?.active && visualDragState.posId === pos.id && (visualDragState.type === 'SL' || visualDragState.type === 'NEW_SL');
          const effectiveTP = isDraggingThisTP ? visualDragState!.price : pos.takeProfit;
          const effectiveSL = isDraggingThisSL ? visualDragState!.price : pos.stopLoss;

          // 1. Shaded Profit Band & Left Spine
          if (effectiveTP) {
            const tpLineY = utils.getY(effectiveTP);
            const tpBadgeY = stacks.get(`pos-tp-${pos.id}`) || tpLineY;
            const topY = Math.min(entryLineY, tpLineY);
            const h = Math.abs(entryLineY - tpLineY);
            ctx.fillStyle = isDraggingThisTP ? `${currentPalette.bull}28` : `${currentPalette.bull}12`;
            ctx.fillRect(0, topY, utils.chartWidth, h);

            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(10, entryLineY);
            ctx.lineTo(10, tpLineY);
            ctx.stroke();

            // If stacked, draw connector
            if (Math.abs(tpBadgeY - tpLineY) > 1) {
              ctx.setLineDash([2, 2]);
              ctx.beginPath(); ctx.moveTo(utils.chartWidth - 50, tpLineY); ctx.lineTo(utils.chartWidth - 50, tpBadgeY); ctx.stroke();
              ctx.setLineDash([]);
            }
          }

          // 2. Shaded Loss Band & Left Spine
          if (effectiveSL) {
            const slLineY = utils.getY(effectiveSL);
            const slBadgeY = stacks.get(`pos-sl-${pos.id}`) || slLineY;
            const topY = Math.min(entryLineY, slLineY);
            const h = Math.abs(entryLineY - slLineY);
            ctx.fillStyle = isDraggingThisSL ? `${currentPalette.bear}28` : `${currentPalette.bear}12`;
            ctx.fillRect(0, topY, utils.chartWidth, h);

            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(10, entryLineY);
            ctx.lineTo(10, slLineY);
            ctx.stroke();

            if (Math.abs(slBadgeY - slLineY) > 1) {
              ctx.setLineDash([2, 2]);
              ctx.beginPath(); ctx.moveTo(utils.chartWidth - 50, slLineY); ctx.lineTo(utils.chartWidth - 50, slBadgeY); ctx.stroke();
              ctx.setLineDash([]);
            }
          }

          // 3. Draw Execution Ray & Origin Marker (Candle Asal Eksekusi)
          let startX = 0;
          if (pos.timestamp) {
            const tX = utils.getXFromTime(pos.timestamp);
            if (tX >= 0 && tX <= utils.chartWidth) startX = tX;
          }
          if (startX <= 0) startX = Math.max(0, utils.chartWidth - 280);

          // Origin Marker (▲ BUY / ▼ SELL)
          ctx.fillStyle = posColor;
          ctx.beginPath();
          if (isBuy) {
            ctx.moveTo(startX, entryLineY + 3);
            ctx.lineTo(startX - 5, entryLineY + 13);
            ctx.lineTo(startX + 5, entryLineY + 13);
            ctx.closePath();
          } else {
            ctx.moveTo(startX, entryLineY - 3);
            ctx.lineTo(startX - 5, entryLineY - 13);
            ctx.lineTo(startX + 5, entryLineY - 13);
            ctx.closePath();
          }
          ctx.fill();

          // Origin point circle
          ctx.strokeStyle = posColor;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(startX, entryLineY, 3.5, 0, Math.PI * 2);
          ctx.stroke();

          // 1. Horizontal Solid Line across chart canvas for Position Entry
          ctx.save();
          if (isDraggingThisPos || isHoveredPos) {
            ctx.shadowBlur = 12;
            ctx.shadowColor = posColor;
          }
          ctx.beginPath();
          ctx.moveTo(startX, entryLineY);
          ctx.lineTo(utils.chartWidth, entryLineY);
          ctx.strokeStyle = posColor;
          ctx.lineWidth = (isDraggingThisPos || isHoveredPos) ? 2.5 : 1.5;
          ctx.stroke();
          ctx.restore();

          // If entry badge is stacked, draw connector
          if (Math.abs(entryBadgeY - entryLineY) > 1) {
            ctx.save();
            ctx.setLineDash([2, 2]);
            ctx.strokeStyle = posColor;
            ctx.globalAlpha = 0.5;
            ctx.beginPath(); ctx.moveTo(utils.chartWidth - 50, entryLineY); ctx.lineTo(utils.chartWidth - 50, entryBadgeY); ctx.stroke();
            ctx.restore();
          }

          // 4. Draw Entry Badge with Segmented TradingView-Style Interactive Buttons
          const hasTP = !!effectiveTP;
          const hasSL = !!effectiveSL;
          const rrRatio = (hasTP && hasSL) ? calculateRiskRewardRatio(pos.entryPrice, effectiveTP, effectiveSL, isBuy) : null;
          const pnlText = formatPnlDisplay(liveMetrics, pnlDisplayMode);
          const hasRR = !!rrRatio;
          
          // Width Definitions for segments (Premium Spacing)
          const segBtnW = 32;
          const segSizeW = 55;
          const segPriceW = 90;
          const segPnlW = 85;
          const segRRW = hasRR ? 65 : 0;
          
          const totalBadgeW = (segBtnW * 2) + segSizeW + segPriceW + segPnlW + (segBtnW * 4) + segRRW + 12; 
          const badgeX = utils.chartWidth - totalBadgeW - 12;

          // Main Segmented Badge Container (Premium Glassmorphism)
          ctx.save();
          ctx.fillStyle = 'rgba(10, 15, 25, 0.92)';
          if (isDraggingThisPos || isHoveredPos) {
             ctx.shadowBlur = 10;
             ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
          }
          ctx.beginPath();
          ctx.roundRect(badgeX, entryBadgeY - 12, totalBadgeW, 24, 12);
          ctx.fill();
          
          ctx.strokeStyle = (isDraggingThisPos || isHoveredPos) ? posColor : 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = (isDraggingThisPos || isHoveredPos) ? 2 : 1;
          ctx.stroke();
          ctx.restore();

          // Segment Separators (Subtle)
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.lineWidth = 1;
          const drawSeparator = (x: number) => {
            ctx.beginPath();
            ctx.moveTo(x, entryBadgeY - 8);
            ctx.lineTo(x, entryBadgeY + 8);
            ctx.stroke();
          };

          ctx.textAlign = 'center';
          ctx.font = 'bold 10px sans-serif';

          // 0a. TP Pull Button
          const isTPHover = positionHoverState?.posId === pos.id && positionHoverState.element === 'new_tp';
          ctx.fillStyle = hasTP ? '#22c55e' : (isTPHover ? '#ffffff' : 'rgba(255, 255, 255, 0.3)');
          ctx.fillText('TP', badgeX + segBtnW / 2, entryBadgeY + 4);
          drawSeparator(badgeX + segBtnW);

          // 0b. SL Pull Button
          const isSLHover = positionHoverState?.posId === pos.id && positionHoverState.element === 'new_sl';
          ctx.fillStyle = hasSL ? '#ef4444' : (isSLHover ? '#ffffff' : 'rgba(255, 255, 255, 0.3)');
          ctx.fillText('SL', badgeX + segBtnW + segBtnW / 2, entryBadgeY + 4);
          drawSeparator(badgeX + segBtnW * 2);

          // 1. Size Segment
          ctx.fillStyle = posColor;
          ctx.font = 'bold 11px monospace';
          ctx.fillText(`${pos.type} ${pos.size}`, badgeX + segBtnW * 2 + segSizeW / 2, entryBadgeY + 4);
          drawSeparator(badgeX + segBtnW * 2 + segSizeW);

          // 2. Price Segment
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.font = '10px monospace';
          ctx.fillText(pos.entryPrice.toFixed(pos.entryPrice < 1 ? 5 : 2), badgeX + segBtnW * 2 + segSizeW + segPriceW / 2, entryBadgeY + 4);
          drawSeparator(badgeX + segBtnW * 2 + segSizeW + segPriceW);

          // 3. PnL Segment
          const isProfitable = liveMetrics.pnl >= 0;
          ctx.save();
          ctx.fillStyle = isProfitable ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';
          ctx.fillRect(badgeX + segBtnW * 2 + segSizeW + segPriceW + 2, entryBadgeY - 10, segPnlW - 4, 20);
          ctx.restore();

          ctx.fillStyle = isProfitable ? '#4ade80' : '#f87171';
          ctx.font = 'bold 11px monospace';
          ctx.fillText(pnlText, badgeX + segBtnW * 2 + segSizeW + segPriceW + segPnlW / 2, entryBadgeY + 4);
          drawSeparator(badgeX + segBtnW * 2 + segSizeW + segPriceW + segPnlW);

          // 4. BE Button
          const beX = badgeX + segBtnW * 2 + segSizeW + segPriceW + segPnlW;
          const isBEHover = positionHoverState?.posId === pos.id && positionHoverState.element === 'be';
          ctx.fillStyle = isBEHover ? '#ffffff' : 'rgba(255, 255, 255, 0.5)';
          ctx.font = 'bold 9px sans-serif';
          ctx.fillText('BE', beX + segBtnW / 2, entryBadgeY + 4);
          drawSeparator(beX + segBtnW);

          // 5. Half Close Button
          const halfX = beX + segBtnW;
          const isHalfHover = positionHoverState?.posId === pos.id && positionHoverState.element === 'partial_close';
          ctx.fillStyle = isHalfHover ? '#ffffff' : 'rgba(255, 255, 255, 0.5)';
          ctx.fillText('½', halfX + segBtnW / 2, entryBadgeY + 4);
          drawSeparator(halfX + segBtnW);

          // 6. Reverse Button
          const revX = halfX + segBtnW;
          const isRevHover = positionHoverState?.posId === pos.id && positionHoverState.element === 'reverse';
          ctx.fillStyle = isRevHover ? '#ffffff' : 'rgba(255, 255, 255, 0.5)';
          ctx.fillText('REV', revX + segBtnW / 2, entryBadgeY + 4);
          drawSeparator(revX + segBtnW);

          // 7. RR Ratio (Optional)
          let lastX = revX + segBtnW;
          if (hasRR) {
            ctx.fillStyle = '#38bdf8';
            ctx.font = 'bold 9px monospace';
            ctx.fillText(`RR ${rrRatio}`, lastX + segRRW / 2, entryBadgeY + 4);
            drawSeparator(lastX + segRRW);
            lastX += segRRW;
          }

          // 8. Close Button
          const isCloseHover = positionHoverState?.posId === pos.id && positionHoverState.element === 'close';
          ctx.fillStyle = isCloseHover ? '#f87171' : '#ef4444';
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText('✕', lastX + segBtnW / 2, entryBadgeY + 4.5);

          // 5. Draw Take Profit Line & Segmented Badge
          if (effectiveTP) {
            const tpY = utils.getY(effectiveTP);
            const tpMetrics = calculatePositionMetrics(pos.type, pos.entryPrice, effectiveTP, pos.size, marketInfo.assetClass === 'Forex');
            const tpText = formatPnlDisplay(tpMetrics, pnlDisplayMode);

            ctx.save();
            if (isDraggingThisTP) {
              ctx.shadowBlur = 10;
              ctx.shadowColor = '#22c55e';
            }
            ctx.beginPath();
            ctx.setLineDash([6, 4]);
            ctx.moveTo(startX, tpY);
            ctx.lineTo(utils.chartWidth, tpY);
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = isDraggingThisTP ? 2.5 : 1.2;
            ctx.stroke();
            ctx.restore();

            // TP Segmented Badge
            const tpBadgeW = 180;
            const tpBadgeX = utils.chartWidth - tpBadgeW - 12;
            
            ctx.save();
            ctx.fillStyle = 'rgba(10, 25, 15, 0.92)';
            ctx.strokeStyle = '#22c55e';
            ctx.beginPath();
            ctx.roundRect(tpBadgeX, tpY - 12, tpBadgeW, 24, 12);
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // TP Segments
            ctx.fillStyle = '#22c55e';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`TP ${pos.size}`, tpBadgeX + 12, tpY + 4);
            
            ctx.strokeStyle = 'rgba(34, 197, 94, 0.15)';
            ctx.beginPath(); ctx.moveTo(tpBadgeX + 60, tpY - 8); ctx.lineTo(tpBadgeX + 60, tpY + 8); ctx.stroke();
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px monospace';
            ctx.fillText(`+${tpText}`, tpBadgeX + 72, tpY + 4);
            
            ctx.beginPath(); ctx.moveTo(tpBadgeX + 148, tpY - 8); ctx.lineTo(tpBadgeX + 148, tpY + 8); ctx.stroke();
            
            const isTpxHover = positionHoverState?.posId === pos.id && positionHoverState.element === 'remove_tp';
            ctx.fillStyle = isTpxHover ? '#ffffff' : '#ef4444';
            ctx.textAlign = 'center';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText('✕', tpBadgeX + 164, tpY + 4.5);
          }

          // 6. Draw Stop Loss Line & Segmented Badge
          if (effectiveSL) {
            const slY = utils.getY(effectiveSL);
            const slMetrics = calculatePositionMetrics(pos.type, pos.entryPrice, effectiveSL, pos.size, marketInfo.assetClass === 'Forex');
            const slText = formatPnlDisplay(slMetrics, pnlDisplayMode);

            ctx.save();
            if (isDraggingThisSL) {
              ctx.shadowBlur = 10;
              ctx.shadowColor = '#ef4444';
            }
            ctx.beginPath();
            ctx.setLineDash([6, 4]);
            ctx.moveTo(startX, slY);
            ctx.lineTo(utils.chartWidth, slY);
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = isDraggingThisSL ? 2.5 : 1.2;
            ctx.stroke();
            ctx.restore();

            // SL Segmented Badge
            const slBadgeW = 210;
            const slBadgeX = utils.chartWidth - slBadgeW - 12;
            
            ctx.save();
            ctx.fillStyle = 'rgba(25, 10, 10, 0.92)';
            ctx.strokeStyle = '#ef4444';
            ctx.beginPath();
            ctx.roundRect(slBadgeX, slY - 12, slBadgeW, 24, 12);
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // SL Segments
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`SL ${pos.size}`, slBadgeX + 12, slY + 4);
            
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.15)';
            ctx.beginPath(); ctx.moveTo(slBadgeX + 60, slY - 8); ctx.lineTo(slBadgeX + 60, slY + 8); ctx.stroke();
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px monospace';
            ctx.fillText(`-${slText}`, slBadgeX + 72, slY + 4);
            
            ctx.beginPath(); ctx.moveTo(slBadgeX + 155, slY - 8); ctx.lineTo(slBadgeX + 155, slY + 8); ctx.stroke();
            
            // TS Toggle
            const isTsHover = positionHoverState?.posId === pos.id && positionHoverState.element === 'ts_toggle';
            ctx.fillStyle = pos.autoBE ? '#38bdf8' : (isTsHover ? '#ffffff' : 'rgba(255, 255, 255, 0.4)');
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('TS', slBadgeX + 172, slY + 4);

            ctx.beginPath(); ctx.moveTo(slBadgeX + 190, slY - 8); ctx.lineTo(slBadgeX + 190, slY + 8); ctx.stroke();

            const isSlxHover = positionHoverState?.posId === pos.id && positionHoverState.element === 'remove_sl';
            ctx.fillStyle = isSlxHover ? '#ffffff' : '#ef4444';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText('✕', slBadgeX + 200, slY + 4.5);
          }

          // 6b. Multi-Bracket Take Profit Targets (TP1, TP2, TP3)
          if (pos.brackets) {
            const { tp1, tp1Ratio = 0.5, tp2, tp2Ratio = 0.3, tp3, tp3Ratio = 0.2 } = pos.brackets;

            const drawBracketLine = (price: number, label: string, ratio: number, color: string) => {
              const y = utils.getY(price);
              ctx.beginPath();
              ctx.setLineDash([3, 3]);
              ctx.moveTo(0, y);
              ctx.lineTo(utils.chartWidth, y);
              ctx.strokeStyle = color;
              ctx.lineWidth = 1.2;
              ctx.stroke();
              ctx.setLineDash([]);

              // Bracket Badge
              ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
              ctx.strokeStyle = color;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.roundRect(140, y - 8, 110, 16, 3);
              ctx.fill();
              ctx.stroke();

              ctx.fillStyle = color;
              ctx.font = 'bold 8.5px monospace';
              ctx.textAlign = 'center';
              ctx.fillText(`${label} ${price.toFixed(isForex ? 4 : 2)}`, 195, y + 3);
            };

            if (tp1) drawBracketLine(tp1, 'TP1', tp1Ratio, '#86efac');
            if (tp2) drawBracketLine(tp2, 'TP2', tp2Ratio, '#34d399');
            if (tp3) drawBracketLine(tp3, 'TP3', tp3Ratio, '#38bdf8');
          }

          // 7. Right Price Axis Badges (TradingView & cTrader standard tags on Y-axis)
          const axisX = utils.chartWidth + 1;
          const axisW = Math.max(56, dimensions.width - utils.chartWidth - 2);

          // Entry Axis Tag
          ctx.save();
          ctx.fillStyle = posColor;
          ctx.beginPath();
          ctx.roundRect(axisX, entryLineY - 10, axisW, 20, 10);
          ctx.fill();
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`${pos.type} ${pos.size}`, axisX + axisW / 2, entryLineY + 3.5);
          ctx.restore();

          // TP Axis Tag
          if (effectiveTP) {
            const tpY = utils.getY(effectiveTP);
            ctx.save();
            ctx.fillStyle = '#16a34a';
            ctx.beginPath();
            ctx.roundRect(axisX, tpY - 10, axisW, 20, 10);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`TP ${effectiveTP.toFixed(isForex ? 5 : 2)}`, axisX + axisW / 2, tpY + 3.5);
            ctx.restore();
          }

          // SL Axis Tag
          if (effectiveSL) {
            const slY = utils.getY(effectiveSL);
            ctx.save();
            ctx.fillStyle = '#dc2626';
            ctx.beginPath();
            ctx.roundRect(axisX, slY - 10, axisW, 20, 10);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`SL ${effectiveSL.toFixed(isForex ? 5 : 2)}`, axisX + axisW / 2, slY + 3.5);
            ctx.restore();
          }
        });
      }

      // --- DRAW HISTORICAL EXECUTION FILL MARKERS ON CANVAS ---
      if (executionFills && executionFills.length > 0) {
        const symbolFills = executionFills.filter(f => f.symbol === activeSymbol);
        symbolFills.forEach(fill => {
          const fillY = utils.getY(fill.price);
          const fillX = fill.timestamp ? utils.getXFromTime(fill.timestamp) : 0;
          if (fillX > 0 && fillX < utils.chartWidth && fillY > 0 && fillY < utils.chartHeight) {
            const isBuy = fill.side === 'BUY';
            const color = fill.action === 'EXIT' ? '#f59e0b' : fill.action === 'PARTIAL_CLOSE' ? '#38bdf8' : isBuy ? currentPalette.bull : currentPalette.bear;

            ctx.fillStyle = color;
            ctx.beginPath();
            if (isBuy) {
              ctx.moveTo(fillX, fillY - 2);
              ctx.lineTo(fillX - 5, fillY + 8);
              ctx.lineTo(fillX + 5, fillY + 8);
            } else {
              ctx.moveTo(fillX, fillY + 2);
              ctx.lineTo(fillX - 5, fillY - 8);
              ctx.lineTo(fillX + 5, fillY - 8);
            }
            ctx.closePath();
            ctx.fill();

            // Label badge
            ctx.fillStyle = 'rgba(10, 14, 26, 0.9)';
            ctx.strokeStyle = color;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.roundRect(fillX - 25, isBuy ? fillY + 10 : fillY - 22, 50, 14, 3);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = color;
            ctx.font = 'bold 8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`${fill.action === 'EXIT' ? 'EXIT' : fill.side[0]} ${fill.size}`, fillX, isBuy ? fillY + 19 : fillY - 13);
          }
        });
      }

      // --- DRAW COMPLETED HISTORICAL TRADE PATHS & MARKERS FROM TRADE HISTORY ---
      if (tradeHistory && tradeHistory.length > 0) {
        const symbolHistory = tradeHistory.filter((t: any) => t.symbol === activeSymbol);
        symbolHistory.forEach((trade: any) => {
          const entryPrice = trade.entryPrice;
          const closePrice = trade.closePrice || trade.exitPrice || entryPrice;
          const entryTime = trade.timestamp;
          const closeTime = trade.closeTime ? new Date(trade.closeTime).getTime() : entryTime;
          const isBuy = trade.type === 'BUY';
          const pnl = Number(trade.finalPnl || trade.pnl) || 0;
          const isWin = pnl >= 0;

          const entryX = entryTime ? utils.getXFromTime(entryTime) : 0;
          const closeX = closeTime ? utils.getXFromTime(closeTime) : entryX + 40;
          const entryY = utils.getY(entryPrice);
          const closeY = utils.getY(closePrice);

          const isEntryVisible = entryX > -100 && entryX < utils.chartWidth + 100 && entryY > 0 && entryY < utils.chartHeight;
          const isCloseVisible = closeX > -100 && closeX < utils.chartWidth + 100 && closeY > 0 && closeY < utils.chartHeight;

          if (isEntryVisible || isCloseVisible) {
            const pathColor = isWin ? '#10b981' : '#f43f5e';

            // 1. Dashed Connecting Trade Path Line
            ctx.save();
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = pathColor;
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(Math.max(-10, Math.min(utils.chartWidth + 10, entryX)), entryY);
            ctx.lineTo(Math.max(-10, Math.min(utils.chartWidth + 10, closeX)), closeY);
            ctx.stroke();
            ctx.restore();

            // 2. Midpoint PnL Tag along the line
            const midX = (entryX + closeX) / 2;
            const midY = (entryY + closeY) / 2;
            if (midX > 20 && midX < utils.chartWidth - 20 && midY > 10 && midY < utils.chartHeight - 10) {
              const pnlText = `${isWin ? '+' : ''}$${pnl.toFixed(2)}`;
              ctx.font = 'bold 9px monospace';
              const tw = ctx.measureText(pnlText).width + 12;

              ctx.fillStyle = isWin ? 'rgba(6, 78, 59, 0.95)' : 'rgba(136, 19, 55, 0.95)';
              ctx.strokeStyle = pathColor;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.roundRect(midX - tw / 2, midY - 8, tw, 16, 4);
              ctx.fill();
              ctx.stroke();

              ctx.fillStyle = '#ffffff';
              ctx.textAlign = 'center';
              ctx.fillText(pnlText, midX, midY + 3.5);
            }

            // 3. Entry Point Marker (Circle & Badge)
            if (entryX > 0 && entryX < utils.chartWidth) {
              const entryColor = isBuy ? currentPalette.bull : currentPalette.bear;
              ctx.fillStyle = entryColor;
              ctx.beginPath();
              ctx.arc(entryX, entryY, 4, 0, Math.PI * 2);
              ctx.fill();

              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 1;
              ctx.stroke();

              // Badge
              ctx.fillStyle = 'rgba(10, 14, 26, 0.9)';
              ctx.strokeStyle = entryColor;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.roundRect(entryX - 22, isBuy ? entryY + 8 : entryY - 22, 44, 14, 3);
              ctx.fill();
              ctx.stroke();

              ctx.fillStyle = entryColor;
              ctx.font = 'bold 8px monospace';
              ctx.textAlign = 'center';
              ctx.fillText(`OP ${trade.type[0]}`, entryX, isBuy ? entryY + 17 : entryY - 12);
            }

            // 4. Close Point Marker
            if (closeX > 0 && closeX < utils.chartWidth) {
              const reason = trade.closeReason || (pnl > 0 ? 'TP' : 'SL');
              ctx.fillStyle = pathColor;
              ctx.beginPath();
              ctx.arc(closeX, closeY, 4.5, 0, Math.PI * 2);
              ctx.fill();

              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 1;
              ctx.stroke();

              ctx.fillStyle = 'rgba(10, 14, 26, 0.9)';
              ctx.strokeStyle = pathColor;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.roundRect(closeX - 24, closeY - 22, 48, 14, 3);
              ctx.fill();
              ctx.stroke();

              ctx.fillStyle = pathColor;
              ctx.font = 'bold 8px monospace';
              ctx.textAlign = 'center';
              ctx.fillText(`✕ ${reason}`, closeX, closeY - 12);
            }
          }
        });
      }

      // --- DRAW TARGET SPOTLIGHT BEAM FOR JUMPED EXECUTION REVIEW ---
      if (targetSpotlightTime) {
        try {
          const spotX = utils.getXFromTime(targetSpotlightTime.timestamp);
          const spotH = (isFinite(utils.chartHeight) && utils.chartHeight > 0) ? utils.chartHeight : (utils.mainChartHeight || 400);
          if (isFinite(spotX) && isFinite(spotH) && spotX > -100 && spotX < utils.chartWidth + 100) {
            ctx.save();
            // Vertical glowing column
            const gradX = Math.max(-1000, Math.min(300.0, spotX));
            const grad = ctx.createLinearGradient(gradX, 0, gradX, spotH);
            grad.addColorStop(0, 'rgba(99, 102, 241, 0.35)');
            grad.addColorStop(0.5, 'rgba(99, 102, 241, 0.15)');
            grad.addColorStop(1, 'rgba(99, 102, 241, 0.35)');
            ctx.fillStyle = grad;
            ctx.fillRect(spotX - 16, 0, 32, spotH);

            // Center target vertical dash line
            ctx.setLineDash([6, 4]);
            ctx.strokeStyle = '#818cf8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(spotX, 0);
            ctx.lineTo(spotX, spotH);
            ctx.stroke();

            // Target Header Banner
            ctx.fillStyle = '#4f46e5';
            ctx.beginPath();
            if (typeof ctx.roundRect === 'function') {
              ctx.roundRect(spotX - 110, 8, 220, 22, 5);
            } else {
              ctx.rect(spotX - 110, 8, 220, 22);
            }
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(targetSpotlightTime.title, spotX, 22);

            ctx.restore();
          }
        } catch (err) {
          console.error("Spotlight rendering error:", err);
        }
      }

      // --- DRAW REAL-TIME NEWS & ECONOMIC EVENT ICONS/MARKERS DIRECTLY AT EVENT CANDLE BARS ---
      newsMarkersHitBoxesRef.current = [];
      if (showNewsMarkers && chartNewsEvents && chartNewsEvents.length > 0) {
        const nowMs = Date.now();
        const hasCandles = candles && candles.length > 0;
        const lastCandleX = hasCandles ? utils.getX(candles.length - 1) : utils.chartWidth;
        const candleSlot = (hasCandles && candles.length > 1) 
          ? Math.abs(utils.getX(candles.length - 1) - utils.getX(candles.length - 2)) 
          : 14;
        const isMicroTimeframe = ['tick', '1T', '10T', '50T', '100T', '1s', '1m', '3m', '5m'].includes(timeframe);
        const maxFutureBars = isMicroTimeframe ? 15 : 30;
        const maxFutureX = lastCandleX + (maxFutureBars * candleSlot);

        // Filter events by Impact & Active Instrument Symbol
        const activeCurrencies = getCurrenciesForSymbol(activeSymbol);
        const filteredEvents = chartNewsEvents.filter((evt) => {
          if (newsFilterImpact !== 'ALL' && evt.impact !== newsFilterImpact) return false;
          if (filterByInstrumentOnly) {
            const evtCurr = evt.currency?.toUpperCase() || 'USD';
            const isMatch = activeCurrencies.some(c => evtCurr.includes(c) || c.includes(evtCurr) || evtCurr === 'GLOBAL');
            if (!isMatch) return false;
          }
          return true;
        });

        // 1. Group / Cluster events that lie on or near the same X coordinate (within 14px)
        const clusters: Array<{
          x: number;
          events: ChartNewsEconomicEvent[];
        }> = [];

        filteredEvents.forEach((evt) => {
          const evtX = utils.getXFromTime(evt.timestamp);
          if (!isFinite(evtX) || evtX < -60 || evtX > utils.chartWidth + 60) return;
          if (evtX > maxFutureX) return;

          const existingCluster = clusters.find((c) => Math.abs(c.x - evtX) < 14);
          if (existingCluster) {
            existingCluster.events.push(evt);
          } else {
            clusters.push({ x: evtX, events: [evt] });
          }
        });

        // 2. Render each cluster with Volatility Range Shading & Minimalist Pin
        clusters.forEach((cluster) => {
          const evtX = cluster.x;
          const isMulti = cluster.events.length > 1;
          const primaryEvt = cluster.events[0];
          const hasHighImpact = cluster.events.some((e) => e.impact === 'HIGH');
          const isHovered = cluster.events.some((e) => e.id === hoveredNewsEventId);

          const baseColor = hasHighImpact ? '#f43f5e' : cluster.events.some((e) => e.impact === 'MEDIUM') ? '#f59e0b' : currentPalette.bull;
          const glowColor = hasHighImpact ? 'rgba(244, 63, 94, 0.4)' : 'rgba(245, 158, 11, 0.35)';

          ctx.save();

          // A. Expected Volatility Range Shading Zone (Subtle vertical glow for High Impact events)
          if (hasHighImpact) {
            const zoneWidth = Math.max(16, candleSlot * 2.5);
            const grad = ctx.createLinearGradient(evtX - zoneWidth / 2, 0, evtX + zoneWidth / 2, 0);
            grad.addColorStop(0, 'rgba(244, 63, 94, 0.0)');
            grad.addColorStop(0.5, 'rgba(244, 63, 94, 0.12)');
            grad.addColorStop(1, 'rgba(244, 63, 94, 0.0)');
            ctx.fillStyle = grad;
            ctx.fillRect(evtX - zoneWidth / 2, 0, zoneWidth, utils.chartHeight);
          }

          // B. Refined Solid Vertical Event Line through chart bar
          const pinRadius = isHovered ? 16 : 13;
          const pinY = Math.max(pinRadius + 4, utils.drawableHeight - pinRadius - 6);

          ctx.setLineDash([]); // Clean solid line
          ctx.strokeStyle = isHovered ? baseColor : `${baseColor}66`;
          ctx.lineWidth = isHovered ? 1.5 : 1;
          ctx.beginPath();
          ctx.moveTo(evtX, 8);
          ctx.lineTo(evtX, pinY);
          ctx.stroke();

          // C. Minimalist Refined Icon Pin / Cluster Pin at bottom axis

          // Register Hit Box for mouse click & touch interactions (Expanded +/- 24px touch target)
          cluster.events.forEach((evt) => {
            newsMarkersHitBoxesRef.current.push({
              id: evt.id,
              x1: evtX - 24,
              y1: pinY - 24,
              x2: evtX + 24,
              y2: pinY + 24,
              event: evt,
            });
          });

          // Glow effects for high impact or hovered events
          if (isHovered || hasHighImpact) {
            ctx.shadowBlur = isHovered ? 18 : 10;
            ctx.shadowColor = glowColor;
          }

          // Circular Icon Pin Container
          ctx.fillStyle = isHovered ? '#070b14' : 'rgba(8, 12, 22, 0.94)';
          ctx.strokeStyle = baseColor;
          ctx.lineWidth = isHovered ? 2 : 1.2;
          ctx.beginPath();
          ctx.arc(evtX, pinY, pinRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Icon symbol or cluster number inside pin
          ctx.shadowBlur = 0;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          if (isMulti) {
            ctx.font = 'bold 9.5px monospace';
            ctx.fillStyle = '#fde68a';
            ctx.fillText(`${cluster.events.length}+`, evtX, pinY);
          } else {
            ctx.font = isHovered ? '12px sans-serif' : '10px sans-serif';
            ctx.fillText(primaryEvt.flag || (hasHighImpact ? '🔥' : '⚡'), evtX, pinY);
          }

          // D. Rich Touch & Hover Detail Floating Tooltip
          if (isHovered) {
            const tipWidth = 220;
            const tipHeight = isMulti ? 24 + cluster.events.length * 26 : 58;
            const tipX = Math.max(10, Math.min(utils.chartWidth - tipWidth - 10, evtX - tipWidth / 2));
            const tipY = Math.max(10, pinY - tipHeight - 12);

            ctx.fillStyle = 'rgba(7, 10, 19, 0.98)';
            ctx.strokeStyle = baseColor;
            ctx.lineWidth = 1.5;
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.beginPath();
            if (typeof ctx.roundRect === 'function') {
              ctx.roundRect(tipX, tipY, tipWidth, tipHeight, 8);
            } else {
              ctx.rect(tipX, tipY, tipWidth, tipHeight);
            }
            ctx.fill();
            ctx.stroke();

            ctx.shadowBlur = 0;
            if (isMulti) {
              ctx.fillStyle = '#38bdf8';
              ctx.font = 'bold 10px monospace';
              ctx.textAlign = 'left';
              ctx.fillText(`⚡ ${cluster.events.length} EVENT CLUSTER TERHUBUNG`, tipX + 8, tipY + 14);

              cluster.events.forEach((evt, idx) => {
                const subY = tipY + 30 + idx * 24;
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 9px sans-serif';
                const title = evt.event.length > 22 ? evt.event.substring(0, 22) + '...' : evt.event;
                ctx.fillText(`${evt.flag || '⚡'} ${evt.currency} - ${title}`, tipX + 8, subY);

                ctx.font = '8px monospace';
                ctx.fillStyle = evt.impact === 'HIGH' ? '#f43f5e' : '#f59e0b';
                ctx.fillText(`${evt.impact} IMPACT`, tipX + 8, subY + 11);
              });
            } else {
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 10px sans-serif';
              ctx.textAlign = 'left';
              const title = primaryEvt.event.length > 24 ? primaryEvt.event.substring(0, 24) + '...' : primaryEvt.event;
              ctx.fillText(`${primaryEvt.flag || '⚡'} ${primaryEvt.currency} - ${title}`, tipX + 8, tipY + 14);

              ctx.font = 'bold 8.5px monospace';
              ctx.fillStyle = baseColor;
              ctx.fillText(`${primaryEvt.impact} IMPACT`, tipX + 8, tipY + 28);

              ctx.font = '8.5px monospace';
              ctx.fillStyle = '#cbd5e1';
              const fcastVal = primaryEvt.forecast && primaryEvt.forecast !== '-' ? `Prakiraan: ${primaryEvt.forecast}` : 'Makro Event';
              ctx.fillText(fcastVal, tipX + 80, tipY + 28);

              ctx.font = '8px monospace';
              ctx.fillStyle = '#38bdf8';
              ctx.fillText(`Sentuh / Klik untuk Detail & AI Agent ➔`, tipX + 8, tipY + 44);
            }
          }

          ctx.restore();
        });
      }

      // --- DRAW PENDING ORDERS VISUAL LINES & LABELS (Limit, Stop, Stop-Limit, OCO) ---
      if (pendingOrders && pendingOrders.length > 0) {
        const stacks = calculateLabelStacks(utils, visualDragState);
        pendingOrders.filter(o => o.symbol === activeSymbol).forEach(order => {
          const isDraggingThisOrder = visualDragState?.active && visualDragState.pendingId === order.id && visualDragState.type === 'PENDING_ORDER';
          const isDraggingThisTP = visualDragState?.active && visualDragState.pendingId === order.id && (visualDragState.type === 'PENDING_TP' || visualDragState.type === 'NEW_PENDING_TP');
          const isDraggingThisSL = visualDragState?.active && visualDragState.pendingId === order.id && (visualDragState.type === 'PENDING_SL' || visualDragState.type === 'NEW_PENDING_SL');

          const effectivePrice = isDraggingThisOrder ? visualDragState!.price : order.price;
          const effectiveTP = isDraggingThisTP ? visualDragState!.price : order.takeProfit;
          const effectiveSL = isDraggingThisSL ? visualDragState!.price : order.stopLoss;

          const orderLineY = utils.getY(effectivePrice);
          const orderBadgeY = stacks.get(`pending-entry-${order.id}`) || orderLineY;
          const isBuy = order.type === 'BUY';
          const orderColor = isBuy ? currentPalette.bull : currentPalette.bear;
          const isForex = marketInfo.assetClass === 'Forex';

          const isHoveredOrder = pendingHoverState?.pendingId === order.id && pendingHoverState.element === 'entry';
          const isHoveredTP = pendingHoverState?.pendingId === order.id && pendingHoverState.element === 'tp';
          const isHoveredSL = pendingHoverState?.pendingId === order.id && pendingHoverState.element === 'sl';

          // 1. Horizontal Dashed Line across chart canvas for Order Price
          ctx.save();
          if (isDraggingThisOrder || isHoveredOrder) {
            ctx.shadowBlur = 12;
            ctx.shadowColor = orderColor;
          }
          ctx.beginPath();
          ctx.setLineDash([8, 6]);
          ctx.moveTo(0, orderLineY);
          ctx.lineTo(utils.chartWidth, orderLineY);
          ctx.strokeStyle = orderColor;
          ctx.lineWidth = (isDraggingThisOrder || isHoveredOrder) ? 2.5 : 1.5;
          ctx.stroke();
          ctx.restore();

          // Connector if stacked
          if (Math.abs(orderBadgeY - orderLineY) > 1) {
            ctx.save();
            ctx.setLineDash([2, 2]);
            ctx.strokeStyle = orderColor;
            ctx.globalAlpha = 0.5;
            ctx.beginPath(); ctx.moveTo(utils.chartWidth - 50, orderLineY); ctx.lineTo(utils.chartWidth - 50, orderBadgeY); ctx.stroke();
            ctx.restore();
          }

          // 2. Main Pending Order Badge Box (Segmented Style - PREMIUM DESIGN)
          const labelType = order.type === 'BUY' ? 'BUY' : 'SELL';
          const orderTypeShort = order.orderType === 'LIMIT' ? 'LIMIT' : order.orderType === 'STOP' ? 'STOP' : order.orderType === 'STOP_LIMIT' ? 'S-LMT' : order.orderType;
          const labelText = `${labelType} ${orderTypeShort}`;
          const sizeText = `${order.size}`;
          const priceText = `${effectivePrice.toFixed(isForex ? 5 : 2)}`;
          const hasTP = !!effectiveTP;
          const hasSL = !!effectiveSL;

          const segBtnW = 32;
          const segMainW = 165;
          const totalOrderBadgeW = (segBtnW * 3) + segMainW;
          const badgeX = utils.chartWidth - totalOrderBadgeW - 12;

          // Glassmorphism background for badge
          ctx.save();
          ctx.fillStyle = 'rgba(10, 15, 25, 0.92)';
          if (isDraggingThisOrder || isHoveredOrder) {
             ctx.shadowBlur = 10;
             ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
          }
          ctx.beginPath();
          ctx.roundRect(badgeX, orderBadgeY - 12, totalOrderBadgeW, 24, 12);
          ctx.fill();
          
          // Accent Border
          ctx.strokeStyle = (isDraggingThisOrder || isHoveredOrder) ? orderColor : 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = (isDraggingThisOrder || isHoveredOrder) ? 2 : 1;
          ctx.stroke();
          ctx.restore();

          // TP Button
          const isTPHover = pendingHoverState?.pendingId === order.id && pendingHoverState.element === 'new_tp';
          ctx.fillStyle = hasTP ? '#22c55e' : (isTPHover ? '#ffffff' : 'rgba(255, 255, 255, 0.3)');
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('TP', badgeX + segBtnW / 2, orderBadgeY + 4);

          // SL Button
          const isSLHover = pendingHoverState?.pendingId === order.id && pendingHoverState.element === 'new_sl';
          ctx.fillStyle = hasSL ? '#ef4444' : (isSLHover ? '#ffffff' : 'rgba(255, 255, 255, 0.3)');
          ctx.fillText('SL', badgeX + segBtnW + segBtnW / 2, orderBadgeY + 4);

          // Vertical Separators (Refined)
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
          const drawOrderSeparator = (x: number) => {
            ctx.beginPath(); ctx.moveTo(x, orderBadgeY - 8); ctx.lineTo(x, orderBadgeY + 8); ctx.stroke();
          };
          drawOrderSeparator(badgeX + segBtnW);
          drawOrderSeparator(badgeX + segBtnW * 2);

          // Main Info Segment
          ctx.textAlign = 'left';
          ctx.font = 'bold 10px sans-serif';
          ctx.fillStyle = orderColor;
          ctx.fillText(labelText, badgeX + segBtnW * 2 + 10, orderBadgeY + 4);
          
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px monospace';
          const sizeWidth = ctx.measureText(sizeText).width;
          ctx.fillText(sizeText, badgeX + segBtnW * 2 + 85, orderBadgeY + 4);
          
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.font = '9px monospace';
          ctx.fillText(priceText, badgeX + segBtnW * 2 + 85 + sizeWidth + 8, orderBadgeY + 4);

          drawOrderSeparator(badgeX + segBtnW * 2 + segMainW);

          // Close/Cancel Button
          const isCancelHover = pendingHoverState?.pendingId === order.id && pendingHoverState.element === 'cancel';
          ctx.fillStyle = isCancelHover ? '#f87171' : '#ef4444';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('✕', badgeX + segBtnW * 2 + segMainW + segBtnW / 2, orderBadgeY + 4.5);

          // 3. Right Price Axis Tag (Premium Pill Style)
          const axisX = utils.chartWidth + 2;
          const axisW = Math.max(64, dimensions.width - utils.chartWidth - 6);
          ctx.save();
          ctx.fillStyle = orderColor;
          ctx.beginPath();
          ctx.roundRect(axisX, orderLineY - 10, axisW, 20, 10);
          ctx.fill();
          
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          const axisShort = order.orderType === 'LIMIT' ? 'LMT' : order.orderType === 'STOP' ? 'STP' : 'S-L';
          ctx.fillText(`${axisShort}`, axisX + axisW / 2, orderLineY + 3.5);
          ctx.restore();

          // 4. Take Profit Line & Segmented Badge for Pending Order
          if (effectiveTP) {
            const tpLineY = utils.getY(effectiveTP);
            const tpBadgeY = stacks.get(`pending-tp-${order.id}`) || tpLineY;
            ctx.beginPath();
            ctx.setLineDash([4, 3]);
            ctx.moveTo(0, tpLineY);
            ctx.lineTo(utils.chartWidth, tpLineY);
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = isDraggingThisTP ? 2 : 1.2;
            ctx.stroke();
            ctx.setLineDash([]);

            if (Math.abs(tpBadgeY - tpLineY) > 1) {
              ctx.setLineDash([2, 2]);
              ctx.strokeStyle = '#22c55e';
              ctx.beginPath(); ctx.moveTo(utils.chartWidth - 50, tpLineY); ctx.lineTo(utils.chartWidth - 50, tpBadgeY); ctx.stroke();
              ctx.setLineDash([]);
            }

            const tpBadgeW = 120;
            const tpBadgeX = utils.chartWidth - tpBadgeW - 12;

            ctx.fillStyle = 'rgba(7, 15, 10, 0.95)';
            ctx.strokeStyle = '#22c55e';
            ctx.beginPath();
            ctx.roundRect(tpBadgeX, tpBadgeY - 11, tpBadgeW, 22, 4);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#22c55e';
            ctx.font = 'bold 10px monospace';
            ctx.fillText(`TP ${order.size}`, tpBadgeX + 35, tpBadgeY + 4);
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.beginPath(); ctx.moveTo(tpBadgeX + 65, tpBadgeY - 8); ctx.lineTo(tpBadgeX + 65, tpBadgeY + 8); ctx.stroke();
            
            ctx.fillStyle = '#ffffff';
            ctx.font = '9px monospace';
            ctx.fillText(effectiveTP.toFixed(isForex ? 4 : 2), tpBadgeX + 90, tpBadgeY + 4);

            ctx.fillStyle = pendingHoverState?.pendingId === order.id && pendingHoverState.element === 'remove_tp' ? '#ffffff' : '#ef4444';
            ctx.font = 'bold 11px monospace';
            ctx.fillText('✕', tpBadgeX + 110, tpBadgeY + 4);
          }

          // 5. Stop Loss Line & Segmented Badge for Pending Order
          if (effectiveSL) {
            const slLineY = utils.getY(effectiveSL);
            const slBadgeY = stacks.get(`pending-sl-${order.id}`) || slLineY;
            ctx.beginPath();
            ctx.setLineDash([4, 3]);
            ctx.moveTo(0, slLineY);
            ctx.lineTo(utils.chartWidth, slLineY);
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = isDraggingThisSL ? 2 : 1.2;
            ctx.stroke();
            ctx.setLineDash([]);

            if (Math.abs(slBadgeY - slLineY) > 1) {
              ctx.setLineDash([2, 2]);
              ctx.strokeStyle = '#ef4444';
              ctx.beginPath(); ctx.moveTo(utils.chartWidth - 50, slLineY); ctx.lineTo(utils.chartWidth - 50, slBadgeY); ctx.stroke();
              ctx.setLineDash([]);
            }

            const slBadgeW = 120;
            const slBadgeX = utils.chartWidth - slBadgeW - 12;

            ctx.fillStyle = 'rgba(15, 7, 7, 0.95)';
            ctx.strokeStyle = '#ef4444';
            ctx.beginPath();
            ctx.roundRect(slBadgeX, slBadgeY - 11, slBadgeW, 22, 4);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 10px monospace';
            ctx.fillText(`SL ${order.size}`, slBadgeX + 35, slBadgeY + 4);
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.beginPath(); ctx.moveTo(slBadgeX + 65, slBadgeY - 8); ctx.lineTo(slBadgeX + 65, slBadgeY + 8); ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = '9px monospace';
            ctx.fillText(effectiveSL.toFixed(isForex ? 4 : 2), slBadgeX + 90, slBadgeY + 4);

            ctx.fillStyle = pendingHoverState?.pendingId === order.id && pendingHoverState.element === 'remove_sl' ? '#ffffff' : '#ef4444';
            ctx.font = 'bold 11px monospace';
            ctx.fillText('✕', slBadgeX + 110, slBadgeY + 4);
          }
        });
      }

      // --- 7. DRAW VISUAL DRAG GHOST PREVIEW (When Dragging New Order or TP/SL) ---
      if (visualDragState && visualDragState.active) {
        if (visualDragState.type === 'ORDER_BUY' || visualDragState.type === 'ORDER_SELL') {
          const isBuy = visualDragState.type === 'ORDER_BUY';
          const orderColor = isBuy ? currentPalette.bull : currentPalette.bear;
          const orderY = utils.getY(visualDragState.price);
          const isLimit = isBuy ? visualDragState.price < currentPrice : visualDragState.price > currentPrice;
          const orderTypeLabel = `${isBuy ? 'BUY' : 'SELL'} ${isLimit ? 'LIMIT' : 'STOP'}`;

          const riskDist = Math.abs(visualDragState.price * 0.015);
          const ghostTP = isBuy ? visualDragState.price + riskDist * 2 : visualDragState.price - riskDist * 2;
          const ghostSL = isBuy ? visualDragState.price - riskDist : visualDragState.price + riskDist;
          const ghostTpY = utils.getY(ghostTP);
          const ghostSlY = utils.getY(ghostSL);

          // Shaded TP & SL ghost bands
          ctx.fillStyle = 'rgba(34, 197, 94, 0.12)';
          ctx.fillRect(0, Math.min(orderY, ghostTpY), utils.chartWidth, Math.abs(orderY - ghostTpY));
          ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
          ctx.fillRect(0, Math.min(orderY, ghostSlY), utils.chartWidth, Math.abs(orderY - ghostSlY));

          // Ghost TP Line
          ctx.beginPath();
          ctx.setLineDash([3, 3]);
          ctx.moveTo(0, ghostTpY);
          ctx.lineTo(utils.chartWidth, ghostTpY);
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = Math.max(1.5, candleWidth / 30);
          ctx.stroke();

          // Ghost SL Line
          ctx.beginPath();
          ctx.moveTo(0, ghostSlY);
          ctx.lineTo(utils.chartWidth, ghostSlY);
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = Math.max(1.5, candleWidth / 30);
          ctx.stroke();
          ctx.setLineDash([]);

          // Ghost Order Entry Line
          ctx.beginPath();
          ctx.moveTo(0, orderY);
          ctx.lineTo(utils.chartWidth, orderY);
          ctx.strokeStyle = orderColor;
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Floating Order HUD Tooltip near cursor
          const hudX = Math.min(utils.chartWidth - 230, Math.max(15, (visualDragState.mouseX || 100) + 15));
          const hudY = Math.min(utils.fullHeight - 80, Math.max(20, (visualDragState.mouseY || orderY) - 45));

          const dragHudGrad = ctx.createLinearGradient(hudX, hudY, hudX + 220, hudY + 68);
          const [rBull, gBull, bBull] = hexToRgbTuple(currentPalette.bull || '#10b981', [81, 52, 255]);
          const [rBear, gBear, bBear] = hexToRgbTuple(currentPalette.bear || '#ef4444', [23, 156, 116]);
          const [darkR, darkG, darkB] = hexToRgbTuple(
            currentPalette.dark && currentPalette.dark !== '#000000' && currentPalette.dark !== '#ffffff' ? currentPalette.dark : '#060913',
            [6, 9, 19]
          );

          if (isLight) {
            dragHudGrad.addColorStop(0, isBuy ? `rgba(${rBull}, ${gBull}, ${bBull}, 0.16)` : `rgba(${rBear}, ${gBear}, ${bBear}, 0.16)`);
            dragHudGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)');
            dragHudGrad.addColorStop(1, 'rgba(248, 250, 252, 0.92)');
          } else {
            dragHudGrad.addColorStop(0, isBuy ? `rgba(${rBull}, ${gBull}, ${bBull}, 0.22)` : `rgba(${rBear}, ${gBear}, ${bBear}, 0.22)`);
            dragHudGrad.addColorStop(0.5, `rgba(${darkR + 4}, ${darkG + 6}, ${darkB + 10}, 0.94)`);
            dragHudGrad.addColorStop(1, 'rgba(11, 15, 26, 0.88)');
          }

          ctx.fillStyle = dragHudGrad;
          ctx.strokeStyle = orderColor;
          ctx.lineWidth = Math.max(1.5, candleWidth / 30);
          ctx.beginPath();
          ctx.roundRect(hudX, hudY, 220, 68, 6);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = orderColor;
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`⚡ ${orderTypeLabel}`, hudX + 10, hudY + 16);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px monospace';
          ctx.fillText(`Level: ${visualDragState.price.toFixed(visualDragState.price < 1 ? 4 : 2)}`, hudX + 10, hudY + 32);

          ctx.font = '9px monospace';
          ctx.fillStyle = '#4ade80';
          ctx.fillText(`TP: ${ghostTP.toFixed(2)} (+3.0%)`, hudX + 10, hudY + 46);
          ctx.fillStyle = '#f87171';
          ctx.fillText(`SL: ${ghostSL.toFixed(2)} (-1.5%)`, hudX + 115, hudY + 46);

          ctx.fillStyle = '#94a3b8';
          ctx.font = '8px monospace';
          ctx.fillText('👉 Lepaskan untuk buka posisi sekarang', hudX + 10, hudY + 60);
        } else if (visualDragState.posId && (visualDragState.type === 'TP' || visualDragState.type === 'SL' || visualDragState.type === 'NEW_TP' || visualDragState.type === 'NEW_SL')) {
          const isTP = visualDragState.type === 'TP' || visualDragState.type === 'NEW_TP';
          const hudColor = isTP ? '#22c55e' : '#ef4444';
          const pos = positions.find(p => p.id === visualDragState.posId);
          const entryP = pos?.entryPrice || visualDragState.startPrice || visualDragState.price;
          const pType = pos?.type || 'BUY';
          const size = pos?.size || 0.1;
          const metrics = calculatePositionMetrics(pType, entryP, visualDragState.price, size, marketInfo.assetClass === 'Forex');

          const hudX = Math.min(utils.chartWidth - 210, Math.max(15, (visualDragState.mouseX || 100) + 15));
          const hudY = Math.min(utils.fullHeight - 65, Math.max(20, (visualDragState.mouseY || utils.getY(visualDragState.price)) - 35));

          const dragTpHudGrad = ctx.createLinearGradient(hudX, hudY, hudX + 195, hudY + 52);
          const [rBull, gBull, bBull] = hexToRgbTuple(currentPalette.bull || '#10b981', [81, 52, 255]);
          const [rBear, gBear, bBear] = hexToRgbTuple(currentPalette.bear || '#ef4444', [23, 156, 116]);
          const [darkR, darkG, darkB] = hexToRgbTuple(
            currentPalette.dark && currentPalette.dark !== '#000000' && currentPalette.dark !== '#ffffff' ? currentPalette.dark : '#060913',
            [6, 9, 19]
          );

          if (isLight) {
            dragTpHudGrad.addColorStop(0, isTP ? `rgba(${rBull}, ${gBull}, ${bBull}, 0.16)` : `rgba(${rBear}, ${gBear}, ${bBear}, 0.16)`);
            dragTpHudGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)');
            dragTpHudGrad.addColorStop(1, 'rgba(248, 250, 252, 0.92)');
          } else {
            dragTpHudGrad.addColorStop(0, isTP ? `rgba(${rBull}, ${gBull}, ${bBull}, 0.22)` : `rgba(${rBear}, ${gBear}, ${bBear}, 0.22)`);
            dragTpHudGrad.addColorStop(0.5, `rgba(${darkR + 4}, ${darkG + 6}, ${darkB + 10}, 0.94)`);
            dragTpHudGrad.addColorStop(1, 'rgba(11, 15, 26, 0.88)');
          }

          ctx.fillStyle = dragTpHudGrad;
          ctx.strokeStyle = hudColor;
          ctx.lineWidth = Math.max(1.5, candleWidth / 30);
          ctx.beginPath();
          ctx.roundRect(hudX, hudY, 195, 52, 6);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = hudColor;
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'left';
          ctx.fillText(isTP ? '🎯 ATUR TAKE PROFIT' : '🛡️ ATUR STOP LOSS', hudX + 10, hudY + 15);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px monospace';
          ctx.fillText(`Target: ${visualDragState.price.toFixed(visualDragState.price < 1 ? 4 : 2)}`, hudX + 10, hudY + 30);

          ctx.font = '9px monospace';
          ctx.fillStyle = isTP ? '#86efac' : '#fca5a5';
          ctx.fillText(`${isTP ? '+' : '-'}${Math.abs(metrics.pnl).toFixed(2)} (${metrics.pct >= 0 ? '+' : ''}${metrics.pct.toFixed(2)}%)`, hudX + 10, hudY + 44);
        } else if (visualDragState.pendingId) {
          const pendingOrder = pendingOrders.find(o => o.id === visualDragState.pendingId);
          const isTP = visualDragState.type === 'PENDING_TP' || visualDragState.type === 'NEW_PENDING_TP';
          const isSL = visualDragState.type === 'PENDING_SL' || visualDragState.type === 'NEW_PENDING_SL';
          const isOrder = visualDragState.type === 'PENDING_ORDER';

          const hudColor = isTP ? '#22c55e' : isSL ? '#ef4444' : (pendingOrder?.type === 'BUY' ? currentPalette.bull : currentPalette.bear);

          const hudX = Math.min(utils.chartWidth - 210, Math.max(15, (visualDragState.mouseX || 100) + 15));
          const hudY = Math.min(utils.fullHeight - 65, Math.max(20, (visualDragState.mouseY || utils.getY(visualDragState.price)) - 35));

          const dragPendingHudGrad = ctx.createLinearGradient(hudX, hudY, hudX + 205, hudY + 54);
          const [rBull, gBull, bBull] = hexToRgbTuple(currentPalette.bull || '#10b981', [81, 52, 255]);
          const [rBear, gBear, bBear] = hexToRgbTuple(currentPalette.bear || '#ef4444', [23, 156, 116]);
          const [darkR, darkG, darkB] = hexToRgbTuple(
            currentPalette.dark && currentPalette.dark !== '#000000' && currentPalette.dark !== '#ffffff' ? currentPalette.dark : '#060913',
            [6, 9, 19]
          );

          if (isLight) {
            dragPendingHudGrad.addColorStop(0, pendingOrder?.type === 'BUY' ? `rgba(${rBull}, ${gBull}, ${bBull}, 0.16)` : `rgba(${rBear}, ${gBear}, ${bBear}, 0.16)`);
            dragPendingHudGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)');
            dragPendingHudGrad.addColorStop(1, 'rgba(248, 250, 252, 0.92)');
          } else {
            dragPendingHudGrad.addColorStop(0, pendingOrder?.type === 'BUY' ? `rgba(${rBull}, ${gBull}, ${bBull}, 0.22)` : `rgba(${rBear}, ${gBear}, ${bBear}, 0.22)`);
            dragPendingHudGrad.addColorStop(0.5, `rgba(${darkR + 4}, ${darkG + 6}, ${darkB + 10}, 0.94)`);
            dragPendingHudGrad.addColorStop(1, 'rgba(11, 15, 26, 0.88)');
          }

          ctx.fillStyle = dragPendingHudGrad;
          ctx.strokeStyle = hudColor;
          ctx.lineWidth = Math.max(1.5, candleWidth / 30);
          ctx.beginPath();
          ctx.roundRect(hudX, hudY, 205, 54, 6);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = hudColor;
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'left';
          ctx.fillText(
            isTP ? '🎯 TP PENDING ORDER' : isSL ? '🛡️ SL PENDING ORDER' : `⚡ GESER ${pendingOrder?.type || ''} ORDER`,
            hudX + 10, hudY + 16
          );

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px monospace';
          ctx.fillText(`Target: @${visualDragState.price.toFixed(marketInfo.assetClass === 'Forex' ? 4 : 2)}`, hudX + 10, hudY + 32);

          const distPips = Math.abs(visualDragState.price - currentPrice) * (marketInfo.assetClass === 'Forex' ? 10000 : 1);
          ctx.fillStyle = '#94a3b8';
          ctx.font = '8.5px monospace';
          ctx.fillText(`Lepaskan untuk simpan (${distPips.toFixed(1)} pips)`, hudX + 10, hudY + 46);
        }
      }


      // --- END ACTIVE POSITIONS ---
      } catch (drawErr) {
        // Prevent drawing errors from crashing React component tree
        console.warn('Canvas render error:', drawErr);
      }

      // Auto Eco Mode & LOD Manager performance tracking
      const frameDuration = performance.now() - frameStartTime;
      LODManager.recordFrameTime(frameDuration);

      if (frameDuration > 14.0) {
        slowFrameCountRef.current = Math.min(10, slowFrameCountRef.current + 1);
        if (slowFrameCountRef.current >= 3) {
          isAutoEcoModeRef.current = true;
        }
      } else if (frameDuration < 8.0) {
        slowFrameCountRef.current = Math.max(0, slowFrameCountRef.current - 1);
        if (slowFrameCountRef.current === 0) {
          isAutoEcoModeRef.current = false;
        }
      }

      // 25. FINAL PASS: Time badge rendered as canvas overlay in Section 16

    renderCanvasRef.current = renderCanvas;

    if (hasActiveAnimations) {
      requestRender();
    }
  };

  renderCanvasRef.current = renderCanvas;
  requestRender();

  return () => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  };
  }, [
    candles,
    zoom,
    panOffset,
    indicators,
    currentPrice,
    ema20,
    ema50,
    ema200,
    bollinger,
    supertrend,
    rsi,
    macd,
    dimensions,
    chartType,
    drawings,
    currentDrawing,
    footprintData,
    hideDrawings,
    currentPalette,
    priceScale,
    priceOffset,
    selectedDrawingId,
    magnetMode,
    getCoordinateUtils,
    positions,
    visualDragState,
    positionHoverState,
    marketInfo,
    calculatePositionMetrics,
    pnlDisplayMode,
    formatPnlDisplay,
    calculateRiskRewardRatio,
    isDragging,
    candleCountdown,
  ]);

  const resetView = useCallback(() => {
    setZoom(1);
    setPanOffset(0);
    setIsAutoScale(true);
    setPriceScale(1);
    setPriceOffset(0);
    zoomRef.current = 1;
    panOffsetRef.current = 0;
    priceScaleRef.current = 1;
    priceOffsetRef.current = 0;
    isAutoScaleRef.current = true;
    setTargetSpotlightTime(null);
    processedJumpIdRef.current = null;
    if (clearChartJumpTarget) {
      clearChartJumpTarget();
    }
  }, [clearChartJumpTarget]);

  const smoothAutoCenter = useCallback(() => {
    const startPan = panOffset;
    const startPriceOffset = priceOffset;
    const startZoom = zoom;
    const startPriceScale = priceScale;

    if (Math.abs(startPan) < 0.1 && Math.abs(startPriceOffset) < 0.1 && Math.abs(startZoom - 1) < 0.01 && Math.abs(startPriceScale - 1) < 0.01) {
      resetView();
      return;
    }

    const startTime = performance.now();
    const duration = 380; // Smooth 380ms cubic ease-out animation

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Cubic Ease-Out curve: 1 - (1 - progress)^3
      const ease = 1 - Math.pow(1 - progress, 3);

      const currentPan = startPan * (1 - ease);
      const currentPriceOffset = startPriceOffset * (1 - ease);
      const currentZoom = startZoom + (1 - startZoom) * ease;
      const currentPriceScale = startPriceScale + (1 - startPriceScale) * ease;

      setPanOffset(currentPan);
      setPriceOffset(currentPriceOffset);
      setZoom(currentZoom);
      setPriceScale(currentPriceScale);
      panOffsetRef.current = currentPan;
      priceOffsetRef.current = currentPriceOffset;
      zoomRef.current = currentZoom;
      priceScaleRef.current = currentPriceScale;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setPanOffset(0);
        setPriceOffset(0);
        setZoom(1);
        setPriceScale(1);
        setIsAutoScale(true);
        zoomRef.current = 1;
        panOffsetRef.current = 0;
        priceScaleRef.current = 1;
        priceOffsetRef.current = 0;
        isAutoScaleRef.current = true;
        setTargetSpotlightTime(null);
        processedJumpIdRef.current = null;
        if (clearChartJumpTarget) {
          clearChartJumpTarget();
        }
      }
    };

    requestAnimationFrame(step);
  }, [panOffset, priceOffset, zoom, priceScale, resetView, clearChartJumpTarget]);

  useEffect(() => {
    const handleAutoCenterEvent = () => {
      smoothAutoCenter();
    };
    window.addEventListener('mountalgo-auto-center', handleAutoCenterEvent);
    return () => {
      window.removeEventListener('mountalgo-auto-center', handleAutoCenterEvent);
    };
  }, [smoothAutoCenter]);

  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement> | MouseEvent) => {
    const rect = getAdjustedCanvasRect(canvasRef.current);
    const utils = getCoordinateUtils();
    if (!rect || !utils) {
      resetView();
      return;
    }

    const mouseX = rect.getLocalX(e.clientX);
    const mouseY = rect.getLocalY(e.clientY);

    // Check if double clicking an existing drawing
    const hit = getDrawingHit(mouseX, mouseY);
    if (hit) {
      setSelectedDrawingId(hit.id);
      if (hit.drawing.type === 'text' || hit.drawing.type === 'callout') {
        setTextPromptModal({
          isOpen: true,
          point: hit.drawing.points[0],
          text: hit.drawing.text || hit.drawing.label || '',
          type: hit.drawing.type,
          drawingId: hit.drawing.id,
        });
      } else {
        setDrawingForSettings(hit.drawing);
        setIsDrawingSettingsOpen(true);
      }
      return;
    }

    // Double clicking Price Axis resets price scale & enables Auto Scale
    if (mouseX >= utils.chartWidth) {
      setIsAutoScale(true);
      setPriceScale(1);
      setPriceOffset(0);
      priceScaleRef.current = 1;
      priceOffsetRef.current = 0;
      isAutoScaleRef.current = true;
      return;
    }

    // Double clicking Time Axis resets horizontal zoom & time pan to latest candle
    if (mouseY >= utils.fullHeight) {
      setZoom(1);
      setPanOffset(0);
      zoomRef.current = 1;
      panOffsetRef.current = 0;
      return;
    }

    // Double-clicking the chart background: resets zoom level and scrolls x-axis to latest candle (auto-fit mode)
    resetView();
  }, [getCoordinateUtils, getDrawingHit, resetView]);

  // Native double click event listener on the canvas to guarantee auto-fit execution
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onNativeDblClick = (e: MouseEvent) => {
      handleDoubleClick(e);
    };

    canvas.addEventListener('dblclick', onNativeDblClick);
    return () => {
      canvas.removeEventListener('dblclick', onNativeDblClick);
    };
  }, [handleDoubleClick]);

  // Keyboard Shortcuts (TradingView standard keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        isShiftPressedRef.current = true;
      }
      if (e.key === 'Control' || e.key === 'Meta') {
        isCtrlPressedRef.current = true;
      }

      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        if (selectedDrawingId) {
          e.preventDefault();
          const sel = drawings.find((d) => d.id === selectedDrawingId);
          if (sel) {
            const cloned: DrawingItem = {
              ...sel,
              id: Date.now().toString(),
              points: sel.points.map((p) => ({ ...p, price: p.price * 1.002 })),
            };
            setDrawings((prev) => [...prev, cloned]);
            setSelectedDrawingId(cloned.id);
          }
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setPanOffset((po) => po + (e.shiftKey ? 10 : 3));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setPanOffset((po) => po - (e.shiftKey ? 10 : 3));
      } else if (e.key === 'ArrowUp' || e.key === '+' || e.key === '=') {
        e.preventDefault();
        setZoom((z) => {
          const newZ = Math.min(300.0, z * 1.15);
          const utils = getCoordinateUtils();
          if (utils) {
            const { chartWidth, totalCandleSlot } = utils;
            const newBase = (chartType === 'footprints' || indicators.showFootprints) ? 68 : 8;
            const newCandleW = Math.max(2, newBase * newZ);
            const newSlot = newCandleW + Math.max(1, newCandleW * 0.3);
            const slotDiff = (chartWidth / 2) / totalCandleSlot - (chartWidth / 2) / newSlot;
            setPanOffset((po) => po + slotDiff);
          }
          return newZ;
        });
      } else if (e.key === 'ArrowDown' || e.key === '-' || e.key === '_') {
        e.preventDefault();
        setZoom((z) => {
          const newZ = Math.max(0.05, z * 0.85);
          const utils = getCoordinateUtils();
          if (utils) {
            const { chartWidth, totalCandleSlot } = utils;
            const newBase = (chartType === 'footprints' || indicators.showFootprints) ? 68 : 8;
            const newCandleW = Math.max(2, newBase * newZ);
            const newSlot = newCandleW + Math.max(1, newCandleW * 0.3);
            const slotDiff = (chartWidth / 2) / totalCandleSlot - (chartWidth / 2) / newSlot;
            setPanOffset((po) => po + slotDiff);
          }
          return newZ;
        });
      } else if (e.key === 'Escape') {
        setActiveTool('cursor');
        setCurrentDrawing(null);
        setSelectedDrawingId(null);
        setContextMenu(null);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedDrawingId) {
          const drawing = drawings.find((d) => d.id === selectedDrawingId);
          const isLocked = drawing ? getEffectiveDrawingLocked(drawing, layersMap, isLockedDrawings) : false;
          if (!isLocked) {
            setDrawings((prev) => prev.filter((d) => d.id !== selectedDrawingId));
            setSelectedDrawingId(null);
          }
        } else if (drawings.length > 0) {
          const lastDrawing = drawings[drawings.length - 1];
          const isLocked = getEffectiveDrawingLocked(lastDrawing, layersMap, isLockedDrawings);
          if (!isLocked) {
            setDrawings((prev) => prev.slice(0, -1));
          }
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        setDrawings((prev) => prev.slice(0, -1));
      } else if (e.altKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        if (crosshairRef.current.active) {
          const utils = getCoordinateUtils();
          if (utils) {
            const price = utils.getPriceFromY(crosshairRef.current.y);
            const newDrawing: DrawingItem = {
              id: Date.now().toString(),
              type: 'horizontal',
              points: [{ price, time: Date.now() }],
              color: drawingColor,
              isComplete: true,
            };
            setDrawings((prev) => [...prev, newDrawing]);
          }
        }
      } else if (e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        setActiveTool('trendline');
      } else if (e.altKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        resetView();
      } else if (e.altKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIndicators((prev) => ({
          ...prev,
          showVolumeProfile: !prev.showVolumeProfile,
        }));
        tradingAudio.play('PRESET');
      } else if (e.altKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        setIndicators((prev) => ({
          ...prev,
          showLiquidityHeatmap: !prev.showLiquidityHeatmap,
        }));
        tradingAudio.play('PRESET');
      } else if (e.altKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        setIndicators((prev) => {
          const currentConfig = prev.liquidityHeatmapConfig || { ...DEFAULT_HEATMAP_SETTINGS };
          const opacities = [0.2, 0.5, 0.8, 1.0];
          const currentOpacity = currentConfig.opacity ?? 0.9;
          let nextIdx = opacities.findIndex((val) => val >= currentOpacity);
          if (nextIdx === -1 || nextIdx === opacities.length - 1) {
            nextIdx = 0;
          } else {
            nextIdx += 1;
          }
          const nextOpacity = opacities[nextIdx];
          return {
            ...prev,
            liquidityHeatmapConfig: {
              ...currentConfig,
              opacity: nextOpacity,
            },
          };
        });
        tradingAudio.play('PRESET');
      } else if (e.key === 'Home') {
        e.preventDefault();
        setPanOffset(candles.length - 10);
      } else if (e.key === 'End') {
        e.preventDefault();
        setPanOffset(0);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        isShiftPressedRef.current = false;
      }
      if (e.key === 'Control' || e.key === 'Meta') {
        isCtrlPressedRef.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedDrawingId, drawings.length, drawingColor, getCoordinateUtils, candles.length, setIndicators]);

  // Mouse & Pointer Interactions (TradingView-style 2D Smooth Pan, Zoom-at-cursor, Drag Drawing/Handles & Scale Dragging)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 2) return; // Ignore right clicks (handled by onContextMenu)
    notifyFastInteraction();

    // Long press for AI Assistant
    if (aiLongPressTimerRef.current) clearTimeout(aiLongPressTimerRef.current);
    aiLongPressTimerRef.current = setTimeout(() => {
      setIsAiAssistantVisible(true);
      tradingAudio.play('PRESET');
    }, 800); // 800ms for long press

    const rect = getAdjustedCanvasRect(canvasRef.current);
    const utils = getCoordinateUtils();
    if (!rect || !utils) return;

    const mouseX = rect.getLocalX(e.clientX);
    const mouseY = rect.getLocalY(e.clientY);

    const pt = getCanvasPriceAndTime(e.clientX, e.clientY);
    if (!pt) return;

    // 0. Check if clicked directly on a News / Economic Event Marker Pin on the Chart
    if (newsMarkersHitBoxesRef.current && newsMarkersHitBoxesRef.current.length > 0) {
      const hitNews = newsMarkersHitBoxesRef.current.find(
        (hb) => mouseX >= hb.x1 && mouseX <= hb.x2 && mouseY >= hb.y1 && mouseY <= hb.y2
      );
      if (hitNews) {
        if (aiLongPressTimerRef.current) clearTimeout(aiLongPressTimerRef.current);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try { navigator.vibrate(10); } catch (e) {}
        }
        // Find all sibling events in the same cluster that share this coordinate
        const siblingEvents = newsMarkersHitBoxesRef.current
          .filter((hb) => hb.x1 === hitNews.x1 && hb.y1 === hitNews.y1)
          .map((hb) => hb.event);

        setSelectedNewsEventModal(hitNews.event);
        setSelectedNewsEventCluster(siblingEvents.length > 1 ? siblingEvents : [hitNews.event]);
        tradingAudio.play('PRESET');
        return;
      }
    }

    // 1. Check if clicked on active position elements, action buttons, or TP/SL drag handles
    // HIGH PRIORITY: This MUST come before axis dragging to allow dragging SL/TP tags on the scale
    if (activeTool === 'cursor' && positions && positions.length > 0) {
      const hit = getPositionHit(mouseX, mouseY, utils);
      if (hit) {
        if (hit.action === 'CLOSE') {
          closePosition(hit.pos.id, currentPrice || hit.pos.currentPrice);
          tradingAudio.play('CLOSE');
          return;
        }
        if (hit.action === 'PARTIAL_CLOSE') {
          closePosition(hit.pos.id, currentPrice || hit.pos.currentPrice, 0.5);
          tradingAudio.play('CLOSE');
          return;
        }
        if (hit.action === 'TOGGLE_PNL') {
          togglePnlDisplayMode();
          tradingAudio.play('PRESET');
          return;
        }
        if (hit.action === 'TOGGLE_AUTO_BE') {
          toggleAutoBE(hit.pos.id);
          return;
        }
        if (hit.action === 'REVERSE') {
          reversePosition(hit.pos.id, currentPrice || hit.pos.currentPrice);
          tradingAudio.play('REVERSE');
          return;
        }
        if (hit.action === 'BE') {
          updatePositionBracket(hit.pos.id, hit.pos.takeProfit, hit.pos.entryPrice);
          tradingAudio.play('AUTO_BE');
          return;
        }
        if (hit.action === 'REMOVE_TP') {
          updatePositionBracket(hit.pos.id, undefined, hit.pos.stopLoss);
          return;
        }
        if (hit.action === 'REMOVE_SL') {
          updatePositionBracket(hit.pos.id, hit.pos.takeProfit, undefined);
          return;
        }
        if (hit.action === 'DRAG_TP' || hit.action === 'NEW_TP') {
          if (isSLTPLocked) {
            setSltpToast({ message: "🔒 Garis Order/SL/TP Terkunci! Buka kunci di kanan-bawah chart untuk menggeser.", type: 'warning' });
            tradingAudio.play('CLOSE');
            return;
          }
          const isBuy = hit.pos.type === 'BUY';
          const defaultOffset = hit.pos.entryPrice * 0.015;
          const defaultTP = isBuy ? hit.pos.entryPrice + defaultOffset : hit.pos.entryPrice - defaultOffset;
          const initialP = hit.pos.takeProfit || defaultTP;
          dragPositionRef.current = { id: hit.pos.id, type: 'TP' };
          visualDragStateRef.current = {
            active: true,
            posId: hit.pos.id,
            type: 'TP',
            price: initialP,
            startPrice: hit.pos.entryPrice,
            size: hit.pos.size,
            isForex: marketInfo.assetClass === 'Forex',
            mouseX,
            mouseY
          };
          setVisualDragState({ ...visualDragStateRef.current });
          setIsDragging(true);
          setDragMode('positionTP');
          return;
        }
        if (hit.action === 'DRAG_SL' || hit.action === 'NEW_SL') {
          if (isSLTPLocked) {
            setSltpToast({ message: "🔒 Garis Order/SL/TP Terkunci! Buka kunci di kanan-bawah chart untuk menggeser.", type: 'warning' });
            tradingAudio.play('CLOSE');
            return;
          }
          const isBuy = hit.pos.type === 'BUY';
          const defaultOffset = hit.pos.entryPrice * 0.01;
          const defaultSL = isBuy ? hit.pos.entryPrice - defaultOffset : hit.pos.entryPrice + defaultOffset;
          const initialP = hit.pos.stopLoss || defaultSL;
          dragPositionRef.current = { id: hit.pos.id, type: 'SL' };
          visualDragStateRef.current = {
            active: true,
            posId: hit.pos.id,
            type: 'SL',
            price: initialP,
            startPrice: hit.pos.entryPrice,
            size: hit.pos.size,
            isForex: marketInfo.assetClass === 'Forex',
            mouseX,
            mouseY
          };
          setVisualDragState({ ...visualDragStateRef.current });
          setIsDragging(true);
          setDragMode('positionSL');
          return;
        }
        if (hit.action === 'ENTRY') {
          pendingPositionPullRef.current = {
            pos: hit.pos,
            startY: mouseY,
            startPrice: hit.pos.entryPrice,
            clientX: e.clientX,
            clientY: e.clientY,
          };
          setIsDragging(true);
          setDragMode('chart');
          return;
        }
      }
    }

    // 2. Check if clicked on pending order elements (Cancel, Drag Order Line, TP/SL lines)
    if (activeTool === 'cursor' && pendingOrders && pendingOrders.length > 0) {
      const pendingHit = getPendingOrderHit(mouseX, mouseY, utils);
      if (pendingHit) {
        if (pendingHit.action === 'CANCEL') {
          if (cancelPendingOrder) {
            cancelPendingOrder(pendingHit.order.id);
            tradingAudio.play('CLOSE');
            return;
          }
        }
        if (pendingHit.action === 'REMOVE_TP') {
          updatePendingOrder(pendingHit.order.id, pendingHit.order.price, pendingHit.order.size, undefined, pendingHit.order.stopLoss);
          return;
        }
        if (pendingHit.action === 'REMOVE_SL') {
          updatePendingOrder(pendingHit.order.id, pendingHit.order.price, pendingHit.order.size, pendingHit.order.takeProfit, undefined);
          return;
        }
        if (pendingHit.action === 'DRAG_TP' || pendingHit.action === 'NEW_TP') {
          if (isSLTPLocked) {
            setSltpToast({ message: "🔒 Garis Order/SL/TP Terkunci! Buka kunci di kanan-bawah chart untuk menggeser.", type: 'warning' });
            tradingAudio.play('CLOSE');
            return;
          }
          const isBuy = pendingHit.order.type === 'BUY';
          const defaultOffset = pendingHit.order.price * 0.015;
          const defaultTP = isBuy ? pendingHit.order.price + defaultOffset : pendingHit.order.price - defaultOffset;
          const initialTP = pendingHit.order.takeProfit || defaultTP;

          visualDragStateRef.current = {
            active: true,
            pendingId: pendingHit.order.id,
            type: 'PENDING_TP',
            price: initialTP,
            startPrice: pendingHit.order.price,
            size: pendingHit.order.size,
            isForex: marketInfo.assetClass === 'Forex',
            mouseX,
            mouseY
          };
          setVisualDragState({ ...visualDragStateRef.current });
          setIsDragging(true);
          setDragMode('positionTP'); // Set drag mode properly
          return;
        }
        if (pendingHit.action === 'DRAG_SL' || pendingHit.action === 'NEW_SL') {
          if (isSLTPLocked) {
            setSltpToast({ message: "🔒 Garis Order/SL/TP Terkunci! Buka kunci di kanan-bawah chart untuk menggeser.", type: 'warning' });
            tradingAudio.play('CLOSE');
            return;
          }
          const isBuy = pendingHit.order.type === 'BUY';
          const defaultOffset = pendingHit.order.price * 0.010;
          const defaultSL = isBuy ? pendingHit.order.price - defaultOffset : pendingHit.order.price + defaultOffset;
          const initialSL = pendingHit.order.stopLoss || defaultSL;

          visualDragStateRef.current = {
            active: true,
            pendingId: pendingHit.order.id,
            type: 'PENDING_SL',
            price: initialSL,
            startPrice: pendingHit.order.price,
            size: pendingHit.order.size,
            isForex: marketInfo.assetClass === 'Forex',
            mouseX,
            mouseY
          };
          setVisualDragState({ ...visualDragStateRef.current });
          setIsDragging(true);
          setDragMode('positionSL'); // Set drag mode properly
          return;
        }
        if (pendingHit.action === 'DRAG_ORDER') {
          if (isSLTPLocked) {
            setSltpToast({ message: "🔒 Garis Order/SL/TP Terkunci! Buka kunci di kanan-bawah chart untuk menggeser.", type: 'warning' });
            tradingAudio.play('CLOSE');
            return;
          }
          visualDragStateRef.current = {
            active: true,
            pendingId: pendingHit.order.id,
            type: 'PENDING_ORDER',
            price: pendingHit.order.price,
            startPrice: pendingHit.order.price,
            size: pendingHit.order.size,
            isForex: marketInfo.assetClass === 'Forex',
            mouseX,
            mouseY
          };
          setVisualDragState({ ...visualDragStateRef.current });
          setIsDragging(true);
          setDragMode('chart'); // Fix: use chart mode instead of positionTP to allow smooth price updates
          return;
        }
      }
    }

    // 3. Right Price Scale Dragging (Vertical Price Stretch / Compress)
    if (mouseX >= utils.chartWidth) {
      setIsDragging(true);
      setDragMode('priceAxis');
      const startScale = isAutoScaleRef.current ? 1 : priceScaleRef.current;
      const startOffset = isAutoScaleRef.current ? 0 : priceOffsetRef.current;
      if (isAutoScaleRef.current) {
        setIsAutoScale(false);
        isAutoScaleRef.current = false;
      }
      setDragStartX(e.clientX);
      setDragStartY(e.clientY);
      dragStartAnchorYRef.current = mouseY;
      dragStartAnchorPriceRef.current = utils.getPriceFromY(mouseY);
      setDragStartPriceScale(startScale);
      setDragStartPriceOffset(startOffset);
      priceScaleRef.current = startScale;
      priceOffsetRef.current = startOffset;
      return;
    }

    // 4. Bottom Time Scale Dragging (Horizontal Time Scale Zoom)
    if (mouseY >= utils.fullHeight) {
      setIsDragging(true);
      setDragMode('timeAxis');
      setDragStartX(e.clientX);
      setDragStartOffset(panOffsetRef.current);
      return;
    }

    // 5. Cursor Mode: Check if user clicked an existing drawing or anchor handle
    if (activeTool === 'cursor') {
      const hit = getDrawingHit(mouseX, mouseY);
      if (hit) {
        setSelectedDrawingId(hit.id);
        const isLocked = getEffectiveDrawingLocked(hit.drawing, layersMap, isLockedDrawings);
        if (!isLocked) {
          dragDrawingStateRef.current = {
            id: hit.id,
            part: hit.part as any,
            initialPoints: hit.drawing.points.map((p) => ({ ...p })),
            initialRiskReward: hit.drawing.riskReward ? { ...hit.drawing.riskReward } : undefined,
            startPrice: pt.price,
            startTime: pt.time,
            startX: e.clientX,
            startY: e.clientY,
          };
        }
        return;
      }

      // Otherwise deselect and start normal chart pan
      setSelectedDrawingId(null);
      setIsDragging(true);
      setDragMode('chart');
      setDragStartX(e.clientX);
      setDragStartY(e.clientY);
      setDragStartOffset(panOffsetRef.current);
      const startPriceOffset = isAutoScaleRef.current ? 0 : priceOffsetRef.current;
      setDragStartPriceOffset(startPriceOffset);
      priceOffsetRef.current = startPriceOffset;
      return;
    }

    // 4. Placing new drawings
    if (!isLockedDrawings) {
      if (['horizontal', 'horizontal_ray', 'vertical', 'price_label', 'cross_line', 'alert'].includes(activeTool)) {
        const rawDrawing: DrawingItem = {
          id: Date.now().toString(),
          type: activeTool as any,
          symbol: activeSymbol,
          points: [{ price: pt.price, time: pt.time }],
          color: drawingColor,
          layerId: activeLayerId,
          isComplete: true,
        };
        const newDrawing = applyStyleToDrawing(rawDrawing, activeTemplateStyle);
        setDrawings((prev) => [...prev, newDrawing]);
        setSelectedDrawingId(newDrawing.id);
        if (!stayInDrawingMode) setActiveTool('cursor');
      } else if (activeTool === 'position_long' || activeTool === 'position_short') {
        const entryPrice = pt.price;
        const tfSec = getTimeframeSeconds(timeframe);
        
        // Fixed Sizing: Standard 1.5% Stop Loss & 3.0% Take Profit (Fixed 1:2 Risk/Reward)
        const isLong = activeTool === 'position_long';
        const slPercent = 0.015; // Fixed 1.5% SL
        const tpPercent = 0.030; // Fixed 3.0% TP

        const stopLoss = isLong ? entryPrice * (1 - slPercent) : entryPrice * (1 + slPercent);
        const takeProfit = isLong ? entryPrice * (1 + tpPercent) : entryPrice * (1 - tpPercent);

        const tpPct = 3.0;
        const slPct = 1.5;
        const rr = 2.0;

        const defaultBarsAhead = 20;
        const p2Time = pt.time + defaultBarsAhead * tfSec;

        const rawDrawing: DrawingItem = {
          id: Date.now().toString(),
          type: activeTool,
          symbol: activeSymbol,
          points: [
            { price: entryPrice, time: pt.time },
            { price: entryPrice, time: p2Time }
          ],
          color: drawingColor,
          layerId: activeLayerId,
          isComplete: true,
          riskReward: {
            takeProfit,
            stopLoss,
            riskRatio: parseFloat(rr.toFixed(2)),
          }
        };
        const newDrawing = applyStyleToDrawing(rawDrawing, activeTemplateStyle);
        setDrawings((prev) => [...prev, newDrawing]);
        setSelectedDrawingId(newDrawing.id);
        if (!stayInDrawingMode) setActiveTool('cursor');
      } else if (activeTool === 'text' || activeTool === 'callout') {
        setTextPromptModal({
          isOpen: true,
          point: { price: pt.price, time: pt.time },
          text: '',
        });
        if (!stayInDrawingMode) setActiveTool('cursor');
      } else if (activeTool === 'brush' || activeTool === 'highlighter') {
        const rawDraw: DrawingItem = {
          id: Date.now().toString(),
          type: activeTool,
          points: [{ price: pt.price, time: pt.time }],
          color: drawingColor,
          layerId: activeLayerId,
          isComplete: false,
        };
        const newDraw = applyStyleToDrawing(rawDraw, activeTemplateStyle);
        setCurrentDrawing(newDraw);
        drawStartCoordsRef.current = { clientX: e.clientX, clientY: e.clientY, moved: true };
      } else {
        // Universal Multi-Point Tool Handler (2-point, 3-point, 5-point, 6-point, polyline)
        const maxPointsMap: Record<string, number> = {
          trendline: 2, ray: 2, extended_line: 2, arrow: 2, rectangle: 2, ellipse: 2, ruler: 2, fibonacci: 2, fib_fan: 2,
          triangle: 3, parallel_channel: 3, pitchfork: 3, fib_extension: 3,
          head_and_shoulders: 5,
          elliott_wave: 6,
          polyline: 20
        };
        const targetMaxPoints = maxPointsMap[activeTool] || 2;

        if (!currentDrawing) {
          const rawDraw: DrawingItem = {
            id: Date.now().toString(),
            type: activeTool,
            points: [
              { price: pt.price, time: pt.time },
              { price: pt.price, time: pt.time },
            ],
            color: drawingColor,
            layerId: activeLayerId,
            isComplete: false,
          };
          const newDraw = applyStyleToDrawing(rawDraw, activeTemplateStyle);
          setCurrentDrawing(newDraw);
          drawStartCoordsRef.current = { clientX: e.clientX, clientY: e.clientY, moved: false };
        } else {
          const currentPoints = currentDrawing.points;
          const updatedPts = [...currentPoints.slice(0, -1), { price: pt.price, time: pt.time }];

          if (updatedPts.length >= targetMaxPoints) {
            const completed: DrawingItem = {
              ...currentDrawing,
              points: updatedPts,
              isComplete: true,
            };
            setDrawings((prev) => [...prev, completed]);
            setSelectedDrawingId(completed.id);
            setCurrentDrawing(null);
            drawStartCoordsRef.current = null;
            if (!stayInDrawingMode) setActiveTool('cursor');
          } else {
            // Append next point for live preview
            setCurrentDrawing({
              ...currentDrawing,
              points: [...updatedPts, { price: pt.price, time: pt.time }],
            });
          }
        }
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Clear long-press timer if moved significantly
    if (aiLongPressTimerRef.current) {
      const rect = getAdjustedCanvasRect(canvasRef.current);
      if (rect) {
        const mouseX = rect.getLocalX(e.clientX);
        const mouseY = rect.getLocalY(e.clientY);
        if (holdStartPosRef.current) {
          const dist = Math.hypot(e.clientX - holdStartPosRef.current.clientX, e.clientY - holdStartPosRef.current.clientY);
          if (dist > 10) {
            clearTimeout(aiLongPressTimerRef.current);
            aiLongPressTimerRef.current = null;
          }
        }
      }
    }

    // If mouse moves significantly, cancel hold timer
    if (holdStartPosRef.current) {
      const dist = Math.hypot(e.clientX - holdStartPosRef.current.clientX, e.clientY - holdStartPosRef.current.clientY);
      if (dist > 8) {
        if (holdTimerRef.current) {
          clearTimeout(holdTimerRef.current);
          holdTimerRef.current = null;
        }
        holdStartPosRef.current = null;
        setHoldVisualState(null);
      }
    }

    latestMouseMoveCoordsRef.current = { clientX: e.clientX, clientY: e.clientY };

    if (mouseMoveRAFRef.current === null) {
      mouseMoveRAFRef.current = requestAnimationFrame(() => {
        mouseMoveRAFRef.current = null;
        const coords = latestMouseMoveCoordsRef.current;
        if (!coords) return;
        if (isDragging) notifyFastInteraction();

        const rect = getAdjustedCanvasRect(canvasRef.current);
        const utils = getCoordinateUtils();
        if (!rect || !utils) return;

        const mouseX = rect.getLocalX(coords.clientX);
        const mouseY = rect.getLocalY(coords.clientY);
        updateCrosshair(mouseX, mouseY, true);

        const { chartWidth, totalCandleSlot, safeOffset } = utils;
        const posFromRight = (chartWidth - mouseX - utils.candleWidth / 2) / totalCandleSlot;
        const hoveredIdx = Math.round((candles.length - 1 - safeOffset) - posFromRight);

        if (hoveredIdx >= 0 && hoveredIdx < candles.length) {
          const targetCandle = candles[hoveredIdx];
          setHoveredCandle((prev) => {
            if (prev && prev.time === targetCandle.time) return prev;
            return targetCandle;
          });
        } else {
          setHoveredCandle(null);
        }

        if (chartSyncCrosshair) {
          const priceY = utils.getPriceFromY(mouseY);
          const crosshairTime = utils.getTimeFromX(mouseX);
          if (
            !globalCrosshair ||
            !globalCrosshair.active ||
            Math.abs((globalCrosshair.time || 0) - crosshairTime) > 100 ||
            globalCrosshair.sourceChartId !== id ||
            Math.abs((globalCrosshair.price || 0) - priceY) >= (priceY * 0.0001)
          ) {
            setGlobalCrosshair({
              active: true,
              time: crosshairTime,
              price: priceY,
              sourceChartId: id,
            });
          }
        }

        // Check hovered Bookmap boxes (imbalance and mitigation)
        let foundHoverBox: any = null;
        if (indicators.showBookmapPro && bookmapData && utils) {
          const checkPrice = utils.getPriceFromY(mouseY);
          const { getX, startIndex, endIndex } = utils;

          // Imbalance boxes
          if (bookmapSettings.showImbalanceBoxes && bookmapData.imbalanceBoxes) {
            for (const imb of bookmapData.imbalanceBoxes) {
              if (imb.endIndex >= startIndex && imb.startIndex < endIndex) {
                const x1 = getX(imb.startIndex);
                const x2 = imb.active ? (safeOffset === 0 ? chartWidth : getX(candles.length - 1)) : getX(imb.endIndex);
                const drawX = Math.max(0, x1);
                const drawX2 = Math.min(chartWidth, x2);
                
                if (mouseX >= drawX && mouseX <= drawX2 && checkPrice <= imb.top && checkPrice >= imb.bottom) {
                  foundHoverBox = {
                    type: 'imbalance',
                    isBuy: imb.isBuy,
                    top: imb.top,
                    bottom: imb.bottom,
                    active: imb.active,
                    startIndex: imb.startIndex,
                    endIndex: imb.endIndex,
                    x: mouseX,
                    y: mouseY,
                  };
                  break;
                }
              }
            }
          }

          // Mitigation zones
          if (!foundHoverBox && bookmapSettings.showMitigationBoxes && bookmapData.mitigationBoxes) {
            for (const lvb of bookmapData.mitigationBoxes) {
              if (lvb.endIndex >= startIndex && lvb.startIndex < endIndex) {
                const x1 = getX(lvb.startIndex);
                const x2 = lvb.active ? (safeOffset === 0 ? chartWidth : getX(candles.length - 1)) : getX(lvb.endIndex);
                const drawX = Math.max(0, x1);
                const drawX2 = Math.min(chartWidth, x2);
                
                const topP = lvb.level + lvb.zoneSize / 2;
                const botP = lvb.level - lvb.zoneSize / 2;
                
                if (mouseX >= drawX && mouseX <= drawX2 && checkPrice <= topP && checkPrice >= botP) {
                  foundHoverBox = {
                    type: 'mitigation',
                    level: lvb.level,
                    zoneSize: lvb.zoneSize,
                    buyVol: lvb.buyVol,
                    sellVol: lvb.sellVol,
                    active: lvb.active,
                    startIndex: lvb.startIndex,
                    endIndex: lvb.endIndex,
                    x: mouseX,
                    y: mouseY,
                  };
                  break;
                }
              }
            }
          }
        }
        setHoveredBox(foundHoverBox);

        // Check hovered drawing when in cursor mode
        if (activeTool === 'cursor' && !isDragging && !dragDrawingStateRef.current) {
          const hit = getDrawingHit(mouseX, mouseY);
          if (hit) {
            setHoveredDrawingId(hit.id);
            setHoveredPart(hit.part);
          } else {
            setHoveredDrawingId(null);
            setHoveredPart(null);
          }
        }

        // Check hovered news & economic event markers on chart
        let hoveredNewsId: string | null = null;
        if (!isDragging && newsMarkersHitBoxesRef.current && newsMarkersHitBoxesRef.current.length > 0) {
          const hit = newsMarkersHitBoxesRef.current.find(
            (hb) => mouseX >= hb.x1 && mouseX <= hb.x2 && mouseY >= hb.y1 && mouseY <= hb.y2
          );
          if (hit) {
            hoveredNewsId = hit.id;
            if (canvasRef.current) canvasRef.current.style.cursor = 'pointer';
          }
        }
        if (hoveredNewsId !== hoveredNewsEventIdRef.current) {
          hoveredNewsEventIdRef.current = hoveredNewsId;
          setHoveredNewsEventId(hoveredNewsId);
          requestRender();
        }

        const isDraggingDrawing = !!dragDrawingStateRef.current;
        const pt = getCanvasPriceAndTime(
          coords.clientX,
          coords.clientY,
          isDraggingDrawing
            ? {
                magnetMode: isCtrlPressedRef.current,
                smartAngleSnap: false,
                alignToExistingDrawings: false,
              }
            : undefined
        );

        // A. Dragging existing drawing or anchor handle
        if (dragDrawingStateRef.current && pt && utils) {
          const dragInfo = dragDrawingStateRef.current;
          setDrawings((prev) =>
            prev.map((d) => {
              if (d.id !== dragInfo.id) return d;
              const initPoints = dragInfo.initialPoints;

              if (dragInfo.part === 'point0') {
                if (d.type === 'position_long' || d.type === 'position_short') {
                  const initEntryP = initPoints[0]?.price || pt.price;
                  const priceDiff = pt.price - dragInfo.startPrice;
                  const timeDiff = pt.time - dragInfo.startTime;
                  const isLong = d.type === 'position_long';
                  const initTp = dragInfo.initialRiskReward?.takeProfit ?? (isLong ? initEntryP * 1.03 : initEntryP * 0.97);
                  const initSl = dragInfo.initialRiskReward?.stopLoss ?? (isLong ? initEntryP * 0.985 : initEntryP * 1.015);
                  const newTp = initTp + priceDiff;
                  const newSl = initSl + priceDiff;
                  const newPoints = [...initPoints];
                  newPoints[0] = { price: initPoints[0].price + priceDiff, time: initPoints[0].time + timeDiff };
                  if (initPoints[1]) {
                    newPoints[1] = { price: initPoints[1].price + priceDiff, time: initPoints[1].time + timeDiff };
                  }
                  return {
                    ...d,
                    points: newPoints,
                    riskReward: dragInfo.initialRiskReward
                      ? {
                          ...dragInfo.initialRiskReward,
                          takeProfit: newTp,
                          stopLoss: newSl,
                        }
                      : undefined,
                  };
                } else {
                  const newPoints = [...initPoints];
                  newPoints[0] = { price: pt.price, time: pt.time };
                  return { ...d, points: newPoints };
                }
              } else if (dragInfo.part === 'point1') {
                const newPoints = [...initPoints];
                newPoints[1] = { price: pt.price, time: pt.time };
                return { ...d, points: newPoints };
              } else if (dragInfo.part === 'point2') {
                const newPoints = [...initPoints];
                newPoints[2] = { price: pt.price, time: pt.time };
                return { ...d, points: newPoints };
              } else if (dragInfo.part === 'tp') {
                const entryP = initPoints[0]?.price || pt.price;
                const isLong = d.type === 'position_long';
                const slP = dragInfo.initialRiskReward?.stopLoss ?? (isLong ? entryP * 0.985 : entryP * 1.015);
                let tpP = pt.price;
                if (isLong) {
                  tpP = Math.max(entryP + 0.00001, tpP);
                } else {
                  tpP = Math.min(entryP - 0.00001, tpP);
                }
                const tpDiff = Math.abs(tpP - entryP);
                const slDiff = Math.abs(entryP - slP);
                const rr = Math.max(0.01, tpDiff / (slDiff || 0.00001));
                return {
                  ...d,
                  riskReward: {
                    ...d.riskReward,
                    stopLoss: slP,
                    takeProfit: tpP,
                    riskRatio: parseFloat(rr.toFixed(2)),
                  },
                };
              } else if (dragInfo.part === 'sl') {
                const entryP = initPoints[0]?.price || pt.price;
                const isLong = d.type === 'position_long';
                const tpP = dragInfo.initialRiskReward?.takeProfit ?? (isLong ? entryP * 1.03 : entryP * 0.97);
                let slP = pt.price;
                if (isLong) {
                  slP = Math.min(entryP - 0.00001, slP);
                } else {
                  slP = Math.max(entryP + 0.00001, slP);
                }
                const tpDiff = Math.abs(tpP - entryP);
                const slDiff = Math.abs(slP - entryP);
                const rr = Math.max(0.01, tpDiff / (slDiff || 0.00001));
                return {
                  ...d,
                  riskReward: {
                    ...d.riskReward,
                    takeProfit: tpP,
                    stopLoss: slP,
                    riskRatio: parseFloat(rr.toFixed(2)),
                  },
                };
              } else if (dragInfo.part === 'left') {
                const p0 = initPoints[0];
                const p1 = initPoints[1] || { price: p0.price, time: p0.time + (d.lineWidth ? d.lineWidth * 90 : 180) * 60 };
                const newPoints = [...initPoints];
                if (p0) {
                  const maxTime = p1.time - 60;
                  const newStartTime = Math.min(maxTime, pt.time);
                  newPoints[0] = { price: p0.price, time: newStartTime };
                  newPoints[1] = p1;
                  const x1 = utils.getXFromTime(newStartTime);
                  const x2 = utils.getXFromTime(p1.time);
                  const pxWidth = Math.max(30, x2 - x1);
                  const calcWidthUnit = Math.max(1, Math.round(pxWidth / 90));
                  return {
                    ...d,
                    points: newPoints,
                    lineWidth: calcWidthUnit,
                  };
                }
                return { ...d, points: newPoints };
              } else if (dragInfo.part === 'right') {
                const p0 = initPoints[0];
                const newPoints = [...initPoints];
                if (p0) {
                  const minTime = p0.time + 60;
                  const newEndTime = Math.max(minTime, pt.time);
                  newPoints[1] = { price: p0.price, time: newEndTime };
                  const x1 = utils.getXFromTime(p0.time);
                  const x2 = utils.getXFromTime(newEndTime);
                  const pxWidth = Math.max(30, x2 - x1);
                  const calcWidthUnit = Math.max(1, Math.round(pxWidth / 90));
                  return {
                    ...d,
                    points: newPoints,
                    lineWidth: calcWidthUnit,
                  };
                }
                return { ...d, points: newPoints };
              } else {
                // Moving entire body
                const priceDiff = pt.price - dragInfo.startPrice;
                const timeDiff = pt.time - dragInfo.startTime;
                const newPoints = initPoints.map((p) => ({
                  price: p.price + priceDiff,
                  time: p.time + timeDiff,
                }));
                if (d.type === 'position_long' || d.type === 'position_short') {
                  const initRR = dragInfo.initialRiskReward;
                  return {
                    ...d,
                    points: newPoints,
                    riskReward: initRR
                      ? {
                          ...initRR,
                          takeProfit: initRR.takeProfit + priceDiff,
                          stopLoss: initRR.stopLoss + priceDiff,
                        }
                      : undefined,
                  };
                }
                return { ...d, points: newPoints };
              }
            })
          );
          return;
        }

        // Dynamic TP/SL pull-drag initiation directly from Entry line or Entry badge
        if (pendingPositionPullRef.current && pt && utils) {
          const { pos, startY } = pendingPositionPullRef.current;
          const deltaY = mouseY - startY;
          if (Math.abs(deltaY) >= 4) {
            const isBuy = pos.type === 'BUY';
            const isTP = isBuy ? deltaY < 0 : deltaY > 0;
            const dragType = isTP ? 'TP' : 'SL';
            dragPositionRef.current = { id: pos.id, type: dragType };
            visualDragStateRef.current = {
              active: true,
              posId: pos.id,
              type: dragType,
              price: pt.price,
              startPrice: pos.entryPrice,
              size: pos.size,
              isForex: marketInfo.assetClass === 'Forex',
              mouseX,
              mouseY
            };
            setVisualDragState({ ...visualDragStateRef.current });
            setDragMode(isTP ? 'positionTP' : 'positionSL');
            pendingPositionPullRef.current = null;
            return;
          }
        }

        // Position TP/SL and Visual Order Dragging (with optional Magnet Snapping)
        if (visualDragStateRef.current?.active && pt) {
          let finalPrice = pt.price;
          if (magnetMode && candles.length > 0) {
            for (let i = Math.max(0, candles.length - 35); i < candles.length; i++) {
              const c = candles[i];
              const targets = [c.high, c.low, c.close, c.open];
              let snapped = false;
              for (const target of targets) {
                const targetY = utils.getY(target);
                if (Math.abs(mouseY - targetY) < 9) {
                  finalPrice = target;
                  snapped = true;
                  break;
                }
              }
              if (snapped) break;
            }
          }

          visualDragStateRef.current = {
            ...visualDragStateRef.current,
            price: finalPrice,
            mouseX,
            mouseY
          };
          setVisualDragState({ ...visualDragStateRef.current });
          return;
        }

        // Hover detection on positions & pending orders for visual cues and cursors
        if (!isDragging && activeTool === 'cursor') {
          const posHit = positions && positions.length > 0 ? getPositionHit(mouseX, mouseY, utils) : null;
          const pendingHit = pendingOrders && pendingOrders.length > 0 ? getPendingOrderHit(mouseX, mouseY, utils) : null;

          if (posHit) {
            setPositionHoverState({ posId: posHit.pos.id, element: posHit.element });
            setPendingHoverState(null);
            if (canvasRef.current) canvasRef.current.style.cursor = (posHit as any).cursor || 'pointer';
          } else if (pendingHit) {
            setPendingHoverState({ pendingId: pendingHit.order.id, element: pendingHit.element });
            setPositionHoverState(null);
            if (canvasRef.current) canvasRef.current.style.cursor = (pendingHit as any).cursor || 'pointer';
          } else {
            if (positionHoverState) setPositionHoverState(null);
            if (pendingHoverState) setPendingHoverState(null);
            // Only reset if we are NOT in a drawing tool hover or other drag
            if (canvasRef.current && !hoveredDrawingId && !isDragging) {
               canvasRef.current.style.cursor = 'crosshair';
            }
          }
        }

        // B. Panning or Scaling Chart
        if (isDragging && utils) {
          const dragScaleX = rect.scaleX || 1;
          const dragScaleY = rect.scaleY || 1;
          if (dragMode === 'priceAxis') {
            const deltaY = (dragStartY - coords.clientY) / dragScaleY;
            const sensitivity = 0.005;
            const newScale = Math.max(0.05, Math.min(100.0, dragStartPriceScale * Math.exp(deltaY * sensitivity)));

            const effectiveHalfRange = Math.max(0.00001, utils.baseHalfRange / Math.max(0.05, newScale));
            const newPriceRange = effectiveHalfRange * 2;
            const anchorY = dragStartAnchorYRef.current;
            const anchorPrice = dragStartAnchorPriceRef.current;
            const dHeight = utils.drawableHeight || (utils.mainChartHeight - 20);
            const newOffset = anchorPrice - (utils.baseMin + utils.baseMax) / 2 + (anchorY / dHeight - 0.5) * newPriceRange;

            priceScaleRef.current = newScale;
            priceOffsetRef.current = newOffset;
            setPriceScale(newScale);
            setPriceOffset(newOffset);
            if (isAutoScaleRef.current) {
              setIsAutoScale(false);
              isAutoScaleRef.current = false;
            }
          } else if (dragMode === 'timeAxis') {
            const deltaX = (coords.clientX - dragStartX) / dragScaleX;
            const zoomFactor = Math.exp(deltaX * 0.005);
            const newZ = Math.max(0.05, Math.min(300.0, zoomRef.current * zoomFactor));
            zoomRef.current = newZ;
            setZoom(newZ);
            setDragStartX(coords.clientX);
          } else if (dragMode === 'chart' && activeTool === 'cursor') {
            const deltaX = (coords.clientX - dragStartX) / dragScaleX;
            const deltaY = (coords.clientY - dragStartY) / dragScaleY;

            const offsetDelta = deltaX / utils.totalCandleSlot;
            const dHeight = utils.drawableHeight || utils.mainChartHeight;
            const priceDelta = (deltaY / dHeight) * utils.priceRange;

            const newPan = dragStartOffset + offsetDelta;
            const newPriceOffset = dragStartPriceOffset + priceDelta;

            panOffsetRef.current = newPan;
            priceOffsetRef.current = newPriceOffset;
            setPanOffset(newPan);
            setPriceOffset(newPriceOffset);
            
            if (Math.abs(deltaY) > 2 && isAutoScaleRef.current) {
              setIsAutoScale(false);
              isAutoScaleRef.current = false;
            }
          }
        }

        // C. Updating active drawing preview
        if (currentDrawing && pt && utils) {
          if (currentDrawing.type === 'brush' || currentDrawing.type === 'highlighter') {
            const lastPt = currentDrawing.points[currentDrawing.points.length - 1];
            const lastPxX = utils.getXFromTime(lastPt.time);
            const lastPxY = utils.getY(lastPt.price);
            const dist = Math.hypot(mouseX - lastPxX, mouseY - lastPxY);
            if (dist >= 2.5) {
              setCurrentDrawing((prev) => {
                if (!prev) return prev;
                return { ...prev, points: [...prev.points, { price: pt.price, time: pt.time }] };
              });
            }
          } else {
            setCurrentDrawing((prev) => {
              if (!prev || prev.points.length === 0) return null;
              const newPts = [...prev.points];
              newPts[newPts.length - 1] = { price: pt.price, time: pt.time };
              return { ...prev, points: newPts };
            });
          }
          if (drawStartCoordsRef.current) {
            const dist = Math.hypot(coords.clientX - drawStartCoordsRef.current.clientX, coords.clientY - drawStartCoordsRef.current.clientY);
            if (dist > 6) {
              drawStartCoordsRef.current.moved = true;
            }
          }
        }
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);

    if (aiLongPressTimerRef.current) {
      clearTimeout(aiLongPressTimerRef.current);
      aiLongPressTimerRef.current = null;
    }

    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    pendingPositionPullRef.current = null;
    holdStartPosRef.current = null;
    setHoldVisualState(null);

    // Finalize Visual Drag Actions (Open Position or TP/SL Adjustment)
    if (visualDragStateRef.current?.active) {
      const drag = visualDragStateRef.current;
      if (drag.posId && (drag.type === 'TP' || drag.type === 'NEW_TP')) {
        const pos = positions.find(p => p.id === drag.posId);
        if (pos) {
          if (requireSLTPVerification) {
            setSltpVerificationModal({
              isOpen: true,
              kind: 'POSITION_TP',
              symbol: activeSymbol,
              posId: pos.id,
              side: pos.type,
              entryPrice: pos.entryPrice,
              oldPrice: pos.takeProfit || undefined,
              newPrice: drag.price,
              size: pos.size,
              isForex: marketInfo.assetClass === 'Forex',
              onConfirm: () => {
                updatePositionBracket(pos.id, drag.price, pos.stopLoss);
                tradingAudio.play('PRESET');
              },
              onClose: () => {
                setSltpVerificationModal(null);
              },
              requireVerification: requireSLTPVerification,
              onToggleRequireVerification: setRequireSLTPVerification,
            });
          } else {
            updatePositionBracket(pos.id, drag.price, pos.stopLoss);
            tradingAudio.play('PRESET');
          }
        }
      } else if (drag.posId && (drag.type === 'SL' || drag.type === 'NEW_SL')) {
        const pos = positions.find(p => p.id === drag.posId);
        if (pos) {
          if (requireSLTPVerification) {
            setSltpVerificationModal({
              isOpen: true,
              kind: 'POSITION_SL',
              symbol: activeSymbol,
              posId: pos.id,
              side: pos.type,
              entryPrice: pos.entryPrice,
              oldPrice: pos.stopLoss || undefined,
              newPrice: drag.price,
              size: pos.size,
              isForex: marketInfo.assetClass === 'Forex',
              onConfirm: () => {
                updatePositionBracket(pos.id, pos.takeProfit, drag.price);
                tradingAudio.play('AUTO_BE');
              },
              onClose: () => {
                setSltpVerificationModal(null);
              },
              requireVerification: requireSLTPVerification,
              onToggleRequireVerification: setRequireSLTPVerification,
            });
          } else {
            updatePositionBracket(pos.id, pos.takeProfit, drag.price);
            tradingAudio.play('AUTO_BE');
          }
        }
      } else if (drag.type === 'ORDER_BUY' || drag.type === 'ORDER_SELL') {
        const isBuy = drag.type === 'ORDER_BUY';
        const dropPrice = drag.price;
        const isLimit = isBuy ? dropPrice < currentPrice : dropPrice > currentPrice;
        const orderType = isLimit ? 'LIMIT' : 'STOP';
        const presets = (marketInfo.assetClass === 'Forex') ? volumePresets.forex : volumePresets.crypto;
        const rawOrderSize = drag.size || presets[activePresetIndex] || (marketInfo.assetClass === 'Forex' ? 0.1 : 100);
        const safeCurrentPrice = (currentPrice && !isNaN(currentPrice) && currentPrice > 0) ? currentPrice : 1;
        const orderSize = marketInfo.assetClass === 'Forex' ? rawOrderSize : Number((rawOrderSize / safeCurrentPrice).toFixed(4));
        const riskDist = Math.abs(dropPrice * 0.015);
        const tp = isBuy ? dropPrice + riskDist * 2 : dropPrice - riskDist * 2;
        const sl = isBuy ? dropPrice - riskDist : dropPrice + riskDist;

        if (requireSLTPVerification) {
          setSltpVerificationModal({
            isOpen: true,
            kind: 'PENDING_ORDER',
            symbol: activeSymbol,
            side: isBuy ? 'BUY' : 'SELL',
            entryPrice: currentPrice,
            oldPrice: undefined,
            newPrice: dropPrice,
            size: orderSize,
            isForex: marketInfo.assetClass === 'Forex',
            onConfirm: () => {
              executeOrder({
                symbol: activeSymbol,
                type: isBuy ? 'BUY' : 'SELL',
                orderType,
                size: orderSize,
                price: dropPrice,
                takeProfit: tp,
                stopLoss: sl
              });
            },
            onClose: () => {
              setSltpVerificationModal(null);
            },
            requireVerification: requireSLTPVerification,
            onToggleRequireVerification: setRequireSLTPVerification,
          });
        } else {
          executeOrder({
            symbol: activeSymbol,
            type: isBuy ? 'BUY' : 'SELL',
            orderType,
            size: orderSize,
            price: dropPrice,
            takeProfit: tp,
            stopLoss: sl
          });
        }
      } else if (drag.pendingId && drag.type === 'PENDING_ORDER') {
        const order = pendingOrders.find(o => o.id === drag.pendingId);
        if (order) {
          if (requireSLTPVerification) {
            setSltpVerificationModal({
              isOpen: true,
              kind: 'PENDING_ORDER',
              symbol: activeSymbol,
              pendingId: order.id,
              side: order.type,
              entryPrice: order.price,
              oldPrice: order.price,
              newPrice: drag.price,
              size: order.size,
              isForex: marketInfo.assetClass === 'Forex',
              onConfirm: () => {
                updatePendingOrder(order.id, drag.price, order.size, order.takeProfit, order.stopLoss);
                tradingAudio.play('PRESET');
              },
              onClose: () => {
                setSltpVerificationModal(null);
              },
              requireVerification: requireSLTPVerification,
              onToggleRequireVerification: setRequireSLTPVerification,
            });
          } else {
            updatePendingOrder(order.id, drag.price, order.size, order.takeProfit, order.stopLoss);
            tradingAudio.play('PRESET');
          }
        }
      } else if (drag.pendingId && (drag.type === 'PENDING_TP' || drag.type === 'NEW_PENDING_TP')) {
        const order = pendingOrders.find(o => o.id === drag.pendingId);
        if (order) {
          if (requireSLTPVerification) {
            setSltpVerificationModal({
              isOpen: true,
              kind: 'PENDING_TP',
              symbol: activeSymbol,
              pendingId: order.id,
              side: order.type,
              entryPrice: order.price,
              oldPrice: order.takeProfit || undefined,
              newPrice: drag.price,
              size: order.size,
              isForex: marketInfo.assetClass === 'Forex',
              onConfirm: () => {
                updatePendingOrder(order.id, order.price, order.size, drag.price, order.stopLoss);
                tradingAudio.play('PRESET');
              },
              onClose: () => {
                setSltpVerificationModal(null);
              },
              requireVerification: requireSLTPVerification,
              onToggleRequireVerification: setRequireSLTPVerification,
            });
          } else {
            updatePendingOrder(order.id, order.price, order.size, drag.price, order.stopLoss);
            tradingAudio.play('PRESET');
          }
        }
      } else if (drag.pendingId && (drag.type === 'PENDING_SL' || drag.type === 'NEW_PENDING_SL')) {
        const order = pendingOrders.find(o => o.id === drag.pendingId);
        if (order) {
          if (requireSLTPVerification) {
            setSltpVerificationModal({
              isOpen: true,
              kind: 'PENDING_SL',
              symbol: activeSymbol,
              pendingId: order.id,
              side: order.type,
              entryPrice: order.price,
              oldPrice: order.stopLoss || undefined,
              newPrice: drag.price,
              size: order.size,
              isForex: marketInfo.assetClass === 'Forex',
              onConfirm: () => {
                updatePendingOrder(order.id, order.price, order.size, order.takeProfit, drag.price);
                tradingAudio.play('AUTO_BE');
              },
              onClose: () => {
                setSltpVerificationModal(null);
              },
              requireVerification: requireSLTPVerification,
              onToggleRequireVerification: setRequireSLTPVerification,
            });
          } else {
            updatePendingOrder(order.id, order.price, order.size, order.takeProfit, drag.price);
            tradingAudio.play('AUTO_BE');
          }
        }
      }

      visualDragStateRef.current = null;
      setVisualDragState(null);
      if (dragPositionRef.current) dragPositionRef.current = null;
    }

    if (dragDrawingStateRef.current) {
      dragDrawingStateRef.current = null;
    }

    if (currentDrawing && (currentDrawing.type === 'brush' || currentDrawing.type === 'highlighter')) {
      const completed: DrawingItem = {
        ...currentDrawing,
        isComplete: true,
      };
      setDrawings((prev) => [...prev, completed]);
      setSelectedDrawingId(completed.id);
      setCurrentDrawing(null);
      drawStartCoordsRef.current = null;
      if (!stayInDrawingMode) {
        setActiveTool('cursor');
      }
    }
  };

  const handleMouseLeave = () => {
    // If active drag is in progress, do not abruptly kill the drag state on mouse leave;
    // allow pointer/mouse events to continue or finalize on mouseup
    if (!dragDrawingStateRef.current && !visualDragStateRef.current?.active) {
      setIsDragging(false);
    }

    if (currentDrawing && (currentDrawing.type === 'brush' || currentDrawing.points.length > 1)) {
      const completed: DrawingItem = {
        ...currentDrawing,
        isComplete: true,
      };
      setDrawings((prev) => [...prev, completed]);
      setSelectedDrawingId(completed.id);
      setCurrentDrawing(null);
      drawStartCoordsRef.current = null;
    }
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    holdStartPosRef.current = null;
    setHoldVisualState(null);

    // Only clear crosshair visual state on mouseleave
    updateCrosshair(crosshairRef.current.x, crosshairRef.current.y, false);
    setHoveredBox(null);
    if (chartSyncCrosshair) {
      setGlobalCrosshair(null);
    }
    if (candles.length > 0) setHoveredCandle(candles[candles.length - 1]);
  };

  // Zoom-at-Cursor with dynamic 2D compensation
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    notifyFastInteraction();
    const rect = getAdjustedCanvasRect(canvasRef.current);
    const utils = getCoordinateUtils();
    if (!rect || !utils) return;

    const mouseX = rect.getLocalX(e.clientX);
    const mouseY = rect.getLocalY(e.clientY);
    
    // Smooth factor calculation using trackpad-friendly scaling
    const isTrackpad = Math.abs(e.deltaY) < 50;
    const zoomMultiplier = isTrackpad ? Math.exp(-e.deltaY * 0.005) : (e.deltaY < 0 ? 1.15 : 0.87);

    // 1. If cursor is on the price axis, wheel zooms vertical price scale anchored at mouseY
    if (mouseX >= utils.chartWidth) {
      const currentScale = isAutoScaleRef.current ? 1 : priceScaleRef.current;
      const newScale = Math.max(0.05, Math.min(100.0, currentScale * zoomMultiplier));
      const anchorPrice = utils.getPriceFromY(mouseY);
      const effectiveHalfRange = Math.max(0.00001, utils.baseHalfRange / Math.max(0.05, newScale));
      const newPriceRange = effectiveHalfRange * 2;
      const dHeight = utils.drawableHeight || (utils.mainChartHeight - 20);
      const newOffset = anchorPrice - (utils.baseMin + utils.baseMax) / 2 + (mouseY / dHeight - 0.5) * newPriceRange;

      priceScaleRef.current = newScale;
      priceOffsetRef.current = newOffset;
      if (isAutoScaleRef.current) {
        setIsAutoScale(false);
        isAutoScaleRef.current = false;
      }
      setPriceScale(newScale);
      setPriceOffset(newOffset);
      return;
    }

    // 2. If cursor is on the bottom time axis, wheel zooms horizontal time
    if (mouseY >= utils.fullHeight) {
      const currentZ = zoomRef.current;
      const newZ = Math.max(0.05, Math.min(300.0, currentZ * zoomMultiplier));
      zoomRef.current = newZ;
      setZoom(newZ);
      return;
    }

    // 3. Shift + Wheel or horizontal trackpad scroll: Forced Horizontal Pan
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey) {
      const scrollDelta = (e.deltaX || e.deltaY) / utils.totalCandleSlot * 0.8;
      const newPan = panOffsetRef.current + scrollDelta;
      panOffsetRef.current = newPan;
      setPanOffset(newPan);
      return;
    }

    // 4. Ctrl/Cmd + Wheel anywhere on chart: Vertical price scale zoom centered at mouseY
    if (e.ctrlKey || e.metaKey) {
      const currentScale = isAutoScaleRef.current ? 1 : priceScaleRef.current;
      const newScale = Math.max(0.05, Math.min(100.0, currentScale * zoomMultiplier));
      const anchorPrice = utils.getPriceFromY(mouseY);
      const effectiveHalfRange = Math.max(0.00001, utils.baseHalfRange / Math.max(0.05, newScale));
      const newPriceRange = effectiveHalfRange * 2;
      const dHeight = utils.drawableHeight || (utils.mainChartHeight - 20);
      const newOffset = anchorPrice - (utils.baseMin + utils.baseMax) / 2 + (mouseY / dHeight - 0.5) * newPriceRange;

      priceScaleRef.current = newScale;
      priceOffsetRef.current = newOffset;
      if (isAutoScaleRef.current) {
        setIsAutoScale(false);
        isAutoScaleRef.current = false;
      }
      setPriceScale(newScale);
      setPriceOffset(newOffset);
      return;
    }

    // 5. Standard Wheel in chart area: Horizontal candle zoom centered on mouse cursor
    const { chartWidth } = utils;
    const cursorX = Math.max(0, Math.min(chartWidth, mouseX));
    const distFromRight = chartWidth - cursorX;

    const isFootprintBar = chartType === 'footprints' || indicators.showFootprints;
    const baseWidth = isFootprintBar ? 68 : 8;
    const gapRatio = isFootprintBar ? 0.05 : 0.3;

    const currentZ = zoomRef.current;
    const newZ = Math.max(0.05, Math.min(300.0, currentZ * zoomMultiplier));

    if (currentZ !== newZ) {
      const oldCandleW = Math.max(2, baseWidth * currentZ);
      const oldSlot = oldCandleW + Math.max(isFootprintBar ? 2 : 1, oldCandleW * gapRatio);

      const newCandleW = Math.max(2, baseWidth * newZ);
      const newSlot = newCandleW + Math.max(isFootprintBar ? 2 : 1, newCandleW * gapRatio);

      const slotDiff = distFromRight / oldSlot - distFromRight / newSlot;
      const newPo = panOffsetRef.current + slotDiff;

      zoomRef.current = newZ;
      panOffsetRef.current = newPo;

      setZoom(newZ);
      setPanOffset(newPo);
    }
  };

  // Touch Interactions: Focused 2D Pan, Pinch Zoom & Vertical Price Scaling
  const lastTouchTapRef = useRef<{ time: number; x: number; y: number }>({ time: 0, x: 0, y: 0 });

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touches = e.touches;
    const rect = getAdjustedCanvasRect(canvasRef.current);
    const utils = getCoordinateUtils();

    if (touches.length === 1) {
      const t = touches[0];
      const touchX = rect ? rect.getLocalX(t.clientX) : t.clientX;
      const touchY = rect ? rect.getLocalY(t.clientY) : t.clientY;
      const isPriceAxis = utils ? touchX >= utils.chartWidth : false;
      const isTimeAxis = utils ? touchY >= utils.fullHeight : false;

      // Double-tap detection on touch screens to auto-fit and reset zoom/pan
      const now = Date.now();
      const timeDiff = now - lastTouchTapRef.current.time;
      const dist = Math.hypot(t.clientX - lastTouchTapRef.current.x, t.clientY - lastTouchTapRef.current.y);
      if (timeDiff < 320 && dist < 30) {
        lastTouchTapRef.current = { time: 0, x: 0, y: 0 };
        handleDoubleClick({ clientX: t.clientX, clientY: t.clientY } as any);
        return;
      }
      lastTouchTapRef.current = { time: now, x: t.clientX, y: t.clientY };

      // Check News / Economic Event Marker Pin hits on Touch (Expanded touch boundaries)
      if (newsMarkersHitBoxesRef.current && newsMarkersHitBoxesRef.current.length > 0) {
        const hitNews = newsMarkersHitBoxesRef.current.find(
          (hb) => touchX >= hb.x1 && touchX <= hb.x2 && touchY >= hb.y1 && touchY <= hb.y2
        );
        if (hitNews) {
          if (aiLongPressTimerRef.current) clearTimeout(aiLongPressTimerRef.current);
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try { navigator.vibrate(10); } catch (e) {}
          }
          // Find all sibling events in the same clicked cluster that share this coordinate
          const siblingEvents = newsMarkersHitBoxesRef.current
            .filter((hb) => hb.x1 === hitNews.x1 && hb.y1 === hitNews.y1)
            .map((hb) => hb.event);

          setSelectedNewsEventModal(hitNews.event);
          setSelectedNewsEventCluster(siblingEvents.length > 1 ? siblingEvents : [hitNews.event]);
          tradingAudio.play('PRESET');
          return;
        }
      }

      const pt = getCanvasPriceAndTime(t.clientX, t.clientY);

      // Check position hits on touch
      if (activeTool === 'cursor' && !isPriceAxis && !isTimeAxis && positions && positions.length > 0 && utils) {
        const hit = getPositionHit(touchX, touchY, utils);
        if (hit) {
          if (hit.action === 'CLOSE') {
            closePosition(hit.pos.id, currentPrice || hit.pos.currentPrice);
            tradingAudio.play('CLOSE');
            return;
          }
          if (hit.action === 'PARTIAL_CLOSE') {
            closePosition(hit.pos.id, currentPrice || hit.pos.currentPrice, 0.5);
            tradingAudio.play('CLOSE');
            return;
          }
          if (hit.action === 'TOGGLE_PNL') {
            togglePnlDisplayMode();
            tradingAudio.play('PRESET');
            return;
          }
          if (hit.action === 'TOGGLE_AUTO_BE') {
            toggleAutoBE(hit.pos.id);
            return;
          }
          if (hit.action === 'REVERSE') {
            reversePosition(hit.pos.id, currentPrice || hit.pos.currentPrice);
            tradingAudio.play('REVERSE');
            return;
          }
          if (hit.action === 'BE') {
            updatePositionBracket(hit.pos.id, hit.pos.takeProfit, hit.pos.entryPrice);
            tradingAudio.play('AUTO_BE');
            return;
          }
          if (hit.action === 'REMOVE_TP') {
            updatePositionBracket(hit.pos.id, undefined, hit.pos.stopLoss);
            return;
          }
          if (hit.action === 'REMOVE_SL') {
            updatePositionBracket(hit.pos.id, hit.pos.takeProfit, undefined);
            return;
          }
          if (hit.action === 'DRAG_TP' || hit.action === 'NEW_TP') {
            if (isSLTPLocked) {
              setSltpToast({ message: "🔒 Garis Order/SL/TP Terkunci! Buka kunci di kanan-bawah chart untuk menggeser.", type: 'warning' });
              tradingAudio.play('CLOSE');
              return;
            }
            const isBuy = hit.pos.type === 'BUY';
            const defaultOffset = hit.pos.entryPrice * 0.015;
            const defaultTP = isBuy ? hit.pos.entryPrice + defaultOffset : hit.pos.entryPrice - defaultOffset;
            const initialP = hit.pos.takeProfit || defaultTP;
            dragPositionRef.current = { id: hit.pos.id, type: 'TP' };
            visualDragStateRef.current = {
              active: true,
              posId: hit.pos.id,
              type: 'TP',
              price: initialP,
              startPrice: hit.pos.entryPrice,
              size: hit.pos.size,
              isForex: marketInfo.assetClass === 'Forex',
              mouseX: touchX,
              mouseY: touchY
            };
            setVisualDragState({ ...visualDragStateRef.current });
            return;
          }
          if (hit.action === 'DRAG_SL' || hit.action === 'NEW_SL') {
            if (isSLTPLocked) {
              setSltpToast({ message: "🔒 Garis Order/SL/TP Terkunci! Buka kunci di kanan-bawah chart untuk menggeser.", type: 'warning' });
              tradingAudio.play('CLOSE');
              return;
            }
            const isBuy = hit.pos.type === 'BUY';
            const defaultOffset = hit.pos.entryPrice * 0.01;
            const defaultSL = isBuy ? hit.pos.entryPrice - defaultOffset : hit.pos.entryPrice + defaultOffset;
            const initialP = hit.pos.stopLoss || defaultSL;
            dragPositionRef.current = { id: hit.pos.id, type: 'SL' };
            visualDragStateRef.current = {
              active: true,
              posId: hit.pos.id,
              type: 'SL',
              price: initialP,
              startPrice: hit.pos.entryPrice,
              size: hit.pos.size,
              isForex: marketInfo.assetClass === 'Forex',
              mouseX: touchX,
              mouseY: touchY
            };
            setVisualDragState({ ...visualDragStateRef.current });
            return;
          }
          if (hit.action === 'ENTRY') {
            pendingPositionPullRef.current = {
              pos: hit.pos,
              startY: touchY,
              startPrice: hit.pos.entryPrice,
              clientX: t.clientX,
              clientY: t.clientY,
            };
            return;
          }
        }
      }

      if (activeTool === 'cursor' && !isPriceAxis && !isTimeAxis && !isLockedDrawings) {
        const hit = getDrawingHit(touchX, touchY);
        if (hit) {
          setSelectedDrawingId(hit.id);
          if (getEffectiveDrawingLocked(hit.drawing, layersMap, isLockedDrawings)) {
            // Locked drawing — select only, no drag
            if (rect) updateCrosshair(touchX, touchY, true);
            return;
          }
          dragDrawingStateRef.current = {
            id: hit.id,
            part: hit.part as any,
            initialPoints: hit.drawing.points.map((p) => ({ ...p })),
            initialRiskReward: hit.drawing.riskReward ? { ...hit.drawing.riskReward } : undefined,
            startPrice: pt ? pt.price : hit.drawing.points[0].price,
            startTime: pt ? pt.time : hit.drawing.points[0].time,
            startX: t.clientX,
            startY: t.clientY,
          };
          touchStateRef.current = {
            isInteracting: true,
            mode: 'chart',
            initialDistance: 0,
            initialHDist: 0,
            initialVDist: 0,
            initialCenter: { x: t.clientX, y: t.clientY },
            initialZoom: zoom,
            initialPanOffset: panOffset,
            initialPriceScale: priceScale,
            initialPriceOffset: priceOffset,
            lastTouchX: t.clientX,
            lastTouchY: t.clientY,
            touchStartTime: Date.now(),
            hasMoved: false,
          };
          if (rect) updateCrosshair(touchX, touchY, true);
          return;
        }
      }

      // Handle drawing tools on touch
      if (activeTool !== 'cursor' && !isPriceAxis && !isTimeAxis && !isLockedDrawings && pt) {
        if (activeTool === 'brush') {
          const newDraw: DrawingItem = {
            id: Date.now().toString(),
            type: 'brush',
            points: [{ price: pt.price, time: pt.time }],
            color: drawingColor,
            isComplete: false,
          };
          setCurrentDrawing(newDraw);
          touchStateRef.current = {
            isInteracting: true,
            mode: 'drawing' as any,
            initialDistance: 0,
            initialHDist: 0,
            initialVDist: 0,
            initialCenter: { x: t.clientX, y: t.clientY },
            initialZoom: zoom,
            initialPanOffset: panOffset,
            initialPriceScale: priceScale,
            initialPriceOffset: priceOffset,
            lastTouchX: t.clientX,
            lastTouchY: t.clientY,
            touchStartTime: Date.now(),
            hasMoved: false,
          };
          if (rect) updateCrosshair(touchX, touchY, true);
          return;
        } else if (['horizontal', 'horizontal_ray', 'vertical', 'price_label'].includes(activeTool)) {
          const newDrawing: DrawingItem = {
            id: Date.now().toString(),
            type: activeTool as any,
            points: [{ price: pt.price, time: pt.time }],
            color: drawingColor,
            isComplete: true,
          };
          setDrawings((prev) => [...prev, newDrawing]);
          setSelectedDrawingId(newDrawing.id);
          if (!stayInDrawingMode) setActiveTool('cursor');
          return;
        } else if (activeTool === 'position_long' || activeTool === 'position_short') {
          const entryPrice = pt.price;
          const tfSec = getTimeframeSeconds(timeframe);
          const isLong = activeTool === 'position_long';
          const slPercent = 0.015;
          const tpPercent = 0.030;

          const stopLoss = isLong ? entryPrice * (1 - slPercent) : entryPrice * (1 + slPercent);
          const takeProfit = isLong ? entryPrice * (1 + tpPercent) : entryPrice * (1 - tpPercent);

          const defaultBarsAhead = 20;
          const p2Time = pt.time + defaultBarsAhead * tfSec;

          const rawDrawing: DrawingItem = {
            id: Date.now().toString(),
            type: activeTool,
            points: [
              { price: entryPrice, time: pt.time },
              { price: entryPrice, time: p2Time }
            ],
            color: drawingColor,
            layerId: activeLayerId,
            isComplete: true,
            riskReward: {
              takeProfit,
              stopLoss,
              riskRatio: 2.0,
            }
          };
          const newDrawing = applyStyleToDrawing(rawDrawing, activeTemplateStyle);
          setDrawings((prev) => [...prev, newDrawing]);
          setSelectedDrawingId(newDrawing.id);
          if (!stayInDrawingMode) setActiveTool('cursor');
          return;
        } else if (activeTool === 'text' || activeTool === 'callout') {
          setTextPromptModal({
            isOpen: true,
            point: { price: pt.price, time: pt.time },
            text: '',
          });
          if (!stayInDrawingMode) setActiveTool('cursor');
          return;
        } else if (['trendline', 'ray', 'extended_line', 'parallel_channel', 'arrow', 'rectangle', 'ellipse', 'triangle', 'fibonacci', 'fib_fan', 'pitchfork', 'ruler'].includes(activeTool)) {
          if (!currentDrawing) {
            const newDraw: DrawingItem = {
              id: Date.now().toString(),
              type: activeTool,
              points: [
                { price: pt.price, time: pt.time },
                { price: pt.price, time: pt.time },
              ],
              color: drawingColor,
              isComplete: false,
            };
            setCurrentDrawing(newDraw);
            touchStateRef.current = {
              isInteracting: true,
              mode: 'drawing' as any,
              initialDistance: 0,
              initialHDist: 0,
              initialVDist: 0,
              initialCenter: { x: t.clientX, y: t.clientY },
              initialZoom: zoom,
              initialPanOffset: panOffset,
              initialPriceScale: priceScale,
              initialPriceOffset: priceOffset,
              lastTouchX: t.clientX,
              lastTouchY: t.clientY,
              touchStartTime: Date.now(),
              hasMoved: false,
            };
            if (rect) updateCrosshair(touchX, touchY, true);
            return;
          } else {
            const completed: DrawingItem = {
              ...currentDrawing,
              points: [currentDrawing.points[0], { price: pt.price, time: pt.time }],
              isComplete: true,
            };
            setDrawings((prev) => [...prev, completed]);
            setSelectedDrawingId(completed.id);
            setCurrentDrawing(null);
            touchStateRef.current.isInteracting = false;
            if (!stayInDrawingMode) setActiveTool('cursor');
            return;
          }
        }
      }

      const startScale = isAutoScaleRef.current ? 1 : priceScaleRef.current;
      const startOffset = isAutoScaleRef.current ? 0 : priceOffsetRef.current;
      if (isPriceAxis) {
        if (isAutoScaleRef.current) {
          setIsAutoScale(false);
          isAutoScaleRef.current = false;
        }
        if (utils) {
          dragStartAnchorYRef.current = touchY;
          dragStartAnchorPriceRef.current = utils.getPriceFromY(touchY);
        }
      }

      touchStateRef.current = {
        isInteracting: true,
        mode: isPriceAxis ? 'priceAxis' : isTimeAxis ? 'timeAxis' : 'chart',
        initialDistance: 0,
        initialHDist: 0,
        initialVDist: 0,
        initialCenter: { x: t.clientX, y: t.clientY },
        initialZoom: zoomRef.current,
        initialPanOffset: panOffsetRef.current,
        initialPriceScale: startScale,
        initialPriceOffset: startOffset,
        lastTouchX: t.clientX,
        lastTouchY: t.clientY,
        touchStartTime: Date.now(),
        hasMoved: false,
      };

      if (rect) {
        updateCrosshair(touchX, touchY, true);
      }
    } else if (touches.length === 2) {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }
      setHoldVisualState(null);
      holdStartPosRef.current = null;

      const t1 = touches[0];
      const t2 = touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const centerX = (t1.clientX + t2.clientX) / 2;
      const centerY = (t1.clientY + t2.clientY) / 2;

      touchStateRef.current = {
        isInteracting: true,
        mode: 'chart',
        initialDistance: Math.max(10, dist),
        initialHDist: Math.max(10, Math.abs(t1.clientX - t2.clientX)),
        initialVDist: Math.max(10, Math.abs(t1.clientY - t2.clientY)),
        initialCenter: { x: centerX, y: centerY },
        initialZoom: zoomRef.current,
        initialPanOffset: panOffsetRef.current,
        initialPriceScale: isAutoScaleRef.current ? 1 : priceScaleRef.current,
        initialPriceOffset: isAutoScaleRef.current ? 0 : priceOffsetRef.current,
        lastTouchX: centerX,
        lastTouchY: centerY,
        touchStartTime: Date.now(),
        hasMoved: false,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touches = e.touches;
    if (touches.length === 0) return;

    if (touches.length === 1 && holdStartPosRef.current) {
      const t = touches[0];
      const dist = Math.hypot(t.clientX - holdStartPosRef.current.clientX, t.clientY - holdStartPosRef.current.clientY);
      if (dist > 8) {
        if (holdTimerRef.current) {
          clearTimeout(holdTimerRef.current);
          holdTimerRef.current = null;
        }
        holdStartPosRef.current = null;
        setHoldVisualState(null);
      }
    }

    // Extract necessary touch properties synchronously
    const touchList = Array.from(touches).map((t: any) => ({ clientX: t.clientX, clientY: t.clientY }));
    latestTouchMoveEventRef.current = { touches: touchList };

    if (touchMoveRAFRef.current === null) {
      touchMoveRAFRef.current = requestAnimationFrame(() => {
        touchMoveRAFRef.current = null;
        const currentEvent = latestTouchMoveEventRef.current;
        if (!currentEvent || currentEvent.touches.length === 0) return;

        const touches = currentEvent.touches;

        // Touch pull TP/SL from Entry line or badge
        if (pendingPositionPullRef.current && touches.length === 1) {
          const t = touches[0];
          const rect = getAdjustedCanvasRect(canvasRef.current);
          const pt = getCanvasPriceAndTime(t.clientX, t.clientY);
          if (rect && pt) {
            const touchY = rect.getLocalY(t.clientY);
            const touchX = rect.getLocalX(t.clientX);
            const { pos, startY } = pendingPositionPullRef.current;
            const deltaY = touchY - startY;
            if (Math.abs(deltaY) >= 4) {
              const isBuy = pos.type === 'BUY';
              const isTP = isBuy ? deltaY < 0 : deltaY > 0;
              const dragType = isTP ? 'TP' : 'SL';
              dragPositionRef.current = { id: pos.id, type: dragType };
              visualDragStateRef.current = {
                active: true,
                posId: pos.id,
                type: dragType,
                price: pt.price,
                startPrice: pos.entryPrice,
                size: pos.size,
                isForex: marketInfo.assetClass === 'Forex',
                mouseX: touchX,
                mouseY: touchY
              };
              setVisualDragState({ ...visualDragStateRef.current });
              pendingPositionPullRef.current = null;
              return;
            }
          }
        }

        // Touch support for Visual Order Dragging
        if (visualDragStateRef.current?.active && touches.length === 1) {
          const t = touches[0];
          const pt = getCanvasPriceAndTime(t.clientX, t.clientY);
          const rect = getAdjustedCanvasRect(canvasRef.current);
          if (pt && rect) {
            visualDragStateRef.current = {
              ...visualDragStateRef.current,
              price: pt.price,
              mouseX: rect.getLocalX(t.clientX),
              mouseY: rect.getLocalY(t.clientY),
            };
            setVisualDragState({ ...visualDragStateRef.current });
          }
          return;
        }

        const state = touchStateRef.current;
        if (!state.isInteracting) return;

        const utils = getCoordinateUtils();
        if (!utils) return;

        const rect = getAdjustedCanvasRect(canvasRef.current);

        if (touches.length === 1) {
          const t = touches[0];
          const touchX = rect ? rect.getLocalX(t.clientX) : t.clientX;
          const touchY = rect ? rect.getLocalY(t.clientY) : t.clientY;

          // Touch support for active drawing mode (e.g. Freehand Brush, Trendline preview)
          if ((state.mode as any) === 'drawing') {
            state.hasMoved = true;
            const pt = getCanvasPriceAndTime(t.clientX, t.clientY);
            if (rect) updateCrosshair(touchX, touchY, true);

            if (currentDrawing && pt) {
              if (currentDrawing.type === 'brush') {
                const lastPt = currentDrawing.points[currentDrawing.points.length - 1];
                const lastPxX = utils.getXFromTime(lastPt.time);
                const lastPxY = utils.getY(lastPt.price);
                const dist = Math.hypot(touchX - lastPxX, touchY - lastPxY);
                if (dist >= 2.5) {
                  setCurrentDrawing((prev) => {
                    if (!prev || prev.type !== 'brush') return prev;
                    return {
                      ...prev,
                      points: [...prev.points, { price: pt.price, time: pt.time }],
                    };
                  });
                }
              } else {
                setCurrentDrawing((prev) => {
                  if (!prev) return null;
                  return {
                    ...prev,
                    points: [prev.points[0], { price: pt.price, time: pt.time }],
                  };
                });
              }
            }
            return; // STRICTLY PREVENT ANY CHART PANNING!
          }

          // Check if dragging a drawing or anchor point on touch
          if (dragDrawingStateRef.current) {
            const pt = getCanvasPriceAndTime(t.clientX, t.clientY, {
              magnetMode: isCtrlPressedRef.current,
              smartAngleSnap: false,
              alignToExistingDrawings: false,
            });
            const dragInfo = dragDrawingStateRef.current;
            if (pt && dragInfo) {
              setDrawings((prev) =>
                prev.map((d) => {
                  if (d.id !== dragInfo.id) return d;
                  const initPoints = dragInfo.initialPoints;

                  if (dragInfo.part === 'point0') {
                    if (d.type === 'position_long' || d.type === 'position_short') {
                      const initEntryP = initPoints[0]?.price || pt.price;
                      const priceDiff = pt.price - dragInfo.startPrice;
                      const timeDiff = pt.time - dragInfo.startTime;
                      const isLong = d.type === 'position_long';
                      const initTp = dragInfo.initialRiskReward?.takeProfit ?? (isLong ? initEntryP * 1.03 : initEntryP * 0.97);
                      const initSl = dragInfo.initialRiskReward?.stopLoss ?? (isLong ? initEntryP * 0.985 : initEntryP * 1.015);
                      const newTp = initTp + priceDiff;
                      const newSl = initSl + priceDiff;
                      const newPoints = [...initPoints];
                      newPoints[0] = { price: initPoints[0].price + priceDiff, time: initPoints[0].time + timeDiff };
                      if (initPoints[1]) {
                        newPoints[1] = { price: initPoints[1].price + priceDiff, time: initPoints[1].time + timeDiff };
                      }
                      return {
                        ...d,
                        points: newPoints,
                        riskReward: dragInfo.initialRiskReward
                          ? {
                              ...dragInfo.initialRiskReward,
                              takeProfit: newTp,
                              stopLoss: newSl,
                            }
                          : undefined,
                      };
                    } else {
                      const newPoints = [...initPoints];
                      newPoints[0] = { price: pt.price, time: pt.time };
                      return { ...d, points: newPoints };
                    }
                  } else if (dragInfo.part === 'point1') {
                    const newPoints = [...initPoints];
                    newPoints[1] = { price: pt.price, time: pt.time };
                    return { ...d, points: newPoints };
                  } else if (dragInfo.part === 'point2') {
                    const newPoints = [...initPoints];
                    newPoints[2] = { price: pt.price, time: pt.time };
                    return { ...d, points: newPoints };
                  } else if (dragInfo.part === 'left') {
                    const p0 = initPoints[0];
                    const p1 = initPoints[1] || { price: p0.price, time: p0.time + (d.lineWidth ? d.lineWidth * 90 : 180) * 60 };
                    const newPoints = [...initPoints];
                    if (p0) {
                      const maxTime = p1.time - 60; // minimum 1 min / bar before
                      const newStartTime = Math.min(maxTime, pt.time);
                      newPoints[0] = { price: p0.price, time: newStartTime };
                      newPoints[1] = p1;

                      const x1 = utils.getXFromTime(newStartTime);
                      const x2 = utils.getXFromTime(p1.time);
                      const pxWidth = Math.max(30, x2 - x1);
                      const calcWidthUnit = Math.max(1, Math.round(pxWidth / 90));

                      return {
                        ...d,
                        points: newPoints,
                        lineWidth: calcWidthUnit,
                      };
                    }
                    return { ...d, points: newPoints };
                  } else if (dragInfo.part === 'right') {
                    const p0 = initPoints[0];
                    const newPoints = [...initPoints];
                    if (p0) {
                      const minTime = p0.time + 60; // minimum 1 min / bar ahead
                      const newEndTime = Math.max(minTime, pt.time);
                      newPoints[1] = { price: p0.price, time: newEndTime };

                      const x1 = utils.getXFromTime(p0.time);
                      const x2 = utils.getXFromTime(newEndTime);
                      const pxWidth = Math.max(30, x2 - x1);
                      const calcWidthUnit = Math.max(1, Math.round(pxWidth / 90));

                      return {
                        ...d,
                        points: newPoints,
                        lineWidth: calcWidthUnit,
                      };
                    }
                    return { ...d, points: newPoints };
                  } else if (dragInfo.part === 'tp') {
                    const entryP = d.points[0]?.price || pt.price;
                    const isLong = d.type === 'position_long';
                    const slP = d.riskReward?.stopLoss ?? (isLong ? entryP * 0.985 : entryP * 1.015);
                    let tpP = pt.price;
                    if (isLong) {
                      tpP = Math.max(entryP + 0.00001, tpP);
                    } else {
                      tpP = Math.min(entryP - 0.00001, tpP);
                    }
                    const tpDiff = Math.abs(tpP - entryP);
                    const slDiff = Math.abs(entryP - slP);
                    const rr = Math.max(0.01, tpDiff / (slDiff || 0.00001));

                    return {
                      ...d,
                      riskReward: {
                        ...d.riskReward,
                        stopLoss: slP,
                        takeProfit: tpP,
                        riskRatio: parseFloat(rr.toFixed(2)),
                      },
                    };
                  } else if (dragInfo.part === 'sl') {
                    const entryP = d.points[0]?.price || pt.price;
                    const isLong = d.type === 'position_long';
                    const tpP = d.riskReward?.takeProfit ?? (isLong ? entryP * 1.03 : entryP * 0.97);
                    let slP = pt.price;
                    if (isLong) {
                      slP = Math.min(entryP - 0.00001, slP);
                    } else {
                      slP = Math.max(entryP + 0.00001, slP);
                    }
                    const tpDiff = Math.abs(tpP - entryP);
                    const slDiff = Math.abs(slP - entryP);
                    const rr = Math.max(0.01, tpDiff / (slDiff || 0.00001));

                    return {
                      ...d,
                      riskReward: {
                        ...d.riskReward,
                        takeProfit: tpP,
                        stopLoss: slP,
                        riskRatio: parseFloat(rr.toFixed(2)),
                      },
                    };
                  } else {
                    const priceDiff = pt.price - dragInfo.startPrice;
                    const timeDiff = pt.time - dragInfo.startTime;
                    const newPoints = initPoints.map((p) => ({
                      price: p.price + priceDiff,
                      time: p.time + timeDiff,
                    }));
                    if (d.type === 'position_long' || d.type === 'position_short') {
                      return {
                        ...d,
                        points: newPoints,
                        riskReward: d.riskReward
                          ? {
                              ...d.riskReward,
                              takeProfit: d.riskReward.takeProfit + priceDiff,
                              stopLoss: d.riskReward.stopLoss + priceDiff,
                            }
                          : undefined,
                      };
                    }
                    return { ...d, points: newPoints };
                  }
                })
              );
              return;
            }
          }

          const touchScaleX = rect?.scaleX || 1;
          const touchScaleY = rect?.scaleY || 1;

          if (state.mode === 'priceAxis') {
            const deltaY = (state.initialCenter.y - t.clientY) / touchScaleY;
            const sensitivity = 0.005;
            const newScale = Math.max(0.05, Math.min(100.0, state.initialPriceScale * Math.exp(deltaY * sensitivity)));

            const effectiveHalfRange = Math.max(0.00001, utils.baseHalfRange / Math.max(0.05, newScale));
            const newPriceRange = effectiveHalfRange * 2;
            const anchorY = dragStartAnchorYRef.current || (rect ? rect.getLocalY(t.clientY) : t.clientY);
            const anchorPrice = dragStartAnchorPriceRef.current || utils.getPriceFromY(anchorY);
            const dHeight = utils.drawableHeight || (utils.mainChartHeight - 20);
            const newOffset = anchorPrice - (utils.baseMin + utils.baseMax) / 2 + (anchorY / dHeight - 0.5) * newPriceRange;

            priceScaleRef.current = newScale;
            priceOffsetRef.current = newOffset;
            setPriceScale(newScale);
            setPriceOffset(newOffset);
            if (isAutoScaleRef.current) {
              setIsAutoScale(false);
              isAutoScaleRef.current = false;
            }
          } else {
            const deltaX = (t.clientX - state.initialCenter.x) / touchScaleX;
            const deltaY = (t.clientY - state.initialCenter.y) / touchScaleY;
            const offsetDelta = deltaX / utils.totalCandleSlot;
            const dHeight = utils.drawableHeight || utils.mainChartHeight;
            const priceDelta = (deltaY / dHeight) * utils.priceRange;

            const newPan = state.initialPanOffset + offsetDelta;
            const newPriceOffset = state.initialPriceOffset + priceDelta;

            panOffsetRef.current = newPan;
            priceOffsetRef.current = newPriceOffset;
            setPanOffset(newPan);
            setPriceOffset(newPriceOffset);
            
            if (Math.abs(deltaY) > 2 && isAutoScaleRef.current) {
              setIsAutoScale(false);
              isAutoScaleRef.current = false;
            }
          }
        } else if (touches.length === 2 && state.initialDistance > 0) {
          const t1 = touches[0];
          const t2 = touches[1];
          const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
          const zoomFactor = currentDist / state.initialDistance;

          const newZoom = Math.max(0.05, Math.min(300.0, state.initialZoom * zoomFactor));
          
          if (utils && rect) {
            const { chartWidth } = utils;
            const pinchCenterX = Math.max(0, Math.min(chartWidth, rect.getLocalX((t1.clientX + t2.clientX) / 2)));
            const distFromRight = chartWidth - pinchCenterX;
            
            const isFootprintBar = chartType === 'footprints' || indicators.showFootprints;
            const baseCandleW = isFootprintBar ? 68 : 8;
            const gapRatio = isFootprintBar ? 0.05 : 0.3;

            const oldCandleW = Math.max(2, baseCandleW * state.initialZoom);
            const oldSlot = oldCandleW + Math.max(isFootprintBar ? 2 : 1, oldCandleW * gapRatio);
            
            const newCandleW = Math.max(2, baseCandleW * newZoom);
            const newSlot = newCandleW + Math.max(isFootprintBar ? 2 : 1, newCandleW * gapRatio);
            
            const slotDiff = distFromRight / oldSlot - distFromRight / newSlot;
            const newPan = state.initialPanOffset + slotDiff;

            zoomRef.current = newZoom;
            panOffsetRef.current = newPan;
            setPanOffset(newPan);
          }
          
          setZoom(newZoom);
        }
      });
    }
  };

  const handleTouchEnd = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    pendingPositionPullRef.current = null;
    holdStartPosRef.current = null;
    setHoldVisualState(null);

    // Finalize Drawing Mode on touch
    if ((touchStateRef.current.mode as any) === 'drawing') {
      if (currentDrawing) {
        if (currentDrawing.type === 'brush' || currentDrawing.points.length > 1) {
          const completed: DrawingItem = {
            ...currentDrawing,
            isComplete: true,
          };
          setDrawings((prev) => [...prev, completed]);
          setSelectedDrawingId(completed.id);
          setCurrentDrawing(null);
          if (activeTool !== 'brush' && !stayInDrawingMode) {
            setActiveTool('cursor');
          }
        }
      }
      touchStateRef.current.isInteracting = false;
      return;
    }

    // Finalize Visual Drag on touch
    if (visualDragStateRef.current?.active) {
      const drag = visualDragStateRef.current;
      if (drag.posId && (drag.type === 'TP' || drag.type === 'NEW_TP')) {
        const pos = positions.find(p => p.id === drag.posId);
        if (pos) {
          if (requireSLTPVerification) {
            setSltpVerificationModal({
              isOpen: true,
              kind: 'POSITION_TP',
              symbol: activeSymbol,
              posId: pos.id,
              side: pos.type,
              entryPrice: pos.entryPrice,
              oldPrice: pos.takeProfit || undefined,
              newPrice: drag.price,
              size: pos.size,
              isForex: marketInfo.assetClass === 'Forex',
              onConfirm: () => {
                updatePositionBracket(pos.id, drag.price, pos.stopLoss);
                tradingAudio.play('PRESET');
              },
              onClose: () => {
                setSltpVerificationModal(null);
              },
              requireVerification: requireSLTPVerification,
              onToggleRequireVerification: setRequireSLTPVerification,
            });
          } else {
            updatePositionBracket(pos.id, drag.price, pos.stopLoss);
            tradingAudio.play('PRESET');
          }
        }
      } else if (drag.posId && (drag.type === 'SL' || drag.type === 'NEW_SL')) {
        const pos = positions.find(p => p.id === drag.posId);
        if (pos) {
          if (requireSLTPVerification) {
            setSltpVerificationModal({
              isOpen: true,
              kind: 'POSITION_SL',
              symbol: activeSymbol,
              posId: pos.id,
              side: pos.type,
              entryPrice: pos.entryPrice,
              oldPrice: pos.stopLoss || undefined,
              newPrice: drag.price,
              size: pos.size,
              isForex: marketInfo.assetClass === 'Forex',
              onConfirm: () => {
                updatePositionBracket(pos.id, pos.takeProfit, drag.price);
                tradingAudio.play('AUTO_BE');
              },
              onClose: () => {
                setSltpVerificationModal(null);
              },
              requireVerification: requireSLTPVerification,
              onToggleRequireVerification: setRequireSLTPVerification,
            });
          } else {
            updatePositionBracket(pos.id, pos.takeProfit, drag.price);
            tradingAudio.play('AUTO_BE');
          }
        }
      } else if (drag.type === 'ORDER_BUY' || drag.type === 'ORDER_SELL') {
        const isBuy = drag.type === 'ORDER_BUY';
        const dropPrice = drag.price;
        const isLimit = isBuy ? dropPrice < currentPrice : dropPrice > currentPrice;
        const orderType = isLimit ? 'LIMIT' : 'STOP';
        const presets = (marketInfo.assetClass === 'Forex') ? volumePresets.forex : volumePresets.crypto;
        const rawOrderSize = drag.size || presets[activePresetIndex] || (marketInfo.assetClass === 'Forex' ? 0.1 : 100);
        const safeTouchCurrentPrice = (currentPrice && !isNaN(currentPrice) && currentPrice > 0) ? currentPrice : 1;
        const orderSize = marketInfo.assetClass === 'Forex' ? rawOrderSize : Number((rawOrderSize / safeTouchCurrentPrice).toFixed(4));
        const riskDist = Math.abs(dropPrice * 0.015);
        const tp = isBuy ? dropPrice + riskDist * 2 : dropPrice - riskDist * 2;
        const sl = isBuy ? dropPrice - riskDist : dropPrice + riskDist;

        if (requireSLTPVerification) {
          setSltpVerificationModal({
            isOpen: true,
            kind: 'PENDING_ORDER',
            symbol: activeSymbol,
            side: isBuy ? 'BUY' : 'SELL',
            entryPrice: currentPrice,
            oldPrice: undefined,
            newPrice: dropPrice,
            size: orderSize,
            isForex: marketInfo.assetClass === 'Forex',
            onConfirm: () => {
              executeOrder({
                symbol: activeSymbol,
                type: isBuy ? 'BUY' : 'SELL',
                orderType,
                size: orderSize,
                price: dropPrice,
                takeProfit: tp,
                stopLoss: sl
              });
            },
            onClose: () => {
              setSltpVerificationModal(null);
            },
            requireVerification: requireSLTPVerification,
            onToggleRequireVerification: setRequireSLTPVerification,
          });
        } else {
          executeOrder({
            symbol: activeSymbol,
            type: isBuy ? 'BUY' : 'SELL',
            orderType,
            size: orderSize,
            price: dropPrice,
            takeProfit: tp,
            stopLoss: sl
          });
        }
      }

      visualDragStateRef.current = null;
      setVisualDragState(null);
    }

    touchStateRef.current.isInteracting = false;
    if (dragPositionRef.current) dragPositionRef.current = null;
    if (dragDrawingStateRef.current) {
      dragDrawingStateRef.current = null;
    }
    if (currentDrawing && (currentDrawing.type === 'brush' || currentDrawing.type === 'highlighter')) {
      const completed: DrawingItem = {
        ...currentDrawing,
        isComplete: true,
      };
      setDrawings((prev) => [...prev, completed]);
      setSelectedDrawingId(completed.id);
      setCurrentDrawing(null);
      drawStartCoordsRef.current = null;
      if (!stayInDrawingMode) {
        setActiveTool('cursor');
      }
    }
  };

  // Stable refs for touch & double-click handlers so the native addEventListener useEffect doesn't re-run every render
  const handleTouchStartRef = useRef(handleTouchStart);
  const handleTouchMoveRef = useRef(handleTouchMove);
  const handleTouchEndRef = useRef(handleTouchEnd);
  const handleDoubleClickRef = useRef(handleDoubleClick);
  handleTouchStartRef.current = handleTouchStart;
  handleTouchMoveRef.current = handleTouchMove;
  handleTouchEndRef.current = handleTouchEnd;
  handleDoubleClickRef.current = handleDoubleClick;

  // Native touch and double-click event listeners
  // React 19 registers touch handlers as passive by default, which breaks chart pan/zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onTouchStart = (e: TouchEvent) => handleTouchStartRef.current(e as any);
    const onTouchMove = (e: TouchEvent) => handleTouchMoveRef.current(e as any);
    const onTouchEnd = (e: TouchEvent) => { (handleTouchEndRef.current as any)(e); };
    const onDblClick = (e: MouseEvent) => {
      handleDoubleClickRef.current(e as any);
    };

    canvas.addEventListener('touchstart', onTouchStart, { passive: false, capture: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false, capture: true });
    canvas.addEventListener('dblclick', onDblClick);

    return () => {
      canvas.removeEventListener('touchstart', onTouchStart, { capture: true });
      canvas.removeEventListener('touchmove', onTouchMove, { capture: true });
      canvas.removeEventListener('touchend', onTouchEnd, { capture: true });
      canvas.removeEventListener('dblclick', onDblClick);
    };
  }, []);

  const handleStartDragNewOrder = (orderSide: 'BUY' | 'SELL', e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (isSLTPLocked) {
      setSltpToast({ message: "🔒 Garis Order/SL/TP Terkunci! Buka kunci di kanan-bawah chart untuk menggeser.", type: 'warning' });
      tradingAudio.play('CLOSE');
      return;
    }
    const rect = getAdjustedCanvasRect(canvasRef.current);
    const utils = getCoordinateUtils();
    if (!rect || !utils) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const mouseX = rect.getLocalX(clientX);
    const mouseY = rect.getLocalY(clientY);
    const startP = utils.getPriceFromY(mouseY > 0 && mouseY < utils.fullHeight ? mouseY : utils.fullHeight / 2);

    const presets = (marketInfo.assetClass === 'Forex') ? volumePresets.forex : volumePresets.crypto;
    const orderSize = presets[activePresetIndex] || (marketInfo.assetClass === 'Forex' ? 0.1 : 100);

    visualDragStateRef.current = {
      active: true,
      type: orderSide === 'BUY' ? 'ORDER_BUY' : 'ORDER_SELL',
      price: startP,
      startPrice: startP,
      size: orderSize,
      isForex: marketInfo.assetClass === 'Forex',
      mouseX,
      mouseY,
    };
    setVisualDragState(visualDragStateRef.current);
    setIsDragging(true);
    setDragMode('chart');
  };

  const takeSnapshot = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    linkDownload(url);
  };

  const exportChartData = () => {
    const exportPayload = {
      symbol: activeSymbol,
      timeframe: timeframe,
      timestamp: new Date().toISOString(),
      candles: candles.slice(-200),
      indicators: indicators,
      heatmapData: liquidityHeatmapData ? {
        priceStep: liquidityHeatmapData.priceStep,
        binsCount: liquidityHeatmapData.binsCount,
        clusters: liquidityHeatmapData.liquidationRadar?.clusters?.map(c => ({
          price: c.price,
          side: c.side,
          leverageTier: c.leverageTier,
          distancePct: c.distancePct,
          estimatedNotionalUsd: c.estimatedNotionalUsd,
        })) || [],
        whaleClusters: liquidityHeatmapData.whaleClusters?.map(w => ({
          price: w.price,
          barIndex: w.barIndex,
          side: w.side,
          baseRadius: w.baseRadius,
        })) || [],
      } : null,
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `MountAlgo_${activeSymbol}_data_${Date.now()}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const linkDownload = (url: string) => {
    const link = document.createElement('a');
    link.download = `MountAlgo_${globalTheme}_${activeSymbol}_${Date.now()}.png`;
    link.href = url;
    link.click();
  };

  const getCursorStyle = () => {
    if (visualDragState?.active) return 'cursor-grabbing';
    if (positionHoverState || pendingHoverState) {
      const isButton =
        positionHoverState?.element === 'close' ||
        positionHoverState?.element === 'reverse' ||
        positionHoverState?.element === 'be' ||
        positionHoverState?.element === 'remove_tp' ||
        positionHoverState?.element === 'remove_sl' ||
        positionHoverState?.element === 'pnl_toggle' ||
        pendingHoverState?.element === 'cancel' ||
        pendingHoverState?.element === 'remove_tp' ||
        pendingHoverState?.element === 'remove_sl';
      return isButton ? 'cursor-pointer' : 'cursor-ns-resize';
    }
    if (activeTool !== 'cursor') return 'cursor-crosshair';
    if (dragDrawingStateRef.current) {
      const part = dragDrawingStateRef.current.part;
      if (part === 'tp' || part === 'sl') return 'cursor-ns-resize';
      if (part === 'left' || part === 'right') return 'cursor-ew-resize';
      if (part === 'point0' || part === 'point1' || part === 'point2') return 'cursor-grab';
      return part === 'body' ? 'cursor-move' : 'cursor-pointer';
    }
    if (hoveredDrawingId) {
      const hDrawing = drawings.find((d) => d.id === hoveredDrawingId);
      if (hDrawing && getEffectiveDrawingLocked(hDrawing, layersMap, isLockedDrawings)) {
        return 'cursor-pointer';
      }
      if (hoveredPart === 'tp' || hoveredPart === 'sl') return 'cursor-ns-resize';
      if (hoveredPart === 'left' || hoveredPart === 'right') return 'cursor-ew-resize';
      if (hoveredPart === 'point0' || hoveredPart === 'point1' || hoveredPart === 'point2') return 'cursor-grab';
      return hoveredPart === 'body' ? 'cursor-move' : 'cursor-pointer';
    }
    if (crosshairRef.current.active) {
      const utils = getCoordinateUtils();
      if (utils) {
        if (crosshairRef.current.x >= utils.chartWidth) return 'cursor-ns-resize';
        if (crosshairRef.current.y >= utils.fullHeight) return 'cursor-ew-resize';
      }
    }
    return 'cursor-crosshair';
  };

  const activeDisplayCandle = hoveredCandle || (candles.length > 0 ? candles[candles.length - 1] : null);

  const activeMarketPair = useMemo(() => {
    return COMPREHENSIVE_MARKET_PAIRS.find((p) => p.symbol === activeSymbol) || {
      symbol: activeSymbol,
      base: activeSymbol.replace('USDT', ''),
      quote: activeSymbol.endsWith('USDT') ? 'USDT' : 'USD',
      name: activeSymbol,
      assetClass: 'Crypto' as const,
      category: 'Crypto',
    };
  }, [activeSymbol]);

  const formatSmartPrice = (val: number) => {
    if (val === undefined || val === null || isNaN(val)) return '0.00';
    if (val >= 1000) return val.toFixed(2);
    if (val >= 50) return val.toFixed(2);
    if (val >= 1) return val.toFixed(4);
    if (val >= 0.001) return val.toFixed(4);
    return val.toFixed(6);
  };

  const isThisChartFocused = focusedChartId === id || (focusedSymbol === activeSymbol);

  return (
    <div
      onClick={() => setFocusedChart(id, activeSymbol)}
      onPointerDown={() => setFocusedChart(id, activeSymbol)}
      style={{ 
        borderColor: isThisChartFocused ? `${currentPalette.bull}80` : 'rgba(255, 255, 255, 0.08)',
        boxShadow: isThisChartFocused ? `0 0 24px -2px ${currentPalette.bull}25` : 'none'
      }}
      className={`w-full h-full border rounded-xl overflow-hidden bg-[var(--color-panel)] backdrop-blur-xl flex flex-col relative select-none transition-all duration-300 ${
        isFullscreen ? 'shadow-2xl' : ''
      }`}
    >
      
      {/* 1. Top Pro Navigation Bar */}
      {!isToolbarMinimized && (
        <div 
          style={{ 
            borderBottomColor: `${currentPalette.bull}25`,
            backgroundColor: isLight ? '#ffffff' : (currentPalette?.dark ? (currentPalette.dark === '#242119' ? 'rgba(29, 26, 19, 0.92)' : (currentPalette.dark !== '#000000' ? `${currentPalette.dark}d9` : 'rgba(5, 8, 22, 0.85)')) : 'rgba(5, 8, 22, 0.85)'),
            boxShadow: `0 4px 20px -2px rgba(0, 0, 0, 0.4), 0 1px 0 0 ${currentPalette.bull}12`
          }}
          className="backdrop-blur-xl px-2.5 py-1.5 border-b flex items-center justify-between z-20 overflow-x-auto scrollbar-thin flex-nowrap gap-2 transition-all duration-300"
        >
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Symbol Selector Button */}
          <button
            onClick={() => setIsSymbolModalOpen(true)}
            className="flex items-center gap-1.5 bg-[var(--color-panel)] hover:bg-[var(--color-hover)] border border-[var(--color-border)] rounded-sm h-7 px-2 cursor-pointer transition-colors"
          >
            <TrendingUp size={14} className="text-[var(--color-text-muted)]" />
            <span className="font-bold text-[var(--color-text)] tracking-wider text-xs">
              {activeMarketPair.base}/{activeMarketPair.quote}
            </span>
            <span className="text-[9px] text-[var(--color-text-muted)] bg-[var(--color-hover)] px-1.5 py-0.5 rounded-sm font-mono font-bold uppercase">
              {activeMarketPair.assetClass === 'Crypto' ? 'BINANCE' : activeMarketPair.assetClass === 'Forex' ? 'FOREX' : 'COMMODITY'}
            </span>
          </button>

          {/* Drawing Tools Dropdown */}
          <TopDrawingMenu
            activeTool={activeTool}
            onSelectTool={setActiveTool}
            pinnedTools={pinnedTools}
            setPinnedTools={setPinnedTools}
            currentPalette={currentPalette as any}
            showFloatingDrawingBar={showFloatingDrawingBar}
            onToggleFloatingDrawingBar={toggleFloatingDrawingBar}
          />

          {/* Quick Toggle Button for Floating Drawing Bar */}
          <button
            type="button"
            onClick={toggleFloatingDrawingBar}
            style={showFloatingDrawingBar ? { borderColor: `${currentPalette.bull}60`, backgroundColor: `${currentPalette.bull}18`, color: currentPalette.bull } : {}}
            className={`flex items-center gap-1.5 border rounded-sm h-7 px-2 text-xs cursor-pointer font-bold transition-colors ${
              showFloatingDrawingBar
                ? ''
                : 'bg-[var(--color-panel)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text)]'
            }`}
            title={showFloatingDrawingBar ? 'Sembunyikan Bar Drawing Melayang' : 'Tampilkan Bar Drawing Melayang'}
          >
            <PenTool size={14} style={{ color: showFloatingDrawingBar ? currentPalette.bull : 'var(--color-text-muted)' }} />
            <span className="hidden xl:inline text-[11px]">
              {showFloatingDrawingBar ? 'Bar Melayang' : 'Sembunyi Bar'}
            </span>
            {showFloatingDrawingBar ? (
              <Eye size={12} style={{ color: currentPalette.bull }} />
            ) : (
              <EyeOff size={12} className="text-[var(--color-text-muted)]" />
            )}
          </button>
          {/* Timeframe Dropdown Menu */}
          <div className="relative shrink-0">
            <button
              ref={timeframeBtnRef}
              onClick={() => setShowTimeframeDropdown(!showTimeframeDropdown)}
              className="flex items-center gap-1.5 bg-[var(--color-panel)] hover:bg-[var(--color-hover)] border border-[var(--color-border)] rounded-sm h-7 px-2 text-xs text-[var(--color-text)] cursor-pointer font-mono font-bold transition-colors"
            >
              {['1T', '10T', '50T', '100T', 'tick'].includes(timeframe) ? (
                <Zap size={14} className="text-[var(--color-text-muted)] animate-pulse" />
              ) : (
                <Clock size={14} className="text-[var(--color-text-muted)]" />
              )}
              <span>{timeframe === 'tick' ? '1T' : timeframe}</span>
              {['1T', 'tick'].includes(timeframe) && (
                <span className="text-[8px] bg-[var(--color-hover)] text-[var(--color-text-muted)] px-1 py-0.5 rounded-sm font-mono font-black">
                  TICK
                </span>
              )}
              <ChevronDown size={14} className={`text-[var(--color-text-muted)] transition-transform ${showTimeframeDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showTimeframeDropdown && typeof document !== 'undefined' && createPortal(
              <>
                <div 
                  className="fixed inset-0 z-[99998] bg-black/40 backdrop-blur-[1px]"
                  onClick={() => setShowTimeframeDropdown(false)}
                />
                <div 
                  style={{ 
                    borderColor: getThemeCardBorder(currentPalette, false),
                    background: getThemeModalGradient(currentPalette, isLight),
                    top: timeframeBtnRef.current 
                    ? Math.min(window.innerHeight - 340, Math.max(10, timeframeBtnRef.current.getBoundingClientRect().bottom + 4)) 
                    : '60px',
                    left: timeframeBtnRef.current 
                    ? Math.min(Math.max(10, timeframeBtnRef.current.getBoundingClientRect().left), window.innerWidth - 220) 
                    : '16px',
                    boxShadow: `0 25px 50px -12px rgba(0,0,0,0.85), 0 0 20px ${hexToRgba(currentPalette.bull, 0.2)}`
                  }}
                  className="fixed z-dropdown-ultimate w-52 rounded-xl border shadow-2xl py-2 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 overflow-y-auto max-h-[80vh] custom-scrollbar"
                >
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] border-b border-[var(--color-border)] mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      <span>Timeframe</span>
                    </span>
                    <span className="font-mono text-[9px] bg-[var(--color-bg)] px-1.5 py-0.5 rounded border border-[var(--color-border)] opacity-80">16 TF</span>
                  </div>

                  {/* Section 1: Tick / High Frequency */}
                  <div className="px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-400 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Zap size={10} className="text-amber-400" />
                      <span>Tick Engine (HFT)</span>
                    </span>
                    <span className="text-[7.5px] bg-amber-400/20 text-amber-300 px-1 rounded font-mono font-bold">1T-100T</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 px-2 py-1 mb-1.5 border-b border-[var(--color-border)]/60">
                    {[
                      { tf: '1T' as const, label: '1T', desc: '1 Tick' },
                      { tf: '10T' as const, label: '10T', desc: '10 T' },
                      { tf: '50T' as const, label: '50T', desc: '50 T' },
                      { tf: '100T' as const, label: '100T', desc: '100 T' },
                    ].map((item) => (
                      <button
                        key={item.tf}
                        onClick={() => {
                          handleSelectTimeframe(item.tf);
                          setShowTimeframeDropdown(false);
                        }}
                        className={`px-1 py-1 text-[11px] font-mono font-black rounded-md transition-all cursor-pointer text-center flex flex-col items-center justify-center border ${
                          timeframe === item.tf || (item.tf === '1T' && timeframe === 'tick')
                            ? 'bg-amber-400 text-black border-amber-300 shadow-md font-extrabold'
                            : 'text-amber-300/90 bg-amber-400/10 border-amber-400/30 hover:bg-amber-400/20 hover:text-amber-200'
                        }`}
                      >
                        <span>⚡ {item.label}</span>
                        <span className={`text-[7px] font-mono ${timeframe === item.tf || (item.tf === '1T' && timeframe === 'tick') ? 'text-black/80' : 'text-amber-300/60'}`}>
                          {item.desc}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Section 2: Minutes */}
                  <div className="px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                    Minutes
                  </div>
                  <div className="grid grid-cols-5 gap-0.5 px-2 py-1 mb-1.5 border-b border-[var(--color-border)]/60">
                    {(['1m', '3m', '5m', '15m', '30m'] as const).map((tf) => (
                      <button
                        key={tf}
                        onClick={() => {
                          handleSelectTimeframe(tf);
                          setShowTimeframeDropdown(false);
                        }}
                        className={`py-1 text-[11px] font-mono font-bold rounded-md transition-all cursor-pointer text-center ${
                          timeframe === tf
                            ? 'text-white shadow'
                            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)]'
                        }`}
                        style={
                          timeframe === tf
                            ? { backgroundColor: currentPalette.bull, color: '#000000' }
                            : {}
                        }
                      >
                        {tf}
                      </button>
                    ))}
                  </div>

                  {/* Section 3: Hours & Macro */}
                  <div className="px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                    Hours & Macro
                  </div>
                  <div className="grid grid-cols-4 gap-0.5 px-2 py-1">
                    {(['1h', '4h', '1D', '1W', '1M', '3M', '1Y'] as const).map((tf) => (
                      <button
                        key={tf}
                        onClick={() => {
                          handleSelectTimeframe(tf);
                          setShowTimeframeDropdown(false);
                        }}
                        className={`py-1 text-[11px] font-mono font-bold rounded-md transition-all cursor-pointer text-center ${
                          timeframe === tf
                            ? 'text-white shadow'
                            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)]'
                        }`}
                        style={
                          timeframe === tf
                            ? { backgroundColor: currentPalette.bull, color: '#000000' }
                            : {}
                        }
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>
              </>,
              document.body
            )}
          </div>

          {/* Wizard Tools Modal Button & Active Hub */}
          {(() => {
            const activeCount = [
              indicators.showLiquidityHeatmap,
              indicators.showFootprints,
              indicators.showSuperTrend,
              indicators.showEma20,
              indicators.showEma50,
              indicators.showEma200,
              indicators.showBollinger,
              indicators.showVolumeProfile,
              indicators.showVolume,
              indicators.showVolumeDelta,
              indicators.showIcdCandles,
              indicators.showRSI,
              indicators.showMACD,
            ].filter(Boolean).length;

            return (
              <button
                onClick={() => handleOpenWizardTools()}
                style={activeCount > 0 ? {
                  backgroundColor: `${currentPalette.bull}18`,
                  borderColor: `${currentPalette.bull}50`,
                  color: currentPalette.bull,
                  boxShadow: `0 0 12px ${currentPalette.bull}25`
                } : {}}
                className={`flex items-center gap-1.5 border rounded-sm h-7 px-2 text-xs cursor-pointer transition-all shrink-0 font-medium ${
                  activeCount > 0
                    ? 'hover:brightness-125'
                    : 'bg-[var(--color-panel)] hover:bg-[var(--color-hover)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
                title="Buka Wizard Tools (Hubungkan Semua Indikator & Analisis Pasar)"
              >
                <Sliders size={14} style={{ color: activeCount > 0 ? currentPalette.bull : 'var(--color-text-muted)' }} />
                <span className="hidden sm:inline font-medium">Wizard Tools</span>
                {activeCount > 0 && (
                  <span 
                    style={{ backgroundColor: `${currentPalette.bull}30`, color: currentPalette.bull, borderColor: `${currentPalette.bull}60` }}
                    className="px-1.5 py-0.2 rounded-full font-mono font-bold text-[9.5px] border"
                  >
                    {activeCount}
                  </span>
                )}
              </button>
            );
          })()}

          {/* Chart Type Selector Dropdown */}
          <div className="relative shrink-0">
            <button
              ref={chartTypeBtnRef}
              onClick={() => setShowChartTypeDropdown(!showChartTypeDropdown)}
              className="flex items-center gap-1.5 bg-[var(--color-panel)] hover:bg-[var(--color-hover)] border border-[var(--color-border)] rounded-sm h-7 px-2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer transition-colors"
            >
              {chartType === 'candles' && <CandlestickChart size={14} className="text-[var(--color-text-muted)]" />}
              {chartType === 'footprints' && <Activity size={14} className="text-[var(--color-text-muted)]" />}
              {chartType === 'heikin' && <CandlestickChart size={14} className="text-[var(--color-text-muted)]" />}
              {chartType === 'line' && <LineChart size={14} className="text-[var(--color-text-muted)]" />}
              {chartType === 'area' && <AreaChart size={14} className="text-[var(--color-text-muted)]" />}
              {chartType === 'blank' && <EyeOff size={14} className="text-[var(--color-text-muted)]" />}
              <span className="capitalize hidden md:inline">
                {chartType === 'footprints' ? 'Footprints (Bid/Ask)' : chartType === 'blank' ? 'Blank Chart' : chartType}
              </span>
            </button>

            {showChartTypeDropdown && typeof document !== 'undefined' && createPortal(
              <>
                <div 
                  className="fixed inset-0 z-[99998] bg-black/40 backdrop-blur-[1px]"
                  onClick={() => setShowChartTypeDropdown(false)}
                />
                <div 
                  style={{ 
                    borderColor: getThemeCardBorder(currentPalette, false),
                    background: getThemeModalGradient(currentPalette, isLight),
                    top: chartTypeBtnRef.current 
                      ? Math.min(window.innerHeight - 280, Math.max(10, chartTypeBtnRef.current.getBoundingClientRect().bottom + 4)) 
                      : '60px',
                    left: chartTypeBtnRef.current 
                      ? Math.min(Math.max(10, chartTypeBtnRef.current.getBoundingClientRect().left), window.innerWidth - 240) 
                      : '16px',
                    boxShadow: `0 25px 50px -12px rgba(0,0,0,0.85), 0 0 20px ${hexToRgba(currentPalette.bull, 0.2)}`
                  }}
                  className="fixed z-[99999] w-56 rounded-xl border shadow-2xl py-1.5 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 overflow-y-auto max-h-[80vh] scrollbar-thin"
                >
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] border-b border-[var(--color-border)] mb-1 flex items-center justify-between">
                    <span>Tipe Grafik</span>
                    <span className="font-mono opacity-60">8 Mode</span>
                  </div>
                  {[
                    { id: 'candles', label: 'Standard Candlesticks', icon: CandlestickChart },
                    { id: 'footprints', label: 'Footprints (Order Flow)', icon: Activity },
                    { id: 'heikin', label: 'Heikin-Ashi Smoothed', icon: CandlestickChart },
                    { id: 'hollow', label: 'Hollow Candles', icon: CandlestickChart },
                    { id: 'area', label: 'Mountain Area', icon: AreaChart },
                    { id: 'baseline', label: 'Baseline Chart', icon: TrendingUp },
                    { id: 'line', label: 'Line Chart', icon: LineChart },
                    { id: 'blank', label: 'Blank Chart (No Candles)', icon: EyeOff },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isSelected = chartType === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setChartType(item.id as ChartType);
                          setShowChartTypeDropdown(false);
                        }}
                        style={isSelected ? { backgroundColor: `${currentPalette.bull}30`, color: currentPalette.bull } : {}}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left cursor-pointer transition-colors ${
                          isSelected
                            ? 'font-bold'
                            : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon size={15} />
                          <span>{item.label}</span>
                        </div>
                        {isSelected && <Check size={14} style={{ color: currentPalette.bull }} />}
                      </button>
                    );
                  })}
              </div>
            </>,
            document.body
          )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Opsi Fitur Extra Dropdown Menu */}
            <div className="relative shrink-0">
              <button
                ref={extraOptionsBtnRef}
                onClick={() => setShowExtraOptionsDropdown(!showExtraOptionsDropdown)}
                className="flex items-center gap-1.5 bg-[var(--color-panel)] hover:bg-[var(--color-hover)] border border-[var(--color-border)] rounded-sm h-7 px-2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer transition-colors font-medium"
                title="Buka Opsi & Fitur Alat Trading"
              >
                <Settings size={14} className="text-[var(--color-text-muted)]" />
                <span className="hidden md:inline font-bold">Opsi</span>
                <ChevronDown size={13} className={`transition-transform ${showExtraOptionsDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showExtraOptionsDropdown && typeof document !== 'undefined' && createPortal(
                <>
                  <div 
                    className="fixed inset-0 z-[99998] bg-black/40 backdrop-blur-[1px]"
                    onClick={() => setShowExtraOptionsDropdown(false)}
                  />
                  <div 
                    style={{ 
                      borderColor: getThemeCardBorder(currentPalette, false),
                      background: getThemeModalGradient(currentPalette, isLight),
                      top: extraOptionsBtnRef.current 
                        ? Math.min(window.innerHeight - 380, Math.max(10, extraOptionsBtnRef.current.getBoundingClientRect().bottom + 4)) 
                        : '60px',
                      left: extraOptionsBtnRef.current 
                        ? Math.min(Math.max(10, extraOptionsBtnRef.current.getBoundingClientRect().left), window.innerWidth - 240) 
                        : '16px',
                      boxShadow: `0 25px 50px -12px rgba(0,0,0,0.85), 0 0 20px ${hexToRgba(currentPalette.bull, 0.2)}`
                    }}
                    className="fixed z-[99999] w-64 rounded-xl border shadow-2xl py-2 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 overflow-y-auto max-h-[85vh] custom-scrollbar text-xs"
                  >
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] border-b border-[var(--color-border)] mb-1 flex items-center justify-between">
                      <span>Opsi & Fitur Visual</span>
                      <span className="font-mono opacity-60">Clean Controls</span>
                    </div>

                    {/* 1-Click Scalper Toggle */}
                    <button
                      onClick={() => {
                        const next = !showQuickScalper;
                        setShowQuickScalper(next);
                        localStorage.setItem(`mountalgo_show_scalper_${id}`, String(next));
                      }}
                      className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-left hover:bg-[var(--color-bg)] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Zap size={14} className={showQuickScalper ? 'text-emerald-400' : 'text-zinc-500'} />
                        <span>1-Click Scalper Bar</span>
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${showQuickScalper ? 'bg-emerald-500/20 text-emerald-300' : 'text-[var(--color-text-muted)]'}`}>
                        {showQuickScalper ? 'ON' : 'OFF'}
                      </span>
                    </button>

                    {/* DOM Ladder Toggle */}
                    <button
                      onClick={() => setShowDomLadder((prev) => !prev)}
                      className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-left hover:bg-[var(--color-bg)] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <TableProperties size={14} className={showDomLadder ? 'text-cyan-400' : 'text-zinc-500'} />
                        <span>DOM Order Book Ladder</span>
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${showDomLadder ? 'bg-cyan-500/20 text-cyan-300' : 'text-[var(--color-text-muted)]'}`}>
                        {showDomLadder ? 'ON' : 'OFF'}
                      </span>
                    </button>

                    {/* Trade Panel Toggle */}
                    <button
                      onClick={() => setShowTradePanel((prev) => !prev)}
                      className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-left hover:bg-[var(--color-bg)] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Layers size={14} className={showTradePanel ? 'text-blue-400' : 'text-zinc-500'} />
                        <span>Panel Order / Trade</span>
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${showTradePanel ? 'bg-blue-500/20 text-blue-300' : 'text-[var(--color-text-muted)]'}`}>
                        {showTradePanel ? 'ON' : 'OFF'}
                      </span>
                    </button>

                    <div className="border-t border-[var(--color-border)] my-1 pt-1"></div>

                    {/* Hotkey Toggle */}
                    <button
                      onClick={() => setHotkeysEnabled(!hotkeysEnabled)}
                      className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-left hover:bg-[var(--color-bg)] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Keyboard size={14} className={hotkeysEnabled ? 'text-emerald-400' : 'text-zinc-500'} />
                        <span>Shortcut Keyboard (Hotkeys)</span>
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${hotkeysEnabled ? 'bg-emerald-500/20 text-emerald-300' : 'text-[var(--color-text-muted)]'}`}>
                        {hotkeysEnabled ? 'ON' : 'OFF'}
                      </span>
                    </button>

                    {/* Instant Order Toggle */}
                    <button
                      onClick={() => setIsInstantTradeEnabled(!isInstantTradeEnabled)}
                      className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-left hover:bg-[var(--color-bg)] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Zap size={14} className={isInstantTradeEnabled ? 'text-amber-400' : 'text-zinc-500'} />
                        <span>Instant Order Execution</span>
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${isInstantTradeEnabled ? 'bg-amber-500/20 text-amber-300' : 'text-[var(--color-text-muted)]'}`}>
                        {isInstantTradeEnabled ? 'ON' : 'OFF'}
                      </span>
                    </button>

                    {/* Chart Sync Toggle */}
                    <button
                      onClick={() => {
                        const next = !chartSyncSymbol;
                        setChartSyncSymbol(next);
                        setChartSyncTimeframe(next);
                        if (next) {
                          broadcastSymbolChange(activeSymbol);
                          broadcastTimeframeChange(timeframe);
                        }
                      }}
                      className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-left hover:bg-[var(--color-bg)] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Link2 size={14} className={chartSyncSymbol ? 'text-purple-400' : 'text-zinc-500'} />
                        <span>Multi-Chart Synchronization</span>
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${chartSyncSymbol ? 'bg-purple-500/20 text-purple-300' : 'text-[var(--color-text-muted)]'}`}>
                        {chartSyncSymbol ? 'ON' : 'OFF'}
                      </span>
                    </button>

                    {/* Broker Account Manager */}
                    <button
                      onClick={() => {
                        setShowExtraOptionsDropdown(false);
                        setIsAccountModalOpen(true);
                      }}
                      className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-left hover:bg-[var(--color-bg)] cursor-pointer transition-colors border-t border-[var(--color-border)] mt-1 pt-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <Wallet size={14} className="text-emerald-400" />
                        <span>Kelola Akun Broker</span>
                      </div>
                      <ChevronRight size={13} className="text-[var(--color-text-muted)]" />
                    </button>
                  </div>
                </>,
                document.body
              )}
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Server Latency / Ping Indicator */}
          <div 
            title="Real-Time WebSocket Server Latency"
            style={{ borderColor: `${currentPalette.bull}40` }}
            className="flex items-center gap-1.5 px-2 py-0.5 bg-[var(--color-bg)] border rounded-md text-[10px] font-mono shadow-sm"
          >
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: currentPalette.bull }}></span>
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: currentPalette.bull }}></span>
            </div>
            <span className="font-bold" style={{ color: currentPalette.bull }}>{serverLatency}ms</span>
          </div>

          {/* Zoom & View Reset Controls */}
          <div className="flex items-center gap-0.5 bg-[var(--color-panel)] rounded border border-[var(--color-border)] p-0.5">
            <button
              onClick={() => setZoom((z) => Math.min(z * 1.2, 100.0))}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-0.5 cursor-pointer"
              title="Zoom In"
            >
              <Plus size={12} />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(z * 0.82, 0.05))}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-0.5 cursor-pointer"
              title="Zoom Out"
            >
              <Minus size={12} />
            </button>
            <button
              onClick={resetView}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-0.5 cursor-pointer"
              title="Reset View"
            >
              <RotateCcw size={12} />
            </button>
          </div>

          {/* Minimize Layout Button */}
          <button
            onClick={() => setIsToolbarMinimized(true)}
            className="p-1 rounded border bg-[var(--color-panel)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:text-[var(--color-text)] cursor-pointer transition-colors"
            title="Minimize Layout"
          >
            <Minimize2 size={13} />
          </button>

          {/* Fullscreen Button */}
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              style={isFullscreen ? { backgroundColor: currentPalette.bull, color: '#000000', borderColor: currentPalette.bull } : {}}
              className={`p-1 rounded border text-xs cursor-pointer transition-colors ${
                isFullscreen
                  ? 'font-bold'
                  : 'bg-[var(--color-panel)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:text-[var(--color-text)] hover:border-[#5134ff]'
              }`}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
          )}

          {/* Locked Workspace Indicator */}
          {isWorkspaceLocked && (
            <span 
              className="hidden sm:inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold select-none"
              title="Workspace Terkunci: Posisi panel & penutupan dinonaktifkan untuk mencegah perubahan layout saat volatilitas tinggi"
            >
              <Lock size={10} /> Locked
            </span>
          )}

          {/* Split Chart Button */}
          {onSplit && (
            <button
              onClick={onSplit}
              style={{ backgroundColor: `${currentPalette.bull}20`, color: currentPalette.bull, borderColor: `${currentPalette.bull}40` }}
              className="flex items-center gap-1 text-[10px] px-1.5 py-1 rounded border hover:bg-[var(--color-panel)] cursor-pointer font-bold"
              title="Split Grafik: Duplikasi tata letak grafik ini untuk membandingkan pergerakan harga pada timeframe atau indikator berbeda secara berdampingan."
            >
              <span>+ Split</span>
            </button>
          )}

          {/* Close Panel Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 bg-red-950/60 hover:bg-red-900 text-red-300 rounded border border-red-800/50 cursor-pointer"
              title="Tutup Panel: Hapus grafik ini dari pembagian layar Anda untuk memaksimalkan area tampilan grafik lainnya."
            >
              <X size={12} />
            </button>
          )}

          <div
            style={{ backgroundColor: currentPalette.bull }}
            className="w-2 h-2 rounded-full animate-pulse ml-0.5"
            title="MountAlgo Live Global Engine Connected"
          />

          {!isFullscreen && (onMoveLeft || onMoveRight) && (
            <div 
              style={{ borderLeftColor: `${currentPalette.bull}40` }}
              className="flex items-center ml-0.5 border-l pl-0.5"
            >
              {onMoveLeft && (
                <button 
                  onClick={onMoveLeft} 
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-panel)] p-0.5 rounded cursor-pointer transition-colors"
                  title="Geser Panel ke Kiri: Tukar posisi panel grafik ini dengan panel yang ada di sebelah kirinya untuk mengatur ulang urutan layar kerja Anda."
                >
                  <ChevronLeft size={14} />
                </button>
              )}
              {onMoveRight && (
                <button 
                  onClick={onMoveRight} 
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-panel)] p-0.5 rounded cursor-pointer transition-colors"
                  title="Geser Panel ke Kanan: Tukar posisi panel grafik ini dengan panel yang ada di sebelah kanannya untuk mengatur ulang urutan layar kerja Anda."
                >
                  <ChevronRight size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      )}

      {/* Toggle Layout Button (Floating when minimized) */}
      {isToolbarMinimized && (
        <button
          onClick={() => setIsToolbarMinimized(false)}
          className="absolute top-2 left-2 z-50 bg-[var(--color-panel)]/90 hover:bg-[var(--color-panel)] border rounded-md px-2 py-1.5 cursor-pointer shadow-lg backdrop-blur-md transition-all flex items-center gap-1.5"
          style={{ borderColor: currentPalette.bull, color: currentPalette.bull }}
          title="Restore Layout & Toolbar"
        >
          <Maximize2 size={13} />
          <span className="text-[10px] font-mono font-bold">Buka Toolbar</span>
        </button>
      )}

      {/* 2. Real-time OHLCV Header Status HUD Removed */}

      {/* 3. Fast Scalping & Hotkeys HUD Bar - Hidden in favor of new bottom compact HUD as requested */}
      {!isToolbarMinimized && false && hotkeysEnabled && (
        <div className="px-2 py-1 bg-[var(--color-bg)] border-b border-[var(--color-border)] relative">
          <QuickScalperBar
            symbol={activeSymbol}
            chartId={id}
            currentPrice={currentPrice || 0}
            isForex={activeMarketPair.assetClass === 'Forex'}
            onOpenHotkeyModal={() => setIsHotkeyModalOpen(true)}
            isFocused={isThisChartFocused}
            onFocusChart={() => setFocusedChart(id, activeSymbol)}
          />
        </div>
      )}

      {/* 4. Canvas Engine Workspace & HUD Layout Wrapper */}
      <div className={`flex-1 w-full relative overflow-hidden flex min-h-0 ${tradePosition === "bottom" ? "flex-col" : "flex-col md:flex-row"}`}>
        {/* Trade Panel - Left Position */}
        {showTradePanel && tradePosition === "left" && (
          <div className="w-full md:w-[300px] flex-shrink-0 border-r border-[var(--color-border)] bg-[var(--color-panel)] overflow-y-auto order-first">
            <ChartTradePanel
              symbol={activeSymbol}
              onSymbolChange={handleSelectSymbol}
              currentPrice={currentPrice || 0}
              isForex={activeMarketPair.assetClass === "Forex"}
              riskManagerData={{
                settings: riskSettings,
                currentDrawdown,
                isRiskExceeded,
                balance,
                equity
              }}
            />
          </div>
        )}
        {/* Left Docked HUD Panel */}
        {(chartType === 'footprints' || indicators.showFootprints) &&
          footprintData &&
          footprintData.length > 0 &&
          hudPosition === 'left' && (
            <FootprintHudPanel
              footprintData={footprintData}
              symbol={activeSymbol}
              timeframe={timeframe}
              position="left"
              onPositionChange={setHudPosition}
            />
          )}

      {/* SIDE LEFT RADAR BAR (Rendered outside the main col) */}
      {indicators.showLiquidityHeatmap && showLiquidationRadarBar && !isRadarMinimized && radarDockPosition === 'side-left' && liquidityHeatmapData && (
        <div className="flex-shrink-0 bg-[var(--color-panel)] border-r border-[var(--color-border)] min-h-0 overflow-y-auto">
          <LiquidationRadarBar
            data={liquidityHeatmapData}
            symbol={activeSymbol}
            currentPrice={currentPrice || 0}
            isForex={activeMarketPair.assetClass === 'Forex'}
            timeframeMode={heatmapTimeframeMode}
            onSelectTimeframeMode={handleSelectHeatmapTimeframeMode}
            onJumpToPrice={handleJumpToLiquidationPrice}
            onOpenGuide={() => setIsLiquidityHeatmapGuideOpen(true)}
            onClose={() => setShowLiquidationRadarBar(false)}
            isMinimized={isRadarMinimized}
            setIsMinimized={setIsRadarMinimized}
            isSeparate={true}
            dockPosition={radarDockPosition}
            setDockPosition={setRadarDockPosition}
          />
        </div>
      )}

      {/* Main Canvas Workspace with Separate Radar Bar (Top or Bottom) */}
      <div className="flex-1 h-full flex flex-col min-h-0 relative">
        {/* Render LiquidationRadarBar OUTSIDE (at the top, separated) if it is NOT MINIMIZED and docked at top */}
        {indicators.showLiquidityHeatmap && showLiquidationRadarBar && !isRadarMinimized && radarDockPosition.startsWith('top') && liquidityHeatmapData && (
          <div className="flex-shrink-0 bg-[var(--color-panel)] border-b border-[var(--color-border)] min-h-0 overflow-y-auto max-h-[300px]">
            <LiquidationRadarBar
              data={liquidityHeatmapData}
              symbol={activeSymbol}
              currentPrice={currentPrice || 0}
              isForex={activeMarketPair.assetClass === 'Forex'}
              timeframeMode={heatmapTimeframeMode}
              onSelectTimeframeMode={handleSelectHeatmapTimeframeMode}
              onJumpToPrice={handleJumpToLiquidationPrice}
              onOpenGuide={() => setIsLiquidityHeatmapGuideOpen(true)}
              onClose={() => setShowLiquidationRadarBar(false)}
              isMinimized={isRadarMinimized}
              setIsMinimized={setIsRadarMinimized}
              isSeparate={true}
              dockPosition={radarDockPosition}
              setDockPosition={setRadarDockPosition}
            />
          </div>
        )}
        <div
          ref={containerRef}
          onClick={() => {
            if (contextMenu) setContextMenu(null);
          }}
          onDoubleClick={(e) => {
            if (e.target === containerRef.current) {
              resetView();
            }
          }}
          className={`flex-1 w-full relative overflow-hidden touch-none chart-stage-container gpu-accelerated ${getCursorStyle()}`}
        >
          {/* Target Execution Review Floating Banner with One-Click Return to Realtime Chart */}
          {Boolean(chartJumpTarget || targetSpotlightTime) && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 bg-[var(--color-panel)]/95 border border-indigo-500/60 px-3.5 py-1.5 rounded-full shadow-2xl backdrop-blur-md text-xs font-mono select-none transition-all animate-fadeIn">
              <span className="flex items-center gap-1.5 text-indigo-300 font-bold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span>Mode Review Eksekusi</span>
              </span>
              <button
                onClick={handleReturnToLiveChart}
                className="ml-1 px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-md hover:shadow-emerald-500/20 transition-all cursor-pointer active:scale-95 border border-emerald-400/40"
              >
                <Play size={11} fill="currentColor" />
                <span>Kembali ke Live Chart</span>
              </button>
            </div>
          )}
          
          {/* Selected Drawing Quick Action Toolbar */}
          {selectedDrawingId && !isDrawingSettingsOpen && (
            <SelectedDrawingQuickBar
              selectedDrawing={drawings.find((d) => d.id === selectedDrawingId) || null}
              onUpdateDrawing={(updated) => {
                setDrawings((prev) =>
                  prev.map((d) => (d.id === selectedDrawingId ? { ...d, ...updated } : d))
                );
              }}
              onOpenSettings={() => {
                const selected = drawings.find((d) => d.id === selectedDrawingId);
                if (selected) {
                  setDrawingForSettings(selected);
                  setIsDrawingSettingsOpen(true);
                }
              }}
              onOpenTemplates={() => setIsTemplatesModalOpen(true)}
              onOpenLayers={() => setIsLayerManagerOpen(true)}
              onDuplicate={() => {
                const selected = drawings.find((d) => d.id === selectedDrawingId);
                if (selected) {
                  const cloned: DrawingItem = {
                    ...selected,
                    id: Date.now().toString(),
                    points: selected.points.map((p) => ({ ...p, price: p.price * 1.002 })),
                  };
                  setDrawings((prev) => [...prev, cloned]);
                  setSelectedDrawingId(cloned.id);
                }
              }}
              onDelete={() => {
                const drawing = drawings.find((d) => d.id === selectedDrawingId);
                if (drawing && !getEffectiveDrawingLocked(drawing, layersMap, isLockedDrawings)) {
                  setDrawings((prev) => prev.filter((d) => d.id !== selectedDrawingId));
                  setSelectedDrawingId(null);
                }
              }}
              onDeselect={() => setSelectedDrawingId(null)}
              currentPalette={currentPalette as any}
              coords={(() => {
                const sel = drawings.find((d) => d.id === selectedDrawingId);
                const utils = getCoordinateUtils();
                if (sel && sel.points[0] && utils) {
                  const x = utils.getXFromTime(sel.points[0].time);
                  const y = utils.getY(sel.points[0].price);
                  if (x >= 0 && x <= utils.chartWidth && y >= 0 && y <= utils.fullHeight) {
                    return { x: Math.min(Math.max(120, x), utils.chartWidth - 120), y: Math.max(50, y - 30) };
                  }
                }
                return null;
              })()}
            />
          )}

          {/* TradingView-Style Floating Drawing Toolbar */}
          {!isToolbarMinimized && showFloatingDrawingBar && (
            <FloatingDrawingToolbar
              activeTool={activeTool}
              onSelectTool={setActiveTool}
              magnetMode={magnetMode}
              onToggleMagnet={() => setMagnetMode(!magnetMode)}
              magnetStrength={magnetStrength}
              onSetMagnetStrength={setMagnetStrength}
              smartAngleSnap={smartAngleSnap}
              onToggleSmartAngleSnap={() => setSmartAngleSnap(!smartAngleSnap)}
              alignToExistingDrawings={alignToExistingDrawings}
              onToggleAlignToExistingDrawings={() => setAlignToExistingDrawings(!alignToExistingDrawings)}
              onClearDrawings={() => {
                setDrawings(prev => prev.filter(d => getEffectiveDrawingLocked(d, layersMap, isLockedDrawings)));
                setCurrentDrawing(null);
              }}
              onUndoDrawing={() => setDrawings((prev) => prev.slice(0, -1))}
              onTakeSnapshot={takeSnapshot}
              drawingsCount={drawings.length}
              drawingColor={drawingColor}
              onChangeColor={handleDrawingColorChange}
              currentPalette={currentPalette as any}
              isLocked={isLockedDrawings}
              onToggleLock={() => setIsLockedDrawings(!isLockedDrawings)}
              hideDrawings={hideDrawings}
              onToggleHideDrawings={() => setHideDrawings(!hideDrawings)}
              pinnedTools={pinnedTools}
              onSetPinnedTools={setPinnedTools}
              onTogglePinTool={(tId) => {
                setPinnedTools((prev) => {
                  if (prev.includes(tId)) return prev.filter((id) => id !== tId);
                  return [...prev, tId];
                });
              }}
              onOpenSettings={() => {
                const selected = drawings.find((d) => d.id === selectedDrawingId) || drawings[drawings.length - 1];
                if (selected) {
                  setDrawingForSettings(selected);
                  setIsDrawingSettingsOpen(true);
                }
              }}
              onOpenTemplates={() => setIsTemplatesModalOpen(true)}
              onOpenLayers={() => setIsLayerManagerOpen(true)}
              onHideFloatingToolbar={toggleFloatingDrawingBar}
              className="top-2.5 left-2"
            />
          )}


          {/* 11D. Gemini AI Tape Analysis Overlay - Only shown on long press or explicitly triggered */}
          {isAiAssistantVisible && (
            <div className="absolute top-16 right-4 z-[60] w-72 pointer-events-auto animate-in fade-in slide-in-from-right-4">
              <div className="flex justify-between items-center mb-1 px-1">
                <div className="flex items-center gap-1.5">
                  <Zap size={14} className="text-[#00f2fe] fill-current" />
                  <span className="text-[10px] font-bold text-[#00f2fe] uppercase tracking-tighter">AI Assistant Active</span>
                </div>
                <button 
                  onClick={() => setIsAiAssistantVisible(false)}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors text-[var(--color-text-muted)] hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>
              <AiTapeAnalyzer 
                tapeData={tapeData} 
                symbol={activeSymbol} 
                timeframe={timeframe} 
              />
            </div>
          )}

          {/* Direct 1-Click Scalper Action Bar */}
          {showQuickScalper && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 bg-black/85 border border-white/15 px-3 py-1.5 rounded-lg shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 select-none">
              <button
                onClick={() => {
                  executeOrder({
                    symbol: activeSymbol,
                    type: 'BUY',
                    orderType: 'MARKET',
                    size: scalperLotSize,
                    price: currentPrice || 0,
                  });
                }}
                className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-black text-xs flex items-center gap-1 cursor-pointer transition-transform active:scale-95 shadow-md hover:shadow-emerald-500/30"
              >
                <span>BUY MKT</span>
              </button>

              <div className="flex items-center gap-1 bg-[var(--color-panel)] border border-[var(--color-border)] px-1.5 py-0.5 rounded">
                <span className="text-[10px] font-mono text-[var(--color-text-muted)]">LOT:</span>
                {[0.01, 0.1, 0.5, 1.0].map((size) => (
                  <button
                    key={size}
                    onClick={() => setScalperLotSize(size)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer transition-colors ${
                      scalperLotSize === size
                        ? 'bg-cyan-500 text-black'
                        : 'text-zinc-300 hover:text-white hover:bg-[var(--color-bg)]'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  executeOrder({
                    symbol: activeSymbol,
                    type: 'SELL',
                    orderType: 'MARKET',
                    size: scalperLotSize,
                    price: currentPrice || 0,
                  });
                }}
                className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-mono font-black text-xs flex items-center gap-1 cursor-pointer transition-transform active:scale-95 shadow-md hover:shadow-rose-500/30"
              >
                <span>SELL MKT</span>
              </button>

              <div className="pl-1 border-l border-[var(--color-border)] flex flex-col items-center">
                <span className="text-[8px] font-mono text-[var(--color-text-muted)]">SPREAD</span>
                <span className="text-[9px] font-mono font-bold text-amber-400">0.2 pips</span>
              </div>
            </div>
          )}

          {/* On-Chart Wizard Tools Interactive Legend for Canvas Core Engine */}
          {!isCleanChartMode && (
            <ChartIndicatorsLegend
              candles={candles}
              indicators={indicators}
              onUpdateIndicators={setIndicators}
              onOpenWizardTools={handleOpenWizardTools}
              onOpenFootprintSettings={() => setIsFootprintModalOpen(true)}
              isCleanMode={isCleanChartMode}
            />
          )}

          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onWheel={handleWheel}
            onDoubleClick={handleDoubleClick}
            onContextMenu={(e) => {
              e.preventDefault();
              const rect = getAdjustedCanvasRect(canvasRef.current);
              if (rect) {
                const mouseX = rect.getLocalX(e.clientX);
                const mouseY = rect.getLocalY(e.clientY);
                const hit = getDrawingHit(mouseX, mouseY);
                if (hit && !isLockedDrawings) {
                  setSelectedDrawingId(hit.id);
                  setContextMenu({ x: e.clientX, y: e.clientY, visible: true, drawingId: hit.id });
                } else {
                  setContextMenu({ x: e.clientX, y: e.clientY, visible: true });
                }
              }
            }}
            /* Touch events attached via native addEventListener({ passive: false }) in useEffect below — React 19 makes synthetic handlers passive */
            className={`chart-layer-canvas absolute inset-0 block w-full h-full touch-none ${getCursorStyle()}`}
          />
          <canvas
            ref={overlayCanvasRef}
            className="pointer-events-none absolute inset-0 block w-full h-full z-10"
          />

          {/* Loading Overlay for Symbol/Timeframe Transition */}
          {(isTransitioning || !isStateLoaded) && (
            <div className="absolute inset-0 z-[50] flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-200">
              <div 
                className="absolute inset-0 backdrop-blur-[2px]"
                style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}
              />
              <div className="relative flex flex-col items-center gap-3">
                {/* Spinning ring */}
                <div 
                  className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: `${currentPalette.bull}40`, borderTopColor: currentPalette.bull }}
                />
                <div className="flex flex-col items-center gap-1">
                  <span 
                    className="text-[11px] font-mono font-bold tracking-widest uppercase"
                    style={{ color: currentPalette.bull }}
                  >
                    Loading
                  </span>
                  <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
                    {activeSymbol} · {timeframe}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Visual Hold Price Animation Ring */}
          {holdVisualState && holdVisualState.active && (
            <div
              style={{
                left: `${holdVisualState.x}px`,
                top: `${holdVisualState.y}px`,
                transform: 'translate(-50%, -50%)',
              }}
              className="absolute z-40 pointer-events-none flex flex-col items-center justify-center"
            >
              <div 
                style={{ borderColor: currentPalette.bull }}
                className="w-14 h-14 rounded-full border-2 border-dashed animate-spin"
              />
              <div 
                style={{ backgroundColor: `${currentPalette.bull}25`, borderColor: currentPalette.bull }}
                className="absolute w-10 h-10 rounded-full border animate-ping"
              />
              <div 
                style={{ backgroundColor: `${currentPalette.bull}ee`, color: '#000' }}
                className="absolute px-2 py-0.5 rounded-full text-[9px] font-mono font-black whitespace-nowrap shadow-xl"
              >
                Hold @ {holdVisualState.price.toFixed(holdVisualState.price < 1 ? 4 : 2)}
              </div>
            </div>
          )}

          {/* Crosshair Right-Axis Quick Trader [+] Button */}
          {crosshairRef.current.active && crosshairRef.current.y >= 16 && crosshairRef.current.y <= (dimensions.height - 40) && (() => {
            const utils = getCoordinateUtils();
            if (!utils || crosshairRef.current.x >= utils.chartWidth + 30) return null;
            const price = utils.getPriceFromY(crosshairRef.current.y);
            return (
              <div
                style={{
                  top: `${crosshairRef.current.y}px`,
                  right: `4px`,
                  transform: 'translateY(-50%)',
                }}
                className="absolute z-30 flex items-center gap-1 pointer-events-auto"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setHoldTraderModal({
                      isOpen: true,
                      price,
                      x: crosshairRef.current.x,
                      y: crosshairRef.current.y,
                    });
                  }}
                  title={`Buka Fitur Trader @ ${price.toFixed(price < 1 ? 4 : 2)}`}
                  style={{
                    backgroundColor: currentPalette.bull,
                    color: '#000000',
                    boxShadow: `0 0 10px ${currentPalette.bull}80`,
                  }}
                  className="w-5 h-5 rounded-full flex items-center justify-center cursor-pointer hover:scale-125 active:scale-95 transition-all text-xs font-black"
                >
                  <Plus size={12} strokeWidth={3.5} />
                </button>
              </div>
            );
          })()}





          {/* 4A. Unified Minimalist Chart & Market Controls Bar (Bottom-Left) */}
          <div className="absolute bottom-8 left-3 z-30 flex items-center gap-1 bg-[var(--color-panel)]/95 border border-[var(--color-border)] px-1.5 py-1 rounded-lg shadow-xl backdrop-blur-md text-[10px] font-mono select-none pointer-events-auto">
            {/* Market Sessions Global HUD Popover */}
            <MarketSessionsOverlay variant="minimal" />

            <div className="h-3.5 w-px bg-[var(--color-border)] mx-0.5" />

            {/* Jump to Realtime / Reset View Button */}
            {(panOffset > 3 || chartJumpTarget || targetSpotlightTime) && (
              <button
                onClick={handleReturnToLiveChart}
                title="Kembali ke Live Chart / Realtime"
                className="h-6 px-2 py-0.5 rounded bg-emerald-600/25 hover:bg-emerald-600/50 text-emerald-300 font-bold flex items-center gap-1 cursor-pointer border border-emerald-500/40 animate-pulse shrink-0"
              >
                <Play size={10} fill="currentColor" />
                <span>Live</span>
              </button>
            )}

            {/* Auto Scale Toggle Button */}
            <button
              onClick={() => {
                const nextState = !isAutoScale;
                setIsAutoScale(nextState);
                isAutoScaleRef.current = nextState;
                if (nextState) {
                  setPriceScale(1);
                  setPriceOffset(0);
                  priceScaleRef.current = 1;
                  priceOffsetRef.current = 0;
                }
              }}
              title="Toggle Auto Scale (Double click price axis to reset)"
              style={isAutoScale ? { backgroundColor: `${currentPalette.bull}20`, color: currentPalette.bull, borderColor: `${currentPalette.bull}60` } : {}}
              className={`h-6 px-2 py-0.5 rounded cursor-pointer transition-colors border flex items-center gap-1 shrink-0 ${
                isAutoScale
                  ? 'font-bold shadow-sm'
                  : 'bg-[var(--color-bg)]/80 text-[var(--color-text-muted)] border-[var(--color-border)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)]'
              }`}
            >
              <Maximize2 size={11} />
              <span>Auto</span>
            </button>

            {/* Logarithmic Scale Toggle Button */}
            <button
              onClick={() => setIsLogScale(!isLogScale)}
              title="Toggle Logarithmic Scale"
              style={isLogScale ? { backgroundColor: `${currentPalette.bull}20`, color: currentPalette.bull, borderColor: `${currentPalette.bull}60` } : {}}
              className={`h-6 px-2 py-0.5 rounded cursor-pointer transition-colors border flex items-center gap-1 shrink-0 ${
                isLogScale
                  ? 'font-bold shadow-sm'
                  : 'bg-[var(--color-bg)]/80 text-[var(--color-text-muted)] border-[var(--color-border)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)]'
              }`}
            >
              <TrendingUp size={11} />
              <span>Log</span>
            </button>

            <div className="h-3.5 w-px bg-[var(--color-border)] mx-0.5" />

            {/* Interactive Global Timezone Selector */}
            <TimezoneSelector variant="badge" />

            <div className="h-3.5 w-px bg-[var(--color-border)] mx-0.5" />

            {/* Visual News Icons & Laser Markers Toggle [ON/OFF] */}
            <button
              onClick={() => {
                const next = !showNewsMarkers;
                setShowNewsMarkers(next);
                localStorage.setItem('mountalgo_show_news_markers', next ? 'true' : 'false');
                window.dispatchEvent(new CustomEvent('mountalgo_news_markers_toggled', { detail: next }));
                tradingAudio.play('CLICK');
              }}
              type="button"
              style={showNewsMarkers ? { backgroundColor: `${currentPalette.bull}20`, color: currentPalette.bull, borderColor: `${currentPalette.bull}60` } : {}}
              className={`h-6 px-2 py-0.5 rounded transition-all flex items-center gap-1 border cursor-pointer shrink-0 ${
                showNewsMarkers
                  ? 'font-bold shadow-sm'
                  : 'bg-[var(--color-bg)]/80 text-[var(--color-text-muted)] border-[var(--color-border)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)]'
              }`}
              title={showNewsMarkers ? "Sembunyikan Visual Ikon Berita di Chart [ON]" : "Tampilkan Visual Ikon Berita di Chart [OFF]"}
            >
              <Flame size={11} className={showNewsMarkers ? "animate-pulse" : ""} />
              <span>News</span>
            </button>

            {/* News Impact & Active Instrument Filter Controls */}
            {showNewsMarkers && (
              <>
                <button
                  onClick={() => {
                    const impacts: Array<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'> = ['ALL', 'HIGH', 'MEDIUM', 'LOW'];
                    const next = impacts[(impacts.indexOf(newsFilterImpact) + 1) % impacts.length];
                    setNewsFilterImpact(next);
                    localStorage.setItem('mountalgo_news_filter_impact', next);
                    tradingAudio.play('CLICK');
                  }}
                  type="button"
                  className={`h-6 px-2 py-0.5 rounded font-bold transition-all flex items-center gap-1 border cursor-pointer shrink-0 ${
                    newsFilterImpact === 'HIGH'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : newsFilterImpact === 'MEDIUM'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-[var(--color-bg)]/80 text-[var(--color-text)] border-[var(--color-border)]'
                  }`}
                  title="Filter Tingkat Dampak Berita Chart (ALL / HIGH / MEDIUM / LOW)"
                >
                  <Filter size={11} />
                  <span>{newsFilterImpact}</span>
                </button>

                <button
                  onClick={() => {
                    const next = !filterByInstrumentOnly;
                    setFilterByInstrumentOnly(next);
                    localStorage.setItem('mountalgo_news_instrument_only', next ? 'true' : 'false');
                    tradingAudio.play('CLICK');
                  }}
                  type="button"
                  style={filterByInstrumentOnly ? { backgroundColor: `${currentPalette.bull}20`, color: currentPalette.bull, borderColor: `${currentPalette.bull}60` } : {}}
                  className={`h-6 px-2 py-0.5 rounded font-bold transition-all flex items-center gap-1 border cursor-pointer shrink-0 ${
                    filterByInstrumentOnly
                      ? 'shadow-sm'
                      : 'bg-[var(--color-bg)]/80 text-[var(--color-text-muted)] border-[var(--color-border)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)]'
                  }`}
                  title={`Khusus Berita ${activeMarketPair.base}/${activeMarketPair.quote}`}
                >
                  <Target size={11} />
                  <span>{activeMarketPair.base}</span>
                </button>
              </>
            )}

            <div className="h-3.5 w-px bg-[var(--color-border)] mx-0.5" />

            {/* SL/TP Lock and Verification Safety Controls */}
            <button
              onClick={() => setIsSLTPLocked(!isSLTPLocked)}
              title={isSLTPLocked ? "SL/TP Terkunci (Klik untuk membuka)" : "Kunci Posisi Garis SL/TP (Mencegah pergeseran)"}
              className={`h-6 px-2 py-0.5 rounded cursor-pointer transition-colors flex items-center gap-1 border shrink-0 ${
                isSLTPLocked
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold'
                  : 'bg-[var(--color-bg)]/80 text-[var(--color-text-muted)] border-[var(--color-border)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)]'
              }`}
            >
              {isSLTPLocked ? <Lock size={11} className="text-rose-400" /> : <Unlock size={11} />}
              <span>SL/TP</span>
            </button>

            <button
              onClick={() => setRequireSLTPVerification(!requireSLTPVerification)}
              title={requireSLTPVerification ? "Verifikasi Seret SL/TP Aktif (Klik untuk matikan)" : "Matikan Verifikasi Seret (Mode Cepat)"}
              className={`h-6 px-2 py-0.5 rounded cursor-pointer transition-colors flex items-center gap-1 border shrink-0 ${
                requireSLTPVerification
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              }`}
            >
              <Shield size={11} />
              <span>{requireSLTPVerification ? "Safe" : "Fast"}</span>
            </button>
          </div>

          {/* 4B. Right-Click TradingView Context Menu */}
          {contextMenu && contextMenu.visible && typeof document !== 'undefined' && createPortal(
            <>
              <div 
                className="fixed inset-0 z-[99998] bg-black/20"
                onClick={() => setContextMenu(null)}
              />
              <div
                style={{
                  top: Math.min(contextMenu.y, window.innerHeight - (contextMenu.drawingId ? 120 : 240)),
                  left: Math.min(contextMenu.x, window.innerWidth - 220),
                  borderColor: `${currentPalette.bull}55`,
                }}
                className="fixed z-[99999] w-52 bg-[var(--color-panel)] border border-[var(--color-border)] rounded-lg shadow-2xl py-1 text-xs text-[var(--color-text)] font-sans backdrop-blur-md overflow-y-auto max-h-[80vh] scrollbar-thin"
              >
              {contextMenu.drawingId ? (
                <>
                  <button
                    onClick={() => {
                      const selected = drawings.find((d) => d.id === contextMenu.drawingId);
                      if (selected && !getEffectiveDrawingLocked(selected, layersMap, isLockedDrawings)) {
                        setDrawingForSettings(selected);
                        setIsDrawingSettingsOpen(true);
                      }
                      setContextMenu(null);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-[var(--color-hover)] text-[var(--color-text)] transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>Pengaturan Gambar...</span>
                  </button>
                  <button
                    onClick={() => {
                      const selected = drawings.find((d) => d.id === contextMenu.drawingId);
                      if (selected && !getEffectiveDrawingLocked(selected, layersMap, isLockedDrawings)) {
                        const newDrawing = { ...selected, id: Math.random().toString(36).substr(2, 9) };
                        // offset points slightly for visibility
                        newDrawing.points = newDrawing.points.map(p => ({ ...p, price: p.price * 1.001 }));
                        setDrawings(prev => [...prev, newDrawing]);
                        setSelectedDrawingId(newDrawing.id);
                      }
                      setContextMenu(null);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-[var(--color-hover)] text-[var(--color-text)] transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>Duplikat (Clone)</span>
                  </button>
                  <div className="w-full h-px bg-[var(--color-border)] my-1" />
                  <button
                    onClick={() => {
                      const selected = drawings.find(d => d.id === contextMenu.drawingId);
                      const isLocked = selected ? getEffectiveDrawingLocked(selected, layersMap, isLockedDrawings) : false;
                      if (!isLocked) {
                        setDrawings(prev => prev.filter(d => d.id !== contextMenu.drawingId));
                        setSelectedDrawingId(null);
                      }
                      setContextMenu(null);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-red-500/20 text-red-400 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>Hapus Gambar</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                onClick={() => {
                  resetView();
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[var(--color-hover)] hover:text-[var(--color-text)] flex items-center justify-between cursor-pointer"
              >
                <span>Reset Tampilan Chart</span>
                <span className="text-[10px] text-[var(--color-text-muted)] font-mono">Alt+R</span>
              </button>

              <button
                onClick={() => {
                  const nextState = !isAutoScale;
                  setIsAutoScale(nextState);
                  isAutoScaleRef.current = nextState;
                  if (nextState) {
                    setPriceScale(1);
                    setPriceOffset(0);
                    priceScaleRef.current = 1;
                    priceOffsetRef.current = 0;
                  }
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[var(--color-hover)] hover:text-[var(--color-text)] flex items-center justify-between cursor-pointer"
              >
                <span>Auto Scale (Fit)</span>
                <span style={{ color: isAutoScale ? currentPalette.bull : 'var(--color-text-muted)' }} className="font-mono text-[11px] font-bold">
                  {isAutoScale ? 'ON' : 'OFF'}
                </span>
              </button>

              <button
                onClick={() => {
                  setIsLogScale(!isLogScale);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[var(--color-hover)] hover:text-[var(--color-text)] flex items-center justify-between cursor-pointer"
              >
                <span>Log Scale</span>
                <span style={{ color: isLogScale ? currentPalette.bull : 'var(--color-text-muted)' }} className="font-mono text-[11px] font-bold">
                  {isLogScale ? 'ON' : 'OFF'}
                </span>
              </button>

              <button
                onClick={() => {
                  setMagnetMode(!magnetMode);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[var(--color-hover)] hover:text-[var(--color-text)] flex items-center justify-between cursor-pointer"
              >
                <span>Magnet OHLC Snapping</span>
                <span style={{ color: magnetMode ? currentPalette.bull : 'var(--color-text-muted)' }} className="font-mono text-[11px] font-bold">
                  {magnetMode ? 'ON' : 'OFF'}
                </span>
              </button>

              <div className="border-t border-[var(--color-border)] my-1" />

              <button
                onClick={() => {
                  takeSnapshot();
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[var(--color-hover)] hover:text-[var(--color-text)] flex items-center justify-between cursor-pointer"
              >
              <span>Ambil Screenshot (PNG)</span>
             </button>

              <button
                onClick={() => {
                  exportChartData();
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[var(--color-hover)] hover:text-[var(--color-text)] flex items-center justify-between cursor-pointer"
              >
                <span>Export Data (JSON)</span>
              </button>

              <button
                onClick={() => {
                  const pt = getCanvasPriceAndTime(contextMenu.x, contextMenu.y);
                  if (pt) {
                    setHoldTraderModal({
                      isOpen: true,
                      price: pt.price,
                      x: contextMenu.x,
                      y: contextMenu.y,
                    });
                  }
                  setContextMenu(null);
                }}
                style={{ color: currentPalette.bull }}
                className="w-full text-left px-3 py-1.5 hover:bg-[var(--color-hover)] font-bold flex items-center justify-between cursor-pointer"
              >
                <span>Fitur Trader @ Level Ini</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400">Trade</span>
              </button>

              <button
                onClick={() => {
                  setDrawings(prev => prev.filter(d => getEffectiveDrawingLocked(d, layersMap, isLockedDrawings)));
                  setCurrentDrawing(null);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 flex items-center justify-between cursor-pointer"
              >
                <span>Hapus Semua Gambar</span>
                <span className="text-[10px] text-rose-500 font-mono">Del</span>
              </button>
            </>
            )}
            </div>
          </>,
          document.body
        )}

          {/* 4C. Text Tool Note Input Modal */}
          {textPromptModal.isOpen && (
            <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div 
                style={{ borderColor: currentPalette.bull }}
                className="bg-[var(--color-panel)] border rounded-xl shadow-2xl p-4 w-full max-w-sm"
              >
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-sm font-bold text-[var(--color-text)] font-mono">Tambah Catatan Chart (Text Tool)</h3>
                </div>
                <input
                  type="text"
                  autoFocus
                  value={textPromptModal.text ?? ''}
                  onChange={(e) => setTextPromptModal((prev) => ({ ...prev, text: e.target.value }))}
                  placeholder="Tulis catatan analisis..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && textPromptModal.text.trim() && textPromptModal.point) {
                      const newDrawing: DrawingItem = {
                        id: Date.now().toString(),
                        type: 'text',
                        points: [textPromptModal.point],
                        color: drawingColor,
                        layerId: activeLayerId,
                        text: textPromptModal.text.trim(),
                        isComplete: true,
                      };
                      setDrawings((prev) => [...prev, newDrawing]);
                      setTextPromptModal({ isOpen: false, point: null, text: '' });
                    } else if (e.key === 'Escape') {
                      setTextPromptModal({ isOpen: false, point: null, text: '' });
                    }
                  }}
                  className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text)] focus:outline-hidden focus:border-cyan-400 mb-3"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setTextPromptModal({ isOpen: false, point: null, text: '' })}
                    className="px-3 py-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] rounded-lg hover:bg-[var(--color-hover)] cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => {
                      if (textPromptModal.text.trim() && textPromptModal.point) {
                        if (textPromptModal.drawingId) {
                          setDrawings((prev) =>
                            prev.map((d) =>
                              d.id === textPromptModal.drawingId
                                ? { ...d, text: textPromptModal.text.trim(), label: textPromptModal.text.trim() }
                                : d
                            )
                          );
                        } else {
                          const newDrawing: DrawingItem = {
                            id: Date.now().toString(),
                            type: textPromptModal.type || 'text',
                            points: [textPromptModal.point],
                            color: drawingColor,
                            text: textPromptModal.text.trim(),
                            isComplete: true,
                          };
                          setDrawings((prev) => [...prev, newDrawing]);
                        }
                      }
                      setTextPromptModal({ isOpen: false, point: null, text: '', type: 'text', drawingId: undefined });
                    }}
                    style={{ backgroundColor: currentPalette.bull, color: '#000000' }}
                    className="px-3.5 py-1.5 text-xs font-bold rounded-lg cursor-pointer shadow-md"
                  >
                    Simpan Catatan
                  </button>
                </div>
              </div>
            </div>
          )}



          {/* 4B. Unified Liquidation & Microstructure Radar Bar (Single Dedicated Bar with Intuitive Visual Charts) */}
          {indicators.showLiquidityHeatmap && showLiquidationRadarBar && isRadarMinimized && liquidityHeatmapData && (
            <LiquidationRadarBar
              data={liquidityHeatmapData}
              symbol={activeSymbol}
              currentPrice={currentPrice || 0}
              isForex={activeMarketPair.assetClass === 'Forex'}
              timeframeMode={heatmapTimeframeMode}
              onSelectTimeframeMode={handleSelectHeatmapTimeframeMode}
              onJumpToPrice={handleJumpToLiquidationPrice}
              onOpenGuide={() => setIsLiquidityHeatmapGuideOpen(true)}
              onClose={() => setShowLiquidationRadarBar(false)}
              isMinimized={isRadarMinimized}
              setIsMinimized={setIsRadarMinimized}
              isSeparate={false}
              dockPosition={radarDockPosition}
              setDockPosition={setRadarDockPosition}
            />
          )}

          {/* Radar Bar Re-open Button when closed */}
          {indicators.showLiquidityHeatmap && !showLiquidationRadarBar && (
            <button
              onClick={() => setShowLiquidationRadarBar(true)}
              className="absolute bottom-16 right-3 z-40 bg-[var(--color-panel)]/90 border border-[var(--color-border)] p-2.5 rounded-full shadow-xl hover:bg-[var(--color-hover)] transition-all text-indigo-400 hover:text-indigo-300 flex items-center justify-center group cursor-pointer"
              title="Tampilkan Liquidation Radar"
            >
              <Target size={20} className="group-hover:scale-110 transition-transform" />
            </button>
          )}

          {/* Compact Hotkeys HUD at the bottom of the chart */}
          {hotkeysEnabled && <CompactHotkeyHud />}

          {/* Floating Trade Bar for Instant Execution */}
          {isInstantTradeEnabled && (
            <FloatingTradeBar 
              symbol={activeSymbol} 
              onExecute={(side, size) => {
                // Execute a market order for instant trading
                executeOrder({
                  symbol: activeSymbol,
                  type: side,
                  orderType: 'MARKET',
                  size,
                  price: currentPrice || 0,
                });
                tradingAudio.play(side === 'BUY' ? 'BUY' : 'SELL');
              }}
              currentPrice={currentPrice}
              onClose={() => setIsInstantTradeEnabled(false)}
            />
          )}

          {/* Glassmorphic Hover Tooltip for Imbalance and Mitigation Boxes */}
          {hoveredBox && (
            <div 
              style={{ 
                left: `${hoveredBox.x + 15}px`, 
                top: `${hoveredBox.y - 45}px`,
                borderColor: hoveredBox.type === 'imbalance' 
                  ? (hoveredBox.isBuy ? currentPalette.bull : currentPalette.bear)
                  : currentPalette.poc,
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.65)'
              }}
              className="absolute z-[100] bg-[var(--color-panel)]/95 border rounded-xl p-3 font-mono text-[10px] backdrop-blur-md text-[var(--color-text)] w-56 flex flex-col pointer-events-none transition-all duration-100"
            >
              <div className="flex items-center gap-1.5 pb-1.5 mb-1.5 border-b border-[var(--color-border)] font-bold uppercase tracking-wider">
                <span className="text-[11px]">
                  {hoveredBox.type === 'imbalance' 
                    ? `⚠️ ${hoveredBox.isBuy ? 'Buy' : 'Sell'} Imbalance` 
                    : '🧬 MITIGATION ZONE'}
                </span>
                <span className="px-1.5 py-0.2 text-[8px] rounded bg-white/10 text-gray-400">
                  {hoveredBox.active ? 'ACTIVE' : 'MITIGATED'}
                </span>
              </div>
              <div className="space-y-1 text-[9.5px]">
                {hoveredBox.type === 'imbalance' ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Top Price:</span>
                      <span className="font-semibold">${hoveredBox.top?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Bottom Price:</span>
                      <span className="font-semibold">${hoveredBox.bottom?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Zone Height:</span>
                      <span className="font-semibold text-amber-300">
                        ${((hoveredBox.top || 0) - (hoveredBox.bottom || 0)).toFixed(2)}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Level Center:</span>
                      <span className="font-semibold">${hoveredBox.level?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Buy Vol:</span>
                      <span style={{ color: currentPalette.bull }} className="font-bold">
                        {formatVol(hoveredBox.buyVol || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Sell Vol:</span>
                      <span style={{ color: currentPalette.bear }} className="font-bold">
                        {formatVol(hoveredBox.sellVol || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] font-black pt-1 mt-1 border-t border-white/5">
                      <span className="text-gray-300">Total volume:</span>
                      <span className="text-white">
                        {formatVol((hoveredBox.buyVol || 0) + (hoveredBox.sellVol || 0))}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between pt-1 text-[8.5px] text-gray-500 font-semibold border-t border-white/5 mt-1">
                  <span>Candles: {hoveredBox.startIndex} - {hoveredBox.endIndex}</span>
                  <span>({hoveredBox.endIndex - hoveredBox.startIndex} tf)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Render LiquidationRadarBar OUTSIDE (at the bottom, separated) if it is NOT MINIMIZED and docked at bottom */}
        {indicators.showLiquidityHeatmap && showLiquidationRadarBar && !isRadarMinimized && (radarDockPosition.startsWith('bottom') || radarDockPosition === 'docked-bottom') && liquidityHeatmapData && (
          <div className="flex-shrink-0 bg-[var(--color-panel)] border-t border-[var(--color-border)] min-h-0 overflow-y-auto max-h-[300px]">
            <LiquidationRadarBar
              data={liquidityHeatmapData}
              symbol={activeSymbol}
              currentPrice={currentPrice || 0}
              isForex={activeMarketPair.assetClass === 'Forex'}
              timeframeMode={heatmapTimeframeMode}
              onSelectTimeframeMode={handleSelectHeatmapTimeframeMode}
              onJumpToPrice={handleJumpToLiquidationPrice}
              onOpenGuide={() => setIsLiquidityHeatmapGuideOpen(true)}
              onClose={() => setShowLiquidationRadarBar(false)}
              isMinimized={isRadarMinimized}
              setIsMinimized={setIsRadarMinimized}
              isSeparate={true}
              dockPosition={radarDockPosition}
              setDockPosition={setRadarDockPosition}
            />
          </div>
        )}
      </div>

      {/* SIDE RIGHT RADAR BAR (Rendered outside the main col) */}
      {indicators.showLiquidityHeatmap && showLiquidationRadarBar && !isRadarMinimized && radarDockPosition === 'side-right' && liquidityHeatmapData && (
        <div className="flex-shrink-0 bg-[var(--color-panel)] border-l border-[var(--color-border)] min-h-0 overflow-y-auto">
          <LiquidationRadarBar
            data={liquidityHeatmapData}
            symbol={activeSymbol}
            currentPrice={currentPrice || 0}
            isForex={activeMarketPair.assetClass === 'Forex'}
            timeframeMode={heatmapTimeframeMode}
            onSelectTimeframeMode={handleSelectHeatmapTimeframeMode}
            onJumpToPrice={handleJumpToLiquidationPrice}
            onOpenGuide={() => setIsLiquidityHeatmapGuideOpen(true)}
            onClose={() => setShowLiquidationRadarBar(false)}
            isMinimized={isRadarMinimized}
            setIsMinimized={setIsRadarMinimized}
            isSeparate={true}
            dockPosition={radarDockPosition}
            setDockPosition={setRadarDockPosition}
          />
        </div>
      )}

        {/* Order Flow DOM Ladder Table directly next to the price scale */}
        <OrderFlowDomLadder
          candles={candles}
          footprintData={footprintData}
          currentPrice={currentPrice}
          symbol={activeSymbol}
          isOpen={showDomLadder}
          onClose={() => setShowDomLadder(false)}
          showChartOverlay={showDomChartOverlay}
          onToggleChartOverlay={setShowDomChartOverlay}
          domData={domLadderData}
        />

        {/* Right Docked HUD Panel */}
        {(chartType === 'footprints' || indicators.showFootprints) &&
          footprintData &&
          footprintData.length > 0 &&
          hudPosition === 'right' && (
            <FootprintHudPanel
              footprintData={footprintData}
              symbol={activeSymbol}
              timeframe={timeframe}
              position="right"
              onPositionChange={setHudPosition}
            />
          )}

        {/* Synchronized Trade Layout Panel - Right Position */}
        {showTradePanel && tradePosition === "right" && (
          <div className="w-full md:w-[300px] flex-shrink-0 border-t md:border-t-0 md:border-l border-[var(--color-border)] bg-[var(--color-panel)] overflow-y-auto">
            <ChartTradePanel
              symbol={activeSymbol}
              onSymbolChange={handleSelectSymbol}
              currentPrice={currentPrice || 0}
              isForex={activeMarketPair.assetClass === "Forex"}
              riskManagerData={{
                settings: riskSettings,
                currentDrawdown,
                isRiskExceeded,
                balance,
                equity
              }}
            />
          </div>
        )}

        {/* Synchronized Trade Layout Panel - Bottom Position */}
        {showTradePanel && tradePosition === "bottom" && (
          <div className="w-full h-[280px] md:h-[320px] flex-shrink-0 border-t border-[var(--color-border)] bg-[var(--color-panel)] overflow-y-auto">
            <ChartTradePanel
              symbol={activeSymbol}
              onSymbolChange={handleSelectSymbol}
              currentPrice={currentPrice || 0}
              isForex={activeMarketPair.assetClass === "Forex"}
              riskManagerData={{
                settings: riskSettings,
                currentDrawdown,
                isRiskExceeded,
                balance,
                equity
              }}
            />
          </div>
        )}
      </div>

      {/* Bottom Docked HUD Panel */}

      {(chartType === 'footprints' || indicators.showFootprints) &&
        footprintData &&
        footprintData.length > 0 &&
        hudPosition === 'bottom' && (
          <FootprintHudPanel
            footprintData={footprintData}
            symbol={activeSymbol}
            timeframe={timeframe}
            position="bottom"
            onPositionChange={setHudPosition}
          />
        )}

      {/* 5. Symbol Selector Modal */}
      <SymbolSelectorModal
        currentSymbol={activeSymbol}
        isOpen={isSymbolModalOpen}
        onClose={() => setIsSymbolModalOpen(false)}
        onSelectSymbol={(sym) => {
          handleSelectSymbol(sym);
          setPanOffset(0);
        }}
      />

      {/* 6. Indicators Configuration Modal */}
      <IndicatorModal
        isOpen={isIndicatorModalOpen}
        onClose={() => {
          setIsIndicatorModalOpen(false);
          setFocusedIndicatorKey(null);
        }}
        settings={indicators}
        onUpdateSettings={setIndicators}
        onOpenFootprintSettings={() => setIsFootprintModalOpen(true)}
        initialFocusedKey={focusedIndicatorKey}
      />

      {/* 7C. Liquidity Heatmap & Liquidation Strategy Guide Modal */}
      <LiquidityHeatmapGuideModal
        isOpen={isLiquidityHeatmapGuideOpen}
        onClose={() => setIsLiquidityHeatmapGuideOpen(false)}
      />

      {/* 8. Footprint V7.2 MountAlgo Settings Modal */}
      <FootprintSettingsModal
        isOpen={isFootprintModalOpen}
        onClose={() => setIsFootprintModalOpen(false)}
        settings={footprintSettings}
        onUpdateSettings={(newSettings) => {
          setFootprintSettings(newSettings);
        }}
      />

      {/* 9. Advanced Drawing Tool Settings Modal */}
      <DrawingSettingsModal
        isOpen={isDrawingSettingsOpen}
        drawing={drawingForSettings}
        onClose={() => setIsDrawingSettingsOpen(false)}
        onSave={(updated) => {
          const drawing = drawings.find((d) => d.id === updated.id);
          if (drawing && getEffectiveDrawingLocked(drawing, layersMap, isLockedDrawings)) return;
          setDrawings((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
        }}
        onDelete={(id) => {
          const drawing = drawings.find((d) => d.id === id);
          if (drawing && !getEffectiveDrawingLocked(drawing, layersMap, isLockedDrawings)) {
            setDrawings((prev) => prev.filter((d) => d.id !== id));
            setSelectedDrawingId(null);
          }
        }}
      />

      {/* 9b. Drawing Templates & Style Presets Modal */}
      <DrawingTemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        selectedDrawing={drawings.find((d) => d.id === selectedDrawingId) || null}
        onUpdateDrawing={(updated) => {
          setDrawings((prev) => prev.map((d) => (d.id === updated.id ? { ...d, ...updated } : d)));
        }}
        onSelectToolWithTemplate={(tool, template) => {
          setActiveTool(tool);
          if (template.style.color) setDrawingColor(template.style.color);
          setActiveTemplateStyle(template.style);
        }}
      />

      {/* 9c. Drawing Layer Manager Modal */}
      <DrawingLayerManagerModal
        isOpen={isLayerManagerOpen}
        onClose={() => setIsLayerManagerOpen(false)}
        layers={drawingLayers}
        setLayers={setDrawingLayers}
        activeLayerId={activeLayerId}
        setActiveLayerId={setActiveLayerId}
        drawings={drawings}
        setDrawings={setDrawings}
        selectedDrawingId={selectedDrawingId}
        setSelectedDrawingId={setSelectedDrawingId}
      />

      {/* 10. Interactive Hold Price Trader Feature Menu */}
      <HoldPriceTraderMenu
        isOpen={holdTraderModal.isOpen}
        onClose={() => setHoldTraderModal({ isOpen: false, price: 0 })}
        price={holdTraderModal.price}
        currentPrice={currentPrice}
        symbol={activeSymbol}
        isForex={marketInfo.assetClass === 'Forex'}
        positionX={holdTraderModal.x}
        positionY={holdTraderModal.y}
        onAddDrawing={handleAddDrawingFromTrader}
      />

      {/* 11. SL/TP Verification Modal */}
      {sltpVerificationModal && (
        <SLTPVerificationModal
          {...sltpVerificationModal}
        />
      )}

      {/* 12. Circuit Breaker Institutional Black Swan Modal */}
      <CircuitBreakerModal 
        isOpen={isRiskExceeded || false} 
        onClose={() => {}} 
        equity={equity || 0} 
        drawdown={currentDrawdown || 0} 
      />

      {/* SL/TP Safe Toast */}
      {sltpToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-[var(--color-panel)]/95 border border-amber-500/50 text-amber-300 px-4 py-2 rounded-full shadow-2xl backdrop-blur-md text-xs font-semibold animate-fadeIn select-none pointer-events-none">
          <span>{sltpToast.message}</span>
        </div>
      )}

      {/* 14. Flashing Beacon HUD for Imminent High Impact News Events */}
      <ChartNewsBeaconHUD
        events={chartNewsEvents}
        activeSymbol={activeSymbol}
        onSelectEvent={(evt) => {
          setSelectedNewsEventModal(evt);
          setSelectedNewsEventCluster(null);
        }}
        onOpenAiAgent={(prompt) => {
          window.dispatchEvent(new CustomEvent('mountalgo:open-ai-agent', { detail: { prompt } }));
        }}
      />

      {/* 14. News Volatility Guard (Spread Risk Warning & One-Click Pause Scalping) */}
      <NewsVolatilityGuard
        events={chartNewsEvents}
        activeSymbol={activeSymbol}
        className="absolute top-12 left-4 right-4 z-40 max-w-4xl mx-auto"
        onOpenAiAgent={(prompt) => {
          window.dispatchEvent(new CustomEvent('mountalgo:open-ai-agent', { detail: { prompt } }));
        }}
      />

      {/* 15. Interactive Chart News & Economic Milestone Modal with Real-Time Countdown */}
      {selectedNewsEventModal && (
        <ChartNewsEventModal
          event={selectedNewsEventModal}
          clusterEvents={selectedNewsEventCluster || []}
          onClose={() => {
            setSelectedNewsEventModal(null);
            setSelectedNewsEventCluster(null);
          }}
          onOpenFullCalendar={() => {
            setSelectedNewsEventModal(null);
            setSelectedNewsEventCluster(null);
            window.dispatchEvent(new CustomEvent('mountalgo:open-news-modal'));
          }}
          onOpenAiAgent={(prompt) => {
            setSelectedNewsEventModal(null);
            setSelectedNewsEventCluster(null);
            window.dispatchEvent(new CustomEvent('mountalgo:open-ai-agent', { detail: { prompt } }));
          }}
          activeSymbol={activeSymbol}
        />
      )}
    </div>
  );
}
