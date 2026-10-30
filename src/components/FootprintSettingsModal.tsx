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
import { hexToRgba, getThemeModalGradient, getThemeCardBorder } from '../utils/themeGradient';

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
  const { palette, isLight } = useTheme();
  const [activeTab, setActiveTab] = useState<'input' | 'style' | 'structure' | 'stats'>('input');

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
        className="backdrop-blur-2xl rounded-2xl w-full sm:w-[480px] md:w-[600px] h-[calc(100vh-80px)] flex flex-col shadow-2xl overflow-hidden border pointer-events-auto relative"
        style={{ 
          background: getThemeModalGradient(palette, isLight),
          borderColor: getThemeCardBorder(palette, false),
          boxShadow: `0 25px 50px -12px rgba(0,0,0,0.85), 0 0 35px ${hexToRgba(palette.bull, 0.25)}` 
        }}
      >
        {/* Top Accent Gradient Bar */}
        <div 
          className="absolute top-0 left-0 right-0 h-[2.5px] z-20 pointer-events-none"
          style={{
            background: `linear-gradient(90deg, ${palette.bull} 0%, ${palette.poc || '#6366f1'} 50%, ${palette.bear} 100%)`,
            boxShadow: `0 0 10px ${hexToRgba(palette.bull, 0.4)}`
          }}
        />
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-bg)]/80">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[var(--color-text)] tracking-wide flex items-center gap-1.5">
                  Footprint <span>𝙈𝙤𝙪𝙣𝙩𝘼𝙡𝙜𝙤</span> Settings
                </h2>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider"
                  style={{ backgroundColor: `${palette.bull}25`, color: palette.bull }}
                >
                  V7.2 PRO
                </span>
              </div>
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
          {(['input', 'style', 'structure', 'stats'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                activeTab === tab
                  ? 'text-[var(--color-text)] shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)]'
              }`}
              style={{
                backgroundColor: activeTab === tab ? `${palette.bull}25` : 'transparent',
                borderColor: activeTab === tab ? `${palette.bull}80` : 'transparent',
                borderWidth: 1,
              }}
            >
              <span className="capitalize">{tab}</span>
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm text-[var(--color-text)] scrollbar-thin">
          {/* TAB: INPUT */}
          {activeTab === 'input' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)]">
                  <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Mode</label>
                  <select
                    value={settings.footprintType || 'Bid × Ask Profile'}
                    onChange={(e) => handleChange('footprintType', e.target.value as FootprintType)}
                    className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-lg px-3 py-2 text-xs text-[var(--color-text)] outline-none cursor-pointer"
                  >
                    <option value="Bid × Ask Profile">Bid × Ask Profile</option>
                    <option value="Bid × Ask Ladder">Bid × Ask Ladder</option>
                    <option value="Volume Profile">Volume Profile</option>
                    <option value="Delta Profile">Delta Profile</option>
                    <option value="Absolute Delta">Absolute Delta</option>
                  </select>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)]">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-[var(--color-text)]">Row Size</label>
                    <span className="text-xs font-mono font-bold" style={{ color: palette.bull }}>{settings.levelsCount ?? 10}</span>
                  </div>
                  <input
                    type="range" min="5" max="25" step="1"
                    value={settings.levelsCount ?? 10}
                    onChange={(e) => handleChange('levelsCount', parseInt(e.target.value))}
                    className="w-full cursor-pointer mt-2"
                    style={{ accentColor: palette.bull }}
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)]">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-[var(--color-text)]">Imbalance Ratio</label>
                    <span className="text-xs font-mono font-bold" style={{ color: palette.bull }}>{settings.imbalanceRatio ?? 3.0}x</span>
                  </div>
                  <input
                    type="range" min="1.5" max="6.0" step="0.1"
                    value={settings.imbalanceRatio ?? 3.0}
                    onChange={(e) => handleChange('imbalanceRatio', parseFloat(e.target.value))}
                    className="w-full cursor-pointer mt-2"
                    style={{ accentColor: palette.bull }}
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)]">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-[var(--color-text)]">Min Volume</label>
                    <span className="text-xs font-mono font-bold" style={{ color: palette.bull }}>{settings.imbalanceMinVol ?? 0}</span>
                  </div>
                  <input
                    type="range" min="0" max="20" step="1"
                    value={settings.imbalanceMinVol ?? 0}
                    onChange={(e) => handleChange('imbalanceMinVol', parseFloat(e.target.value))}
                    className="w-full cursor-pointer mt-2"
                    style={{ accentColor: palette.bull }}
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)]">
                  <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">HTF Timeframe</label>
                  <select
                    disabled={settings.autoHtfMode}
                    value={settings.manualHtfTimeframe || '60'}
                    onChange={(e) => handleChange('manualHtfTimeframe', e.target.value)}
                    className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-lg px-3 py-2 text-xs text-[var(--color-text)]"
                  >
                    <option value="15">15m</option>
                    <option value="60">1h</option>
                    <option value="240">4h</option>
                    <option value="D">1d</option>
                  </select>
                </div>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] cursor-pointer">
                  <div className="font-semibold text-xs text-[var(--color-text)]">Auto HTF Mode</div>
                  <input
                    type="checkbox"
                    checked={Boolean(settings.autoHtfMode)}
                    onChange={(e) => handleChange('autoHtfMode', e.target.checked)}
                    className="w-4 h-4"
                    style={{ accentColor: palette.bull }}
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB: STYLE */}
          {activeTab === 'style' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)]">
                  <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Cell Style</label>
                  <select
                    value={settings.cellStyle || 'Heatmap Gradient'}
                    onChange={(e) => handleChange('cellStyle', e.target.value as CellStyleMode)}
                    className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-lg px-3 py-2 text-xs text-[var(--color-text)] outline-none cursor-pointer"
                  >
                    <option value="Heatmap Gradient">Heatmap Gradient</option>
                    <option value="Solid Tint">Solid Tint</option>
                    <option value="Minimalist">Minimalist</option>
                  </select>
                </div>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] cursor-pointer">
                  <div className="font-semibold text-xs text-[var(--color-text)]">Volume Heatmap</div>
                  <input
                    type="checkbox"
                    checked={Boolean(settings.showVolumeProfile)}
                    onChange={(e) => handleChange('showVolumeProfile', e.target.checked)}
                    className="w-4 h-4"
                    style={{ accentColor: palette.bull }}
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] cursor-pointer">
                  <div className="font-semibold text-xs text-[var(--color-text)]">Show Logo</div>
                  <input
                    type="checkbox"
                    checked={Boolean(settings.showLogo)}
                    onChange={(e) => handleChange('showLogo', e.target.checked)}
                    className="w-4 h-4"
                    style={{ accentColor: palette.bull }}
                  />
                </label>

                <div className="p-3.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)]">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-[var(--color-text)]">Line Width</label>
                    <span className="text-xs font-mono font-bold" style={{ color: palette.bull }}>{settings.imbalanceLineWidth ?? 1.5}px</span>
                  </div>
                  <input
                    type="range" min="1" max="6" step="0.5"
                    value={settings.imbalanceLineWidth ?? 1.5}
                    onChange={(e) => handleChange('imbalanceLineWidth', parseFloat(e.target.value))}
                    className="w-full cursor-pointer mt-2"
                    style={{ accentColor: palette.bull }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB: STRUCTURE */}
          {activeTab === 'structure' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] cursor-pointer">
                  <div className="font-semibold text-xs text-[var(--color-text)]">Show POC</div>
                  <input
                    type="checkbox"
                    checked={Boolean(settings.showPoc)}
                    onChange={(e) => handleChange('showPoc', e.target.checked)}
                    className="w-4 h-4"
                    style={{ accentColor: palette.bull }}
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] cursor-pointer">
                  <div className="font-semibold text-xs text-[var(--color-text)]">Show Value Area</div>
                  <input
                    type="checkbox"
                    checked={Boolean(settings.showValueArea)}
                    onChange={(e) => handleChange('showValueArea', e.target.checked)}
                    className="w-4 h-4"
                    style={{ accentColor: palette.bull }}
                  />
                </label>

                <div className="p-3.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)]">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-[var(--color-text)]">Value Area %</label>
                    <span className="text-xs font-mono font-bold" style={{ color: palette.bull }}>{settings.valueAreaPct ?? 70}%</span>
                  </div>
                  <input
                    type="range" min="50" max="90" step="5"
                    value={settings.valueAreaPct ?? 70}
                    onChange={(e) => handleChange('valueAreaPct', parseInt(e.target.value))}
                    className="w-full cursor-pointer mt-2"
                    style={{ accentColor: palette.bull }}
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)]">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-[var(--color-text)]">HVN Threshold</label>
                    <span className="text-xs font-mono font-bold" style={{ color: palette.bull }}>{settings.hvnThreshold ?? 70}%</span>
                  </div>
                  <input
                    type="range" min="50" max="90" step="5"
                    value={settings.hvnThreshold ?? 70}
                    onChange={(e) => handleChange('hvnThreshold', parseInt(e.target.value))}
                    className="w-full cursor-pointer mt-2"
                    style={{ accentColor: palette.bull }}
                  />
                </div>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] cursor-pointer">
                  <div className="font-semibold text-xs text-[var(--color-text)]">Profile Shape</div>
                  <input
                    type="checkbox"
                    checked={Boolean(settings.showProfileShape)}
                    onChange={(e) => handleChange('showProfileShape', e.target.checked)}
                    className="w-4 h-4"
                    style={{ accentColor: palette.bull }}
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] cursor-pointer">
                  <div className="font-semibold text-xs text-[var(--color-text)]">Unfinished Auction</div>
                  <input
                    type="checkbox"
                    checked={Boolean(settings.showUnfinishedAuction)}
                    onChange={(e) => handleChange('showUnfinishedAuction', e.target.checked)}
                    className="w-4 h-4"
                    style={{ accentColor: palette.bull }}
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] cursor-pointer">
                  <div className="font-semibold text-xs text-[var(--color-text)]">S/R Footprints</div>
                  <input
                    type="checkbox"
                    checked={Boolean(settings.showSrFootprints)}
                    onChange={(e) => handleChange('showSrFootprints', e.target.checked)}
                    className="w-4 h-4"
                    style={{ accentColor: palette.bull }}
                  />
                </label>

                <div className="p-3.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)]">
                  <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">S/R Source</label>
                  <select
                    value={settings.srSource || 'Imbalances'}
                    onChange={(e) => handleChange('srSource', e.target.value as SRSourceType)}
                    className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-lg px-3 py-2 text-xs text-[var(--color-text)]"
                  >
                    <option value="Imbalances">Imbalances</option>
                    <option value="Large Volume">Large Volume</option>
                    <option value="Both">Both</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB: STATS */}
          {activeTab === 'stats' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] sm:col-span-2">
                  <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Summary Table</label>
                  <select
                    value={settings.summaryRows || '4-Tier (Vol, Delta, Range, CVD)'}
                    onChange={(e) => handleChange('summaryRows', e.target.value as SummaryRowMode)}
                    className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-lg px-3 py-2 text-xs text-[var(--color-text)]"
                  >
                    <option value="4-Tier (Vol, Delta, Range, CVD)">4-Tier (Full)</option>
                    <option value="5-Tier (+Delta %)">5-Tier (Extra)</option>
                    <option value="Compact (Vol, Delta)">Compact</option>
                    <option value="Off">Off</option>
                  </select>
                </div>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] cursor-pointer">
                  <div className="font-semibold text-xs text-[var(--color-text)]">HUD Buy/Sell Info</div>
                  <input
                    type="checkbox"
                    checked={Boolean(settings.showBuySellVolume)}
                    onChange={(e) => handleChange('showBuySellVolume', e.target.checked)}
                    className="w-4 h-4"
                    style={{ accentColor: palette.bull }}
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] cursor-pointer">
                  <div className="font-semibold text-xs text-[var(--color-text)]">Absorption Badges</div>
                  <input
                    type="checkbox"
                    checked={Boolean(settings.showAbsorptionBadges)}
                    onChange={(e) => handleChange('showAbsorptionBadges', e.target.checked)}
                    className="w-4 h-4"
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
