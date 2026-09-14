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
  const { theme, palette } = useTheme();
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
    <div className="fixed inset-0 z-modal-ultimate flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-3 md:p-4 animate-in fade-in duration-150 select-none">
      <div 
        className="bg-[var(--color-panel)] rounded-xl sm:rounded-xl w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        style={{ border: `1px solid ${palette.bull}60` }}
      >
        {/* Modal Header */}
        <div className="px-3 sm:px-5 py-2.5 sm:py-3.5 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-panel)]">
          <div className="flex items-center gap-2.5">
            <MountAlgoLogo size="sm" className="w-8 h-8" />
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[var(--color-text)] tracking-wide flex items-center gap-2">
                Workspace Presets <span>𝙈𝙤𝙪𝙣𝙩𝘼𝙡𝙜𝙤</span>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold" style={{ backgroundColor: `${palette.bull}20`, color: palette.bull }}>
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
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-1 rounded-md hover:bg-[var(--color-panel)] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Categories Bar & Action button */}
        <div className="px-3 sm:px-5 py-2 sm:py-2.5 bg-[var(--color-bg)]/60 border-b border-[var(--color-border)]/60 flex items-center justify-between gap-1.5 sm:gap-2 overflow-x-auto hide-scrollbar">
          <div className="flex items-center gap-1.5 shrink-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={selectedCategory === cat ? { backgroundColor: palette.bull, color: '#000000' } : {}}
                className={`text-[11px] sm:text-xs px-2.5 sm:px-3 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'shadow-md'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-panel)]'
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
              style={{ borderColor: palette.bull, color: palette.bull }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-bold hover:bg-[var(--color-bull)]/10 transition-colors cursor-pointer"
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
              className="p-4 rounded-xl border border-[var(--color-bull)]/40 bg-[var(--color-bg)]/90 space-y-3 animate-in fade-in zoom-in-95 duration-150"
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
                  style={{ backgroundColor: palette.bull, color: '#000000' }}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-md flex items-center gap-1.5"
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
                  style={isActive ? { borderColor: palette.bull, boxShadow: `0 0 16px ${palette.bull}25` } : {}}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative group flex flex-col justify-between ${
                    isActive
                      ? 'bg-[var(--color-panel)]'
                      : 'bg-[var(--color-panel)] border-[var(--color-border)] hover:border-[var(--color-bull)]/60 hover:bg-[var(--color-bg)]/40'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          style={{
                            backgroundColor: isActive ? palette.bull : `${palette.bull}15`,
                            color: isActive ? '#000000' : palette.bull,
                          }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                        >
                          <Icon size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-xs text-[var(--color-text)]">
                              {preset.name}
                            </h4>
                            <span 
                              style={{ backgroundColor: `${palette.bull}15`, color: palette.bull }}
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
                            style={{ backgroundColor: palette.bull, color: '#000000' }}
                            className="p-1 rounded-full text-xs font-bold"
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
                          style={{ borderColor: palette.bull }}
                          className="w-6 h-4 rounded-sm border bg-[var(--color-bull)]/20 flex items-center justify-center text-[7px] font-mono text-[var(--color-text)]"
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
        <div className="px-3 sm:px-5 py-2.5 sm:py-3 border-t border-[var(--color-border)] bg-[var(--color-panel)] flex items-center justify-between text-[11px] sm:text-xs text-[var(--color-text-muted)]">
          <span className="hidden sm:inline">Preset dapat diubah kapan saja dengan animasi otomatis.</span>
          <span className="sm:hidden">Preset tersimpan otomatis.</span>
          <button
            onClick={onClose}
            style={{ backgroundColor: palette.bull, color: '#000000' }}
            className="px-4 py-1.5 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-md"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
