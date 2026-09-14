import React, { useState, useEffect } from 'react';
import {
  DrawingTemplate,
  getStoredDrawingTemplates,
  saveDrawingTemplates,
  createTemplateFromDrawing,
  applyTemplateToDrawing,
} from '../utils/drawingTemplateManager';
import { DrawingItem, DrawingToolType } from '../utils/drawingTools';
import { getToolDef } from '../utils/drawingToolbarGroups';
import {
  FolderOpen,
  X,
  Search,
  Plus,
  Trash2,
  Check,
  Sparkles,
  Bookmark,
  Layers,
  TrendingUp,
  Compass,
  Square,
  Sliders,
  Zap,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface DrawingTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDrawing?: DrawingItem | null;
  onUpdateDrawing?: (updated: Partial<DrawingItem>) => void;
  onSelectToolWithTemplate?: (tool: DrawingToolType, template: DrawingTemplate) => void;
}

export default function DrawingTemplatesModal({
  isOpen,
  onClose,
  selectedDrawing,
  onUpdateDrawing,
  onSelectToolWithTemplate,
}: DrawingTemplatesModalProps) {
  const { palette } = useTheme();
  const [templates, setTemplates] = useState<DrawingTemplate[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // New template form state
  const [showSaveForm, setShowSaveForm] = useState<boolean>(false);
  const [newTmplName, setNewTmplName] = useState<string>('');
  const [newTmplCat, setNewTmplCat] = useState<DrawingTemplate['category']>('Custom');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTemplates(getStoredDrawingTemplates());
      setShowSaveForm(false);
      setNewTmplName('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleSaveCurrentAsTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDrawing || !newTmplName.trim()) return;

    const newTmpl = createTemplateFromDrawing(newTmplName, selectedDrawing, newTmplCat);
    const updated = [...templates, newTmpl];
    setTemplates(updated);
    saveDrawingTemplates(updated);

    showToast(`Template "${newTmpl.name}" berhasil disimpan!`);
    setShowSaveForm(false);
    setNewTmplName('');
  };

  const handleDeleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = templates.filter((t) => t.id !== id);
    setTemplates(updated);
    saveDrawingTemplates(updated);
    showToast('Template kustom berhasil dihapus.');
  };

  const handleApplyToSelected = (tmpl: DrawingTemplate) => {
    if (selectedDrawing && onUpdateDrawing) {
      const updated = applyTemplateToDrawing(selectedDrawing, tmpl);
      onUpdateDrawing(updated);
      showToast(`Preset "${tmpl.name}" diterapkan ke gambar terpilih!`);
    } else if (onSelectToolWithTemplate && tmpl.toolType !== 'any') {
      onSelectToolWithTemplate(tmpl.toolType as DrawingToolType, tmpl);
      showToast(`Alat ${tmpl.toolType} diaktifkan dengan preset "${tmpl.name}"!`);
      onClose();
    }
  };

  const categories = ['Semua', 'Fibonacci', 'Zones & Blocks', 'Trend & Rays', 'Position Risk', 'Custom'];

  const filteredTemplates = templates.filter((t) => {
    const matchesCat = activeCategory === 'Semua' || t.category === activeCategory;
    const matchesSearch =
      !searchQuery ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.toolType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="fixed inset-0 sm:top-[60px] sm:right-4 sm:bottom-4 sm:left-auto z-[120] flex flex-col justify-start pointer-events-none animate-in fade-in duration-200">
      <div
        style={{
          borderColor: `${palette.bull}50`,
          boxShadow: `0 20px 60px -10px rgba(0,0,0,0.8), 0 0 0 1px ${palette.bull}30`,
        }}
        className="w-full sm:w-[480px] md:w-[540px] h-full sm:h-[calc(100vh-80px)] pointer-events-auto sm:rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 text-[var(--color-text)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 border-b border-[var(--color-border)] bg-[var(--color-panel-header)]">
          <div className="flex items-center gap-2.5">
            <div
              style={{ backgroundColor: `${palette.bull}20`, color: palette.bull, borderColor: `${palette.bull}50` }}
              className="p-2 rounded-xl border flex items-center justify-center"
            >
              <FolderOpen size={18} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[var(--color-text)] flex items-center gap-2">
                <span>Template Gambar & Style Presets</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono font-normal">
                  {templates.length} Saved
                </span>
              </h3>
              <p className="text-xs text-[var(--color-text-muted)]">
                Pilih atau simpan preset gaya garis, zona, Fibonacci, dan risk reward
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Toast Floating Alert */}
        {toastMsg && (
          <div className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 px-4 py-2 text-xs text-center font-semibold animate-in fade-in duration-150 flex items-center justify-center gap-2">
            <Check size={14} />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Action Banner: Save Selected Drawing as Template */}
        {selectedDrawing && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-[var(--color-card)] border border-cyan-500/30 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                <Sparkles size={14} className="text-amber-400" />
                <span>Gambar Terpilih: {selectedDrawing.type.toUpperCase()} ({selectedDrawing.color})</span>
              </div>
              {!showSaveForm && (
                <button
                  onClick={() => setShowSaveForm(true)}
                  className="px-3 py-1 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <Plus size={13} />
                  <span>Simpan Gaya Ini Jadi Template Baru</span>
                </button>
              )}
            </div>

            {showSaveForm && (
              <form onSubmit={handleSaveCurrentAsTemplate} className="flex flex-col gap-2 pt-2 border-t border-[var(--color-border)]">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newTmplName ?? ''}
                    onChange={(e) => setNewTmplName(e.target.value)}
                    placeholder="Nama Template (misal: ICT Order Block Red)..."
                    className="sm:col-span-2 bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-lg px-3 py-1.5 text-xs text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-cyan-400"
                    autoFocus
                  />
                  <select
                    value={newTmplCat ?? 'Custom'}
                    onChange={(e) => setNewTmplCat(e.target.value as DrawingTemplate['category'])}
                    className="bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--color-text)] focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Custom">Kategori: Custom</option>
                    <option value="Fibonacci">Fibonacci</option>
                    <option value="Zones & Blocks">Zones & Blocks</option>
                    <option value="Trend & Rays">Trend & Rays</option>
                    <option value="Position Risk">Position Risk</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSaveForm(false)}
                    className="px-3 py-1 rounded-lg bg-[var(--color-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-xs transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={!newTmplName.trim()}
                    className="px-4 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Check size={13} />
                    <span>Simpan Template</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Search & Category Filter Bar */}
        <div className="px-5 pt-4 pb-2 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="text"
                value={searchQuery ?? ''}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari template kustom, Fibonacci, Order Block..."
                className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-xl pl-9 pr-3 py-2 text-xs text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={activeCategory === cat ? { backgroundColor: `${palette.bull}25`, color: palette.bull, borderColor: `${palette.bull}70` } : {}}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                  activeCategory === cat
                    ? 'shadow-sm'
                    : 'bg-[var(--color-card)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-border)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Template Cards Grid */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[460px]">
          {filteredTemplates.length === 0 ? (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-center text-[var(--color-text-muted)] gap-2">
              <FolderOpen size={32} className="opacity-40" />
              <p className="text-xs">Tidak ada template yang cocok dengan pencarian.</p>
            </div>
          ) : (
            filteredTemplates.map((tmpl) => {
              const toolDef = getToolDef(tmpl.toolType as DrawingToolType);
              const ToolIcon = toolDef?.icon || Bookmark;

              return (
                <div
                  key={tmpl.id}
                  onClick={() => handleApplyToSelected(tmpl)}
                  className="group relative bg-[var(--color-card)] border border-[var(--color-border)] hover:border-cyan-500/60 rounded-xl p-3 flex flex-col justify-between gap-3 transition-all cursor-pointer hover:bg-[var(--color-hover)] shadow-sm hover:shadow-cyan-500/10"
                >
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* Tool Icon & Color Badge */}
                        <div
                          style={{ backgroundColor: `${tmpl.style.color || '#3b82f6'}20`, color: tmpl.style.color || '#3b82f6', borderColor: `${tmpl.style.color || '#3b82f6'}60` }}
                          className="p-1.5 rounded-lg border flex items-center justify-center"
                        >
                          <ToolIcon size={14} />
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-[var(--color-text)] group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                            <span>{tmpl.name}</span>
                            {tmpl.isBuiltIn && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                                System
                              </span>
                            )}
                          </h4>
                          <span className="text-[10px] text-[var(--color-text-muted)] font-mono uppercase">
                            {tmpl.toolType} • {tmpl.category}
                          </span>
                        </div>
                      </div>

                      {/* Color Dot Preview */}
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm shrink-0"
                        style={{ backgroundColor: tmpl.style.color || '#3b82f6' }}
                        title={`Warna: ${tmpl.style.color}`}
                      />
                    </div>

                    <p className="text-[11px] text-[var(--color-text-muted)] line-clamp-2 leading-relaxed">
                      {tmpl.description}
                    </p>

                    {/* Special Feature Pills */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {tmpl.style.midline && (
                        <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/30">
                          50% Midline
                        </span>
                      )}
                      {tmpl.style.showAngles && (
                        <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-cyan-400/10 text-cyan-300 border border-cyan-400/30">
                          Angle HUD °
                        </span>
                      )}
                      {tmpl.style.fibLevels && (
                        <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-emerald-400/10 text-emerald-300 border border-emerald-400/30">
                          {tmpl.style.fibLevels.filter((l) => l.enabled).length} Fib Levels
                        </span>
                      )}
                      {tmpl.style.lineStyle && tmpl.style.lineStyle !== 'solid' && (
                        <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-slate-400/10 text-slate-300 border border-slate-400/30 capitalize">
                          {tmpl.style.lineStyle} Line
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar inside Card */}
                  <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
                    <span className="text-[10px] text-cyan-400 font-semibold group-hover:underline flex items-center gap-1">
                      <span>{selectedDrawing ? 'Terapkan Ke Gambar' : 'Gunakan Preset Alat'}</span>
                      <Zap size={11} />
                    </span>

                    {!tmpl.isBuiltIn && (
                      <button
                        onClick={(e) => handleDeleteTemplate(tmpl.id, e)}
                        title="Hapus Template Kustom"
                        className="p-1 rounded text-[var(--color-text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[var(--color-border)] bg-[var(--color-panel-header)] flex items-center justify-between text-xs text-[var(--color-text-muted)]">
          <span>Preset tersimpan secara lokal dan dapat digunakan kapan saja.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[var(--color-hover)] text-[var(--color-text)] font-semibold transition-colors cursor-pointer border border-[var(--color-border)]"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
