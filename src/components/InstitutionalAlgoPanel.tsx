import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { hexToRgba, getThemeModalGradient, getThemeCardBorder } from '../utils/themeGradient';
import { Clock, BarChart, Shield, Activity, Target } from 'lucide-react';

interface InstitutionalAlgoPanelProps {
  orderType: 'TWAP' | 'VWAP' | 'ICEBERG';
  algoSettings: {
    duration: string;
    participationRate: string;
    visibleSize: string;
    randomizeSize: boolean;
    startTime: string;
  };
  setAlgoSettings: (settings: any) => void;
  symbol: string;
}

const InstitutionalAlgoPanel = React.memo(function InstitutionalAlgoPanel({ 
  orderType, 
  algoSettings, 
  setAlgoSettings,
  symbol
}: InstitutionalAlgoPanelProps) {
  const { palette, isLight } = useTheme();

  const handleChange = (key: string, value: any) => {
    setAlgoSettings({ ...algoSettings, [key]: value });
  };

  return (
    <div 
      style={{
        background: getThemeModalGradient(palette, isLight),
        borderColor: getThemeCardBorder(palette, false),
        boxShadow: `0 16px 40px -4px rgba(0,0,0,0.8), 0 0 25px ${hexToRgba(palette.poc || palette.bull, 0.2)}`
      }}
      className="backdrop-blur-2xl rounded-xl border p-3.5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 shadow-2xl relative overflow-hidden"
    >
      {/* Accent Gradient Bar */}
      <div 
        className="h-[2px] w-full -mx-3.5 -mt-3.5 mb-3.5 shrink-0"
        style={{
          background: `linear-gradient(90deg, ${palette.bull} 0%, ${palette.poc || '#6366f1'} 50%, ${palette.bear} 100%)`
        }}
      />
      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2">
        <div className="flex items-center gap-2">
          {orderType === 'TWAP' && <Clock size={14} className="text-amber-400" />}
          {orderType === 'VWAP' && <BarChart size={14} className="text-sky-400" />}
          {orderType === 'ICEBERG' && <Shield size={14} className="text-emerald-400" />}
          <span className="text-[11px] font-bold text-[var(--color-text)] uppercase tracking-wider">
            {orderType} Algorithm Configuration
          </span>
        </div>
        <div className="bg-amber-500/10 px-2 py-0.5 rounded text-[9px] font-bold text-amber-500 border border-amber-500/20">
          INSTITUTIONAL
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {orderType === 'TWAP' && (
          <div className="space-y-1.5">
            <label className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-tight flex items-center gap-1">
              Execution Duration (Min)
            </label>
            <div className="relative">
              <input
                type="number"
                value={algoSettings?.duration ?? ''}
                onChange={(e) => handleChange('duration', e.target.value)}
                className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-lg py-2 pl-3 pr-8 text-xs text-[var(--color-text)] font-mono focus:border-amber-500/50 outline-none transition-colors"
                placeholder="60"
              />
              <Clock size={12} className="absolute right-3 top-2.5 text-[var(--color-text-muted)]" />
            </div>
            <p className="text-[9px] text-[var(--color-text-muted)] leading-tight">Orders will be split and executed evenly over this timeframe.</p>
          </div>
        )}

        {orderType === 'VWAP' && (
          <div className="space-y-1.5">
            <label className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-tight flex items-center gap-1">
              Participation Rate (%)
            </label>
            <div className="relative">
              <input
                type="number"
                value={algoSettings?.participationRate ?? ''}
                onChange={(e) => handleChange('participationRate', e.target.value)}
                className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-lg py-2 pl-3 pr-8 text-xs text-[var(--color-text)] font-mono focus:border-sky-500/50 outline-none transition-colors"
                placeholder="5"
              />
              <Activity size={12} className="absolute right-3 top-2.5 text-[var(--color-text-muted)]" />
            </div>
            <p className="text-[9px] text-[var(--color-text-muted)] leading-tight">Target volume percentage relative to market traded volume.</p>
          </div>
        )}

        {(orderType === 'ICEBERG' || orderType === 'TWAP' || orderType === 'VWAP') && (
          <div className="space-y-1.5">
            <label className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-tight flex items-center gap-1">
              Visible Display Size
            </label>
            <div className="relative">
              <input
                type="number"
                value={algoSettings?.visibleSize ?? ''}
                onChange={(e) => handleChange('visibleSize', e.target.value)}
                className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-lg py-2 pl-3 pr-8 text-xs text-[var(--color-text)] font-mono focus:border-emerald-500/50 outline-none transition-colors"
                placeholder="1.0"
              />
              <Target size={12} className="absolute right-3 top-2.5 text-[var(--color-text-muted)]" />
            </div>
            <p className="text-[9px] text-[var(--color-text-muted)] leading-tight">Only this amount will be visible in the Order Book (DOM).</p>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-tight">Execution Strategy</label>
          <div className="flex items-center gap-2 h-9">
            <button
              onClick={() => handleChange('randomizeSize', !algoSettings.randomizeSize)}
              className={`flex-1 h-full rounded-lg border text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                algoSettings.randomizeSize 
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300' 
                  : 'bg-[var(--color-input-bg)] border-[var(--color-input-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${algoSettings.randomizeSize ? 'bg-amber-400' : 'bg-gray-500'}`} />
              RANDOMIZE SLICES
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-2.5 flex items-start gap-2">
        <Shield size={14} className="text-amber-500 mt-0.5 shrink-0" />
        <p className="text-[9.5px] text-amber-200/70 leading-relaxed italic">
          Institutional execution algorithms minimize market impact by slicing large orders and simulating retail-like order flow. 
          Use for positions exceeding 5% of average daily volume.
        </p>
      </div>
    </div>
  );
});

export default InstitutionalAlgoPanel;
