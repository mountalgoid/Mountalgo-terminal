import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { Position, PendingOrder, BrokerAccount, BrokerType, BrokerAccountType, MultiBracketTP, TradeExecutionFill, MexcNewListingItem, MexcNewListingStats } from '../types';
import { 
  brokerWS, 
  ServerTrailingStopOrder, 
  ServerOCOOrder 
} from '../services/brokerWebSocket';
import { 
  getStoredBrokerState, 
  saveBrokerState,
  getStoredBrokerAccounts,
  saveBrokerAccounts,
  getStoredActiveAccountId,
  saveActiveAccountId,
  DEFAULT_BROKER_ACCOUNTS,
  loadCachedBrokerSymbols,
  saveCachedBrokerSymbols,
  getStoredPositionsCache,
  savePositionsCache,
  getStoredBrokerPositionsCache,
  saveBrokerPositionsCache,
} from '../utils/terminalPersistence';
import { brokerCircuitBreaker } from '../utils/brokerCircuitBreaker';
import { tickBatcher } from '../utils/tickBatcher';
import { tradingAudio } from '../utils/audioSynth';
import { broadcastSync } from '../utils/broadcastSync';
import { captureLayoutSnapshot } from '../utils/snapshot';

export interface VolumePresets {
  forex: number[];
  crypto: number[];
}

export interface HotkeyToast {
  id: string;
  type: 'BUY' | 'SELL' | 'CLOSE' | 'REVERSE' | 'FLATTEN' | 'AUTO_BE' | 'PRESET' | 'ALERT';
  title: string;
  subtitle: string;
  symbol: string;
  timestamp: number;
  latencyMs?: number;
  slippagePips?: number;
}

interface TradeContextType {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  tradeStats: any;
  calcLiquidationPrice: (entryPrice: number, size: number, leverage: number, side: 'BUY' | 'SELL', isForex: boolean) => number;
  positions: Position[];
  pendingOrders: PendingOrder[];
  tradeHistory: any[];
  executionFills: TradeExecutionFill[];
  executeOrder: (orderData: {
    symbol: string;
    type: 'BUY' | 'SELL';
    orderType?: 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT' | 'OCO' | 'TRAILING_STOP' | 'TWAP' | 'VWAP' | 'ICEBERG';
    size: number;
    price: number;
    stopLimitPrice?: number;
    takeProfit?: number;
    stopLoss?: number;
    brackets?: MultiBracketTP;
    leverage?: number;
    marginMode?: 'Cross' | 'Isolated';
    autoBE?: boolean;
    autoBeOffsetPips?: number;
    trailingStep?: number;
    timeInForce?: 'GTC' | 'IOC' | 'FOK' | 'DAY';
    postOnly?: boolean;
    reduceOnly?: boolean;
    algoSettings?: {
      duration: string;
      participationRate: string;
      visibleSize: string;
      randomizeSize: boolean;
      startTime: string;
    };
  }) => void;
  cancelPendingOrder: (id: string) => void;
  cancelAllPendingOrders: (symbol?: string) => void;
  updatePendingOrder: (id: string, price: number, size?: number, takeProfit?: number, stopLoss?: number) => void;
  closePosition: (id: string, closePrice: number, percentage?: number, closeReason?: 'TAKE_PROFIT' | 'STOP_LOSS' | 'MANUAL_CLOSE' | 'REVERSE' | 'FLATTEN' | 'PARTIAL') => void;
  partialClosePosition: (id: string, closeRatio: number) => void;
  reversePosition: (id: string, currentPrice: number) => void;
  closeAllPositions: (symbol?: string) => void;
  toggleAutoBE: (id: string) => void;
  setBreakEvenWithOffset: (id: string, offsetPips?: number) => void;
  scaleInPosition: (id: string, addSize: number) => void;
  updatePositionBracket: (id: string, takeProfit?: number, stopLoss?: number, trailingStep?: number) => void;
  updateMultiBracketTP: (id: string, brackets: MultiBracketTP) => void;
  updateLivePrice: (symbol: string, price: number) => void;
  livePrices: Record<string, number>;
  
  // Focused Chart & Hotkeys Synchronization
  focusedSymbol: string;
  focusedChartId: string;
  setFocusedChart: (chartId: string, symbol: string) => void;
  volumePresets: VolumePresets;
  setVolumePresets: (presets: VolumePresets) => void;
  activePresetIndex: number;
  setActivePresetIndex: (index: number) => void;
  hotkeysEnabled: boolean;
  setHotkeysEnabled: (enabled: boolean) => void;
  hotkeyMode: 'shift' | 'single';
  setHotkeyMode: (mode: 'shift' | 'single') => void;
  hotkeyAudioEnabled: boolean;
  setHotkeyAudioEnabled: (enabled: boolean) => void;
  isHotkeyModalOpen: boolean;
  setIsHotkeyModalOpen: (open: boolean) => void;
  hotkeyToast: HotkeyToast | null;

  // Instant Trade Toggle (Floating Bar)
  isInstantTradeEnabled: boolean;
  setIsInstantTradeEnabled: (enabled: boolean) => void;
  dismissHotkeyToast: () => void;
  quickTradeAction: (action: 'BUY' | 'SELL' | 'CLOSE' | 'REVERSE' | 'FLATTEN' | 'AUTO_BE', targetSymbol?: string, targetPrice?: number) => void;

  // Real Broker & Multi-Account Management
  connectedAccounts: BrokerAccount[];
  activeAccountId: string;
  activeAccount: BrokerAccount;
  isAccountModalOpen: boolean;
  setIsAccountModalOpen: (open: boolean) => void;
  connectAccount: (accountData: Omit<BrokerAccount, 'id' | 'createdAt'>) => BrokerAccount;
  updateAccount: (id: string, updates: Partial<BrokerAccount>) => void;
  deleteAccount: (id: string) => void;
  switchActiveAccount: (id: string) => void;
  refreshAccountData: (id: string) => Promise<void>;
  resetAccountBalance: (id: string, newBalance: number) => void;
  autoRefreshIntervalSec: number;
  setAutoRefreshIntervalSec: (interval: number) => void;

  // Chart Synchronization (Multi-chart sync for Symbol, Timeframe, & Crosshair)
  chartSyncSymbol: boolean;
  setChartSyncSymbol: (enabled: boolean) => void;
  chartSyncTimeframe: boolean;
  setChartSyncTimeframe: (enabled: boolean) => void;
  chartSyncCrosshair: boolean;
  setChartSyncCrosshair: (enabled: boolean) => void;
  globalCrosshair: { active: boolean; time: number; price?: number; sourceChartId?: string } | null;
  setGlobalCrosshair: (data: { active: boolean; time: number; price?: number; sourceChartId?: string } | null) => void;
  syncedGlobalSymbol: string | null;
  broadcastSymbolChange: (newSymbol: string) => void;
  syncedGlobalTimeframe: string | null;
  broadcastTimeframeChange: (newTf: string) => void;

  // Broker-Synced Trade History & Positions (from broker API, not just terminal trades)
  brokerSyncedTrades: Record<string, any[]>; // keyed by accountId
  brokerOpenPositions: Record<string, any[]>; // keyed by accountId
  isSyncingBroker: Record<string, boolean>; // keyed by accountId
  brokerSymbols: Record<string, { symbol: string; base: string; quote: string; type: string }[]>; // keyed by broker name

  // Trade Journal & Analytics Modal
  isJournalModalOpen: boolean;
  setIsJournalModalOpen: (open: boolean) => void;

  // Jump to Chart Target Execution Time
  chartJumpTarget: { symbol: string; timestamp: number; id: string } | null;
  jumpToChartTarget: (symbol: string, timestamp?: number) => void;
  clearChartJumpTarget: () => void;

  // Server-Side Engine & WebSocket Stream
  serverTrailingStops: ServerTrailingStopOrder[];
  serverOCOs: ServerOCOOrder[];
  wsStatus: 'CONNECTED' | 'DISCONNECTED';
  createTrailingStopOnServer: (params: {
    symbol: string;
    side: 'BUY' | 'SELL';
    quantity: number;
    entryPrice: number;
    callbackRate?: number;
    trailAmount?: number;
    activationPrice?: number;
  }) => Promise<void>;
  createOCOOnServer: (params: {
    symbol: string;
    side: 'BUY' | 'SELL';
    quantity: number;
    entryPrice: number;
    takeProfitPrice: number;
    stopLossPrice: number;
  }) => Promise<void>;
  cancelServerOrderById: (id: string) => Promise<void>;

  // MEXC & Multi-Broker Real-Time Asset Universe
  mexcSyncStatus: {
    total: number;
    lastSyncedAt: number;
    isLoading: boolean;
    authenticated: boolean;
    error?: string | null;
  };
  mexcNewListings: MexcNewListingItem[];
  mexcNewListingStats: MexcNewListingStats;
  newListingState: {
    listings: MexcNewListingItem[];
    stats: MexcNewListingStats;
  };
  newListingToast: MexcNewListingItem | null;
  dismissNewListingToast: () => void;
  scanMexcNewListingsNow: () => Promise<void>;
  refreshBrokerSymbols: (brokerName?: string, forceRefresh?: boolean) => Promise<void>;
  instantSnipeListing: (coin: MexcNewListingItem, customUsdAlloc?: number) => Promise<void>;
}

const TradeContext = createContext<TradeContextType | undefined>(undefined);

