import React, { useState, useRef, useEffect } from 'react';
import {
  DrawingItem,
  DrawingToolType,
  DRAWING_TOOLS,
} from '../utils/drawingTools';
import {
  Settings,
  Trash2,
  Copy,
  Lock,
  Unlock,
  Palette,
  Minus,
  Maximize2,
  X,
  Type,
  TrendingUp,
  Square,
  Circle,
  Triangle as TriangleIcon,
  Ruler,
  Compass,
  DollarSign,
  MessageSquare,
  Sliders,
  Paintbrush,
  Highlighter,
  GitCommit,
  Activity,
  Layers,
  ArrowRight,
  FolderOpen,
  GripVertical
} from 'lucide-react';

interface SelectedDrawingQuickBarProps {
  selectedDrawing: DrawingItem | null;
  onUpdateDrawing: (updated: Partial<DrawingItem>) => void;
  onOpenSettings: () => void;
  onOpenTemplates?: () => void;
  onOpenLayers?: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onDeselect: () => void;
  currentPalette: {
    bull: string;
    bear: string;
    poc: string;
    vahVal: string;
  };
  coords?: { x: number; y: number } | null;
}

const PRESET_COLORS = [
  '#38bdf8', // Cyan
  '#10b981', // Emerald / Bull
  '#f43f5e', // Rose / Bear
  '#a855f7', // Purple
  '#f59e0b', // Amber / Gold
  '#3b82f6', // Blue
  '#ec4899', // Pink
  '#ffffff', // White
  '#64748b', // Slate
];

const getToolIcon = (type: DrawingToolType) => {
  switch (type) {
    case 'trendline':
    case 'ray':
    case 'extended_line':
    case 'arrow':
      return <TrendingUp className="w-3.5 h-3.5" />;
    case 'horizontal':
    case 'horizontal_ray':
      return <Minus className="w-3.5 h-3.5" />;
    case 'vertical':
      return <Minus className="w-3.5 h-3.5 rotate-90" />;
    case 'cross_line':
      return <Minus className="w-3.5 h-3.5" />;
    case 'rectangle':
      return <Square className="w-3.5 h-3.5" />;
    case 'ellipse':
      return <Circle className="w-3.5 h-3.5" />;
    case 'triangle':
      return <TriangleIcon className="w-3.5 h-3.5" />;
    case 'ruler':
      return <Ruler className="w-3.5 h-3.5" />;
    case 'fibonacci':
    case 'fib_fan':
    case 'fib_extension':
    case 'pitchfork':
      return <Compass className="w-3.5 h-3.5" />;
    case 'position_long':
    case 'position_short':
      return <Sliders className="w-3.5 h-3.5" />;
    case 'text':
    case 'callout':
      return <MessageSquare className="w-3.5 h-3.5" />;
    case 'price_label':
      return <DollarSign className="w-3.5 h-3.5" />;
    case 'brush':
      return <Paintbrush className="w-3.5 h-3.5" />;
    case 'highlighter':
      return <Highlighter className="w-3.5 h-3.5" />;
    case 'polyline':
      return <GitCommit className="w-3.5 h-3.5" />;
    case 'head_and_shoulders':
    case 'elliott_wave':
      return <Activity className="w-3.5 h-3.5" />;
    case 'parallel_channel':
      return <Layers className="w-3.5 h-3.5" />;
    default:
      return <Palette className="w-3.5 h-3.5" />;
  }
};

const getToolLabel = (type: DrawingToolType) => {
  const tool = DRAWING_TOOLS.find((t) => t.id === type);
  return tool ? tool.label : type;
};

