import React, { useState, useEffect } from 'react';
import { Zap, TrendingUp, TrendingDown, XCircle, RotateCcw, Shield, Keyboard, AlertOctagon, Flame, X } from 'lucide-react';
import { useTrade } from '../context/TradeContext';
import { useTheme } from '../context/ThemeContext';
import { hexToRgba, getThemeModalGradient, getThemeCardBorder } from '../utils/themeGradient';

interface QuickScalperBarProps {
  symbol: string;
  chartId?: string;
  currentPrice: number;
  isForex: boolean;
  onOpenHotkeyModal?: () => void;
  isFocused: boolean;
  onFocusChart?: () => void;
  className?: string;
}

const QuickScalperBar = React.memo(function QuickScalperBar({
  symbol,
  chartId = 'chart1',
  currentPrice,
  isForex,
  onOpenHotkeyModal,
  isFocused,
  onFocusChart,
  className = ''
}: QuickScalperBarProps) {
  const { palette, isLight } = useTheme();
  const {
    focusedSymbol,
    focusedChartId,
    setFocusedChart,
    volumePresets,
    activePresetIndex,
    setActivePresetIndex,
    hotkeyMode,
    quickTradeAction,
    hotkeysEnabled,
    setHotkeysEnabled,
    positions
  } = useTrade();


  // Local flash pulse on execution
  const [flashAction, setFlashAction] = useState<'BUY' | 'SELL' | 'CLOSE' | 'REVERSE' | 'FLATTEN' | null>(null);

  const presets = isForex ? volumePresets.forex : volumePresets.crypto;
  const currentVolume = presets[activePresetIndex] ?? (isForex ? 0.1 : 100);

  const currentPos = positions.find(p => p.symbol === symbol);

  const handleAction = (action: 'BUY' | 'SELL' | 'CLOSE' | 'REVERSE' | 'FLATTEN' | 'AUTO_BE') => {
    // Skip focus operations when already focused (faster for scalping)
    if (!isCurrentFocus) {
      if (onFocusChart) onFocusChart();
      setFocusedChart(chartId, symbol);
    }
    // Execute immediately — no delay
    quickTradeAction(action, symbol, currentPrice);

    if (action !== 'AUTO_BE') {
      setFlashAction(action as any);
      setTimeout(() => setFlashAction(null), 400);
    }
  };

  // Flash ring + glow (inline style for theme-aware colors)
  const flashStyle: React.CSSProperties = flashAction === 'BUY' ? { boxShadow: `0 0 20px ${palette.bull}60, inset 0 0 0 2px ${palette.bull}` } : flashAction === 'SELL' ? { boxShadow: `0 0 20px ${palette.bear}60, inset 0 0 0 2px ${palette.bear}` } : flashAction === 'CLOSE' ? { boxShadow: '0 0 20px rgba(255,255,255,0.4), inset 0 0 0 2px rgba(255,255,255,0.4)' } : flashAction === 'REVERSE' ? { boxShadow: `0 0 20px ${palette.poc}50, inset 0 0 0 2px ${palette.poc}` } : flashAction === 'FLATTEN' ? { boxShadow: `0 0 25px ${palette.bear}70, inset 0 0 0 2px ${palette.bear}` } : {};

  const isCurrentFocus = isFocused || (focusedSymbol === symbol && (!chartId || focusedChartId === chartId));

  const formatPriceDisplay = (p: number) => {
    if (!p) return '0.00';
    return isForex ? p.toFixed(5) : p > 500 ? p.toFixed(2) : p.toFixed(4);
  };

  return (
    <div 
      onClick={() => {
        if (onFocusChart) onFocusChart();
        setFocusedChart(chartId, symbol);
      }}
      style={{
        background: getThemeModalGradient(palette, isLight),
        borderColor: isCurrentFocus ? palette.bull : getThemeCardBorder(palette, false),
        boxShadow: isCurrentFocus 
          ? `0 10px 30px rgba(0,0,0,0.6), 0 0 20px ${hexToRgba(palette.bull, 0.3)}` 
          : `0 8px 24px rgba(0,0,0,0.5), 0 0 12px ${hexToRgba(palette.bull, 0.1)}`,
        ...flashStyle
      }}
      className={`backdrop-blur-2xl border rounded-lg sm:rounded-xl px-1.5 sm:px-3 py-1 sm:py-1.5 flex flex-wrap items-center justify-between gap-1 sm:gap-1.5 md:gap-2 text-[10px] sm:text-xs transition-all select-none relative tap-fix ${className}`}
    >      {/* 1. Left: Focus Indicator & Symbol */}
      <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onFocusChart) onFocusChart();
            setFocusedChart(chartId, symbol);
          }}
          style={isCurrentFocus ? { backgroundColor: `${palette.bull}20`, color: palette.bull, borderColor: `${palette.bull}50`, boxShadow: `0 0 10px ${palette.bull}30` } : {}}
          className={`flex items-center gap-0.5 sm:gap-1 px-1 sm:px-2 py-0.5 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] font-mono font-bold transition-all cursor-pointer border ${
            isCurrentFocus
              ? ''
              : 'bg-[var(--color-bg)]/5 text-[var(--color-text-muted)] border-[var(--color-border)]/30 hover:text-[var(--color-text)]'
          }`}
          title="Klik untuk memfokuskan keyboard hotkeys ke chart ini"
        >
          <Zap size={10} style={{ color: isCurrentFocus ? palette.bull : undefined }} className={isCurrentFocus ? `fill-current animate-pulse` : 'text-[var(--color-text-muted)]'} />
          <span className="hidden sm:inline">{isCurrentFocus ? 'HOTKEYS AKTIF' : 'FOKUS'}</span>
          <span className="sm:hidden">{isCurrentFocus ? '⚡' : '🎯'}</span>
        </button>

        <span className="font-bold tracking-wide text-[var(--color-text)] text-[10px] sm:text-xs hidden sm:inline">{symbol}</span>
      </div>

      {/* 2. Middle: Buy / Sell Action Buttons with Hotkey Labels */}
      <div className="flex items-center gap-0.5 sm:gap-1 md:gap-1.5">
        {/* BUY Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleAction('BUY');
          }}
          style={{
            backgroundColor: `${palette.bull}20`,
            borderColor: `${palette.bull}80`,
            color: palette.bull,
          }}
          className="group relative flex items-center gap-0.5 sm:gap-1.5 px-1.5 sm:px-2.5 md:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-lg border font-bold text-[10px] sm:text-xs hover:brightness-125 active:scale-95 transition-all cursor-pointer shadow-sm"
          title={`Beli Instan ${currentVolume} ${isForex ? 'Lot' : symbol} (${hotkeyMode === 'shift' ? 'Shift+B' : 'B'})`}
        >
          <TrendingUp size={11} className="stroke-[2.5]" />
          <span>BUY</span>
          <span className="font-mono text-[10px] sm:text-[11px] opacity-90 hidden sm:inline">{formatPriceDisplay(currentPrice)}</span>
          <span className="ml-0.5 sm:ml-1 text-[8px] sm:text-[9px] font-mono px-0.5 sm:px-1 py-0.2 rounded bg-[var(--color-bg)]/40 border border-[var(--color-border)]/30 opacity-75 group-hover:opacity-100">
            {hotkeyMode === 'shift' ? '⇧B' : 'B'}
          </span>
        </button>

        {/* SELL Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleAction('SELL');
          }}
          style={{
            backgroundColor: `${palette.bear}20`,
            borderColor: `${palette.bear}80`,
            color: palette.bear,
          }}
          className="group relative flex items-center gap-0.5 sm:gap-1.5 px-1.5 sm:px-2.5 md:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-lg border font-bold text-[10px] sm:text-xs hover:brightness-125 active:scale-95 transition-all cursor-pointer shadow-sm"
          title={`Jual Instan ${currentVolume} ${isForex ? 'Lot' : symbol} (${hotkeyMode === 'shift' ? 'Shift+S' : 'S'})`}
        >
          <TrendingDown size={11} className="stroke-[2.5]" />
          <span>SELL</span>
          <span className="font-mono text-[10px] sm:text-[11px] opacity-90 hidden sm:inline">{formatPriceDisplay(currentPrice)}</span>
          <span className="ml-0.5 sm:ml-1 text-[8px] sm:text-[9px] font-mono px-0.5 sm:px-1 py-0.2 rounded bg-[var(--color-bg)]/40 border border-[var(--color-border)]/30 opacity-75 group-hover:opacity-100">
            {hotkeyMode === 'shift' ? '⇧S' : 'S'}
          </span>
        </button>
      </div>

      {/* 3. Preset Volume Pills (Hotkeys 1 - 5) - Hidden on smallest screens */}
      <div className="hidden md:flex items-center gap-0.5 sm:gap-1 bg-[var(--color-bg)] p-0.5 rounded-md sm:rounded-lg border border-[var(--color-border)]">
        <span className="text-[8px] sm:text-[9px] font-mono text-[var(--color-text-muted)] px-0.5 sm:px-1 hidden md:inline">VOL [1-5]:</span>
        {presets.map((vol, idx) => {
          const isSelected = activePresetIndex === idx;
          return (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setActivePresetIndex(idx);
              }}
              style={isSelected ? { backgroundColor: palette.poc, color: '#000000', borderColor: `${palette.poc}90`, boxShadow: `0 0 8px ${palette.poc}40` } : {}}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer border ${
                isSelected 
                  ? ''
                  : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)]/5'
              }`}
              title={`Preset Volume ${idx + 1} (${vol} ${isForex ? 'Lot' : ''}) - Tekan angka ${idx + 1}`}
            >
              <span className="text-[8px] opacity-60 mr-0.5 hidden xs:inline">{idx + 1}:</span>
              <span>{vol}</span>
            </button>
          );
        })}
      </div>

      {/* 4. Right Quick Utility Buttons (Close, Reverse, Auto-BE, Flatten, Hotkey Info) */}
      <div className="flex items-center gap-0.5 sm:gap-1">
        {/* Close Active Position Button */}
        {currentPos && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAction('CLOSE');
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] hover:bg-[var(--color-bg)] text-[var(--color-text)] text-[10px] font-bold transition-all cursor-pointer"
            title={`Tutup Posisi ${symbol} (${hotkeyMode === 'shift' ? 'Shift+C' : 'C'})`}
          >
            <XCircle size={11} style={{ color: palette.poc }} />
            <span className="hidden sm:inline">Close</span>
            <span className="text-[8.5px] font-mono text-[var(--color-text-muted)]">{hotkeyMode === 'shift' ? '⇧C' : 'C'}</span>
          </button>
        )}

        {/* Reverse Position Button */}
        {currentPos && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAction('REVERSE');
            }}
            style={{ borderColor: `${palette.poc}50`, backgroundColor: `${palette.poc}20` }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-bold transition-all cursor-pointer text-[var(--color-text)]"
            title={`Balik Posisi ${symbol} (${hotkeyMode === 'shift' ? 'Shift+R' : 'R'})`}
          >
            <RotateCcw size={11} />
            <span className="hidden sm:inline">Rev</span>
            <span className="text-[8.5px] font-mono" style={{ color: palette.poc }}>{hotkeyMode === 'shift' ? '⇧R' : 'R'}</span>
          </button>
        )}

        {/* Auto BE Button */}
        {currentPos && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAction('AUTO_BE');
            }}
            style={currentPos.autoBE ? { backgroundColor: `${palette.poc}30`, borderColor: palette.poc, color: '#ffffff', boxShadow: `0 0 8px ${palette.poc}30` } : {}}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
              currentPos.autoBE
                ? ''
                : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
            title={`Toggle Auto Break-Even (${hotkeyMode === 'shift' ? 'Shift+E' : 'E'})`}
          >
            <Shield size={11} />
            <span className="hidden md:inline">BE</span>
          </button>
        )}

        {/* Panic Flatten All Button */}
        {positions.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('PERINGATAN: Tutup SEMUA posisi terbuka di seluruh pasar sekarang?')) {
                handleAction('FLATTEN');
              }
            }}
            style={{ borderColor: `${palette.bear}50`, backgroundColor: `${palette.bear}20` }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-bold transition-all cursor-pointer animate-pulse text-[var(--color-text)]"
            title={`FLATTEN ALL: Tutup seketika semua posisi terbuka (${hotkeyMode === 'shift' ? 'Shift+X' : 'X'})`}
          >
            <AlertOctagon size={11} />
            <span className="hidden lg:inline">Flatten</span>
            <span className="text-[8.5px] font-mono" style={{ color: palette.bear }}>{hotkeyMode === 'shift' ? '⇧X' : 'X'}</span>
          </button>
        )}

        {/* Hotkey Cheat Sheet / Settings Button */}
        {onOpenHotkeyModal && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenHotkeyModal();
            }}
            className="p-1 sm:p-1.5 rounded-md sm:rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-panel)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
            title="Buka Referensi & Konfigurasi Shortcut Keyboard (Shift+H / ?)"
          >
            <Keyboard size={12} />
          </button>
        )}

        {/* Close / Hide Hotkey Bar Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setHotkeysEnabled(false);
          }}
          style={{ borderColor: `${palette.bear}20`, backgroundColor: `${palette.bear}10` }}
          className="p-1 sm:p-1.5 rounded-md sm:rounded-lg border transition-colors cursor-pointer text-[var(--color-text-muted)]"
          title="Sembunyikan Bilah Hotkey & Matikan Shortcut"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
});

export default QuickScalperBar;
