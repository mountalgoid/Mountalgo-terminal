import React, { useState, useEffect } from 'react';
import { ShieldAlert, Lock, AlertTriangle, Fingerprint, Activity, ServerCrash, PowerOff } from 'lucide-react';
import { useTrade } from '../context/TradeContext';

interface CircuitBreakerModalProps {
  isOpen: boolean;
  onClose: () => void;
  equity: number;
  drawdown: number;
}

export function CircuitBreakerModal({ isOpen, onClose, equity, drawdown }: CircuitBreakerModalProps) {
  const { closeAllPositions, cancelAllPendingOrders } = useTrade();
  const [unlockCode, setUnlockCode] = useState('');
  const [isLockedDown, setIsLockedDown] = useState(true);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (isOpen && isLockedDown) {
      // Auto trigger safety mechanisms upon open
      try {
        closeAllPositions();
        cancelAllPendingOrders();
      } catch(e) {}
      
      let timer = 5;
      const int = setInterval(() => {
        timer--;
        setCountdown(timer);
        if (timer <= 0) clearInterval(int);
      }, 1000);
      return () => clearInterval(int);
    }
  }, [isOpen, isLockedDown]);

  const handleUnlock = () => {
    if (unlockCode === 'APEX') {
      setIsLockedDown(false);
      setTimeout(onClose, 1000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Heavy Blur Backdrop */}
      <div className="absolute inset-0 bg-[var(--color-bg)]/60 backdrop-blur-[32px] animate-in fade-in duration-700" />
      
      {/* Danger Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,0,50,0.1)_0%,rgba(0,0,0,0.8)_100%)] pointer-events-none" />

      {/* Cyberpunk Circuit Breaker Panel */}
      <div className="relative w-full max-w-xl p-[1px] bg-gradient-to-b from-rose-500/50 to-transparent rounded-2xl shadow-[0_0_100px_rgba(244,63,94,0.3)] animate-in zoom-in-95 duration-500">
        <div className="bg-[#050510] rounded-2xl p-8 border border-rose-900/30">
          
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.4)] animate-pulse">
              <ShieldAlert className="w-10 h-10 text-rose-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-rose-500 tracking-widest uppercase" style={{ textShadow: '0 0 20px rgba(244,63,94,0.6)' }}>
                Black Swan Circuit Breaker
              </h2>
              <p className="text-rose-500/60 font-mono text-sm tracking-widest">
                SYS.LOCKDOWN // VAR LIMIT EXCEEDED
              </p>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-rose-950/20 border border-rose-900/20 p-4 rounded-xl">
              <div className="text-rose-500/50 text-xs font-bold uppercase mb-1 flex items-center gap-2">
                <Activity size={14} /> Maximum Drawdown
              </div>
              <div className="text-3xl font-mono text-rose-400 font-black">
                {drawdown.toFixed(2)}%
              </div>
            </div>
            <div className="bg-rose-950/20 border border-rose-900/20 p-4 rounded-xl">
              <div className="text-rose-500/50 text-xs font-bold uppercase mb-1 flex items-center gap-2">
                <AlertTriangle size={14} /> VaR Breach
              </div>
              <div className="text-3xl font-mono text-rose-400 font-black">
                CRITICAL
              </div>
            </div>
          </div>

          {/* Action Log */}
          <div className="space-y-3 mb-8 font-mono text-xs">
            <div className="flex items-center gap-3 text-emerald-500 opacity-80">
              <CheckIcon /> All active positions force-closed via market execution
            </div>
            <div className="flex items-center gap-3 text-emerald-500 opacity-80">
              <CheckIcon /> All pending limits/stops cancelled
            </div>
            <div className="flex items-center gap-3 text-rose-500 opacity-80">
              <ServerCrash className="w-4 h-4" /> Trading Engine Halted. Submitting cross-exchange hedge...
            </div>
          </div>

          {/* Override */}
          <div className="border-t border-rose-900/30 pt-6 mt-6">
            <label className="block text-rose-500/70 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
              <Lock size={14} /> Override Authentication
            </label>
            <div className="flex gap-3">
              <input
                type="password"
                placeholder="Enter Authorization Code (APEX)"
                value={unlockCode}
                onChange={e => setUnlockCode(e.target.value)}
                className="flex-1 bg-[var(--color-bg)]/50 border border-rose-900/40 rounded-lg px-4 font-mono text-rose-500 focus:outline-none focus:border-rose-500/50 transition-colors"
                disabled={countdown > 0}
              />
              <button
                onClick={handleUnlock}
                disabled={unlockCode !== 'APEX' || countdown > 0}
                className="px-6 py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-30 disabled:hover:bg-rose-600 text-white font-bold rounded-lg tracking-widest flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(225,29,72,0.4)]"
              >
                {countdown > 0 ? (
                  <>LOCKDOWN ({countdown}s)</>
                ) : (
                  <><Fingerprint size={18} /> OVERRIDE</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
