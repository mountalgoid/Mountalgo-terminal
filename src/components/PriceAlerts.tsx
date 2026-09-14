import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Bell, 
  BellRing, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Volume2, 
  VolumeX, 
  TrendingUp, 
  TrendingDown, 
  X, 
  ChevronRight, 
  Clock, 
  Sparkles, 
  RefreshCw, 
  Edit2, 
  Play, 
  Pause, 
  ShieldAlert,
  Search,
  Check,
  Zap,
  Info,
  DollarSign
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { COMPREHENSIVE_MARKET_PAIRS } from './SymbolSelectorModal';

export interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
  label: string;
  isActive: boolean;
  soundAlert: boolean;
  createdAt: number;
  triggeredAt?: number | null;
  initialPrice?: number;
}

export interface TriggeredNotification {
  id: string;
  alertId: string;
  symbol: string;
  targetPrice: number;
  triggeredPrice: number;
  condition: 'above' | 'below';
  label: string;
  timestamp: number;
  read: boolean;
}

interface PriceAlertsProps {
  isOpen: boolean;
  onClose: () => void;
  currentSymbol?: string;
}

const LOCAL_STORAGE_ALERTS_KEY = 'mountalgo_price_alerts_v1';
const LOCAL_STORAGE_NOTIFS_KEY = 'mountalgo_alert_notifications_v1';

// Default prices for common assets for realistic fallback/simulation
const INITIAL_DEMO_PRICES: Record<string, number> = {
  BTCUSDT: 96450.0,
  ETHUSDT: 2780.5,
  SOLUSDT: 198.4,
  BNBUSDT: 650.2,
  XRPUSDT: 2.45,
  'FX:EURUSD': 1.0450,
  'FX:GBPUSD': 1.2580,
  'FX:USDJPY': 152.30,
  'OANDA:XAUUSD': 2890.50,
  'OANDA:XAGUSD': 32.40,
};

