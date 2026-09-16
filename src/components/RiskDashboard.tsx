import React from 'react';
import { ShieldAlert, Activity, TrendingDown, Target } from 'lucide-react';
import { motion } from 'motion/react';
import { RiskSettings } from '../types/trading';

interface RiskDashboardProps {
  settings: RiskSettings;
  currentDrawdown: number;
  isRiskExceeded: boolean;
  balance: number;
  equity: number;
}

export function RiskDashboard({ settings, currentDrawdown, isRiskExceeded, balance, equity }: RiskDashboardProps) {
  const pnl = equity - balance;
  const pnlPercent = (pnl / balance) * 100;

  const [volatilityGlow, setVolatilityGlow] = React.useState<'bullish' | 'bearish' | 'void' | null>(null);
  const prevEquityRef = React.useRef(equity);
  
  React.useEffect(() => {
    if (!equity || !prevEquityRef.current) {
      prevEquityRef.current = equity;
      return;
    }
    const diff = equity - prevEquityRef.current;
    const pctChange = Math.abs(diff) / prevEquityRef.current;
    
    if (pctChange > 0.0005) { // 0.05% jump in equity
      setVolatilityGlow(diff > 0 ? 'bullish' : 'bearish');
      const timer = setTimeout(() => setVolatilityGlow(null), 2500);
      prevEquityRef.current = equity;
      return () => clearTimeout(timer);
    }
    prevEquityRef.current = equity;
  }, [equity]);

  return (
    <div className={`panel-material rounded-xl overflow-hidden shadow-[0_0_25px_rgba(8,145,178,0.15)] relative ${volatilityGlow ? `volatility-glow-${volatilityGlow}` : ''}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 pointer-events-none" />
      <div className="relative bg-[var(--color-panel)]/40 p-4 border-b border-[var(--color-border)]/30 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3">
          <ShieldAlert className={`w-5 h-5 ${isRiskExceeded ? 'text-rose-500 animate-pulse' : 'text-emerald-500'}`} />
          <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">Hedge Fund Risk Manager</h2>
        </div>
        <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isRiskExceeded ? 'bg-rose-500/20 text-rose-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
          {isRiskExceeded ? 'Risk Limit Breached' : 'Secure Mode Active'}
        </div>
      </div>

      <div className="relative grid grid-cols-2 md:grid-cols-4 divide-x divide-zinc-800/50">
        <RiskStat 
          label="Daily Drawdown" 
          value={`${currentDrawdown.toFixed(2)}%`} 
          limit={`Max ${settings.maxDailyDrawdown}%`}
          status={currentDrawdown > settings.maxDailyDrawdown ? 'danger' : 'normal'}
          icon={<TrendingDown className="w-4 h-4" />}
        />
        <RiskStat 
          label="Equity/Balance" 
          value={`$${equity.toLocaleString()}`} 
          subValue={`Bal: $${balance.toLocaleString()}`}
          status={pnl < 0 ? 'warning' : 'success'}
          icon={<Activity className="w-4 h-4" />}
        />
        <RiskStat 
          label="Profit/Loss" 
          value={`${pnl >= 0 ? '+' : ''}$${pnl.toLocaleString()}`} 
          subValue={`${pnlPercent.toFixed(2)}%`}
          status={pnl < 0 ? 'danger' : 'success'}
          icon={<TrendingDown className={`w-4 h-4 ${pnl >= 0 ? 'rotate-180' : ''}`} />}
        />
        <RiskStat 
          label="Account Health" 
          value={isRiskExceeded ? 'CRITICAL' : 'OPTIMAL'} 
          limit="Margin: 100%"
          status={isRiskExceeded ? 'danger' : 'success'}
          icon={<Target className="w-4 h-4" />}
        />
      </div>

      {isRiskExceeded && (
        <motion.div 
          initial={{ height: 0 }}
          animate={{ height: 'auto' }}
          className="bg-rose-500 text-white text-[11px] font-bold text-center py-2 uppercase tracking-tighter"
        >
          WARNING: SYSTEM HALTED. RISK PARAMETERS BREACHED. LIQUIDATION PROTOCOL ACTIVE.
        </motion.div>
      )}
    </div>
  );
}

function RiskStat({ label, value, limit, subValue, status, icon }: any) {
  const statusColors = {
    danger: 'text-rose-500',
    warning: 'text-amber-500',
    success: 'text-emerald-500',
    normal: 'text-zinc-400'
  };

  return (
    <div className="p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-tight">
        {icon}
        {label}
      </div>
      <div className={`text-xl font-mono font-bold ${statusColors[status as keyof typeof statusColors]}`}>
        {value}
      </div>
      {limit && <div className="text-[9px] text-zinc-600 font-mono italic">{limit}</div>}
      {subValue && <div className="text-[9px] text-zinc-600 font-mono">{subValue}</div>}
    </div>
  );
}
