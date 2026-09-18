import React, { useState, useRef } from 'react';
import { 
  X, LayoutGrid, Zap, TrendingUp, LineChart, Plus, Trash2, Check, 
  Sparkles, Layers, ShieldCheck, Play, Save, Monitor, Smartphone, Clock,
  Download, Upload, FileJson, RefreshCw
} from 'lucide-react';
import { MountAlgoLogo } from './MountAlgoLogo';
import { 
  WorkspacePreset, 
  getStoredWorkspacePresets, 
  saveWorkspacePresets, 
  saveActiveWorkspacePresetId, 
  getActiveWorkspacePresetId,
  triggerWorkspaceSaveToast,
  exportWorkspaceConfiguration,
  importWorkspaceConfiguration
} from '../utils/terminalPersistence';
import { useTheme } from '../context/ThemeContext';
import { ColorThemeName } from '../context/ThemeContext';
import { tradingAudio } from '../utils/audioSynth';
import { 
  getThemeModalGradient, 
  getThemeCardGradient, 
  getThemeCardBorder, 
  getThemeCardBoxShadow, 
  hexToRgba 
} from '../utils/themeGradient';

interface WorkspacePresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWidgetOrder: string[];
  currentOrientation: 'auto' | 'landscape' | 'portrait';
  onApplyPreset: (preset: WorkspacePreset) => void;
}

