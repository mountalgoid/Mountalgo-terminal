import React, { useState, useEffect } from 'react';
import { useTrade } from '../context/TradeContext';
import { useTheme } from '../context/ThemeContext';
import InstitutionalAlgoPanel from './InstitutionalAlgoPanel';
import { 
  Activity, Clock, Sliders, TrendingDown, TrendingUp, X, 
  RefreshCw, Zap, Maximize, Wallet, Settings2, Plus, CheckCircle2, ChevronDown,
  BarChart3, Target, Shield, AlertTriangle, ArrowUpDown, ShieldCheck
} from 'lucide-react';
import { RiskDashboard } from './RiskDashboard';

interface ChartTradePanelProps {
  symbol: string;
  onSymbolChange?: (s: string) => void;
  currentPrice: number;
  isForex: boolean;
  riskManagerData?: {
    settings: any;
    currentDrawdown: number;
    isRiskExceeded: boolean;
    balance: number;
    equity: number;
  };
}

const ChartTradePanel = React.memo(function ChartTradePanel({ symbol, currentPrice, isForex, riskManagerData }: ChartTradePanelProps) {
  const { palette } = useTheme();
  const { 
    balance = 0, equity = 0, positions = [], pendingOrders = [], tradeHistory = [], 
    executeOrder, cancelPendingOrder, cancelAllPendingOrders, closePosition, reversePosition, closeAllPositions, toggleAutoBE, updatePositionBracket,
    partialClosePosition, setBreakEvenWithOffset, scaleInPosition, updateMultiBracketTP,
    livePrices = {},
    connectedAccounts = [], activeAccountId, activeAccount, switchActiveAccount, setIsAccountModalOpen,
    marginLevel = 0, freeMargin = 0, tradeStats = {}, calcLiquidationPrice,
    serverTrailingStops = [], serverOCOs = [], wsStatus = 'DISCONNECTED',
    createTrailingStopOnServer, createOCOOnServer, cancelServerOrderById
  } = useTrade();
  
  const [activeTab, setActiveTab] = useState<'trade' | 'pending' | 'positions' | 'history' | 'stats' | 'accounts' | 'risk'>('trade');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT' | 'OCO' | 'TRAILING_STOP' | 'TWAP' | 'VWAP' | 'ICEBERG'>('MARKET');
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  
  // Pro Trading States
  const [algoSettings, setAlgoSettings] = useState({
    duration: '60',
    participationRate: '5',
    visibleSize: '1.0',
    randomizeSize: true,
    startTime: ''
  });
  const [sizingMode, setSizingMode] = useState<'SIZE' | 'RISK'>('SIZE');
  const [size, setSize] = useState<string>(isForex ? '1.0' : '100.0');
  const [riskPct, setRiskPct] = useState<string>('1.0'); // 1%
  const [leverage, setLeverage] = useState<number>(activeAccount?.leverage || 10);
  const [marginMode, setMarginMode] = useState<'Cross' | 'Isolated'>('Cross');
  const [postOnly, setPostOnly] = useState<boolean>(false);
  const [reduceOnly, setReduceOnly] = useState<boolean>(false);
  const [timeInForce, setTimeInForce] = useState<'GTC' | 'IOC' | 'FOK' | 'DAY'>('GTC');
  const [autoBE, setAutoBE] = useState<boolean>(false);
  const [trailingStep, setTrailingStep] = useState<string>('');
  
  const [limitPrice, setLimitPrice] = useState<string>(currentPrice.toString());
  const [stopLimitPrice, setStopLimitPrice] = useState<string>((currentPrice * 0.99).toString());
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [stopLoss, setStopLoss] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [pctValue, setPctValue] = useState<number>(25);
  const [toastMessage, setToastMessage] = useState<{ side: string, symbol: string, size: number, orderType: string } | null>(null);
  
  // Ambient Volatility Glow Effect
  const [volatilityGlow, setVolatilityGlow] = useState<'bullish' | 'bearish' | 'void' | null>(null);
  const prevPriceRef = React.useRef(currentPrice);
  
  useEffect(() => {
    if (!currentPrice || !prevPriceRef.current) {
      prevPriceRef.current = currentPrice;
      return;
    }
    const diff = currentPrice - prevPriceRef.current;
    const pctChange = Math.abs(diff) / prevPriceRef.current;
    
    // Simulate HFT Delta Spike if price moves more than 0.05% instantly
    if (pctChange > 0.0005) {
      setVolatilityGlow(diff > 0 ? 'bullish' : 'bearish');
      const timer = setTimeout(() => setVolatilityGlow(null), 2500);
      prevPriceRef.current = currentPrice;
      return () => clearTimeout(timer);
    }
    prevPriceRef.current = currentPrice;
  }, [currentPrice]);

  useEffect(() => {
    if (orderType === 'MARKET') {
      setLimitPrice(currentPrice.toString());
    }
  }, [currentPrice, orderType]);

  // Reset size value when switching asset classes (forex vs crypto)
  useEffect(() => {
    setSize(isForex ? '1.0' : '100.0');
  }, [isForex]);


  const handlePercentageSize = (pct: number) => {
    const validPct = isNaN(pct) ? 0 : Math.min(100, Math.max(0, pct));
    setPctValue(validPct);
    if (sizingMode === 'SIZE') {
      const allocated = (balance * (validPct / 100)) * leverage;
      if (isForex) {
        const calculatedSize = Math.max(0.01, Number((allocated / 100000).toFixed(2)));
        setSize(calculatedSize.toString());
      } else {
        const calculatedSize = Math.max(10, Number(allocated.toFixed(2)));
        setSize(calculatedSize.toString());
      }
    } else {
      setRiskPct(validPct.toString());
    }
  };

  const calculateDynamicSize = (): number => {
    if (sizingMode === 'SIZE') {
      const numSize = parseFloat(size);
      if (isNaN(numSize) || numSize <= 0) return 0;
      // If crypto and sizing is in USD, convert USD amount to contract units (coins)
      if (!isForex) {
        return Number((numSize / currentPrice).toFixed(4));
      }
      return numSize;
    }
    
    // Risk-based sizing
    const rPct = parseFloat(riskPct);
    const sl = parseFloat(stopLoss);
    if (isNaN(rPct) || rPct <= 0 || isNaN(sl) || sl <= 0) return 0;
    
    const riskAmount = equity * (rPct / 100);
    const entry = orderType === 'MARKET' ? currentPrice : parseFloat(limitPrice);
    
    if (isNaN(entry) || entry <= 0 || entry === sl) return 0;
    const priceDiff = Math.abs(entry - sl);
    const multiplier = isForex ? 100000 : 1;
    
    // riskAmount = size * priceDiff * multiplier
    const calculatedSize = riskAmount / (priceDiff * multiplier);
    return isForex ? Math.max(0.01, Number(calculatedSize.toFixed(2))) : Math.max(1, Number(calculatedSize.toFixed(4)));
  };

  const handleAction = (side: 'BUY' | 'SELL') => {
    const numSize = calculateDynamicSize();
    if (numSize <= 0) {
      // Non-blocking feedback instead of blocking alert() — faster for scalping
      setToastMessage({ side, symbol, size: 0, orderType });
      setTimeout(() => setToastMessage(null), 2000);
      return;
    }

    if (orderType === 'TRAILING_STOP' && createTrailingStopOnServer) {
      createTrailingStopOnServer({
        symbol,
        side,
        quantity: numSize,
        entryPrice: currentPrice,
        callbackRate: parseFloat(trailingStep) || 1.0,
        activationPrice: parseFloat(limitPrice) || undefined,
      });
    } else if (orderType === 'OCO' && createOCOOnServer && takeProfit && stopLoss) {
      createOCOOnServer({
        symbol,
        side,
        quantity: numSize,
        entryPrice: currentPrice,
        takeProfitPrice: parseFloat(takeProfit),
        stopLossPrice: parseFloat(stopLoss),
      });
    } else {
      executeOrder({
        symbol,
        type: side,
        orderType,
        size: numSize,
        price: orderType === 'MARKET' ? currentPrice : parseFloat(limitPrice),
        stopLimitPrice: parseFloat(stopLimitPrice) || undefined,
        takeProfit: parseFloat(takeProfit) || undefined,
        stopLoss: parseFloat(stopLoss) || undefined,
        leverage,
        marginMode,
        autoBE,
        trailingStep: parseFloat(trailingStep) || undefined,
        timeInForce,
        postOnly,
        reduceOnly,
        algoSettings: (orderType === 'TWAP' || orderType === 'VWAP' || orderType === 'ICEBERG') ? algoSettings : undefined
      });
    }
    
    setToastMessage({ side, symbol, size: numSize, orderType });
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <div className={`w-full h-full panel-material flex flex-col font-sans overflow-hidden ${volatilityGlow ? `volatility-glow-${volatilityGlow}` : ''}`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div style={{ backgroundColor: `${toastMessage.side === 'BUY' ? palette.bull : palette.bear}90` }} 
               className="px-3 py-1 rounded-full border border-white/20 text-[var(--color-text)] text-xs font-bold shadow-[0_0_10px_rgba(0,0,0,0.5)] backdrop-blur-md">
            {toastMessage.orderType} {toastMessage.side} EXECUTED
            <div className="text-[9px] text-center opacity-80">
              {toastMessage.size} {toastMessage.symbol}
            </div>
          </div>
        </div>
      )}

      {/* Account Info & Broker Switcher Header Bar */}
      <div className="bg-[var(--color-panel)] border-b border-[var(--color-border)] p-1.5 flex items-center justify-between gap-1.5 relative">
        <div className="relative flex-1 min-w-0">
          <button
            onClick={() => setShowAccountDropdown(!showAccountDropdown)}
            className="w-full flex items-center justify-between gap-1.5 px-2 py-1 rounded bg-[var(--color-bg)] border border-[var(--color-border)] hover:border-white/20 transition-all text-left cursor-pointer"
            title="Klik untuk mengganti akun broker aktif"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full `bg-[${palette.bull}]` shrink-0 animate-pulse" />
              <span className="text-[11px] font-bold text-[var(--color-text)] truncate">
                {activeAccount?.name || 'MountAlgo Paper Demo'}
              </span>
              <span 
                style={{ backgroundColor: `${palette.bull}20`, color: palette.bull }}
                className="text-[8.5px] font-mono px-1 py-0.2 rounded uppercase font-bold shrink-0 hidden xs:inline"
              >
                {activeAccount?.broker || 'DEMO'}
              </span>
            </div>
            <ChevronDown size={12} className="text-[var(--color-text-muted)] shrink-0" />
          </button>

          {/* Account Fast Dropdown */}
          {showAccountDropdown && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowAccountDropdown(false)} 
              />
              <div 
                className="absolute left-0 top-full mt-1 w-64 bg-[var(--color-panel)] border border-[var(--color-border)] rounded-xl shadow-2xl z-50 p-1 space-y-1 animate-in fade-in slide-in-from-top-1"
                style={{ boxShadow: `0 10px 30px rgba(0,0,0,0.7), 0 0 10px ${palette.bull}20` }}
              >
                <div className="px-2 py-1 text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider flex justify-between items-center border-b border-[var(--color-border)]">
                  <span>Pilih Akun Aktif</span>
                  <span className="text-[9px] font-mono">{connectedAccounts.length} Akun</span>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-0.5 custom-scrollbar">
                  {connectedAccounts.map((acc) => {
                    const isSel = acc.id === activeAccountId;
                    return (
                      <button
                        key={acc.id}
                        onClick={() => {
                          switchActiveAccount(acc.id);
                          setShowAccountDropdown(false);
                        }}
                        style={isSel ? { borderColor: palette.bull, backgroundColor: `${palette.bull}15` } : {}}
                        className={`w-full p-1.5 rounded-lg border text-left transition-colors flex items-center justify-between cursor-pointer ${
                          isSel ? 'text-[var(--color-text)]' : 'border-transparent hover:bg-[var(--color-bg)] text-[var(--color-text-muted)]'
                        }`}
                      >
                        <div className="min-w-0 pr-1">
                          <div className="text-[11px] font-bold truncate text-[var(--color-text)]">{acc.name}</div>
                          <div className="text-[9px] text-[var(--color-text-muted)] font-mono">{acc.broker} • {acc.isReal ? 'REAL' : 'DEMO'}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[10px] font-mono font-bold text-[var(--color-text)]">
                            {acc.currency} {acc.balance.toLocaleString()}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="pt-1 border-t border-[var(--color-border)] flex gap-1">
                  <button
                    onClick={() => {
                      setIsAccountModalOpen(true);
                      setShowAccountDropdown(false);
                    }}
                    style={{ backgroundColor: `${palette.bull}20`, color: palette.bull }}
                    className="flex-1 text-[10px] font-bold py-1.5 rounded-lg text-center hover:opacity-80 transition-opacity flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Settings2 size={12} />
                    <span>Kelola Semua Akun</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Quick Open Account Manager Modal Button */}
        <button
          onClick={() => setIsAccountModalOpen(true)}
          className="p-1.5 rounded bg-[var(--color-bg)] border border-[var(--color-border)] hover:border-white/30 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer shrink-0"
          title="Buka Pengaturan Kelola Akun Broker Lengkap"
        >
          <Settings2 size={13} style={{ color: palette.bull }} />
        </button>
      </div>

      {/* Tabs - Mobile optimized */}
      <div className="flex bg-[var(--color-panel)] border-b border-[var(--color-border)] p-0.5 sm:p-1 gap-0.5 sm:gap-1 overflow-x-auto hide-scrollbar">
        {[
          { id: 'trade', icon: Zap, label: 'Trade' },
          { id: 'pending', icon: Clock, label: `Pending (${pendingOrders.length})` },
          { id: 'positions', icon: Activity, label: `Pos (${positions.length})` },
          { id: 'history', icon: CheckCircle2, label: 'Hist' },
          { id: 'stats', icon: BarChart3, label: 'Stats' },
          { id: 'risk', icon: ShieldCheck, label: 'Risk' },
          { id: 'accounts', icon: Wallet, label: 'Akun' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex-1 min-w-[48px] sm:min-w-[62px] flex items-center justify-center gap-0.5 sm:gap-1 py-1 sm:py-1.5 text-[9px] sm:text-[10.5px] font-bold rounded cursor-pointer transition-colors tap-fix ${
              activeTab === t.id 
                ? 'bg-[var(--color-bg)] text-[var(--color-text)] border border-[var(--color-border)]' 
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <t.icon size={11} />
            <span className="truncate">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Account Dashboard - Always Visible */}
      <div className="px-1.5 sm:px-2 py-1 sm:py-1.5 bg-[var(--color-bg)] border-b border-[var(--color-border)]">
        <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
          <div className="flex flex-col items-center p-1 rounded bg-[var(--color-panel)] border border-[var(--color-border)]">
            <span className="text-[8px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Equity</span>
            <span className="text-[11px] font-mono font-extrabold text-[var(--color-text)]">{equity.toFixed(2)}</span>
          </div>
          <div className="flex flex-col items-center p-1 rounded bg-[var(--color-panel)] border border-[var(--color-border)]">
            <span className="text-[8px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Free Margin</span>
            <span className={`text-[11px] font-mono font-extrabold ${freeMargin >= 0 ? `text-[${palette.bull}]` : `text-[${palette.bear}]`}`}>{freeMargin.toFixed(2)}</span>
          </div>
          <div className="flex flex-col items-center p-1 rounded bg-[var(--color-panel)] border border-[var(--color-border)]">
            <span className="text-[8px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Unrealized</span>
            <span className={`text-[11px] font-mono font-extrabold ${(tradeStats?.unrealizedPnL || 0) >= 0 ? `text-[${palette.bull}]` : `text-[${palette.bear}]`}`}>
              {(tradeStats?.unrealizedPnL || 0) >= 0 ? '+' : ''}{(tradeStats?.unrealizedPnL || 0).toFixed(2)}
            </span>
          </div>
        </div>
        {/* Margin Level Bar */}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[8px] font-bold text-[var(--color-text-muted)] uppercase whitespace-nowrap">Margin Lv</span>
          <div className="flex-1 h-1.5 rounded-full bg-[var(--color-panel)] overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ 
                width: `${Math.min(100, marginLevel)}%`,
                backgroundColor: marginLevel > 200 ? '#22c55e' : marginLevel > 100 ? '#eab308' : '#ef4444'
              }}
            />
          </div>
          <span className={`text-[9px] font-mono font-bold ${marginLevel > 200 ? `text-[${palette.bull}]` : marginLevel > 100 ? '`text-[${palette.poc}]`' : `text-[${palette.bear}]`}`}>
            {marginLevel.toFixed(0)}%
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {activeTab === 'trade' && (
          <div className="flex flex-col h-full gap-3">
            {/* Account Info & Status Badges */}
            <div className="flex flex-col gap-1.5 bg-[var(--color-panel)] p-2 rounded border border-[var(--color-border)]">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[9.5px] text-[var(--color-text-muted)] font-bold tracking-wider">EQUITY ({activeAccount?.currency || 'USDT'})</span>
                  <span className="font-bold text-sm text-[var(--color-text)]">${equity.toFixed(2)}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[9.5px] text-[var(--color-text-muted)] font-bold tracking-wider">SALDO TERSEDIA</span>
                  <span className="font-bold text-sm text-[#00f2fe]">${balance.toFixed(2)}</span>
                </div>
              </div>

              {/* Status Badges for Copy Trading / Risk Guard */}
              <div className="flex items-center gap-1 pt-1 border-t border-[var(--color-border)]/50 flex-wrap">
                {activeAccount?.copyTrade?.isMasterAccount && (
                  <span style={{ backgroundColor: `${palette.poc}20`, color: palette.poc, borderColor: `${palette.poc}40` }} className="text-[8.5px] font-bold font-mono px-1.5 py-0.2 rounded border">
                    👑 Master Copy
                  </span>
                )}
                {activeAccount?.riskGuard?.maxDailyLoss ? (
                  <span style={{ backgroundColor: `${palette.poc}20`, color: palette.poc, borderColor: `${palette.poc}40` }} className="text-[8.5px] font-bold font-mono px-1.5 py-0.2 rounded border">
                    🛡️ Risk Guard: Max Loss ${activeAccount.riskGuard.maxDailyLoss}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Order Type Selector */}
            <div className="flex flex-col gap-1 bg-[var(--color-panel)] p-1 rounded border border-[var(--color-border)]">
              <span className="text-[9px] font-bold text-[var(--color-text-muted)] px-1 uppercase tracking-wider flex justify-between items-center">
                <span>Order Type Execution</span>
                <span className={`text-[8.5px] font-mono px-1 rounded font-bold ${wsStatus === 'CONNECTED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                  {wsStatus === 'CONNECTED' ? '⚡ WS REALTIME' : '⚠️ OFFLINE'}
                </span>
              </span>
              <div className="flex flex-col gap-1">
                <div className="grid grid-cols-6 gap-0.5">
                  {(['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT', 'OCO', 'TRAILING_STOP'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setOrderType(type as any)}
                      className={`py-1 text-[8.5px] sm:text-[9.5px] font-extrabold rounded transition-colors cursor-pointer truncate ${
                        orderType === (type as any)
                          ? 'bg-[var(--color-bg)] text-[var(--color-text)] border border-[var(--color-border)] shadow-sm' 
                          : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                      }`}
                    >
                      {type === 'STOP_LIMIT' ? 'STP-LMT' : type === 'TRAILING_STOP' ? 'TRAIL' : type}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-0.5">
                  {(['TWAP', 'VWAP', 'ICEBERG'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setOrderType(type)}
                      className={`py-1 text-[9px] font-bold rounded transition-colors cursor-pointer truncate flex items-center justify-center gap-1 ${
                        orderType === type 
                          ? `bg-[${palette.poc}20] text-[${palette.poc}] border border-[${palette.poc}40]` 
                          : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:`text-[${palette.poc}]` border border-transparent'
                      }`}
                    >
                      <Zap size={10} className={orderType === type ? '`text-[${palette.poc}]`' : '`text-[var(--color-text-muted)]`'} />
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {(orderType === 'TWAP' || orderType === 'VWAP' || orderType === 'ICEBERG') && (
              <InstitutionalAlgoPanel
                orderType={orderType}
                algoSettings={algoSettings}
                setAlgoSettings={setAlgoSettings}
                symbol={symbol}
              />
            )}

            {/* Time In Force (TIF) & Order Flags */}
            <div className="flex justify-between items-center bg-[var(--color-panel)] p-1.5 rounded border border-[var(--color-border)] gap-2">
              <div className="flex items-center gap-1 text-[10px]">
                <span className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase">TIF:</span>
                {(['GTC', 'IOC', 'FOK'] as const).map((tif) => (
                  <button
                    key={tif}
                    type="button"
                    onClick={() => setTimeInForce(tif)}
                    className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded cursor-pointer ${
                      timeInForce === tif ? '`bg-[${palette.poc}] text-[#000000]`' : 'bg-[var(--color-bg)] text-[var(--color-text-muted)]'
                    }`}
                  >
                    {tif}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 text-[9px]">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={postOnly} onChange={e => setPostOnly(e.target.checked)} className="accent-[#5134ff]" />
                  <span className="text-[9px] text-[var(--color-text-muted)]">Post</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={reduceOnly} onChange={e => setReduceOnly(e.target.checked)} className="accent-[#5134ff]" />
                  <span className="text-[9px] text-[var(--color-text-muted)]">Reduce</span>
                </label>
              </div>
            </div>

            {/* Pro Settings (Margin & Leverage) */}
            <div className="flex gap-2">
              <button 
                onClick={() => setMarginMode(m => m === 'Cross' ? 'Isolated' : 'Cross')}
                className="flex-1 bg-[var(--color-panel)] border border-[var(--color-border)] rounded p-1.5 text-[10px] font-bold text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] transition-colors cursor-pointer"
              >
                {marginMode}
              </button>
              <div className="flex-1 flex items-center bg-[var(--color-panel)] border border-[var(--color-border)] rounded px-2">
                <span className="text-[10px] text-[var(--color-text-muted)] font-bold">Lev:</span>
                <input 
                  type="number" 
                  value={leverage} 
                  onChange={e => setLeverage(Number(e.target.value))}
                  className="w-full bg-transparent text-right text-xs font-mono text-[var(--color-text)] focus:outline-none"
                  min="1" max="125"
                />
                <span className="text-[10px] text-[var(--color-text-muted)] font-bold">x</span>
              </div>
            </div>

            {/* Sizing Mode & Percentage Drag Slider */}
            <div className="flex flex-col gap-2 bg-[var(--color-panel)] p-2 rounded border border-[var(--color-border)]">
              <div className="flex justify-between items-center">
                <div className="flex bg-[var(--color-bg)] rounded p-0.5 border border-[var(--color-border)]">
                  <button 
                    type="button"
                    onClick={() => setSizingMode('SIZE')}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer transition-colors ${sizingMode === 'SIZE' ? '`bg-[${palette.poc}] text-[#000000]` shadow' : 'text-[var(--color-text-muted)]'}`}
                  >
                    Nominal Size
                  </button>
                  <button 
                    type="button"
                    onClick={() => setSizingMode('RISK')}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer transition-colors ${sizingMode === 'RISK' ? '`bg-[${palette.poc}] text-[#000000]` shadow' : 'text-[var(--color-text-muted)]'}`}
                  >
                    % Risk Capital
                  </button>
                </div>
                {sizingMode === 'SIZE' ? (
                  <span className="text-[10px] text-[var(--color-text-muted)] font-mono">Max: {isForex ? '100.00' : (equity * leverage).toFixed(2)}</span>
                ) : (
                  <span className="text-[10px] `text-[${palette.poc}]` font-mono font-semibold">Butuh Stop Loss</span>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <span className="text-[9px] text-[var(--color-text-muted)] font-bold block mb-0.5 uppercase">Volume Trading</span>
                  <input
                    type="number"
                    value={sizingMode === 'SIZE' ? size : riskPct}
                    onChange={(e) => sizingMode === 'SIZE' ? setSize(e.target.value) : setRiskPct(e.target.value)}
                    className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded p-1.5 text-xs font-mono font-bold text-[var(--color-text)] focus:outline-none focus:border-[var(--color-bull)]"
                    step={isForex || sizingMode === 'RISK' ? "0.01" : "1"}
                    min={isForex || sizingMode === 'RISK' ? "0.01" : "10"}
                  />
                  <div className="absolute right-2 bottom-1.5 text-[10px] font-bold text-[var(--color-text-muted)] pointer-events-none">
                    {sizingMode === 'SIZE' ? (isForex ? 'LOTS' : 'USD') : '%'}
                  </div>
                </div>

                <div className="relative">
                  <span className="text-[9px] text-[var(--color-text-muted)] font-bold block mb-0.5 uppercase">Persentase Manual</span>
                  <div className="flex items-center">
                    <input
                      type="number"
                      step="0.5"
                      min="0.1"
                      max="100"
                      value={pctValue}
                      onChange={(e) => handlePercentageSize(parseFloat(e.target.value))}
                      className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded p-1.5 text-xs font-mono font-bold text-[var(--color-text)] focus:outline-none focus:border-[var(--color-bull)]"
                    />
                    <span className="absolute right-2 bottom-1.5 text-[10px] font-bold text-[var(--color-text-muted)]">%</span>
                  </div>
                </div>
              </div>

              {/* Slider Geser Dynamic Size Percentage */}
              <div className="flex flex-col gap-1 mt-0.5">
                <div className="flex justify-between items-center text-[9.5px] font-mono text-[var(--color-text-muted)] font-semibold">
                  <span>Slide Ukuran:</span>
                  <span className="text-[#00f2fe] font-bold">{pctValue}% Saldo</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  value={pctValue}
                  onChange={(e) => handlePercentageSize(Number(e.target.value))}
                  className="w-full h-1.5 bg-[var(--color-bg)] rounded-lg appearance-none cursor-pointer accent-[#5134ff]"
                />
              </div>

              {/* Quick Percentage Pills */}
              <div className="flex items-center justify-between gap-1">
                {(sizingMode === 'SIZE' ? [10, 25, 50, 75, 100] : [0.5, 1, 2, 3, 5]).map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handlePercentageSize(pct)}
                    className={`flex-1 border rounded py-1 text-[9.5px] font-bold transition-all cursor-pointer ${
                      pctValue === pct
                        ? `bg-[${palette.poc}] text-[#000000] border-[${palette.poc}] shadow-sm`
                        : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:text-[var(--color-text)]'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Price Inputs depending on Order Type */}
            {orderType !== 'MARKET' && (
              <div className="flex flex-col gap-2 mt-1 bg-[var(--color-panel)] p-2 rounded border border-[var(--color-border)]">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-[var(--color-text-muted)]">
                    {orderType === 'LIMIT' ? 'Limit Price' : orderType === 'STOP' ? 'Stop Trigger Price' : 'Primary Price'}
                  </span>
                  <input
                    type="number"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded p-1.5 text-xs font-mono text-[var(--color-text)] focus:outline-none focus:border-[var(--color-bull)]"
                    step="0.0001"
                  />
                </div>

                {(orderType === 'STOP_LIMIT' || orderType === 'OCO') && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-[var(--color-text-muted)]">
                      {orderType === 'STOP_LIMIT' ? 'Secondary Limit Price' : 'OCO Secondary Trigger Price'}
                    </span>
                    <input
                      type="number"
                      value={stopLimitPrice}
                      onChange={(e) => setStopLimitPrice(e.target.value)}
                      className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded p-1.5 text-xs font-mono text-[var(--color-text)] focus:outline-none focus:border-[var(--color-bull)]"
                      step="0.0001"
                    />
                  </div>
                )}

                {/* Inline TP/SL for Limit & Stop Orders */}
                {(orderType === 'LIMIT' || orderType === 'STOP' || orderType === 'STOP_LIMIT' || orderType === 'OCO') && (
                  <div className="flex gap-2 pt-1 border-t border-[var(--color-border)]/50">
                    <div className="flex-1 flex flex-col gap-1">
                      <span className="text-[9px] font-bold text-[${palette.bull}cc] uppercase tracking-wider flex items-center gap-1">
                        🎯 Take Profit
                      </span>
                      <input
                        type="number"
                        value={takeProfit}
                        onChange={(e) => setTakeProfit(e.target.value)}
                        placeholder="TP Price"
                        className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded p-1.5 text-xs font-mono text-[var(--color-text)] focus:outline-none `focus:border-[${palette.bull}]` transition-colors"
                        step="0.0001"
                      />
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                      <span className="text-[9px] font-bold `text-[${palette.bear}cc]` uppercase tracking-wider flex items-center gap-1">
                        🛡️ Stop Loss
                      </span>
                      <input
                        type="number"
                        value={stopLoss}
                        onChange={(e) => setStopLoss(e.target.value)}
                        placeholder="SL Price"
                        className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded p-1.5 text-xs font-mono text-[var(--color-text)] focus:outline-none `focus:border-[${palette.bear}]` transition-colors"
                        step="0.0001"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <button 
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] mt-2 cursor-pointer p-1 bg-[var(--color-panel)] rounded border border-[var(--color-border)]"
            >
              <span className="font-bold">Advanced Brackets (TP/SL)</span>
              <Sliders size={12} />
            </button>
            
            {showAdvanced && (
              
              <div className="flex flex-col gap-2 bg-[var(--color-panel)] border border-[var(--color-border)] p-2 rounded">
                <div className="flex gap-2">
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-[var(--color-text-muted)]">Take Profit</span>
                    <input
                      type="number"
                      value={takeProfit}
                      onChange={(e) => setTakeProfit(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded p-1.5 text-xs font-mono text-[var(--color-text)] focus:outline-none focus:border-green-500 transition-colors"
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-[var(--color-text-muted)]">Stop Loss</span>
                    <input
                      type="number"
                      value={stopLoss}
                      onChange={(e) => setStopLoss(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded p-1.5 text-xs font-mono text-[var(--color-text)] focus:outline-none `focus:border-[${palette.bear}]` transition-colors"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2 items-end">
                  <label className="flex-1 flex items-center gap-1.5 cursor-pointer border border-[var(--color-border)] bg-[var(--color-bg)] p-1.5 rounded">
                    <input type="checkbox" checked={autoBE} onChange={e => setAutoBE(e.target.checked)} className="accent-[#5134ff]" />
                    <span className="text-[9px] font-bold text-[var(--color-text-muted)]">Auto BE</span>
                  </label>
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-[var(--color-text-muted)]">Trailing Step (Pips/Pts)</span>
                    <input
                      type="number"
                      value={trailingStep}
                      onChange={(e) => setTrailingStep(e.target.value)}
                      placeholder="Optional"
                      className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded p-1 text-xs font-mono text-[var(--color-text)] focus:outline-none focus:border-[var(--color-bull)] transition-colors"
                    />
                  </div>
                </div>
              </div>

            )}

            {/* Pre-Trade Info Summary */}
            <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded p-2 mt-2 space-y-1">
              <div className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Order Preview</div>
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-[var(--color-text-muted)]">Required Margin</span>
                <span className="font-bold text-[var(--color-text)]">
                  {((orderType === 'MARKET' ? currentPrice : parseFloat(limitPrice) || currentPrice) * calculateDynamicSize() * 0.01).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-[var(--color-text-muted)]">Est. Fee (0.04%)</span>
                <span className="font-bold `text-[${palette.poc}]`">
                  -{((orderType === 'MARKET' ? currentPrice : parseFloat(limitPrice) || currentPrice) * calculateDynamicSize() * 0.0004).toFixed(2)}
                </span>
              </div>
              {takeProfit && stopLoss && (
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-[var(--color-text-muted)]">Risk:Reward</span>
                  <span className="font-bold `text-[${palette.poc}]`">
                    1:{(Math.abs(parseFloat(takeProfit) - currentPrice) / Math.abs(currentPrice - parseFloat(stopLoss))).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-[var(--color-text-muted)]">Buying Power</span>
                <span className="font-bold text-[var(--color-text)]">
                  {((freeMargin) * leverage).toFixed(0)}
                </span>
              </div>
            </div>

            <div className="flex gap-2 mt-auto pt-2">
              <button 
                type="button"
                onClick={() => handleAction('SELL')}
                style={{ backgroundColor: `${palette.bear}20`, color: palette.bear, border: `1px solid ${palette.bear}50` }}
                className="flex-1 min-h-[44px] rounded py-3 font-bold text-sm hover:brightness-125 transition-all shadow-lg active:scale-95 flex flex-col items-center gap-1 cursor-pointer"
              >
                <div className="flex items-center gap-1">
                  <TrendingDown size={14} /> SELL
                </div>
              </button>
              
              <button 
                type="button"
                onClick={() => handleAction('BUY')}
                style={{ backgroundColor: `${palette.bull}20`, color: palette.bull, border: `1px solid ${palette.bull}50` }}
                className="flex-1 min-h-[44px] rounded py-3 font-bold text-sm hover:brightness-125 transition-all shadow-lg active:scale-95 flex flex-col items-center gap-1 cursor-pointer"
              >
                <div className="flex items-center gap-1">
                  <TrendingUp size={14} /> BUY
                </div>
              </button>
            </div>
            
            {sizingMode === 'RISK' && calculateDynamicSize() > 0 && (
              <div className="text-center mt-2">
                <span className="text-[10px] text-[var(--color-text-muted)] font-mono">Calculated Size: <strong className="text-[var(--color-text)]">{calculateDynamicSize()}</strong> {isForex ? 'Lots' : 'Units'}</span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="flex flex-col gap-2">
            {/* Server-Side Active Orders (Trailing Stop & OCO) */}
            {(serverTrailingStops.length > 0 || serverOCOs.length > 0) && (
              <div className="flex flex-col gap-1.5 p-2 bg-[var(--color-bg)] rounded border border-[var(--color-border)]">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                  ⚡ SERVER-SIDE ENGINE ORDERS ({serverTrailingStops.length + serverOCOs.length})
                </span>
                
                {/* Trailing Stops */}
                {serverTrailingStops.map((ts) => (
                  <div key={ts.id} className="p-2 bg-[var(--color-panel)] border border-amber-500/30 rounded flex justify-between items-center text-xs">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold px-1 rounded bg-amber-500/20 text-amber-300">
                          TRAIL STOP
                        </span>
                        <span className="font-bold">{ts.symbol}</span>
                        <span className="text-[10px] font-mono text-[var(--color-text-muted)]">{ts.side} {ts.quantity}</span>
                      </div>
                      <span className="text-[9px] font-mono text-[var(--color-text-muted)] mt-0.5">
                        HighMark: ${ts.highWaterMark} | Rate: {ts.callbackRate}%
                      </span>
                    </div>
                    <button
                      onClick={() => cancelServerOrderById(ts.id)}
                      className="text-rose-400 hover:text-rose-300 p-1"
                      title="Batalkan Server Order"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}

                {/* OCO Brackets */}
                {serverOCOs.map((oco) => (
                  <div key={oco.id} className="p-2 bg-[var(--color-panel)] border border-blue-500/30 rounded flex justify-between items-center text-xs">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold px-1 rounded bg-blue-500/20 text-blue-300">
                          OCO BRACKET
                        </span>
                        <span className="font-bold">{oco.symbol}</span>
                        <span className="text-[10px] font-mono text-[var(--color-text-muted)]">{oco.side} {oco.quantity}</span>
                      </div>
                      <span className="text-[9px] font-mono text-[var(--color-text-muted)] mt-0.5">
                        TP: ${oco.takeProfitPrice} | SL: ${oco.stopLossPrice}
                      </span>
                    </div>
                    <button
                      onClick={() => cancelServerOrderById(oco.id)}
                      className="text-rose-400 hover:text-rose-300 p-1"
                      title="Batalkan Server Order"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {pendingOrders.length > 0 && (
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-[var(--color-text-muted)]">Pending Orders ({pendingOrders.length})</span>
                <button 
                  onClick={() => cancelAllPendingOrders()}
                  style={{ backgroundColor: `${palette.poc}15`, color: palette.poc, borderColor: `${palette.poc}30` }} className="text-[10px] font-bold px-2.5 py-1.5 min-h-[32px] rounded cursor-pointer border flex items-center gap-1"
                >
                  <X size={10} /> BATALKAN SEMUA
                </button>
              </div>
            )}

            {pendingOrders.length === 0 && serverTrailingStops.length === 0 && serverOCOs.length === 0 ? (
              <div className="text-center text-[var(--color-text-muted)] text-xs mt-10">
                <Clock className="mx-auto mb-2 opacity-40" size={24} />
                Tidak ada pending order aktif
              </div>
            ) : (
              pendingOrders.map((ord) => (
                <div key={ord.id} className="bg-[var(--color-panel)] border border-[var(--color-border)] p-2.5 rounded flex flex-col gap-1.5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[var(--color-border)]/60 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${ord.type === 'BUY' ? `bg-[${palette.bull}20] text-[${palette.bull}]` : `bg-[${palette.bear}20] text-[${palette.bear}]`}`}>
                        {ord.type} {ord.orderType}
                      </span>
                      <span className="font-bold text-xs">{ord.symbol}</span>
                      <span className="text-[10px] text-[var(--color-text-muted)] font-mono">{ord.size} lots</span>
                    </div>
                    <button
                      onClick={() => cancelPendingOrder(ord.id)}
                      style={{ color: palette.bear }} className="p-1 rounded transition-colors" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${palette.bear}20`} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ""}
                      title="Batalkan Order"
                    >
                      <X size={12} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-[var(--color-text-muted)]">Target Price:</span>
                      <span className="font-bold text-[var(--color-text)]">${ord.price}</span>
                    </div>
                    {ord.stopLimitPrice && (
                      <div className="flex flex-col">
                        <span className="text-[9px] text-[var(--color-text-muted)] font-mono">Trigger/Sec:</span>
                        <span className="font-bold text-[var(--color-text)]">${ord.stopLimitPrice}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-[var(--color-text-muted)] pt-1 border-t border-[var(--color-border)]/40">
                    <span>TIF: {ord.timeInForce || 'GTC'}</span>
                    {ord.ocoLinkedOrderId && (
                      <span className="`text-[${palette.poc}]` font-bold">🔗 Linked OCO</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'positions' && (
          <div className="flex flex-col gap-2">
            {positions.length > 0 && (
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-[var(--color-text-muted)]">Active ({positions.length})</span>
                <button 
                  onClick={() => closeAllPositions()}
                  className="text-[10px] font-bold `bg-[${palette.bear}15] text-[${palette.bear}] hover:bg-[${palette.bear}30]` px-3 py-2 min-h-[36px] rounded cursor-pointer border `border-[${palette.bear}30]` flex items-center gap-1"
                >
                  <X size={10} /> FLATTEN ALL
                </button>
              </div>
            )}
            
            {positions.length === 0 ? (
              <div className="text-center text-[var(--color-text-muted)] text-xs mt-10">No active positions</div>
            ) : (
              positions.map((pos, idx) => (
                <div key={`${pos.id}-${idx}`} className="bg-[var(--color-panel)] border border-[var(--color-border)] p-2 rounded flex flex-col gap-1.5">
                  <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs">{pos.symbol}</span>
                      <span className="text-[9px] bg-[var(--color-bg)] px-1 rounded text-[var(--color-text-muted)] border border-[var(--color-border)]">{pos.leverage || 10}x {pos.marginMode?.charAt(0) || 'C'}</span>
                      {pos.timestamp && (
                        <span className="text-[8px] text-[var(--color-text-muted)] font-mono">
                          {Math.floor((Date.now() - pos.timestamp) / 60000)}m
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-end">
                      <span style={{ color: (pos.pnl || 0) >= 0 ? palette.bull : palette.bear }} className="font-bold text-xs font-mono">
                        {(pos.pnl || 0) >= 0 ? '+' : ''}{(pos.pnl || 0).toFixed(2)}
                      </span>
                      <span style={{ color: (pos.pnl || 0) >= 0 ? palette.bull : palette.bear }} className="text-[8px] font-mono font-bold">
                        {pos.entryPrice > 0 ? (((pos.pnl || 0) / (pos.entryPrice * pos.size * 0.01)) * 100).toFixed(1) : '0.0'}% ROI
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-[11px] font-mono">
                    <span style={{ color: pos.type === 'BUY' ? palette.bull : palette.bear }} className="font-bold">
                      {pos.type} {pos.size}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-[var(--color-text-muted)]">
                      <span>In: {pos.entryPrice}</span>
                      <span>Cur: {livePrices[pos.symbol] || pos.currentPrice}</span>
                    </div>
                  </div>
                  {/* TP/SL & Liquidation Info */}
                  <div className="flex flex-wrap gap-1.5 text-[9px] font-mono">
                    {pos.takeProfit && (
                      <span style={{ backgroundColor: `${palette.bull}15`, color: palette.bull, borderColor: `${palette.bull}20` }} className="flex items-center gap-0.5 px-1.5 py-0.5 rounded border">
                        <Target size={8} /> TP: {pos.takeProfit}
                      </span>
                    )}
                    {pos.stopLoss && (
                      <span style={{ backgroundColor: `${palette.bear}15`, color: palette.bear, borderColor: `${palette.bear}20` }} className="flex items-center gap-0.5 px-1.5 py-0.5 rounded border">
                        <Shield size={8} /> SL: {pos.stopLoss}
                      </span>
                    )}
                    <span style={{ backgroundColor: `${palette.poc}10`, color: palette.poc, borderColor: `${palette.poc}15` }} className="flex items-center gap-0.5 px-1.5 py-0.5 rounded border">
                      <AlertTriangle size={8} /> Liq: {calcLiquidationPrice ? calcLiquidationPrice(pos.entryPrice, pos.size, pos.leverage || 10, pos.type, pos.symbol === 'EURUSD' || pos.symbol === 'GBPUSD' || pos.symbol === 'USDJPY' || pos.symbol === 'XAUUSD').toFixed(pos.symbol === 'EURUSD' || pos.symbol === 'GBPUSD' ? 4 : 2) : '—'}
                    </span>
                  </div>
                  
                  {/* Pro Institutional Quick Actions */}
                  <div className="flex flex-col gap-1 mt-1 pt-1 border-t border-[var(--color-border)]">
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => setBreakEvenWithOffset ? setBreakEvenWithOffset(pos.id, 1.0) : toggleAutoBE(pos.id)}
                        style={{ backgroundColor: `${palette.poc}10`, color: palette.poc, borderColor: `${palette.poc}20` }} className="flex-1 flex items-center justify-center gap-0.5 text-[8.5px] font-bold min-h-[30px] border py-1 rounded cursor-pointer transition-colors"
                        title="Set Break-Even + 1.0 Pip Buffer"
                      >
                        <Shield size={9} /> BE (+1p)
                      </button>
                      <button 
                        onClick={() => scaleInPosition && scaleInPosition(pos.id, Math.max(0.01, Number((pos.size * 0.5).toFixed(2))))}
                        className="flex-1 flex items-center justify-center gap-0.5 text-[8.5px] font-bold min-h-[30px] `bg-[${palette.bull}10] hover:bg-[${palette.bull}20] text-[${palette.bull}]` border `border-[${palette.bull}20]` py-1 rounded cursor-pointer transition-colors"
                        title="Scale-In (+50% size at current price)"
                      >
                        <Plus size={9} /> SCALE +50%
                      </button>
                      <button 
                        onClick={() => reversePosition(pos.id, livePrices[pos.symbol] || pos.currentPrice)}
                        style={{ backgroundColor: `${palette.poc}10`, color: palette.poc, borderColor: `${palette.poc}20` }} className="flex-1 flex items-center justify-center gap-0.5 text-[8.5px] font-bold min-h-[30px] border py-1 rounded cursor-pointer transition-colors"
                        title="Close current and open opposite position"
                      >
                        <RefreshCw size={9} /> REVERSE
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <div className="flex-1 flex items-center gap-0.5 bg-[var(--color-bg)] p-0.5 rounded border border-[var(--color-border)]">
                        <span className="text-[8px] font-bold text-[var(--color-text-muted)] px-1">PARTIAL:</span>
                        {[0.25, 0.5, 0.75].map(ratio => (
                          <button
                            key={ratio}
                            onClick={() => partialClosePosition ? partialClosePosition(pos.id, ratio) : closePosition(pos.id, livePrices[pos.symbol] || pos.currentPrice, ratio)}
                            style={{ backgroundColor: `${palette.poc}15`, color: palette.poc }} className="flex-1 text-[8px] font-bold py-0.5 rounded cursor-pointer transition-colors"
                          >
                            {ratio * 100}%
                          </button>
                        ))}
                      </div>

                      <button 
                        onClick={() => closePosition(pos.id, livePrices[pos.symbol] || pos.currentPrice, 1)}
                        style={{ backgroundColor: `${palette.bear}20`, color: palette.bear, borderColor: `${palette.bear}30` }} className="flex-none px-3 flex items-center justify-center gap-1 text-[9px] font-bold min-h-[30px] border py-1 rounded cursor-pointer transition-colors"
                      >
                        <X size={10} /> CLOSE
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="flex flex-col gap-2">
            {tradeHistory.length === 0 ? (
              <div className="text-center text-[var(--color-text-muted)] text-xs mt-10">No trade history</div>
            ) : (
              tradeHistory.map((hist, idx) => (
                <div key={`${hist.id}-${idx}`} className="bg-[var(--color-panel)] border border-[var(--color-border)] p-2 rounded flex flex-col gap-2 opacity-80 hover:opacity-100 transition-opacity">
                  <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-1">
                    <span className="font-bold text-xs">{hist.symbol}</span>
                    <span className="text-[9px] text-[var(--color-text-muted)] font-mono">
                      {new Date(hist.closeTime || hist.closedAt || Date.now()).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-mono">
                    <span style={{ color: hist.type === 'BUY' ? palette.bull : palette.bear }} className="font-bold">
                      {hist.type} {hist.size}
                    </span>
                    <span style={{ color: (hist.finalPnl ?? hist.pnl ?? 0) >= 0 ? palette.bull : palette.bear }} className="font-bold">
                      {(hist.finalPnl ?? hist.pnl ?? 0) >= 0 ? '+' : ''}${(hist.finalPnl ?? hist.pnl ?? 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono text-[var(--color-text-muted)]">
                    <span>In: {hist.entryPrice}</span>
                    <span>Out: {hist.closePrice}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 4: Connected Accounts Manager View */}
        {activeTab === 'stats' && (
          <div className="flex flex-col gap-3">
            {/* Performance Overview Cards */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[var(--color-panel)] border border-[var(--color-border)] p-2.5 rounded flex flex-col">
                <span className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Win Rate</span>
                <span className="text-lg font-extrabold font-mono" style={{ color: (tradeStats?.winRate || 0) >= 50 ? palette.bull : palette.bear }}>
                  {(tradeStats?.winRate || 0).toFixed(1)}%
                </span>
                <span className="text-[9px] text-[var(--color-text-muted)]">{tradeStats?.wins || 0}W / {tradeStats?.losses || 0}L</span>
              </div>
              <div className="bg-[var(--color-panel)] border border-[var(--color-border)] p-2.5 rounded flex flex-col">
                <span className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Profit Factor</span>
                <span className="text-lg font-extrabold font-mono" style={{ color: (tradeStats?.profitFactor || 0) >= 1.5 ? palette.bull : (tradeStats?.profitFactor || 0) >= 1 ? '#eab308' : palette.bear }}>
                  {(tradeStats?.profitFactor || 0) === Infinity ? '∞' : (tradeStats?.profitFactor || 0).toFixed(2)}
                </span>
                <span className="text-[9px] text-[var(--color-text-muted)]">Gross / Loss</span>
              </div>
              <div className="bg-[var(--color-panel)] border border-[var(--color-border)] p-2.5 rounded flex flex-col">
                <span className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Total P&L</span>
                <span className="text-lg font-extrabold font-mono" style={{ color: (tradeStats?.totalPnL || 0) >= 0 ? palette.bull : palette.bear }}>
                  {(tradeStats?.totalPnL || 0) >= 0 ? '+' : ''}{(tradeStats?.totalPnL || 0).toFixed(2)}
                </span>
                <span className="text-[9px] text-[var(--color-text-muted)]">{tradeStats?.totalTrades || 0} trades</span>
              </div>
              <div className="bg-[var(--color-panel)] border border-[var(--color-border)] p-2.5 rounded flex flex-col">
                <span className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Avg R:R</span>
                <span className="text-lg font-extrabold font-mono text-[var(--color-text)]">
                  {(tradeStats?.avgRR || 0) === Infinity ? '∞' : `1:${(tradeStats?.avgRR || 0).toFixed(1)}`}
                </span>
                <span className="text-[9px] text-[var(--color-text-muted)]">Win/Loss ratio</span>
              </div>
            </div>
            {/* Detailed Stats */}
            <div className="bg-[var(--color-panel)] border border-[var(--color-border)] rounded p-2.5 space-y-2">
              <div className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider border-b border-[var(--color-border)] pb-1">Detailed Statistics</div>
              {[
                { label: 'Gross Profit', value: `+${(tradeStats?.grossProfit || 0).toFixed(2)}`, color: `text-[${palette.bull}]` },
                { label: 'Gross Loss', value: `-${(tradeStats?.grossLoss || 0).toFixed(2)}`, color: `text-[${palette.bear}]` },
                { label: 'Average Win', value: `+${(tradeStats?.avgWin || 0).toFixed(2)}`, color: `text-[${palette.bull}]` },
                { label: 'Average Loss', value: `-${(tradeStats?.avgLoss || 0).toFixed(2)}`, color: `text-[${palette.bear}]` },
                { label: 'Best Trade', value: `+${(tradeStats?.bestTrade || 0).toFixed(2)}`, color: `text-[${palette.bull}]` },
                { label: 'Worst Trade', value: `${(tradeStats?.worstTrade || 0).toFixed(2)}`, color: `text-[${palette.bear}]` },
                { label: 'Unrealized P&L', value: `${(tradeStats?.unrealizedPnL || 0) >= 0 ? '+' : ''}${(tradeStats?.unrealizedPnL || 0).toFixed(2)}`, color: (tradeStats?.unrealizedPnL || 0) >= 0 ? `text-[${palette.bull}]` : `text-[${palette.bear}]` },
                { label: 'Net Equity', value: equity.toFixed(2), color: 'text-[var(--color-text)]' },
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-[var(--color-text-muted)]">{item.label}</span>
                  <span className={`font-bold ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
            {/* Win/Loss Visual Bar */}
            {tradeStats?.totalTrades > 0 && (
              <div className="bg-[var(--color-panel)] border border-[var(--color-border)] rounded p-2.5">
                <div className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5">Win/Loss Distribution</div>
                <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
                  <div style={{ backgroundColor: palette.bull, width: `${tradeStats.winRate}%` }} className="rounded-l-full" />
                  <div style={{ backgroundColor: palette.bear, width: `${100 - tradeStats.winRate}%` }} className="rounded-r-full" />
                </div>
                <div className="flex justify-between text-[9px] font-mono mt-1">
                  <span style={{ color: palette.bull }} className="font-bold">{tradeStats.wins} Wins ({tradeStats.winRate.toFixed(0)}%)</span>
                  <span style={{ color: palette.bear }} className="font-bold">{tradeStats.losses} Losses</span>
                </div>
              </div>
            )}
            {/* PnL Calendar Grid */}
            {tradeStats?.totalTrades > 0 && tradeStats?.dailyPnL && Object.keys(tradeStats.dailyPnL).length > 0 && (
              <div className="bg-[var(--color-panel)] border border-[var(--color-border)] rounded p-2.5">
                <div className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">PnL Calendar</div>
                {/* Monthly Grid - Last 12 weeks */}
                <div className="flex gap-[3px] overflow-x-auto scrollbar-thin pb-1">
                  {(() => {
                    const today = new Date();
                    const weeks: { date: string; pnl: number }[][] = [];
                    // Build 16 weeks back
                    for (let w = 15; w >= 0; w--) {
                      const weekDays: { date: string; pnl: number }[] = [];
                      for (let d = 0; d < 7; d++) {
                        const date = new Date(today);
                        date.setDate(today.getDate() - (w * 7 + (6 - d)));
                        const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
                        const pnl = tradeStats.dailyPnL[key] || 0;
                        weekDays.push({ date: key, pnl });
                      }
                      weeks.push(weekDays);
                    }
                    const maxAbs = Math.max(1, ...Object.values(tradeStats.dailyPnL).map(Math.abs));
                    return weeks.map((week, wi) => (
                      <div key={wi} className="flex flex-col gap-[3px]">
                        {week.map((day, di) => {
                          const intensity = day.pnl !== 0 ? Math.min(1, Math.abs(day.pnl) / maxAbs) : 0;
                          const isToday = day.date === `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
                          let bgColor = 'var(--color-bg)';
                          if (day.pnl > 0) bgColor = `rgba(34, 197, 94, ${0.15 + intensity * 0.65})`;
                          else if (day.pnl < 0) bgColor = `rgba(239, 68, 68, ${0.15 + intensity * 0.65})`;
                          return (
                            <div
                              key={di}
                              className="w-[18px] h-[18px] rounded-[3px] flex items-center justify-center cursor-default transition-all hover:scale-125 relative group"
                              style={{ backgroundColor: bgColor, border: isToday ? '1.5px solid var(--color-text)' : '1px solid transparent' }}
                              title={`${day.date}: ${day.pnl >= 0 ? '+' : ''}${day.pnl.toFixed(2)}`}
                            >
                              {day.pnl !== 0 && (
                                <span className="text-[7px] font-bold text-white/80">{day.pnl > 0 ? '+' : '-'}</span>
                              )}
                              {/* Tooltip */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-50">
                                <div className="bg-[var(--color-panel)] border border-[var(--color-border)] rounded px-2 py-1 text-[9px] font-mono whitespace-nowrap shadow-xl text-[var(--color-text)]">
                                  <div className="text-[var(--color-text-muted)]">{day.date}</div>
                                  <div className={`font-bold ${day.pnl >= 0 ? `text-[${palette.bull}]` : `text-[${palette.bear}]`}`}>
                                    {day.pnl >= 0 ? '+' : ''}{day.pnl.toFixed(2)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ));
                  })()}
                </div>
                {/* Legend */}
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[var(--color-border)]">
                  <div className="flex items-center gap-1.5 text-[8px] text-[var(--color-text-muted)]">
                    <div style={{ backgroundColor: `${palette.bear}60` }} className="w-2.5 h-2.5 rounded-sm" /> Loss
                    <div className="w-2.5 h-2.5 rounded-sm bg-[var(--color-bg)]" /> No Trade
                    <div style={{ backgroundColor: `${palette.bull}60` }} className="w-2.5 h-2.5 rounded-sm" /> Profit
                  </div>
                  <div className="text-[8px] text-[var(--color-text-muted)] font-mono">
                    {Object.keys(tradeStats.dailyPnL).length} hari aktif
                  </div>
                </div>
              </div>
            )}

            {/* Weekly Summary */}
            {tradeStats?.totalTrades > 0 && tradeStats?.weeklyPnL && Object.keys(tradeStats.weeklyPnL).length > 0 && (
              <div className="bg-[var(--color-panel)] border border-[var(--color-border)] rounded p-2.5">
                <div className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Weekly Summary</div>
                <div className="space-y-1">
                  {Object.entries(tradeStats.weeklyPnL).slice(-6).map(([week, pnl]) => {
                    const maxW = Math.max(1, ...Object.values(tradeStats.weeklyPnL).map(Math.abs));
                    const pct = Math.min(100, (Math.abs(pnl as number) / maxW) * 100);
                    return (
                      <div key={week} className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-[var(--color-text-muted)] w-16 shrink-0">{week.slice(5)}</span>
                        <div className="flex-1 h-2 rounded-full bg-[var(--color-bg)] overflow-hidden relative">
                          {(pnl as number) >= 0 ? (
                            <div style={{ backgroundColor: `${palette.bull}90`, width: `${pct}%` }} className="h-full rounded-r-full" />
                          ) : (
                            <div style={{ backgroundColor: `${palette.bear}90`, width: `${pct}%` }} className="h-full rounded-l-full ml-auto" />
                          )}
                        </div>
                        <span className={`text-[9px] font-mono font-bold min-w-[50px] text-right ${(pnl as number) >= 0 ? `text-[${palette.bull}]` : `text-[${palette.bear}]`}`}>
                          {(pnl as number) >= 0 ? '+' : ''}{(pnl as number).toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {(!tradeStats || tradeStats.totalTrades === 0) && (
              <div className="text-center text-[var(--color-text-muted)] text-xs mt-8">
                <BarChart3 className="mx-auto mb-2 opacity-40" size={28} />
                <p>Belum ada data trading</p>
                <p className="text-[10px] mt-1">Statistik akan muncul setelah eksekusi trade pertama</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'risk' && riskManagerData && (
          <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 px-1 mb-1">
              <ShieldCheck className="text-[#00f2fe]" size={16} />
              <h3 className="text-xs font-bold text-[var(--color-text)]">Hedge Fund Risk Manager</h3>
            </div>
            <RiskDashboard 
              settings={riskManagerData.settings}
              currentDrawdown={riskManagerData.currentDrawdown}
              isRiskExceeded={riskManagerData.isRiskExceeded}
              balance={riskManagerData.balance}
              equity={riskManagerData.equity}
            />
          </div>
        )}

        {activeTab === 'accounts' && (
          <div className="flex flex-col gap-2.5">
            <div className="flex justify-between items-center px-1">
              <span className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                Akun Terhubung ({connectedAccounts.length})
              </span>
              <button
                onClick={() => setIsAccountModalOpen(true)}
                style={{ color: palette.bull }}
                className="text-[11px] font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} /> Tambah Akun
              </button>
            </div>

            <div className="space-y-1.5">
              {connectedAccounts.map((acc) => {
                const isCurrent = acc.id === activeAccountId;
                return (
                  <div
                    key={acc.id}
                    style={{
                      borderColor: isCurrent ? palette.bull : 'var(--color-border)',
                      backgroundColor: isCurrent ? `${palette.bull}10` : 'var(--color-panel)',
                    }}
                    className={`p-2.5 rounded-xl border flex flex-col gap-1.5 transition-all ${
                      isCurrent ? 'ring-1 ring-[var(--color-bull)]/50' : 'hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${isCurrent ? '`bg-[${palette.bull}]` animate-pulse' : 'bg-gray-500'}`} />
                        <span className="font-bold text-xs text-[var(--color-text)] truncate">{acc.name}</span>
                      </div>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border uppercase text-[var(--color-text-muted)] border-[var(--color-border)]">
                        {acc.broker}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted)] font-mono">
                      <span>Tipe: {acc.accountType} ({acc.isReal ? 'REAL' : 'DEMO'})</span>
                      <span className="font-bold text-xs text-[var(--color-text)]">
                        {acc.currency} {acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-[var(--color-border)]/50 text-[10px]">
                      <span style={{ color: palette.bull }} className="font-mono flex items-center gap-1">
                        ● {acc.pingMs || 14}ms
                      </span>
                      {isCurrent ? (
                        <span style={{ color: palette.bull }} className="font-bold text-[10px] flex items-center gap-1">
                          <CheckCircle2 size={11} /> Aktif Digunakan
                        </span>
                      ) : (
                        <button
                          onClick={() => switchActiveAccount(acc.id)}
                          style={{ backgroundColor: `${palette.bull}20`, color: palette.bull, borderColor: `${palette.bull}50` }}
                          className="px-2 py-0.5 rounded border text-[10px] font-bold hover:opacity-80 transition-opacity cursor-pointer"
                        >
                          Gunakan Akun
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setIsAccountModalOpen(true)}
              style={{ backgroundColor: `${palette.bull}20`, borderColor: `${palette.bull}50`, color: palette.bull }}
              className="w-full py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer mt-1"
            >
              <Settings2 size={13} />
              <span>Buka Menu Kelola Akun Lengkap</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export default ChartTradePanel;
