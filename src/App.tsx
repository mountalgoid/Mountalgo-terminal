import { useState, useEffect, useCallback, useRef } from 'react';
import CustomChartWidget from './components/CustomChartWidget';
import AppSettingsModal from './components/AppSettingsModal';
import HotkeyGuideModal from './components/HotkeyGuideModal';
import AccountManagerModal from './components/AccountManagerModal';
import HedgeArbitrageModal from './components/HedgeArbitrageModal';
import UnifiedEquityAggregatorModal from './components/UnifiedEquityAggregatorModal';
import ResizableLayout from './components/ResizableLayout';
import SplashScreen from './components/SplashScreen';
import LandingPage from './components/LandingPage';
import PriceAlerts from './components/PriceAlerts';
import { TradeJournalModal } from './components/TradeJournalModal';
import { TopBarMenu } from './components/TopBarMenu';
import { RiskDashboard } from './components/RiskDashboard';
import { useRiskManager } from './hooks/trading/useRiskManager';
import { WorkspacePresetsModal } from './components/WorkspacePresetsModal';
import { useTheme } from './context/ThemeContext';
import { useTrade } from './context/TradeContext';
import { loadWorkspaceFromIDB, saveWorkspaceToIDB, saveChartStateToIDB } from './utils/terminalPersistence';
import { tradingAudio } from './utils/audioSynth';
import {
  getStoredWidgetOrder,
  saveWidgetOrder,
  getStoredOrientation,
  saveOrientation,
  WorkspacePreset,
  triggerWorkspaceSaveToast,
} from './utils/terminalPersistence';
import { MountAlgoLogo } from './components/MountAlgoLogo';
import { DynamicListingTimer } from './components/DynamicListingTimer';
import { ListingSniperHubModal } from './components/ListingSniperHubModal';
import { NewsAndCalendarModal } from './components/NewsAndCalendarModal';
import { AiAgentTerminalModal } from './components/AiAgentTerminalModal';
import { detectScreenResolution } from './utils/resolutionDetector';
import { 
  Minimize,
  CheckCircle2,
  Flame,
  Zap,
  X,
  Clock,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Crosshair,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const { theme, setTheme, palette, isHighContrast, isLight } = useTheme();
  const { 
    focusedSymbol, 
    broadcastSymbolChange,
    jumpToChartTarget,
    hotkeyMode, 
    hotkeyToast, 
    isHotkeyModalOpen, 
    setIsHotkeyModalOpen,
    isAccountModalOpen,
    setIsAccountModalOpen,
    balance,
    equity,
    newListingToast,
    dismissNewListingToast,
    instantSnipeListing
  } = useTrade();

  const {
    settings: riskSettings,
    currentDrawdown,
    isRiskExceeded
  } = useRiskManager(balance, equity);

  // Ordered array of widgets with automatic persistence (Custom Chart & Broker only)
  const [widgetOrder, setWidgetOrder] = useState<string[]>(() => {
    const stored = getStoredWidgetOrder();
    let cleaned = stored.map(id => id.startsWith('tv') ? 'chart1' : id);
    cleaned = Array.from(new Set(cleaned)); // Remove duplicates
    if (!cleaned.includes('chart1')) cleaned.unshift('chart1');
    return cleaned;
  });
  
  // Fullscreen state: null = normal multi-panel grid, widget ID = maximized widget

  const [isWorkspaceLoaded, setIsWorkspaceLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      loadWorkspaceFromIDB('widgetOrder'),
    ]).then(([savedWidgetOrder]) => {
      if (!isMounted) return;
      if (savedWidgetOrder && Array.isArray(savedWidgetOrder)) {
        setWidgetOrder(savedWidgetOrder);
      }
      setIsWorkspaceLoaded(true);
    });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!isWorkspaceLoaded) return;
    saveWorkspaceToIDB('widgetOrder', widgetOrder);
  }, [widgetOrder, isWorkspaceLoaded]);

  const [fullscreenWidget, setFullscreenWidget] = useState<string | null>(null);

  // Landing page → Splash → Terminal flow
  const [showLanding, setShowLanding] = useState(true);

  const handleEnterTerminal = useCallback(() => {
    setShowLanding(false);
  }, []);

  // Splash screen state
  const [showSplash, setShowSplash] = useState(true);



  // App settings & workspace preset modal state
  const [isAppSettingsOpen, setIsAppSettingsOpen] = useState(false);
  const [isPriceAlertsOpen, setIsPriceAlertsOpen] = useState(false);
  const [isWorkspacePresetsOpen, setIsWorkspacePresetsOpen] = useState(false);
  const [isHedgeModalOpen, setIsHedgeModalOpen] = useState(false);
  const [isEquityModalOpen, setIsEquityModalOpen] = useState(false);
  const [isSniperHubOpen, setIsSniperHubOpen] = useState(false);
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [isAiAgentModalOpen, setIsAiAgentModalOpen] = useState(false);
  const [aiAgentInitialPrompt, setAiAgentInitialPrompt] = useState<string | undefined>();
  const [isZenMode, setIsZenMode] = useState(false);

  // Orientation mode: 'auto' (detects screen automatically), 'landscape', 'portrait'
  const [orientationOverride, setOrientationOverride] = useState<'auto' | 'landscape' | 'portrait'>(() => getStoredOrientation());

  // Lock Workspace state: Disables widget dragging and closing to prevent accidental changes during volatility
  const [isWorkspaceLocked, setIsWorkspaceLocked] = useState<boolean>(() => {
    return localStorage.getItem('mountalgo_workspace_locked') === 'true';
  });

  // Global Price Scale Mode for all active charts: 'linear' | 'logarithmic'
  const [priceScaleMode, setPriceScaleMode] = useState<'linear' | 'logarithmic'>(() => {
    return localStorage.getItem('mountalgo_price_scale_mode') === 'logarithmic' ? 'logarithmic' : 'linear';
  });

  // Global Scroll Zoom Scale State (Range: 50% to 175%, Step: 5%)
  const [globalZoom, setGlobalZoomState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('mountalgo_global_zoom');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 50 && parsed <= 175) return parsed;
      }
      return detectScreenResolution().recommendedZoom;
    } catch {
      return detectScreenResolution().recommendedZoom;
    }
  });

  const [showZoomToast, setShowZoomToast] = useState(false);
  const zoomToastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerZoomToast = useCallback(() => {
    setShowZoomToast(true);
    if (zoomToastTimerRef.current) clearTimeout(zoomToastTimerRef.current);
    zoomToastTimerRef.current = setTimeout(() => {
      setShowZoomToast(false);
    }, 2200);
  }, []);

  const setGlobalZoom = useCallback((val: number | ((prev: number) => number)) => {
    setGlobalZoomState((prev) => {
      const nextRaw = typeof val === 'function' ? val(prev) : val;
      const nextClamped = Math.min(175, Math.max(50, nextRaw));
      try {
        localStorage.setItem('mountalgo_global_zoom', String(nextClamped));
      } catch {}
      triggerZoomToast();
      return nextClamped;
    });
  }, [triggerZoomToast]);

  const zoomIn = useCallback(() => {
    setGlobalZoom(prev => Math.min(175, prev + 5));
  }, [setGlobalZoom]);

  const zoomOut = useCallback(() => {
    setGlobalZoom(prev => Math.max(50, prev - 5));
  }, [setGlobalZoom]);

  const resetZoom = useCallback(() => {
    setGlobalZoom(100);
  }, [setGlobalZoom]);

  // Synchronize CSS variable and dispatch zoom events when globalZoom changes
  useEffect(() => {
    document.documentElement.style.setProperty('--global-zoom-scale', String(globalZoom / 100));
    window.dispatchEvent(new CustomEvent('mountalgo:zoom-change', { detail: { zoom: globalZoom } }));
    window.dispatchEvent(new Event('resize'));
  }, [globalZoom]);

  const triggerAutoCenter = useCallback(() => {
    // 1. Dispatch global custom event for chart smooth panning back to center coordinates (panOffset: 0, priceOffset: 0)
    window.dispatchEvent(new CustomEvent('mountalgo-auto-center'));
    
    // 2. Smooth scroll any overflow container or window back to origin
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });

    // 3. Audio feedback
    tradingAudio.play('click');

    // 4. Trigger HUD Toast
    triggerZoomToast();
  }, [triggerZoomToast]);

  // Global Scroll Wheel Zoom Listener (Ctrl / Alt / Cmd + Mouse Wheel)
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          zoomIn();
        } else if (e.deltaY > 0) {
          zoomOut();
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, [zoomIn, zoomOut]);

  // Global Hotkey Zoom Listener (Ctrl + '+', Ctrl + '-', Ctrl + '0')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          zoomIn();
        } else if (e.key === '-') {
          e.preventDefault();
          zoomOut();
        } else if (e.key === '0') {
          e.preventDefault();
          resetZoom();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomIn, zoomOut, resetZoom]);

  // Synchronize global zoom scale to CSS root variables & trigger window resize for chart redraws
  useEffect(() => {
    const scale = globalZoom / 100;
    document.documentElement.style.setProperty('--global-zoom-scale', String(scale));
    document.documentElement.style.setProperty('--global-zoom-percent', `${globalZoom}%`);
    
    // Dispatch resize event to force canvas charts (TradingView/Lightweight/Custom) to recalculate cleanly
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 40);

    return () => clearTimeout(timer);
  }, [globalZoom]);

  // Tracks if the initial mount has completed to avoid showing save toasts on load
  const hasMountedRef = useRef(false);
  const [saveToasts, setSaveToasts] = useState<{ id: string; message: string; type?: string }[]>([]);

  useEffect(() => {
    hasMountedRef.current = true;
  }, []);

  // Toast adder helper with duplicate prevention
  const addSaveToast = useCallback((message: string, type: string = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setSaveToasts(prev => {
      const isDuplicate = prev.some(t => t.message === message);
      if (isDuplicate) return prev;
      return [...prev, { id, message, type }];
    });
    setTimeout(() => {
      setSaveToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3500);
  }, []);

  const handleToggleWorkspaceLock = useCallback((locked: boolean) => {
    setIsWorkspaceLocked(locked);
    localStorage.setItem('mountalgo_workspace_locked', String(locked));
    tradingAudio.play('PRESET');
    addSaveToast(
      locked ? '🔒 Workspace Terkunci: Pergeseran pembagi & penutupan widget dinonaktifkan.' : '🔓 Workspace Dibuka: Panel dapat digeser dan ditutup.',
      locked ? 'warning' : 'info'
    );
  }, [addSaveToast]);

  const handleTogglePriceScaleMode = useCallback(() => {
    setPriceScaleMode((prev) => {
      const next = prev === 'linear' ? 'logarithmic' : 'linear';
      localStorage.setItem('mountalgo_price_scale_mode', next);
      tradingAudio.play('PRESET');
      addSaveToast(
        next === 'logarithmic' ? '📈 Skala Harga Global: Logaritmik (Log)' : '📊 Skala Harga Global: Linear (Lin)',
        'info'
      );
      return next;
    });
  }, [addSaveToast]);

  useEffect(() => {
    const handleSaveToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string; type?: string }>;
      if (customEvent.detail && customEvent.detail.message) {
        addSaveToast(customEvent.detail.message, customEvent.detail.type || 'success');
      }
    };
    window.addEventListener('mountalgo_save_toast', handleSaveToastEvent);
    return () => {
      window.removeEventListener('mountalgo_save_toast', handleSaveToastEvent);
    };
  }, [addSaveToast]);

  // Auto-persist widget order changes (only toasts on real user modifications)
  const prevWidgetOrderRef = useRef<string[]>(widgetOrder);
  useEffect(() => {
    saveWidgetOrder(widgetOrder);
    if (hasMountedRef.current && JSON.stringify(prevWidgetOrderRef.current) !== JSON.stringify(widgetOrder)) {
      prevWidgetOrderRef.current = widgetOrder;
      triggerWorkspaceSaveToast("Konfigurasi tata letak panel diperbarui!");
    }
  }, [widgetOrder]);

  // Auto-persist orientation changes (only toasts on real user modifications)
  const prevOrientationRef = useRef<'auto' | 'landscape' | 'portrait'>(orientationOverride);
  useEffect(() => {
    saveOrientation(orientationOverride);
    if (hasMountedRef.current && prevOrientationRef.current !== orientationOverride) {
      prevOrientationRef.current = orientationOverride;
      const modeNames = {
        auto: 'Deteksi Otomatis (Auto Detect)',
        landscape: 'Mode Landscape (Horizontal Grid)',
        portrait: 'Mode Portrait (Vertikal Bertingkat)',
      };
      triggerWorkspaceSaveToast(`Orientasi disimpan: ${modeNames[orientationOverride]}`);
    }
  }, [orientationOverride]);
  
  // Device screen state
  const [screenInfo, setScreenInfo] = useState<{
    width: number;
    height: number;
    isPortrait: boolean;
    isMobile: boolean;
  }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
    isPortrait: typeof window !== 'undefined' ? window.innerHeight > window.innerWidth : false,
    isMobile: typeof window !== 'undefined' ? window.innerWidth < 768 : false,
  });

  // App-level native fullscreen state
  const [isAppFullscreen, setIsAppFullscreen] = useState(false);

  // Update screen info on resize and orientation change
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setScreenInfo({
        width: w,
        height: h,
        isPortrait: h > w,
        isMobile: w < 768,
      });
      setIsAppFullscreen(!!document.fullscreenElement);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    document.addEventListener('fullscreenchange', handleResize);

    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      document.removeEventListener('fullscreenchange', handleResize);
    };
  }, []);

  // Compute effective orientation
  const effectiveOrientation = orientationOverride === 'auto' 
    ? (screenInfo.isPortrait ? 'portrait' : 'landscape')
    : orientationOverride;

  const handleMove = (id: string, dir: 'left' | 'right') => {
    const idx = widgetOrder.indexOf(id);
    if (idx === -1) return;
    
    const newOrder = [...widgetOrder];
    const targetIdx = dir === 'left' 
      ? (idx - 1 + newOrder.length) % newOrder.length 
      : (idx + 1) % newOrder.length;
      
    const temp = newOrder[idx];
    newOrder[idx] = newOrder[targetIdx];
    newOrder[targetIdx] = temp;
    setWidgetOrder(newOrder);
  };

  const handleSplitChart = (sourceId?: string) => {
    const newId = 'chart-' + Math.random().toString(36).substr(2, 6);
    if (sourceId) {
      try {
        const sym = localStorage.getItem(`mountalgo_symbol_${sourceId}`) || localStorage.getItem('mountalgo_symbol') || 'BTCUSDT';
        const tf = localStorage.getItem(`mountalgo_timeframe_${sourceId}`) || localStorage.getItem('mountalgo_timeframe') || '1m';
        const ct = localStorage.getItem(`mountalgo_chart_type_${sourceId}`) || localStorage.getItem('mountalgo_chart_type') || 'candles';
        const ind = localStorage.getItem(`mountalgo_indicators_${sourceId}`) || localStorage.getItem('mountalgo_indicators');
        const fp = localStorage.getItem(`mountalgo_footprint_settings_${sourceId}`) || localStorage.getItem('mountalgo_footprint_settings');
        const bm = localStorage.getItem(`mountalgo_bookmap_settings_${sourceId}`) || localStorage.getItem('mountalgo_bookmap_settings');
        const tp = localStorage.getItem(`mountalgo_trade_position_${sourceId}`) || localStorage.getItem('mountalgo_trade_position');
        const hud = localStorage.getItem(`mountalgo_hud_position_${sourceId}`) || localStorage.getItem('mountalgo_hud_position');
        const drw = localStorage.getItem(`mountalgo_drawings_${sourceId}`) || localStorage.getItem('mountalgo_drawings');
        const radar = localStorage.getItem(`mountalgo_radar_dock_position_${sourceId}`) || localStorage.getItem('mountalgo_radar_dock_position');
        const domLadder = localStorage.getItem(`mountalgo_show_dom_ladder_${sourceId}`) || localStorage.getItem('mountalgo_show_dom_ladder');
        const domOverlay = localStorage.getItem(`mountalgo_dom_chart_overlay_${sourceId}`) || localStorage.getItem('mountalgo_dom_chart_overlay');

        localStorage.setItem(`mountalgo_symbol_${newId}`, sym);
        localStorage.setItem(`mountalgo_timeframe_${newId}`, tf);
        localStorage.setItem(`mountalgo_chart_type_${newId}`, ct);
        if (ind) localStorage.setItem(`mountalgo_indicators_${newId}`, ind);
        if (fp) localStorage.setItem(`mountalgo_footprint_settings_${newId}`, fp);
        if (bm) localStorage.setItem(`mountalgo_bookmap_settings_${newId}`, bm);
        if (tp) localStorage.setItem(`mountalgo_trade_position_${newId}`, tp);
        if (hud) localStorage.setItem(`mountalgo_hud_position_${newId}`, hud);
        if (drw) localStorage.setItem(`mountalgo_drawings_${newId}`, drw);
        if (radar) localStorage.setItem(`mountalgo_radar_dock_position_${newId}`, radar);
        if (domLadder) localStorage.setItem(`mountalgo_show_dom_ladder_${newId}`, domLadder);
        if (domOverlay) localStorage.setItem(`mountalgo_dom_chart_overlay_${newId}`, domOverlay);

        saveChartStateToIDB(newId, {
          symbol: sym,
          timeframe: tf,
          chartType: ct,
          indicators: ind ? JSON.parse(ind) : undefined,
          footprintSettings: fp ? JSON.parse(fp) : undefined,
          bookmapSettings: bm ? JSON.parse(bm) : undefined,
          tradePosition: tp,
          hudPosition: hud,
          drawings: drw ? JSON.parse(drw) : [],
          radarDockPosition: radar,
          showDomLadder: domLadder === 'true',
          showDomChartOverlay: domOverlay === 'true'
        });
      } catch (e) {
        console.warn('Error cloning chart state:', e);
      }
    }
    const newOrder = [...widgetOrder, newId];
    setWidgetOrder(newOrder);
  };

  const handleCloseWidget = (id: string) => {
    if (widgetOrder.length <= 1) return;
    setWidgetOrder(prev => prev.filter(w => w !== id));
  };

  const toggleWidgetFullscreen = useCallback((id: string) => {
    setFullscreenWidget(prev => (prev === id ? null : id));
  }, []);

  const toggleNativeFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  const cycleOrientation = () => {
    setOrientationOverride(prev => {
      if (prev === 'auto') return 'landscape';
      if (prev === 'landscape') return 'portrait';
      return 'auto';
    });
  };

  const handleApplyPreset = (preset: WorkspacePreset) => {
    setWidgetOrder(preset.widgetOrder);
    setOrientationOverride(preset.orientation);
    if (preset.theme) {
      setTheme(preset.theme);
    }
    setFullscreenWidget(null);
  };

  const renderWidget = (id: string) => {
    const isMaximized = fullscreenWidget === id;
    if (id.startsWith('chart') || id === 'tv1' || id === 'tv2') {
      const isChart2 = id === 'chart2' || id === 'tv2';
      const storedSym = localStorage.getItem(`mountalgo_symbol_${id}`);
      const defaultSymbol = storedSym || (isChart2 ? 'EURUSD' : 'BTCUSDT');
      const chartNum = id.replace(/[^0-9]/g, '') || (isChart2 ? '2' : '1');
      const title = `𝙈𝙤𝙪𝙣𝙩𝘼𝙡𝙜𝙤 Pro Chart ${chartNum}`;
      return (
        <CustomChartWidget 
          key={id}
          id={id}
          symbol={defaultSymbol} 
          title={title} 
          isFullscreen={isMaximized}
          isZenMode={isZenMode}
          isWorkspaceLocked={isWorkspaceLocked}
          isLogScale={priceScaleMode === 'logarithmic'}
          onToggleLogScale={handleTogglePriceScaleMode}
          onToggleFullscreen={() => toggleWidgetFullscreen(id)}
          onMoveLeft={!isWorkspaceLocked ? () => handleMove(id, 'left') : undefined} 
          onMoveRight={!isWorkspaceLocked ? () => handleMove(id, 'right') : undefined} 
          onSplit={!isWorkspaceLocked ? () => handleSplitChart(id) : undefined}
          onClose={!isWorkspaceLocked && widgetOrder.length > 1 ? () => handleCloseWidget(id) : undefined}
          globalZoom={globalZoom}
        />
      );
    }
    
    return null;
  };

  return (
    <>
    {/* Landing Page → Splash Screen → Terminal */}
    {showLanding && <LandingPage onEnterTerminal={handleEnterTerminal} />}
    {!showLanding && showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

    <div 
      id="app-layout"
      className={`p-0.5 sm:p-1.5 md:p-2 lg:p-3 font-sans overflow-hidden flex flex-col select-none relative transition-all duration-300 pb-safe tap-fix no-overflow-x ${showLanding ? 'hidden' : showSplash ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      style={{
        backgroundColor: 'var(--color-bg)',
        backgroundImage: `radial-gradient(ellipse 90% 60% at 50% -10%, ${palette.bull}15, transparent 70%), radial-gradient(ellipse 80% 50% at 90% 100%, ${palette.bear}12, transparent 65%)`,
        color: 'var(--color-text)',
        zoom: `${globalZoom}%`,
        width: `calc(100vw * 100 / ${globalZoom})`,
        height: `calc(100vh * 100 / ${globalZoom})`,
      }}
    >
      {/* Dynamic Ambient Glowing Halos Synchronized with Active Theme in Terminal Workspace */}
      <div 
        style={{ willChange: 'transform, opacity', contain: 'paint' }}
        className="absolute inset-0 pointer-events-none overflow-hidden"
      >
        {/* Top-left Bull Accent Halo */}
        <div 
          style={{ backgroundColor: isLight ? `${palette.bull}12` : `${palette.bull}30` }} 
          className={`absolute top-[-10%] left-[10%] w-[650px] h-[650px] rounded-full blur-[160px] pointer-events-none transition-all duration-700 hidden sm:block ${isLight ? 'opacity-10' : 'opacity-35'}`} 
        />
        {/* Bottom-right Bear Accent Halo */}
        <div 
          style={{ backgroundColor: isLight ? `${palette.bear}10` : `${palette.bear}25` }} 
          className={`absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] rounded-full blur-[160px] pointer-events-none transition-all duration-700 hidden sm:block ${isLight ? 'opacity-8' : 'opacity-30'}`} 
        />
        {/* Center POC Accent Glow */}
        <div 
          style={{ backgroundColor: isLight ? `${palette.poc}08` : `${palette.poc}18` }} 
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full blur-[180px] pointer-events-none transition-all duration-700 hidden sm:block ${isLight ? 'opacity-6' : 'opacity-20'}`} 
        />
      </div>

      {/* Global Hotkey Execution Toast Notification */}
      {!showLanding && !showSplash && hotkeyToast && (
        <div className="fixed top-1.5 sm:top-3 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-3 fade-in duration-150 pointer-events-none px-1 sm:px-0">
          <div 
            style={{
              backgroundColor: hotkeyToast.type === 'BUY' ? 'rgba(16, 185, 129, 0.2)' : hotkeyToast.type === 'SELL' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(10, 14, 28, 0.85)',
              borderColor: hotkeyToast.type === 'BUY' ? 'rgba(16, 185, 129, 0.6)' : hotkeyToast.type === 'SELL' ? 'rgba(244, 63, 94, 0.6)' : 'rgba(255, 255, 255, 0.15)',
              boxShadow: `0 16px 40px -5px rgba(0,0,0,0.6), 0 0 20px -5px ${hotkeyToast.type === 'BUY' ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}`,
              color: '#ffffff'
            }}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border backdrop-blur-2xl flex items-center gap-2 sm:gap-3 shadow-2xl"
          >
            <div 
              style={{
                backgroundColor: hotkeyToast.type === 'BUY' ? 'rgba(16, 185, 129, 0.9)' : hotkeyToast.type === 'SELL' ? 'rgba(244, 63, 94, 0.9)' : 'rgba(255, 255, 255, 0.2)',
                color: '#ffffff'
              }}
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl flex items-center justify-center font-black font-mono text-[10px] sm:text-xs shadow-md shrink-0"
            >
              {hotkeyToast.type === 'BUY' ? '▲' : hotkeyToast.type === 'SELL' ? '▼' : '⚡'}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-xs font-black tracking-wider flex items-center gap-1.5 sm:gap-2">
                <span className="truncate">{hotkeyToast.title}</span>
                <span className="text-[8px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-white shrink-0 font-bold">
                  {hotkeyToast.symbol}
                </span>
                {hotkeyToast.latencyMs !== undefined && (
                  <span className="text-[8px] sm:text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0 font-bold flex items-center gap-0.5">
                    ⚡ {hotkeyToast.latencyMs}ms
                  </span>
                )}
                {hotkeyToast.slippagePips !== undefined && (
                  <span className="text-[8px] sm:text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-white/10 text-zinc-300 shrink-0 hidden sm:inline border border-white/10">
                    Slip: {hotkeyToast.slippagePips}p
                  </span>
                )}
              </div>
              <div className="text-[9px] sm:text-[11px] font-mono text-zinc-300 opacity-90 truncate">{hotkeyToast.subtitle}</div>
            </div>
          </div>
        </div>
      )}

      {/* Top Header Bar with Orientation & Fullscreen Controls */}
      {isZenMode ? (
        <button
          onClick={() => setIsZenMode(false)}
          className="absolute top-2 sm:top-3 left-1/2 -translate-x-1/2 z-50 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 cursor-pointer transition-all flex items-center gap-1.5 sm:gap-2 shadow-2xl backdrop-blur-2xl border border-white/20 bg-[#04060e]/90 text-white touch-target tap-fix hover:bg-white/10"
          title="Restore Layouts"
        >
          <Minimize size={13} className="text-emerald-400" />
          <span className="text-[9px] sm:text-xs font-bold">Kembalikan Layout</span>
        </button>
      ) : (
      <header 
        style={{ 
          borderColor: isHighContrast ? '#ffffff' : `${palette.bull}25`, 
          backgroundColor: isHighContrast 
            ? (isLight ? '#ffffff' : '#040612')
            : (isLight 
                ? 'rgba(255, 255, 255, 0.92)' 
                : (palette.dark ? (palette.dark === '#242119' ? 'rgba(29, 26, 19, 0.88)' : (palette.dark !== '#000000' ? `${palette.dark}d9` : 'rgba(4, 6, 16, 0.82)')) : 'rgba(4, 6, 16, 0.82)')),
          boxShadow: isHighContrast 
            ? '0 0 0 1px #ffffff, 0 8px 32px rgba(0, 0, 0, 0.8)' 
            : `0 8px 32px rgba(0, 0, 0, 0.5), 0 1px 0 0 ${palette.bull}20, 0 0 20px -8px ${palette.bull}15` 
        }}
        className="flex items-center justify-between px-2 sm:px-3 md:px-3.5 py-1 sm:py-1.5 md:py-1.5 mb-1 sm:mb-1.5 md:mb-2 backdrop-blur-2xl border rounded-xl flex-shrink-0 relative z-[9000] group gap-1.5 sm:gap-2 md:gap-3 overflow-x-auto hide-scrollbar tap-fix transition-all duration-300"
      >
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 overflow-x-auto hide-scrollbar min-w-0 flex-1 py-0.5">
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-2.5 shrink-0">
            <MountAlgoLogo size="xs" className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
            <span className="font-extrabold text-[11px] sm:text-xs md:text-sm lg:text-base tracking-wider flex items-center gap-0.5 sm:gap-1 md:gap-1.5 overflow-visible text-white">
              <span className="font-black italic animate-text-slash text-white inline-block pr-1 sm:pr-1.5 md:pr-2">𝙈𝙤𝙪𝙣𝙩𝘼𝙡𝙜𝙤</span>
            </span>
            <span 
              style={{ borderColor: `${palette.bull}35`, color: palette.bull, backgroundColor: `${palette.bull}12` }}
              className="text-[8px] sm:text-[9px] md:text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border backdrop-blur-md tracking-wider hidden sm:inline-block"
            >
              PRO TERMINAL
            </span>
            <div 
              style={{ borderColor: `${palette.bull}30`, backgroundColor: `${palette.bull}10`, color: palette.bull }}
              className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-mono backdrop-blur-md"
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: palette.bull }} />
              <span>LIVE NETWORK</span>
            </div>
          </div>

          {/* Exit Fullscreen button if in fullscreen mode */}
          {fullscreenWidget && (
            <button
              onClick={() => setFullscreenWidget(null)}
              className="text-[8px] sm:text-[9px] md:text-[10px] text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded-lg border border-rose-500/30 bg-rose-500/10 backdrop-blur-md cursor-pointer font-bold transition-all shrink-0 hover:bg-rose-500/20"
              title="Tutup Fullscreen"
            >
              ✕ Exit
            </button>
          )}
        </div>

        {/* Orientation & Screen Size Adaptive Toolbar */}
        <TopBarMenu
          isZenMode={isZenMode}
          setIsZenMode={setIsZenMode}
          orientationOverride={orientationOverride}
          cycleOrientation={cycleOrientation}
          effectiveOrientation={effectiveOrientation}
          isAppFullscreen={isAppFullscreen}
          toggleNativeFullscreen={toggleNativeFullscreen}
          setIsAppSettingsOpen={setIsAppSettingsOpen}
          setIsHotkeyModalOpen={setIsHotkeyModalOpen}
          setIsPriceAlertsOpen={setIsPriceAlertsOpen}
          setIsWorkspacePresetsOpen={setIsWorkspacePresetsOpen}
          fullscreenWidget={fullscreenWidget}
          setFullscreenWidget={setFullscreenWidget}
          priceScaleMode={priceScaleMode}
          onTogglePriceScaleMode={handleTogglePriceScaleMode}
          isWorkspaceLocked={isWorkspaceLocked}
          onToggleWorkspaceLock={handleToggleWorkspaceLock}
          setIsHedgeModalOpen={setIsHedgeModalOpen}
          setIsEquityModalOpen={setIsEquityModalOpen}
          setIsSniperHubOpen={setIsSniperHubOpen}
          setIsNewsModalOpen={setIsNewsModalOpen}
          setIsAiAgentModalOpen={setIsAiAgentModalOpen}
          globalZoom={globalZoom}
          setGlobalZoom={setGlobalZoom}
          zoomIn={zoomIn}
          zoomOut={zoomOut}
          resetZoom={resetZoom}
        />
      </header>
      )}

      {/* Main Responsive Layout Workspace */}
      <main className="flex-1 w-full h-full min-h-0 relative overflow-hidden">
        <ResizableLayout
          widgetOrder={widgetOrder}
          renderWidget={renderWidget}
          effectiveOrientation={effectiveOrientation}
          fullscreenWidget={fullscreenWidget}
          isWorkspaceLocked={isWorkspaceLocked}
        />
      </main>

      {/* Workspace Layout Presets (Scalping, Swing, Macro Analysis, Multi-Chart) Modal */}
      <WorkspacePresetsModal 
        isOpen={isWorkspacePresetsOpen}
        onClose={() => setIsWorkspacePresetsOpen(false)}
        currentWidgetOrder={widgetOrder}
        currentOrientation={orientationOverride}
        onApplyPreset={handleApplyPreset}
      />

      {/* Global App Settings Modal */}
      <AppSettingsModal 
        isOpen={isAppSettingsOpen} 
        onClose={() => setIsAppSettingsOpen(false)}
        orientationOverride={orientationOverride}
        onChangeOrientation={(mode) => setOrientationOverride(mode)}
        isWorkspaceLocked={isWorkspaceLocked}
        onToggleWorkspaceLock={handleToggleWorkspaceLock}
      />

      {/* Global Hotkeys Cheat Sheet & Volume Presets Modal */}
      <HotkeyGuideModal
        isOpen={isHotkeyModalOpen}
        onClose={() => setIsHotkeyModalOpen(false)}
      />

      {/* Real & Demo Broker Account Manager Modal */}
      <AccountManagerModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
      />

      {/* Multi-Broker Instant Hedging & Arbitrage Modal */}
      <HedgeArbitrageModal
        isOpen={isHedgeModalOpen}
        onClose={() => setIsHedgeModalOpen(false)}
      />

      {/* Unified Cross-Account Net Worth Aggregator Modal */}
      <UnifiedEquityAggregatorModal
        isOpen={isEquityModalOpen}
        onClose={() => setIsEquityModalOpen(false)}
      />

      {/* MEXC New Listing Realtime Sniper Hub & Heatmap Modal */}
      <ListingSniperHubModal
        isOpen={isSniperHubOpen}
        onClose={() => setIsSniperHubOpen(false)}
        jumpToChartTarget={jumpToChartTarget}
        broadcastSymbolChange={broadcastSymbolChange}
      />

      {/* Real-time Price Alerts Sidebar Panel & Toast Manager */}
      <PriceAlerts 
        isOpen={isPriceAlertsOpen}
        onClose={() => setIsPriceAlertsOpen(false)}
        currentSymbol={focusedSymbol || "BTCUSDT"}
      />

      {/* Institutional Trade Journal & Analytics Modal */}
      <TradeJournalModal />

      {/* Real-Time Financial & Crypto News Feeds + Economic Calendar Modal */}
      <NewsAndCalendarModal
        isOpen={isNewsModalOpen}
        onClose={() => setIsNewsModalOpen(false)}
        activeSymbol={focusedSymbol || "BTCUSDT"}
        onOpenAiAgentWithContext={(promptText) => {
          setAiAgentInitialPrompt(promptText);
          setIsAiAgentModalOpen(true);
        }}
      />

      {/* MountAlgo Quantitative AI Agent Terminal Modal */}
      <AiAgentTerminalModal
        isOpen={isAiAgentModalOpen}
        onClose={() => {
          setIsAiAgentModalOpen(false);
          setAiAgentInitialPrompt(undefined);
        }}
        activeSymbol={focusedSymbol || "BTCUSDT"}
        initialPrompt={aiAgentInitialPrompt}
        onApplyTradeSetupToChart={(setup) => {
          if (setup && setup.symbol) {
            broadcastSymbolChange(setup.symbol);
          }
          setIsAiAgentModalOpen(false);
        }}
      />

      {/* Real-time MEXC New Listing Fast Alert Toast */}
      <AnimatePresence>
        {newListingToast && (
          <motion.div
            initial={{ opacity: 0, y: -25, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 420, damping: 26 }}
            className="fixed top-14 right-3 sm:right-6 z-[10001] max-w-[340px] sm:max-w-sm w-full bg-gradient-to-br from-emerald-950/95 via-zinc-950/95 to-teal-950/95 border border-emerald-500/50 shadow-2xl backdrop-blur-2xl rounded-2xl p-3 text-white overflow-hidden pointer-events-auto"
            style={{
              boxShadow: '0 15px 35px -10px rgba(16, 185, 129, 0.45), 0 0 25px rgba(16, 185, 129, 0.2)'
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/60 flex items-center justify-center text-emerald-400 shrink-0">
                  <Flame size={18} className="animate-bounce text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9.5px] font-mono font-black uppercase px-1.5 py-0.2 rounded bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 animate-pulse">
                      <DynamicListingTimer firstSeenAt={newListingToast.firstSeenAt} mode="badge" />
                    </span>
                    <span className="text-[10.5px] font-mono text-emerald-200/80">MEXC Realtime</span>
                  </div>
                  <h4 className="font-mono font-bold text-sm text-white mt-0.5 tracking-tight flex items-center gap-1.5 truncate">
                    {newListingToast.symbol}
                    <span className="text-[10px] text-zinc-400 font-normal">({newListingToast.type?.toUpperCase() || 'SPOT'})</span>
                  </h4>
                </div>
              </div>
              <button
                onClick={dismissNewListingToast}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800/60 transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
            {newListingToast.volumeFlow && (
              <div className="mt-2 grid grid-cols-2 gap-1.5 px-2 py-1.5 rounded-lg bg-zinc-900/80 border border-emerald-500/20 text-[9.5px] font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Pressure:</span>
                  <span className={`font-bold ${
                    newListingToast.volumeFlow.pressure === 'STRONG_BUY' ? 'text-emerald-400' : 'text-cyan-400'
                  }`}>
                    {newListingToast.volumeFlow.pressure}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Vol Spike:</span>
                  <span className="text-amber-300 font-bold">{newListingToast.volumeFlow.volumeAcceleration5m}x</span>
                </div>
                {newListingToast.slippageGuard && (
                  <div className="col-span-2 flex items-center justify-between pt-1 border-t border-zinc-800 text-[9px]">
                    <span className="text-zinc-400">Slippage Cap:</span>
                    <span className="text-emerald-300 font-semibold">
                      Max ${newListingToast.slippageGuard.maxOrderCapUsd} | {newListingToast.slippageGuard.suggestedAction}
                    </span>
                  </div>
                )}
              </div>
            )}
            <div className="mt-2.5 flex items-center justify-between gap-1.5 pt-2 border-t border-emerald-500/20 text-xs">
              <span className="text-[10px] text-emerald-300/80 font-mono truncate flex items-center gap-1">
                <DynamicListingTimer firstSeenAt={newListingToast.firstSeenAt} mode="full" />
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => {
                    try {
                      localStorage.setItem('mountalgo_symbol', newListingToast.symbol);
                      broadcastSymbolChange(newListingToast.symbol);
                      jumpToChartTarget(newListingToast.symbol);
                    } catch {}
                  }}
                  className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-mono font-bold text-[10.5px] transition-colors cursor-pointer flex items-center gap-0.5"
                >
                  Chart
                </button>
                <button
                  onClick={() => {
                    if (instantSnipeListing) {
                      instantSnipeListing(newListingToast, 100);
                    }
                    dismissNewListingToast();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-mono font-black text-[11px] hover:from-emerald-400 hover:to-teal-300 transition-all cursor-pointer shadow-lg flex items-center gap-1 animate-pulse"
                >
                  <Zap size={12} />
                  ⚡ SNIPE NOW
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Glassmorphic Global Zoom HUD Toast */}
      <AnimatePresence>
        {showZoomToast && (() => {
          const res = detectScreenResolution();
          return (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9, transition: { duration: 0.15 } }}
              className="fixed bottom-14 left-1/2 -translate-x-1/2 z-[10008] bg-zinc-950/95 border border-emerald-500/40 text-white rounded-2xl px-4 py-2.5 shadow-2xl backdrop-blur-xl flex flex-wrap items-center gap-3 font-mono text-xs select-none max-w-[95vw]"
              onMouseEnter={() => {
                if (zoomToastTimerRef.current) clearTimeout(zoomToastTimerRef.current);
              }}
              onMouseLeave={triggerZoomToast}
              onWheel={(e) => {
                e.stopPropagation();
                if (e.deltaY < 0) zoomIn();
                else if (e.deltaY > 0) zoomOut();
              }}
            >
              <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                <ZoomIn size={14} />
                <span>Zoom UI:</span>
                <span className="text-white text-sm font-black">{globalZoom}%</span>
              </div>

              {/* Monitor Resolution Badge */}
              <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300">
                <span>{res.icon}</span>
                <span className="font-bold text-white">{res.shortLabel}</span>
                <span className="text-emerald-400 font-bold px-1 py-0.2 bg-emerald-500/20 rounded text-[9px]">
                  Anti-Blur Sharp
                </span>
              </div>

              <div className="flex items-center gap-1 pl-2 border-l border-zinc-800">
                <button
                  onClick={zoomOut}
                  disabled={globalZoom <= 50}
                  className="w-6 h-6 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 hover:text-white cursor-pointer disabled:opacity-30"
                  title="Zoom Out"
                >
                  -
                </button>
                <button
                  onClick={zoomIn}
                  disabled={globalZoom >= 175}
                  className="w-6 h-6 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 hover:text-white cursor-pointer disabled:opacity-30"
                  title="Zoom In"
                >
                  +
                </button>
                <button
                  onClick={resetZoom}
                  className="px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold text-[10px] cursor-pointer"
                  title="Reset Zoom ke 100%"
                >
                  Reset (100%)
                </button>
                <button
                  onClick={triggerAutoCenter}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/25 hover:bg-emerald-500/40 border border-emerald-500/50 text-emerald-300 hover:text-white font-bold text-[10px] cursor-pointer transition-all flex items-center gap-1 shadow-sm active:scale-95"
                  title="Auto-Center Layout: Animasi halus kembali ke koordinat tengah chart & tata letak jika tergeser terlalu jauh"
                >
                  <Crosshair size={11} className="text-emerald-400" />
                  <span>Auto-Center</span>
                </button>
              </div>
              <span className="text-[9px] text-zinc-500 hidden md:inline border-l border-zinc-800 pl-2">
                Ctrl + Scroll
              </span>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Workspace Configuration Save Toast Container */}
      <div className="fixed bottom-2 sm:bottom-3 md:bottom-5 right-2 sm:right-3 md:right-5 z-[10000] flex flex-col gap-1 sm:gap-1.5 md:gap-2 max-w-[260px] sm:max-w-[280px] md:max-w-sm pointer-events-none">
        <AnimatePresence>
          {saveToasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="pointer-events-auto shadow-2xl backdrop-blur-md rounded-lg sm:rounded-xl border p-2 sm:p-3 flex items-center gap-2 sm:gap-3 bg-[var(--color-panel)]/95 border-[var(--color-bull)]/40"
              style={{
                boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)',
                borderLeft: '3px solid var(--color-bull)'
              }}
            >
              <CheckCircle2 size={14} className="text-[var(--color-bull)] shrink-0 sm:w-[18px] sm:h-[18px]" />
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] sm:text-[11px] font-bold text-[var(--color-text)] tracking-wide leading-tight">
                  Tersimpan
                </span>
                <span className="text-[8px] sm:text-[11px] text-[var(--color-text-muted)] leading-tight mt-0.5 truncate">
                  {toast.message}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
    </>
  );
}
