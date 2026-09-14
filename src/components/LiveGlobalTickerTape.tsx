import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { formatSmartPrice } from '../utils/numberFormatters';

const TICKERS = [
  { symbol: 'BTC/USD', price: 62450.00, change: 1.25, trend: [2,3,4,3,5,7,6,8,7,9,11,10,12,14,13] },
  { symbol: 'ETH/USD', price: 3420.50, change: 0.85, trend: [1,2,1,3,2,4,3,5,6,5,7,6,8,9,8] },
  { symbol: 'XAU/USD', price: 2345.10, change: -0.42, trend: [14,13,15,12,11,13,10,9,11,8,7,9,6,5,7] },
  { symbol: 'EUR/USD', price: 1.0850, change: 0.12, trend: [5,4,5,6,5,7,6,8,7,6,5,7,8,7,9] },
  { symbol: 'SOL/USD', price: 145.20, change: 5.40, trend: [1,2,4,3,6,5,8,7,10,9,12,11,14,13,15] },
  { symbol: 'PEPE/USD', price: 0.00000985, change: 12.40, trend: [1,3,2,5,4,7,6,9,8,11,10,13,12,15,14] },
  { symbol: 'AAPL', price: 190.50, change: 0.25, trend: [5,6,5,7,6,8,7,9,8,10,9,11,10,12,11] },
];

export function LiveGlobalTickerTape() {
  const { palette } = useTheme();
  
  return (
    <div className="w-full bg-[var(--color-panel)] border-b border-[var(--color-border)] overflow-hidden flex items-center h-6 sm:h-7 font-mono text-[9px] sm:text-[10px] select-none">
      <div className="flex animate-[marquee_40s_linear_infinite] whitespace-nowrap items-center">
        {[...TICKERS, ...TICKERS, ...TICKERS].map((t, i) => {
          const isUp = t.change >= 0;
          const color = isUp ? palette.bull : palette.bear;
          const pts = t.trend.map((val, idx) => `${(idx / 14) * 20},${20 - (val / 15) * 20}`).join(' ');
          
          return (
            <div key={i} className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-4 border-r border-[var(--color-border)]">
              <span className="font-bold text-[var(--color-text)] hidden sm:inline">{t.symbol}</span>
              <span className="font-bold text-[var(--color-text)] sm:hidden">{t.symbol.split('/')[0]}</span>
              <span className="text-[var(--color-text)] font-semibold">{formatSmartPrice(t.price, true, t.symbol)}</span>
              <span className="font-black flex items-center" style={{ color }}>
                {isUp ? '▲' : '▼'} {Math.abs(t.change)}%
              </span>
              <div className="w-5 h-4 overflow-hidden ml-1 opacity-70">
                <svg width="100%" height="100%" viewBox="0 0 20 20" preserveAspectRatio="none">
                  <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          );
        })}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
      `}} />
    </div>
  );
}