export const WorkspacePresetsModal: React.FC<WorkspacePresetsModalProps> = ({
  isOpen,
  onClose,
  currentWidgetOrder,
  currentOrientation,
  onApplyPreset,
}) => {
  const { theme, palette, isLight } = useTheme();
  const [presets, setPresets] = useState<WorkspacePreset[]>(() => getStoredWorkspacePresets());
  const [activePresetId, setActivePresetId] = useState<string>(() => getActiveWorkspacePresetId());
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  
  // Custom preset creation state
  const [isCreating, setIsCreating] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetCategory, setNewPresetCategory] = useState<'Scalping' | 'Swing' | 'Analysis' | 'Custom'>('Custom');
  const [newPresetDesc, setNewPresetDesc] = useState('');

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  if (!isOpen) return null;

  const categories = ['ALL', 'Scalping', 'Swing', 'Analysis', 'Custom'];

  const filteredPresets = presets.filter((p) => {
    if (selectedCategory === 'ALL') return true;
    return p.category === selectedCategory;
  });

  const getPresetIcon = (iconName?: string, category?: string) => {
    if (iconName === 'Zap' || category === 'Scalping') return Zap;
    if (iconName === 'TrendingUp' || category === 'Swing') return TrendingUp;
    if (iconName === 'LineChart' || category === 'Analysis') return LineChart;
    return LayoutGrid;
  };

  const handleSelectPreset = (preset: WorkspacePreset) => {
    setActivePresetId(preset.id);
    saveActiveWorkspacePresetId(preset.id);
    onApplyPreset(preset);
    try {
      tradingAudio.play('ALERT');
    } catch {}
    onClose();
  };

  const handleExportJson = () => {
    try {
      const jsonStr = exportWorkspaceConfiguration();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mountalgo-workspace-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      triggerWorkspaceSaveToast('Konfigurasi Workspace berhasil diekspor ke file JSON!');
      try { tradingAudio.play('PRESET'); } catch {}
    } catch (e) {
      console.error('Export error:', e);
    }
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const result = importWorkspaceConfiguration(content);
        if (result.success) {
          const freshPresets = getStoredWorkspacePresets();
          setPresets(freshPresets);
          const activeId = getActiveWorkspacePresetId();
          setActivePresetId(activeId);
          triggerWorkspaceSaveToast(result.message);
          try { tradingAudio.play('ALERT'); } catch {}
          // Apply active preset
          const activePreset = freshPresets.find(p => p.id === activeId) || freshPresets[0];
          if (activePreset) {
            onApplyPreset(activePreset);
          }
        }
      } catch (err) {
        console.error('Import error:', err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveCurrentAsPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;

    const newPreset: WorkspacePreset = {
      id: `preset_custom_${Date.now()}`,
      name: newPresetName.trim(),
      category: newPresetCategory,
      description: newPresetDesc.trim() || `Kustom ${currentWidgetOrder.length} Panel (${currentOrientation})`,
      widgetOrder: [...currentWidgetOrder],
      orientation: currentOrientation,
      theme: theme as ColorThemeName,
      isCustom: true,
      iconName: 'LayoutGrid',
      createdAt: Date.now(),
    };

    const updated = [newPreset, ...presets];
    setPresets(updated);
    saveWorkspacePresets(updated);
    setActivePresetId(newPreset.id);
    saveActiveWorkspacePresetId(newPreset.id);

    setIsCreating(false);
    setNewPresetName('');
    setNewPresetDesc('');
    triggerWorkspaceSaveToast(`Preset kustom "${newPreset.name}" berhasil disimpan ke penyimpanan lokal!`);
    try {
      tradingAudio.play('PRESET');
    } catch {}
  };

  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
  };

  const confirmDelete = () => {
    if (!deletingId) return;
    const deletedPreset = presets.find(p => p.id === deletingId);
    const updated = presets.filter((p) => p.id !== deletingId);
    setPresets(updated);
    saveWorkspacePresets(updated);
    setDeletingId(null);
    triggerWorkspaceSaveToast(`Preset "${deletedPreset?.name || ''}" berhasil dihapus dari penyimpanan lokal!`);
  };

  return (
    <div className="fixed inset-0 z-modal-ultimate flex items-center justify-center p-2 sm:p-3 md:p-4 animate-in fade-in duration-150 select-none">
      {/* Translucent Backdrop - background outside modal is visible */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      <div 
        className="relative rounded-xl sm:rounded-2xl w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border backdrop-blur-2xl pointer-events-auto"
        style={{ 
          background: getThemeModalGradient(palette, isLight),
          borderColor: getThemeCardBorder(palette, false),
          boxShadow: `0 25px 60px -15px rgba(0,0,0,0.85), 0 0 35px ${hexToRgba(palette.bull, 0.25)}`
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Theme Accent Bar with bull -> poc -> bear */}
        <div 
          className="absolute top-0 left-0 right-0 h-[2.5px] z-20"
          style={{
            background: `linear-gradient(90deg, ${palette.bull} 0%, ${palette.poc || '#6366f1'} 50%, ${palette.bear} 100%)`,
            boxShadow: `0 0 12px ${hexToRgba(palette.bull, 0.4)}`
          }}
        />

        {/* Modal Header */}
        <div 
          style={{
            background: `linear-gradient(90deg, ${hexToRgba(palette.bull, 0.14)} 0%, rgba(255,255,255,0.02) 50%, ${hexToRgba(palette.bear, 0.12)} 100%)`,
          }}
          className="px-3 sm:px-5 py-2.5 sm:py-3.5 border-b border-white/10 flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <MountAlgoLogo size="sm" className="w-8 h-8" />
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[var(--color-text)] tracking-wide flex items-center gap-2">
                Workspace Presets <span>𝙈𝙤𝙪𝙣𝙩𝘼𝙡𝙜𝙤</span>
                <span 
                  className="text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase" 
                  style={{ 
                    background: `linear-gradient(135deg, ${hexToRgba(palette.bull, 0.22)} 0%, ${hexToRgba(palette.bear, 0.16)} 100%)`, 
                    color: palette.bull,
                    border: `1px solid ${hexToRgba(palette.bull, 0.4)}`
                  }}
                >
                  1-CLICK SWITCH
                </span>
              </h2>
              <p className="text-[10px] sm:text-[11px] text-[var(--color-text-muted)] hidden sm:block">
                Beralih cepat antar konfigurasi tata letak widget (Scalping, Swing, Macro Analysis, Multi-Chart)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Categories Bar & Action button */}
        <div className="px-3 sm:px-5 py-2 sm:py-2.5 bg-black/20 border-b border-[var(--color-border)]/60 flex items-center justify-between gap-1.5 sm:gap-2 overflow-x-auto hide-scrollbar">
          <div className="flex items-center gap-1.5 shrink-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={selectedCategory === cat ? { 
                  background: `linear-gradient(135deg, ${palette.bull} 0%, ${palette.bear} 100%)`, 
                  color: '#ffffff',
                  textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                  boxShadow: `0 2px 10px -2px ${hexToRgba(palette.bull, 0.4)}`
                } : {}}
                className={`text-[11px] sm:text-xs px-2.5 sm:px-3 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'shadow-md'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            {/* Export JSON Button */}
            <button
              onClick={handleExportJson}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[var(--color-border)] text-[11px] font-bold text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-bull)] transition-colors cursor-pointer"
              title="Export Full Workspace Setup to JSON"
            >
              <Download size={12} />
              <span className="hidden sm:inline">Export JSON</span>
            </button>

            {/* Import JSON Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[var(--color-border)] text-[11px] font-bold text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-bull)] transition-colors cursor-pointer"
              title="Import Workspace Setup from JSON"
            >
              <Upload size={12} />
              <span className="hidden sm:inline">Import JSON</span>
            </button>
            <input 
              ref={fileInputRef} 
              type="file" 
              accept=".json,application/json" 
              className="hidden" 
              onChange={handleImportJson} 
            />

            <button
              onClick={() => setIsCreating(!isCreating)}
              style={{ 
                background: `linear-gradient(135deg, ${hexToRgba(palette.bull, 0.16)} 0%, ${hexToRgba(palette.bear, 0.10)} 100%)`,
                borderColor: hexToRgba(palette.bull, 0.4), 
                color: palette.bull 
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-bold hover:brightness-125 transition-all cursor-pointer"
            >
              {isCreating ? <X size={13} /> : <Plus size={13} />}
              <span className="hidden sm:inline">{isCreating ? 'Batal' : 'Simpan Layout Saat Ini'}</span>
              <span className="sm:hidden">{isCreating ? 'Batal' : 'Simpan'}</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-3 sm:p-5 overflow-y-auto custom-scrollbar space-y-3 sm:space-y-4 flex-1">
          {/* Create Preset Form */}
          {isCreating && (
            <form 
              onSubmit={handleSaveCurrentAsPreset}
              style={{
                background: getThemeCardGradient(palette, isLight, false),
                borderColor: hexToRgba(palette.bull, 0.4),
              }}
              className="p-4 rounded-xl border space-y-3 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md"
            >
              <div className="flex items-center justify-between border-b border-[var(--color-border)]/60 pb-2">
                <span className="text-xs font-bold text-[var(--color-text)] flex items-center gap-1.5">
                  <Save size={14} style={{ color: palette.bull }} />
                  Simpan Konfigurasi Panel Saat Ini ({currentWidgetOrder.length} Panel Aktif)
                </span>
                <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
                  Orientasi: {currentOrientation.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--color-text-muted)] mb-1">
                    Nama Preset
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: News Scalper Extreme"
                    value={newPresetName ?? ''}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    className="w-full bg-[var(--color-panel)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-bull)]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[var(--color-text-muted)] mb-1">
                    Kategori Preset
                  </label>
                  <select
                    value={newPresetCategory ?? 'Custom'}
                    onChange={(e) => setNewPresetCategory(e.target.value as any)}
                    className="w-full bg-[var(--color-panel)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-bull)] cursor-pointer"
                  >
                    <option value="Scalping">Scalping</option>
                    <option value="Swing">Swing</option>
                    <option value="Analysis">Analysis</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--color-text-muted)] mb-1">
                  Deskripsi Singkat (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Keterangan alur trading atau instrumen yang digunakan..."
                  value={newPresetDesc ?? ''}
                  onChange={(e) => setNewPresetDesc(e.target.value)}
                  className="w-full bg-[var(--color-panel)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-bull)]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-panel)] transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{ 
                    background: `linear-gradient(135deg, ${palette.bull} 0%, ${palette.bear} 100%)`, 
                    color: '#ffffff',
                    textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                    boxShadow: `0 4px 15px -2px ${hexToRgba(palette.bull, 0.4)}`
                  }}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold hover:opacity-90 hover:brightness-110 transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <Check size={13} strokeWidth={3} />
                  Simpan Preset
                </button>
              </div>
            </form>
          )}

          {/* Preset Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredPresets.map((preset) => {
              const Icon = getPresetIcon(preset.iconName, preset.category);
              const isActive = activePresetId === preset.id;
              return (
                <div
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  style={isActive ? { 
                    background: `linear-gradient(135deg, ${hexToRgba(palette.bull, 0.16)} 0%, ${hexToRgba(palette.bear, 0.10)} 100%)`,
                    borderColor: hexToRgba(palette.bull, 0.6), 
                    boxShadow: `0 8px 25px -4px ${hexToRgba(palette.bull, 0.25)}` 
                  } : {
                    background: getThemeCardGradient(palette, isLight, false),
                    borderColor: getThemeCardBorder(palette, false)
                  }}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative group flex flex-col justify-between backdrop-blur-md ${
                    isActive
                      ? 'ring-1 ring-[var(--color-bull)]/40'
                      : 'hover:border-[var(--color-bull)]/60'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          style={{
                            background: isActive 
                              ? `linear-gradient(135deg, ${palette.bull} 0%, ${palette.bear} 100%)` 
                              : `linear-gradient(135deg, ${hexToRgba(palette.bull, 0.2)} 0%, ${hexToRgba(palette.bear, 0.15)} 100%)`,
                            color: isActive ? '#ffffff' : palette.bull,
                          }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors shadow-sm"
                        >
                          <Icon size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-xs text-[var(--color-text)]">
                              {preset.name}
                            </h4>
                            <span 
                              style={{ 
                                background: `linear-gradient(135deg, ${hexToRgba(palette.bull, 0.18)} 0%, ${hexToRgba(palette.bear, 0.12)} 100%)`, 
                                color: palette.bull,
                                border: `1px solid ${hexToRgba(palette.bull, 0.3)}`
                              }}
                              className="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase"
                            >
                              {preset.category}
                            </span>
                          </div>
                          <span className="text-[10px] text-[var(--color-text-muted)] font-mono">
                            {preset.widgetOrder.length} Panel • {preset.orientation.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {preset.isCustom && !isActive && (
                          <button
                            onClick={(e) => handleDeletePreset(preset.id, e)}
                            className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Hapus Preset Kustom"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                        {isActive && (
                          <span 
                            style={{ 
                              background: `linear-gradient(135deg, ${palette.bull} 0%, ${palette.bear} 100%)`, 
                              color: '#ffffff' 
                            }}
                            className="p-1 rounded-full text-xs font-bold shadow-sm"
                          >
                            <Check size={12} strokeWidth={3} />
                          </span>
                        )}
                      </div>
                    </div>

                    {deletingId === preset.id && (
                      <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 rounded-xl text-center space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                        <Trash2 size={24} className="text-red-500" />
                        <div className="text-[11px] font-bold text-white">Hapus preset ini permanen?</div>
                        <div className="flex gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setDeletingId(null); }}
                            className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-[10px] rounded font-bold cursor-pointer transition-colors"
                          >
                            Batal
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); confirmDelete(); }}
                            className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-[10px] rounded font-bold cursor-pointer transition-colors"
                          >
                            Ya, Hapus
                          </button>
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-[var(--color-text-muted)] line-clamp-2 mb-3">
                      {preset.description}
                    </p>
                  </div>

                  {/* Visual Widget Miniature Preview */}
                  <div className="pt-2 border-t border-[var(--color-border)]/50 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {preset.widgetOrder.map((w, idx) => (
                        <div
                          key={idx}
                          style={{ 
                            borderColor: hexToRgba(palette.bull, 0.6),
                            background: `linear-gradient(135deg, ${hexToRgba(palette.bull, 0.25)} 0%, ${hexToRgba(palette.bear, 0.15)} 100%)`
                          }}
                          className="w-6 h-4 rounded-sm border flex items-center justify-center text-[7px] font-mono text-[var(--color-text)] font-bold"
                        >
                          {idx + 1}
                        </div>
                      ))}
                    </div>

                    <span 
                      style={{ color: palette.bull }}
                      className="text-[10px] font-bold group-hover:underline flex items-center gap-1"
                    >
                      <span>Terapkan Preset</span>
                      <Play size={10} fill="currentColor" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-3 sm:px-5 py-2.5 sm:py-3 border-t border-white/10 bg-black/20 flex items-center justify-between text-[11px] sm:text-xs text-[var(--color-text-muted)]">
          <span className="hidden sm:inline">Preset dapat diubah kapan saja dengan animasi otomatis.</span>
          <span className="sm:hidden">Preset tersimpan otomatis.</span>
          <button
            onClick={onClose}
            style={{ 
              background: `linear-gradient(135deg, ${palette.bull} 0%, ${palette.bear} 100%)`, 
              color: '#ffffff',
              textShadow: '0 1px 2px rgba(0,0,0,0.6)',
              boxShadow: `0 2px 10px -2px ${hexToRgba(palette.bull, 0.4)}`
            }}
            className="px-4 py-1.5 rounded-lg text-xs font-bold hover:opacity-90 hover:brightness-110 transition-all cursor-pointer shadow-md"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