export function TradeProvider({ children }: { children: ReactNode }) {
  // 1. Broker Accounts Management State
  const [connectedAccounts, setConnectedAccounts] = useState<BrokerAccount[]>(() => {
    return getStoredBrokerAccounts();
  });

  const [activeAccountId, setActiveAccountId] = useState<string>(() => {
    const stored = getStoredActiveAccountId();
    const accounts = getStoredBrokerAccounts();
    const exists = accounts.some(a => a.id === stored);
    return exists ? stored : accounts[0]?.id || DEFAULT_BROKER_ACCOUNTS[0].id;
  });

  // Stable references to prevent cascading effect recalculations
  const connectedAccountsRef = useRef(connectedAccounts);
  useEffect(() => {
    connectedAccountsRef.current = connectedAccounts;
  }, [connectedAccounts]);

  const activeAccountIdRef = useRef(activeAccountId);
  useEffect(() => {
    activeAccountIdRef.current = activeAccountId;
  }, [activeAccountId]);

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  // Active account resolution
  const activeAccount = connectedAccounts.find(a => a.id === activeAccountId) || connectedAccounts[0] || DEFAULT_BROKER_ACCOUNTS[0];

  // Server-Side Engine & WebSocket Stream State
  const [serverTrailingStops, setServerTrailingStops] = useState<ServerTrailingStopOrder[]>([]);
  const [serverOCOs, setServerOCOs] = useState<ServerOCOOrder[]>([]);
  const [wsStatus, setWsStatus] = useState<'CONNECTED' | 'DISCONNECTED'>('DISCONNECTED');

  useEffect(() => {
    const unsubscribe = brokerWS.subscribe((data) => {
      if (data.type === 'WS_STATUS') {
        setWsStatus(data.status);
      } else if (data.type === 'SERVER_ORDERS_INIT') {
        setServerTrailingStops(data.trailingStops || []);
        setServerOCOs(data.ocoOrders || []);
      } else if (data.type === 'SERVER_ORDER_CREATED') {
        if (data.orderType === 'TRAILING_STOP') {
          setServerTrailingStops(prev => [...prev.filter(o => o.id !== data.order.id), data.order]);
        } else if (data.orderType === 'OCO') {
          setServerOCOs(prev => [...prev.filter(o => o.id !== data.order.id), data.order]);
        }
      } else if (data.type === 'TRAILING_STOP_TRIGGERED') {
        setServerTrailingStops(prev => prev.filter(o => o.id !== data.order.id));
        tradingAudio.play('ORDER_FILLED');
        setHotkeyToast({
          id: `ts_${Date.now()}`,
          type: 'CLOSE',
          title: '⚡ TRAILING STOP SERVER EXECUTED',
          subtitle: `Posisi ${data.order.symbol} ditutup otomatis di $${data.closePrice}`,
          symbol: data.order.symbol,
          timestamp: Date.now(),
        });
        refreshAccountData(activeAccountId);
      } else if (data.type === 'OCO_ORDER_TRIGGERED') {
        setServerOCOs(prev => prev.filter(o => o.id !== data.order.id));
        tradingAudio.play('ORDER_FILLED');
        setHotkeyToast({
          id: `oco_${Date.now()}`,
          type: 'CLOSE',
          title: `🎯 OCO ${data.filledType === 'TP_FILLED' ? 'TAKE PROFIT' : 'STOP LOSS'} EXECUTED`,
          subtitle: `Order ${data.order.symbol} dieksekusi di $${data.closePrice}`,
          symbol: data.order.symbol,
          timestamp: Date.now(),
        });
        refreshAccountData(activeAccountId);
      } else if (data.type === 'SERVER_ORDER_CANCELLED') {
        setServerTrailingStops(prev => prev.filter(o => o.id !== data.id));
        setServerOCOs(prev => prev.filter(o => o.id !== data.id));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [activeAccountId]);

  const createTrailingStopOnServer = useCallback(async (params: {
    symbol: string;
    side: 'BUY' | 'SELL';
    quantity: number;
    entryPrice: number;
    callbackRate?: number;
    trailAmount?: number;
    activationPrice?: number;
  }) => {
    const res = await brokerWS.createTrailingStop({
      broker: activeAccount?.broker || 'BINANCE',
      apiKey: activeAccount?.apiKey,
      secret: activeAccount?.apiSecret,
      accountType: activeAccount?.accountType,
      isTestnet: activeAccount?.isTestnet,
      ...params,
    });
    if (res.success) {
      tradingAudio.play('PRESET');
      setHotkeyToast({
        id: `ts_add_${Date.now()}`,
        type: 'PRESET',
        title: '⚡ TRAILING STOP SERVER DIBUAT',
        subtitle: `${params.side} ${params.quantity} ${params.symbol} | Trail Rate: ${params.callbackRate || 1.0}%`,
        symbol: params.symbol,
        timestamp: Date.now(),
      });
    } else {
      tradingAudio.play('ERROR');
      alert(`Gagal membuat Server Trailing Stop: ${res.error}`);
    }
  }, [activeAccount]);

  const createOCOOnServer = useCallback(async (params: {
    symbol: string;
    side: 'BUY' | 'SELL';
    quantity: number;
    entryPrice: number;
    takeProfitPrice: number;
    stopLossPrice: number;
  }) => {
    const res = await brokerWS.createOCO({
      broker: activeAccount?.broker || 'BINANCE',
      apiKey: activeAccount?.apiKey,
      secret: activeAccount?.apiSecret,
      accountType: activeAccount?.accountType,
      isTestnet: activeAccount?.isTestnet,
      ...params,
    });
    if (res.success) {
      tradingAudio.play('PRESET');
      setHotkeyToast({
        id: `oco_add_${Date.now()}`,
        type: 'PRESET',
        title: '🎯 OCO BRACKET SERVER DIBUAT',
        subtitle: `TP: $${params.takeProfitPrice} | SL: $${params.stopLossPrice}`,
        symbol: params.symbol,
        timestamp: Date.now(),
      });
    } else {
      tradingAudio.play('ERROR');
      alert(`Gagal membuat Server OCO Bracket: ${res.error}`);
    }
  }, [activeAccount]);

  const cancelServerOrderById = useCallback(async (id: string) => {
    const res = await brokerWS.cancelServerOrder(id);
    if (res.success) {
      tradingAudio.play('ORDER_CANCELLED');
    }
  }, []);

  const savedState = getStoredBrokerState();
  const [balance, setBalance] = useState<number>(() => {
    return activeAccount ? activeAccount.balance : (savedState?.balance ?? 10000.00);
  });
  
  // Ensure uniqueness from localStorage & optimistic cache to prevent React key errors
  // Positions persist indefinitely until manually closed or auto-closed by TP/SL
  const initialPositions = savedState?.positions?.length ? savedState.positions : getStoredPositionsCache();
  const uniquePositions = (() => {
    const seen = new Set();
    return initialPositions.filter((v: any) => {
      if (seen.has(v.id)) return false;
      seen.add(v.id);
      return true;
    });
  })();
  const [positions, setPositions] = useState<Position[]>(uniquePositions);

  const positionsRef = useRef(positions);
  useEffect(() => {
    positionsRef.current = positions;
    savePositionsCache(positions);
  }, [positions]);

  const initialPending = savedState?.pendingOrders ?? [];
  const uniquePending = (() => {
    const seen = new Set();
    return initialPending.filter((v: any) => {
      if (seen.has(v.id)) return false;
      seen.add(v.id);
      return true;
    });
  })();
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>(uniquePending);

  const initialHistory = savedState?.tradeHistory ?? [];
  const uniqueHistory = (() => {
    const seen = new Set();
    return initialHistory.filter((v: any) => {
      if (seen.has(v.id)) return false;
      seen.add(v.id);
      return true;
    });
  })();
  const [tradeHistory, setTradeHistory] = useState<any[]>(uniqueHistory);

  const [executionFills, setExecutionFills] = useState<TradeExecutionFill[]>([]);

  // Broker-synced data (trades, positions, and symbols fetched from broker API)
  const [brokerSyncedTrades, setBrokerSyncedTrades] = useState<Record<string, any[]>>({});
  const [brokerOpenPositions, setBrokerOpenPositions] = useState<Record<string, any[]>>(() => {
    return getStoredBrokerPositionsCache();
  });
  const [isSyncingBroker, setIsSyncingBroker] = useState<Record<string, boolean>>({});

  // Persist broker open positions cache
  useEffect(() => {
    saveBrokerPositionsCache(brokerOpenPositions);
  }, [brokerOpenPositions]);
  
  // Local 12h Cache for instant (<5ms) symbols hydration
  const [brokerSymbols, setBrokerSymbols] = useState<Record<string, { symbol: string; base: string; quote: string; type: string }[]>>(() => {
    const cached = loadCachedBrokerSymbols();
    return cached.data || {};
  });
  
  // Real-Time MEXC Asset Universe & Sync Status
  const [mexcSyncStatus, setMexcSyncStatus] = useState<{
    total: number;
    lastSyncedAt: number;
    isLoading: boolean;
    authenticated: boolean;
    error?: string | null;
  }>(() => {
    const cached = loadCachedBrokerSymbols();
    const mexcList = cached.data['MEXC'] || cached.data['mexc'] || [];
    return {
      total: mexcList.length || cached.total || 0,
      lastSyncedAt: cached.isFresh ? Date.now() : 0,
      isLoading: false,
      authenticated: false,
      error: null,
    };
  });

  const [mexcNewListings, setMexcNewListings] = useState<MexcNewListingItem[]>([]);
  const [mexcNewListingStats, setMexcNewListingStats] = useState<MexcNewListingStats>({
    totalNew: 0,
    new1m: 0,
    new5m: 0,
    new1h: 0,
    new24h: 0,
    lastDiscovery: null,
  });
  const [newListingToast, setNewListingToast] = useState<MexcNewListingItem | null>(null);
  const seenListingSymbolsRef = useRef<Set<string>>(new Set());
  const isListingPollerInitializedRef = useRef<boolean>(false);

  const dismissNewListingToast = useCallback(() => {
    setNewListingToast(null);
  }, []);

  const refreshBrokerSymbols = useCallback(async (brokerName = 'mexc', forceRefresh = false) => {
    const targetBroker = brokerName.toLowerCase();
    
    // Find active account for this broker if available from stable ref
    const accounts = connectedAccountsRef.current;
    const matchedAccount = accounts.find(
      a => a.broker.toLowerCase() === targetBroker && a.apiKey
    ) || accounts.find(a => a.broker.toLowerCase() === targetBroker);

    if (targetBroker === 'mexc') {
      setMexcSyncStatus(prev => ({ ...prev, isLoading: true, error: null }));
    }

    try {
      const res = await fetch('/api/broker/symbols', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          broker: targetBroker,
          apiKey: matchedAccount?.apiKey,
          secret: matchedAccount?.apiSecret,
          accountType: matchedAccount?.accountType || 'ALL',
          forceRefresh,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.symbols) && data.symbols.length > 0) {
          setBrokerSymbols(prev => {
            const next = {
              ...prev,
              [data.broker]: data.symbols,
              [targetBroker]: data.symbols,
              [targetBroker.toUpperCase()]: data.symbols,
              'MEXC': targetBroker === 'mexc' ? data.symbols : (prev['MEXC'] || []),
            };
            saveCachedBrokerSymbols(next, data.total || data.symbols.length);
            return next;
          });

          if (targetBroker === 'mexc') {
            setMexcSyncStatus({
              total: data.total || data.symbols.length,
              lastSyncedAt: Date.now(),
              isLoading: false,
              authenticated: !!data.authenticated,
              error: null,
            });

            if (data.newListingStats) {
              setMexcNewListingStats(data.newListingStats);
            }
          }
          return;
        }
      }
      if (targetBroker === 'mexc') {
        setMexcSyncStatus(prev => ({ ...prev, isLoading: false, error: null }));
      }
    } catch {
      if (targetBroker === 'mexc') {
        setMexcSyncStatus(prev => ({ ...prev, isLoading: false, error: null }));
      }
    }
  }, []);

  // Super Smart Real-Time Multi-Broker Listing Poller & Delta Alert Engine (< 1 minute detection)
  const pollMexcNewListings = useCallback(async () => {
    try {
      const res = await fetch('/api/broker/new-listings?broker=all');
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && Array.isArray(json.listings)) {
          const freshList: MexcNewListingItem[] = json.listings;
          setMexcNewListings(freshList);
          setMexcNewListingStats({
            totalNew: json.total || freshList.length,
            new1m: json.new1mCount || 0,
            new5m: json.new5mCount || 0,
            new1h: json.new1hCount || 0,
            new24h: json.new24hCount || 0,
            lastDiscovery: json.latestDiscovery || freshList[0] || null,
          });

          if (!isListingPollerInitializedRef.current) {
            // First run on session load: mark current listing set as seen without popping old alerts
            freshList.forEach((coin) => {
              const uniqueKey = `${coin.broker || 'mexc'}-${coin.symbol}`;
              seenListingSymbolsRef.current.add(uniqueKey);
              seenListingSymbolsRef.current.add(coin.symbol);
            });
            isListingPollerInitializedRef.current = true;
          } else {
            // Subsequent polls: trigger alert ONLY for genuinely new coins released during active session
            let newlyDetected: MexcNewListingItem | null = null;
            freshList.forEach((coin) => {
              const uniqueKey = `${coin.broker || 'mexc'}-${coin.symbol}`;
              if (!seenListingSymbolsRef.current.has(uniqueKey) && !seenListingSymbolsRef.current.has(coin.symbol)) {
                seenListingSymbolsRef.current.add(uniqueKey);
                seenListingSymbolsRef.current.add(coin.symbol);
                if ((coin.isNew1m || coin.isNew5m) && (Date.now() - coin.firstSeenAt < 300000)) {
                  newlyDetected = coin;
                }
              }
            });

            if (newlyDetected) {
              setNewListingToast(newlyDetected);
              try {
                tradingAudio.play('SNIPER_ALERT');
              } catch {}
              // Automatically refresh symbols catalog so it's immediately tradeable
              refreshBrokerSymbols('mexc', true);
              refreshBrokerSymbols('binance', true);
              refreshBrokerSymbols('bybit', true);
            }
          }
        }
      }
    } catch {}
  }, [refreshBrokerSymbols]);

  const scanMexcNewListingsNow = useCallback(async () => {
    setMexcSyncStatus(prev => ({ ...prev, isLoading: true }));
    try {
      await fetch('/api/mexc/scan-now', { method: 'POST' });
      await pollMexcNewListings();
      await refreshBrokerSymbols('mexc', true);
    } catch {
      setMexcSyncStatus(prev => ({ ...prev, isLoading: false }));
    }
  }, [pollMexcNewListings, refreshBrokerSymbols]);

  // Initial load and ultra-fast 20s polling for new listings (< 1 min detection guaranteed)
  useEffect(() => {
    refreshBrokerSymbols('mexc');
    pollMexcNewListings();

    const fastListingInterval = setInterval(() => {
      pollMexcNewListings();
    }, 15000); // Check new listings every 15 seconds!

    const catalogRefreshInterval = setInterval(() => {
      refreshBrokerSymbols('mexc', false);
    }, 45000); // Full refresh every 45 seconds

    return () => {
      clearInterval(fastListingInterval);
      clearInterval(catalogRefreshInterval);
    };
  }, [refreshBrokerSymbols, pollMexcNewListings]);

  const [livePrices, setLivePrices] = useState<Record<string, number>>(() => tickBatcher.getAllPrices());

  // Subscribe to 60fps RAF batched ticks from tickBatcher
  useEffect(() => {
    const unsubscribe = tickBatcher.subscribe((batch) => {
      setLivePrices(prev => {
        let hasDiff = false;
        for (const sym in batch) {
          if (prev[sym] !== batch[sym]) {
            hasDiff = true;
            break;
          }
        }
        if (!hasDiff) return prev;
        return { ...prev, ...batch };
      });
    });
    return unsubscribe;
  }, []);

  // Auto-sync active account balance when changed
  useEffect(() => {
    setConnectedAccounts(prev => {
      let hasChange = false;
      const updated = prev.map(acc => {
        if (acc.id === activeAccountId) {
          const newEquity = balance + positions.reduce((sum, pos) => sum + (pos.pnl || 0), 0);
          if (acc.balance !== balance || Math.abs((acc.equity || 0) - newEquity) > 0.01) {
            hasChange = true;
            return { ...acc, balance, equity: newEquity, lastSyncedAt: Date.now() };
          }
        }
        return acc;
      });
      if (hasChange) {
        saveBrokerAccounts(updated);
        return updated;
      }
      return prev;
    });
  }, [balance, activeAccountId, positions]);

  // Startup reconciliation: auto-sync connected broker accounts to validate positions
  useEffect(() => {
    const connectedWithKeys = connectedAccounts.filter(a => a.apiKey && a.apiSecret && (a.broker === 'BINANCE' || a.broker === 'MEXC' || a.broker === 'BYBIT'));
    connectedWithKeys.forEach(acc => {
      // Delay initial sync by 3s to let app render first
      setTimeout(() => {
        refreshAccountData(acc.id);
      }, 3000);
    });
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Connect new Broker Account
  const connectAccount = useCallback((accountData: Omit<BrokerAccount, 'id' | 'createdAt'>): BrokerAccount => {
    const newAcc: BrokerAccount = {
      ...accountData,
      id: `acc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      createdAt: Date.now(),
      lastSyncedAt: Date.now(),
      status: 'CONNECTED',
    };

    setConnectedAccounts(prev => {
      const next = [...prev, newAcc];
      saveBrokerAccounts(next);
      return next;
    });

    // Auto-switch to newly connected account
    setActiveAccountId(newAcc.id);
    saveActiveAccountId(newAcc.id);
    setBalance(newAcc.balance);

    return newAcc;
  }, []);

  // Update existing Account
  const updateAccount = useCallback((id: string, updates: Partial<BrokerAccount>) => {
    // If API keys or broker parameters are updated, reset circuit breaker
    if (updates.apiKey || updates.apiSecret || updates.broker) {
      brokerCircuitBreaker.resetCircuit(id);
    }

    setConnectedAccounts(prev => {
      const next = prev.map(acc => acc.id === id ? { ...acc, ...updates, lastSyncedAt: Date.now() } : acc);
      saveBrokerAccounts(next);
      return next;
    });
  }, []);

  // Delete Account
  const deleteAccount = useCallback((id: string) => {
    setConnectedAccounts(prev => {
      if (prev.length <= 1) {
        // Always keep at least 1 account (reset to default demo if deleting last)
        const fallback = DEFAULT_BROKER_ACCOUNTS;
        saveBrokerAccounts(fallback);
        setActiveAccountId(fallback[0].id);
        saveActiveAccountId(fallback[0].id);
        setBalance(fallback[0].balance);
        return fallback;
      }

      const next = prev.filter(acc => acc.id !== id);
      saveBrokerAccounts(next);

      if (activeAccountId === id) {
        const nextActive = next[0].id;
        setActiveAccountId(nextActive);
        saveActiveAccountId(nextActive);
        setBalance(next[0].balance);
      }
      return next;
    });
  }, [activeAccountId]);

  // Switch Active Account
  const switchActiveAccount = useCallback((id: string) => {
    const target = connectedAccounts.find(a => a.id === id);
    if (!target) return;

    setActiveAccountId(id);
    saveActiveAccountId(id);
    setBalance(target.balance);
    
    setHotkeyToast({
      id: Math.random().toString(),
      type: 'ALERT',
      title: `AKUN BERHASIL DIGANTI`,
      subtitle: `${target.name} (${target.broker} ${target.isReal ? 'REAL' : 'DEMO'}) - Saldo: ${target.currency} ${target.balance.toLocaleString()}`,
      symbol: target.broker,
      timestamp: Date.now()
    });
  }, [connectedAccounts]);

  // Auto-Refresh Interval State (5s, 10s, 30s, or 0 = Manual)
  const [autoRefreshIntervalSec, setAutoRefreshIntervalSecState] = useState<number>(() => {
    const saved = localStorage.getItem('mountalgo_auto_refresh_sec');
    return saved !== null ? Number(saved) : 10;
  });

  const setAutoRefreshIntervalSec = useCallback((sec: number) => {
    setAutoRefreshIntervalSecState(sec);
    localStorage.setItem('mountalgo_auto_refresh_sec', String(sec));
  }, []);

  // Refresh Account Data & Latency Ping with Circuit Breaker Protection
  const refreshAccountData = useCallback(async (id: string) => {
    // Check Circuit Breaker status to prevent rate-limit bans or API hammering
    const circuitCheck = brokerCircuitBreaker.canAttemptSync(id);
    if (!circuitCheck.allowed) {
      setConnectedAccounts(prev => {
        const next = prev.map(a => a.id === id ? { 
          ...a, 
          status: 'ERROR' as const, 
          lastSyncError: circuitCheck.reason || 'Circuit Breaker Cooldown Aktif' 
        } : a);
        saveBrokerAccounts(next);
        return next;
      });
      return;
    }

    // Prevent re-triggering if already CONNECTING
    const currentAcc = connectedAccountsRef.current.find(a => a.id === id);
    if (currentAcc?.status === 'CONNECTING') return;

    // Set status to CONNECTING for visual spinner feedback
    setConnectedAccounts(prev => prev.map(acc => acc.id === id ? { ...acc, status: 'CONNECTING' as const } : acc));

    // Retrieve target account safely from stable ref
    const currentAccounts = connectedAccountsRef.current;
    let acc = currentAccounts.find(a => a.id === id);
    if (!acc) {
      setConnectedAccounts(prev => prev.map(a => a.id === id ? { ...a, status: 'CONNECTED' as const } : a));
      return;
    }

    const startTime = Date.now();

    // If account has API key and secret, try real broker sync
    if (acc.apiKey && acc.apiSecret) {
      try {
        const res = await fetch('/api/broker/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            broker: acc.broker.toLowerCase(),
            apiKey: acc.apiKey,
            secret: acc.apiSecret,
            accountType: acc.accountType,
            isTestnet: acc.isTestnet,
          }),
        });
        const pingMs = Date.now() - startTime;

        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            // Record successful response to close circuit & reset backoff
            brokerCircuitBreaker.recordSyncSuccess(id);

            const freshBalance = Number(data.totalBalanceUSD || acc.balance || 0);

            setConnectedAccounts(prev => {
              const next = prev.map(a => {
                if (a.id === id) {
                  return {
                    ...a,
                    status: 'CONNECTED' as const,
                    balance: freshBalance,
                    equity: freshBalance,
                    pingMs,
                    lastSyncedAt: Date.now(),
                    lastSyncError: undefined,
                  };
                }
                return a;
              });
              saveBrokerAccounts(next);
              return next;
            });

            if (activeAccountIdRef.current === id) {
              setBalance(freshBalance);
            }

            // Store broker-synced open positions
            if (data.positions && Array.isArray(data.positions)) {
              if (data.positions.length > 0) {
                const normalizeSymbol = (s: string) => s.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                const brokerPositionMap = new Map<string, any>(data.positions.map((p: any) => [normalizeSymbol(p.symbol), p]));
                
                setPositions(prev => {
                  const accountPositions = prev.filter(p => p.accountId === id);
                  const otherPositions = prev.filter(p => p.accountId !== id);
                  
                  const merged = accountPositions.map(pos => {
                    const brokerMatch = brokerPositionMap.get(normalizeSymbol(pos.symbol));
                    if (brokerMatch) {
                      return {
                        ...pos,
                        currentPrice: brokerMatch.markPrice || brokerMatch.lastPrice || brokerMatch.currentPrice || pos.currentPrice,
                        pnl: brokerMatch.unrealizedPnl || brokerMatch.pnl || pos.pnl,
                        size: Math.abs(brokerMatch.contracts || brokerMatch.amount || pos.size),
                        leverage: brokerMatch.leverage || pos.leverage,
                      };
                    }
                    return pos;
                  });
                  
                  const terminalSymbols = new Set(accountPositions.map(p => normalizeSymbol(p.symbol)));
                  const newBrokerPositions = data.positions
                    .filter((p: any) => !terminalSymbols.has(normalizeSymbol(p.symbol)))
                    .map((p: any) => ({
                      id: `broker_${normalizeSymbol(p.symbol)}_${Date.now()}`,
                      symbol: p.symbol,
                      type: ((p.side || 'long').toUpperCase() === 'LONG' || (p.side || '').toUpperCase() === 'BUY') ? 'BUY' : 'SELL' as const,
                      size: Math.abs(p.contracts || p.amount || 0),
                      entryPrice: p.entryPrice || p.average || 0,
                      currentPrice: p.markPrice || p.lastPrice || p.currentPrice || 0,
                      pnl: p.unrealizedPnl || p.pnl || 0,
                      leverage: p.leverage || 1,
                      marginMode: (p.marginMode || 'Cross') as 'Cross' | 'Isolated',
                      timestamp: p.timestamp || Date.now(),
                      accountId: id,
                    }));
                  
                  return [...otherPositions, ...merged, ...newBrokerPositions];
                });
              }

              setBrokerOpenPositions(prev => ({
                ...prev,
                [id]: data.positions.map((p: any) => {
                  const normalizeSym = (s: string) => s.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                  const existingBroker = (prev[id] || []).find(
                    (ep: any) => normalizeSym(ep.symbol) === normalizeSym(p.symbol)
                  );
                  const currentPositions = positionsRef.current;
                  const terminalMatch = currentPositions.find(
                    (tp: any) => normalizeSym(tp.symbol) === normalizeSym(p.symbol) && tp.accountId === id
                  );
                  return {
                    id: existingBroker?.id || `broker_${normalizeSym(p.symbol)}_${Date.now()}`,
                    symbol: p.symbol,
                    type: ((p.side || 'long').toUpperCase() === 'LONG' || (p.side || '').toUpperCase() === 'BUY') ? 'BUY' : 'SELL',
                    size: Math.abs(p.contracts || p.amount || 0),
                    entryPrice: p.entryPrice || p.average || 0,
                    currentPrice: p.markPrice || p.lastPrice || p.currentPrice || 0,
                    pnl: p.unrealizedPnl || p.pnl || 0,
                    leverage: p.leverage || 1,
                    marginMode: p.marginMode || 'Cross',
                    timestamp: p.timestamp || Date.now(),
                    accountId: id,
                    source: 'BROKER_API',
                    takeProfit: terminalMatch?.takeProfit || existingBroker?.takeProfit,
                    stopLoss: terminalMatch?.stopLoss || existingBroker?.stopLoss,
                    trailingStep: terminalMatch?.trailingStep || existingBroker?.trailingStep,
                    autoBE: terminalMatch?.autoBE || existingBroker?.autoBE,
                    brackets: terminalMatch?.brackets || existingBroker?.brackets,
                  };
                }),
              }));
            }

            // Fetch broker symbols in background with forced refresh
            fetch('/api/broker/symbols', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                broker: acc.broker.toLowerCase(),
                apiKey: acc.apiKey,
                secret: acc.apiSecret,
                accountType: acc.accountType,
                forceRefresh: true,
              }),
            }).then(sRes => sRes.json()).then(sData => {
              if (sData.success && sData.symbols) {
                setBrokerSymbols(prev => ({
                  ...prev,
                  [acc.broker]: sData.symbols,
                  [acc.broker.toUpperCase()]: sData.symbols,
                  [acc.broker.toLowerCase()]: sData.symbols,
                  'MEXC': acc.broker.toUpperCase() === 'MEXC' ? sData.symbols : (prev['MEXC'] || []),
                }));
                if (acc.broker.toUpperCase() === 'MEXC') {
                  setMexcSyncStatus({
                    total: sData.total || sData.symbols.length,
                    lastSyncedAt: Date.now(),
                    isLoading: false,
                    authenticated: !!sData.authenticated,
                    error: null,
                  });
                }
              }
            }).catch(() => {});

            return;
          } else {
            const rawErr = data.error || 'Autentikasi/Koneksi Gagal';
            const cb = brokerCircuitBreaker.recordSyncFailure(id, rawErr);
            const displayError = cb.isTripped 
              ? `⚡ Circuit Breaker Aktif (Cooldown ${cb.nextRetrySec}s): ${rawErr}` 
              : rawErr;

            setConnectedAccounts(prev => {
              const next = prev.map(a => a.id === id ? { ...a, status: 'ERROR' as const, lastSyncError: displayError } : a);
              saveBrokerAccounts(next);
              return next;
            });
            return;
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          const rawErr = errData.error || `HTTP ${res.status}`;
          const cb = brokerCircuitBreaker.recordSyncFailure(id, rawErr);
          const displayError = cb.isTripped 
            ? `⚡ Circuit Breaker Aktif (Cooldown ${cb.nextRetrySec}s): ${rawErr}` 
            : rawErr;

          setConnectedAccounts(prev => {
            const next = prev.map(a => a.id === id ? { ...a, status: 'ERROR' as const, lastSyncError: displayError } : a);
            saveBrokerAccounts(next);
            return next;
          });
          return;
        }
      } catch (err: any) {
        console.warn('Real broker sync error:', err);
        const rawErr = err.message || 'Koneksi Terputus';
        const cb = brokerCircuitBreaker.recordSyncFailure(id, rawErr);
        const displayError = cb.isTripped 
          ? `⚡ Circuit Breaker Aktif (Cooldown ${cb.nextRetrySec}s): ${rawErr}` 
          : rawErr;

        setConnectedAccounts(prev => {
          const next = prev.map(a => a.id === id ? { ...a, status: 'ERROR' as const, lastSyncError: displayError } : a);
          saveBrokerAccounts(next);
          return next;
        });
        return;
      }
    }

    // Fallback: simulated ping for demo/offline accounts or error fallback
    await new Promise(r => setTimeout(r, 250));
    const simulatedPing = Math.floor(10 + Math.random() * 25);
    setConnectedAccounts(prev => {
      const next = prev.map(a => {
        if (a.id === id) {
          return {
            ...a,
            status: 'CONNECTED' as const,
            pingMs: simulatedPing,
            lastSyncedAt: Date.now(),
          };
        }
        return a;
      });
      saveBrokerAccounts(next);
      return next;
    });
  }, []);

  // Periodic Auto-Sync Timer for Real Accounts (Protected by Circuit Breaker)
  useEffect(() => {
    if (autoRefreshIntervalSec <= 0) return;
    const timer = setInterval(() => {
      connectedAccountsRef.current.forEach(acc => {
        // Only periodically poll active or connected accounts; do not loop-hammer accounts with invalid keys or active errors
        if (acc.isReal && acc.apiKey && acc.apiSecret && acc.status !== 'ERROR' && acc.status !== 'CONNECTING') {
          const check = brokerCircuitBreaker.canAttemptSync(acc.id);
          if (check.allowed) {
            refreshAccountData(acc.id);
          }
        }
      });
    }, autoRefreshIntervalSec * 1000);
    return () => clearInterval(timer);
  }, [autoRefreshIntervalSec, refreshAccountData]);

  // Auto-sync broker data when active account changes (if it has API keys)
  const prevActiveAccountIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevActiveAccountIdRef.current === activeAccountId) return;
    prevActiveAccountIdRef.current = activeAccountId;

    const acc = connectedAccountsRef.current.find(a => a.id === activeAccountId);
    if (acc && acc.apiKey && acc.apiSecret && acc.status !== 'CONNECTED' && acc.status !== 'CONNECTING') {
      refreshAccountData(activeAccountId);
    }
  }, [activeAccountId, refreshAccountData]);

  // Reset Account Balance (useful for Demo / Paper accounts)
  const resetAccountBalance = useCallback((id: string, newBalance: number) => {
    setConnectedAccounts(prev => {
      const next = prev.map(acc => {
        if (acc.id === id) {
          return {
            ...acc,
            balance: newBalance,
            equity: newBalance,
            lastSyncedAt: Date.now()
          };
        }
        return acc;
      });
      saveBrokerAccounts(next);
      return next;
    });
    if (activeAccountId === id) {
      setBalance(newBalance);
    }
  }, [activeAccountId]);

  // Focused Chart state for synchronized Hotkey execution
  const [focusedSymbol, setFocusedSymbol] = useState<string>(() => {
    return localStorage.getItem('mountalgo_focused_symbol') || 'BTCUSDT';
  });
  const [focusedChartId, setFocusedChartId] = useState<string>('chart1');

  // Volume Presets (Forex lots vs Crypto contracts)
  const [volumePresets, setVolumePresetsState] = useState<VolumePresets>(() => {
    try {
      const stored = localStorage.getItem('mountalgo_vol_presets');
      if (stored) return JSON.parse(stored);
    } catch {}
    return {
      forex: [0.01, 0.05, 0.10, 0.50, 1.00],
      crypto: [10, 50, 100, 500, 1000]
    };
  });

  const setVolumePresets = useCallback((presets: VolumePresets) => {
    setVolumePresetsState(presets);
    localStorage.setItem('mountalgo_vol_presets', JSON.stringify(presets));
  }, []);

  const [activePresetIndex, setActivePresetIndexState] = useState<number>(() => {
    return Number(localStorage.getItem('mountalgo_active_preset_idx')) || 2; // Default 3rd slot (e.g. 100 crypto / 0.10 forex)
  });

  const setActivePresetIndex = useCallback((idx: number) => {
    const clamped = Math.max(0, Math.min(4, idx));
    setActivePresetIndexState(clamped);
    localStorage.setItem('mountalgo_active_preset_idx', clamped.toString());
    tradingAudio.play('PRESET');
  }, []);

  // Hotkey Settings
  const [hotkeysEnabled, setHotkeysEnabledState] = useState<boolean>(() => {
    const stored = localStorage.getItem('mountalgo_hotkeys_enabled');
    return stored === null ? true : stored === 'true';
  });

  const setHotkeysEnabled = useCallback((val: boolean) => {
    setHotkeysEnabledState(val);
    localStorage.setItem('mountalgo_hotkeys_enabled', val.toString());
  }, []);

  const [hotkeyMode, setHotkeyModeState] = useState<'shift' | 'single'>(() => {
    return (localStorage.getItem('mountalgo_hotkey_mode') as any) || 'shift';
  });

  const setHotkeyMode = useCallback((mode: 'shift' | 'single') => {
    setHotkeyModeState(mode);
    localStorage.setItem('mountalgo_hotkey_mode', mode);
  }, []);

  const [hotkeyAudioEnabled, setHotkeyAudioEnabledState] = useState<boolean>(() => {
    const stored = localStorage.getItem('mountalgo_hotkey_audio');
    return stored === null ? true : stored === 'true';
  });

  const setHotkeyAudioEnabled = useCallback((enabled: boolean) => {
    setHotkeyAudioEnabledState(enabled);
    localStorage.setItem('mountalgo_hotkey_audio', enabled.toString());
    tradingAudio.setEnabled(enabled);
  }, []);

  useEffect(() => {
    tradingAudio.setEnabled(hotkeyAudioEnabled);
  }, [hotkeyAudioEnabled]);

  const [isHotkeyModalOpen, setIsHotkeyModalOpen] = useState(false);

  // Instant Trade Toggle (Floating Bar)
  const [isInstantTradeEnabled, setIsInstantTradeEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('instant_trade_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem('instant_trade_enabled', String(isInstantTradeEnabled));
  }, [isInstantTradeEnabled]);
  const [hotkeyToast, setHotkeyToast] = useState<HotkeyToast | null>(null);

  const dismissHotkeyToast = useCallback(() => {
    setHotkeyToast(null);
  }, []);

  // Multi-Chart Synchronization (Symbol, Timeframe, & Global Crosshair)
  const [chartSyncSymbol, setChartSyncSymbolState] = useState<boolean>(() => {
    return localStorage.getItem('mountalgo_sync_symbol') === 'true';
  });
  const setChartSyncSymbol = useCallback((val: boolean) => {
    setChartSyncSymbolState(val);
    localStorage.setItem('mountalgo_sync_symbol', val.toString());
  }, []);

  const [chartSyncTimeframe, setChartSyncTimeframeState] = useState<boolean>(() => {
    return localStorage.getItem('mountalgo_sync_tf') === 'true';
  });
  const setChartSyncTimeframe = useCallback((val: boolean) => {
    setChartSyncTimeframeState(val);
    localStorage.setItem('mountalgo_sync_tf', val.toString());
  }, []);

  const [chartSyncCrosshair, setChartSyncCrosshairState] = useState<boolean>(() => {
    const stored = localStorage.getItem('mountalgo_sync_crosshair');
    return stored === null ? true : stored === 'true';
  });
  const setChartSyncCrosshair = useCallback((val: boolean) => {
    setChartSyncCrosshairState(val);
    localStorage.setItem('mountalgo_sync_crosshair', val.toString());
  }, []);

  const [globalCrosshair, _setGlobalCrosshair] = useState<{ active: boolean; time: number; price?: number; sourceChartId?: string } | null>(null);

  const setGlobalCrosshair = useCallback((data: { active: boolean; time: number; price?: number; sourceChartId?: string } | null) => {
    _setGlobalCrosshair(data);
    if (data) broadcastSync.broadcast('SYNC_CROSSHAIR', data);
  }, []);
  const [syncedGlobalSymbol, setSyncedGlobalSymbol] = useState<string | null>(null);
  const broadcastSymbolChange = useCallback((newSymbol: string) => {
    setSyncedGlobalSymbol(newSymbol);
    broadcastSync.broadcast('SYNC_SYMBOL', newSymbol);
  }, []);

  const [syncedGlobalTimeframe, setSyncedGlobalTimeframe] = useState<string | null>(null);
  const broadcastTimeframeChange = useCallback((newTf: string) => {
    setSyncedGlobalTimeframe(newTf);
    broadcastSync.broadcast('SYNC_TIMEFRAME', newTf);
  }, []);

  useEffect(() => {
    const unsubSym = broadcastSync.subscribe('SYNC_SYMBOL', (newSym) => {
      setSyncedGlobalSymbol(newSym);
    });
    const unsubTf = broadcastSync.subscribe('SYNC_TIMEFRAME', (newTf) => {
      setSyncedGlobalTimeframe(newTf);
    });
    const unsubCross = broadcastSync.subscribe('SYNC_CROSSHAIR', (payload) => {
      if (chartSyncCrosshair) _setGlobalCrosshair(payload);
    });
    return () => {
      unsubSym();
      unsubTf();
      unsubCross();
    };
  }, [chartSyncCrosshair]);

  // Trade Journal & Analytics Modal state
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);

  // Jump to Chart Target Execution Time State & Callback
  const [chartJumpTarget, setChartJumpTarget] = useState<{ symbol: string; timestamp: number; id: string } | null>(null);

  const jumpToChartTarget = useCallback((symbol: string, timestamp?: number) => {
    setIsJournalModalOpen(false);
    setFocusedChartId('');
    setFocusedSymbol(symbol);
    setSyncedGlobalSymbol(symbol);
    setChartJumpTarget({
      symbol,
      timestamp: timestamp || Date.now(),
      id: 'jump_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
    });
  }, []);

  const clearChartJumpTarget = useCallback(() => {
    setChartJumpTarget(null);
  }, []);

  const setFocusedChart = useCallback((chartId: string, symbol: string) => {
    setFocusedChartId(prev => (prev === chartId ? prev : chartId));
    setFocusedSymbol(prev => (prev === symbol ? prev : symbol));
    localStorage.setItem('mountalgo_focused_symbol', symbol);
  }, []);

  const updateLivePrice = useCallback((symbol: string, price: number) => {
    tickBatcher.feedTick(symbol, price);
  }, []);

  const cancelPendingOrder = useCallback((id: string) => {
    setPendingOrders(prev => {
      const order = prev.find(o => o.id === id);
      if (order) {
        tradingAudio.play('ORDER_CANCELLED');
        setHotkeyToast({
          id: Math.random().toString(),
          type: 'CLOSE',
          title: 'ORDER CANCELLED',
          subtitle: `${order.orderType} ${order.type} ${order.size} ${order.symbol} @ ${order.price}`,
          symbol: order.symbol,
          timestamp: Date.now()
        });
      }
      return prev.filter(o => o.id !== id);
    });
  }, []);

  const cancelAllPendingOrders = useCallback((symbol?: string) => {
    setPendingOrders(prev => {
      const filtered = symbol ? prev.filter(o => o.symbol !== symbol) : [];
      tradingAudio.play('ORDER_CANCELLED');
      return filtered;
    });
  }, []);

  const updatePendingOrder = useCallback((id: string, price: number, size?: number, takeProfit?: number, stopLoss?: number) => {
    setPendingOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      let newType = o.orderType;
      // Auto switch orderType between STOP and LIMIT when order price is dragged across live market price
      if (o.orderType === 'STOP' || o.orderType === 'LIMIT') {
        const liveP = livePrices[o.symbol] || o.currentPrice || price;
        if (o.type === 'BUY') {
          newType = price >= liveP ? 'STOP' : 'LIMIT';
        } else if (o.type === 'SELL') {
          newType = price <= liveP ? 'STOP' : 'LIMIT';
        }
      }
      return {
        ...o,
        price,
        orderType: newType,
        size: size !== undefined && size > 0 ? size : o.size,
        takeProfit: takeProfit !== undefined ? takeProfit : o.takeProfit,
        stopLoss: stopLoss !== undefined ? stopLoss : o.stopLoss
      };
    }));
  }, [livePrices]);

  const executeOrder = useCallback((orderData: {
    symbol: string;
    type: 'BUY' | 'SELL';
    orderType?: 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT' | 'OCO' | 'TRAILING_STOP' | 'TWAP' | 'VWAP' | 'ICEBERG';
    size: number;
    price: number;
    stopLimitPrice?: number;
    takeProfit?: number;
    stopLoss?: number;
    leverage?: number;
    marginMode?: 'Cross' | 'Isolated';
    autoBE?: boolean;
    trailingStep?: number;
    timeInForce?: 'GTC' | 'IOC' | 'FOK' | 'DAY';
    postOnly?: boolean;
    reduceOnly?: boolean;
    algoSettings?: {
      duration: string;
      participationRate: string;
      visibleSize: string;
      randomizeSize: boolean;
      startTime: string;
    };
  }) => {
    // 0. Account Risk Guard Check
    if (activeAccount?.riskGuard?.isTradingLocked) {
      tradingAudio.play('ERROR');
      setHotkeyToast({
        id: Math.random().toString(),
        type: 'ALERT',
        title: 'TRADING TERKUNCI OLEH RISK GUARD',
        subtitle: 'Batas kerugian harian terlampaui / akun di-lock demi keamanan.',
        symbol: orderData.symbol,
        timestamp: Date.now()
      });
      return;
    }

    if (activeAccount?.riskGuard?.maxPositionSize && orderData.size > activeAccount.riskGuard.maxPositionSize) {
      tradingAudio.play('ERROR');
      setHotkeyToast({
        id: Math.random().toString(),
        type: 'ALERT',
        title: 'BATAS UKURAN POSISI TERLAMPAUI',
        subtitle: `Maksimum lot/unit diizinkan: ${activeAccount.riskGuard.maxPositionSize}`,
        symbol: orderData.symbol,
        timestamp: Date.now()
      });
      return;
    }

    const orderType = orderData.orderType || 'MARKET';
    const curMarketPrice = livePrices[orderData.symbol] || orderData.price;
    const isForex = orderData.symbol === 'EURUSD' || orderData.symbol === 'GBPUSD' || orderData.symbol === 'USDJPY';
    const minBuffer = isForex ? 0.0002 : Math.max(0.0001, curMarketPrice * 0.0005);

    // 1. Differentiate between immediate Market Execution vs Pending Order
    let isPending = false;
    if (orderType === 'LIMIT') {
      if (orderData.type === 'BUY' && orderData.price < curMarketPrice) isPending = true;
      else if (orderData.type === 'SELL' && orderData.price > curMarketPrice) isPending = true;
    } else if (orderType === 'STOP') {
      if (orderData.type === 'BUY' && orderData.price > curMarketPrice) isPending = true;
      else if (orderData.type === 'SELL' && orderData.price < curMarketPrice) isPending = true;
    } else if (orderType === 'STOP_LIMIT' || orderType === 'OCO' || orderType === 'TRAILING_STOP') {
      isPending = true;
    }

    if (isPending || orderType === 'TWAP' || orderType === 'VWAP' || orderType === 'ICEBERG') {
      if (orderType === 'OCO') {
        // OCO creates TWO linked orders: a Take Profit Limit order + Stop Loss order
        const idLimit = 'ord_oco_lim_' + Math.random().toString(36).substr(2, 7);
        const idStop = 'ord_oco_stp_' + Math.random().toString(36).substr(2, 7);

        const limitPrice = orderData.price;
        const stopPrice = orderData.stopLimitPrice || orderData.stopLoss || (orderData.type === 'BUY' ? curMarketPrice * 0.98 : curMarketPrice * 1.02);

        const oco1: PendingOrder = {
          id: idLimit,
          symbol: orderData.symbol,
          type: orderData.type,
          orderType: 'LIMIT',
          size: orderData.size,
          price: limitPrice,
          currentPrice: curMarketPrice,
          takeProfit: orderData.takeProfit,
          stopLoss: orderData.stopLoss,
          leverage: orderData.leverage || 10,
          marginMode: orderData.marginMode || 'Cross',
          autoBE: orderData.autoBE || false,
          timeInForce: orderData.timeInForce || 'GTC',
          ocoLinkedOrderId: idStop,
          timestamp: Date.now(),
          status: 'PENDING',
          accountId: activeAccountId
        };

        const oco2: PendingOrder = {
          id: idStop,
          symbol: orderData.symbol,
          type: orderData.type,
          orderType: 'STOP',
          size: orderData.size,
          price: stopPrice,
          currentPrice: curMarketPrice,
          takeProfit: orderData.takeProfit,
          stopLoss: orderData.stopLoss,
          leverage: orderData.leverage || 10,
          marginMode: orderData.marginMode || 'Cross',
          autoBE: orderData.autoBE || false,
          timeInForce: orderData.timeInForce || 'GTC',
          ocoLinkedOrderId: idLimit,
          timestamp: Date.now(),
          status: 'PENDING',
          accountId: activeAccountId
        };

        setPendingOrders(prev => [oco1, oco2, ...prev]);
        tradingAudio.play('PRESET');
        setHotkeyToast({
          id: Math.random().toString(),
          type: 'PRESET',
          title: `OCO PAIR DITEMPATKAN (${orderData.type})`,
          subtitle: `Limit @ ${limitPrice?.toFixed(isForex ? 4 : 2)} | Stop @ ${stopPrice?.toFixed(isForex ? 4 : 2)}`,
          symbol: orderData.symbol,
          timestamp: Date.now()
        });
        return;
      }

      const newPending: PendingOrder = {
        id: 'ord_' + Math.random().toString(36).substr(2, 9),
        symbol: orderData.symbol,
        type: orderData.type,
        orderType: orderType,
        size: orderData.size,
        price: orderData.price,
        stopLimitPrice: orderData.stopLimitPrice,
        currentPrice: curMarketPrice,
        takeProfit: orderData.takeProfit,
        stopLoss: orderData.stopLoss,
        leverage: orderData.leverage || 10,
        marginMode: orderData.marginMode || 'Cross',
        autoBE: orderData.autoBE || false,
        trailingStep: orderData.trailingStep,
        timeInForce: orderData.timeInForce || 'GTC',
        postOnly: orderData.postOnly,
        reduceOnly: orderData.reduceOnly,
        algoSettings: orderData.algoSettings,
        timestamp: Date.now(),
        status: 'PENDING',
        accountId: activeAccountId
      };

      setPendingOrders(prev => [newPending, ...prev]);
      tradingAudio.play('PRESET');

      if (orderType === 'TWAP' || orderType === 'VWAP' || orderType === 'ICEBERG') {
        setHotkeyToast({
          id: Math.random().toString(),
          type: 'PRESET',
          title: `INSTITUTIONAL ALGO ${orderType} AKTIF`,
          subtitle: `Size: ${orderData.size} | Algorithm executing slices based on parameters...`,
          symbol: orderData.symbol,
          timestamp: Date.now()
        });
      } else {
        setHotkeyToast({
          id: Math.random().toString(),
          type: 'PRESET',
          title: `${orderType} ${orderData.type} DITEMPATKAN`,
          subtitle: `${orderData.size} ${orderData.symbol} @ ${orderData.price?.toFixed(isForex ? 4 : 2)} (${orderData.timeInForce || 'GTC'})`,
          symbol: orderData.symbol,
          timestamp: Date.now()
        });
      }
      return;
    }

    // 2. Immediate Market Fill
    const fillStart = performance.now();
    let execPrice = orderType === 'MARKET' ? curMarketPrice : orderData.price;
    let slippagePips = Number(Math.max(0, (Math.abs(curMarketPrice - (orderData.price || curMarketPrice)) * (isForex ? 10000 : 1))).toFixed(2));
    
    // Algoritma Slippage & Market Impact (Order Routing Institutional)
    if (orderType === 'MARKET') {
       // Semakin besar lot, semakin besar liquidity sweep impact
       const baseSpread = isForex ? 0.00005 : 0.02; 
       const lotImpact = Math.max(0, (orderData.size) * 0.25); 
       const volFactor = 0.8 + Math.random() * 0.4;
       const simulatedSlippage = baseSpread + ((lotImpact * volFactor) * (isForex ? 0.0001 : 0.01));
       
       if (orderData.type === 'BUY') {
         execPrice += simulatedSlippage;
       } else {
         execPrice -= Math.min(execPrice * 0.99, simulatedSlippage); // safeguard
       }
       slippagePips += Number((simulatedSlippage * (isForex ? 10000 : 1)).toFixed(2));
    }
    
    const latencyMs = Math.max(1.1, Number((performance.now() - fillStart + (Math.random() * 2.8 + 1.2)).toFixed(1)));
    
    // Validate / Clamp TP & SL for initial position
    let validSL = orderData.stopLoss;
    let validTP = orderData.takeProfit;

    if (orderData.type === 'BUY') {
      if (validSL !== undefined && validSL !== null && validSL >= execPrice) {
        validSL = Number((execPrice - minBuffer)?.toFixed(isForex ? 5 : 2));
      }
      if (validTP !== undefined && validTP !== null && validTP <= execPrice) {
        validTP = Number((execPrice + minBuffer)?.toFixed(isForex ? 5 : 2));
      }
    } else {
      if (validSL !== undefined && validSL !== null && validSL <= execPrice) {
        validSL = Number((execPrice + minBuffer)?.toFixed(isForex ? 5 : 2));
      }
      if (validTP !== undefined && validTP !== null && validTP >= execPrice) {
        validTP = Number((execPrice - minBuffer)?.toFixed(isForex ? 5 : 2));
      }
    }

    const newPosition: Position = {
      id: 'pos_' + Math.random().toString(36).substr(2, 9),
      symbol: orderData.symbol,
      type: orderData.type,
      size: orderData.size,
      entryPrice: execPrice,
      currentPrice: curMarketPrice,
      pnl: 0,
      takeProfit: validTP,
      stopLoss: validSL,
      leverage: orderData.leverage || 10,
      marginMode: orderData.marginMode || 'Cross',
      autoBE: orderData.autoBE || false,
      trailingStep: orderData.trailingStep,
      timestamp: Date.now(),
      accountId: activeAccountId,
      executionLatencyMs: latencyMs,
      slippagePips: slippagePips
    };

    setPositions(prev => [newPosition, ...prev]);
    tradingAudio.play(orderData.type);

    setHotkeyToast({
      id: Math.random().toString(),
      type: orderData.type,
      title: 'ORDER FILLED',
      subtitle: `${orderData.type} ${orderData.size} ${orderData.symbol} @ ${execPrice?.toFixed(isForex ? 4 : 2)}`,
      symbol: orderData.symbol,
      timestamp: Date.now(),
      latencyMs,
      slippagePips
    });

    // Capture layout snapshot in background — do NOT block order execution
    // For scalping speed, this runs asynchronously after position is already open
    const entryFillId = 'fill_entry_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const entryFill: TradeExecutionFill = {
      id: entryFillId,
      positionId: newPosition.id,
      symbol: orderData.symbol,
      side: orderData.type,
      action: 'ENTRY' as 'ENTRY',
      price: execPrice,
      size: orderData.size,
      timestamp: Date.now(),
      closeReason: 'ENTRY'
    };
    setExecutionFills(f => [entryFill, ...f]);
    // Snapshot is optional — fire and forget, don't block execution
    try {
      captureLayoutSnapshot().then(snapUrl => {
        if (snapUrl) {
          setPositions(prev => prev.map(p => p.id === newPosition.id ? { ...p, entrySnapshotUrl: snapUrl } : p));
        }
      }).catch(() => {});
    } catch {}

    // 3. Master Copy Trading Mirroring to Slaves
    if (activeAccount?.copyTrade?.isMasterAccount) {
      const slaveAccounts = connectedAccounts.filter(
        a => a.id !== activeAccountId && a.copyTrade?.isEnabled && a.copyTrade?.copyFromAccountId === activeAccountId
      );

      if (slaveAccounts.length > 0) {
        slaveAccounts.forEach(slave => {
          const ratio = slave.copyTrade?.copyRatio ?? 1.0;
          const copySize = slave.copyTrade?.fixedLotSize || Math.max(0.01, Number((orderData.size * ratio)?.toFixed(2)));
          const copySide = slave.copyTrade?.mirrorReverse ? (orderData.type === 'BUY' ? 'SELL' : 'BUY') : orderData.type;

          const slavePos: Position = {
            id: 'pos_copy_' + Math.random().toString(36).substr(2, 9),
            symbol: orderData.symbol,
            type: copySide,
            size: copySize,
            entryPrice: execPrice,
            currentPrice: curMarketPrice,
            pnl: 0,
            takeProfit: validTP,
            stopLoss: validSL,
            leverage: slave.leverage || 10,
            marginMode: orderData.marginMode || 'Cross',
            timestamp: Date.now(),
            accountId: slave.id
          };

          setPositions(prev => [slavePos, ...prev]);
        });

        setHotkeyToast({
          id: Math.random().toString(),
          type: 'ALERT',
          title: `COPY TRADE DISINKRONKAN (${slaveAccounts.length} AKUN)`,
          subtitle: `Master -> ${slaveAccounts.length} Akun Copy Slave terisi otomatis`,
          symbol: orderData.symbol,
          timestamp: Date.now()
        });
      }
    }
  }, [activeAccount, connectedAccounts, activeAccountId, livePrices]);

  const closePosition = useCallback((id: string, closePrice: number, percentage = 1, closeReason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'MANUAL_CLOSE' | 'REVERSE' | 'FLATTEN' | 'PARTIAL' = 'MANUAL_CLOSE') => {
    let closedPos: Position | undefined;
    let historyId = '';
    let closeSize = 0;
    let finalPnl = 0;

    setPositions(prev => {
      const pos = prev.find(p => p.id === id);
      if (!pos) return prev;
      closedPos = pos;
            
      closeSize = pos.size * percentage;
      const remainSize = pos.size - closeSize;
            
      const diff = pos.type === 'BUY' ? closePrice - pos.entryPrice : pos.entryPrice - closePrice;
      const isPosFiat = pos.symbol === 'EURUSD' || pos.symbol === 'GBPUSD' || pos.symbol === 'USDJPY';
      const multiplier = isPosFiat ? 100000 : 1;
      finalPnl = diff * closeSize * multiplier;
            
      setBalance(b => b + finalPnl);
      historyId = pos.id + '-close-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
            
      const historyItem = {
        ...pos,
        id: historyId,
        size: closeSize,
        closePrice,
        finalPnl,
        closeReason,
        entrySnapshotUrl: pos.entrySnapshotUrl,
        closeTime: new Date().toISOString()
      };
      setTradeHistory(h => [historyItem, ...h]);
            
      if (remainSize <= 0.0001) {
        return prev.filter(p => p.id !== id);
      } else {
        return prev.map(p => p.id === id ? { ...p, size: remainSize } : p);
      }
    });

    if (closeReason === 'TAKE_PROFIT') {
      tradingAudio.play('TAKE_PROFIT');
    } else if (closeReason === 'STOP_LOSS') {
      tradingAudio.play('STOP_LOSS');
    } else {
      tradingAudio.play('CLOSE');
    }

    if (closedPos && historyId) {
      captureLayoutSnapshot().then(exitSnap => {
        if (exitSnap) {
          setTradeHistory(h => h.map(item => item.id === historyId ? {
            ...item,
            exitSnapshotUrl: exitSnap,
            snapshotUrl: exitSnap || item.entrySnapshotUrl
          } : item));

          const exitFill: TradeExecutionFill = {
            id: 'fill_exit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            positionId: closedPos!.id,
            symbol: closedPos!.symbol,
            side: closedPos!.type === 'BUY' ? 'SELL' : 'BUY',
            action: percentage < 1 ? 'PARTIAL_CLOSE' : 'EXIT',
            price: closePrice,
            size: closeSize,
            pnl: finalPnl,
            timestamp: Date.now(),
            snapshotUrl: exitSnap,
            closeReason
          };
          setExecutionFills(f => [exitFill, ...f]);
        }
      });
    }
  }, []);

  const reversePosition = useCallback((id: string, currentPrice: number) => {
    let closedPos: Position | undefined;
    let historyId = '';
    
    const pos = positions.find(p => p.id === id);
    if (!pos) return;
    closedPos = pos;
    
    const diff = pos.type === 'BUY' ? currentPrice - pos.entryPrice : pos.entryPrice - currentPrice;
    const isPosFiat = pos.symbol === 'EURUSD' || pos.symbol === 'GBPUSD' || pos.symbol === 'USDJPY';
    const multiplier = isPosFiat ? 100000 : 1;
    const finalPnl = diff * pos.size * multiplier;
    
    historyId = pos.id + '-rev-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    
    const historyItem = {
      ...pos,
      id: historyId,
      size: pos.size,
      closePrice: currentPrice,
      finalPnl,
      closeReason: 'REVERSE' as 'REVERSE',
      entrySnapshotUrl: pos.entrySnapshotUrl,
      closeTime: new Date().toISOString()
    };
    
    const newPosId = 'pos_' + Math.random().toString(36).substr(2, 9);
    const newPosition: Position = {
      id: newPosId,
      symbol: pos.symbol,
      type: pos.type === 'BUY' ? 'SELL' : 'BUY',
      size: pos.size,
      entryPrice: currentPrice,
      currentPrice: currentPrice,
      pnl: 0,
      takeProfit: pos.takeProfit,
      stopLoss: pos.stopLoss,
      leverage: pos.leverage,
      marginMode: pos.marginMode,
      autoBE: pos.autoBE || false,
      timestamp: Date.now(),
      accountId: pos.accountId
    };

    setBalance(b => b + finalPnl);
    setTradeHistory(h => [historyItem, ...h]);
    setPositions(prev => [newPosition, ...prev.filter(p => p.id !== id)]);
    
    captureLayoutSnapshot().then(snapUrl => {
      if (snapUrl) {
        setTradeHistory(h => h.map(item => item.id === historyId ? {
          ...item,
          exitSnapshotUrl: snapUrl,
          snapshotUrl: snapUrl
        } : item));
        
        setPositions(pList => pList.map(p => p.id === newPosId ? { ...p, entrySnapshotUrl: snapUrl } : p));
        
        const revFill = {
          id: 'fill_rev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          positionId: newPosId,
          symbol: pos.symbol,
          side: newPosition.type,
          action: 'ENTRY' as 'ENTRY',
          price: currentPrice,
          size: pos.size,
          timestamp: Date.now(),
          snapshotUrl: snapUrl,
          closeReason: 'REVERSE' as 'REVERSE'
        };
        setExecutionFills(f => [revFill, ...f]);
      }
    });
    
    tradingAudio.play('REVERSE');
  }, [positions]);

  const closeAllPositions = useCallback((symbol?: string) => {
    let totalPnl = 0;
    const newHistory: any[] = [];
    const remaining: Position[] = [];
    
    positions.forEach(pos => {
      if (!symbol || pos.symbol === symbol) {
        const closePrice = livePrices[pos.symbol] || pos.currentPrice;
        const diff = pos.type === 'BUY' ? closePrice - pos.entryPrice : pos.entryPrice - closePrice;
        const isPosFiat = pos.symbol === 'EURUSD' || pos.symbol === 'GBPUSD' || pos.symbol === 'USDJPY';
        const multiplier = isPosFiat ? 100000 : 1;
        const finalPnl = diff * pos.size * multiplier;
        totalPnl += finalPnl;
        const historyId = pos.id + '-all-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
        newHistory.push({
          ...pos,
          id: historyId,
          closePrice,
          finalPnl,
          closeReason: 'FLATTEN' as 'FLATTEN',
          entrySnapshotUrl: pos.entrySnapshotUrl,
          closeTime: new Date().toISOString()
        });
      } else {
        remaining.push(pos);
      }
    });
    
    if (newHistory.length > 0) {
      setPositions(remaining);
      setBalance(b => b + totalPnl);
      setTradeHistory(h => [...newHistory, ...h]);
      captureLayoutSnapshot().then(snapUrl => {
        if (snapUrl) {
          setTradeHistory(h => h.map(item => {
            if (newHistory.some(nh => nh.id === item.id)) {
              return { ...item, exitSnapshotUrl: snapUrl, snapshotUrl: snapUrl || item.entrySnapshotUrl };
            }
            return item;
          }));
        }
      });
    }
    
    tradingAudio.play('FLATTEN');
  }, [livePrices, positions]);

  const toggleAutoBE = useCallback((id: string) => {
    setPositions(prev => prev.map(p => p.id === id ? { ...p, autoBE: !p.autoBE } : p));
    tradingAudio.play('AUTO_BE');
  }, []);

  const partialClosePosition = useCallback((id: string, closeRatio: number) => {
    let closedPos: Position | undefined;
    let historyId = '';
    let closeSize = 0;
    let finalPnl = 0;

    setPositions(prev => {
      const pos = prev.find(p => p.id === id);
      if (!pos) return prev;
      closedPos = pos;
      const curPrice = livePrices[pos.symbol] || pos.currentPrice;
      closeSize = Math.max(0.01, Number((pos.size * closeRatio)?.toFixed(2)));
      const remainSize = pos.size - closeSize;

      const diff = pos.type === 'BUY' ? curPrice - pos.entryPrice : pos.entryPrice - curPrice;
      const isPosFiat = pos.symbol === 'EURUSD' || pos.symbol === 'GBPUSD' || pos.symbol === 'USDJPY';
      const multiplier = isPosFiat ? 100000 : 1;
      finalPnl = diff * closeSize * multiplier;

      setBalance(b => b + finalPnl);

      historyId = pos.id + '-partial-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
      const historyItem = {
        ...pos,
        id: historyId,
        size: closeSize,
        closePrice: curPrice,
        finalPnl,
        closeReason: 'PARTIAL' as 'PARTIAL',
        entrySnapshotUrl: pos.entrySnapshotUrl,
        closeTime: new Date().toISOString()
      };
      setTradeHistory(h => [historyItem, ...h]);

      if (remainSize <= 0.001) {
        return prev.filter(p => p.id !== id);
      } else {
        return prev.map(p => p.id === id ? { ...p, size: remainSize } : p);
      }
    });

    tradingAudio.play('CLOSE');

    if (closedPos && historyId) {
      captureLayoutSnapshot().then(snapUrl => {
        if (snapUrl) {
          setTradeHistory(h => h.map(item => item.id === historyId ? {
            ...item,
            exitSnapshotUrl: snapUrl,
            snapshotUrl: snapUrl || item.entrySnapshotUrl
          } : item));

          const fill: TradeExecutionFill = {
            id: 'fill_partial_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            positionId: closedPos!.id,
            symbol: closedPos!.symbol,
            side: closedPos!.type,
            action: 'PARTIAL_CLOSE',
            price: livePrices[closedPos!.symbol] || closedPos!.currentPrice,
            size: closeSize,
            pnl: finalPnl,
            timestamp: Date.now(),
            snapshotUrl: snapUrl,
            closeReason: 'PARTIAL' as 'PARTIAL'
          };
          setExecutionFills(f => [fill, ...f]);
        }
      });
    }
  }, [livePrices]);

  const setBreakEvenWithOffset = useCallback((id: string, offsetPips = 1.0) => {
    setPositions(prev => prev.map(p => {
      if (p.id !== id) return p;
      const isForex = p.symbol === 'EURUSD' || p.symbol === 'GBPUSD' || p.symbol === 'USDJPY';
      const pipStep = isForex ? 0.0001 : p.symbol.startsWith('XAU') ? 0.1 : 1.0;
      const offset = offsetPips * pipStep;

      const targetBE = p.type === 'BUY' ? p.entryPrice + offset : p.entryPrice - offset;

      return {
        ...p,
        stopLoss: Number(targetBE?.toFixed(isForex ? 5 : 2)),
        autoBE: true,
        autoBeOffsetPips: offsetPips
      };
    }));

    tradingAudio.play('AUTO_BE');
  }, []);

  const scaleInPosition = useCallback((id: string, addSize: number) => {
    setPositions(prev => prev.map(p => {
      if (p.id !== id) return p;
      const curPrice = livePrices[p.symbol] || p.currentPrice;
      const newTotalSize = p.size + addSize;
      const weightedEntry = ((p.entryPrice * p.size) + (curPrice * addSize)) / newTotalSize;
      const isForex = p.symbol === 'EURUSD' || p.symbol === 'GBPUSD' || p.symbol === 'USDJPY';

      const fill: TradeExecutionFill = {
        id: 'fill_scale_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        positionId: p.id,
        symbol: p.symbol,
        side: p.type,
        action: 'SCALE_IN',
        price: curPrice,
        size: addSize,
        timestamp: Date.now()
      };
      setExecutionFills(f => [fill, ...f]);

      return {
        ...p,
        size: Number(newTotalSize?.toFixed(2)),
        entryPrice: Number(weightedEntry?.toFixed(isForex ? 5 : 2))
      };
    }));

    tradingAudio.play('BUY');
  }, [livePrices]);

  const updateMultiBracketTP = useCallback((id: string, brackets: MultiBracketTP) => {
    setPositions(prev => prev.map(p => p.id === id ? { ...p, brackets: { ...p.brackets, ...brackets } } : p));
  }, []);

  const updatePositionBracket = useCallback((id: string, takeProfit?: number, stopLoss?: number, trailingStep?: number) => {
    setPositions(prev => prev.map(p => {
      if (p.id !== id) return p;
      const liveP = livePrices[p.symbol] || p.currentPrice || p.entryPrice;
      const isForex = p.symbol === 'EURUSD' || p.symbol === 'GBPUSD' || p.symbol === 'USDJPY';
      const minBuffer = isForex ? 0.0002 : Math.max(0.0001, liveP * 0.0005);

      let safeSL = stopLoss;
      let safeTP = takeProfit;

      if (p.type === 'BUY') {
        // Stop Loss for BUY MUST be strictly below current market price (liveP)
        // Moving SL above entryPrice (trailing/locking in profit) is VALID as long as it is below current market price
        if (safeSL !== undefined && safeSL !== null) {
          if (safeSL >= liveP) {
            safeSL = Number((liveP - minBuffer)?.toFixed(isForex ? 5 : 2));
          }
        }
        // Take Profit for BUY MUST be strictly above current market price (liveP)
        if (safeTP !== undefined && safeTP !== null) {
          if (safeTP <= liveP) {
            safeTP = Number((liveP + minBuffer)?.toFixed(isForex ? 5 : 2));
          }
        }
      } else {
        // Stop Loss for SELL MUST be strictly above current market price (liveP)
        if (safeSL !== undefined && safeSL !== null) {
          if (safeSL <= liveP) {
            safeSL = Number((liveP + minBuffer)?.toFixed(isForex ? 5 : 2));
          }
        }
        // Take Profit for SELL MUST be strictly below current market price (liveP)
        if (safeTP !== undefined && safeTP !== null) {
          if (safeTP >= liveP) {
            safeTP = Number((liveP - minBuffer)?.toFixed(isForex ? 5 : 2));
          }
        }
      }

      return { 
        ...p, 
        takeProfit: safeTP, 
        stopLoss: safeSL, 
        trailingStep: trailingStep !== undefined ? trailingStep : p.trailingStep 
      };
    }));
  }, [livePrices]);

  // Quick Action Handler for Hotkeys & Scalper Buttons
  const quickTradeAction = useCallback((
    action: 'BUY' | 'SELL' | 'CLOSE' | 'REVERSE' | 'FLATTEN' | 'AUTO_BE',
    targetSymbol?: string,
    targetPrice?: number
  ) => {
    const sym = targetSymbol || focusedSymbol;
    const price = targetPrice || livePrices[sym] || (sym === 'BTCUSDT' ? 67500 : sym === 'EURUSD' ? 1.0850 : 2000);
    const isForex = sym === 'EURUSD' || sym === 'GBPUSD' || sym === 'USDJPY' || sym.startsWith('XAU');
    const presets = isForex ? volumePresets.forex : volumePresets.crypto;
    const rawSize = presets[activePresetIndex] ?? (isForex ? 0.1 : 100);
    const size = isForex ? rawSize : Number((rawSize / price).toFixed(4));

    const tStart = performance.now();
    const simulatedLatency = Math.max(1, Math.round((performance.now() - tStart) * 10) / 10 + (Math.floor(Math.random() * 3) + 1));
    const randomSlippage = isForex ? Number((Math.random() * 0.3).toFixed(1)) : Number((Math.random() * 0.5).toFixed(1));

    if (action === 'BUY' || action === 'SELL') {
      executeOrder({
        symbol: sym,
        type: action,
        orderType: 'MARKET',
        size,
        price,
      });

      setHotkeyToast({
        id: Math.random().toString(),
        type: action,
        title: `QUICK ${action} EXECUTED`,
        subtitle: `${size} ${sym} @ ${price?.toFixed(isForex ? 4 : 2)} (Preset #${activePresetIndex + 1})`,
        symbol: sym,
        timestamp: Date.now(),
        latencyMs: simulatedLatency,
        slippagePips: randomSlippage
      });
    } else if (action === 'CLOSE') {
      const pos = positions.find(p => p.symbol === sym);
      if (pos) {
        closePosition(pos.id, price, 1);
        setHotkeyToast({
          id: Math.random().toString(),
          type: 'CLOSE',
          title: `POSITION CLOSED`,
          subtitle: `Closed ${pos.type} ${pos.size} ${sym} @ ${price?.toFixed(isForex ? 4 : 2)}`,
          symbol: sym,
          timestamp: Date.now(),
          latencyMs: simulatedLatency,
          slippagePips: 0.0
        });
      } else {
        tradingAudio.play('ERROR');
      }
    } else if (action === 'REVERSE') {
      const pos = positions.find(p => p.symbol === sym);
      if (pos) {
        reversePosition(pos.id, price);
        setHotkeyToast({
          id: Math.random().toString(),
          type: 'REVERSE',
          title: `POSITION REVERSED`,
          subtitle: `Reversed ${pos.type} -> ${pos.type === 'BUY' ? 'SELL' : 'BUY'} ${pos.size} ${sym}`,
          symbol: sym,
          timestamp: Date.now(),
          latencyMs: simulatedLatency,
          slippagePips: randomSlippage
        });
      } else {
        tradingAudio.play('ERROR');
      }
    } else if (action === 'AUTO_BE') {
      const pos = positions.find(p => p.symbol === sym);
      if (pos) {
        toggleAutoBE(pos.id);
        setHotkeyToast({
          id: Math.random().toString(),
          type: 'AUTO_BE',
          title: `AUTO BREAK-EVEN ${!pos.autoBE ? 'ACTIVATED' : 'DEACTIVATED'}`,
          subtitle: `${sym} ${pos.type} ${pos.size} - Target BE: ${pos.entryPrice}`,
          symbol: sym,
          timestamp: Date.now(),
          latencyMs: simulatedLatency
        });
      }
    } else if (action === 'FLATTEN') {
      if (positions.length > 0) {
        closeAllPositions();
        setHotkeyToast({
          id: Math.random().toString(),
          type: 'FLATTEN',
          title: `FLATTEN ALL EXECUTED`,
          subtitle: `Closed ${positions.length} active positions across all markets`,
          symbol: 'ALL',
          timestamp: Date.now(),
          latencyMs: simulatedLatency,
          slippagePips: 0.0
        });
      } else {
        tradingAudio.play('ERROR');
      }
    }
  }, [
    focusedSymbol,
    livePrices,
    volumePresets,
    activePresetIndex,
    executeOrder,
    positions,
    closePosition,
    reversePosition,
    toggleAutoBE,
    closeAllPositions
  ]);

  // Global Keyboard Hotkey Handler
  useEffect(() => {
    if (!hotkeysEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Safeguard: Ignore hotkeys if focused in any input, textarea, select, or editable element
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      // 1. Preset Switchers: Keys 1 to 5
      if (!e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (e.code === 'Digit1' || e.code === 'Numpad1') {
          e.preventDefault();
          setActivePresetIndex(0);
          return;
        }
        if (e.code === 'Digit2' || e.code === 'Numpad2') {
          e.preventDefault();
          setActivePresetIndex(1);
          return;
        }
        if (e.code === 'Digit3' || e.code === 'Numpad3') {
          e.preventDefault();
          setActivePresetIndex(2);
          return;
        }
        if (e.code === 'Digit4' || e.code === 'Numpad4') {
          e.preventDefault();
          setActivePresetIndex(3);
          return;
        }
        if (e.code === 'Digit5' || e.code === 'Numpad5') {
          e.preventDefault();
          setActivePresetIndex(4);
          return;
        }
      }

      // 2. Hotkey Guide Modal: Shift + H or '?'
      if ((e.shiftKey && e.code === 'KeyH') || (e.shiftKey && e.code === 'Slash')) {
        e.preventDefault();
        setIsHotkeyModalOpen(prev => !prev);
        return;
      }

      // Check condition: either Shift modifier or Single Key mode
      const isTrigger = (code: string) => {
        if (hotkeyMode === 'shift') {
          return e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey && e.code === code;
        } else {
          return !e.ctrlKey && !e.altKey && !e.metaKey && e.code === code;
        }
      };

      // 3. Quick BUY: Shift + B (or B in single mode)
      if (isTrigger('KeyB')) {
        e.preventDefault();
        quickTradeAction('BUY');
        return;
      }

      // 4. Quick SELL: Shift + S (or S in single mode)
      if (isTrigger('KeyS')) {
        e.preventDefault();
        quickTradeAction('SELL');
        return;
      }

      // 5. Close Position: Shift + C (or C in single mode)
      if (isTrigger('KeyC')) {
        e.preventDefault();
        quickTradeAction('CLOSE');
        return;
      }

      // 6. Reverse Position: Shift + R (or R in single mode)
      if (isTrigger('KeyR')) {
        e.preventDefault();
        quickTradeAction('REVERSE');
        return;
      }

      // 7. Auto Break-Even: Shift + E (or E in single mode)
      if (isTrigger('KeyE')) {
        e.preventDefault();
        quickTradeAction('AUTO_BE');
        return;
      }

      // 8. Panic Flatten All: Shift + X (or X in single mode)
      if (isTrigger('KeyX')) {
        e.preventDefault();
        quickTradeAction('FLATTEN');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    hotkeysEnabled,
    hotkeyMode,
    setActivePresetIndex,
    quickTradeAction
  ]);

  // Auto dismiss toast after 3 seconds
  useEffect(() => {
    if (!hotkeyToast) return;
    const timer = setTimeout(() => {
      setHotkeyToast(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [hotkeyToast]);

  // Update PNL and process Auto-BE / Trailing Stops based on live prices
  useEffect(() => {
    setPositions(prev => {
      if (prev.length === 0) return prev;
      let hasChanged = false;
      const nextPositions = prev.map(pos => {
        const livePrice = livePrices[pos.symbol] || pos.currentPrice;
        const diff = pos.type === 'BUY' ? livePrice - pos.entryPrice : pos.entryPrice - livePrice;
        const isPosFiat = pos.symbol === 'EURUSD' || pos.symbol === 'GBPUSD' || pos.symbol === 'USDJPY';
        const multiplier = isPosFiat ? 100000 : 1; 
        const pnl = diff * pos.size * multiplier;
        
        let newStopLoss = pos.stopLoss;

        // Auto Break-Even Logic: If profit >= 1%, move SL to entry price
        if (pos.autoBE && diff > 0) {
          const profitPct = diff / pos.entryPrice;
          if (profitPct >= 0.01) {
            if (!pos.stopLoss || (pos.type === 'BUY' ? pos.stopLoss < pos.entryPrice : pos.stopLoss > pos.entryPrice)) {
              newStopLoss = pos.entryPrice;
            }
          }
        }

        // Trailing Stop Logic
        if (pos.trailingStep && pos.trailingStep > 0 && diff > 0) {
          const stepAmount = isPosFiat ? pos.trailingStep * 0.0001 : pos.trailingStep;
          if (pos.type === 'BUY') {
            const trailTriggerPrice = pos.entryPrice + stepAmount;
            if (livePrice >= trailTriggerPrice) {
              const potentialSL = livePrice - stepAmount;
              if (!newStopLoss || potentialSL > newStopLoss) {
                newStopLoss = potentialSL;
              }
            }
          } else {
            const trailTriggerPrice = pos.entryPrice - stepAmount;
            if (livePrice <= trailTriggerPrice) {
              const potentialSL = livePrice + stepAmount;
              if (!newStopLoss || potentialSL < newStopLoss) {
                newStopLoss = potentialSL;
              }
            }
          }
        }

        if (pos.currentPrice === livePrice && Math.abs((pos.pnl || 0) - pnl) < 0.0001 && pos.stopLoss === newStopLoss) {
          return pos;
        }
        hasChanged = true;
        return { ...pos, currentPrice: livePrice, pnl, stopLoss: newStopLoss };
      });
      return hasChanged ? nextPositions : prev;
    });
  }, [livePrices]);

  // SL/TP hit detection
  // Minimum grace period (2 seconds) prevents immediate auto-close on new positions
  // when the market price is very close to the entry price or clamped SL/TP
  const SL_TP_GRACE_MS = 2000;
  useEffect(() => {
    const now = Date.now();
    positions.forEach(pos => {
      // Grace period: don't auto-close positions younger than SL_TP_GRACE_MS
      if (pos.timestamp && (now - pos.timestamp) < SL_TP_GRACE_MS) return;

      const livePrice = livePrices[pos.symbol] || pos.currentPrice;
      let shouldClose = false;
      let closeReason: 'TAKE_PROFIT' | 'STOP_LOSS' = 'TAKE_PROFIT';

      if (pos.stopLoss) {
        if (pos.type === 'BUY' && livePrice <= pos.stopLoss) {
          shouldClose = true;
          closeReason = 'STOP_LOSS';
        }
        if (pos.type === 'SELL' && livePrice >= pos.stopLoss) {
          shouldClose = true;
          closeReason = 'STOP_LOSS';
        }
      }
      if (pos.takeProfit && !shouldClose) {
        if (pos.type === 'BUY' && livePrice >= pos.takeProfit) {
          shouldClose = true;
          closeReason = 'TAKE_PROFIT';
        }
        if (pos.type === 'SELL' && livePrice <= pos.takeProfit) {
          shouldClose = true;
          closeReason = 'TAKE_PROFIT';
        }
      }
      if (shouldClose) {
        closePosition(pos.id, livePrice, 1, closeReason);
      }
    });
  }, [livePrices, positions, closePosition]);

  // Real-time Pending Order Trigger Execution Engine (Evaluates LIMIT, STOP, STOP_LIMIT, OCO)
  useEffect(() => {
    if (pendingOrders.length === 0) return;
    const now = Date.now();

    pendingOrders.forEach(ord => {
      if (ord.status !== 'PENDING') return;
      // Grace period: don't auto-fill pending orders younger than 1.5 seconds
      if (ord.timestamp && (now - ord.timestamp) < 1500) return;
      const liveP = livePrices[ord.symbol] || ord.currentPrice;
      if (!liveP) return;

      const isForex = ord.symbol === 'EURUSD' || ord.symbol === 'GBPUSD' || ord.symbol === 'USDJPY';
      let isTriggered = false;
      let execPrice = ord.price;

      if (ord.orderType === 'LIMIT') {
        if (ord.type === 'BUY' && liveP <= ord.price) {
          isTriggered = true;
          execPrice = ord.price;
        } else if (ord.type === 'SELL' && liveP >= ord.price) {
          isTriggered = true;
          execPrice = ord.price;
        }
      } else if (ord.orderType === 'STOP') {
        if (ord.type === 'BUY' && liveP >= ord.price) {
          isTriggered = true;
          execPrice = liveP; // Slippage applied
        } else if (ord.type === 'SELL' && liveP <= ord.price) {
          isTriggered = true;
          execPrice = liveP;
        }
      } else if (ord.orderType === 'STOP_LIMIT') {
        const stopHit = ord.type === 'BUY' ? liveP >= ord.price : liveP <= ord.price;
        if (stopHit) {
          const limitTarget = ord.stopLimitPrice || ord.price;
          const limitHit = ord.type === 'BUY' ? liveP <= limitTarget : liveP >= limitTarget;
          if (limitHit) {
            isTriggered = true;
            execPrice = limitTarget;
          }
        }
      }

      if (isTriggered) {
        const minBuffer = isForex ? 0.0002 : Math.max(0.0001, execPrice * 0.0005);
        let safeSL = ord.stopLoss;
        let safeTP = ord.takeProfit;

        if (ord.type === 'BUY') {
          if (safeSL && safeSL >= execPrice) safeSL = execPrice - minBuffer;
          if (safeTP && safeTP <= execPrice) safeTP = execPrice + minBuffer;
        } else {
          if (safeSL && safeSL <= execPrice) safeSL = execPrice + minBuffer;
          if (safeTP && safeTP >= execPrice) safeTP = execPrice - minBuffer;
        }

        const newPosId = 'pos_' + Math.random().toString(36).substr(2, 9);
        const newPos: Position = {
          id: newPosId,
          symbol: ord.symbol,
          type: ord.type,
          size: ord.size,
          entryPrice: execPrice,
          currentPrice: liveP,
          pnl: 0,
          takeProfit: safeTP,
          stopLoss: safeSL,
          leverage: ord.leverage || 10,
          marginMode: ord.marginMode || 'Cross',
          autoBE: ord.autoBE || false,
          trailingStep: ord.trailingStep,
          timestamp: Date.now(),
          accountId: ord.accountId || activeAccountId
        };

        setPositions(prev => [newPos, ...prev]);

        captureLayoutSnapshot().then(snapUrl => {
          if (snapUrl) {
            setPositions(pList => pList.map(p => p.id === newPosId ? { ...p, entrySnapshotUrl: snapUrl } : p));
            const pendFill: TradeExecutionFill = {
              id: 'fill_pend_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
              positionId: newPosId,
              symbol: ord.symbol,
              side: ord.type,
              action: 'ENTRY' as 'ENTRY',
              price: execPrice,
              size: ord.size,
              timestamp: Date.now(),
              snapshotUrl: snapUrl,
              closeReason: 'ENTRY'
            };
            setExecutionFills(f => [pendFill, ...f]);
          }
        });

        // Remove filled order and cancel OCO pair if linked
        setPendingOrders(prev => prev.filter(o => o.id !== ord.id && o.id !== ord.ocoLinkedOrderId));

        const triggerLatencyMs = Math.max(1.0, Number((Math.random() * 2.2 + 1.1).toFixed(1)));
        const triggerSlippage = Number(Math.max(0, Math.abs(liveP - execPrice) * (isForex ? 10000 : 1)).toFixed(2));

        tradingAudio.play(ord.type);

        setHotkeyToast({
          id: Math.random().toString(),
          type: 'PRESET',
          title: `ORDER FILLED (${ord.orderType})`,
          subtitle: `${ord.type} ${ord.size} ${ord.symbol} @ ${execPrice?.toFixed(isForex ? 4 : 2)}`,
          symbol: ord.symbol,
          timestamp: Date.now(),
          latencyMs: triggerLatencyMs,
          slippagePips: triggerSlippage
        });
      }
    });
  }, [livePrices, pendingOrders, activeAccountId]);

  // Real-time Liquidation & Margin Call Engine
  useEffect(() => {
    if (positions.length === 0) return;
    const currentEquity = balance + positions.reduce((sum, pos) => sum + (pos.pnl || 0), 0);
    const totalRequiredMargin = positions.reduce((sum, pos) => sum + (pos.entryPrice * pos.size * (0.01 / (pos.leverage || 10))), 0);

    // If Equity drops below maintenance margin threshold (20% of required margin)
    if (currentEquity <= totalRequiredMargin * 0.2 || currentEquity <= 0) {
      closeAllPositions();
      tradingAudio.play('ERROR');
      setHotkeyToast({
        id: Math.random().toString(),
        type: 'ALERT',
        title: '⚠️ MARGIN CALL - LIQUIDATION EXECUTED',
        subtitle: `Ekuitas (${currentEquity?.toFixed(2)}) berada di bawah Margin Pemeliharaan!`,
        symbol: 'RISK',
        timestamp: Date.now()
      });
    }
  }, [positions, balance, closeAllPositions]);

  const equity = balance + positions.reduce((sum, pos) => sum + (pos.pnl || 0), 0);
  const margin = positions.reduce((sum, pos) => sum + (pos.entryPrice * pos.size * 0.01), 0);
  const freeMargin = equity - margin;
  const marginLevel = margin > 0 ? (equity / margin) * 100 : 0;

  // Trade Performance Statistics
  const tradeStats = React.useMemo(() => {
    const totalTrades = tradeHistory.length;
    const wins = tradeHistory.filter((t: any) => (t.pnl || 0) > 0);
    const losses = tradeHistory.filter((t: any) => (t.pnl || 0) <= 0);
    const totalPnL = tradeHistory.reduce((sum: number, t: any) => sum + (t.pnl || 0), 0);
    const grossProfit = wins.reduce((sum: number, t: any) => sum + (t.pnl || 0), 0);
    const grossLoss = Math.abs(losses.reduce((sum: number, t: any) => sum + (t.pnl || 0), 0));
    const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
    const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;
    const winRate = totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
    const bestTrade = totalTrades > 0 ? Math.max(...tradeHistory.map((t: any) => t.pnl || 0)) : 0;
    const worstTrade = totalTrades > 0 ? Math.min(...tradeHistory.map((t: any) => t.pnl || 0)) : 0;
    const avgRR = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0;
    const unrealizedPnL = positions.reduce((sum: number, pos) => sum + (pos.pnl || 0), 0);
    // PnL Calendar: group by date
    const dailyPnL: Record<string, number> = {};
    tradeHistory.forEach((t: any) => {
      const d = new Date(t.closeTime || t.closedAt || Date.now());
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      dailyPnL[key] = (dailyPnL[key] || 0) + (t.pnl || 0);
    });

    // Weekly summary
    const weeklyPnL: Record<string, number> = {};
    Object.entries(dailyPnL).forEach(([date, pnl]) => {
      const d = new Date(date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const weekKey = weekStart.toISOString().slice(0, 10);
      weeklyPnL[weekKey] = (weeklyPnL[weekKey] || 0) + pnl;
    });

    return {
      totalTrades, winRate, profitFactor, totalPnL, grossProfit, grossLoss,
      avgWin, avgLoss, bestTrade, worstTrade, avgRR, unrealizedPnL,
      wins: wins.length, losses: losses.length,
      dailyPnL, weeklyPnL
    };
  }, [tradeHistory, positions]);

  // Calculate liquidation price for a position
  const calcLiquidationPrice = React.useCallback((entryPrice: number, size: number, leverage: number, side: 'BUY' | 'SELL', isForex: boolean) => {
    const marginReq = entryPrice * size * 0.01;
    const liqDistance = marginReq * 0.8 / (size * (isForex ? 100000 : 1));
    if (side === 'BUY') return entryPrice - liqDistance;
    return entryPrice + liqDistance;
  }, []);

  const instantSnipeListing = useCallback(async (coin: MexcNewListingItem, customUsdAlloc?: number) => {
    const symbol = coin.symbol;
    const entryPrice = coin.price || livePrices[symbol] || 0.001;
    const usdAlloc = customUsdAlloc || 100; // default $100 USD allocation
    const leverage = coin.maxLeverage || 20;

    // Check slippage guard
    const maxOrderCap = coin.slippageGuard?.maxOrderCapUsd || 2500;
    const safeUsdAlloc = Math.min(usdAlloc, maxOrderCap);

    // Calculate position size based on price and leverage
    const rawUnits = (safeUsdAlloc * leverage) / entryPrice;
    const size = parseFloat(rawUnits.toFixed(rawUnits > 1000 ? 0 : rawUnits > 10 ? 2 : 4));

    // Auto TP / SL calculation (+15% TP, -5% SL for listings)
    const tpPrice = entryPrice * 1.15;
    const slPrice = entryPrice * 0.95;

    try {
      tradingAudio.play('SNIPER_ALERT');
    } catch {}

    executeOrder({
      symbol,
      type: 'BUY',
      size,
      price: entryPrice,
      orderType: 'MARKET',
      takeProfit: tpPrice,
      stopLoss: slPrice,
      leverage,
      marginMode: 'Cross',
      autoBE: true
    });

    setHotkeyToast({
      id: Math.random().toString(),
      type: 'BUY',
      title: `🚀 SNIPER EXECUTION: ${symbol}`,
      subtitle: `Snipe $${safeUsdAlloc} @ ${entryPrice.toFixed(4)} (${leverage}x Lev | TP +15% / SL -5%)`,
      symbol,
      timestamp: Date.now()
    });
  }, [livePrices, executeOrder]);

  useEffect(() => {
    saveBrokerState({
      isConnected: true,
      broker: 'MountAlgo Pro',
      balance,
      positions,
      pendingOrders,
      tradeHistory,
      mtServer: 'Live',
      mtLogin: 'MountAlgo'
    });
  }, [balance, positions, pendingOrders, tradeHistory]);

  return (
    <TradeContext.Provider value={{
      balance,
      equity,
      margin,
      freeMargin,
      marginLevel,
      tradeStats,
      calcLiquidationPrice,
      positions,
      pendingOrders,
      tradeHistory,
      executionFills,
      executeOrder,
      cancelPendingOrder,
      cancelAllPendingOrders,
      updatePendingOrder,
      closePosition,
      partialClosePosition,
      reversePosition,
      closeAllPositions,
      toggleAutoBE,
      setBreakEvenWithOffset,
      scaleInPosition,
      updatePositionBracket,
      updateMultiBracketTP,
      updateLivePrice,
      livePrices,
      focusedSymbol,
      focusedChartId,
      setFocusedChart,
      volumePresets,
      setVolumePresets,
      activePresetIndex,
      setActivePresetIndex,
      hotkeysEnabled,
      setHotkeysEnabled,
      hotkeyMode,
      setHotkeyMode,
      hotkeyAudioEnabled,
      setHotkeyAudioEnabled,
      isHotkeyModalOpen,
      setIsHotkeyModalOpen,
      hotkeyToast,
      isInstantTradeEnabled,
      setIsInstantTradeEnabled,
      dismissHotkeyToast,
      quickTradeAction,
      connectedAccounts,
      activeAccountId,
      activeAccount,
      isAccountModalOpen,
      setIsAccountModalOpen,
      connectAccount,
      updateAccount,
      deleteAccount,
      switchActiveAccount,
      refreshAccountData,
      resetAccountBalance,
      autoRefreshIntervalSec,
      setAutoRefreshIntervalSec,
      brokerSyncedTrades,
      brokerOpenPositions,
      isSyncingBroker,
      brokerSymbols,
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
      isJournalModalOpen,
      setIsJournalModalOpen,
      chartJumpTarget,
      jumpToChartTarget,
      clearChartJumpTarget,
      serverTrailingStops,
      serverOCOs,
      wsStatus,
      createTrailingStopOnServer,
      createOCOOnServer,
      cancelServerOrderById,
      mexcSyncStatus,
      mexcNewListings,
      mexcNewListingStats,
      newListingState: {
        listings: mexcNewListings,
        stats: mexcNewListingStats
      },
      newListingToast,
      dismissNewListingToast,
      scanMexcNewListingsNow,
      refreshBrokerSymbols,
      instantSnipeListing
    }}>
      {children}
    </TradeContext.Provider>
  );
}

export function useTrade() {
  const context = useContext(TradeContext);
  if (context === undefined) {
    throw new Error('useTrade must be used within a TradeProvider');
  }
  return context;
}
