import React, { useState, useEffect } from 'react';
import { Flame, Clock, RefreshCw, X, Zap, ShieldCheck, AlertTriangle, TrendingUp, DollarSign, Layers } from 'lucide-react';
import { useTrade } from '../context/TradeContext';
import { DynamicListingTimer } from './DynamicListingTimer';
import { MexcNewListingItem } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  jumpToChartTarget?: (symbol: string) => void;
  broadcastSymbolChange?: (symbol: string) => void;
}

export const ListingSniperHubModal: React.FC<Props> = ({
  isOpen,
  onClose,
  jumpToChartTarget,
  broadcastSymbolChange
}) => {
  const { newListingState, refreshBrokerSymbols, instantSnipeListing } = useTrade();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [snipeAmount, setSnipeAmount] = useState<number>(100);
  const [selectedBroker, setSelectedBroker] = useState<'all' | 'mexc' | 'binance' | 'bybit'>('all');

  if (!isOpen) return null;

  const handleManualScan = async () => {
    setIsRefreshing(true);
    try {
      if (selectedBroker === 'all') {
        await Promise.allSettled([
          fetch('/api/mexc/scan-now', { method: 'POST' }),
          fetch('/api/binance/scan-now', { method: 'POST' }),
          fetch('/api/bybit/scan-now', { method: 'POST' })
        ]);
        await refreshBrokerSymbols('all', true);
      } else {
        await fetch(`/api/${selectedBroker}/scan-now`, { method: 'POST' });
        await refreshBrokerSymbols(selectedBroker, true);
      }
    } catch (e) {
      console.warn('Scan failed:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const allListings = newListingState?.listings || [];
  const listings = selectedBroker === 'all'
    ? allListings
    : allListings.filter(item => (item.broker || 'mexc').toLowerCase() === selectedBroker.toLowerCase());

  return (
    <div className="fixed inset-0 z-[10002] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-emerald-950/40 border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-emerald-500/20 bg-zinc-950/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400">
              <Flame size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-mono font-bold text-white tracking-tight">
                  ⚡ Multi-Broker New Listing & Snipe Hub
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 font-bold">
                  REALTIME SCANNER
                </span>
              </div>
              <p className="text-xs font-mono text-zinc-400 mt-0.5">
                Deteksi otomatis token rilis baru MEXC, Binance, & Bybit dengan Dynamic Timer & 1-Click Snipe
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleManualScan}
              disabled={isRefreshing}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-emerald-500/30 font-mono text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
              <span>{isRefreshing ? 'Scanning...' : `Scan ${selectedBroker.toUpperCase()}`}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Broker Selector Tabs */}
        <div className="px-4 pt-3 pb-1 bg-zinc-950/90 border-b border-zinc-800 flex items-center gap-2 shrink-0">
          {(['all', 'mexc', 'binance', 'bybit'] as const).map((b) => (
            <button
              key={b}
              onClick={() => setSelectedBroker(b)}
              className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedBroker === b
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 shadow'
                  : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {b === 'all' ? <Layers size={13} /> : <Flame size={13} />}
              <span>{b.toUpperCase()}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-300">
                {b === 'all'
                  ? allListings.length
                  : allListings.filter(i => (i.broker || 'mexc').toLowerCase() === b).length}
              </span>
            </button>
          ))}
        </div>

        {/* Global Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-zinc-950/60 border-b border-zinc-800/80 text-xs font-mono">
          <div className="p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <div className="text-[10px] text-zinc-400 uppercase">Total Token Rilis (48h)</div>
            <div className="text-base font-bold text-white">{listings.length}</div>
          </div>
          <div className="p-2 rounded-xl bg-zinc-900/60 border border-emerald-500/30">
            <div className="text-[10px] text-emerald-400 uppercase">Rilis &lt; 5 Menit</div>
            <div className="text-base font-bold text-emerald-400">
              {listings.filter(i => (Date.now() - i.firstSeenAt) < 300000).length}
            </div>
          </div>
          <div className="p-2 rounded-xl bg-zinc-900/60 border border-cyan-500/30">
            <div className="text-[10px] text-cyan-400 uppercase">Rilis &lt; 1 Jam</div>
            <div className="text-base font-bold text-cyan-400">
              {listings.filter(i => (Date.now() - i.firstSeenAt) < 3600000).length}
            </div>
          </div>
          <div className="p-2 rounded-xl bg-zinc-900/60 border border-amber-500/30 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-zinc-400 uppercase">Default Snipe Alloc</div>
              <div className="text-sm font-bold text-amber-300">${snipeAmount} USD</div>
            </div>
            <div className="flex gap-1">
              {[50, 100, 250].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setSnipeAmount(amt)}
                  className={`px-1.5 py-0.5 text-[9px] rounded font-bold cursor-pointer transition-all ${
                    snipeAmount === amt ? 'bg-amber-400 text-black' : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Listings Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {listings.length === 0 ? (
            <div className="p-12 text-center font-mono text-zinc-500 text-sm">
              Tidak ada aset rilis baru terdeteksi untuk {selectedBroker.toUpperCase()} dalam 48 jam terakhir.
              <br />
              Klik tombol &quot;Scan {selectedBroker.toUpperCase()}&quot; di atas untuk pemindaian instan.
            </div>
          ) : (
            listings.map((coin: MexcNewListingItem) => {
              const isVeryNew = Date.now() - coin.firstSeenAt < 300000;
              const brokerLabel = (coin.broker || 'MEXC').toUpperCase();
              return (
                <div
                  key={`${coin.broker || 'mexc'}-${coin.symbol}`}
                  className={`p-3.5 rounded-xl border backdrop-blur-md transition-all ${
                    isVeryNew
                      ? 'bg-gradient-to-r from-emerald-950/40 via-zinc-900/90 to-teal-950/30 border-emerald-500/50 shadow-lg'
                      : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Coin Details */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-lg text-white tracking-tight">
                          {coin.symbol}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-amber-300 border border-amber-500/30 font-mono font-bold">
                          {brokerLabel}
                        </span>
                        <span className="text-xs text-zinc-400 font-mono">
                          ({coin.type?.toUpperCase() || 'SPOT'})
                        </span>
                        {/* Dynamic Live Timer Badge */}
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-mono font-bold flex items-center gap-1">
                          <DynamicListingTimer firstSeenAt={coin.firstSeenAt} mode="compact" />
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
                        <span>Harga: <strong className="text-white">${coin.price?.toFixed(coin.precision || 4) || 'N/A'}</strong></span>
                        <span>Volume 24h: <strong className="text-zinc-200">${(coin.quoteVolume24h || 0).toLocaleString()}</strong></span>
                        {coin.maxLeverage && (
                          <span className="text-amber-300 font-semibold">Max {coin.maxLeverage}x</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          try {
                            localStorage.setItem('mountalgo_symbol', coin.symbol);
                            if (broadcastSymbolChange) broadcastSymbolChange(coin.symbol);
                            if (jumpToChartTarget) jumpToChartTarget(coin.symbol);
                          } catch {}
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-mono font-bold text-xs transition-colors cursor-pointer"
                      >
                        Chart View
                      </button>
                      <button
                        onClick={() => {
                          if (instantSnipeListing) {
                            instantSnipeListing(coin, snipeAmount);
                          }
                          onClose();
                        }}
                        className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-mono font-black text-xs hover:from-emerald-400 hover:to-teal-300 transition-all cursor-pointer shadow-lg flex items-center gap-1.5 animate-pulse"
                      >
                        <Zap size={14} className="fill-current" />
                        <span>SNIPE ${snipeAmount}</span>
                      </button>
                    </div>
                  </div>

                  {/* Volume Flow & Slippage Guard Details */}
                  {coin.volumeFlow && (
                    <div className="mt-2.5 pt-2 border-t border-zinc-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
                      <div className="flex items-center justify-between px-2 py-1 rounded bg-zinc-950/60">
                        <span className="text-zinc-400">Order Pressure:</span>
                        <span className="font-bold text-emerald-400">{coin.volumeFlow.pressure}</span>
                      </div>
                      <div className="flex items-center justify-between px-2 py-1 rounded bg-zinc-950/60">
                        <span className="text-zinc-400">Vol Spike:</span>
                        <span className="font-bold text-amber-300">{coin.volumeFlow.volumeAcceleration5m}x</span>
                      </div>
                      <div className="flex items-center justify-between px-2 py-1 rounded bg-zinc-950/60 col-span-2">
                        <span className="text-zinc-400">Slippage Guard:</span>
                        <span className="font-bold text-teal-300">
                          Max ${coin.slippageGuard?.maxOrderCapUsd || 2500} | {coin.slippageGuard?.suggestedAction || 'SAFE'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
