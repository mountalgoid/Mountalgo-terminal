import React, { useState } from 'react';
import {
  X,
  Layers,
  Palette,
  Sliders,
  TrendingUp,
  Shield,
  Zap,
  Activity,
  BarChart3,
  Flame,
  CheckCircle2,
  HelpCircle,
  Eye,
} from 'lucide-react';
import {
  FootprintSettings,
  FootprintType,
  ImbalanceMode,
  SRSourceType,
  MitigationType,
  LTFPlotType,
  LTFColorType,
  CellStyleMode,
  SummaryRowMode,
} from '../utils/footprints';
import { useTheme } from '../context/ThemeContext';

interface FootprintSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: FootprintSettings;
  onUpdateSettings: (settings: FootprintSettings) => void;
}

type SettingsTab = 'visual' | 'orderflow' | 'amt' | 'summary' | 'htf';

export default function FootprintSettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}: FootprintSettingsModalProps) {
  const { palette } = useTheme();
  const [activeTab, setActiveTab] = useState<SettingsTab>('visual');

  if (!isOpen) return null;

  const handleChange = <K extends keyof FootprintSettings>(
    key: K,
    value: FootprintSettings[K]
  ) => {
    onUpdateSettings({
      ...settings,
      [key]: value,
    });
  };

  return (
    <div className="fixed top-[60px] left-4 right-4 sm:left-auto bottom-4 z-modal-ultimate flex flex-col justify-start pointer-events-none animate-in fade-in duration-150">
      <div
        className="bg-[var(--color-panel)] backdrop-blur-2xl rounded-2xl w-full sm:w-[480px] md:w-[600px] h-[calc(100vh-80px)] flex flex-col shadow-2xl overflow-hidden border border-[var(--color-border)] pointer-events-auto"
        style={{ boxShadow: `0 0 35px ${palette.bull}20` }}
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-bg)]/80">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[var(--color-text)] tracking-wide flex items-center gap-1.5">
                  Footprint Candle <span>𝙈𝙤𝙪𝙣𝙩𝘼𝙡𝙜𝙤</span> Order Flow Engine
                </h2>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider"
                  style={{ backgroundColor: `${palette.bull}25`, color: palette.bull }}
                >
                  V7.2 PRO
                </span>
              </div>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                Multi-Timeframe Bid/Ask Cluster, Diagonal Imbalance, Auction Market Theory & Delta Profiler
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-1.5 rounded-lg hover:bg-[var(--color-hover)] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-4 py-2 bg-[var(--color-panel)] border-b border-[var(--color-border)] overflow-x-auto">
          <button
            onClick={() => setActiveTab('visual')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'visual'
                ? 'text-[var(--color-text)] shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)]'
            }`}
            style={{
              backgroundColor: activeTab === 'visual' ? `${palette.bull}25` : 'transparent',
              borderColor: activeTab === 'visual' ? `${palette.bull}80` : 'transparent',
              borderWidth: 1,
            }}
          >
            <Palette size={14} style={{ color: activeTab === 'visual' ? palette.bull : undefined }} />
            <span>Tampilan & Tema</span>
          </button>

          <button
            onClick={() => setActiveTab('orderflow')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'orderflow'
                ? 'text-[var(--color-text)] shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)]'
            }`}
            style={{
              backgroundColor: activeTab === 'orderflow' ? `${palette.bull}25` : 'transparent',
              borderColor: activeTab === 'orderflow' ? `${palette.bull}80` : 'transparent',
              borderWidth: 1,
            }}
          >
            <Zap size={14} style={{ color: activeTab === 'orderflow' ? palette.bull : undefined }} />
            <span>Order Flow & Imbalance</span>
          </button>

          <button
            onClick={() => setActiveTab('amt')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'amt'
                ? 'text-[var(--color-text)] shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)]'
            }`}
            style={{
              backgroundColor: activeTab === 'amt' ? `${palette.bull}25` : 'transparent',
              borderColor: activeTab === 'amt' ? `${palette.bull}80` : 'transparent',
              borderWidth: 1,
            }}
          >
            <Flame size={14} style={{ color: activeTab === 'amt' ? palette.bull : undefined }} />
            <span>Auction Market Theory & POC</span>
          </button>

          <button
            onClick={() => setActiveTab('summary')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'summary'
                ? 'text-[var(--color-text)] shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)]'
            }`}
            style={{
              backgroundColor: activeTab === 'summary' ? `${palette.bull}25` : 'transparent',
              borderColor: activeTab === 'summary' ? `${palette.bull}80` : 'transparent',
              borderWidth: 1,
            }}
          >
            <BarChart3 size={14} style={{ color: activeTab === 'summary' ? palette.bull : undefined }} />
            <span>Tabel Ringkasan Delta</span>
          </button>

          <button
            onClick={() => setActiveTab('htf')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'htf'
                ? 'text-[var(--color-text)] shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)]'
            }`}
            style={{
              backgroundColor: activeTab === 'htf' ? `${palette.bull}25` : 'transparent',
              borderColor: activeTab === 'htf' ? `${palette.bull}80` : 'transparent',
              borderWidth: 1,
            }}
          >
            <Shield size={14} style={{ color: activeTab === 'htf' ? palette.bull : undefined }} />
            <span>Multi-Timeframe & S/R Ray</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm text-[var(--color-text)] scrollbar-thin">
          {/* TAB 1: VISUAL & THEMES */}
          {activeTab === 'visual' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Jenis Footprint Tampilan */}
                <div className="p-3.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)]">
                  <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">
                    Format Cluster Footprint
                  </label>
                  <select
                    value={settings.footprintType || 'Split Bid/Ask Profile'}
                    onChange={(e) =>
                      handleChange('footprintType', e.target.value as FootprintType)
                    }
                    className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-lg px-3 py-2 text-xs text-[var(--color-text)] outline-none cursor-pointer hover:border-[var(--color-border-active)] transition-colors"
                  >
                    <option value="Split Bid/Ask Profile">Split Bid/Ask Profile (Candle Tengah)</option>
                    <option value="Delta Profile">Delta Profile (Delta Per Tick)</option>
                    <option value="Total Volume Profile">Total Volume Profile (Volume Keseluruhan)</option>
                  </select>
                </div>

                {/* Cell Style Mode */}
                <div className="p-3.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)]">
                  <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">
                    Gaya Sel (Heatmap Intensity)
                  </label>
                  <select
                    value={settings.cellStyle || 'Heatmap Gradient'}
                    onChange={(e) =>
                      handleChange('cellStyle', e.target.value as CellStyleMode)
                    }
                    className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-lg px-3 py-2 text-xs text-[var(--color-text)] outline-none cursor-pointer hover:border-[var(--color-border-active)] transition-colors"
                  >
                    <option value="Heatmap Gradient">Heatmap Gradient (Transparan halus sesuai volume)</option>
                    <option value="Solid Tint">Solid Tint (Kontras tinggi)</option>
                    <option value="Minimalist">Minimalist (Outline & Teks Fokus)</option>
                  </select>
                </div>

                {/* Resolusi Baris Tingkat Harga */}
                <div className="p-3.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)]">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-[var(--color-text)]">Jumlah Baris Tiap Lilin</label>
                    <span className="text-xs font-mono font-bold" style={{ color: palette.bull }}>
                      {settings.levelsCount ?? 10} Level
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="25"
                    step="1"
                    value={settings.levelsCount ?? 10}
                    onChange={(e) => handleChange('levelsCount', parseInt(e.target.value))}
                    className="w-full cursor-pointer mt-2"
                    style={{ accentColor: palette.bull }}
                  />
                  <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] mt-1 font-mono">
                    <span>5 (Ringkas)</span>
                    <span>10 (Standar)</span>
                    <span>25 (Detail Mikro)</span>
                  </div>
                </div>
              </div>

              {/* Toggles Tampilan Tambahan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <label className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] hover:border-[var(--color-border-active)] cursor-pointer">
                  <div>
                    <div className="font-semibold text-[var(--color-text)] text-xs">Volume Profile Heatmap</div>
                    <div className="text-[10px] text-[var(--color-text-muted)]">Gradien intensitas volume pada tiap baris lilin</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(settings.showVolumeProfile)}
                    onChange={(e) => handleChange('showVolumeProfile', e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                    style={{ accentColor: palette.bull }}
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] hover:border-[var(--color-border-active)] cursor-pointer">
                  <div>
                    <div className="font-semibold text-[var(--color-text)] text-xs">Tampilkan Logo Watermark</div>
                    <div className="text-[10px] text-[var(--color-text-muted)]">Logo watermark MountAlgo di sudut kanan atas</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(settings.showLogo)}
                    onChange={(e) => handleChange('showLogo', e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                    style={{ accentColor: palette.bull }}
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: ORDER FLOW & DIAGONAL IMBALANCE */}
          {activeTab === 'orderflow' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Imbalance Multiplier */}
                <div className="p-3.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)]">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-[var(--color-text)]">
                      Rasio Diagonal Imbalance (Multiplier)
                    </label>
                    <span className="text-xs font-mono font-bold" style={{ color: palette.bull }}>
                      {(settings.imbalanceRatio ?? 3.0).toFixed(1)}x ({Math.round((settings.imbalanceRatio ?? 3.0) * 100)}%)
                    </span>
                  </div>
                  <p className="text-[10px] text-[var(--color-text-muted)] mb-2">
                    Bandingkan volume Ask diagonal terhadap Bid satu baris di bawahnya
                  </p>
                  <input
                    type="range"
                    min="1.5"
                    max="6.0"
                    step="0.1"
                    value={settings.imbalanceRatio ?? 3.0}
                    onChange={(e) =>
                      handleChange('imbalanceRatio', parseFloat(e.target.value))
                    }
                    className="w-full cursor-pointer"
                    style={{ accentColor: palette.bull }}
                  />
                  <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] mt-1 font-mono">
                    <span>1.5x (Sensitif)</span>
                    <span>3.0x (Institusional)</span>
                    <span>6.0x (Sangat Kuat)</span>
                  </div>
                </div>

                {/* Stacked Imbalance Threshold */}
                <div className="p-3.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)]">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-[var(--color-text)]">
                      Ambang Stacked Imbalances (S/R Zone)
                    </label>
                    <span className="text-xs font-mono font-bold" style={{ color: palette.bull }}>
                      {settings.stackedThreshold || 3} Level Berturut-turut
                    </span>
                  </div>
                  <p className="text-[10px] text-[var(--color-text-muted)] mb-2">
                    Level berturut-turut yang memicu zona Demand/Supply institusional
                  </p>
                  <input
                    type="range"
                    min="2"
                    max="5"
                    step="1"
                    value={settings.stackedThreshold || 3}
                    onChange={(e) =>
                      handleChange('stackedThreshold', parseInt(e.target.value))
                    }
                    className="w-full cursor-pointer"
                    style={{ accentColor: palette.bull }}
                  />
                  <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] mt-1 font-mono">
                    <span>2 Level</span>
                    <span>3 Level (Standar)</span>
                    <span>5 Level (Extreme)</span>
                  </div>
                </div>

                {/* Min Volume Filter */}
                <div className="p-3.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)]">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-[var(--color-text)]">
                      Filter Volume Minimum Imbalance
                    </label>
                    <span className="text-xs font-mono font-bold" style={{ color: palette.bull }}>
                      {settings.imbalanceMinVol ?? 0} Kontrak / Lot
                    </span>
                  </div>
                  <p className="text-[10px] text-[var(--color-text-muted)] mb-2">
                    Abaikan imbalance pada likuiditas sangat tipis
                  </p>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="1"
                    value={settings.imbalanceMinVol ?? 0}
                    onChange={(e) =>
                      handleChange('imbalanceMinVol', parseFloat(e.target.value))
                    }
                    className="w-full cursor-pointer"
                    style={{ accentColor: palette.bull }}
                  />
                </div>

                {/* Imbalance Line Width */}
                <div className="p-3.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)]">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-[var(--color-text)]">
                      Ketebalan Garis Ray Imbalance S/R
                    </label>
                    <span className="text-xs font-mono font-bold" style={{ color: palette.bull }}>
                      {settings.imbalanceLineWidth ?? 1.5}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="6"
                    step="0.5"
                    value={settings.imbalanceLineWidth ?? 1.5}
                    onChange={(e) =>
                      handleChange('imbalanceLineWidth', parseFloat(e.target.value))
                    }
                    className="w-full cursor-pointer mt-3"
                    style={{ accentColor: palette.bull }}
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <label className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] hover:border-[var(--color-border-active)] cursor-pointer">
                  <div>
                    <div className="font-semibold text-[var(--color-text)] text-xs">Sorot Diagonal Imbalance</div>
                    <div className="text-[10px] text-[var(--color-text-muted)]">Beri warna neon pada sel Ask/Bid yang agresif</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(settings.showImbalance)}
                    onChange={(e) => handleChange('showImbalance', e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                    style={{ accentColor: palette.bull }}
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] hover:border-[var(--color-border-active)] cursor-pointer">
                  <div>
                    <div className="font-semibold text-[var(--color-text)] text-xs">Proyeksikan Garis S/R Stacked Imbalances</div>
                    <div className="text-[10px] text-[var(--color-text-muted)]">Tarik garis ray support/resistance ke kanan grafik</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(settings.showSrFootprints)}
                    onChange={(e) => handleChange('showSrFootprints', e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                    style={{ accentColor: palette.bull }}
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: AUCTION MARKET THEORY (POC & VALUE AREA) */}
          {activeTab === 'amt' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Value Area Percentage */}
                <div className="p-3.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)]">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-[var(--color-text)]">
                      Persentase Value Area (VAH / VAL)
                    </label>
                    <span className="text-xs font-mono font-bold" style={{ color: palette.bull }}>
                      {settings.valueAreaPct ?? 70}%
                    </span>
                  </div>
                  <p className="text-[10px] text-[var(--color-text-muted)] mb-2">
                    Distribusi 1 Standar Deviasi (Standar industri: 70%)
                  </p>
                  <input
                    type="range"
                    min="50"
                    max="90"
                    step="5"
                    value={settings.valueAreaPct ?? 70}
                    onChange={(e) =>
                      handleChange('valueAreaPct', parseInt(e.target.value))
                    }
                    className="w-full cursor-pointer"
                    style={{ accentColor: palette.bull }}
                  />
                </div>

                {/* High Volume Node (HVN) Threshold */}
                <div className="p-3.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)]">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-[var(--color-text)]">Ambang High Volume Node (HVN)</label>
                    <span className="text-xs font-mono font-bold" style={{ color: palette.bull }}>
                      {settings.hvnThreshold ?? 70}%
                    </span>
                  </div>
                  <p className="text-[10px] text-[var(--color-text-muted)] mb-2">
                    Tandai level dengan akumulasi volume di atas batas ini
                  </p>
                  <input
                    type="range"
                    min="50"
                    max="90"
                    step="5"
                    value={settings.hvnThreshold ?? 70}
                    onChange={(e) =>
                      handleChange('hvnThreshold', parseInt(e.target.value))
                    }
                    className="w-full cursor-pointer"
                    style={{ accentColor: palette.bull }}
                  />
                </div>
              </div>

              {/* Toggles AMT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <label className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] hover:border-[var(--color-border-active)] cursor-pointer">
                  <div>
                    <div className="font-semibold text-[var(--color-text)] text-xs">Sorot Point of Control (POC)</div>
                    <div className="text-[10px] text-[var(--color-text-muted)]">Bingkai emas/kuning tebal pada baris volume tertinggi</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(settings.showPoc)}
                    onChange={(e) => handleChange('showPoc', e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                    style={{ accentColor: palette.bull }}
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] hover:border-[var(--color-border-active)] cursor-pointer">
                  <div>
                    <div className="font-semibold text-[var(--color-text)] text-xs">Tampilkan Value Area (VAH / VAL)</div>
                    <div className="text-[10px] text-[var(--color-text-muted)]">Sorotan zona 70% volume likuiditas di dalam candle</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(settings.showValueArea)}
                    onChange={(e) => handleChange('showValueArea', e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                    style={{ accentColor: palette.bull }}
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] hover:border-[var(--color-border-active)] cursor-pointer">
                  <div>
                    <div className="font-semibold text-[var(--color-text)] text-xs">Klasifikasi Profil (P-Shape / b-Shape / D-Shape)</div>
                    <div className="text-[10px] text-[var(--color-text-muted)]">Deteksi inisiatif pembeli/penjual atau likuidasi</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(settings.showProfileShape)}
                    onChange={(e) => handleChange('showProfileShape', e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                    style={{ accentColor: palette.bull }}
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] hover:border-[var(--color-border-active)] cursor-pointer">
                  <div>
                    <div className="font-semibold text-[var(--color-text)] text-xs">Tanda Lelang Belum Selesai (Unfinished Auction)</div>
                    <div className="text-[10px] text-[var(--color-text-muted)]">Tandai High/Low dengan nol lelang untuk target magnet harga</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(settings.showUnfinishedAuction)}
                    onChange={(e) => handleChange('showUnfinishedAuction', e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                    style={{ accentColor: palette.bull }}
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] hover:border-[var(--color-border-active)] cursor-pointer sm:col-span-2">
                  <div>
                    <div className="font-semibold text-[var(--color-text)] text-xs">Sinyal Absorpsi Institusional & Trader Terjebak</div>
                    <div className="text-[10px] text-[var(--color-text-muted)]">Tampilkan badge ABSORB BUY / ABSORB SELL & TRAPPED BUYERS / SELLERS</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(settings.showAbsorptionBadges)}
                    onChange={(e) => handleChange('showAbsorptionBadges', e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                    style={{ accentColor: palette.bull }}
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 4: DELTA SUMMARY TABLE */}
          {activeTab === 'summary' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-3.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)]">
                <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">
                  Tingkat Kelengkapan Baris Ringkasan Di Bawah Lilin
                </label>
                <select
                  value={settings.summaryRows || '4-Tier (Vol, Delta, Range, CVD)'}
                  onChange={(e) =>
                    handleChange('summaryRows', e.target.value as SummaryRowMode)
                  }
                  className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-lg px-3 py-2 text-xs text-[var(--color-text)] outline-none cursor-pointer hover:border-[var(--color-border-active)] transition-colors"
                >
                  <option value="4-Tier (Vol, Delta, Range, CVD)">
                    4 Baris: Total Volume, Bar Delta, Min/Max Delta Range, CVD
                  </option>
                  <option value="5-Tier (+Delta %)">
                    5 Baris: (+ Persentase Delta %)
                  </option>
                  <option value="Compact (Vol, Delta)">
                    2 Baris Ringkas: Hanya Total Volume & Bar Delta
                  </option>
                  <option value="Off">Nonaktifkan Tabel Bawah</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <label className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] hover:border-[var(--color-border-active)] cursor-pointer">
                  <div>
                    <div className="font-semibold text-[var(--color-text)] text-xs">Tampilkan Bar Delta</div>
                    <div className="text-[10px] text-[var(--color-text-muted)]">Warnai hijau/merah berdasarkan pembeli/penjual dominan</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(settings.showDelta)}
                    onChange={(e) => handleChange('showDelta', e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                    style={{ accentColor: palette.bull }}
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] hover:border-[var(--color-border-active)] cursor-pointer">
                  <div>
                    <div className="font-semibold text-[var(--color-text)] text-xs">Panel Informasi Top-Right Buy/Sell</div>
                    <div className="text-[10px] text-[var(--color-text-muted)]">Tampilkan total akumulasi buy/sell volume di HUD pojok</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(settings.showBuySellVolume)}
                    onChange={(e) => handleChange('showBuySellVolume', e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                    style={{ accentColor: palette.bull }}
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 5: MULTI-TIMEFRAME & S/R MITIGATION */}
          {activeTab === 'htf' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Auto HTF Mode */}
                <label className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] cursor-pointer">
                  <div>
                    <div className="font-semibold text-[var(--color-text)] text-xs">Mode Auto-HTF</div>
                    <div className="text-[10px] text-[var(--color-text-muted)]">
                      Otomatis kalkulasi skala HTF sesuai zoom chart
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(settings.autoHtfMode)}
                    onChange={(e) => handleChange('autoHtfMode', e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                    style={{ accentColor: palette.bull }}
                  />
                </label>

                {/* Manual HTF Timeframe */}
                <div className="p-3.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)]">
                  <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">
                    Timeframe Agregat HTF Manual
                  </label>
                  <select
                    disabled={settings.autoHtfMode}
                    value={settings.manualHtfTimeframe || '60'}
                    onChange={(e) => handleChange('manualHtfTimeframe', e.target.value)}
                    className={`w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-lg px-3 py-2 text-xs text-[var(--color-text)] outline-none ${
                      settings.autoHtfMode ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-[var(--color-border-active)]'
                    }`}
                  >
                    <option value="15">15 Menit</option>
                    <option value="60">1 Jam (60m)</option>
                    <option value="240">4 Jam (240m)</option>
                    <option value="D">1 Hari (D)</option>
                  </select>
                </div>

                {/* S/R Level Source */}
                <div className="p-3.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)]">
                  <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">
                    Sumber Pembentukan Level S/R
                  </label>
                  <select
                    value={settings.srSource || 'Imbalances'}
                    onChange={(e) =>
                      handleChange('srSource', e.target.value as SRSourceType)
                    }
                    className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-lg px-3 py-2 text-xs text-[var(--color-text)] outline-none cursor-pointer hover:border-[var(--color-border-active)] transition-colors"
                  >
                    <option value="Imbalances">Stacked Imbalances</option>
                    <option value="Large Volume">Large Volume Clusters</option>
                    <option value="Both">Kombinasi Keduanya (Imbalances & Volume)</option>
                  </select>
                </div>

                {/* Mitigation Type */}
                <div className="p-3.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)]">
                  <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">
                    Aturan Mitigasi S/R (Invalidasi)
                  </label>
                  <select
                    value={settings.mitigationType || 'HTF Body Close'}
                    onChange={(e) =>
                      handleChange('mitigationType', e.target.value as MitigationType)
                    }
                    className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-lg px-3 py-2 text-xs text-[var(--color-text)] outline-none cursor-pointer hover:border-[var(--color-border-active)] transition-colors"
                  >
                    <option value="HTF Body Close">Penutupan Body Candle (HTF Body Close)</option>
                    <option value="HTF Wick">Sentuhan Sumbu Ekstrem (HTF Wick)</option>
                  </select>
                </div>

                {/* Max Active S/R Levels */}
                <div className="p-3.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)]">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-[var(--color-text)]">Maksimal Garis S/R Aktif</label>
                    <span className="text-xs font-mono font-bold" style={{ color: palette.bull }}>
                      {settings.maxSrLevels ?? 6} Level
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="12"
                    step="1"
                    value={settings.maxSrLevels ?? 6}
                    onChange={(e) => handleChange('maxSrLevels', parseInt(e.target.value))}
                    className="w-full cursor-pointer mt-2"
                    style={{ accentColor: palette.bull }}
                  />
                </div>

                {/* Keep Mitigated S/R */}
                <label className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] cursor-pointer">
                  <div>
                    <div className="font-semibold text-[var(--color-text)] text-xs">Pertahankan S/R Termitigasi</div>
                    <div className="text-[10px] text-[var(--color-text-muted)]">Tampilkan riwayat level yang telah ditembus dalam warna pudar</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(settings.keepMitigatedSr)}
                    onChange={(e) => handleChange('keepMitigatedSr', e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                    style={{ accentColor: palette.bull }}
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[var(--color-bg)]/80 border-t border-[var(--color-border)] flex justify-between items-center text-xs">
          <div className="flex items-center gap-2 text-[var(--color-text-muted)] font-mono text-[11px]">
            <CheckCircle2 size={14} style={{ color: palette.bull }} />
            <span>Semua kalkulasi order flow dihitung secara real-time</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)] rounded-lg hover:bg-[var(--color-hover)] transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 font-bold rounded-lg cursor-pointer transition-transform hover:scale-[1.02] text-black shadow-lg"
              style={{
                backgroundColor: palette.bull,
              }}
            >
              Terapkan Pengaturan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
