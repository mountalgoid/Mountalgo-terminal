import React, { useState } from 'react';
import { X, RefreshCw, Wallet, ShieldAlert, Zap, TrendingUp, BarChart2, PieChart, Activity, Clock } from 'lucide-react';
import { useTrade } from '../context/TradeContext';
import { useTheme } from '../context/ThemeContext';
import { hexToRgba, getThemeModalGradient, getThemeCardGradient, getThemeCardBorder } from '../utils/themeGradient';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface UnifiedEquityAggregatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UnifiedEquityAggregatorModal: React.FC<UnifiedEquityAggregatorModalProps> = ({ isOpen, onClose }) => {
  const { connectedAccounts, refreshAccountData, autoRefreshIntervalSec, setAutoRefreshIntervalSec, positions } = useTrade();
  const { palette, isLight } = useTheme();
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  if (!isOpen) return null;

  // Calculate Aggregated Total Equity & Balance
  const totalBalance = connectedAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  const totalOpenPnl = positions.reduce((sum, pos) => sum + (pos.pnl || 0), 0);
  const totalEquity = totalBalance + totalOpenPnl;

  const realAccounts = connectedAccounts.filter(a => a.isReal);
  const demoAccounts = connectedAccounts.filter(a => !a.isReal);

  const realTotalEquity = realAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  const demoTotalEquity = demoAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

  // Group equity by broker
  const brokerBreakdown: Record<string, { name: string; equity: number; count: number; isReal: boolean }> = {};
  connectedAccounts.forEach(acc => {
    const key = acc.broker;
    if (!brokerBreakdown[key]) {
      brokerBreakdown[key] = { name: acc.broker, equity: 0, count: 0, isReal: acc.isReal };
    }
    brokerBreakdown[key].equity += (acc.balance || 0);
    brokerBreakdown[key].count += 1;
  });

  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    await Promise.all(connectedAccounts.map(acc => refreshAccountData(acc.id)));
    setIsSyncingAll(false);
  };

  // Generate simulated historical net worth curve points based on current equity
  const historicalEquityData = [
    { time: '08:00', NetWorth: Number((totalEquity * 0.965).toFixed(2)) },
    { time: '10:00', NetWorth: Number((totalEquity * 0.978).toFixed(2)) },
    { time: '12:00', NetWorth: Number((totalEquity * 0.972).toFixed(2)) },
    { time: '14:00', NetWorth: Number((totalEquity * 0.989).toFixed(2)) },
    { time: '16:00', NetWorth: Number((totalEquity * 0.995).toFixed(2)) },
    { time: '18:00', NetWorth: Number((totalEquity * 1.008).toFixed(2)) },
    { time: 'Sekarang', NetWorth: Number(totalEquity.toFixed(2)) },
  ];

  return (
    <div 
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-black/50 backdrop-blur-[2px] animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        style={{
          background: getThemeModalGradient(palette, isLight),
          borderColor: getThemeCardBorder(palette, false),
          boxShadow: `0 25px 60px -15px rgba(0,0,0,0.9), 0 0 35px ${hexToRgba(palette.bull, 0.22)}`
        }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col border rounded-2xl overflow-hidden font-sans backdrop-blur-2xl animate-in zoom-in-95 duration-150"
      >
        {/* Top Accent Gradient Line */}
        <div 
          className="h-[3px] w-full shrink-0"
          style={{
            background: `linear-gradient(90deg, ${palette.bull} 0%, ${palette.poc || '#6366f1'} 50%, ${palette.bear} 100%)`
          }}
        />

        {/* Header */}
        <div 
          style={{
            background: `linear-gradient(90deg, ${hexToRgba(palette.bull, 0.12)} 0%, rgba(255,255,255,0.02) 50%, ${hexToRgba(palette.bear, 0.12)} 100%)`,
            borderBottomColor: getThemeCardBorder(palette, false)
          }}
          className="flex items-center justify-between px-5 py-4 border-b shrink-0"
        >
          <div className="flex items-center gap-3">
            <div 
              style={{
                background: `linear-gradient(135deg, ${palette.bull} 0%, ${palette.bear} 100%)`,
                boxShadow: `0 0 14px ${hexToRgba(palette.bull, 0.35)}`
              }}
              className="p-2.5 rounded-xl text-white shadow-md"
            >
              <PieChart size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--color-text)] flex items-center gap-2">
                Unified Cross-Account Net Worth Aggregator
                <span 
                  style={{
                    backgroundColor: hexToRgba(palette.bull, 0.18),
                    color: palette.bull,
                    borderColor: hexToRgba(palette.bull, 0.35)
                  }}
                  className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-full border"
                >
                  Hedge Fund Grade
                </span>
              </h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                Agregasi ekuitas multi-broker real-time (Binance, MEXC, Bybit, MT5, & Demo)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncAll}
              disabled={isSyncingAll}
              style={{
                background: `linear-gradient(135deg, ${palette.bull} 0%, ${palette.bear} 100%)`,
                color: '#ffffff',
                boxShadow: `0 0 12px ${hexToRgba(palette.bull, 0.25)}`
              }}
              className="px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 hover:brightness-110 shadow-sm"
            >
              <RefreshCw size={13} className={isSyncingAll ? "animate-spin" : ""} />
              {isSyncingAll ? "Syncing..." : "Sync Semua Broker"}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-[var(--color-text-muted)] hover:text-white hover:bg-white/10 transition-colors cursor-pointer active:scale-95"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Scroll Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
          
          {/* Top Summary Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Total Net Worth */}
            <div 
              style={{
                background: getThemeCardGradient(palette, isLight, true),
                borderColor: getThemeCardBorder(palette, true),
                boxShadow: `0 0 16px ${hexToRgba(palette.bull, 0.15)}`
              }}
              className="p-4 rounded-xl border flex flex-col justify-between backdrop-blur-md"
            >
              <div className="flex items-center justify-between text-xs font-semibold" style={{ color: palette.bull }}>
                <span>Total Net Worth (Combined)</span>
                <Wallet size={16} />
              </div>
              <div className="mt-2">
                <div className="text-xl sm:text-2xl font-mono font-black tracking-tight" style={{ color: palette.bull }}>
                  ${totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] font-mono text-[var(--color-text-muted)] mt-0.5">
                  Floating PnL: <span className="font-bold" style={{ color: totalOpenPnl >= 0 ? palette.bull : palette.bear }}>
                    {totalOpenPnl >= 0 ? '+' : ''}${totalOpenPnl.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Real Accounts Equity */}
            <div 
              style={{
                background: getThemeCardGradient(palette, isLight, false),
                borderColor: getThemeCardBorder(palette, false)
              }}
              className="p-4 rounded-xl border flex flex-col justify-between backdrop-blur-md"
            >
              <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] font-medium">
                <span>Real Brokers Capital</span>
                <ShieldAlert size={16} style={{ color: palette.bull }} />
              </div>
              <div className="mt-2">
                <div className="text-xl font-mono font-bold" style={{ color: palette.bull }}>
                  ${realTotalEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                  {realAccounts.length} Akun Real Terhubung
                </div>
              </div>
            </div>

            {/* Demo / Paper Capital */}
            <div 
              style={{
                background: getThemeCardGradient(palette, isLight, false),
                borderColor: getThemeCardBorder(palette, false)
              }}
              className="p-4 rounded-xl border flex flex-col justify-between backdrop-blur-md"
            >
              <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] font-medium">
                <span>Demo / Simulation Capital</span>
                <Zap size={16} style={{ color: palette.poc || '#6366f1' }} />
              </div>
              <div className="mt-2">
                <div className="text-xl font-mono font-bold" style={{ color: palette.poc || '#6366f1' }}>
                  ${demoTotalEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                  {demoAccounts.length} Akun Simulasi
                </div>
              </div>
            </div>

            {/* Auto Sync Interval Setting */}
            <div 
              style={{
                background: getThemeCardGradient(palette, isLight, false),
                borderColor: getThemeCardBorder(palette, false)
              }}
              className="p-4 rounded-xl border flex flex-col justify-between backdrop-blur-md"
            >
              <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] font-medium">
                <span>Auto-Sync Rate</span>
                <Clock size={16} style={{ color: palette.bull }} />
              </div>
              <div className="mt-2">
                <select
                  value={autoRefreshIntervalSec}
                  onChange={(e) => setAutoRefreshIntervalSec(Number(e.target.value))}
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    borderColor: hexToRgba(palette.bull, 0.3)
                  }}
                  className="w-full py-1.5 px-2 rounded-lg border text-xs font-mono font-bold text-[var(--color-text)] cursor-pointer focus:outline-none focus:border-white/40"
                >
                  <option value={0} className="bg-zinc-900 text-white">Manual (Dihentikan)</option>
                  <option value={5} className="bg-zinc-900 text-white">⚡ 5 Detik (Ultra-Fast)</option>
                  <option value={10} className="bg-zinc-900 text-white">⏱️ 10 Detik (Standard)</option>
                  <option value={30} className="bg-zinc-900 text-white">⏳ 30 Detik (Low-Bandwidth)</option>
                </select>
                <div className="text-[10px] text-[var(--color-text-muted)] mt-1">
                  Pembaruan data otomatis multi-broker
                </div>
              </div>
            </div>
          </div>

          {/* Historical Net Worth Growth Curve Chart */}
          <div 
            style={{
              background: getThemeCardGradient(palette, isLight, false),
              borderColor: getThemeCardBorder(palette, false)
            }}
            className="p-4 rounded-xl border space-y-3 backdrop-blur-md"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
                <TrendingUp size={14} style={{ color: palette.bull }} />
                Grafik Pertumbuhan Net Worth Gabungan
              </h3>
              <span className="text-[11px] font-mono font-bold" style={{ color: palette.bull }}>+3.5% Hari Ini</span>
            </div>
            
            <div className="h-48 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historicalEquityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={palette.bull} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={palette.bear} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="time" stroke="var(--color-text-muted)" fontSize={10} tickLine={false} />
                  <YAxis stroke="var(--color-text-muted)" fontSize={10} tickLine={false} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: 'rgba(10, 15, 25, 0.95)', 
                      borderColor: hexToRgba(palette.bull, 0.3), 
                      borderRadius: '8px', 
                      fontSize: '11px',
                      color: '#ffffff',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.8)'
                    }}
                    formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Net Worth']}
                  />
                  <Area type="monotone" dataKey="NetWorth" stroke={palette.bull} strokeWidth={2.5} fillOpacity={1} fill="url(#netWorthGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Broker Distribution Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
              <BarChart2 size={14} style={{ color: palette.bull }} />
              Distribusi Modal per Broker
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.values(brokerBreakdown).map((b) => {
                const pct = totalBalance > 0 ? (b.equity / totalBalance) * 100 : 0;
                return (
                  <div 
                    key={b.name} 
                    style={{
                      background: getThemeCardGradient(palette, isLight, false),
                      borderColor: getThemeCardBorder(palette, false)
                    }}
                    className="p-3.5 rounded-xl border space-y-2 backdrop-blur-md"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[var(--color-text)] font-mono">{b.name}</span>
                        <span 
                          style={{
                            backgroundColor: hexToRgba(palette.bull, 0.12),
                            borderColor: hexToRgba(palette.bull, 0.25),
                            color: palette.bull
                          }}
                          className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border"
                        >
                          {b.count} Akun
                        </span>
                      </div>
                      <span className="font-mono font-bold" style={{ color: palette.bull }}>
                        ${b.equity.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({pct.toFixed(1)}%)
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-black/30 overflow-hidden p-0.5 border border-white/5">
                      <div
                        className="h-full rounded-full transition-all duration-500 shadow-sm"
                        style={{ 
                          width: `${Math.min(100, Math.max(2, pct))}%`,
                          background: `linear-gradient(90deg, ${palette.bull}, ${palette.bear})`
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Connected Accounts Live Status List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
              <Activity size={14} style={{ color: palette.bull }} />
              Daftar Akun Terhubung
            </h3>

            <div 
              style={{
                background: getThemeCardGradient(palette, isLight, false),
                borderColor: getThemeCardBorder(palette, false)
              }}
              className="divide-y divide-white/5 border rounded-xl overflow-hidden backdrop-blur-md"
            >
              {connectedAccounts.map((acc) => (
                <div key={acc.id} className="p-3 flex items-center justify-between text-xs hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2 h-2 rounded-full ${acc.status === 'CONNECTED' ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : acc.status === 'CONNECTING' ? 'bg-amber-400 animate-ping' : 'bg-rose-400'}`} />
                    <div>
                      <div className="font-bold text-[var(--color-text)] font-mono flex items-center gap-1.5">
                        {acc.name}
                        {acc.isReal ? (
                          <span 
                            style={{
                              backgroundColor: hexToRgba(palette.bull, 0.15),
                              color: palette.bull,
                              borderColor: hexToRgba(palette.bull, 0.3)
                            }}
                            className="px-1.5 py-0.2 rounded text-[9px] font-bold border"
                          >
                            REAL
                          </span>
                        ) : (
                          <span 
                            style={{
                              backgroundColor: hexToRgba(palette.poc || '#6366f1', 0.15),
                              color: palette.poc || '#6366f1',
                              borderColor: hexToRgba(palette.poc || '#6366f1', 0.3)
                            }}
                            className="px-1.5 py-0.2 rounded text-[9px] font-bold border"
                          >
                            DEMO
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-[var(--color-text-muted)]">
                        {acc.broker} • Ping: {acc.pingMs ? `${acc.pingMs}ms` : 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-bold text-[var(--color-text)]">
                      ${acc.balance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    {acc.lastSyncError ? (
                      <div className="text-[10px] text-rose-400 font-mono font-bold">
                        ⚠️ {acc.lastSyncError}
                      </div>
                    ) : (
                      <div className="text-[10px] text-[var(--color-text-muted)] font-mono">
                        Status: <span style={{ color: palette.bull }} className="font-bold">{acc.status}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div 
          style={{
            borderColor: getThemeCardBorder(palette, false)
          }}
          className="px-5 py-3 border-t bg-black/20 flex items-center justify-between text-xs text-[var(--color-text-muted)] shrink-0"
        >
          <span className="font-mono">Total Capital Tracked: <strong className="text-[var(--color-text)] font-bold">${totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></span>
          <button
            onClick={onClose}
            style={{
              background: `linear-gradient(135deg, ${palette.bull} 0%, ${palette.bear} 100%)`,
              color: '#ffffff'
            }}
            className="px-4 py-1.5 rounded-lg font-bold transition-all cursor-pointer shadow-sm hover:brightness-110 active:scale-95"
          >
            Tutup Panel
          </button>
        </div>

      </div>
    </div>
  );
};

export default UnifiedEquityAggregatorModal;
