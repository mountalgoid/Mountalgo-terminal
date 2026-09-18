import React, { useState } from 'react';
import {
  DrawingLayer,
  createNewLayer,
  moveLayerZIndex,
} from '../utils/drawingLayerManager';
import { DrawingItem, DrawingToolType } from '../utils/drawingTools';
import { getToolDef } from '../utils/drawingToolbarGroups';
import {
  Layers,
  X,
  Plus,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronUp,
  ChevronDown,
  Trash2,
  Edit2,
  Check,
  Bookmark,
  ArrowUpToLine,
  ArrowDownToLine,
  ChevronRight,
  FolderOpen,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { hexToRgba, getThemeModalGradient, getThemeCardBorder } from '../utils/themeGradient';

interface DrawingLayerManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  layers: DrawingLayer[];
  setLayers: React.Dispatch<React.SetStateAction<DrawingLayer[]>>;
  activeLayerId: string;
  setActiveLayerId: (id: string) => void;
  drawings: DrawingItem[];
  setDrawings: React.Dispatch<React.SetStateAction<DrawingItem[]>>;
  selectedDrawingId?: string | null;
  setSelectedDrawingId?: (id: string | null) => void;
}

const LAYER_ACCENT_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
];

export default function DrawingLayerManagerModal({
  isOpen,
  onClose,
  layers,
  setLayers,
  activeLayerId,
  setActiveLayerId,
  drawings,
  setDrawings,
  selectedDrawingId,
  setSelectedDrawingId,
}: DrawingLayerManagerModalProps) {
  const { palette, isLight } = useTheme();

  // New layer input state
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newLayerName, setNewLayerName] = useState<string>('');
  const [newLayerColor, setNewLayerColor] = useState<string>('#3b82f6');

  // Inline edit state
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');

  // Expanded layer accordion state
  const [expandedLayerIds, setExpandedLayerIds] = useState<Record<string, boolean>>({
    layer_default: true,
  });

  if (!isOpen) return null;

  // Sorted layers by Z-Index descending (top-most layer on top of UI)
  const sortedLayers = [...layers].sort((a, b) => b.zIndex - a.zIndex);

  const toggleExpandLayer = (id: string) => {
    setExpandedLayerIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateLayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLayerName.trim()) return;

    const newLayer = createNewLayer(newLayerName, newLayerColor, layers.length);
    const updated = [...layers, newLayer];
    setLayers(updated);
    setActiveLayerId(newLayer.id);

    setNewLayerName('');
    setShowAddForm(false);
  };

  const handleToggleLayerVisibility = (layerId: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l))
    );
  };

  const handleToggleLayerLock = (layerId: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, locked: !l.locked } : l))
    );
  };

  const handleMoveZIndex = (layerId: string, direction: 'up' | 'down' | 'top' | 'bottom') => {
    const updated = moveLayerZIndex(layers, layerId, direction);
    setLayers(updated);
  };

  const handleStartEditing = (layer: DrawingLayer) => {
    setEditingLayerId(layer.id);
    setEditingName(layer.name);
  };

  const handleSaveEditing = (layerId: string) => {
    if (editingName.trim()) {
      setLayers((prev) =>
        prev.map((l) => (l.id === layerId ? { ...l, name: editingName.trim() } : l))
      );
    }
    setEditingLayerId(null);
  };

  const handleDeleteLayer = (layerId: string) => {
    const layer = layers.find((l) => l.id === layerId);
    if (!layer) return;
    if (layer.isDefault || layers.length <= 1) {
      alert('Layer utama tidak dapat dihapus.');
      return;
    }

    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menghapus layer "${layer.name}"?\nSemua gambar di dalam layer ini akan dipindahkan ke Main Drawing Layer.`
    );
    if (!confirmDelete) return;

    // Move drawings to layer_default
    setDrawings((prev) =>
      prev.map((d) => (d.layerId === layerId ? { ...d, layerId: 'layer_default' } : d))
    );

    // Remove layer
    const filtered = layers.filter((l) => l.id !== layerId);
    setLayers(filtered);

    if (activeLayerId === layerId) {
      setActiveLayerId('layer_default');
    }
  };

  // Individual drawing item actions
  const handleToggleDrawingVisibility = (drawingId: string) => {
    setDrawings((prev) =>
      prev.map((d) => (d.id === drawingId ? { ...d, hidden: !d.hidden } : d))
    );
  };

  const handleToggleDrawingLock = (drawingId: string) => {
    setDrawings((prev) =>
      prev.map((d) => (d.id === drawingId ? { ...d, locked: !d.locked } : d))
    );
  };

  const handleMoveDrawingToLayer = (drawingId: string, targetLayerId: string) => {
    setDrawings((prev) =>
      prev.map((d) => (d.id === drawingId ? { ...d, layerId: targetLayerId } : d))
    );
  };

  const handleDeleteDrawing = (drawingId: string) => {
    setDrawings((prev) => prev.filter((d) => d.id !== drawingId));
    if (selectedDrawingId === drawingId && setSelectedDrawingId) {
      setSelectedDrawingId(null);
    }
  };

  return (
    <div className="fixed inset-0 sm:top-[60px] sm:right-4 sm:bottom-4 sm:left-auto z-[125] flex flex-col justify-start pointer-events-none animate-in fade-in duration-200">
      <div
        style={{
          background: getThemeModalGradient(palette, isLight),
          borderColor: getThemeCardBorder(palette, false),
          boxShadow: `0 20px 60px -10px rgba(0,0,0,0.85), 0 0 30px ${hexToRgba(palette.poc || palette.bull, 0.2)}`,
        }}
        className="w-full sm:w-[480px] md:w-[540px] h-full sm:h-[calc(100vh-80px)] pointer-events-auto sm:rounded-2xl border flex flex-col overflow-hidden shadow-2xl backdrop-blur-2xl animate-in zoom-in-95 duration-150 text-[var(--color-text)]"
      >
        {/* Top Accent Gradient Line */}
        <div 
          className="h-[3px] w-full shrink-0"
          style={{
            background: `linear-gradient(90deg, ${palette.bull} 0%, ${palette.poc || '#6366f1'} 50%, ${palette.bear} 100%)`
          }}
        />
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 border-b border-[var(--color-border)] bg-[var(--color-panel-header)]">
          <div className="flex items-center gap-2.5">
            <div
              style={{ backgroundColor: `${palette.bull}20`, color: palette.bull, borderColor: `${palette.bull}50` }}
              className="p-2 rounded-xl border flex items-center justify-center"
            >
              <Layers size={18} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[var(--color-text)] flex items-center gap-2">
                <span>Manajemen Layer Gambar (Drawing Layers)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono font-normal">
                  {layers.length} Layers • {drawings.length} Drawings
                </span>
              </h3>
              <p className="text-xs text-[var(--color-text-muted)]">
                Atur urutan z-index visual, buat grup layer, kunci, atau sembunyikan gambar terpisah dari indikator.
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

        {/* Action Bar: Create New Layer */}
        <div className="px-3 sm:px-5 pt-3 sm:pt-4 pb-2 border-b border-[var(--color-border)] bg-[var(--color-card)] flex flex-col gap-2">
          {!showAddForm ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-[var(--color-text)]">
                <span className="font-semibold text-[var(--color-text)]">Active Layer untuk Drawing Baru:</span>
                <select
                  value={activeLayerId ?? 'layer_default'}
                  onChange={(e) => setActiveLayerId(e.target.value)}
                  className="bg-[var(--color-input-bg)] border border-cyan-500/40 rounded-lg px-3 py-1 text-xs text-cyan-300 font-bold focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  {layers.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} {l.isDefault ? '(Main)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setShowAddForm(true)}
                className="px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>Buat Layer Baru</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreateLayer} className="flex flex-col gap-2.5 p-3 bg-[var(--color-panel)] border border-cyan-500/30 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-yellow-400" />
                  <span>Tambah Drawing Layer Baru</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-xs cursor-pointer"
                >
                  Batal
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={newLayerName ?? ''}
                  onChange={(e) => setNewLayerName(e.target.value)}
                  placeholder="Nama Layer (misal: ICT Key Levels)..."
                  className="sm:col-span-2 bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-xs text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-cyan-400"
                  autoFocus
                />

                {/* Color Swatch Picker */}
                <div className="flex items-center gap-1 overflow-x-auto p-1 bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg">
                  {LAYER_ACCENT_COLORS.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setNewLayerColor(c)}
                      className={`w-5 h-5 rounded-full border transition-transform cursor-pointer shrink-0 ${
                        newLayerColor === c ? 'scale-110 border-white shadow-sm' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="submit"
                  disabled={!newLayerName.trim()}
                  className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition-all cursor-pointer flex items-center gap-1"
                >
                  <Check size={14} />
                  <span>Simpan Layer</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Layer List Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-3 max-h-[520px]">
          {sortedLayers.map((layer, index) => {
            const isTopLayer = index === 0;
            const isBottomLayer = index === sortedLayers.length - 1;

            // Filter drawings belonging to this layer
            const layerDrawings = drawings.filter(
              (d) => (d.layerId || 'layer_default') === layer.id
            );
            const isExpanded = !!expandedLayerIds[layer.id];
            const isActive = activeLayerId === layer.id;

            return (
              <div
                key={layer.id}
                style={{
                  borderColor: isActive ? `${layer.color}80` : 'var(--color-border)',
                  backgroundColor: isActive ? 'var(--color-card)' : 'var(--color-bg)',
                }}
                className="rounded-xl border flex flex-col overflow-hidden transition-all shadow-sm"
              >
                {/* Layer Header Row */}
                <div className="p-3 flex items-center justify-between gap-3 bg-[var(--color-panel-header)] border-b border-[var(--color-border)]">
                  {/* Left: Expand Accordion & Color Accent & Layer Name */}
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <button
                      onClick={() => toggleExpandLayer(layer.id)}
                      className="p-1 rounded-lg hover:bg-[var(--color-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
                      title={isExpanded ? 'Sembunyikan Item Gambar' : 'Tampilkan Item Gambar'}
                    >
                      <ChevronRight
                        size={16}
                        className={`transition-transform duration-200 ${isExpanded ? 'rotate-90 text-cyan-400' : ''}`}
                      />
                    </button>

                    {/* Layer Accent Color Badge */}
                    <div
                      className="w-3.5 h-3.5 rounded-full border border-white/30 shrink-0"
                      style={{ backgroundColor: layer.color }}
                      title={`Aksen Layer: ${layer.name}`}
                    />

                    {/* Layer Name / Inline Edit */}
                    {editingLayerId === layer.id ? (
                      <div className="flex items-center gap-1 flex-1">
                        <input
                          type="text"
                          value={editingName ?? ''}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="bg-[var(--color-input-bg)] border border-cyan-400 rounded px-2 py-0.5 text-xs text-[var(--color-text)] focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEditing(layer.id)}
                          className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded"
                        >
                          <Check size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-xs font-bold text-[var(--color-text)] truncate">{layer.name}</span>
                        {layer.isDefault && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-mono">
                            Main
                          </span>
                        )}
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-panel)] text-[var(--color-text-muted)] font-mono border border-[var(--color-border)]">
                          {layerDrawings.length} items
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Middle: Active Layer Selector Radio */}
                  <button
                    onClick={() => setActiveLayerId(layer.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                        : 'bg-[var(--color-panel)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)]'
                    }`}
                  >
                    {isActive ? 'Active Target ✓' : 'Set Active'}
                  </button>

                  {/* Right: Z-Index Reorder, Visibility, Lock, Delete Controls */}
                  <div className="flex items-center gap-1 bg-[var(--color-card)] p-1 rounded-lg border border-[var(--color-border)]">
                    {/* Move Z-Index Top */}
                    <button
                      onClick={() => handleMoveZIndex(layer.id, 'top')}
                      disabled={isTopLayer}
                      title="Bawa Layer Ke Paling Atas (Front Z-Index)"
                      className="p-1 rounded text-[var(--color-text-muted)] hover:text-cyan-300 hover:bg-[var(--color-hover)] disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                    >
                      <ArrowUpToLine size={13} />
                    </button>

                    {/* Move Up */}
                    <button
                      onClick={() => handleMoveZIndex(layer.id, 'up')}
                      disabled={isTopLayer}
                      title="Naikkan Z-Index Layer (Bring Forward)"
                      className="p-1 rounded text-[var(--color-text-muted)] hover:text-cyan-300 hover:bg-[var(--color-hover)] disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                    >
                      <ChevronUp size={13} />
                    </button>

                    {/* Move Down */}
                    <button
                      onClick={() => handleMoveZIndex(layer.id, 'down')}
                      disabled={isBottomLayer}
                      title="Turunkan Z-Index Layer (Send Backward)"
                      className="p-1 rounded text-[var(--color-text-muted)] hover:text-cyan-300 hover:bg-[var(--color-hover)] disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                    >
                      <ChevronDown size={13} />
                    </button>

                    {/* Move Bottom */}
                    <button
                      onClick={() => handleMoveZIndex(layer.id, 'bottom')}
                      disabled={isBottomLayer}
                      title="Kirim Layer Ke Paling Bawah (Back Z-Index)"
                      className="p-1 rounded text-[var(--color-text-muted)] hover:text-cyan-300 hover:bg-[var(--color-hover)] disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                    >
                      <ArrowDownToLine size={13} />
                    </button>

                    <div className="w-[1px] h-4 bg-[var(--color-border)] mx-0.5" />

                    {/* Toggle Layer Visibility */}
                    <button
                      onClick={() => handleToggleLayerVisibility(layer.id)}
                      title={layer.visible ? 'Sembunyikan Semua Gambar di Layer Ini' : 'Tampilkan Semua Gambar di Layer Ini'}
                      className={`p-1.5 rounded transition-colors cursor-pointer ${
                        layer.visible
                          ? 'text-cyan-400 hover:bg-cyan-500/10'
                          : 'text-red-400 bg-red-500/10 hover:bg-red-500/20'
                      }`}
                    >
                      {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>

                    {/* Toggle Layer Lock */}
                    <button
                      onClick={() => handleToggleLayerLock(layer.id)}
                      title={layer.locked ? 'Buka Kunci Layer' : 'Kunci Layer dari Perubahan/Klik'}
                      className={`p-1.5 rounded transition-colors cursor-pointer ${
                        layer.locked
                          ? 'text-amber-400 bg-amber-500/15 hover:bg-amber-500/25'
                          : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)]'
                      }`}
                    >
                      {layer.locked ? <Lock size={14} /> : <Unlock size={14} />}
                    </button>

                    {/* Edit Layer Name */}
                    <button
                      onClick={() => handleStartEditing(layer)}
                      title="Ubah Nama Layer"
                      className="p-1.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)] transition-colors cursor-pointer"
                    >
                      <Edit2 size={13} />
                    </button>

                    {/* Delete Custom Layer */}
                    {!layer.isDefault && (
                      <button
                        onClick={() => handleDeleteLayer(layer.id)}
                        title="Hapus Layer Ini"
                        className="p-1.5 rounded text-rose-400 hover:text-red-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Drawings List inside Layer */}
                {isExpanded && (
                  <div className="p-3 bg-[var(--color-card)] divide-y divide-[var(--color-border)] space-y-2">
                    {layerDrawings.length === 0 ? (
                      <div className="py-4 text-center text-xs text-[var(--color-text-muted)] italic">
                        Belum ada gambar di layer ini. Buat gambar baru atau pindahkan gambar ke sini.
                      </div>
                    ) : (
                      layerDrawings.map((drawing) => {
                        const toolDef = getToolDef(drawing.type as DrawingToolType);
                        const ToolIcon = toolDef?.icon || Bookmark;

                        return (
                          <div
                            key={drawing.id}
                            className={`pt-2 first:pt-0 flex items-center justify-between gap-2 text-xs text-[var(--color-text)] hover:bg-[var(--color-hover)] p-1.5 rounded-lg transition-colors ${
                              drawing.hidden ? 'opacity-50' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {/* Tool Icon */}
                              <div
                                style={{ backgroundColor: `${drawing.color}20`, color: drawing.color }}
                                className="p-1 rounded border border-[var(--color-border)]/30 shrink-0"
                              >
                                <ToolIcon size={13} />
                              </div>

                              <span className="font-semibold text-[var(--color-text)] truncate">
                                {drawing.label || drawing.text || drawing.type.toUpperCase()}
                              </span>

                              {drawing.points[0]?.price && (
                                <span className="text-[10px] text-[var(--color-text-muted)] font-mono hidden sm:inline">
                                  ${drawing.points[0].price.toFixed(2)}
                                </span>
                              )}
                            </div>

                            {/* Item Actions */}
                            <div className="flex items-center gap-1.5">
                              {/* Move to another Layer Select */}
                              <select
                                value={drawing.layerId || 'layer_default'}
                                onChange={(e) => handleMoveDrawingToLayer(drawing.id, e.target.value)}
                                title="Pindahkan gambar ini ke layer lain"
                                className="bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded px-2 py-0.5 text-[10px] text-[var(--color-text)] focus:outline-none focus:border-cyan-400 cursor-pointer"
                              >
                                {layers.map((l) => (
                                  <option key={l.id} value={l.id}>
                                    Pindah Ke: {l.name}
                                  </option>
                                ))}
                              </select>

                              {/* Item Visibility */}
                              <button
                                onClick={() => handleToggleDrawingVisibility(drawing.id)}
                                title={drawing.hidden ? 'Tampilkan Gambar Ini' : 'Sembunyikan Gambar Ini'}
                                className={`p-1 rounded transition-colors cursor-pointer ${
                                  drawing.hidden ? 'text-red-400 hover:bg-red-500/10' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)]'
                                }`}
                              >
                                {drawing.hidden ? <EyeOff size={13} /> : <Eye size={13} />}
                              </button>

                              {/* Item Lock */}
                              <button
                                onClick={() => handleToggleDrawingLock(drawing.id)}
                                title={drawing.locked ? 'Buka Kunci Gambar' : 'Kunci Gambar Ini'}
                                className={`p-1 rounded transition-colors cursor-pointer ${
                                  drawing.locked ? 'text-amber-400 hover:bg-amber-500/15' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)]'
                                }`}
                              >
                                {drawing.locked ? <Lock size={13} /> : <Unlock size={13} />}
                              </button>

                              {/* Delete Item */}
                              <button
                                onClick={() => handleDeleteDrawing(drawing.id)}
                                title="Hapus Gambar Ini"
                                className="p-1 rounded text-rose-400 hover:text-red-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[var(--color-border)] bg-[var(--color-panel-header)] flex items-center justify-between text-xs text-[var(--color-text-muted)]">
          <span>Urutan layer di atas dirender di atas (*higher z-index*).</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[var(--color-card)] hover:bg-[var(--color-hover)] text-[var(--color-text)] border border-[var(--color-border)] font-semibold transition-colors cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
