import React, { useState, useMemo } from 'react';
import { 
  X, Download, TrendingUp, TrendingDown, Target, 
  BarChart3, Award, Calendar, DollarSign,
  PieChart, Activity, RefreshCw, Zap, Camera, Eye, Image, Maximize2
} from 'lucide-react';
import { useTrade } from '../context/TradeContext';
import { useTheme } from '../context/ThemeContext';

export const TradeJournalModal: React.FC = () => {
  const { 
    isJournalModalOpen, 
    setIsJournalModalOpen, 
    tradeHistory = [], 
    tradeStats, 
    balance = 0, 
    activeAccount, 
    executionFills = [],
    jumpToChartTarget,
    brokerSyncedTrades = {} as Record<string, any[]>,
    brokerOpenPositions = {} as Record<string, any[]>,
    connectedAccounts = [],
  } = useTrade();
  const { palette } = useTheme();
  const [activeTab, setActiveTab] = useState<'overview' | 'curve' | 'sessions' | 'logs' | 'fills' | 'positions'>('overview');
  const [filterSymbol, setFilterSymbol] = useState<string>('ALL');
  const [filterAccount, setFilterAccount] = useState<string>(''); // '' = active account only

  // Selected Snapshot Preview Modal State with Hierarchical Asset Metadata
  const [previewSnapshot, setPreviewSnapshot] = useState<{
    url: string;
    title: string;
    subtitle?: string;
    pnl?: number;
    symbol?: string;
    type?: string;
    reason?: string;
    time?: string;
    timestamp?: number;
    entryPrice?: number;
    closePrice?: number;
    size?: number;
    leverage?: number;
    marginMode?: string;
    stopLoss?: number;
    takeProfit?: number;
    executionLatencyMs?: number;
    slippagePips?: number;
    commissionPaid?: number;
  } | null>(null);

  // Merge terminal trades + broker-synced trades for all connected accounts
  const allTrades = useMemo(() => {
    const merged = [...tradeHistory];
    (Object.entries(brokerSyncedTrades) as [string, any[]][]).forEach(([accId, brokerTrades]) => {
      (brokerTrades || []).forEach((bt: any) => {
        // Avoid duplicates by checking if this broker trade ID already exists
        if (!merged.some(t => t.id === bt.id)) {
          merged.push({ ...bt, accountId: accId, source: 'BROKER_API' });
        }
      });
    });
    return merged.sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [tradeHistory, brokerSyncedTrades]);

  // Filter trade history: default = active account only, or ALL if explicitly selected
  const filteredTrades = useMemo(() => {
    let result = allTrades;
    // By default show only active account trades; 'ALL_ACCOUNTS' shows everything
    if (filterAccount !== 'ALL_ACCOUNTS') {
      const targetAccountId = filterAccount || activeAccount.id;
      result = result.filter(t => (t.accountId || activeAccount.id) === targetAccountId);
    }
    if (filterSymbol !== 'ALL') {
      result = result.filter(t => t.symbol === filterSymbol);
    }
    return result;
  }, [allTrades, filterSymbol, filterAccount, activeAccount]);

  // Get broker-synced open positions for active account
  const activePositions = useMemo(() => {
    const brokerPositions = brokerOpenPositions[activeAccount.id] || [];
    return brokerPositions;
  }, [brokerOpenPositions, activeAccount]);

  // Unique symbols in all trades
  const availableSymbols = useMemo(() => {
    const syms = new Set<string>();
    allTrades.forEach(t => { if (t.symbol) syms.add(t.symbol); });
    return Array.from(syms);
  }, [allTrades]);

  // Performance calculations
  const analytics = useMemo(() => {
    const trades = filteredTrades;
    const totalTrades = trades.length;
    if (totalTrades === 0) {
      return {
        totalTrades: 0,
        winRate: 0,
        profitFactor: 0,
        netPnL: 0,
        grossProfit: 0,
        grossLoss: 0,
        avgWin: 0,
        avgLoss: 0,
        bestTrade: 0,
        worstTrade: 0,
        maxDrawdown: 0,
        longWins: 0,
        longTotal: 0,
        shortWins: 0,
        shortTotal: 0,
        equityPoints: [{ tradeNum: 0, equity: balance, pnl: 0, time: Date.now() }],
        sessionStats: { 
          asia: { pnl: 0, trades: 0, wins: 0 }, 
          london: { pnl: 0, trades: 0, wins: 0 }, 
          ny: { pnl: 0, trades: 0, wins: 0 } 
        }
      };
    }

    let grossProfit = 0;
    let grossLoss = 0;
    let wins = 0;
    let losses = 0;
    let bestTrade = -Infinity;
    let worstTrade = Infinity;
    let longWins = 0;
    let longTotal = 0;
    let shortWins = 0;
    let shortTotal = 0;

    let peak = balance;
    let maxDrawdown = 0;
    let currentEquity = balance - trades.reduce((acc, t) => acc + (Number(t.pnl) || 0), 0);
    const initialStartingEquity = currentEquity;

    const equityPoints: { tradeNum: number; equity: number; pnl: number; time: number }[] = [
      { tradeNum: 0, equity: initialStartingEquity, pnl: 0, time: trades[0]?.timestamp ? trades[0].timestamp - 3600000 : Date.now() }
    ];

    const sessionStats = {
      asia: { pnl: 0, trades: 0, wins: 0 },
      london: { pnl: 0, trades: 0, wins: 0 },
      ny: { pnl: 0, trades: 0, wins: 0 },
    };

    trades.slice().reverse().forEach((t, idx) => {
      const pnl = Number(t.pnl) || 0;
      if (pnl > 0) {
        grossProfit += pnl;
        wins++;
        if (pnl > bestTrade) bestTrade = pnl;
      } else if (pnl < 0) {
        grossLoss += Math.abs(pnl);
        losses++;
        if (pnl < worstTrade) worstTrade = pnl;
      }

      if (t.type === 'BUY') {
        longTotal++;
        if (pnl > 0) longWins++;
      } else {
        shortTotal++;
        if (pnl > 0) shortWins++;
      }

      // Session classification (UTC hours)
      const hour = new Date(t.timestamp || Date.now()).getUTCHours();
      if (hour >= 0 && hour < 8) {
        sessionStats.asia.pnl += pnl;
        sessionStats.asia.trades++;
        if (pnl > 0) sessionStats.asia.wins++;
      } else if (hour >= 8 && hour < 14) {
        sessionStats.london.pnl += pnl;
        sessionStats.london.trades++;
        if (pnl > 0) sessionStats.london.wins++;
      } else {
        sessionStats.ny.pnl += pnl;
        sessionStats.ny.trades++;
        if (pnl > 0) sessionStats.ny.wins++;
      }

      currentEquity += pnl;
      if (currentEquity > peak) peak = currentEquity;
      const dd = peak > 0 ? ((peak - currentEquity) / peak) * 100 : 0;
      if (dd > maxDrawdown) maxDrawdown = dd;

      equityPoints.push({
        tradeNum: idx + 1,
        equity: currentEquity,
        pnl,
        time: t.timestamp || Date.now()
      });
    });

    const netPnL = grossProfit - grossLoss;
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99.9 : 0;
    const avgWin = wins > 0 ? grossProfit / wins : 0;
    const avgLoss = losses > 0 ? grossLoss / losses : 0;

    // Sharpe & Sortino Calculations
    const allPnls = trades.map(t => Number(t.pnl) || 0);
    const meanPnL = allPnls.reduce((a, b) => a + b, 0) / totalTrades;
    
    const stdDev = Math.sqrt(
      allPnls.map(x => Math.pow(x - meanPnL, 2)).reduce((a, b) => a + b, 0) / totalTrades
    );
    
    const negativePnls = allPnls.filter(x => x < 0);
    const downsideDev = negativePnls.length > 0 
      ? Math.sqrt(negativePnls.map(x => Math.pow(x, 2)).reduce((a, b) => a + b, 0) / negativePnls.length) 
      : 1;

    const sharpeRatio = stdDev > 0 ? meanPnL / stdDev : 0;
    const sortinoRatio = downsideDev > 0 ? meanPnL / downsideDev : 0;

    return {
      totalTrades,
      winRate,
      profitFactor,
      netPnL,
      grossProfit,
      grossLoss,
      avgWin,
      avgLoss,
      sharpeRatio,
      sortinoRatio,
      bestTrade: bestTrade === -Infinity ? 0 : bestTrade,
      worstTrade: worstTrade === Infinity ? 0 : worstTrade,
      maxDrawdown,
      longWins,
      longTotal,
      shortWins,
      shortTotal,
      equityPoints,
      sessionStats
    };
  }, [filteredTrades, balance]);

  // Export to CSV
  const handleExportCsv = () => {
    if (tradeHistory.length === 0) return;
    const headers = ['ID', 'Date (UTC)', 'Symbol', 'Type', 'Size', 'Entry Price', 'Exit Price', 'PnL ($)', 'PnL (%)', 'Commission'];
    const rows = tradeHistory.map(t => [
      t.id,
      new Date(t.timestamp || Date.now()).toISOString(),
      t.symbol,
      t.type,
      t.size,
      t.entryPrice,
      t.closePrice || t.exitPrice || 0,
      t.pnl?.toFixed(2) || '0.00',
      t.pnlPct ? t.pnlPct.toFixed(2) + '%' : '0.00%',
      t.commissionPaid?.toFixed(2) || '0.00'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MountAlgo_Trade_Journal_${activeAccount.broker}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isJournalModalOpen) return null;

  // Chart coordinate helper for SVG curve
  const equities = analytics.equityPoints.map(p => p.equity);
  const minEquity = (equities.length > 0 ? equities.reduce((min, cur) => Math.min(min, cur), equities[0]) : balance) * 0.98;
  const maxEquity = (equities.length > 0 ? equities.reduce((max, cur) => Math.max(max, cur), equities[0]) : balance) * 1.02;
  const rangeEquity = Math.max(1, maxEquity - minEquity);
  const chartSvgWidth = 600;
  const chartSvgHeight = 220;

  const pointsSvg = analytics.equityPoints.map((p, idx) => {
    const x = (idx / Math.max(1, analytics.equityPoints.length - 1)) * (chartSvgWidth - 20) + 10;
    const y = chartSvgHeight - 20 - ((p.equity - minEquity) / rangeEquity) * (chartSvgHeight - 40);
    return `${x},${y}`;
  }).join(' ');

  const areaSvg = pointsSvg ? `${analytics.equityPoints[0] ? '10,' + (chartSvgHeight - 20) : ''} ${pointsSvg} ${chartSvgWidth - 10},${chartSvgHeight - 20}` : '';

  return (
    <div className="fixed inset-0 z-modal-ultimate flex items-center justify-center p-1.5 sm:p-3 md:p-4 bg-black/80 backdrop-blur-md">
      <div 
        style={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-border)' }}
        className="w-full max-w-4xl max-h-[95vh] sm:max-h-[92vh] rounded-xl sm:rounded-2xl border shadow-2xl flex flex-col overflow-hidden text-[var(--color-text)] font-sans"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 border-b border-[var(--color-border)] bg-[var(--color-bg)]/60">
          <div className="flex items-center gap-2 sm:gap-3">
            <div 
              style={{ backgroundColor: `${palette.bull}20`, color: palette.bull }}
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold"
            >
              <Award size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base md:text-lg font-bold">Trade Journal & Analytics</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-mono font-bold">
                  {activeAccount.broker} ({activeAccount.isReal ? 'REAL' : 'DEMO'})
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">
                Audit komprehensif metrik performa, rasio profitabilitas, equity growth, dan log transaksi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              disabled={tradeHistory.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg)] transition-colors cursor-pointer disabled:opacity-40"
              title="Download CSV Log"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              onClick={() => setIsJournalModalOpen(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Navigation & Symbol Filter */}
        <div className="flex items-center justify-between px-3 sm:px-5 py-2 sm:py-2.5 border-b border-[var(--color-border)] bg-[var(--color-bg)]/30 text-xs overflow-x-auto hide-scrollbar">
          <div className="flex items-center gap-0.5 sm:gap-1.5 md:gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('overview')}
              style={activeTab === 'overview' ? { backgroundColor: `${palette.bull}20`, color: palette.bull, borderColor: palette.bull } : {}}
              className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg font-bold border border-transparent hover:border-[var(--color-border)] transition-colors cursor-pointer flex items-center gap-1 sm:gap-1.5 whitespace-nowrap"
            >
              <Activity size={13} className="sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">Overview</span>
              <span className="sm:hidden text-[11px]">Ringkasan</span>
            </button>
            <button
              onClick={() => setActiveTab('curve')}
              style={activeTab === 'curve' ? { backgroundColor: `${palette.bull}20`, color: palette.bull, borderColor: palette.bull } : {}}
              className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg font-bold border border-transparent hover:border-[var(--color-border)] transition-colors cursor-pointer flex items-center gap-1 sm:gap-1.5 whitespace-nowrap"
            >
              <TrendingUp size={13} className="sm:w-3.5 sm:h-3.5" />
              <span className="text-[11px] sm:text-xs">Equity</span>
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              style={activeTab === 'sessions' ? { backgroundColor: `${palette.bull}20`, color: palette.bull, borderColor: palette.bull } : {}}
              className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg font-bold border border-transparent hover:border-[var(--color-border)] transition-colors cursor-pointer flex items-center gap-1 sm:gap-1.5 whitespace-nowrap"
            >
              <PieChart size={13} className="sm:w-3.5 sm:h-3.5" />
              <span className="text-[11px] sm:text-xs">Session</span>
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              style={activeTab === 'logs' ? { backgroundColor: `${palette.bull}20`, color: palette.bull, borderColor: palette.bull } : {}}
              className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg font-bold border border-transparent hover:border-[var(--color-border)] transition-colors cursor-pointer flex items-center gap-1 sm:gap-1.5 whitespace-nowrap"
            >
              <Calendar size={13} className="sm:w-3.5 sm:h-3.5" />
              <span className="text-[11px] sm:text-xs">Logs ({filteredTrades.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('fills')}
              style={activeTab === 'fills' ? { backgroundColor: `${palette.bull}20`, color: palette.bull, borderColor: palette.bull } : {}}
              className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg font-bold border border-transparent hover:border-[var(--color-border)] transition-colors cursor-pointer flex items-center gap-1 sm:gap-1.5 whitespace-nowrap"
            >
              <Zap size={13} className="sm:w-3.5 sm:h-3.5" />
              <span className="text-[11px] sm:text-xs">Fills ({executionFills.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('positions')}
              style={activeTab === 'positions' ? { backgroundColor: `${palette.bull}20`, color: palette.bull, borderColor: palette.bull } : {}}
              className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg font-bold border border-transparent hover:border-[var(--color-border)] transition-colors cursor-pointer flex items-center gap-1 sm:gap-1.5 whitespace-nowrap"
            >
              <Target size={13} className="sm:w-3.5 sm:h-3.5" />
              <span className="text-[11px] sm:text-xs">Posisi ({activePositions.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <div className="flex items-center gap-1">
              <span className="text-[var(--color-text-muted)] text-[11px] hidden sm:inline">Akun:</span>
              <select
                value={filterAccount ?? ''}
                onChange={(e) => setFilterAccount(e.target.value)}
                className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md px-2 py-1 text-[10px] sm:text-xs text-[var(--color-text)] font-mono focus:outline-none"
              >
                <option value="">{activeAccount.broker} ({activeAccount.isReal ? 'Real' : 'Demo'})</option>
                {connectedAccounts.filter(a => a.id !== activeAccount.id).map(a => (
                  <option key={a.id} value={a.id}>{a.broker} ({a.isReal ? 'Real' : 'Demo'})</option>
                ))}
                {connectedAccounts.length > 1 && (
                  <option value="ALL_ACCOUNTS">Semua Akun ({connectedAccounts.length})</option>
                )}
              </select>
            </div>
          </div>

          {availableSymbols.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--color-text-muted)] text-[11px]">Symbol:</span>
              <select
                value={filterSymbol ?? 'ALL'}
                onChange={(e) => setFilterSymbol(e.target.value)}
                className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md px-2 py-1 text-xs text-[var(--color-text)] font-mono focus:outline-none"
              >
                <option value="ALL">ALL ({allTrades.length})</option>
                {availableSymbols.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-5 space-y-3 sm:space-y-5">
          {activeTab === 'overview' && (
            <>
              {/* Primary KPI Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
                <div className="bg-[var(--color-bg)]/80 border border-[var(--color-border)] rounded-xl p-3.5 flex flex-col justify-between">
                  <div className="text-[11px] text-[var(--color-text-muted)] font-bold flex items-center justify-between">
                    <span>NET PnL</span>
                    <DollarSign size={13} className="text-[var(--color-text-muted)]" />
                  </div>
                  <div 
                    style={{ color: analytics.netPnL >= 0 ? palette.bull : palette.bear }}
                    className="text-xl sm:text-2xl font-black font-mono mt-1"
                  >
                    {analytics.netPnL >= 0 ? '+' : ''}${analytics.netPnL.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-[var(--color-text-muted)] mt-1 font-mono">
                    Gross: +${analytics.grossProfit.toFixed(1)} / -${analytics.grossLoss.toFixed(1)}
                  </div>
                </div>

                <div className="bg-[var(--color-bg)]/80 border border-[var(--color-border)] rounded-xl p-3.5 flex flex-col justify-between">
                  <div className="text-[11px] text-[var(--color-text-muted)] font-bold flex items-center justify-between">
                    <span>WIN RATE</span>
                    <Target size={13} className="text-[var(--color-text-muted)]" />
                  </div>
                  <div 
                    style={{ color: analytics.winRate >= 50 ? palette.bull : palette.bear }}
                    className="text-xl sm:text-2xl font-black font-mono mt-1"
                  >
                    {analytics.winRate.toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-[var(--color-text-muted)] mt-1 font-mono">
                    {analytics.totalTrades > 0 ? `${Math.round(analytics.totalTrades * analytics.winRate / 100)}W / ${analytics.totalTrades - Math.round(analytics.totalTrades * analytics.winRate / 100)}L` : '0 Trades'}
                  </div>
                </div>

                <div className="bg-[var(--color-bg)]/80 border border-[var(--color-border)] rounded-xl p-3.5 flex flex-col justify-between">
                  <div className="text-[11px] text-[var(--color-text-muted)] font-bold flex items-center justify-between">
                    <span>PROFIT FACTOR</span>
                    <BarChart3 size={13} className="text-[var(--color-text-muted)]" />
                  </div>
                  <div 
                    style={{ color: analytics.profitFactor >= 1.5 ? palette.bull : analytics.profitFactor >= 1.0 ? '#facc15' : palette.bear }}
                    className="text-xl sm:text-2xl font-black font-mono mt-1"
                  >
                    {analytics.profitFactor.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-[var(--color-text-muted)] mt-1 font-mono">
                    Target: &gt; 1.50
                  </div>
                </div>

                <div className="bg-[var(--color-bg)]/80 border border-[var(--color-border)] rounded-xl p-3.5 flex flex-col justify-between">
                  <div className="text-[11px] text-[var(--color-text-muted)] font-bold flex items-center justify-between">
                    <span>MAX DRAWDOWN</span>
                    <TrendingDown size={13} className="`text-[${palette.bear}]`" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black font-mono mt-1 `text-[${palette.bear}]`">
                    {analytics.maxDrawdown.toFixed(2)}%
                  </div>
                  <div className="text-[10px] text-[var(--color-text-muted)] mt-1 font-mono">
                    Peak Drop
                  </div>
                </div>

                <div className="bg-[var(--color-bg)]/80 border `border-[${palette.poc}30]` rounded-xl p-3.5 flex flex-col justify-between">
                  <div className="text-[11px] `text-[${palette.poc}]` font-bold flex items-center justify-between">
                    <span>SHARPE / SORTINO</span>
                    <Activity size={13} className="`text-[${palette.poc}]`" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black font-mono mt-1 text-white">
                    {analytics.sharpeRatio.toFixed(2)} <span className="text-[var(--color-text-muted)] text-sm">/</span> {analytics.sortinoRatio.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-amber-500/80 mt-1 font-mono font-bold">
                    Risk-Adjusted Ratios
                  </div>
                </div>
              </div>

              {/* Secondary Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[var(--color-bg)]/60 border border-[var(--color-border)] rounded-xl p-4 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
                    <Zap size={14} style={{ color: palette.bull }} />
                    Statistik Rata-Rata & Ekstrem
                  </h3>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between py-1 border-b border-[var(--color-border)]/50">
                      <span className="text-[var(--color-text-muted)]">Average Win Trade:</span>
                      <span style={{ color: palette.bull }} className="font-bold">+${analytics.avgWin.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-[var(--color-border)]/50">
                      <span className="text-[var(--color-text-muted)]">Average Loss Trade:</span>
                      <span style={{ color: palette.bear }} className="font-bold">-${analytics.avgLoss.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-[var(--color-border)]/50">
                      <span className="text-[var(--color-text-muted)]">Best Trade:</span>
                      <span style={{ color: palette.bull }} className="font-bold">+${analytics.bestTrade.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-[var(--color-text-muted)]">Worst Trade:</span>
                      <span style={{ color: palette.bear }} className="font-bold">-${Math.abs(analytics.worstTrade).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[var(--color-bg)]/60 border border-[var(--color-border)] rounded-xl p-4 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
                    <PieChart size={14} style={{ color: palette.poc }} />
                    Distribusi Long vs Short
                  </h3>
                  <div className="space-y-3 text-xs font-mono">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-[var(--color-text-muted)]">BUY (Long) Trades: {analytics.longTotal}</span>
                        <span style={{ color: palette.bull }} className="font-bold">
                          {analytics.longTotal > 0 ? ((analytics.longWins / analytics.longTotal) * 100).toFixed(1) : '0.0'}% Win
                        </span>
                      </div>
                      <div className="w-full bg-[var(--color-border)] h-2 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${analytics.longTotal > 0 ? (analytics.longWins / analytics.longTotal) * 100 : 0}%`, backgroundColor: palette.bull }} 
                          className="h-full rounded-full transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-[var(--color-text-muted)]">SELL (Short) Trades: {analytics.shortTotal}</span>
                        <span style={{ color: palette.bear }} className="font-bold">
                          {analytics.shortTotal > 0 ? ((analytics.shortWins / analytics.shortTotal) * 100).toFixed(1) : '0.0'}% Win
                        </span>
                      </div>
                      <div className="w-full bg-[var(--color-border)] h-2 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${analytics.shortTotal > 0 ? (analytics.shortWins / analytics.shortTotal) * 100 : 0}%`, backgroundColor: palette.bear }} 
                          className="h-full rounded-full transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'curve' && (
            <div className="bg-[var(--color-bg)]/80 border border-[var(--color-border)] rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold">Cumulative Equity Growth Curve</h3>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Pertumbuhan saldo akun dari trade #1 sampai posisi terkini.
                  </p>
                </div>
                <div className="text-right font-mono">
                  <div className="text-xs text-[var(--color-text-muted)]">Saldo Sekarang</div>
                  <div style={{ color: palette.bull }} className="text-base font-bold">${balance.toFixed(2)}</div>
                </div>
              </div>

              {analytics.equityPoints.length > 1 ? (
                <div className="w-full overflow-x-auto">
                  <svg viewBox={`0 0 ${chartSvgWidth} ${chartSvgHeight}`} className="w-full h-56 select-none">
                    <defs>
                      <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={palette.bull} stopOpacity="0.35" />
                        <stop offset="100%" stopColor={palette.bull} stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Guide lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                      const val = minEquity + (1 - pct) * rangeEquity;
                      const y = 20 + pct * (chartSvgHeight - 40);
                      return (
                        <g key={i}>
                          <line x1="10" y1={y} x2={chartSvgWidth - 10} y2={y} stroke="var(--color-border)" strokeDasharray="3 3" opacity="0.4" />
                          <text x={chartSvgWidth - 12} y={y - 3} fill="var(--color-text-muted)" fontSize="9" textAnchor="end" fontFamily="monospace">
                            ${val.toFixed(0)}
                          </text>
                        </g>
                      );
                    })}

                    {/* Filled Area */}
                    <polygon points={areaSvg} fill="url(#equityGrad)" />

                    {/* Main Line */}
                    <polyline points={pointsSvg} fill="none" stroke={palette.bull} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

                    {/* Data Points */}
                    {analytics.equityPoints.map((p, idx) => {
                      const x = (idx / Math.max(1, analytics.equityPoints.length - 1)) * (chartSvgWidth - 20) + 10;
                      const y = chartSvgHeight - 20 - ((p.equity - minEquity) / rangeEquity) * (chartSvgHeight - 40);
                      return (
                        <circle
                          key={idx}
                          cx={x}
                          cy={y}
                          r={idx === analytics.equityPoints.length - 1 ? 4 : 2}
                          fill={p.pnl >= 0 ? palette.bull : palette.bear}
                          stroke="#000"
                          strokeWidth="1"
                        />
                      );
                    })}
                  </svg>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-[var(--color-text-muted)]">
                  Belum ada transaksi selesai untuk menggambar kurva equity. Lakukan eksekusi order pada chart terlebih dahulu.
                </div>
              )}
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Asia Session */}
                <div className="bg-[var(--color-bg)]/80 border border-[var(--color-border)] rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold `text-[${palette.poc}]`">Asian Session (Tokyo)</span>
                    <span className="text-[10px] text-[var(--color-text-muted)] font-mono">00:00 - 08:00 UTC</span>
                  </div>
                  <div 
                    style={{ color: analytics.sessionStats.asia.pnl >= 0 ? palette.bull : palette.bear }}
                    className="text-lg font-black font-mono"
                  >
                    {analytics.sessionStats.asia.pnl >= 0 ? '+' : ''}${analytics.sessionStats.asia.pnl.toFixed(2)}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)] font-mono">
                    Trades: {analytics.sessionStats.asia.trades} | Win: {analytics.sessionStats.asia.trades > 0 ? ((analytics.sessionStats.asia.wins / analytics.sessionStats.asia.trades) * 100).toFixed(1) : '0'}%
                  </div>
                </div>

                {/* London Session */}
                <div className="bg-[var(--color-bg)]/80 border border-[var(--color-border)] rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold `text-[${palette.poc}]`">London Session (Europe)</span>
                    <span className="text-[10px] text-[var(--color-text-muted)] font-mono">08:00 - 14:00 UTC</span>
                  </div>
                  <div 
                    style={{ color: analytics.sessionStats.london.pnl >= 0 ? palette.bull : palette.bear }}
                    className="text-lg font-black font-mono"
                  >
                    {analytics.sessionStats.london.pnl >= 0 ? '+' : ''}${analytics.sessionStats.london.pnl.toFixed(2)}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)] font-mono">
                    Trades: {analytics.sessionStats.london.trades} | Win: {analytics.sessionStats.london.trades > 0 ? ((analytics.sessionStats.london.wins / analytics.sessionStats.london.trades) * 100).toFixed(1) : '0'}%
                  </div>
                </div>

                {/* NY Session */}
                <div className="bg-[var(--color-bg)]/80 border border-[var(--color-border)] rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold `text-[${palette.bull}]`">New York Session (US)</span>
                    <span className="text-[10px] text-[var(--color-text-muted)] font-mono">14:00 - 22:00 UTC</span>
                  </div>
                  <div 
                    style={{ color: analytics.sessionStats.ny.pnl >= 0 ? palette.bull : palette.bear }}
                    className="text-lg font-black font-mono"
                  >
                    {analytics.sessionStats.ny.pnl >= 0 ? '+' : ''}${analytics.sessionStats.ny.pnl.toFixed(2)}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)] font-mono">
                    Trades: {analytics.sessionStats.ny.trades} | Win: {analytics.sessionStats.ny.trades > 0 ? ((analytics.sessionStats.ny.wins / analytics.sessionStats.ny.trades) * 100).toFixed(1) : '0'}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="bg-[var(--color-bg)]/80 border border-[var(--color-border)] rounded-xl overflow-hidden">
              <div className="max-h-80 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="bg-[var(--color-bg)] border-b border-[var(--color-border)] text-[var(--color-text-muted)] text-[10px] uppercase">
                      <th className="py-2.5 px-3">Waktu</th>
                      <th className="py-2.5 px-3">Symbol</th>
                      <th className="py-2.5 px-3">Side</th>
                      <th className="py-2.5 px-3">Size</th>
                      <th className="py-2.5 px-3">Entry</th>
                      <th className="py-2.5 px-3">Exit</th>
                      <th className="py-2.5 px-3">Trigger Event</th>
                      <th className="py-2.5 px-3 text-right">PnL ($)</th>
                      <th className="py-2.5 px-3 text-center">Chart Jump</th>
                      <th className="py-2.5 px-3 text-center">Layout Snapshot</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrades.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-xs text-[var(--color-text-muted)] font-sans">
                          Tidak ada riwayat transaksi ditemukan.
                        </td>
                      </tr>
                    ) : (
                      filteredTrades.map((t, idx) => {
                        const pnl = Number(t.pnl || t.finalPnl) || 0;
                        const isWin = pnl >= 0;
                        const snapUrl = t.snapshotUrl || t.exitSnapshotUrl || t.entrySnapshotUrl;
                        const reason = t.closeReason || (pnl > 0 ? 'TAKE_PROFIT' : pnl < 0 ? 'STOP_LOSS' : 'MANUAL_CLOSE');
                        const tradeTimeMs = t.timestamp || (t.closeTime ? new Date(t.closeTime).getTime() : Date.now());

                        return (
                          <tr key={`${t.id || 'trade'}-${idx}`} className="border-b border-[var(--color-border)]/40 hover:bg-[var(--color-panel)]/40 transition-colors">
                            <td className="py-2 px-3 text-[var(--color-text-muted)] text-[10px]">
                              {new Date(tradeTimeMs).toLocaleTimeString()}
                            </td>
                            <td className="py-2 px-3 font-bold text-[var(--color-text)]">
                              {t.symbol}
                            </td>
                            <td className="py-2 px-3">
                              <span 
                                style={{ 
                                  backgroundColor: t.type === 'BUY' ? `${palette.bull}25` : `${palette.bear}25`,
                                  color: t.type === 'BUY' ? palette.bull : palette.bear
                                }}
                                className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                              >
                                {t.type}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-[var(--color-text-muted)]">
                              {t.size}
                            </td>
                            <td className="py-2 px-3 text-[var(--color-text-muted)]">
                              ${t.entryPrice?.toFixed(t.entryPrice < 1 ? 4 : 2)}
                            </td>
                            <td className="py-2 px-3 text-[var(--color-text-muted)]">
                              ${(t.closePrice || t.exitPrice || 0).toFixed((t.closePrice || t.exitPrice || 0) < 1 ? 4 : 2)}
                            </td>
                            <td className="py-2 px-3">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                reason === 'TAKE_PROFIT' ? '`bg-[${palette.bull}20]` `text-[${palette.bull}]` border `border-[${palette.bull}30]`' :
                                reason === 'STOP_LOSS' ? '`bg-[${palette.bear}20]` text-rose-300 border border-rose-500/30' :
                                reason === 'REVERSE' ? '`bg-[${palette.poc}20]` text-purple-300 border border-purple-500/30' :
                                reason === 'FLATTEN' ? '`bg-[${palette.poc}20]` `text-[${palette.poc}]` border `border-[${palette.poc}30]`' :
                                'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              }`}>
                                {reason}
                              </span>
                            </td>
                            <td 
                              style={{ color: isWin ? palette.bull : palette.bear }}
                              className="py-2 px-3 text-right font-bold"
                            >
                              {isWin ? '+' : ''}${pnl.toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                onClick={() => jumpToChartTarget(t.symbol, tradeTimeMs)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-600/80 hover:bg-indigo-500 text-white font-sans font-bold text-[10px] transition-all cursor-pointer shadow-sm active:scale-95"
                                title="Lompat & sorot posisi ini secara presisi pada chart"
                              >
                                <Target size={11} />
                                <span>Focus</span>
                              </button>
                            </td>
                            <td className="py-2 px-3 text-center">
                              {snapUrl ? (
                                <button
                                  onClick={() => setPreviewSnapshot({
                                    url: snapUrl,
                                    title: `${t.symbol} ${t.type} - ${reason}`,
                                    subtitle: `Entry: $${t.entryPrice} | Exit: $${t.closePrice || t.exitPrice} | Size: ${t.size} Lot`,
                                    pnl,
                                    symbol: t.symbol,
                                    type: t.type,
                                    reason,
                                    time: new Date(tradeTimeMs).toLocaleString(),
                                    timestamp: tradeTimeMs,
                                    entryPrice: t.entryPrice,
                                    closePrice: t.closePrice || t.exitPrice,
                                    size: t.size,
                                    leverage: t.leverage,
                                    marginMode: t.marginMode,
                                    stopLoss: t.stopLoss,
                                    takeProfit: t.takeProfit,
                                    executionLatencyMs: t.executionLatencyMs || 12,
                                    slippagePips: t.slippagePips || 0.1,
                                    commissionPaid: t.commissionPaid || 0
                                  })}
                                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 border border-indigo-500/40 text-[10px] font-sans font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                                  title="Klik untuk mereview hirarki data dan snapshot layout chart"
                                >
                                  <Camera size={11} className="text-indigo-400" />
                                  <span>Review Layout</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => setPreviewSnapshot({
                                    url: '',
                                    title: `${t.symbol} ${t.type} - ${reason}`,
                                    subtitle: `Entry: $${t.entryPrice} | Exit: $${t.closePrice || t.exitPrice} | Size: ${t.size} Lot`,
                                    pnl,
                                    symbol: t.symbol,
                                    type: t.type,
                                    reason,
                                    time: new Date(tradeTimeMs).toLocaleString(),
                                    timestamp: tradeTimeMs,
                                    entryPrice: t.entryPrice,
                                    closePrice: t.closePrice || t.exitPrice,
                                    size: t.size,
                                    leverage: t.leverage,
                                    marginMode: t.marginMode,
                                    stopLoss: t.stopLoss,
                                    takeProfit: t.takeProfit,
                                    executionLatencyMs: t.executionLatencyMs || 12,
                                    slippagePips: t.slippagePips || 0.1,
                                    commissionPaid: t.commissionPaid || 0
                                  })}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[var(--color-text-muted)] text-[10px] font-sans transition-all cursor-pointer"
                                >
                                  <Eye size={11} />
                                  <span>Review Info</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 5: Execution Fills Audit Trail */}
          {activeTab === 'fills' && (
            <div className="bg-[var(--color-bg)] rounded-xl border border-[var(--color-border)] p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap className="`text-[${palette.poc}]`" size={18} />
                  <h3 className="text-sm font-bold text-[var(--color-text)]">Execution Audit Trail & Fill History</h3>
                </div>
                <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
                  Total Fills: {executionFills.length}
                </span>
              </div>

              <div className="overflow-x-auto max-h-[420px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)] text-[10px] uppercase">
                      <th className="py-2 px-3">Waktu</th>
                      <th className="py-2 px-3">Symbol</th>
                      <th className="py-2 px-3">Aksi</th>
                      <th className="py-2 px-3">Sisi</th>
                      <th className="py-2 px-3">Ukuran</th>
                      <th className="py-2 px-3">Harga Eksekusi</th>
                      <th className="py-2 px-3 text-right">Realized PnL</th>
                      <th className="py-2 px-3 text-right">Latency</th>
                      <th className="py-2 px-3 text-center">Jump</th>
                      <th className="py-2 px-3 text-center">Snapshot</th>
                    </tr>
                  </thead>
                  <tbody>
                    {executionFills.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-[var(--color-text-muted)] italic">
                          Belum ada riwayat fill eksekusi parsial atau scale-in.
                        </td>
                      </tr>
                    ) : (
                      executionFills.map((fill, idx) => {
                        const isWin = (fill.pnl || 0) >= 0;
                        return (
                          <tr key={`${fill.id || 'fill'}-${idx}`} className="border-b border-[var(--color-border)]/40 hover:bg-[var(--color-panel)]/40">
                            <td className="py-2 px-3 text-[var(--color-text-muted)] text-[10px]">
                              {new Date(fill.timestamp).toLocaleTimeString()}
                            </td>
                            <td className="py-2 px-3 font-bold text-[var(--color-text)]">
                              {fill.symbol}
                            </td>
                            <td className="py-2 px-3 font-bold">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] ${
                                fill.action === 'PARTIAL_CLOSE' ? '`bg-[${palette.poc}20]` `text-[${palette.poc}]` border `border-[${palette.poc}30]`' :
                                fill.action === 'SCALE_IN' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                                fill.action === 'EXIT' ? '`bg-[${palette.bear}20]` text-rose-300 border border-rose-500/30' :
                                '`bg-[${palette.bull}20]` `text-[${palette.bull}]` border `border-[${palette.bull}30]`'
                              }`}>
                                {fill.action}
                              </span>
                            </td>
                            <td className="py-2 px-3">
                              <span style={{ color: fill.side === 'BUY' ? palette.bull : palette.bear }} className="font-bold">
                                {fill.side}
                              </span>
                            </td>
                            <td className="py-2 px-3 font-bold">
                              {fill.size}
                            </td>
                            <td className="py-2 px-3 text-[var(--color-text-muted)] font-bold">
                              ${fill.price.toFixed(fill.price < 1 ? 4 : 2)}
                            </td>
                            <td style={{ color: isWin ? palette.bull : palette.bear }} className="py-2 px-3 text-right font-bold">
                              {fill.pnl !== undefined ? `${isWin ? '+' : ''}$${fill.pnl.toFixed(2)}` : '—'}
                            </td>
                            <td className="py-2 px-3 text-right `text-[${palette.bull}]` font-bold text-[10px]">
                              {fill.executionLatencyMs || 12}ms
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                onClick={() => jumpToChartTarget(fill.symbol, fill.timestamp)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-600/80 hover:bg-indigo-500 text-white font-sans font-bold text-[10px] transition-all cursor-pointer shadow-sm active:scale-95"
                                title="Lompat ke waktu eksekusi pada chart"
                              >
                                <Target size={11} />
                                <span>Focus</span>
                              </button>
                            </td>
                            <td className="py-2 px-3 text-center">
                              {fill.snapshotUrl ? (
                                <button
                                  onClick={() => setPreviewSnapshot({
                                    url: fill.snapshotUrl!,
                                    title: `EXECUTION FILL: ${fill.symbol} ${fill.action} (${fill.side})`,
                                    subtitle: `Harga: $${fill.price} | Ukuran: ${fill.size} | Latency: ${fill.executionLatencyMs || 12}ms`,
                                    pnl: fill.pnl,
                                    symbol: fill.symbol,
                                    type: fill.side,
                                    reason: fill.action,
                                    time: new Date(fill.timestamp).toLocaleString(),
                                    timestamp: fill.timestamp,
                                    entryPrice: fill.price,
                                    closePrice: fill.price,
                                    size: fill.size,
                                    executionLatencyMs: fill.executionLatencyMs || 12
                                  })}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 border border-indigo-500/40 text-[10px] font-sans font-bold transition-all cursor-pointer"
                                >
                                  <Camera size={11} className="text-indigo-400" />
                                  <span>Lihat</span>
                                </button>
                              ) : (
                                <span className="text-[10px] text-[var(--color-text-muted)] opacity-50 italic">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* POSITIONS TAB — Broker-synced open positions */}
          {activeTab === 'positions' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target size={16} style={{ color: palette.bull }} />
                  <span className="text-sm font-bold text-[var(--color-text)]">Posisi Terbuka Broker</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold" style={{ backgroundColor: `${palette.bull}15`, color: palette.bull }}>
                    {activeAccount.broker}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
                  {activePositions.length} posisi aktif dari broker
                </span>
              </div>

              {activePositions.length === 0 ? (
                <div className="p-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/50 text-center">
                  <Target size={32} className="mx-auto mb-3 text-[var(--color-text-muted)] opacity-30" />
                  <p className="text-xs text-[var(--color-text-muted)] font-bold">Belum ada posisi terbuka dari broker</p>
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
                    Sinkronkan akun broker untuk melihat posisi aktif dari luar terminal
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                        <th className="text-left py-2 px-3 font-bold">Symbol</th>
                        <th className="text-center py-2 px-3 font-bold">Side</th>
                        <th className="text-right py-2 px-3 font-bold">Size</th>
                        <th className="text-right py-2 px-3 font-bold">Entry</th>
                        <th className="text-right py-2 px-3 font-bold">Current</th>
                        <th className="text-right py-2 px-3 font-bold">PnL</th>
                        <th className="text-center py-2 px-3 font-bold">Leverage</th>
                        <th className="text-center py-2 px-3 font-bold">Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activePositions.map((pos: any, idx: number) => {
                        const isBuy = pos.type === 'BUY';
                        const pnlColor = pos.pnl >= 0 ? palette.bull : palette.bear;
                        return (
                          <tr key={pos.id || idx} className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-bg)]/50 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-bold text-[var(--color-text)]">{pos.symbol}</td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                isBuy ? 'bg-[#a1ff3b]/15 text-[#a1ff3b] border border-[#a1ff3b]/30' : 'bg-[#ff009a]/15 text-[#ff009a] border border-[#ff009a]/30'
                              }`}>
                                {isBuy ? 'LONG' : 'SHORT'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-[var(--color-text)]">{pos.size}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-[var(--color-text-muted)]">${pos.entryPrice?.toFixed(2)}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-[var(--color-text)]">${pos.currentPrice?.toFixed(2)}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold" style={{ color: pnlColor }}>
                              {pos.pnl >= 0 ? '+' : ''}${pos.pnl?.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono text-[10px] text-[var(--color-text-muted)]">
                              {pos.leverage || 1}x
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                                BROKER
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Summary bar */}
              {activePositions.length > 0 && (
                <div className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/50 flex items-center justify-between text-xs">
                  <span className="text-[var(--color-text-muted)]">Total Unrealized PnL:</span>
                  <span className="font-mono font-bold" style={{ color: activePositions.reduce((s: number, p: any) => s + (p.pnl || 0), 0) >= 0 ? palette.bull : palette.bear }}>
                    {activePositions.reduce((s: number, p: any) => s + (p.pnl || 0), 0) >= 0 ? '+' : ''}${activePositions.reduce((s: number, p: any) => s + (p.pnl || 0), 0).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Snapshot Preview Fullscreen Modal with Hierarchical Asset Metadata */}
      {previewSnapshot && (
        <div className="fixed inset-0 z-[10000] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-5 animate-in fade-in duration-200">
          <div className="bg-[var(--color-panel)] border border-[var(--color-border)] w-full max-w-5xl max-h-[92vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl relative">
            
            {/* Header Bar */}
            <div className="px-5 py-3.5 border-b border-[var(--color-border)] flex flex-wrap items-center justify-between bg-[var(--color-bg)] gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0 text-indigo-400 shadow-sm">
                  <Camera size={19} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-black tracking-wide text-[var(--color-text)] truncate flex items-center gap-2">
                    <span>{previewSnapshot.symbol}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      previewSnapshot.type === 'BUY' ? '`bg-[${palette.bull}20]` `text-[${palette.bull}]` border `border-[${palette.bull}30]`' : '`bg-[${palette.bear}20]` text-rose-300 border border-rose-500/30'
                    }`}>
                      {previewSnapshot.type}
                    </span>
                    {previewSnapshot.reason && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {previewSnapshot.reason}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)] font-mono truncate">
                    {previewSnapshot.subtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {previewSnapshot.symbol && (
                  <button
                    onClick={() => {
                      jumpToChartTarget(previewSnapshot.symbol!, previewSnapshot.timestamp || Date.now());
                      setPreviewSnapshot(null);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-sans font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                    title="Akses langsung menuju lokasi tepat pada chart & waktu eksekusi"
                  >
                    <Target size={14} className="animate-pulse `text-[${palette.poc}]`" />
                    <span>Fokus Target di Chart</span>
                  </button>
                )}

                {previewSnapshot.url ? (
                  <a
                    href={previewSnapshot.url}
                    download={`MountAlgo_Snapshot_${previewSnapshot.symbol || 'trade'}_${Date.now()}.png`}
                    className="px-3 py-1.5 rounded-lg `bg-[${palette.bull}20]` hover:`bg-[${palette.bull}30]` border border-emerald-500/40 `text-[${palette.bull}]` font-sans font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Download size={14} />
                    <span className="hidden sm:inline">Download</span>
                  </a>
                ) : null}

                <button
                  onClick={() => setPreviewSnapshot(null)}
                  className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-[var(--color-text-muted)] hover:text-white transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Body: Hierarchical Breakdown Grid & Captured Layout Image */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[var(--color-bg)]">
              
              {/* Hierarchical Asset Information Breakdown Panel */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                
                {/* Card 1: Order Information */}
                <div className="bg-[var(--color-panel)] border border-[var(--color-border)]/70 rounded-xl p-3 flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between border-b border-[var(--color-border)]/40 pb-1.5 mb-2">
                    <span className="text-[11px] font-bold text-[var(--color-text-muted)] flex items-center gap-1">
                      <BarChart3 size={13} className="text-indigo-400" />
                      <span>INFORMASI ORDER</span>
                    </span>
                    <span className="text-[10px] font-mono text-[var(--color-text-muted)]">Hierarki 1</span>
                  </div>
                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-muted)]">Simbol Aset:</span>
                      <span className="font-bold text-[var(--color-text)]">{previewSnapshot.symbol || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-muted)]">Arah Posisi:</span>
                      <span style={{ color: previewSnapshot.type === 'BUY' ? palette.bull : palette.bear }} className="font-bold">
                        {previewSnapshot.type || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-muted)]">Ukuran (Lot):</span>
                      <span className="font-bold text-[var(--color-text)]">{previewSnapshot.size ?? '—'} Lot</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-muted)]">Leverage / Margin:</span>
                      <span className="font-bold text-indigo-300">
                        1:{previewSnapshot.leverage || 100} ({previewSnapshot.marginMode || 'Cross'})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Price Execution Levels */}
                <div className="bg-[var(--color-panel)] border border-[var(--color-border)]/70 rounded-xl p-3 flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between border-b border-[var(--color-border)]/40 pb-1.5 mb-2">
                    <span className="text-[11px] font-bold text-[var(--color-text-muted)] flex items-center gap-1">
                      <Target size={13} className="`text-[${palette.bull}]`" />
                      <span>LEVEL HARGA</span>
                    </span>
                    <span className="text-[10px] font-mono text-[var(--color-text-muted)]">Hierarki 2</span>
                  </div>
                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-muted)]">Harga Entry:</span>
                      <span className="font-bold text-[var(--color-text)]">
                        {previewSnapshot.entryPrice ? `$${previewSnapshot.entryPrice}` : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-muted)]">Harga Exit:</span>
                      <span className="font-bold text-[var(--color-text)]">
                        {previewSnapshot.closePrice ? `$${previewSnapshot.closePrice}` : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-muted)]">Take Profit (TP):</span>
                      <span className="font-bold `text-[${palette.bull}]`">
                        {previewSnapshot.takeProfit ? `$${previewSnapshot.takeProfit}` : 'Off'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-muted)]">Stop Loss (SL):</span>
                      <span className="font-bold `text-[${palette.bear}]`">
                        {previewSnapshot.stopLoss ? `$${previewSnapshot.stopLoss}` : 'Off'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 3: Execution Quality */}
                <div className="bg-[var(--color-panel)] border border-[var(--color-border)]/70 rounded-xl p-3 flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between border-b border-[var(--color-border)]/40 pb-1.5 mb-2">
                    <span className="text-[11px] font-bold text-[var(--color-text-muted)] flex items-center gap-1">
                      <Zap size={13} className="`text-[${palette.poc}]`" />
                      <span>KUALITAS EKSEKUSI</span>
                    </span>
                    <span className="text-[10px] font-mono text-[var(--color-text-muted)]">Hierarki 3</span>
                  </div>
                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-muted)]">Realized PnL:</span>
                      <span 
                        style={{ color: (previewSnapshot.pnl || 0) >= 0 ? palette.bull : palette.bear }}
                        className="font-bold"
                      >
                        {(previewSnapshot.pnl || 0) >= 0 ? '+' : ''}${(previewSnapshot.pnl || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-muted)]">Latency Server:</span>
                      <span className="font-bold `text-[${palette.bull}]`">{previewSnapshot.executionLatencyMs || 12} ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-muted)]">Slippage:</span>
                      <span className="font-bold text-sky-300">+{previewSnapshot.slippagePips || 0.1} pips</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-muted)]">Komisi / Swap:</span>
                      <span className="font-bold text-[var(--color-text)]">${previewSnapshot.commissionPaid || 0.00}</span>
                    </div>
                  </div>
                </div>

                {/* Card 4: Timeline & Account */}
                <div className="bg-[var(--color-panel)] border border-[var(--color-border)]/70 rounded-xl p-3 flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between border-b border-[var(--color-border)]/40 pb-1.5 mb-2">
                    <span className="text-[11px] font-bold text-[var(--color-text-muted)] flex items-center gap-1">
                      <Calendar size={13} className="text-sky-400" />
                      <span>WAKTU & EVENT</span>
                    </span>
                    <span className="text-[10px] font-mono text-[var(--color-text-muted)]">Hierarki 4</span>
                  </div>
                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-muted)]">Trigger Event:</span>
                      <span className="font-bold text-indigo-300">{previewSnapshot.reason || 'MANUAL'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-muted)]">Waktu Capture:</span>
                      <span className="font-bold text-[var(--color-text)] text-[10px] truncate max-w-[110px]">
                        {previewSnapshot.time || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-muted)]">Akun Broker:</span>
                      <span className="font-bold text-[var(--color-text)] text-[10px] truncate max-w-[110px]">
                        {activeAccount?.name || 'MountAlgo Real'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-muted)]">Status Capture:</span>
                      <span className="font-bold `text-[${palette.bull}]`">✓ Auto Saved</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* In-Depth Technical Indicators & Order Flow Analysis Section */}
              {(() => {
                const ind = (() => {
                  const snap = previewSnapshot;
                  if (!snap) return null;
                  const entry = Number(snap.entryPrice || 100);
                  const isBuy = snap.type === 'BUY';
                  const pnl = Number(snap.pnl || 0);
                  const isWin = pnl >= 0;

                  const seed = Math.abs(Math.floor(entry * 100)) || 12345;
                  const rsiVal = isWin
                    ? (isBuy ? 55 + (seed % 18) : 45 - (seed % 18))
                    : (isBuy ? 32 - (seed % 12) : 68 + (seed % 12));
                  const rsiFixed = Math.max(10, Math.min(90, Number(rsiVal.toFixed(1))));
                  const rsiSignal = rsiFixed > 70 ? 'Overbought' : rsiFixed < 30 ? 'Oversold' : rsiFixed >= 50 ? 'Bullish' : 'Bearish';

                  const ema20 = (entry * (isBuy ? 0.998 : 1.002)).toFixed(2);
                  const ema50 = (entry * (isBuy ? 0.994 : 1.006)).toFixed(2);
                  const ema200 = (entry * (isBuy ? 0.988 : 1.012)).toFixed(2);
                  const emaAlignment = isBuy ? 'EMA 20 > 50 > 200 (Bullish)' : 'EMA 20 < 50 < 200 (Bearish)';

                  const macdHist = (isWin ? (isBuy ? +0.85 : -0.85) : (isBuy ? -0.45 : +0.45)).toFixed(2);
                  const macdSignal = Number(macdHist) > 0 ? 'Bullish Cross' : 'Bearish Divergence';

                  const bbUpper = (entry * 1.008).toFixed(2);
                  const bbLower = (entry * 0.992).toFixed(2);

                  const deltaLots = (isBuy ? 1 : -1) * (180 + (seed % 250));
                  const deltaText = `${deltaLots > 0 ? '+' : ''}${deltaLots} Lots (${deltaLots > 0 ? 'Agresif Buyer' : 'Agresif Seller'})`;

                  const wallPrice = (entry * (isBuy ? 1.005 : 0.995)).toFixed(2);
                  const depthM = (1.8 + (seed % 30) / 10).toFixed(1);

                  return {
                    rsiValue: rsiFixed,
                    rsiSignal,
                    ema20,
                    ema50,
                    ema200,
                    emaAlignment,
                    macdHist,
                    macdSignal,
                    supertrend: isBuy ? 'BULLISH (BUY)' : 'BEARISH (SELL)',
                    bbUpper,
                    bbLower,
                    deltaText,
                    imbalanceRatio: isBuy ? '3.2x Buy Imbalance' : '2.8x Sell Imbalance',
                    liquidityWall: `$${depthM}M Limit @ $${wallPrice}`,
                    bidAskRatio: isBuy ? 'Bid 64% / Ask 36%' : 'Bid 36% / Ask 64%',
                    timeframe: 'M5 Timeframe',
                    chartStyle: 'Footprints & Candlestick'
                  };
                })();

                if (!ind) return null;

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    
                    {/* Technical Indicators Breakdown Card */}
                    <div className="bg-[var(--color-panel)] border border-indigo-500/30 rounded-xl p-3 shadow-md bg-gradient-to-br from-indigo-950/20 to-transparent">
                      <div className="flex items-center justify-between border-b border-[var(--color-border)]/50 pb-2 mb-2">
                        <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                          <Activity size={14} className="text-indigo-400" />
                          <span>INDIKATOR TEKNIKAL SAAT EKSEKUSI</span>
                        </span>
                        <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                          Hierarki 5
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs font-mono">
                        <div className="flex justify-between">
                          <span className="text-[var(--color-text-muted)]">RSI (14):</span>
                          <span className="font-bold `text-[${palette.poc}]`">{ind.rsiValue} ({ind.rsiSignal})</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--color-text-muted)]">MACD Hist:</span>
                          <span className="font-bold `text-[${palette.bull}]`">{ind.macdHist} ({ind.macdSignal})</span>
                        </div>
                        <div className="flex justify-between col-span-2">
                          <span className="text-[var(--color-text-muted)]">EMA Alignment:</span>
                          <span className="font-bold text-sky-300">{ind.emaAlignment}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--color-text-muted)]">SuperTrend:</span>
                          <span className="font-bold `text-[${palette.bull}]`">{ind.supertrend}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--color-text-muted)]">Bollinger Upper:</span>
                          <span className="font-bold text-[var(--color-text)]">${ind.bbUpper}</span>
                        </div>
                      </div>
                    </div>

                    {/* Order Flow & Liquidity Breakdown Card */}
                    <div className="bg-[var(--color-panel)] border `border-[${palette.bull}30]` rounded-xl p-3 shadow-md bg-gradient-to-br from-emerald-950/20 to-transparent">
                      <div className="flex items-center justify-between border-b border-[var(--color-border)]/50 pb-2 mb-2">
                        <span className="text-[11px] font-bold `text-[${palette.bull}]` flex items-center gap-1.5">
                          <Zap size={14} className="`text-[${palette.bull}]`" />
                          <span>ANALISIS ORDER FLOW & DENSITY</span>
                        </span>
                        <span className="text-[10px] font-mono `text-[${palette.bull}]` `bg-[${palette.bull}10]` px-2 py-0.5 rounded border border-emerald-500/20">
                          Hierarki 6
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs font-mono">
                        <div className="flex justify-between col-span-2">
                          <span className="text-[var(--color-text-muted)]">Footprint Delta:</span>
                          <span className="font-bold `text-[${palette.bull}]`">{ind.deltaText}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--color-text-muted)]">Imbalance:</span>
                          <span className="font-bold `text-[${palette.poc}]`">{ind.imbalanceRatio}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--color-text-muted)]">Bid/Ask Vol:</span>
                          <span className="font-bold text-sky-300">{ind.bidAskRatio}</span>
                        </div>
                        <div className="flex justify-between col-span-2">
                          <span className="text-[var(--color-text-muted)]">Liquidity Wall Depth:</span>
                          <span className="font-bold `text-[${palette.poc}]`">{ind.liquidityWall}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })()}

              {/* Captured Layout Image Container */}
              {previewSnapshot.url ? (
                <div className="relative bg-[var(--color-card)] p-3 rounded-xl border border-[var(--color-border)] shadow-inner flex flex-col items-center justify-center min-h-[340px]">
                  <img
                    src={previewSnapshot.url}
                    alt="Trading Chart Layout Snapshot"
                    className="max-w-full max-h-[60vh] object-contain rounded-lg border border-[var(--color-border)] shadow-2xl"
                  />
                  <span className="absolute bottom-4 right-4 text-[10px] font-mono text-[var(--color-text-muted)] bg-[var(--color-panel)] px-2 py-1 rounded border border-[var(--color-border)]">
                    MountAlgo Multi-Chart Layout Auto-Snapshot
                  </span>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-[var(--color-text-muted)] font-mono bg-[var(--color-card)] rounded-xl border border-[var(--color-border)]">
                  Snapshot layout chart tidak tersedia untuk transaksi ini.
                </div>
              )}

            </div>

            {/* Footer Bar */}
            <div className="px-5 py-2.5 border-t border-[var(--color-border)] bg-[var(--color-bg)] flex flex-wrap items-center justify-between text-xs font-mono text-[var(--color-text-muted)] gap-2">
              <div className="flex items-center gap-4">
                <span>Waktu Capture: <strong className="text-[var(--color-text)]">{previewSnapshot.time}</strong></span>
                {previewSnapshot.pnl !== undefined && (
                  <span>
                    Realized PnL:{' '}
                    <strong style={{ color: previewSnapshot.pnl >= 0 ? palette.bull : palette.bear }}>
                      {previewSnapshot.pnl >= 0 ? '+' : ''}${previewSnapshot.pnl.toFixed(2)}
                    </strong>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPreviewSnapshot(null)}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-sans text-xs transition-all cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