export default function SelectedDrawingQuickBar({
  selectedDrawing,
  onUpdateDrawing,
  onOpenSettings,
  onOpenTemplates,
  onOpenLayers,
  onDuplicate,
  onDelete,
  onDeselect,
  currentPalette,
  coords,
}: SelectedDrawingQuickBarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showWidthMenu, setShowWidthMenu] = useState(false);
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [showFillMenu, setShowFillMenu] = useState(false);
  const [showTextPopover, setShowTextPopover] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const widthMenuRef = useRef<HTMLDivElement>(null);
  const styleMenuRef = useRef<HTMLDivElement>(null);
  const fillMenuRef = useRef<HTMLDivElement>(null);
  const textPopoverRef = useRef<HTMLDivElement>(null);

  // Drag offset state for floating property bar
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isBarDragging, setIsBarDragging] = useState(false);
  const barDragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number } | null>(null);

  const handleBarDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if ('touches' in e && e.cancelable) e.preventDefault();
    setIsBarDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    barDragStartRef.current = {
      mouseX: clientX,
      mouseY: clientY,
      startX: dragOffset.x,
      startY: dragOffset.y,
    };
  };

  const dragRafRef = useRef<number | null>(null);

  useEffect(() => {
    const handleBarMove = (e: MouseEvent | TouchEvent) => {
      if (!isBarDragging || !barDragStartRef.current) return;
      if ('touches' in e && e.cancelable) e.preventDefault();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const dx = clientX - barDragStartRef.current.mouseX;
      const dy = clientY - barDragStartRef.current.mouseY;

      if (dragRafRef.current === null) {
        dragRafRef.current = requestAnimationFrame(() => {
          dragRafRef.current = null;
          if (barDragStartRef.current) {
            setDragOffset({
              x: barDragStartRef.current.startX + dx,
              y: barDragStartRef.current.startY + dy,
            });
          }
        });
      }
    };

    const handleBarEnd = () => {
      if (dragRafRef.current !== null) {
        cancelAnimationFrame(dragRafRef.current);
        dragRafRef.current = null;
      }
      setIsBarDragging(false);
      barDragStartRef.current = null;
    };

    if (isBarDragging) {
      window.addEventListener('mousemove', handleBarMove, { passive: false });
      window.addEventListener('mouseup', handleBarEnd);
      window.addEventListener('touchmove', handleBarMove, { passive: false });
      window.addEventListener('touchend', handleBarEnd);
    }
    return () => {
      if (dragRafRef.current !== null) {
        cancelAnimationFrame(dragRafRef.current);
        dragRafRef.current = null;
      }
      window.removeEventListener('mousemove', handleBarMove);
      window.removeEventListener('mouseup', handleBarEnd);
      window.removeEventListener('touchmove', handleBarMove);
      window.removeEventListener('touchend', handleBarEnd);
    };
  }, [isBarDragging]);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(e.target as Node)
      ) {
        setShowColorPicker(false);
      }
      if (
        widthMenuRef.current &&
        !widthMenuRef.current.contains(e.target as Node)
      ) {
        setShowWidthMenu(false);
      }
      if (
        styleMenuRef.current &&
        !styleMenuRef.current.contains(e.target as Node)
      ) {
        setShowStyleMenu(false);
      }
      if (
        fillMenuRef.current &&
        !fillMenuRef.current.contains(e.target as Node)
      ) {
        setShowFillMenu(false);
      }
      if (
        textPopoverRef.current &&
        !textPopoverRef.current.contains(e.target as Node)
      ) {
        setShowTextPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!selectedDrawing) return null;

  const currentColor = selectedDrawing.color || currentPalette.bull;
  const currentLineWidth = selectedDrawing.lineWidth || 2;
  const currentLineStyle = selectedDrawing.lineStyle || 'solid';
  const currentFillOpacity = selectedDrawing.fillOpacity !== undefined ? selectedDrawing.fillOpacity : 0.2;
  const isLocked = Boolean(selectedDrawing.locked);

  const hasFill = [
    'rectangle',
    'ellipse',
    'triangle',
    'parallel_channel',
    'pitchfork',
    'position_long',
    'position_short',
    'fibonacci',
    'fib_fan',
    'fib_extension',
    'head_and_shoulders',
    'ruler',
  ].includes(selectedDrawing.type);

  const supportsExtendRight = ['rectangle', 'trendline', 'parallel_channel'].includes(selectedDrawing.type);
  const supportsMidline = ['rectangle', 'parallel_channel'].includes(selectedDrawing.type);

  const isPositionTool =
    selectedDrawing.type === 'position_long' ||
    selectedDrawing.type === 'position_short';

  const activePresetColors = currentPalette
    ? Array.from(new Set([
        currentPalette.bull,
        currentPalette.bear,
        currentPalette.poc,
        currentPalette.vahVal,
        '#38bdf8',
        '#a855f7',
        '#f59e0b',
        '#ffffff',
        '#64748b'
      ]))
    : PRESET_COLORS;

  // Detect mobile for layout adaptation
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  return (
    <div
      style={isMobile ? {
        bottom: '12px',
        left: '50%',
        transform: `translate(calc(-50% + ${dragOffset.x}px), ${dragOffset.y}px)`,
        top: 'auto',
      } : {
        top: coords ? `${Math.max(12, coords.y - 48 + dragOffset.y)}px` : `${16 + dragOffset.y}px`,
        left: coords ? `${Math.max(12, coords.x - 120 + dragOffset.x)}px` : '50%',
        transform: coords ? 'none' : `translate(calc(-50% + ${dragOffset.x}px), ${dragOffset.y}px)`,
      }}
      className={`absolute z-[45] flex items-center gap-1 sm:gap-1.5 bg-[var(--color-panel)] border border-[var(--color-border)] text-[var(--color-text)] px-2 sm:px-2.5 py-1.5 sm:py-1.5 rounded-full shadow-2xl backdrop-blur-md select-none text-xs animate-fadeIn font-sans ${isMobile ? 'overflow-x-auto hide-scrollbar max-w-[calc(100vw-24px)]' : ''}`}
    >
      {/* Drag Handle */}
      <div
        onMouseDown={handleBarDragStart}
        onTouchStart={handleBarDragStart}
        className="flex items-center justify-center cursor-grab active:cursor-grabbing text-cyan-500 hover:text-white p-0.5 rounded transition-colors shrink-0"
        title="Geser Quick Bar"
      >
        <GripVertical size={14} />
      </div>

      {/* Tool Type & Icon Badge */}
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--color-bg)] text-cyan-500 font-medium text-[11px] border border-[var(--color-border)] shrink-0">
        {getToolIcon(selectedDrawing.type)}
        <span className="truncate max-w-[90px]">
          {getToolLabel(selectedDrawing.type)}
        </span>
      </div>

      <div className="h-4 w-px bg-[var(--color-border)] mx-0.5" />

      {/* Quick Color Picker */}
      <div className="relative" ref={colorPickerRef}>
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          title="Ganti Warna Garis"
          className="flex items-center gap-1 p-1.5 sm:p-1.5 rounded-md hover:bg-[var(--color-hover)] transition-colors cursor-pointer min-w-[32px] min-h-[32px] sm:min-w-0 sm:min-h-0 justify-center"
        >
          <div
            className="w-4 h-4 rounded-full border border-[var(--color-border)] shadow-inner"
            style={{ backgroundColor: currentColor }}
          />
        </button>

        {showColorPicker && (
          <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-[var(--color-panel)] border border-[var(--color-border)] rounded-xl p-2.5 shadow-2xl z-50 flex flex-col gap-2 w-44 backdrop-blur-md">
            <div className="text-[10px] text-[var(--color-text-muted)] font-mono font-semibold">
              PILIH WARNA
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {activePresetColors.map((col) => (
                <button
                  key={col}
                  onClick={() => {
                    onUpdateDrawing({ color: col });
                    setShowColorPicker(false);
                  }}
                  className="w-6 h-6 rounded-full border border-[var(--color-border)] hover:scale-115 transition-transform cursor-pointer flex items-center justify-center"
                  style={{ backgroundColor: col }}
                >
                  {currentColor === col && (
                    <div className="w-2 h-2 rounded-full bg-black/80" />
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 mt-1 pt-1 border-t border-[var(--color-border)]">
              <span className="text-[10px] text-[var(--color-text-muted)] font-mono">Hex:</span>
              <input
                type="text"
                value={currentColor || '#38bdf8'}
                onChange={(e) => onUpdateDrawing({ color: e.target.value })}
                className="flex-1 bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded px-1.5 py-0.5 text-[10px] font-mono text-[var(--color-text)] focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>
        )}
      </div>

      {/* Line Width Selector (for line and shape tools) */}
      {!isPositionTool && selectedDrawing.type !== 'text' && selectedDrawing.type !== 'callout' && (
        <div className="relative" ref={widthMenuRef}>
          <button
            onClick={() => setShowWidthMenu(!showWidthMenu)}
            title="Ketebalan Garis"
            className="flex items-center justify-center min-w-[32px] min-h-[32px] sm:w-7 sm:h-7 rounded-md hover:bg-[var(--color-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer font-mono font-bold text-[11px]"
          >
            {currentLineWidth}px
          </button>

          {showWidthMenu && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-[var(--color-panel)] border border-[var(--color-border)] rounded-xl p-1.5 shadow-2xl z-50 flex flex-col gap-1 w-28 backdrop-blur-md">
              {[1, 2, 3, 4, 6].map((w) => (
                <button
                  key={w}
                  onClick={() => {
                    onUpdateDrawing({ lineWidth: w });
                    setShowWidthMenu(false);
                  }}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-mono cursor-pointer transition-colors ${
                    currentLineWidth === w
                      ? 'bg-cyan-500/20 text-cyan-500 font-bold'
                      : 'text-[var(--color-text-muted)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text)]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="bg-current rounded-full"
                      style={{ width: `${w * 2 + 10}px`, height: `${w}px` }}
                    />
                    <span>{w}px</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Line Style Selector (Solid, Dashed, Dotted) */}
      {!isPositionTool && selectedDrawing.type !== 'text' && selectedDrawing.type !== 'callout' && (
        <div className="relative" ref={styleMenuRef}>
          <button
            onClick={() => setShowStyleMenu(!showStyleMenu)}
            title="Gaya Garis (Solid/Dashed/Dotted)"
            className="flex items-center justify-center min-w-[32px] min-h-[32px] sm:min-w-0 sm:min-h-0 px-2 py-1 rounded-md hover:bg-[var(--color-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer font-mono text-[10px] uppercase"
          >
            {currentLineStyle}
          </button>

          {showStyleMenu && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-[var(--color-panel)] border border-[var(--color-border)] rounded-xl p-1.5 shadow-2xl z-50 flex flex-col gap-1 w-28 backdrop-blur-md">
              {(['solid', 'dashed', 'dotted'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    onUpdateDrawing({ lineStyle: st });
                    setShowStyleMenu(false);
                  }}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-mono cursor-pointer uppercase transition-colors ${
                    currentLineStyle === st
                      ? 'bg-cyan-500/20 text-cyan-500 font-bold'
                      : 'text-[var(--color-text-muted)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text)]'
                  }`}
                >
                  <span>{st}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Fill Opacity Selector (for filled shapes) */}
      {hasFill && !isPositionTool && (
        <div className="relative" ref={fillMenuRef}>
          <button
            onClick={() => setShowFillMenu(!showFillMenu)}
            title="Transparansi Isi Warna / Fill Opacity"
            className="flex items-center justify-center min-w-[32px] min-h-[32px] sm:min-w-0 sm:min-h-0 px-2 py-1 rounded-md hover:bg-[var(--color-hover)] text-cyan-500 hover:text-[var(--color-text)] transition-colors cursor-pointer font-mono text-[10px]"
          >
            {Math.round(currentFillOpacity * 100)}% Fill
          </button>

          {showFillMenu && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-[var(--color-panel)] border border-[var(--color-border)] rounded-xl p-1.5 shadow-2xl z-50 flex flex-col gap-1 w-28 backdrop-blur-md">
              {[0, 0.1, 0.2, 0.35, 0.5, 0.75].map((op) => (
                <button
                  key={op}
                  onClick={() => {
                    onUpdateDrawing({ fillOpacity: op });
                    setShowFillMenu(false);
                  }}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-mono cursor-pointer transition-colors ${
                    Math.abs(currentFillOpacity - op) < 0.05
                      ? 'bg-cyan-500/20 text-cyan-500 font-bold'
                      : 'text-[var(--color-text-muted)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text)]'
                  }`}
                >
                  <span>{Math.round(op * 100)}%</span>
                  {op === 0 ? <span className="text-[9px] text-gray-500">None</span> : null}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Extend Right Toggle */}
      {supportsExtendRight && (
        <button
          onClick={() => onUpdateDrawing({ extendRight: !selectedDrawing.extendRight })}
          title={selectedDrawing.extendRight ? 'Matikan Perpanjang Kanan' : 'Perpanjang ke Kanan Tak Terhingga'}
          className={`min-w-[32px] min-h-[32px] sm:min-w-0 sm:min-h-0 px-2 py-1 rounded-md text-[10.5px] font-mono flex items-center gap-1 transition-colors cursor-pointer justify-center ${
            selectedDrawing.extendRight
              ? 'bg-cyan-500/20 text-cyan-500 font-bold'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)]'
          }`}
        >
          <ArrowRight className="w-3 h-3" />
          <span>Ext</span>
        </button>
      )}

      {/* Quick 50% Midline Toggle */}
      {supportsMidline && (
        <button
          onClick={() => onUpdateDrawing({ midline: !selectedDrawing.midline })}
          title={selectedDrawing.midline ? 'Sembunyikan Garis Tengah 50%' : 'Tampilkan Garis Tengah 50% Equilibrium'}
          className={`min-w-[32px] min-h-[32px] sm:min-w-0 sm:min-h-0 px-2 py-1 rounded-md text-[10.5px] font-mono flex items-center gap-1 transition-colors cursor-pointer justify-center ${
            selectedDrawing.midline
              ? 'bg-amber-500/20 text-amber-500 font-bold'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)]'
          }`}
        >
          <span>50%</span>
        </button>
      )}

      {/* Quick Text / Label Editor */}
      {(selectedDrawing.type === 'rectangle' ||
        selectedDrawing.type === 'ellipse' ||
        selectedDrawing.type === 'triangle' ||
        selectedDrawing.type === 'text' ||
        selectedDrawing.type === 'callout') && (
        <div className="relative" ref={textPopoverRef}>
          <button
            onClick={() => setShowTextPopover(!showTextPopover)}
            title="Beri Teks & Label"
            className={`min-w-[32px] min-h-[32px] sm:min-w-0 sm:min-h-0 px-2 py-1 rounded-md text-[10.5px] font-mono flex items-center gap-1 transition-colors cursor-pointer justify-center ${
              showTextPopover || selectedDrawing.text
                ? 'bg-cyan-500/20 text-cyan-500 font-bold'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)]'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Teks</span>
          </button>

          {showTextPopover && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-[var(--color-panel)] border border-[var(--color-border)] rounded-xl p-3 shadow-2xl z-50 flex flex-col gap-2.5 w-64 backdrop-blur-md">
              <div className="text-[10px] text-[var(--color-text-muted)] font-mono font-semibold uppercase tracking-wider">
                Edit Teks / Label Box
              </div>
              <textarea
                value={selectedDrawing.text || ''}
                onChange={(e) => onUpdateDrawing({ text: e.target.value })}
                placeholder="Masukkan teks di sini..."
                className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--color-text)] focus:outline-none focus:border-cyan-400 h-16 resize-none font-sans"
              />
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-[var(--color-text-muted)] font-mono">Ukuran:</span>
                  <select
                    value={selectedDrawing.fontSize || 12}
                    onChange={(e) => onUpdateDrawing({ fontSize: parseInt(e.target.value) })}
                    className="bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded px-1 py-0.5 text-[10px] text-[var(--color-text)] font-mono focus:outline-none"
                  >
                    {[10, 11, 12, 13, 14, 16, 18, 20, 24].map((sz) => (
                      <option key={sz} value={sz}>{sz}px</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-[var(--color-text-muted)] font-mono">Warna:</span>
                  <input
                    type="color"
                    value={selectedDrawing.textColor || selectedDrawing.color || '#ffffff'}
                    onChange={(e) => onUpdateDrawing({ textColor: e.target.value })}
                    className="w-4 h-4 bg-transparent border-0 cursor-pointer p-0"
                    title="Pilih warna teks"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lock / Unlock Toggle */}
      <button
        onClick={() => onUpdateDrawing({ locked: !isLocked })}
        title={isLocked ? 'Buka Kunci Gambar' : 'Kunci Posisi Gambar'}
        className={`min-w-[32px] min-h-[32px] sm:min-w-0 sm:min-h-0 p-1.5 rounded-md transition-colors cursor-pointer flex items-center justify-center ${
          isLocked
            ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30'
            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)]'
        }`}
      >
        {isLocked ? (
          <Lock className="w-3.5 h-3.5" />
        ) : (
          <Unlock className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Duplicate / Clone Button */}
      <button
        onClick={onDuplicate}
        title="Duplikat / Kloning Gambar (Ctrl+D)"
        className="min-w-[32px] min-h-[32px] sm:min-w-0 sm:min-h-0 p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)] transition-colors cursor-pointer flex items-center justify-center"
      >
        <Copy className="w-3.5 h-3.5" />
      </button>

      {/* Open Drawing Templates Modal */}
      {onOpenTemplates && (
        <button
          onClick={onOpenTemplates}
          title="Buka Template Gambar & Style Presets"
          className="min-w-[32px] min-h-[32px] sm:min-w-0 sm:min-h-0 p-1.5 rounded-md text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer flex items-center justify-center"
        >
          <FolderOpen className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Open Drawing Layer Manager Modal */}
      {onOpenLayers && (
        <button
          onClick={onOpenLayers}
          title="Buka Manajemen Layer Gambar (Z-Index, Lock, Hide Layer)"
          className="min-w-[32px] min-h-[32px] sm:min-w-0 sm:min-h-0 p-1.5 rounded-md text-cyan-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors cursor-pointer flex items-center justify-center"
        >
          <Layers className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Open Full Settings Modal */}
      <button
        onClick={onOpenSettings}
        title="Pengaturan Lengkap & Koordinat (Double-Click)"
        className="min-w-[32px] min-h-[32px] sm:min-w-0 sm:min-h-0 p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-cyan-500 hover:bg-cyan-500/10 transition-colors cursor-pointer flex items-center justify-center"
      >
        <Settings className="w-3.5 h-3.5" />
      </button>

      <div className="h-4 w-px bg-[var(--color-border)] mx-0.5" />

      {/* Delete Button */}
      <button
        onClick={onDelete}
        title="Hapus Alat Gambar (Del / Backspace)"
        className="min-w-[32px] min-h-[32px] sm:min-w-0 sm:min-h-0 p-1.5 rounded-md text-rose-500 hover:text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer flex items-center justify-center"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      {/* Deselect / Close */}
      <button
        onClick={onDeselect}
        title="Tutup Pilihan (Esc)"
        className="min-w-[32px] min-h-[32px] sm:min-w-0 sm:min-h-0 p-1 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)] transition-colors cursor-pointer ml-0.5 flex items-center justify-center"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

