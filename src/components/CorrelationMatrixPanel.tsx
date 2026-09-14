import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Target, Activity, Flame, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';

export function CorrelationMatrixPanel({ symbol }: { symbol: string }) {
  const { palette } = useTheme();
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Mock correlations based on symbol
  const getCorrelations = () => {
    const isCrypto = symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('SOL');
    if (isCrypto) {
      return [
        { pair: 'ETH/USD', corr: 0.85, status: 'HIGH', div: false },
        { pair: 'DXY', corr: -0.72, status: 'INVERSE', div: true },
        { pair: 'NQ100', corr: 0.65, status: 'MED', div: false },
      ];
    }
    return [
      { pair: 'DXY', corr: -0.88, status: 'INVERSE', div: false },
      { pair: 'EUR/GBP', corr: -0.45, status: 'WEAK', div: true },
      { pair: 'XAU/USD', corr: 0.55, status: 'MED', div: false },
    ];
  };

  const correlations = getCorrelations();

  if (isMinimized) {
    return (
      <div className="w-8 flex-shrink-0 bg-[var(--color-panel)] border-r border-[var(--color-border)] flex flex-col font-mono text-[10px] overflow-hidden select-none transition-all cursor-pointer hover:bg-[var(--color-hover)]" onClick={() => setIsMinimized(false)}>
        <div className="p-2 border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur-sm flex items-center justify-center h-[37px]">
          <ChevronRight size={14} className="text-[var(--color-text-muted)]" />
        </div>
        <div className="flex-1 flex flex-col items-center pt-4 gap-4">
          <Activity size={14} className="text-cyan-500" />
          <div className="text-[var(--color-text-muted)] font-bold tracking-widest [writing-mode:vertical-lr] rotate-180 flex items-center gap-2">
            MATRIX
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[140px] flex-shrink-0 bg-[var(--color-panel)] border-r border-[var(--color-border)] flex flex-col font-mono text-[10px] overflow-hidden select-none transition-all">
      <div className="p-2 border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur-sm flex items-center justify-between">
        <span className="font-bold text-[var(--color-text)] flex items-center gap-1.5"><Activity size={12} className="text-cyan-500" /> MATRIX</span>
        <button onClick={() => setIsMinimized(true)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
          <ChevronLeft size={14} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto scrollbar-thin p-1.5 space-y-1.5">
        {correlations.map((c, i) => {
          const isPos = c.corr > 0;
          return (
            <div key={i} className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-1.5 flex flex-col gap-1 relative overflow-hidden group hover:border-[var(--color-border-active)] transition-colors">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[var(--color-text)] text-[9.5px] truncate max-w-[65px]">{c.pair}</span>
                <span className={`font-black text-[9px] ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {c.corr > 0 ? '+' : ''}{c.corr.toFixed(2)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className={`text-[7.5px] px-1 rounded ${isPos ? 'bg-emerald-950/60 text-emerald-400' : 'bg-rose-950/60 text-rose-400'}`}>
                  {c.status}
                </span>
                
                {c.div ? (
                  <span className="text-[8px] flex items-center gap-0.5 text-amber-400 font-bold bg-amber-950/50 px-1 rounded animate-pulse border border-amber-500/30">
                    <Flame size={8} /> DIV
                  </span>
                ) : (
                  <span className="text-[8px] text-[var(--color-text-muted)] font-medium">SYNCED</span>
                )}
              </div>
              
              {/* Mini visual bar */}
              <div className="h-1 w-full bg-[var(--color-border)] rounded-full mt-0.5 overflow-hidden flex">
                {isPos ? (
                  <>
                    <div className="w-1/2" />
                    <div className="h-full bg-emerald-500" style={{ width: `${Math.abs(c.corr) * 50}%` }} />
                  </>
                ) : (
                  <>
                    <div className="h-full bg-rose-500 ml-auto" style={{ width: `${Math.abs(c.corr) * 50}%` }} />
                    <div className="w-1/2" />
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