export default function PriceAlerts({ isOpen, onClose, currentSymbol = 'BTCUSDT' }: PriceAlertsProps) {
  const { palette } = useTheme();
  
  // State: Tab selection
  const [activeTab, setActiveTab] = useState<'alerts' | 'create' | 'notifications'>('alerts');

  // State: Alerts list
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_ALERTS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    // No demo alerts — start empty, user creates their own
    return [];
  });

  // State: Notifications list
  const [notifications, setNotifications] = useState<TriggeredNotification[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_NOTIFS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    // No demo notifications — start clean
    return [];
  });

  // State: Live market prices
  const [livePrices, setLivePrices] = useState<Record<string, { price: number; prevPrice: number; change24h?: number }>>(() => {
    const initial: Record<string, { price: number; prevPrice: number }> = {};
    Object.entries(INITIAL_DEMO_PRICES).forEach(([sym, p]) => {
      initial[sym] = { price: p, prevPrice: p };
    });
    return initial;
  });

  // State: New Alert Form Inputs
  const [formSymbol, setFormSymbol] = useState<string>(currentSymbol);
  const [formTargetPrice, setFormTargetPrice] = useState<string>('');
  const [formCondition, setFormCondition] = useState<'above' | 'below'>('above');
  const [formLabel, setFormLabel] = useState<string>('');
  const [formSound, setFormSound] = useState<boolean>(true);
  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);

  // State: Toast Banner Popup for real-time triggered alerts
  const [activeToast, setActiveToast] = useState<TriggeredNotification | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Search filter for symbol selector in create tab
  const [symbolSearch, setSymbolSearch] = useState<string>('');
  const [showSymbolDropdown, setShowSymbolDropdown] = useState<boolean>(false);

  // Web Audio Context for notification chime
  const audioCtxRef = useRef<AudioContext | null>(null);
  // Cooldown: prevent same alert from re-triggering within 5 seconds
  const lastTriggeredRef = useRef<Record<string, number>>({});
  // Global sound cooldown to prevent overlapping chimes
  const lastSoundTimeRef = useRef<number>(0);
  // Track alerts already triggered this session to prevent replay on re-render
  const triggeredSessionRef = useRef<Set<string>>(new Set());

  // Synchronize formSymbol when currentSymbol changes if form is empty
  useEffect(() => {
    if (!formSymbol) {
      setFormSymbol(currentSymbol);
    }
  }, [currentSymbol, formSymbol]);

  // Persist alerts & notifications
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_ALERTS_KEY, JSON.stringify(alerts));
    } catch {
      // ignore
    }
  }, [alerts]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_NOTIFS_KEY, JSON.stringify(notifications));
    } catch {
      // ignore
    }
  }, [notifications]);

  // Sound chime synthesizer using Web Audio API
  const playAlertChime = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      // Tone 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.5);

      // Tone 2 (Higher ping)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1174.66, now + 0.15); // D6
      gain2.gain.setValueAtTime(0.25, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.6);
    } catch {
      // audio disabled/blocked
    }
  }, []);

  // Set default target price in form based on selected symbol's current live price
  useEffect(() => {
    if (!formSymbol) return;
    const currentPriceObj = livePrices[formSymbol] || livePrices[formSymbol.toUpperCase()];
    if (currentPriceObj && !formTargetPrice && !editingAlertId) {
      setFormTargetPrice(currentPriceObj.price.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formSymbol, editingAlertId]);

  // Live WebSocket feed from Binance for crypto + fallback ticker loop
  useEffect(() => {
    let ws: WebSocket | null = null;
    let isSubscribed = true;

    try {
      ws = new WebSocket('wss://stream.binance.com:9443/ws/!miniTicker@arr');
      
      ws.onmessage = (event) => {
        if (!isSubscribed) return;
        try {
          const data = JSON.parse(event.data);
          if (Array.isArray(data)) {
            setLivePrices(prev => {
              const updated = { ...prev };
              data.forEach((ticker: { s: string; c: string }) => {
                const sym = ticker.s; // e.g. BTCUSDT
                const priceNum = parseFloat(ticker.c);
                if (sym && !isNaN(priceNum)) {
                  const currentPrev = updated[sym]?.price ?? priceNum;
                  updated[sym] = {
                    price: priceNum,
                    prevPrice: currentPrev,
                  };
                }
              });
              return updated;
            });
          }
        } catch {
          // ignore parse error
        }
      };
    } catch {
      // ws connection error
    }

    // Real market price ticker polling fallback (for Forex / non-ws symbols)
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/market/all-tickers');
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && data.tickers) {
            setLivePrices(prev => {
              const next = { ...prev };
              Object.keys(data.tickers).forEach(sym => {
                const info = data.tickers[sym];
                if (info && info.price) {
                  const currentPrev = next[sym]?.price ?? info.price;
                  next[sym] = {
                    price: info.price,
                    prevPrice: currentPrev,
                  };
                }
              });
              return next;
            });
          }
        }
      } catch {}
    }, 2500);

    return () => {
      isSubscribed = false;
      if (ws) {
        ws.close();
      }
      clearInterval(interval);
    };
  }, []);

  // Evaluate alerts against live prices in real-time
  useEffect(() => {
    if (alerts.length === 0) return;

    alerts.forEach(alert => {
      if (!alert.isActive) return;

      const priceInfo = livePrices[alert.symbol] || livePrices[alert.symbol.toUpperCase()];
      if (!priceInfo) return;

      const currentPrice = priceInfo.price;
      let isTriggered = false;

      if (alert.condition === 'above' && currentPrice >= alert.targetPrice) {
        isTriggered = true;
      } else if (alert.condition === 'below' && currentPrice <= alert.targetPrice) {
        isTriggered = true;
      }

      if (isTriggered) {
        // Prevent re-triggering same alert within 5 seconds
        const now = Date.now();
        const lastTrigger = lastTriggeredRef.current[alert.id] || 0;
        if (now - lastTrigger < 5000) return;
        // Also prevent if already triggered this session
        if (triggeredSessionRef.current.has(alert.id)) return;
        lastTriggeredRef.current[alert.id] = now;
        triggeredSessionRef.current.add(alert.id);

        // Trigger alert!
        const notif: TriggeredNotification = {
          id: `notif-${now}-${Math.random().toString(36).substring(2, 6)}`,
          alertId: alert.id,
          symbol: alert.symbol,
          targetPrice: alert.targetPrice,
          triggeredPrice: currentPrice,
          condition: alert.condition,
          label: alert.label || (alert.condition === 'above' ? 'Target Reached Above' : 'Support Reached Below'),
          timestamp: now,
          read: false,
        };

        // Add to notifications
        setNotifications(prev => [notif, ...prev]);

        // Deactivate alert after trigger so it doesn't repeatedly fire endlessly
        setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, isActive: false, triggeredAt: now } : a));

        // Sound chime if enabled — with 800ms global cooldown between sounds
        if (alert.soundAlert && now - lastSoundTimeRef.current > 800) {
          lastSoundTimeRef.current = now;
          playAlertChime();
        }

        // Show real-time toast banner
        setActiveToast(notif);

        if (toastTimeoutRef.current) {
          clearTimeout(toastTimeoutRef.current);
        }
        toastTimeoutRef.current = setTimeout(() => {
          setActiveToast(null);
        }, 6000);
      }
    });
  }, [livePrices, alerts, playAlertChime]);

  // Form Submit: Save or Edit Alert
  const handleSaveAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(formTargetPrice);
    if (isNaN(target) || target <= 0 || !formSymbol) return;

    const currentLive = livePrices[formSymbol]?.price ?? target;

    if (editingAlertId) {
      setAlerts(prev => prev.map(a => a.id === editingAlertId ? {
        ...a,
        symbol: formSymbol.toUpperCase(),
        targetPrice: target,
        condition: formCondition,
        label: formLabel || `${formSymbol.toUpperCase()} ${formCondition === 'above' ? '≥' : '≤'} ${target}`,
        soundAlert: formSound,
        isActive: true, // Re-enable on edit
      } : a));
      setEditingAlertId(null);
    } else {
      const newAlert: PriceAlert = {
        id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        symbol: formSymbol.toUpperCase(),
        targetPrice: target,
        condition: formCondition,
        label: formLabel || `${formSymbol.toUpperCase()} ${formCondition === 'above' ? '≥' : '≤'} ${target}`,
        isActive: true,
        soundAlert: formSound,
        createdAt: Date.now(),
        initialPrice: currentLive,
      };
      setAlerts(prev => [newAlert, ...prev]);
    }

    // Reset Form
    setFormLabel('');
    setFormTargetPrice('');
    setActiveTab('alerts');
  };

  // Quick percent offset adjust button (+1%, -1%, +2%, -2%, +5%, -5%)
  const applyPercentOffset = (pct: number) => {
    const currentPrice = livePrices[formSymbol]?.price ?? parseFloat(formTargetPrice) ?? 100;
    const computed = currentPrice * (1 + pct / 100);
    setFormTargetPrice(Number(computed.toFixed(computed < 10 ? 4 : 2)).toString());
    setFormCondition(pct >= 0 ? 'above' : 'below');
  };

  // Start editing existing alert
  const startEditing = (alert: PriceAlert) => {
    setEditingAlertId(alert.id);
    setFormSymbol(alert.symbol);
    setFormTargetPrice(alert.targetPrice.toString());
    setFormCondition(alert.condition);
    setFormLabel(alert.label);
    setFormSound(alert.soundAlert);
    setActiveTab('create');
  };

  // Toggle active alert state
  const toggleAlertActive = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));
  };

  // Re-arm triggered alert
  const rearmAlert = (alert: PriceAlert) => {
    setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, isActive: true, triggeredAt: null } : a));
    // Allow re-triggering this alert
    triggeredSessionRef.current.delete(alert.id);
  };

  // Delete alert
  const deleteAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    triggeredSessionRef.current.delete(id);
  };

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  // Test notification trigger manually
  const triggerTestNotification = () => {
    const currentLive = livePrices[currentSymbol]?.price ?? 96500;
    const testNotif: TriggeredNotification = {
      id: `test-${Date.now()}`,
      alertId: 'test',
      symbol: currentSymbol,
      targetPrice: currentLive,
      triggeredPrice: currentLive,
      condition: 'above',
      label: '⚡ Test Alert Signal Triggered!',
      timestamp: Date.now(),
      read: false,
    };
    setNotifications(prev => [testNotif, ...prev]);
    playAlertChime();
    setActiveToast(testNotif);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setActiveToast(null), 5000);
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const activeAlertsCount = alerts.filter(a => a.isActive).length;

  if (!isOpen) {
    return (
      <>
        {/* Real-time Toast Banner Popup even when sidebar is collapsed */}
        {activeToast && (
          <div 
            style={{ borderColor: palette.bull, boxShadow: `0 0 25px ${palette.bull}50` }}
            className="fixed top-3 right-3 sm:top-4 sm:right-4 z-[999] bg-[var(--color-panel)]/95 backdrop-blur-md border rounded-xl p-3 sm:p-3.5 shadow-2xl max-w-[calc(100vw-1.5rem)] sm:max-w-sm w-full animate-bounceIn text-[var(--color-text)] flex items-start gap-2.5 sm:gap-3 cursor-pointer"
            onClick={() => {
              setActiveToast(null);
              onClose(); // Open sidebar
            }}
          >
            <div 
              style={{ backgroundColor: `${palette.bull}20`, color: palette.bull }}
              className="p-2 rounded-lg flex-shrink-0 animate-pulse"
            >
              <BellRing size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-emerald-400 flex items-center gap-1">
                  <Zap size={12} /> PRICE ALERT TRIGGERED
                </span>
                <span className="text-[10px] text-[var(--color-text-muted)]">Sekarang</span>
              </div>
              <p className="font-extrabold text-sm text-[var(--color-text)] mt-0.5 truncate">{activeToast.symbol}</p>
              <p className="text-xs text-[var(--color-text-muted)] font-mono mt-0.5">
                {activeToast.label || `Harga menembus target ${activeToast.condition === 'above' ? '≥' : '≤'} ${activeToast.targetPrice}`}
              </p>
              <div className="flex items-center gap-2 mt-1.5 text-[11px] font-mono text-[var(--color-text-muted)]">
                <span>Target: <strong className="text-[var(--color-text)]">{activeToast.targetPrice}</strong></span>
                <span>•</span>
                <span>Live: <strong className="text-emerald-400">{activeToast.triggeredPrice}</strong></span>
              </div>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); setActiveToast(null); }}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-1"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Sidebar Panel Drawer */}
      <div 
        style={{ borderColor: `${palette.bull}30` }}
        className="fixed top-0 right-0 bottom-0 z-modal-ultimate w-full sm:w-[420px] bg-[var(--color-panel)]/98 text-[var(--color-text)] border-l shadow-2xl flex flex-col animate-slideLeft select-none backdrop-blur-xl"
      >
        {/* Top Header */}
        <div 
          style={{ borderColor: `${palette.bull}25` }}
          className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b bg-[var(--color-panel)]/90"
        >
          <div className="flex items-center gap-2.5">
            <div 
              style={{ backgroundColor: `${palette.bull}20`, color: palette.bull, borderColor: `${palette.bull}50` }}
              className="p-1.5 rounded-lg border shadow-[0_0_12px_rgba(81,52,255,0.3)]"
            >
              <BellRing size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-xs sm:text-sm tracking-wide text-[var(--color-text)] flex items-center gap-2">
                PRICE ALERTS
                <span className="hidden sm:inline">& NOTIFICATIONS</span>
              </h3>
              <p className="text-[9px] sm:text-[10px] text-[var(--color-text-muted)] font-mono">
                {activeAlertsCount} Aktif • Real-Time Market Monitor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={triggerTestNotification}
              className="text-[10px] font-mono px-2 py-1 rounded-md bg-[var(--color-panel)] hover:bg-[var(--color-panel)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] border border-[var(--color-border)] flex items-center gap-1 transition-colors cursor-pointer"
              title="Uji coba sinyal notifikasi & suara"
            >
              <Zap size={10} className="text-yellow-400" />
              <span>Tes Sin</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-panel)] transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-[var(--color-border)] bg-[var(--color-panel)] px-1.5 sm:px-2 pt-1 overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setActiveTab('alerts')}
            style={activeTab === 'alerts' ? { color: palette.bull, borderColor: palette.bull } : {}}
            className={`flex-1 py-2 text-[11px] sm:text-xs font-mono font-bold border-b-2 transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'alerts' 
                ? 'border-b-2 text-[var(--color-text)] bg-[var(--color-panel)]' 
                : 'border-transparent text-[var(--color-text-muted)] hover:text-gray-200'
            }`}
          >
            <Bell size={12} className="sm:w-[13px] sm:h-[13px]" />
            <span className="hidden sm:inline">Target Alert</span>
            <span className="sm:hidden">Alerts</span>
            <span>({alerts.length})</span>
          </button>

          <button
            onClick={() => {
              setEditingAlertId(null);
              setFormLabel('');
              setActiveTab('create');
            }}
            style={activeTab === 'create' ? { color: palette.bull, borderColor: palette.bull } : {}}
            className={`flex-1 py-2 text-[11px] sm:text-xs font-mono font-bold border-b-2 transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'create' 
                ? 'border-b-2 text-[var(--color-text)] bg-[var(--color-panel)]' 
                : 'border-transparent text-[var(--color-text-muted)] hover:text-gray-200'
            }`}
          >
            <Plus size={12} className="sm:w-[13px] sm:h-[13px]" />
            <span className="hidden sm:inline">Buat Alert Baru</span>
            <span className="sm:hidden">Baru</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('notifications');
              // Mark all as read
              setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            }}
            style={activeTab === 'notifications' ? { color: palette.bull, borderColor: palette.bull } : {}}
            className={`flex-1 py-2 text-[11px] sm:text-xs font-mono font-bold border-b-2 transition-all flex items-center justify-center gap-1 sm:gap-1.5 relative cursor-pointer whitespace-nowrap ${
              activeTab === 'notifications' 
                ? 'border-b-2 text-[var(--color-text)] bg-[var(--color-panel)]' 
                : 'border-transparent text-[var(--color-text-muted)] hover:text-gray-200'
            }`}
          >
            <Sparkles size={13} />
            <span className="hidden sm:inline">Riwayat ({notifications.length})</span>
            <span className="sm:hidden">Notif ({notifications.length})</span>
            {unreadCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute top-1.5 right-3" />
            )}
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 custom-scrollbar">

          {/* TAB 1: ACTIVE ALERTS LIST */}
          {activeTab === 'alerts' && (
            <div className="space-y-3">
              {/* Quick Header Banner */}
              <div className="flex items-center justify-between text-xs font-mono text-[var(--color-text-muted)] px-1">
                <span>MEMANTAU {alerts.length} TARGET HARGA</span>
                <button
                  onClick={() => {
                    setEditingAlertId(null);
                    setFormLabel('');
                    setActiveTab('create');
                  }}
                  style={{ color: palette.bull }}
                  className="hover:underline flex items-center gap-1 font-bold cursor-pointer"
                >
                  <Plus size={12} /> Tambah Target
                </button>
              </div>

              {alerts.length === 0 ? (
                <div className="py-12 text-center text-[var(--color-text-muted)] space-y-3 bg-[var(--color-panel)]/50 border border-[var(--color-border)] rounded-2xl p-6">
                  <div className="w-12 h-12 rounded-full bg-[var(--color-card)] text-[var(--color-text-muted)] flex items-center justify-center mx-auto">
                    <Bell size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--color-text-muted)]">Belum Ada Alert Aktif</p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">Buat target harga baru untuk menerima notifikasi real-time saat level tercapai.</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('create')}
                    style={{ backgroundColor: palette.bull }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-black hover:opacity-90 transition-all shadow-lg cursor-pointer"
                  >
                    + Buat Alert Pertama
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {alerts.map(alert => {
                    const priceInfo = livePrices[alert.symbol] || livePrices[alert.symbol.toUpperCase()];
                    const currentLive = priceInfo?.price;
                    const pctAway = currentLive 
                      ? (((alert.targetPrice - currentLive) / currentLive) * 100).toFixed(2)
                      : null;

                    return (
                      <div 
                        key={alert.id}
                        style={{
                          borderColor: alert.isActive ? `${palette.bull}35` : 'var(--color-border)',
                          backgroundColor: alert.isActive ? 'var(--color-card)' : 'var(--color-bg)'
                        }}
                        className={`p-3 rounded-xl border transition-all relative group ${
                          !alert.isActive ? 'opacity-65' : 'hover:border-emerald-500/50 shadow-lg'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-[var(--color-text)] font-mono tracking-wide">
                              {alert.symbol}
                            </span>
                            <span 
                              className="text-[10px] font-mono px-2 py-0.5 rounded font-bold flex items-center gap-1 border"
                              style={{
                                backgroundColor: alert.condition === 'above' ? `${palette.bull}20` : `${palette.bear}20`,
                                color: alert.condition === 'above' ? palette.bull : palette.bear,
                                borderColor: alert.condition === 'above' ? `${palette.bull}40` : `${palette.bear}40`,
                              }}
                            >
                              {alert.condition === 'above' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                              {alert.condition === 'above' ? '≥ ATAS' : '≤ BAWAH'}
                            </span>
                          </div>

                          {/* Quick Controls */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => toggleAlertActive(alert.id)}
                              style={alert.isActive ? { backgroundColor: `${palette.bull}20`, color: palette.bull } : {}}
                              className={`p-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                                alert.isActive 
                                  ? 'hover:opacity-80' 
                                  : 'bg-[var(--color-input-bg)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                              }`}
                              title={alert.isActive ? 'Nonaktifkan sementara' : 'Aktifkan alert'}
                            >
                              {alert.isActive ? <Play size={12} className="fill-current" /> : <Pause size={12} />}
                            </button>

                            <button
                              onClick={() => startEditing(alert)}
                              className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)] transition-colors cursor-pointer"
                              title="Edit Alert"
                            >
                              <Edit2 size={12} />
                            </button>

                            <button
                              onClick={() => deleteAlert(alert.id)}
                              className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Hapus Alert"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Label & Target Price details */}
                        <div className="mt-2 flex items-baseline justify-between">
                          <div>
                            <p className="text-xs text-[var(--color-text-muted)] font-medium">
                              {alert.label || 'Sinyal Target Harga'}
                            </p>
                            <p className="text-[10px] text-[var(--color-text-muted)] font-mono mt-0.5">
                              Target: <span className="text-[var(--color-text)] font-bold font-mono text-sm">{alert.targetPrice}</span>
                            </p>
                          </div>

                          {/* Distance percentage */}
                          <div className="text-right">
                            {currentLive ? (
                              <>
                                <p className="text-[10px] text-[var(--color-text-muted)] font-mono">
                                  Live: <span className="font-bold" style={{ color: palette.bull }}>{currentLive}</span>
                                </p>
                                {pctAway !== null && (
                                  <p 
                                    className="text-[10px] font-mono font-bold mt-0.5"
                                    style={{ color: parseFloat(pctAway) > 0 ? palette.bull : palette.bear }}
                                  >
                                    {parseFloat(pctAway) > 0 ? `+${pctAway}%` : `${pctAway}%`} dari live
                                  </p>
                                )}
                              </>
                            ) : (
                              <span className="text-[10px] text-[var(--color-text-muted)] font-mono">Menghubungkan...</span>
                            )}
                          </div>
                        </div>

                        {/* Status bar bottom */}
                        <div className="mt-2.5 pt-2 border-t border-[var(--color-border)] flex items-center justify-between text-[10px] text-[var(--color-text-muted)] font-mono">
                          <span className="flex items-center gap-1">
                            {alert.soundAlert ? <Volume2 size={11} className="text-indigo-400" /> : <VolumeX size={11} />}
                            {alert.soundAlert ? 'Suara On' : 'Mute'}
                          </span>
                          <span>
                            {alert.triggeredAt 
                              ? `Tercapai: ${new Date(alert.triggeredAt).toLocaleTimeString()}`
                              : alert.isActive ? 'Memantau...' : 'Di-pause'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CREATE / EDIT ALERT FORM */}
          {activeTab === 'create' && (
            <form onSubmit={handleSaveAlert} className="space-y-4">
              <div className="p-3 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl space-y-3">
                <h4 className="text-xs font-mono font-bold text-[var(--color-text-muted)] flex items-center gap-1.5">
                  <Sparkles size={13} className="text-yellow-400" />
                  {editingAlertId ? 'EDIT TARGET ALERT' : 'BUAT KONFIGURASI ALERT HARGA'}
                </h4>

                {/* Symbol Selector Input */}
                <div className="space-y-1 relative">
                  <label className="text-[11px] font-mono text-[var(--color-text-muted)]">PILIH SYMBOL / PASAR</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formSymbol || ''}
                      onChange={(e) => {
                        setFormSymbol(e.target.value.toUpperCase());
                        setShowSymbolDropdown(true);
                      }}
                      onFocus={() => setShowSymbolDropdown(true)}
                      placeholder="Cari simbol (contoh: BTCUSDT, EURUSD)..."
                      className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-lg px-3 py-2 text-sm font-mono font-bold text-[var(--color-text)] focus:outline-none focus:border-cyan-500"
                      required
                    />
                    <Search size={14} className="absolute right-3 top-3 text-[var(--color-text-muted)] pointer-events-none" />
                  </div>

                  {/* Symbol Quick Dropdown */}
                  {showSymbolDropdown && (
                    <div className="absolute top-full left-0 right-0 z-[100] mt-1 max-h-44 overflow-y-auto bg-[var(--color-panel)] border border-[var(--color-border)] rounded-xl shadow-2xl p-1.5 space-y-1 custom-scrollbar">
                      <div className="text-[10px] font-mono text-[var(--color-text-muted)] px-2 py-1">SIMBOL POPULER:</div>
                      {COMPREHENSIVE_MARKET_PAIRS.filter(p => 
                        p.symbol.toLowerCase().includes(formSymbol.toLowerCase()) || 
                        p.name.toLowerCase().includes(formSymbol.toLowerCase())
                      ).slice(0, 8).map(pair => (
                        <button
                          key={pair.symbol}
                          type="button"
                          onClick={() => {
                            setFormSymbol(pair.symbol);
                            setShowSymbolDropdown(false);
                            const p = livePrices[pair.symbol]?.price;
                            if (p) setFormTargetPrice(p.toString());
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[var(--color-hover)] flex items-center justify-between text-xs font-mono transition-colors cursor-pointer"
                        >
                          <span className="font-bold text-[var(--color-text)]">{pair.symbol}</span>
                          <span className="text-[10px] text-[var(--color-text-muted)]">{pair.name}</span>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setShowSymbolDropdown(false)}
                        className="w-full text-center py-1 text-[10px] font-mono text-cyan-400 hover:underline cursor-pointer border-t border-[var(--color-border)]"
                      >
                        Tutup Pilihan
                      </button>
                    </div>
                  )}
                </div>

                {/* Condition Selector */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[var(--color-text-muted)]">KONDISI PEMICU (CONDITION)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormCondition('above')}
                      style={formCondition === 'above' ? {
                        backgroundColor: `${palette.bull}20`,
                        borderColor: palette.bull,
                        color: palette.bull
                      } : {}}
                      className={`p-2.5 rounded-xl border text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        formCondition === 'above' 
                          ? 'shadow-md' 
                          : 'bg-[var(--color-input-bg)] border-[var(--color-input-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)]'
                      }`}
                    >
                      <TrendingUp size={14} />
                      <span>≥ Naik Di Atas</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormCondition('below')}
                      style={formCondition === 'below' ? {
                        backgroundColor: `${palette.bear}20`,
                        borderColor: palette.bear,
                        color: palette.bear
                      } : {}}
                      className={`p-2.5 rounded-xl border text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        formCondition === 'below' 
                          ? 'shadow-md' 
                          : 'bg-[var(--color-input-bg)] border-[var(--color-input-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)]'
                      }`}
                    >
                      <TrendingDown size={14} />
                      <span>≤ Turun Di Bawah</span>
                    </button>
                  </div>
                </div>

                {/* Target Price Input */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-mono text-[var(--color-text-muted)]">TARGET HARGA (PRICE TARGET)</label>
                    {livePrices[formSymbol]?.price && (
                      <span className="text-[10px] font-mono" style={{ color: palette.bull }}>
                        Harga Live: <strong>{livePrices[formSymbol].price}</strong>
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    step="any"
                    value={formTargetPrice ?? ''}
                    onChange={(e) => setFormTargetPrice(e.target.value)}
                    placeholder="Contoh: 98000.50"
                    className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-lg px-3 py-2 text-sm font-mono font-bold text-[var(--color-text)] focus:outline-none focus:border-cyan-500"
                    required
                  />

                  {/* Quick percentage calculation pills */}
                  <div className="flex items-center gap-1 pt-1 overflow-x-auto">
                    <span className="text-[10px] font-mono text-[var(--color-text-muted)]">Preset:</span>
                    <button
                      type="button"
                      onClick={() => applyPercentOffset(1)}
                      className="px-2 py-0.5 rounded bg-[var(--color-hover)] hover:bg-[var(--color-panel-header)] text-[10px] font-mono text-emerald-400 transition-colors cursor-pointer border border-[var(--color-border)]"
                    >
                      +1%
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPercentOffset(2.5)}
                      className="px-2 py-0.5 rounded bg-[var(--color-hover)] hover:bg-[var(--color-panel-header)] text-[10px] font-mono text-emerald-400 transition-colors cursor-pointer border border-[var(--color-border)]"
                    >
                      +2.5%
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPercentOffset(5)}
                      className="px-2 py-0.5 rounded bg-[var(--color-hover)] hover:bg-[var(--color-panel-header)] text-[10px] font-mono text-emerald-400 transition-colors cursor-pointer border border-[var(--color-border)]"
                    >
                      +5%
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPercentOffset(-1)}
                      className="px-2 py-0.5 rounded bg-[var(--color-hover)] hover:bg-[var(--color-panel-header)] text-[10px] font-mono text-rose-400 transition-colors cursor-pointer border border-[var(--color-border)]"
                    >
                      -1%
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPercentOffset(-2.5)}
                      className="px-2 py-0.5 rounded bg-[var(--color-hover)] hover:bg-[var(--color-panel-header)] text-[10px] font-mono text-rose-400 transition-colors cursor-pointer border border-[var(--color-border)]"
                    >
                      -2.5%
                    </button>
                  </div>
                </div>

                {/* Label / Custom Note */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[var(--color-text-muted)]">CATATAN / LABEL ALERT (OPSIONAL)</label>
                  <input
                    type="text"
                    value={formLabel ?? ''}
                    onChange={(e) => setFormLabel(e.target.value)}
                    placeholder="Contoh: Take Profit 1 / Entry Support"
                    className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-lg px-3 py-2 text-xs font-sans text-[var(--color-text)] focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Sound alert checkbox */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="soundToggle"
                      checked={Boolean(formSound)}
                      onChange={(e) => setFormSound(e.target.checked)}
                      className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
                    />
                    <label htmlFor="soundToggle" className="text-xs font-mono text-[var(--color-text-muted)] cursor-pointer flex items-center gap-1">
                      <Volume2 size={13} className="text-cyan-400" />
                      Bunyikan Nada Suara Peringatan
                    </label>
                  </div>
                </div>
              </div>

              {/* Submit & Cancel Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  style={{ backgroundColor: palette.bull }}
                  className="flex-1 py-2.5 rounded-xl font-bold text-xs text-black hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check size={14} />
                  <span>{editingAlertId ? 'Simpan Perubahan' : 'Aktifkan Target Alert'}</span>
                </button>

                {editingAlertId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAlertId(null);
                      setFormLabel('');
                      setActiveTab('alerts');
                    }}
                    className="py-2.5 px-4 rounded-xl bg-[var(--color-card)] hover:bg-[var(--color-hover)] text-xs font-mono text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer border border-[var(--color-border)]"
                  >
                    Batal
                  </button>
                )}
              </div>
            </form>
          )}

          {/* TAB 3: TRIGGERED NOTIFICATIONS HISTORY */}
          {activeTab === 'notifications' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-[var(--color-text-muted)] px-1">
                <span>RIWAYAT SINYAL TERCAPAI ({notifications.length})</span>
                {notifications.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={11} /> Hapus Riwayat
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="py-12 text-center text-[var(--color-text-muted)] space-y-3 bg-[var(--color-panel)]/50 border border-[var(--color-border)] rounded-2xl p-6">
                  <div className="w-12 h-12 rounded-full bg-[var(--color-card)] text-[var(--color-text-muted)] flex items-center justify-center mx-auto">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--color-text-muted)]">Belum Ada Sinyal Terpicu</p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">Sinyal notifikasi real-time akan muncul di sini secara otomatis saat target tercapai.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map(notif => (
                    <div 
                      key={notif.id}
                      className="p-3 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl hover:border-cyan-500/40 transition-all space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-xs text-[var(--color-text)]">
                            {notif.symbol}
                          </span>
                          <span 
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                              notif.condition === 'above' 
                                ? 'bg-emerald-500/20 text-emerald-400' 
                                : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {notif.condition === 'above' ? '≥ TERCAPAI' : '≤ TERCAPAI'}
                          </span>
                        </div>
                        <span className="text-[10px] text-[var(--color-text-muted)] font-mono flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(notif.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      <p className="text-xs text-[var(--color-text)] font-medium">
                        {notif.label}
                      </p>

                      <div className="flex items-center justify-between text-[11px] font-mono text-[var(--color-text-muted)] pt-1 border-t border-[var(--color-border)]">
                        <span>Target: <strong className="text-[var(--color-text)]">{notif.targetPrice}</strong></span>
                        <span>Sinyal Exec: <strong className="text-emerald-400">{notif.triggeredPrice}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Bottom Footer Info */}
        <div className="p-3 bg-[var(--color-panel-header)] border-t border-[var(--color-border)] text-[10px] font-mono text-[var(--color-text-muted)] flex items-center justify-between">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Market Stream Active
          </span>
          <span>MountAlgo Alert Engine</span>
        </div>
      </div>
    </>
  );
}
