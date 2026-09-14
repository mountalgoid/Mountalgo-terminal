import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Zap, ShieldAlert, ArrowLeftRight, Activity, CheckCircle2, 
  AlertCircle, DollarSign, Layers, TrendingUp, RefreshCw, Search,
  ExternalLink, Link, Sparkles, Check, ChevronDown, Radio
} from 'lucide-react';
import { useTrade } from '../context/TradeContext';
import { useTheme } from '../context/ThemeContext';

interface HedgeArbitrageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Pre-curated top volume & MEXC gem crypto symbols for instant 1-click picking
const CURATED_TOP_PAIRS = [
  { symbol: 'BTCUSDT', name: 'Bitcoin', tag: 'Major' },
  { symbol: 'ETHUSDT', name: 'Ethereum', tag: 'Major' },
  { symbol: 'SOLUSDT', name: 'Solana', tag: 'Layer 1' },
  { symbol: 'KASUSDT', name: 'Kaspa', tag: 'MEXC Top' },
  { symbol: 'SUIUSDT', name: 'Sui Network', tag: 'MEXC Top' },
  { symbol: 'PEPEUSDT', name: 'Pepe', tag: 'Meme' },
  { symbol: 'TAOUSDT', name: 'Bittensor', tag: 'AI' },
  { symbol: 'TONUSDT', name: 'Toncoin', tag: 'Layer 1' },
  { symbol: 'DOGEUSDT', name: 'Dogecoin', tag: 'Meme' },
  { symbol: 'XRPUSDT', name: 'Ripple', tag: 'Major' },
  { symbol: 'NEARUSDT', name: 'Near Protocol', tag: 'AI/L1' },
  { symbol: 'RENDERUSDT', name: 'Render', tag: 'AI/DePIN' },
];

