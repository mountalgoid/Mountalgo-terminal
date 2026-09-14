import React, { useState, useEffect } from 'react';
import { DrawingItem, FibLevelConfig } from '../utils/drawingTools';
import { X, Palette, Settings, Sliders, Check, Hash, Eye, Lock, Move, Trash2, Type } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface DrawingSettingsModalProps {
  isOpen: boolean;
  drawing: DrawingItem | null;
  onClose: () => void;
  onSave: (updated: DrawingItem) => void;
  onDelete: (id: string) => void;
}

export default function DrawingSettingsModal({
  isOpen,
  drawing,
  onClose,
  onSave,
  onDelete,
}: DrawingSettingsModalProps) {
  const { palette } = useTheme();

  const [activeTab, setActiveTab] = useState<'style' | 'coords' | 'fib' | 'text' | 'risk'>('style');
  const [color, setColor] = useState('#3b82f6');
  const [lineWidth, setLineWidth] = useState(2);
  const [lineStyle, setLineStyle] = useState<'solid' | 'dashed' | 'dotted'>('solid');
  const [fillColor, setFillColor] = useState('rgba(59, 130, 246, 0.2)');
  const [fillOpacity, setFillOpacity] = useState(0.15);
  const [extendLeft, setExtendLeft] = useState(false);
  const [extendRight, setExtendRight] = useState(false);
  const [label, setLabel] = useState('');
  const [text, setText] = useState('');
  const [fontSize, setFontSize] = useState(12);
  const [textColor, setTextColor] = useState('#ffffff');
  const [showPrices, setShowPrices] = useState(true);
  const [showStats, setShowStats] = useState(true);
  const [locked, setLocked] = useState(false);
  
  const [points, setPoints] = useState<{ price: number; time: number }[]>([]);
  const [fibLevels, setFibLevels] = useState<FibLevelConfig[]>([]);

  // Position Risk/Reward States
  const [takeProfit, setTakeProfit] = useState<number>(0);
  const [stopLoss, setStopLoss] = useState<number>(0);
  const [accountSize, setAccountSize] = useState<number>(10000);
  const [riskPercent, setRiskPercent] = useState<number>(1.0);

  const [midline, setMidline] = useState(false);
  const [showAngles, setShowAngles] = useState(true);

  useEffect(() => {
    if (drawing) {
      setColor(drawing.color || '#3b82f6');
      setLineWidth(drawing.lineWidth || 2);
      setLineStyle(drawing.lineStyle || 'solid');
      setFillColor(drawing.fillColor || `${drawing.color || '#3b82f6'}33`);
      setFillOpacity(drawing.fillOpacity ?? 0.15);
      setExtendLeft(drawing.extendLeft ?? false);
      setExtendRight(drawing.extendRight ?? false);
      setMidline(drawing.midline ?? false);
      setLabel(drawing.label || '');
      setText(drawing.text || '');
      setFontSize(drawing.fontSize || 12);
      setTextColor(drawing.textColor || '#ffffff');
      setShowPrices(drawing.showPrices ?? true);
      setShowStats(drawing.showStats ?? true);
      setShowAngles(drawing.showAngles ?? true);
      setLocked(drawing.locked ?? false);
      setPoints(drawing.points || []);
      setFibLevels(drawing.fibLevels || [
        { level: 0, enabled: true, color: '#787b86', label: '0.0%' },
        { level: 0.236, enabled: true, color: '#f23645', label: '23.6%' },
        { level: 0.382, enabled: true, color: '#ff9800', label: '38.2%' },
        { level: 0.5, enabled: true, color: '#4caf50', label: '50.0%' },
        { level: 0.618, enabled: true, color: '#089981', label: '61.8% Golden Pocket' },
        { level: 0.786, enabled: true, color: '#2962ff', label: '78.6%' },
        { level: 1.0, enabled: true, color: '#787b86', label: '100.0%' },
        { level: 1.618, enabled: false, color: '#ab47bc', label: '161.8%' },
        { level: 2.618, enabled: false, color: '#26a69a', label: '261.8%' },
      ]);

      const entryPrice = drawing.points[0]?.price || 100;
      const isLong = drawing.type === 'position_long';
      const defaultTp = isLong ? entryPrice * 1.03 : entryPrice * 0.97;
      const defaultSl = isLong ? entryPrice * 0.985 : entryPrice * 1.015;

      setTakeProfit(drawing.riskReward?.takeProfit ?? defaultTp);
      setStopLoss(drawing.riskReward?.stopLoss ?? defaultSl);
      setAccountSize(drawing.riskReward?.accountSize ?? 10000);
      setRiskPercent(drawing.riskReward?.riskPercent ?? 1.0);

      if (drawing.type === 'position_long' || drawing.type === 'position_short') {
        setActiveTab('risk');
      } else {
        setActiveTab('style');
      }
    }
  }, [drawing, isOpen]);

  if (!isOpen || !drawing) return null;

  const presetColors = [
    palette.bull,
    palette.bear,
    palette.poc,
    '#38bdf8',
    '#a855f7',
    '#ec4899',
    '#f59e0b',
    '#10b981',
    '#ffffff',
  ];

  const handlePointPriceChange = (idx: number, val: number) => {
    const updated = [...points];
    if (updated[idx]) {
      updated[idx] = { ...updated[idx], price: val };
      setPoints(updated);
    }
  };

  const handleFibLevelToggle = (idx: number) => {
    const updated = [...fibLevels];
    updated[idx].enabled = !updated[idx].enabled;
    setFibLevels(updated);
  };

  const handleFibLevelColor = (idx: number, col: string) => {
    const updated = [...fibLevels];
    updated[idx].color = col;
    setFibLevels(updated);
  };

  const handleSave = () => {
    const entryPrice = points[0]?.price || 100;
    const isLong = drawing.type === 'position_long';
    const tpPct = isLong ? ((takeProfit - entryPrice) / entryPrice) * 100 : ((entryPrice - takeProfit) / entryPrice) * 100;
    const slPct = isLong ? ((entryPrice - stopLoss) / entryPrice) * 100 : ((stopLoss - entryPrice) / entryPrice) * 100;
    const riskRatio = Math.max(0.01, tpPct / (slPct || 0.001));

    const updated: DrawingItem = {
      ...drawing,
      color,
      lineWidth,
      lineStyle,
      fillColor,
      fillOpacity,
      extendLeft,
      extendRight,
      midline,
      label,
      text,
      fontSize,
      textColor,
      showPrices,
      showStats,
      showAngles,
      locked,
      points,
      fibLevels,
      riskReward: {
        stopLoss,
        takeProfit,
        riskRatio,
        accountSize,
        riskPercent,
      },
    };
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 sm:top-[60px] sm:right-4 sm:bottom-4 sm:left-auto z-modal-ultimate flex flex-col justify-start pointer-events-none animate-fadeIn">
      <div 
        style={{ borderColor: `${palette.bull}88` }}
        className="bg-[var(--color-panel)]/95 backdrop-blur-2xl border sm:rounded-2xl shadow-2xl w-full sm:w-[420px] md:w-[480px] h-full sm:h-[calc(100vh-80px)] flex flex-col pointer-events-auto text-[var(--color-text)] font-sans text-xs"
      >
        {/* Header */}
        <div className="bg-[var(--color-panel-header)] px-3 sm:px-4 py-2.5 sm:py-3 border-b border-[var(--color-border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders size={16} style={{ color: palette.bull }} />
            <span className="font-bold text-[var(--color-text)] text-xs sm:text-sm uppercase tracking-wide font-mono">
              Pengaturan Advanced: {drawing.type.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[var(--color-hover)] rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center bg-[var(--color-card)] border-b border-[var(--color-border)] px-2 sm:px-3 pt-2 gap-0.5 sm:gap-1 font-mono text-[10px] sm:text-[11px] overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setActiveTab('style')}
            className={`px-3 py-1.5 rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'style' ? 'bg-[var(--color-panel)] text-[var(--color-text)] font-bold border-t-2 border-cyan-400' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <Palette size={13} />
            <span className="hidden sm:inline">Gaya & Visual</span>
            <span className="sm:hidden">Gaya</span>
          </button>
          <button
            onClick={() => setActiveTab('coords')}
            className={`px-3 py-1.5 rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'coords' ? 'bg-[var(--color-panel)] text-[var(--color-text)] font-bold border-t-2 border-cyan-400' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <Hash size={13} />
            <span className="hidden sm:inline">Koordinat Harga</span>
            <span className="sm:hidden">Koordinat</span>
          </button>
          {(drawing.type === 'text' || drawing.type === 'callout' || drawing.type === 'price_label' || drawing.type === 'rectangle' || drawing.type === 'ellipse' || drawing.type === 'triangle') && (
            <button
              onClick={() => setActiveTab('text')}
              className={`px-3 py-1.5 rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'text' ? 'bg-[var(--color-panel)] text-[var(--color-text)] font-bold border-t-2 border-cyan-400' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              <Type size={13} />
              <span>Teks & Catatan</span>
            </button>
          )}
          {(drawing.type === 'position_long' || drawing.type === 'position_short') && (
            <button
              onClick={() => setActiveTab('risk')}
              className={`px-3 py-1.5 rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'risk' ? 'bg-[var(--color-panel)] text-[var(--color-text)] font-bold border-t-2 border-emerald-400' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              <span>Position R:R Risk</span>
            </button>
          )}
          {(drawing.type === 'fibonacci' || drawing.type === 'fib_fan') && (
            <button
              onClick={() => setActiveTab('fib')}
              className={`px-3 py-1.5 rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'fib' ? 'bg-[var(--color-panel)] text-[var(--color-text)] font-bold border-t-2 border-cyan-400' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              <span>Rasio Fibonacci</span>
            </button>
          )}
        </div>

        {/* Modal Body Content */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-3 sm:space-y-4 flex-1">
          {activeTab === 'style' && (
            <div className="space-y-4">
              {/* Main Line Color */}
              <div>
                <label className="block text-[var(--color-text-muted)] mb-1.5 font-bold">Warna Utama / Garis</label>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5 flex-wrap">
                    {presetColors.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => setColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-md border transition-transform cursor-pointer ${
                          color === c ? 'scale-110 border-white ring-2 ring-white/50' : 'border-black/50'
                        }`}
                      />
                    ))}
                  </div>
                  <input
                    type="color"
                    value={color || '#3b82f6'}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-7 h-7 rounded border-0 bg-transparent cursor-pointer ml-auto"
                  />
                </div>
              </div>

              {/* Line Thickness & Style */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--color-text-muted)] mb-1 font-bold">Ketebalan Garis ({lineWidth}px)</label>
                  <div className="flex items-center gap-1 bg-[var(--color-input-bg)] p-1 rounded-lg border border-[var(--color-input-border)]">
                    {[1, 2, 3, 4, 6].map((w) => (
                      <button
                        key={w}
                        onClick={() => setLineWidth(w)}
                        className={`flex-1 py-1 rounded text-center cursor-pointer transition-colors ${
                          lineWidth === w ? 'bg-[var(--color-hover)] text-[var(--color-text)] font-bold' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                        }`}
                      >
                        {w}px
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[var(--color-text-muted)] mb-1 font-bold">Tipe Garis</label>
                  <div className="flex items-center gap-1 bg-[var(--color-input-bg)] p-1 rounded-lg border border-[var(--color-input-border)]">
                    {(['solid', 'dashed', 'dotted'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => setLineStyle(st)}
                        className={`flex-1 py-1 rounded capitalize text-center cursor-pointer transition-colors ${
                          lineStyle === st ? 'bg-[var(--color-hover)] text-[var(--color-text)] font-bold' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Fill Area & Opacity (For Shapes, Channels, Long/Short) */}
              {(drawing.type === 'rectangle' ||
                drawing.type === 'ellipse' ||
                drawing.type === 'triangle' ||
                drawing.type === 'parallel_channel' ||
                drawing.type === 'position_long' ||
                drawing.type === 'position_short' ||
                drawing.type === 'fibonacci') && (
                <div className="bg-[var(--color-card)] p-3 rounded-xl border border-[var(--color-border)] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--color-text)]">Warna Isian Area (Fill)</span>
                    <input
                      type="color"
                      value={fillColor || '#3b82f633'}
                      onChange={(e) => setFillColor(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[var(--color-text-muted)] text-[10px] mb-1">
                      <span>Transparansi Isian</span>
                      <span>{Math.round((fillOpacity ?? 0.15) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={fillOpacity ?? 0.15}
                      onChange={(e) => setFillOpacity(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* Line Extensions */}
              {(drawing.type === 'trendline' || drawing.type === 'horizontal' || drawing.type === 'arrow') && (
                <div className="grid grid-cols-2 gap-3 bg-[var(--color-card)] p-3 rounded-xl border border-[var(--color-border)]">
                  <label className="flex items-center gap-2 cursor-pointer text-[var(--color-text)]">
                    <input
                      type="checkbox"
                      checked={Boolean(extendLeft)}
                      onChange={(e) => setExtendLeft(e.target.checked)}
                      className="rounded accent-cyan-400"
                    />
                    <span>Perpanjang Kiri (Extend Left)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-[var(--color-text)]">
                    <input
                      type="checkbox"
                      checked={Boolean(extendRight)}
                      onChange={(e) => setExtendRight(e.target.checked)}
                      className="rounded accent-cyan-400"
                    />
                    <span>Perpanjang Kanan (Extend Right)</span>
                  </label>
                </div>
              )}

              {/* Toggles */}
              <div className="space-y-2 pt-2 border-t border-[var(--color-border)]">
                {(drawing.type === 'rectangle' || drawing.type === 'parallel_channel') && (
                  <label className="flex items-center justify-between cursor-pointer text-[var(--color-text)] bg-[var(--color-card)] px-3 py-2 rounded-lg border border-[var(--color-border)]">
                    <div className="flex flex-col">
                      <span className="font-bold text-amber-300">Garis Tengah 50% Equilibrium (Midline)</span>
                      <span className="text-[10px] text-[var(--color-text-muted)]">Menampilkan level mean threshold 50% di tengah zona</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(midline)}
                      onChange={(e) => setMidline(e.target.checked)}
                      className="rounded accent-amber-400"
                    />
                  </label>
                )}
                {(drawing.type === 'trendline' || drawing.type === 'ray' || drawing.type === 'arrow') && (
                  <label className="flex items-center justify-between cursor-pointer text-[var(--color-text)] bg-[var(--color-card)] px-3 py-2 rounded-lg border border-[var(--color-border)]">
                    <span>Tampilkan Sudut Kemiringan (Angle HUD °)</span>
                    <input
                      type="checkbox"
                      checked={Boolean(showAngles)}
                      onChange={(e) => setShowAngles(e.target.checked)}
                      className="rounded accent-cyan-400"
                    />
                  </label>
                )}
                <label className="flex items-center justify-between cursor-pointer text-[var(--color-text)] bg-[var(--color-card)] px-3 py-2 rounded-lg border border-[var(--color-border)]">
                  <span>Tampilkan Label Nilai Harga</span>
                  <input
                    type="checkbox"
                    checked={Boolean(showPrices)}
                    onChange={(e) => setShowPrices(e.target.checked)}
                    className="rounded accent-cyan-400"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer text-[var(--color-text)] bg-[var(--color-card)] px-3 py-2 rounded-lg border border-[var(--color-border)]">
                  <span>Tampilkan Statistik Jarak (%) & Jumlah Bar</span>
                  <input
                    type="checkbox"
                    checked={Boolean(showStats)}
                    onChange={(e) => setShowStats(e.target.checked)}
                    className="rounded accent-cyan-400"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer text-[var(--color-text)] bg-[var(--color-card)] px-3 py-2 rounded-lg border border-[var(--color-border)]">
                  <span>Kunci Posisi Gambar Ini (Locked)</span>
                  <input
                    type="checkbox"
                    checked={Boolean(locked)}
                    onChange={(e) => setLocked(e.target.checked)}
                    className="rounded accent-cyan-400"
                  />
                </label>
              </div>
            </div>
          )}

          {activeTab === 'coords' && (
            <div className="space-y-3">
              <span className="block text-[var(--color-text-muted)] font-bold mb-2">Presisi Koordinat Harga Point Anchor</span>
              {points.map((pt, idx) => (
                <div key={idx} className="bg-[var(--color-card)] p-3 rounded-xl border border-[var(--color-border)] space-y-2">
                  <div className="font-bold text-cyan-400 font-mono text-[11px]">
                    Anchor Point #{idx + 1}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[var(--color-text-muted)] text-[10px] block">Level Harga ($)</label>
                      <input
                        type="number"
                        step="any"
                        value={pt.price ?? 0}
                        onChange={(e) => handlePointPriceChange(idx, parseFloat(e.target.value) || 0)}
                        className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-lg px-2.5 py-1.5 text-[var(--color-text)] font-mono focus:outline-hidden focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="text-[var(--color-text-muted)] text-[10px] block">Waktu Anchor (Timestamp)</label>
                      <div className="bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-lg px-2.5 py-1.5 text-[var(--color-text)] font-mono text-[10.5px] truncate">
                        {new Date(pt.time).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'text' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[var(--color-text-muted)] mb-1 font-bold">Isi Teks / Catatan Analisis</label>
                <textarea
                  rows={3}
                  value={text || ''}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Tulis catatan analisis pasar..."
                  className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-xl p-2.5 text-[var(--color-text)] focus:outline-hidden focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--color-text-muted)] mb-1 font-bold">Ukuran Font ({fontSize}px)</label>
                  <input
                    type="number"
                    min="8"
                    max="36"
                    value={fontSize ?? 12}
                    onChange={(e) => setFontSize(parseInt(e.target.value) || 12)}
                    className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-lg px-3 py-1.5 text-[var(--color-text)] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[var(--color-text-muted)] mb-1 font-bold">Warna Teks</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={textColor || '#ffffff'}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-8 h-8 rounded border-0 bg-transparent cursor-pointer"
                    />
                    <span className="font-mono text-[var(--color-text)] uppercase">{textColor || '#ffffff'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'risk' && (() => {
            const entryP = points[0]?.price || 100;
            const isL = drawing.type === 'position_long';
            return (
              <div className="space-y-3 font-sans">
                <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2">
                  <span className="font-bold text-[var(--color-text)] text-xs uppercase tracking-wide font-mono">
                    Pengaturan Risk & Reward: {drawing.type === 'position_long' ? '📈 Long Position' : '📉 Short Position'}
                  </span>
                </div>

                {/* Take Profit Price & Percentage */}
                <div className="bg-[var(--color-card)] p-3 rounded-xl border border-emerald-900/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-emerald-400 font-bold text-[11px] font-mono">🎯 Target Take Profit</label>
                    <div className="flex gap-1 text-[10px] font-mono">
                      {[1, 2, 3, 5, 10].map((pct) => {
                        const calcP = isL ? entryP * (1 + pct / 100) : entryP * (1 - pct / 100);
                        return (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setTakeProfit(calcP)}
                            className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 hover:bg-emerald-900 cursor-pointer"
                          >
                            +{pct}%
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[var(--color-text-muted)] text-[10px] block font-mono">Harga TP ($)</label>
                      <input
                        type="number"
                        step="any"
                        value={takeProfit ?? 0}
                        onChange={(e) => setTakeProfit(parseFloat(e.target.value) || 0)}
                        className="w-full bg-[var(--color-input-bg)] border border-emerald-800/60 rounded-lg px-3 py-1.5 text-[var(--color-text)] font-mono focus:outline-hidden focus:border-emerald-400 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[var(--color-text-muted)] text-[10px] block font-mono">Persen TP (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={parseFloat((isL ? (((takeProfit ?? 0) - entryP) / entryP) * 100 : ((entryP - (takeProfit ?? 0)) / entryP) * 100).toFixed(2)) || 0}
                        onChange={(e) => {
                          const pct = parseFloat(e.target.value) || 0;
                          const calcP = isL ? entryP * (1 + pct / 100) : entryP * (1 - pct / 100);
                          setTakeProfit(calcP);
                        }}
                        className="w-full bg-[var(--color-input-bg)] border border-emerald-800/60 rounded-lg px-3 py-1.5 text-[var(--color-text)] font-mono focus:outline-hidden focus:border-emerald-400 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Stop Loss Price & Percentage */}
                <div className="bg-[var(--color-card)] p-3 rounded-xl border border-rose-900/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-rose-400 font-bold text-[11px] font-mono">🛑 Level Stop Loss</label>
                    <div className="flex gap-1 text-[10px] font-mono">
                      {[0.5, 1, 1.5, 2, 3].map((pct) => {
                        const calcP = isL ? entryP * (1 - pct / 100) : entryP * (1 + pct / 100);
                        return (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setStopLoss(calcP)}
                            className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 hover:bg-rose-900 cursor-pointer"
                          >
                            -{pct}%
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[var(--color-text-muted)] text-[10px] block font-mono">Harga SL ($)</label>
                      <input
                        type="number"
                        step="any"
                        value={stopLoss ?? 0}
                        onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
                        className="w-full bg-[var(--color-input-bg)] border border-rose-800/60 rounded-lg px-3 py-1.5 text-[var(--color-text)] font-mono focus:outline-hidden focus:border-rose-400 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[var(--color-text-muted)] text-[10px] block font-mono">Persen SL (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={parseFloat((isL ? ((entryP - (stopLoss ?? 0)) / entryP) * 100 : (((stopLoss ?? 0) - entryP) / entryP) * 100).toFixed(2)) || 0}
                        onChange={(e) => {
                          const pct = parseFloat(e.target.value) || 0;
                          const calcP = isL ? entryP * (1 - pct / 100) : entryP * (1 + pct / 100);
                          setStopLoss(calcP);
                        }}
                        className="w-full bg-[var(--color-input-bg)] border border-rose-800/60 rounded-lg px-3 py-1.5 text-[var(--color-text)] font-mono focus:outline-hidden focus:border-rose-400 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Account Size & Risk % */}
                <div className="grid grid-cols-2 gap-2 bg-[var(--color-card)] p-2.5 rounded-xl border border-[var(--color-border)]">
                  <div>
                    <label className="text-[var(--color-text-muted)] text-[10px] block font-mono">Saldo Akun ($)</label>
                    <input
                      type="number"
                      value={accountSize ?? 10000}
                      onChange={(e) => setAccountSize(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-lg px-2.5 py-1 text-[var(--color-text)] font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[var(--color-text-muted)] text-[10px] block font-mono">Risiko per Trade (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={riskPercent ?? 1.0}
                      onChange={(e) => setRiskPercent(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-lg px-2.5 py-1 text-[var(--color-text)] font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Lebar Box Position */}
                <div className="bg-[var(--color-card)] p-3 rounded-xl border border-[var(--color-border)] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sky-400 font-bold text-[11px] font-mono">↔️ Lebar Box Position (Durasi Box)</label>
                    <span className="text-[10px] text-[var(--color-text-muted)] font-mono font-bold">{lineWidth}x Scale</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 font-mono text-[10px]">
                    {[
                      { label: 'Kecil', val: 1 },
                      { label: 'Sedang', val: 2 },
                      { label: 'Lebar', val: 3 },
                      { label: 'Max', val: 5 },
                    ].map((preset) => (
                      <button
                        key={preset.val}
                        type="button"
                        onClick={() => setLineWidth(preset.val)}
                        className={`py-1 rounded cursor-pointer font-bold transition-all border ${
                          lineWidth === preset.val
                            ? 'bg-sky-950 border-sky-400 text-sky-200'
                            : 'bg-[var(--color-input-bg)] border-[var(--color-input-border)] text-[var(--color-text-muted)] hover:border-gray-500'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary Stats Card */}
                {(() => {
                  const tpPct = isL ? ((takeProfit - entryP) / entryP) * 100 : ((entryP - takeProfit) / entryP) * 100;
                  const slPct = isL ? ((entryP - stopLoss) / entryP) * 100 : ((stopLoss - entryP) / entryP) * 100;
                  const rrRatio = (tpPct / (slPct || 0.001)).toFixed(2);

                  const maxLossAmount = (accountSize * riskPercent) / 100;
                  const expectedProfitAmount = maxLossAmount * parseFloat(rrRatio);

                  return (
                    <div className="bg-[var(--color-card)] p-3 rounded-xl border border-cyan-800/50 space-y-1.5 font-mono text-[10.5px]">
                      <div className="flex items-center justify-between text-[var(--color-text)] font-bold border-b border-[var(--color-border)] pb-1">
                        <span>Rasio Risk to Reward (R:R)</span>
                        <span className="text-cyan-300 text-xs font-black">1 : {rrRatio}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px] pt-0.5">
                        <div>
                          <span className="text-[var(--color-text-muted)]">Target Profit: </span>
                          <span className="text-emerald-400 font-bold">+{tpPct.toFixed(2)}% (+${expectedProfitAmount.toFixed(2)})</span>
                        </div>
                        <div>
                          <span className="text-[var(--color-text-muted)]">Maks Risk: </span>
                          <span className="text-rose-400 font-bold">-{slPct.toFixed(2)}% (-${maxLossAmount.toFixed(2)})</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })()}

          {activeTab === 'fib' && (
            <div className="space-y-2">
              <span className="block text-[var(--color-text-muted)] font-bold mb-2">Level Rasio Fibonacci Custom</span>
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {fibLevels.map((fib, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-[var(--color-card)] p-2 rounded-lg border border-[var(--color-border)]">
                    <label className="flex items-center gap-2 cursor-pointer font-mono">
                      <input
                        type="checkbox"
                        checked={Boolean(fib.enabled)}
                        onChange={() => handleFibLevelToggle(idx)}
                        className="rounded accent-cyan-400"
                      />
                      <span className={fib.enabled ? 'text-[var(--color-text)] font-bold' : 'text-gray-500 line-through'}>
                        {fib.label}
                      </span>
                    </label>

                    <input
                      type="color"
                      value={fib.color || '#787b86'}
                      onChange={(e) => handleFibLevelColor(idx, e.target.value)}
                      className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-[var(--color-panel-header)] px-4 py-3 border-t border-[var(--color-border)] flex items-center justify-between">
          <button
            onClick={() => {
              onDelete(drawing.id);
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/40 text-rose-400 hover:text-rose-300 hover:bg-rose-900/60 transition-colors cursor-pointer border border-rose-800/40"
          >
            <Trash2 size={14} />
            <span>Hapus Gambar</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)] transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              style={{ backgroundColor: palette.bull, color: '#000000' }}
              className="px-4 py-1.5 rounded-lg font-bold shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Check size={14} />
              <span>Simpan Pengaturan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
