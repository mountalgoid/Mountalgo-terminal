import React, { useState } from 'react';
import { X, Keyboard, Zap, Volume2, VolumeX, Shield, Sliders, Check, HelpCircle, AlertTriangle } from 'lucide-react';
import { useTrade } from '../context/TradeContext';
import { useTheme } from '../context/ThemeContext';

interface HotkeyGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HotkeyGuideModal({ isOpen, onClose }: HotkeyGuideModalProps) {
  const { palette } = useTheme();
  const {
    focusedSymbol,
    hotkeysEnabled,
    setHotkeysEnabled,
    hotkeyMode,
    setHotkeyMode,
    hotkeyAudioEnabled,
    setHotkeyAudioEnabled,
    volumePresets,
    setVolumePresets,
    activePresetIndex,
    setActivePresetIndex,
  } = useTrade();

  const [activeTab, setActiveTab] = useState<'shortcuts' | 'presets' | 'settings'>('shortcuts');
  const [forexInputs, setForexInputs] = useState<number[]>(volumePresets.forex);
  const [cryptoInputs, setCryptoInputs] = useState<number[]>(volumePresets.crypto);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSavePresets = () => {
    setVolumePresets({
      forex: forexInputs.map(v => Math.max(0.01, Number(v) || 0.01)),
      crypto: cryptoInputs.map(v => Math.max(1, Number(v) || 1))
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const hotkeysList = [
    {
      category: 'Eksekusi Cepat (Market Execution)',
      items: [
        {
          key: hotkeyMode === 'shift' ? 'Shift + B' : 'B',
          action: 'Quick BUY (Market)',
          desc: 'Mengeksekusi BUY Market instan dengan volume preset aktif pada chart yang sedang difokuskan.',
          color: palette.bull,
          badgeBg: 'border', badgeStyle: { backgroundColor: `${palette.bull}20`, color: palette.bull, borderColor: `${palette.bull}60` }
        },
        {
          key: hotkeyMode === 'shift' ? 'Shift + S' : 'S',
          action: 'Quick SELL (Market)',
          desc: 'Mengeksekusi SELL Market instan dengan volume preset aktif pada chart yang sedang difokuskan.',
          color: palette.bear,
          badgeBg: 'border', badgeStyle: { backgroundColor: `${palette.bear}20`, color: palette.bear, borderColor: `${palette.bear}60` }
        },
      ]
    },
    {
      category: 'Preset Volume Cepat (1 - 5)',
      items: [
        {
          key: '1',
          action: 'Pilih Preset Volume 1',
          desc: `Crypto: ${volumePresets.crypto[0]} | Forex: ${volumePresets.forex[0]} Lot`,
          color: palette.poc,
          badgeBg: 'border', badgeStyle: { backgroundColor: `${palette.poc}20`, color: palette.poc, borderColor: `${palette.poc}60` }
        },
        {
          key: '2',
          action: 'Pilih Preset Volume 2',
          desc: `Crypto: ${volumePresets.crypto[1]} | Forex: ${volumePresets.forex[1]} Lot`,
          color: palette.poc,
          badgeBg: 'border', badgeStyle: { backgroundColor: `${palette.poc}20`, color: palette.poc, borderColor: `${palette.poc}60` }
        },
        {
          key: '3',
          action: 'Pilih Preset Volume 3',
          desc: `Crypto: ${volumePresets.crypto[2]} | Forex: ${volumePresets.forex[2]} Lot`,
          color: palette.poc,
          badgeBg: 'border', badgeStyle: { backgroundColor: `${palette.poc}20`, color: palette.poc, borderColor: `${palette.poc}60` }
        },
        {
          key: '4',
          action: 'Pilih Preset Volume 4',
          desc: `Crypto: ${volumePresets.crypto[3]} | Forex: ${volumePresets.forex[3]} Lot`,
          color: palette.poc,
          badgeBg: 'border', badgeStyle: { backgroundColor: `${palette.poc}20`, color: palette.poc, borderColor: `${palette.poc}60` }
        },
        {
          key: '5',
          action: 'Pilih Preset Volume 5',
          desc: `Crypto: ${volumePresets.crypto[4]} | Forex: ${volumePresets.forex[4]} Lot`,
          color: palette.poc,
          badgeBg: 'border', badgeStyle: { backgroundColor: `${palette.poc}20`, color: palette.poc, borderColor: `${palette.poc}60` }
        },
      ]
    },
    {
      category: 'Manajemen Posisi & Risiko',
      items: [
        {
          key: hotkeyMode === 'shift' ? 'Shift + C' : 'C',
          action: 'Close Position',
          desc: 'Tutup posisi terbuka untuk simbol pada chart yang sedang aktif.',
          color: '#e2e8f0',
          badgeBg: 'border', badgeStyle: { backgroundColor: 'rgba(255,255,255,0.08)', color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }
        },
        {
          key: hotkeyMode === 'shift' ? 'Shift + R' : 'R',
          action: 'Reverse Position',
          desc: 'Balik posisi aktif (BUY menjadi SELL atau sebaliknya) dengan ukuran yang sama.',
          color: '#38bdf8',
          badgeBg: 'border', badgeStyle: { backgroundColor: `${palette.poc}20`, color: palette.poc, borderColor: `${palette.poc}60` }
        },
        {
          key: hotkeyMode === 'shift' ? 'Shift + E' : 'E',
          action: 'Toggle Auto BE',
          desc: 'Aktifkan/nonaktifkan Auto Break-Even pada posisi aktif di chart fokus.',
          color: '#a855f7',
          badgeBg: 'border', badgeStyle: { backgroundColor: `${palette.poc}20`, color: palette.poc, borderColor: `${palette.poc}60` }
        },
        {
          key: hotkeyMode === 'shift' ? 'Shift + X' : 'X',
          action: 'Flatten All (Kill Switch)',
          desc: 'Darurat: Tutup seketika SELURUH posisi terbuka di semua simbol secara bersamaan.',
          color: '#ef4444',
          badgeBg: 'border', badgeStyle: { backgroundColor: `${palette.bear}30`, color: palette.bear, borderColor: `${palette.bear}80` }
        },
      ]
    },
    {
      category: 'Navigasi & Tampilan',
      items: [
        {
          key: hotkeyMode === 'shift' ? 'Shift + T' : 'T',
          action: 'Toggle Trade Panel',
          desc: 'Buka / tutup panel order book dan form order lanjutan.',
          color: '#94a3b8',
          badgeBg: 'border', badgeStyle: { backgroundColor: 'rgba(255,255,255,0.08)', color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }
        },
        {
          key: 'Shift + H / ?',
          action: 'Buka Panduan Hotkeys',
          desc: 'Tampilkan dialog referensi dan konfigurasi shortcut keyboard ini.',
          color: '#94a3b8',
          badgeBg: 'border', badgeStyle: { backgroundColor: 'rgba(255,255,255,0.08)', color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }
        },
        {
          key: 'Esc',
          action: 'Tutup Dialog',
          desc: 'Tutup modal pengaturan / deselect tool gambar aktif.',
          color: '#94a3b8',
          badgeBg: 'border', badgeStyle: { backgroundColor: 'rgba(255,255,255,0.08)', color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }
        }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-modal-ultimate flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-3 md:p-4 select-none animate-in fade-in duration-150">
      <div 
        style={{ borderColor: `${palette.bull}60`, boxShadow: `0 0 35px -5px ${palette.bull}25` }}
        className="bg-[var(--color-panel)] rounded-xl sm:rounded-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col shadow-2xl border overflow-hidden"
      >
        {/* Header */}
        <div className="px-3 sm:px-5 py-2.5 sm:py-3.5 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-panel)]">
          <div className="flex items-center gap-2 sm:gap-3">
            <div 
              style={{ backgroundColor: `${palette.bull}20`, borderColor: `${palette.bull}50` }} 
              className="p-2 rounded-xl border flex items-center justify-center"
            >
              <Keyboard size={20} style={{ color: palette.bull }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-[var(--color-text)] tracking-wide">
                  Sistem Hotkeys & Quick Scalping
                </h2>
                <span 
                  style={{ backgroundColor: `${palette.bull}20`, color: palette.bull }}
                  className="text-[10px] font-mono px-2 py-0.5 rounded font-bold border border-white/10"
                >
                  PRO V5.17
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[var(--color-text-muted)] hidden sm:block">
                Eksekusi order secepat kilat yang tersinkronisasi otomatis dengan chart aktif (<span className="font-mono font-semibold" style={{ color: palette.poc }}>{focusedSymbol}</span>)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-0.5 sm:gap-1 px-3 sm:px-5 pt-2 sm:pt-3 bg-[var(--color-panel)] border-b border-[var(--color-border)] overflow-x-auto hide-scrollbar">
          {[
            { id: 'shortcuts', label: 'Daftar Shortcut', icon: Zap },
            { id: 'presets', label: 'Preset Volume (1-5)', icon: Sliders },
            { id: 'settings', label: 'Pengaturan Eksekusi', icon: Shield },
          ].map(tab => {
            const Icon = tab.icon;
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={isSel ? { borderColor: palette.bull, color: palette.bull, backgroundColor: `${palette.bull}15` } : {}}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold rounded-t-lg border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  isSel ? 'border-b-2 font-bold' : 'border-transparent text-[var(--color-text-muted)] hover:text-gray-200'
                }`}
              >
                <Icon size={14} />
                <span className="hidden sm:inline text-[11px] sm:text-xs">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1 space-y-3 sm:space-y-5 text-sm text-gray-200">
          {/* TAB 1: SHORTCUTS LIST */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-4">
              {/* Focus Bar Info Banner */}
              <div 
                style={{ borderColor: `${palette.bull}40`, backgroundColor: `${palette.bull}08` }}
                className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-0 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: palette.bull }} />
                  <span className="text-gray-300">Chart Terfokus Saat Ini:</span>
                  <span className="font-mono font-bold text-[var(--color-text)] px-2 py-0.5 rounded bg-white/10">{focusedSymbol}</span>
                </div>
                <span className="text-[var(--color-text-muted)] text-[10px] sm:text-[11px]">
                  Mode: <strong className="uppercase" style={{ color: palette.poc }}>{hotkeyMode === 'shift' ? 'Shift+Key' : 'Single Key'}</strong>
                </span>
              </div>

              {hotkeysList.map((cat, idx) => (
                <div key={idx} className="space-y-2">
                  <h3 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                    {cat.category}
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {cat.items.map((item, i) => (
                      <div 
                        key={i} 
                        className="flex items-center justify-between p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-[var(--color-panel)] border border-[var(--color-border)] hover:border-white/20 transition-colors"
                      >
                        <div className="space-y-0.5 max-w-[65%] sm:max-w-[70%]">
                          <div className="font-semibold text-xs text-[var(--color-text)] flex items-center gap-2">
                            <span>{item.action}</span>
                          </div>
                          <p className="text-[11px] text-[var(--color-text-muted)] leading-snug">{item.desc}</p>
                        </div>
                        <div className={`px-2.5 py-1 rounded-lg border font-mono text-xs font-bold tracking-wider shadow-sm ${item.badgeBg}`} style={(item as any).badgeStyle}>
                          {item.key}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: PRESET VOLUME CUSTOMIZER */}
          {activeTab === 'presets' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
                  Kustomisasi 5 Preset Volume
                </h3>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Gunakan tombol angka <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[var(--color-text)]">1</kbd> sampai <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[var(--color-text)]">5</kbd> pada keyboard Anda untuk mengganti volume ukuran trading secara instan saat trading scalping.
                </p>
              </div>

              {/* Crypto Preset Inputs */}
              <div className="p-4 rounded-xl bg-[var(--color-panel)] border border-[var(--color-border)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs" style={{ color: palette.poc }}>Preset Volume Crypto (e.g. BTCUSDT, ETHUSDT)</span>
                  <span className="text-[10px] text-[var(--color-text-muted)]">Nilai Kontrak / USD</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {cryptoInputs.map((val, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted)] font-mono">
                        <span>Slot [{idx + 1}]</span>
                        {activePresetIndex === idx && <span className="font-bold" style={{ color: palette.bull }}>AKTIF</span>}
                      </div>
                      <input
                        type="number"
                        min="1"
                        step="10"
                        value={val ?? 0}
                        onChange={(e) => {
                          const updated = [...cryptoInputs];
                          updated[idx] = parseFloat(e.target.value) || 0;
                          setCryptoInputs(updated);
                        }}
                        className="w-full bg-[var(--color-panel)] border border-[var(--color-border)] focus:border-[var(--color-bull)] rounded-lg px-2 py-1.5 font-mono text-xs text-[var(--color-text)] text-center focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Forex Preset Inputs */}
              <div className="p-4 rounded-xl bg-[var(--color-panel)] border border-[var(--color-border)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs" style={{ color: "var(--color-text-muted)" }}>Preset Volume Forex (e.g. EURUSD, GBPUSD, XAUUSD)</span>
                  <span className="text-[10px] text-[var(--color-text-muted)]">Lot Size (Standard Lots)</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {forexInputs.map((val, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted)] font-mono">
                        <span>Slot [{idx + 1}]</span>
                        {activePresetIndex === idx && <span className="font-bold" style={{ color: palette.bull }}>AKTIF</span>}
                      </div>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={val ?? 0}
                        onChange={(e) => {
                          const updated = [...forexInputs];
                          updated[idx] = parseFloat(e.target.value) || 0;
                          setForexInputs(updated);
                        }}
                        className="w-full bg-[var(--color-panel)] border border-[var(--color-border)] focus:border-[var(--color-bull)] rounded-lg px-2 py-1.5 font-mono text-xs text-[var(--color-text)] text-center focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Save Presets Action */}
              <div className="flex items-center justify-between pt-2">
                {saveSuccess ? (
                  <span className="text-xs font-bold flex items-center gap-1.5 animate-in fade-in" style={{ color: palette.bull }}>
                    <Check size={15} /> Preset Volume Berhasil Disimpan!
                  </span>
                ) : (
                  <span className="text-xs text-gray-500">Perubahan akan langsung aktif di seluruh chart.</span>
                )}

                <button
                  onClick={handleSavePresets}
                  style={{ backgroundColor: palette.bull, color: '#000000' }}
                  className="px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-lg"
                >
                  Simpan Nilai Preset
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              {/* Enable / Disable Hotkeys */}
              <div className="p-4 rounded-xl bg-[var(--color-panel)] border border-[var(--color-border)] flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-[var(--color-text)]">Sistem Global Hotkeys</h4>
                  <p className="text-[11px] text-[var(--color-text-muted)]">Aktifkan atau nonaktifkan pemrosesan shortcut keyboard global.</p>
                </div>
                <button
                  onClick={() => setHotkeysEnabled(!hotkeysEnabled)}
                  className="w-12 h-6 rounded-full transition-colors relative cursor-pointer"
                  style={{ backgroundColor: hotkeysEnabled ? palette.bull : 'var(--color-border)' }}
                >
                  <div className="w-4 h-4 rounded-full bg-white absolute top-1 transition-transform"
                    style={{ left: hotkeysEnabled ? '28px' : '4px' }} />
                </button>
              </div>

              {/* Modifier Mode (Shift vs Single Key) */}
              <div className="p-4 rounded-xl bg-[var(--color-panel)] border border-[var(--color-border)] space-y-3">
                <div>
                  <h4 className="font-bold text-xs text-[var(--color-text)]">Mode Eksekusi Tombol</h4>
                  <p className="text-[11px] text-[var(--color-text-muted)]">Pilih tingkat keamanan pemicu hotkey.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setHotkeyMode('shift')}
                    style={hotkeyMode === 'shift' ? { borderColor: palette.bull, backgroundColor: `${palette.bull}15` } : {}}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      hotkeyMode === 'shift' ? 'text-[var(--color-text)]' : 'bg-[var(--color-card)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs">Mode Shift + Key</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: `${palette.bull}20`, color: palette.bull }}>Direkomendasikan</span>
                    </div>
                    <p className="text-[11px] text-[var(--color-text-muted)]">Memerlukan tombol Shift (e.g. Shift+B) untuk mencegah eksekusi tidak sengaja.</p>
                  </button>

                  <button
                    onClick={() => setHotkeyMode('single')}
                    style={hotkeyMode === 'single' ? { borderColor: palette.bull, backgroundColor: `${palette.bull}15` } : {}}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      hotkeyMode === 'single' ? 'text-[var(--color-text)]' : 'bg-[var(--color-card)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs">Mode Single Key (Ultra Fast)</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: `${palette.poc}20`, color: palette.poc }}>Scalper Ekstrem</span>
                    </div>
                    <p className="text-[11px] text-[var(--color-text-muted)]">Tekan langsung B atau S untuk order kilat tanpa kombinasi Shift.</p>
                  </button>
                </div>
              </div>

              {/* Sound Audio Feedback */}
              <div className="p-4 rounded-xl bg-[var(--color-panel)] border border-[var(--color-border)] flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-[var(--color-text)]">Umpan Balik Audio (Synthesizer Sound FX)</h4>
                  <p className="text-[11px] text-[var(--color-text-muted)]">Bunyi suara konfirmasi nada saat Buy, Sell, Close, Reverse, atau ganti preset volume.</p>
                </div>
                <button
                  onClick={() => setHotkeyAudioEnabled(!hotkeyAudioEnabled)}
                  className={`p-2 rounded-xl border transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                    hotkeyAudioEnabled 
                      ? 'border' 
                      : 'bg-[var(--color-input-bg)] border-[var(--color-input-border)] text-[var(--color-text-muted)]'
                  }`}
                >
                  {hotkeyAudioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  <span>{hotkeyAudioEnabled ? 'Suara ON' : 'Mute'}</span>
                </button>
              </div>

              {/* Safeguard Alert Notice */}
              <div className="p-3 rounded-xl border flex items-start gap-2.5 text-xs" style={{ backgroundColor: `${palette.poc}10`, borderColor: `${palette.poc}30`, color: palette.poc }}>
                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                <p>
                  <strong>Keamanan Input:</strong> Saat Anda sedang mengetik di dalam kolom input (seperti mengisi form Stop Loss, Take Profit, atau Search Bar), sistem hotkey secara otomatis dihentikan agar tidak memicu order secara tidak sengaja.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[var(--color-border)] bg-[var(--color-panel)] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
            <span><span >𝙈𝙤𝙪𝙣𝙩𝘼𝙡𝙜𝙤</span> High-Speed Scalper Core</span>
          </div>

          <button
            onClick={onClose}
            style={{ backgroundColor: palette.bull, color: '#000000' }}
            className="px-5 py-1.5 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-md"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