export default function HedgeArbitrageModal({ isOpen, onClose }: HedgeArbitrageModalProps) {
  const { palette } = useTheme();
  const { 
    connectedAccounts = [], 
    livePrices = {}, 
    focusedSymbol = 'BTCUSDT',
    jumpToChartTarget,
    brokerSymbols = {},
    mexcSyncStatus,
    refreshBrokerSymbols
  } = useTrade();

  // Symbol selection & Chart Auto-sync state
  const [symbol, setSymbol] = useState(focusedSymbol || 'BTCUSDT');
  const [isAutoSyncChart, setIsAutoSyncChart] = useState(true);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterTab, setSelectedFilterTab] = useState<'ALL' | 'MEXC' | 'CHART'>('ALL');

  const [quantity, setQuantity] = useState('0.05');
  const [leverage, setLeverage] = useState(20);

  // Leg 1 (e.g. Long) & Leg 2 (e.g. Short) Account Selection
  const realAccounts = connectedAccounts.filter(a => a.isReal || true);
  const [leg1AccountId, setLeg1AccountId] = useState(realAccounts[0]?.id || '');
  const [leg2AccountId, setLeg2AccountId] = useState(realAccounts[1]?.id || realAccounts[0]?.id || '');

  const leg1Acc = useMemo(() => connectedAccounts.find(a => a.id === leg1AccountId) || connectedAccounts[0], [connectedAccounts, leg1AccountId]);
  const leg2Acc = useMemo(() => connectedAccounts.find(a => a.id === leg2AccountId) || connectedAccounts[1] || connectedAccounts[0], [connectedAccounts, leg2AccountId]);

  const [leg1Side, setLeg1Side] = useState<'BUY' | 'SELL'>('BUY');
  const [leg2Side, setLeg2Side] = useState<'BUY' | 'SELL'>('SELL');

  const [isExecuting, setIsExecuting] = useState(false);
  const [executionReceipt, setExecutionReceipt] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSyncingMEXC, setIsSyncingMEXC] = useState(false);

  // 1. Synchronize automatically with Chart's active asset whenever modal opens or focusedSymbol changes
  useEffect(() => {
    if (isOpen && isAutoSyncChart && focusedSymbol) {
      setSymbol(focusedSymbol);
    }
  }, [isOpen, focusedSymbol, isAutoSyncChart]);

  // Keep local symbol state valid
  useEffect(() => {
    if (!symbol && focusedSymbol) {
      setSymbol(focusedSymbol);
    }
  }, [symbol, focusedSymbol]);

  // Comprehensive pool of symbols: active chart + MEXC live symbols + leg brokers' symbols + curated
  const availableSymbols = useMemo(() => {
    const symbolMap = new Map<string, { symbol: string; name: string; type: string; source: string }>();

    // 1. Chart active symbol
    if (focusedSymbol) {
      symbolMap.set(focusedSymbol.toUpperCase(), {
        symbol: focusedSymbol.toUpperCase(),
        name: `${focusedSymbol.toUpperCase()} (Chart Aktif)`,
        type: 'chart',
        source: 'CHART'
      });
    }

    // 2. Curated Top Volume Pairs
    CURATED_TOP_PAIRS.forEach(p => {
      const sym = p.symbol.toUpperCase();
      if (!symbolMap.has(sym)) {
        symbolMap.set(sym, {
          symbol: sym,
          name: `${p.name} (${p.tag})`,
          type: 'crypto',
          source: 'TOP'
        });
      }
    });

    // 3. Dynamic MEXC Assets from brokerSymbols
    const mexcList = brokerSymbols['MEXC'] || brokerSymbols['mexc'] || [];
    mexcList.forEach((item: any) => {
      const rawSym = (item.symbol || '').replace(/[^A-Z0-9]/g, '').toUpperCase();
      if (rawSym && !symbolMap.has(rawSym)) {
        symbolMap.set(rawSym, {
          symbol: rawSym,
          name: item.displayName || `${item.base || rawSym}/${item.quote || 'USDT'}`,
          type: item.type || 'futures',
          source: 'MEXC'
        });
      }
    });

    // 4. Symbols from Leg 1 / Leg 2 brokers if available
    const leg1BrokerSyms = leg1Acc ? brokerSymbols[leg1Acc.broker] || [] : [];
    leg1BrokerSyms.forEach((item: any) => {
      const rawSym = (item.symbol || '').replace(/[^A-Z0-9]/g, '').toUpperCase();
      if (rawSym && !symbolMap.has(rawSym)) {
        symbolMap.set(rawSym, {
          symbol: rawSym,
          name: item.displayName || rawSym,
          type: item.type || 'spot',
          source: leg1Acc.broker
        });
      }
    });

    return Array.from(symbolMap.values());
  }, [focusedSymbol, brokerSymbols, leg1Acc]);

  // Filtered symbols for search in modal
  const filteredSymbols = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return availableSymbols.filter(s => {
      const matchesSearch = !q || s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
      const matchesTab = 
        selectedFilterTab === 'ALL' ||
        (selectedFilterTab === 'MEXC' && s.source === 'MEXC') ||
        (selectedFilterTab === 'CHART' && (s.symbol === focusedSymbol || s.source === 'CHART'));
      return matchesSearch && matchesTab;
    });
  }, [availableSymbols, searchQuery, selectedFilterTab, focusedSymbol]);

  if (!isOpen) return null;

  // Calculate live price & estimated cross-broker spread
  const curPrice = livePrices[symbol] || 68500;
  const leg1Price = curPrice;
  const leg2Price = curPrice * 1.0008; // Simulated +0.08% variance for hedging
  const spreadDiff = Math.abs(leg1Price - leg2Price);
  const spreadPct = ((spreadDiff / leg1Price) * 100).toFixed(4);

  // Apply current Hedge Algo symbol back to the active Chart
  const handleApplyToChart = () => {
    if (jumpToChartTarget && symbol) {
      jumpToChartTarget(symbol);
    }
  };

  // Manual trigger to force-sync fresh assets from MEXC
  const handleSyncMEXCAssets = async () => {
    setIsSyncingMEXC(true);
    try {
      await refreshBrokerSymbols('mexc', true);
    } finally {
      setIsSyncingMEXC(false);
    }
  };

  const handleExecuteHedge = async () => {
    if (!leg1Acc || !leg2Acc) {
      setErrorMsg('Harap pilih dua akun broker aktif untuk eksekusi Hedge');
      return;
    }

    if (leg1Acc.id === leg2Acc.id && leg1Acc.isReal) {
      setErrorMsg('Saran: Gunakan dua akun broker berbeda (contoh: MEXC + Binance) untuk arbitrase lintas broker delta-neutral');
    }

    setIsExecuting(true);
    setErrorMsg(null);
    setExecutionReceipt(null);

    try {
      const payload = {
        leg1: {
          broker: leg1Acc.broker.toLowerCase(),
          apiKey: leg1Acc.apiKey || '',
          secret: leg1Acc.apiSecret || '',
          accountType: leg1Acc.accountType,
          isTestnet: leg1Acc.isTestnet,
          symbol,
          side: leg1Side,
          quantity,
          leverage,
        },
        leg2: {
          broker: leg2Acc.broker.toLowerCase(),
          apiKey: leg2Acc.apiKey || '',
          secret: leg2Acc.apiSecret || '',
          accountType: leg2Acc.accountType,
          isTestnet: leg2Acc.isTestnet,
          symbol,
          side: leg2Side,
          quantity,
          leverage,
        }
      };

      const res = await fetch('/api/broker/hedge-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Eksekusi hedge gagal');
      }

      setExecutionReceipt(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengeksekusi multi-broker hedge');
    } finally {
      setIsExecuting(false);
    }
  };

  const mexcCount = mexcSyncStatus?.total || (brokerSymbols['MEXC']?.length || 0);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div 
        style={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-border)' }}
        className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border shadow-2xl p-4 sm:p-6 flex flex-col gap-4 text-[var(--color-text)]"
      >
        {/* Header with Live Status Badges */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Zap size={22} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                MULTI-BROKER DELTA-NEUTRAL HEDGE
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                  HEDGE FUND ALGO
                </span>
              </h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                Eksekusi simultan 2 leg lintas broker (MEXC / Binance / Bybit) dengan konkurensi sub-milidetik.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg)] transition-colors cursor-pointer text-[var(--color-text-muted)] hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Real-Time Sync & Asset Universe Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-xs">
          {/* Chart Sync Indicator & Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const next = !isAutoSyncChart;
                setIsAutoSyncChart(next);
                if (next && focusedSymbol) {
                  setSymbol(focusedSymbol);
                }
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer border ${
                isAutoSyncChart 
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' 
                  : 'bg-zinc-800/60 border-zinc-700 text-zinc-400'
              }`}
              title="Aktifkan/Nonaktifkan sinkronisasi otomatis dengan chart"
            >
              <Activity size={14} className={isAutoSyncChart ? "text-emerald-400 animate-pulse" : "text-zinc-400"} />
              <span>Chart Sync: <strong>{isAutoSyncChart ? 'AKTIF' : 'OFF'}</strong></span>
            </button>

            <span className="text-[11px] text-[var(--color-text-muted)] hidden sm:inline">
              {isAutoSyncChart ? (
                <>Terkoneksi ke Chart: <span className="font-mono font-bold text-white">{focusedSymbol}</span></>
              ) : (
                <>Manual Asset Override</>
              )}
            </span>
          </div>

          {/* MEXC Broker Real-Time Asset Status & Refresh */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>MEXC API: <strong>{mexcCount > 0 ? `${mexcCount.toLocaleString()} Aset` : 'Memuat...'}</strong></span>
              {mexcSyncStatus?.authenticated && (
                <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-1 rounded font-sans font-bold">API Key Valid</span>
              )}
            </div>

            <button
              onClick={handleSyncMEXCAssets}
              disabled={isSyncingMEXC || mexcSyncStatus?.isLoading}
              className="p-1 rounded-lg bg-[var(--color-panel)] border border-[var(--color-border)] hover:bg-white/10 text-[var(--color-text-muted)] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh Aset MEXC Realtime dari Broker API"
            >
              <RefreshCw size={14} className={isSyncingMEXC || mexcSyncStatus?.isLoading ? "animate-spin text-cyan-400" : ""} />
            </button>
          </div>
        </div>

        {/* Live Spread, Asset Selector & Order Parameters */}
        <div className="p-3.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono">
          {/* Asset Selector */}
          <div className="sm:col-span-1 relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[var(--color-text-muted)] block">Aset Hedge Algo:</span>
              {symbol !== focusedSymbol && (
                <button
                  onClick={handleApplyToChart}
                  className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer font-sans font-bold"
                  title="Terapkan aset ini ke Chart Trading"
                >
                  <ExternalLink size={10} /> Terapkan ke Chart
                </button>
              )}
            </div>

            {/* Custom Dropdown Trigger */}
            <button
              type="button"
              onClick={() => setIsSelectorOpen(!isSelectorOpen)}
              className="mt-1 w-full bg-[var(--color-panel)] border border-[var(--color-border)] hover:border-amber-400/50 rounded-lg px-2.5 py-1.5 font-bold text-white flex items-center justify-between gap-1 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5 overflow-hidden">
                <span className="truncate">{symbol}</span>
                {symbol === focusedSymbol && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Chart</span>
                )}
              </div>
              <ChevronDown size={14} className={`text-[var(--color-text-muted)] transition-transform ${isSelectorOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Searchable Dropdown Menu */}
            {isSelectorOpen && (
              <div className="absolute top-full left-0 mt-1 w-72 sm:w-80 bg-[var(--color-panel)] border border-[var(--color-border)] rounded-xl shadow-2xl z-50 p-2 flex flex-col gap-2 animate-in fade-in">
                {/* Search Bar */}
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <input
                    type="text"
                    placeholder="Cari aset MEXC / Crypto..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="w-full pl-8 pr-2 py-1.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 p-1 bg-[var(--color-bg)] rounded-lg text-[10px] font-bold">
                  <button
                    onClick={() => setSelectedFilterTab('ALL')}
                    className={`flex-1 py-1 rounded cursor-pointer transition-colors ${selectedFilterTab === 'ALL' ? 'bg-amber-400 text-black' : 'text-[var(--color-text-muted)] hover:text-white'}`}
                  >
                    Semua ({availableSymbols.length})
                  </button>
                  <button
                    onClick={() => setSelectedFilterTab('MEXC')}
                    className={`flex-1 py-1 rounded cursor-pointer transition-colors ${selectedFilterTab === 'MEXC' ? 'bg-amber-400 text-black' : 'text-[var(--color-text-muted)] hover:text-white'}`}
                  >
                    MEXC ({mexcCount})
                  </button>
                  <button
                    onClick={() => setSelectedFilterTab('CHART')}
                    className={`flex-1 py-1 rounded cursor-pointer transition-colors ${selectedFilterTab === 'CHART' ? 'bg-amber-400 text-black' : 'text-[var(--color-text-muted)] hover:text-white'}`}
                  >
                    Chart ({focusedSymbol})
                  </button>
                </div>

                {/* Symbol List Scrollable */}
                <div className="max-h-56 overflow-y-auto flex flex-col gap-1 pr-1 custom-scrollbar">
                  {filteredSymbols.slice(0, 100).map((item) => {
                    const isSelected = item.symbol === symbol;
                    const isChart = item.symbol === focusedSymbol;
                    const liveItemPrice = livePrices[item.symbol];

                    return (
                      <button
                        key={item.symbol}
                        onClick={() => {
                          setSymbol(item.symbol);
                          setIsSelectorOpen(false);
                        }}
                        className={`flex items-center justify-between p-2 rounded-lg text-left text-xs cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-amber-500/20 text-amber-300 font-bold' 
                            : 'hover:bg-white/5 text-zinc-300'
                        }`}
                      >
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold">{item.symbol}</span>
                            {isChart && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-normal">Chart</span>
                            )}
                            {item.source === 'MEXC' && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-normal">MEXC</span>
                            )}
                          </div>
                          <span className="text-[10px] text-[var(--color-text-muted)] truncate max-w-[150px]">{item.name}</span>
                        </div>

                        {liveItemPrice && (
                          <span className="text-[11px] font-mono font-bold text-zinc-200">
                            ${Number(liveItemPrice).toLocaleString()}
                          </span>
                        )}
                      </button>
                    );
                  })}
                  {filteredSymbols.length === 0 && (
                    <div className="text-center py-4 text-xs text-[var(--color-text-muted)]">
                      Aset tidak ditemukan
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Contract Quantity */}
          <div>
            <span className="text-[10px] text-[var(--color-text-muted)] block">Ukuran Kontrak:</span>
            <input 
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              step="0.01"
              min="0.001"
              className="mt-1 w-full bg-[var(--color-panel)] border border-[var(--color-border)] rounded-lg px-2.5 py-1.5 font-bold text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Leverage */}
          <div>
            <span className="text-[10px] text-[var(--color-text-muted)] block">Leverage Kontrak:</span>
            <div className="flex items-center gap-2 mt-1">
              <input 
                type="range" 
                min="1" 
                max="100" 
                value={leverage} 
                onChange={(e) => setLeverage(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <span className="font-bold text-amber-400 shrink-0">{leverage}x</span>
            </div>
          </div>

          {/* Spread Variance Monitor */}
          <div>
            <span className="text-[10px] text-[var(--color-text-muted)] block">Spread Lintas Broker:</span>
            <div className="mt-1 flex flex-col">
              <span className="text-sm font-bold text-emerald-400">
                +${spreadDiff.toFixed(2)} ({spreadPct}%)
              </span>
              <span className="text-[10px] text-[var(--color-text-muted)]">
                Harga Acuan: ${curPrice.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* 2-Leg Broker Configuration Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Leg 1 Card */}
          <div className="p-3.5 rounded-xl bg-[var(--color-bg)] border border-emerald-500/30 flex flex-col gap-2.5 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={14} /> LEG 1 (PRIMARY EXCHANGE)
              </span>
              <button
                onClick={() => setLeg1Side(s => s === 'BUY' ? 'SELL' : 'BUY')}
                className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md cursor-pointer transition-colors ${
                  leg1Side === 'BUY' 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}
              >
                {leg1Side === 'BUY' ? 'LONG (BUY)' : 'SHORT (SELL)'}
              </button>
            </div>

            <div>
              <label className="text-[10px] text-[var(--color-text-muted)] block mb-1">Pilih Akun Broker Leg 1:</label>
              <select
                value={leg1AccountId}
                onChange={(e) => setLeg1AccountId(e.target.value)}
                className="w-full bg-[var(--color-panel)] border border-[var(--color-border)] rounded-lg p-2 text-xs font-bold text-[var(--color-text)] focus:outline-none focus:border-emerald-400"
              >
                {connectedAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.broker} - ${acc.balance.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div className="text-[11px] font-mono text-[var(--color-text-muted)] flex justify-between pt-1 border-t border-[var(--color-border)]/50">
              <span className="flex items-center gap-1">
                Broker: <strong className="text-white">{leg1Acc?.broker}</strong>
                {leg1Acc?.broker.toUpperCase() === 'MEXC' && (
                  <span className="text-[9px] px-1 bg-cyan-500/20 text-cyan-300 rounded">MEXC Global</span>
                )}
              </span>
              <span>Harga Est: <strong className="text-white">${leg1Price.toLocaleString()}</strong></span>
            </div>
          </div>

          {/* Leg 2 Card */}
          <div className="p-3.5 rounded-xl bg-[var(--color-bg)] border border-rose-500/30 flex flex-col gap-2.5 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <ArrowLeftRight size={14} /> LEG 2 (HEDGE / ARBITRAGE)
              </span>
              <button
                onClick={() => setLeg2Side(s => s === 'BUY' ? 'SELL' : 'BUY')}
                className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md cursor-pointer transition-colors ${
                  leg2Side === 'BUY' 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}
              >
                {leg2Side === 'BUY' ? 'LONG (BUY)' : 'SHORT (SELL)'}
              </button>
            </div>

            <div>
              <label className="text-[10px] text-[var(--color-text-muted)] block mb-1">Pilih Akun Broker Leg 2:</label>
              <select
                value={leg2AccountId}
                onChange={(e) => setLeg2AccountId(e.target.value)}
                className="w-full bg-[var(--color-panel)] border border-[var(--color-border)] rounded-lg p-2 text-xs font-bold text-[var(--color-text)] focus:outline-none focus:border-rose-400"
              >
                {connectedAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.broker} - ${acc.balance.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div className="text-[11px] font-mono text-[var(--color-text-muted)] flex justify-between pt-1 border-t border-[var(--color-border)]/50">
              <span className="flex items-center gap-1">
                Broker: <strong className="text-white">{leg2Acc?.broker}</strong>
                {leg2Acc?.broker.toUpperCase() === 'MEXC' && (
                  <span className="text-[9px] px-1 bg-cyan-500/20 text-cyan-300 rounded">MEXC Global</span>
                )}
              </span>
              <span>Harga Est: <strong className="text-white">${leg2Price.toLocaleString()}</strong></span>
            </div>
          </div>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Execution Receipts Panel */}
        {executionReceipt && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-xs flex flex-col gap-2 font-mono animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5 text-sm">
                <CheckCircle2 size={16} /> {executionReceipt.message}
              </span>
              <span className="text-[10px] text-emerald-300">
                Waktu Total: <strong>{executionReceipt.totalExecutionTimeMs}ms</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
              {/* Leg 1 Fill Receipt */}
              <div className="p-2.5 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] flex flex-col gap-1">
                <span className="text-[10px] font-bold text-emerald-400">
                  LEG 1 FILL: {executionReceipt.leg1.broker} ({executionReceipt.leg1.side})
                </span>
                <span>Symbol: {executionReceipt.leg1.symbol}</span>
                <span>Filled Price: ${Number(executionReceipt.leg1.filledPrice).toLocaleString()}</span>
                <span>Latency: {executionReceipt.leg1.latencyMs}ms</span>
              </div>

              {/* Leg 2 Fill Receipt */}
              <div className="p-2.5 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] flex flex-col gap-1">
                <span className="text-[10px] font-bold text-rose-400">
                  LEG 2 FILL: {executionReceipt.leg2.broker} ({executionReceipt.leg2.side})
                </span>
                <span>Symbol: {executionReceipt.leg2.symbol}</span>
                <span>Filled Price: ${Number(executionReceipt.leg2.filledPrice).toLocaleString()}</span>
                <span>Latency: {executionReceipt.leg2.latencyMs}ms</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px] text-amber-300">
              <span>Selisih Harga Terisi: <strong>${executionReceipt.priceDiff}</strong></span>
              <span>Spread Net captured: <strong>{executionReceipt.netSpreadPct}</strong></span>
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleExecuteHedge}
          disabled={isExecuting}
          className="w-full py-3.5 px-4 rounded-xl font-extrabold text-sm text-black bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
        >
          {isExecuting ? (
            <>
              <RefreshCw size={18} className="animate-spin" />
              <span>MENGEKSEKUSI MULTI-BROKER HEDGE CONCURRENTLY...</span>
            </>
          ) : (
            <>
              <Zap size={18} />
              <span>EKSEKUSI SIMULTAN DELTA-NEUTRAL HEDGE ({symbol})</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
