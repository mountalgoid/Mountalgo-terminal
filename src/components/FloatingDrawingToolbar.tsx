import React, { useState, useRef, useEffect } from 'react';
import { DrawingToolType } from '../utils/drawingTools';
import { 
  Crosshair, Slash, Minus, Grid, Ruler, Trash2, Magnet, Camera, Undo2, 
  Lock, Unlock, Eye, EyeOff, Check, Pin, GripVertical, ChevronDown, 
  Sparkles, Compass, Minimize2, Maximize2, Plus, X, Search, RotateCcw,
  PenTool, FolderOpen, Layers
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { hexToRgba, getThemeModalGradient, getThemeCardBorder, getThemeCardGradient } from '../utils/themeGradient';
import { DRAWING_TOOL_GROUPS, getToolDef, ToolItem } from '../utils/drawingToolbarGroups';

export interface FloatingDrawingToolbarProps {
  activeTool: DrawingToolType;
  onSelectTool: (tool: DrawingToolType) => void;
  magnetMode: boolean;
  onToggleMagnet: () => void;
  magnetStrength?: 'weak' | 'strong';
  onSetMagnetStrength?: (strength: 'weak' | 'strong') => void;
  smartAngleSnap?: boolean;
  onToggleSmartAngleSnap?: () => void;
  alignToExistingDrawings?: boolean;
  onToggleAlignToExistingDrawings?: () => void;
  onClearDrawings: () => void;
  onUndoDrawing: () => void;
  onTakeSnapshot: () => void;
  drawingsCount: number;
  drawingColor: string;
  onChangeColor: (color: string) => void;
  isLocked: boolean;
  onToggleLock: () => void;
  stayInDrawingMode?: boolean;
  onToggleStayInDrawingMode?: () => void;
  hideDrawings: boolean;
  onToggleHideDrawings: () => void;
  pinnedTools: DrawingToolType[];
  onTogglePinTool?: (toolId: DrawingToolType) => void;
  onSetPinnedTools?: React.Dispatch<React.SetStateAction<DrawingToolType[]>> | ((tools: DrawingToolType[] | ((prev: DrawingToolType[]) => DrawingToolType[])) => void);
  onOpenSettings?: () => void;
  onOpenTemplates?: () => void;
  onOpenLayers?: () => void;
  onDeleteSelected?: () => void;
  onHideFloatingToolbar?: () => void;
  currentPalette?: {
    bull: string;
    bear: string;
    poc: string;
    vahVal: string;
  };
  className?: string;
}

const presetColors = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#14b8a6', 
  '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#d946ef', '#ec4899',
  '#ffffff', '#a1a1aa', '#52525b', '#000000'
];

export default function FloatingDrawingToolbar({
  activeTool,
  onSelectTool,
  magnetMode,
  onToggleMagnet,
  magnetStrength = 'strong',
  onSetMagnetStrength,
  smartAngleSnap = true,
  onToggleSmartAngleSnap,
  alignToExistingDrawings = true,
  onToggleAlignToExistingDrawings,
  onClearDrawings,
  onUndoDrawing,
  onTakeSnapshot,
  drawingsCount,
  drawingColor,
  onChangeColor,
  isLocked,
  onToggleLock,
  stayInDrawingMode = false,
  onToggleStayInDrawingMode,
  hideDrawings,
  onToggleHideDrawings,
  pinnedTools,
  onTogglePinTool,
  onSetPinnedTools,
  onOpenTemplates,
  onOpenLayers,
  onHideFloatingToolbar,
  currentPalette,
  className = '',
}: FloatingDrawingToolbarProps) {
  const activePresetColors = currentPalette
    ? Array.from(new Set([
        currentPalette.bull,
        currentPalette.bear,
        currentPalette.poc,
        currentPalette.vahVal,
        '#38bdf8', '#a855f7', '#f59e0b', '#10b981', '#ffffff', '#ef4444', '#a1a1aa', '#000000'
      ]))
    : presetColors;
  const { palette, isHighContrast, isLight } = useTheme();
  const [showColorPalette, setShowColorPalette] = useState<boolean>(false);
  const [showMagnetMenu, setShowMagnetMenu] = useState<boolean>(false);
  const [showPinManager, setShowPinManager] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [pinSearchQuery, setPinSearchQuery] = useState<string>('');
  
  // Position state for Dragging the floating toolbar anywhere on chart
  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    const isM = typeof window !== 'undefined' && (window.innerWidth < 640 || window.innerHeight > window.innerWidth);
    if (isM) {
      return { x: 12, y: Math.max(50, (typeof window !== 'undefined' ? window.innerHeight : 600) - 140) };
    }
    return { x: 12, y: 80 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; posX: number; posY: number } | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Detect mobile / portrait mode for layout adaptation
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 640 || (window.innerWidth < 768 && window.innerHeight > window.innerWidth);
      setIsMobile(mobile);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Clamp position within window bounds when resized
  useEffect(() => {
    const clampPos = () => {
      if (!toolbarRef.current) return;
      const w = toolbarRef.current.offsetWidth || 200;
      const h = toolbarRef.current.offsetHeight || 50;
      setPos((prev) => ({
        x: Math.max(0, Math.min(window.innerWidth - Math.min(w, window.innerWidth - 10), prev.x)),
        y: Math.max(0, Math.min(window.innerHeight - Math.min(h, window.innerHeight - 10), prev.y)),
      }));
    };
    window.addEventListener('resize', clampPos);
    return () => window.removeEventListener('resize', clampPos);
  }, []);

  const activeToolDef = getToolDef(activeTool);
  const ActiveToolIcon = activeToolDef?.icon || Crosshair;

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if ('touches' in e && e.cancelable) {
      e.preventDefault();
    }
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragStartRef.current = {
      mouseX: clientX,
      mouseY: clientY,
      posX: pos.x,
      posY: pos.y,
    };
  };

  const dragRafRef = useRef<number | null>(null);

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !dragStartRef.current) return;
      if ('touches' in e && e.cancelable) {
        e.preventDefault();
      }
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const dx = clientX - dragStartRef.current.mouseX;
      const dy = clientY - dragStartRef.current.mouseY;

      if (dragRafRef.current === null) {
        dragRafRef.current = requestAnimationFrame(() => {
          dragRafRef.current = null;
          if (dragStartRef.current) {
            const toolbarW = toolbarRef.current?.offsetWidth || 280;
            const toolbarH = toolbarRef.current?.offsetHeight || 60;

            const maxX = Math.max(0, window.innerWidth - Math.min(toolbarW, window.innerWidth - 10));
            const maxY = Math.max(0, window.innerHeight - Math.min(toolbarH, window.innerHeight - 10));

            const newX = Math.max(0, Math.min(maxX, dragStartRef.current.posX + dx));
            const newY = Math.max(0, Math.min(maxY, dragStartRef.current.posY + dy));

            setPos({ x: newX, y: newY });
          }
        });
      }
    };

    const handleEnd = () => {
      if (dragRafRef.current !== null) {
        cancelAnimationFrame(dragRafRef.current);
        dragRafRef.current = null;
      }
      setIsDragging(false);
      dragStartRef.current = null;
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMove, { passive: false });
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
      window.addEventListener('touchcancel', handleEnd);
    }
    return () => {
      if (dragRafRef.current !== null) {
        cancelAnimationFrame(dragRafRef.current);
        dragRafRef.current = null;
      }
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
      window.removeEventListener('touchcancel', handleEnd);
    };
  }, [isDragging]);

  const handleTogglePin = (toolId: DrawingToolType) => {
    if (onTogglePinTool) {
      onTogglePinTool(toolId);
    } else if (onSetPinnedTools) {
      onSetPinnedTools((prev) => {
        if (prev.includes(toolId)) return prev.filter((id) => id !== toolId);
        return [...prev, toolId];
      });
    }
  };

  // Close all popovers helper
  const closeAllPopovers = () => {
    setShowColorPalette(false);
    setShowMagnetMenu(false);
    setShowPinManager(false);
  };

  // Shared tool button class — uniform finger-friendly touch sizing (40px+ on mobile)
  const toolBtnClass = "flex items-center justify-center min-w-[40px] min-h-[40px] w-10 h-10 sm:min-w-[32px] sm:min-h-[32px] sm:w-8 sm:h-8 rounded-xl sm:rounded-md transition-all cursor-pointer border shrink-0 touch-manipulation";
  const toolBtnActive = (active: boolean, color?: string) => 
    active ? { backgroundColor: `${color || palette.bull}33`, color: color || palette.bull, borderColor: `${color || palette.bull}88` } : {};

  // ──────────────────────────────────────────
  // MOBILE / PORTRAIT: Draggable horizontal floating toolbar
  // ──────────────────────────────────────────
  if (isMobile) {
    return (
      <div
        ref={toolbarRef}
        className={`absolute z-[80] transition-opacity select-none max-w-[calc(100vw-16px)] ${
          isDragging ? 'opacity-90 scale-[1.01]' : 'opacity-100'
        }`}
        style={{
          transform: `translate(${pos.x}px, ${pos.y}px)`,
          touchAction: 'none',
          overscrollBehavior: 'contain',
        }}
      >
        {/* MINIMIZED MOBILE: Compact horizontal pill */}
        {isMinimized ? (
          <div 
            style={{
              borderColor: getThemeCardBorder(palette, false),
              background: getThemeModalGradient(palette, isLight),
              boxShadow: isHighContrast 
                ? '0 0 0 1px #ffffff, 0 8px 32px rgba(0,0,0,0.8)'
                : `0 8px 32px -4px rgba(0,0,0,0.6), 0 0 16px -4px ${hexToRgba(palette.bull, 0.25)}`
            }}
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl border backdrop-blur-xl animate-in fade-in duration-150"
          >
            {/* Drag Handle */}
            <div
              onMouseDown={handleDragStart}
              onTouchStart={handleDragStart}
              className="flex items-center justify-center w-7 h-7 rounded-md cursor-grab active:cursor-grabbing text-cyan-500 hover:text-[var(--color-text)] hover:bg-[var(--color-hover)] transition-colors shrink-0"
              title="Geser Toolbar Melayang"
            >
              <GripVertical size={14} />
            </div>
            {/* Active Tool Badge */}
            <button
              onClick={() => onSelectTool('cursor')}
              title="Kembali ke Crosshair"
              style={activeTool !== 'cursor' ? { backgroundColor: `${palette.bull}25`, color: palette.bull, borderColor: `${palette.bull}60` } : {}}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-[var(--color-border)] text-[var(--color-text-muted)] transition-all cursor-pointer min-h-[36px]"
            >
              <ActiveToolIcon size={14} />
              <span className="font-mono truncate max-w-[80px]">{activeToolDef?.name || 'Crosshair'}</span>
            </button>

            {/* Pinned quick access */}
            {pinnedTools.slice(0, 4).map((tId) => {
              const tool = getToolDef(tId);
              if (!tool) return null;
              const ToolIcon = tool.icon;
              const isActive = activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => onSelectTool(tool.id)}
                  style={toolBtnActive(isActive)}
                  className={`${toolBtnClass} text-[var(--color-text-muted)] border-transparent`}
                >
                  <ToolIcon size={15} />
                </button>
              );
            })}

            {/* More tools button */}
            <button
              onClick={() => setIsMinimized(false)}
              title="Buka Semua Alat Gambar"
              style={{ color: palette.poc }} className="p-1.5 rounded-lg border cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${palette.poc}20`} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ""}
            >
              <Maximize2 size={14} />
            </button>
          </div>
        ) : (
          /* EXPANDED MOBILE: Draggable Floating Toolbar */
          <div 
            style={{
              borderColor: getThemeCardBorder(palette, false),
              background: getThemeModalGradient(palette, isLight),
              boxShadow: isHighContrast 
                ? '0 0 0 1px #ffffff, 0 16px 40px rgba(0,0,0,0.9)' 
                : `0 16px 40px -4px rgba(0,0,0,0.7), 0 0 20px -4px ${hexToRgba(palette.bull, 0.2)}`
            }}
            className="flex flex-col rounded-2xl border backdrop-blur-2xl animate-in fade-in duration-150 overflow-hidden"
          >
            {/* Header Drag Bar */}
            <div
              onMouseDown={handleDragStart}
              onTouchStart={handleDragStart}
              onDoubleClick={() => setIsMinimized(true)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 border-b border-[var(--color-border)] cursor-grab active:cursor-grabbing bg-[var(--color-bg)]/70 select-none"
              title="Geser Toolbar (Double-klik untuk minimize)"
            >
              <div className="flex items-center gap-1.5 text-[var(--color-text-muted)]">
                <GripVertical size={14} style={{ color: palette.bull }} />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider" style={{ color: palette.bull }}>Toolbar Gambar</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setIsMinimized(true); closeAllPopovers(); }}
                  title="Minimize Toolbar"
                  className="w-5 h-5 rounded flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)] transition-colors cursor-pointer"
                >
                  <Minimize2 size={11} />
                </button>
                {onHideFloatingToolbar && (
                  <button
                    onClick={onHideFloatingToolbar}
                    title="Hilangkan Bar Drawing Melayang"
                    className="w-5 h-5 rounded flex items-center justify-center text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition-colors cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Main scrollable tool row */}
            <div className="flex items-center gap-1 px-2 py-2 overflow-x-auto custom-scrollbar">
              {/* Pinned Tools */}
              {pinnedTools.map((tId) => {
                const tool = getToolDef(tId);
                if (!tool) return null;
                const ToolIcon = tool.icon;
                const isActive = activeTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => onSelectTool(tool.id)}
                    onContextMenu={(e) => { e.preventDefault(); handleTogglePin(tool.id); }}
                    title={`${tool.name} ${tool.shortcut ? `(${tool.shortcut})` : ''}`}
                    style={toolBtnActive(isActive)}
                    className={`${toolBtnClass} ${
                      isActive
                        ? 'shadow-sm ring-1 ring-white/20 font-bold'
                        : 'text-[var(--color-text-muted)] border-transparent hover:text-[var(--color-text)] hover:bg-[var(--color-hover)]'
                    }`}
                  >
                    <ToolIcon size={15} />
                  </button>
                );
              })}

              {/* Add Pin button */}
              <button
                onClick={() => { closeAllPopovers(); setShowPinManager(true); }}
                title="Kelola Pin Alat"
                className={`${toolBtnClass} text-cyan-500 border-dashed border-[var(--color-border)] hover:border-cyan-500`}
              >
                <Plus size={14} />
              </button>

              {/* Separator */}
              <div className="w-px h-6 bg-[var(--color-border)] mx-0.5 shrink-0" />

              {/* Action buttons */}
              {onOpenTemplates && (
                <button
                  onClick={onOpenTemplates}
                  title="Template Gambar"
                  className={`${toolBtnClass} hover:bg-[${palette.poc}15]`} style={{ color: palette.poc, borderColor: `${palette.poc}30` }}
                >
                  <FolderOpen size={15} />
                </button>
              )}

              {onOpenLayers && (
                <button
                  onClick={onOpenLayers}
                  title="Layer Manager"
                  className={`${toolBtnClass} hover:bg-[${palette.poc}15]`} style={{ color: palette.poc, borderColor: `${palette.poc}30` }}
                >
                  <Layers size={15} />
                </button>
              )}

              {/* Color picker */}
              <button
                onClick={() => { closeAllPopovers(); setShowColorPalette(!showColorPalette); }}
                title="Warna Garis"
                className={`${toolBtnClass} border-transparent`}
              >
                <div className="w-5 h-5 rounded-full border-2 border-[var(--color-border)] shadow-sm" style={{ backgroundColor: drawingColor }} />
              </button>

              {/* Magnet */}
              <button
                onClick={onToggleMagnet}
                onContextMenu={(e) => { e.preventDefault(); closeAllPopovers(); setShowMagnetMenu(!showMagnetMenu); }}
                title={magnetMode ? 'Magnet Aktif' : 'Nyalakan Magnet'}
                style={toolBtnActive(magnetMode)}
                className={`${toolBtnClass} relative ${
                  magnetMode
                    ? 'font-bold'
                    : 'text-[var(--color-text-muted)] border-transparent hover:text-[var(--color-text)]'
                }`}
              >
                <Magnet size={15} />
                {magnetMode && <span className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-400" />}
              </button>

              {/* Stay in drawing mode */}
              {onToggleStayInDrawingMode && (
                <button
                  onClick={onToggleStayInDrawingMode}
                  title={stayInDrawingMode ? 'Mode Gambar Terus' : 'Kunci Mode Gambar'}
                  style={toolBtnActive(stayInDrawingMode)}
                  className={`${toolBtnClass} relative ${
                    stayInDrawingMode
                      ? 'font-bold shadow-sm'
                      : 'text-[var(--color-text-muted)] border-transparent hover:text-[var(--color-text)]'
                  }`}
                >
                  <PenTool size={15} />
                  {stayInDrawingMode && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 border border-[var(--color-bg)]" />}
                </button>
              )}

              {/* Lock */}
              <button
                onClick={onToggleLock}
                title={isLocked ? 'Buka Kunci' : 'Kunci Gambar'}
                style={isLocked ? { backgroundColor: `${palette.bear}25`, color: palette.bear, borderColor: `${palette.bear}88` } : {}}
                className={`${toolBtnClass} ${
                  isLocked ? 'font-bold' : 'text-[var(--color-text-muted)] border-transparent hover:text-[var(--color-text)]'
                }`}
              >
                {isLocked ? <Lock size={15} /> : <Unlock size={15} />}
              </button>

              {/* Hide/Show */}
              {drawingsCount > 0 && (
                <button
                  onClick={onToggleHideDrawings}
                  title={hideDrawings ? 'Tampilkan' : 'Sembunyikan'}
                  style={toolBtnActive(hideDrawings)}
                  className={`${toolBtnClass} ${
                    hideDrawings ? 'font-bold' : 'text-[var(--color-text-muted)] border-transparent hover:text-[var(--color-text)]'
                  }`}
                >
                  {hideDrawings ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              )}

              {/* Undo */}
              {drawingsCount > 0 && (
                <button onClick={onUndoDrawing} title="Undo" className={`${toolBtnClass} text-[var(--color-text-muted)] border-transparent hover:text-[var(--color-text)]`}>
                  <Undo2 size={15} />
                </button>
              )}

              {/* Clear */}
              {drawingsCount > 0 && (
                <button onClick={onClearDrawings} title="Hapus Semua" style={{ color: palette.bear }} className={`${toolBtnClass} border-transparent hover:bg-[${palette.bear}10]`}>
                  <Trash2 size={15} />
                </button>
              )}

              {/* Snapshot */}
              <button onClick={onTakeSnapshot} title="Screenshot" style={{ color: palette.poc }} className={`${toolBtnClass} border-transparent`}>
                <Camera size={15} />
              </button>

              {/* Minimize */}
              <button
                onClick={() => { setIsMinimized(true); closeAllPopovers(); }}
                title="Minimize"
                className={`${toolBtnClass} text-[var(--color-text-muted)] border-transparent`}
              >
                <Minimize2 size={14} />
              </button>
            </div>

            {/* MOBILE POPOVERS — Full width bottom sheets */}
            {showPinManager && (
              <div className="px-2 pb-2 animate-in fade-in slide-in-from-bottom-1 duration-150">
                <MobilePinManagerPopover
                  pinnedTools={pinnedTools}
                  onTogglePin={handleTogglePin}
                  onSetPinnedTools={onSetPinnedTools}
                  onClose={() => setShowPinManager(false)}
                  pinSearchQuery={pinSearchQuery}
                  setPinSearchQuery={setPinSearchQuery}
                />
              </div>
            )}

            {showMagnetMenu && (
              <div className="px-2 pb-2 animate-in fade-in slide-in-from-bottom-1 duration-150">
                <MobileMagnetMenuPopover
                  magnetMode={magnetMode}
                  onToggleMagnet={onToggleMagnet}
                  magnetStrength={magnetStrength}
                  onSetMagnetStrength={onSetMagnetStrength}
                  smartAngleSnap={smartAngleSnap}
                  onToggleSmartAngleSnap={onToggleSmartAngleSnap}
                  alignToExistingDrawings={alignToExistingDrawings}
                  onToggleAlignToExistingDrawings={onToggleAlignToExistingDrawings}
                  onClose={() => setShowMagnetMenu(false)}
                />
              </div>
            )}

            {showColorPalette && (
              <div className="px-2 pb-2 animate-in fade-in slide-in-from-bottom-1 duration-150">
                <MobileColorPalettePopover
                  drawingColor={drawingColor}
                  onChangeColor={(c) => { onChangeColor(c); setShowColorPalette(false); }}
                  onClose={() => setShowColorPalette(false)}
                  activePresetColors={activePresetColors}
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ──────────────────────────────────────────
  // DESKTOP: Vertical floating sidebar (original)
  // ──────────────────────────────────────────
  return (
    <div 
      ref={toolbarRef}
      style={{
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        touchAction: 'none'
      }}
      className={`absolute z-[80] flex items-start gap-1 transition-opacity select-none ${className} ${isDragging ? 'opacity-90' : 'opacity-100'}`}
    >
      {/* MINIMIZED MODE: Sleek compact capsule pill */}
      {isMinimized ? (
        <div 
          style={{
            borderColor: getThemeCardBorder(palette, false),
            background: getThemeModalGradient(palette, isLight),
            boxShadow: isHighContrast 
              ? '0 0 0 1px #ffffff, 0 8px 32px rgba(0,0,0,0.8)' 
              : `0 8px 32px -4px rgba(0,0,0,0.6), 0 0 16px -4px ${hexToRgba(palette.bull, 0.25)}`
          }}
          className="flex items-center gap-1 px-1.5 py-1 rounded-full border backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Drag Handle */}
          <div 
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            className="cursor-grab active:cursor-grabbing text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-0.5"
            title="Geser Posisi Toolbar"
          >
            <GripVertical size={13} />
          </div>

          {/* Active Tool Badge Button */}
          <button
            onClick={() => onSelectTool('cursor')}
            title={`Alat Aktif: ${activeToolDef?.name || 'Cursor'} (Klik untuk kembali ke Crosshair)`}
            style={activeTool !== 'cursor' ? { backgroundColor: `${palette.bull}25`, color: palette.bull, borderColor: `${palette.bull}60` } : {}}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-all cursor-pointer"
          >
            <ActiveToolIcon size={13} />
            <span className="text-[11px] font-mono max-w-[90px] truncate">
              {activeToolDef?.name || 'Crosshair'}
            </span>
          </button>

          {/* Pinned Count Indicator */}
          <span 
            className="text-[9.5px] font-mono text-[var(--color-text-muted)] px-1 py-0.5 rounded bg-[var(--color-bg)] border border-[var(--color-border)]"
            title={`${pinnedTools.length} alat disematkan`}
          >
            {pinnedTools.length} Pin
          </span>

          {/* Expand Button */}
          <button
            onClick={() => setIsMinimized(false)}
            title="Perluas Toolbar"
            style={{ color: palette.bull, borderColor: `${palette.bull}40` }}
            className="p-1 rounded-full hover:brightness-125 border transition-all cursor-pointer ml-0.5 shadow-sm"
          >
            <Maximize2 size={12} />
          </button>
        </div>
      ) : (
        /* EXPANDED FULL FLOATING TOOLBAR */
        <div 
          style={{
            borderColor: getThemeCardBorder(palette, false),
            background: getThemeModalGradient(palette, isLight),
            boxShadow: isHighContrast 
              ? '0 0 0 1px #ffffff, 0 16px 40px rgba(0,0,0,0.9)' 
              : `0 16px 40px -4px rgba(0,0,0,0.7), 0 0 20px -4px ${hexToRgba(palette.bull, 0.2)}`
          }}
          className="flex flex-col gap-1 p-1 rounded-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[45vh] overflow-hidden border"
        >
          {/* Header Bar */}
          <div className="w-full flex items-center justify-between px-0.5 pt-0.5 pb-1 border-b border-[var(--color-border)] shrink-0">
            <div 
              onMouseDown={handleDragStart}
              onTouchStart={handleDragStart}
              onDoubleClick={() => setIsMinimized(true)}
              className="flex-1 flex items-center justify-center cursor-grab active:cursor-grabbing text-gray-500 hover:text-[var(--color-text)] py-0.5"
              title="Geser Toolbar (Double-klik untuk minimize)"
            >
              <GripVertical size={13} style={{ color: palette.bull }} />
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => { setIsMinimized(true); closeAllPopovers(); }}
                title="Minimize Toolbar"
                className="w-5 h-5 rounded flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)] transition-colors cursor-pointer"
              >
                <Minimize2 size={11} />
              </button>
              {onHideFloatingToolbar && (
                <button
                  onClick={onHideFloatingToolbar}
                  title="Hilangkan Bar Drawing Melayang"
                  className="w-5 h-5 rounded flex items-center justify-center text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition-colors cursor-pointer"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          </div>
          
          {/* SCROLLABLE TOOLBAR BODY */}
          <div 
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar flex flex-col gap-1 pr-0.5 max-h-[calc(45vh-32px)]"
          >
            {/* Pinned Drawing Tools */}
            <div className="flex flex-col items-center gap-1">
              {pinnedTools.map((tId) => {
                const tool = getToolDef(tId);
                if (!tool) return null;
                const ToolIcon = tool.icon;
                const isActive = activeTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => onSelectTool(tool.id)}
                    onContextMenu={(e) => { e.preventDefault(); handleTogglePin(tool.id); }}
                    title={`${tool.name} ${tool.shortcut ? `(${tool.shortcut})` : ''} • Klik kanan untuk lepas pin`}
                    style={toolBtnActive(isActive)}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md flex items-center justify-center transition-all cursor-pointer border ${
                      isActive
                        ? 'shadow-sm ring-1 ring-white/20 font-bold'
                        : 'text-[var(--color-text-muted)] border-transparent hover:text-[var(--color-text)] hover:bg-[var(--color-hover)]'
                    }`}
                  >
                    <ToolIcon size={14} />
                  </button>
                );
              })}

              <button
                onClick={() => { closeAllPopovers(); setShowPinManager(!showPinManager); }}
                title="Kelola Pin Alat"
                style={showPinManager ? { backgroundColor: `${palette.bull}25`, color: palette.bull, borderColor: `${palette.bull}80` } : { color: palette.bull, borderColor: `${palette.bull}40` }}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md flex items-center justify-center transition-all cursor-pointer border ${
                  showPinManager
                    ? 'font-bold'
                    : 'border-dashed hover:bg-[var(--color-hover)]'
                }`}
              >
                <Plus size={13} />
              </button>
            </div>
            
            <div className="w-full h-px bg-[var(--color-border)] my-0.5" />

            {/* Action Utilities */}
            <div className="flex flex-col items-center gap-1">
              {onOpenTemplates && (
                <button 
                  onClick={onOpenTemplates} 
                  title="Template Gambar" 
                  style={{ color: palette.poc, borderColor: `${palette.poc}40` }}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-md flex items-center justify-center hover:brightness-125 cursor-pointer transition-colors border shadow-sm"
                >
                  <FolderOpen size={14} />
                </button>
              )}
              {onOpenLayers && (
                <button 
                  onClick={onOpenLayers} 
                  title="Layer Manager" 
                  style={{ color: palette.bull, borderColor: `${palette.bull}40` }}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-md flex items-center justify-center hover:brightness-125 cursor-pointer transition-colors border shadow-sm"
                >
                  <Layers size={14} />
                </button>
              )}

              {/* Color Picker */}
              <button
                onClick={() => { closeAllPopovers(); setShowColorPalette(!showColorPalette); }}
                title="Warna Garis"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-md flex items-center justify-center hover:bg-[var(--color-hover)] cursor-pointer transition-colors"
              >
                <div className="w-4 h-4 rounded-full border border-[var(--color-border)] shadow-sm" style={{ backgroundColor: drawingColor }} />
              </button>

              {/* Magnet */}
              <div className="relative">
                <button
                  onClick={onToggleMagnet}
                  onContextMenu={(e) => { e.preventDefault(); closeAllPopovers(); setShowMagnetMenu(!showMagnetMenu); }}
                  title={magnetMode ? 'Magnet Aktif' : 'Nyalakan Magnet'}
                  style={toolBtnActive(magnetMode)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md flex items-center justify-center transition-colors cursor-pointer border relative ${
                    magnetMode ? 'font-bold' : 'text-[var(--color-text-muted)] border-transparent hover:text-[var(--color-text)] hover:bg-[var(--color-hover)]'
                  }`}
                >
                  <Magnet size={14} />
                  {magnetMode && <span className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm" />}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); closeAllPopovers(); setShowMagnetMenu(!showMagnetMenu); }}
                  title="Opsi Snapping"
                  className="w-full flex items-center justify-center -mt-1 text-[8px] text-[var(--color-text-muted)] hover:text-cyan-500 cursor-pointer"
                >
                  <ChevronDown size={10} />
                </button>
              </div>

              {/* Stay in Drawing Mode */}
              {onToggleStayInDrawingMode && (
                <button
                  onClick={onToggleStayInDrawingMode}
                  title={stayInDrawingMode ? 'Mode Gambar Terus' : 'Kunci Mode Gambar'}
                  style={toolBtnActive(stayInDrawingMode)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md flex items-center justify-center transition-colors cursor-pointer border relative ${
                    stayInDrawingMode ? 'font-bold shadow-sm' : 'text-[var(--color-text-muted)] border-transparent hover:text-[var(--color-text)] hover:bg-[var(--color-hover)]'
                  }`}
                >
                  <PenTool size={14} />
                  {stayInDrawingMode && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 border border-[var(--color-bg)]" />}
                </button>
              )}

              {/* Lock */}
              <button
                onClick={onToggleLock}
                title={isLocked ? 'Buka Kunci' : 'Kunci Gambar'}
                style={isLocked ? { backgroundColor: `${palette.bear}25`, color: palette.bear, borderColor: `${palette.bear}88` } : {}}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md flex items-center justify-center transition-colors cursor-pointer border ${isLocked ? 'font-bold' : 'text-[var(--color-text-muted)] border-transparent hover:text-[var(--color-text)] hover:bg-[var(--color-hover)]'}`}
              >
                {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
              </button>

              {/* Hide/Show */}
              {drawingsCount > 0 && (
                <button onClick={onToggleHideDrawings} title={hideDrawings ? 'Tampilkan' : 'Sembunyikan'} style={toolBtnActive(hideDrawings)} className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md flex items-center justify-center transition-colors cursor-pointer border ${hideDrawings ? 'font-bold' : 'text-[var(--color-text-muted)] border-transparent hover:text-[var(--color-text)] hover:bg-[var(--color-hover)]'}`}>
                  {hideDrawings ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              )}

              {/* Undo */}
              {drawingsCount > 0 && (
                <button onClick={onUndoDrawing} title="Undo" className="w-7 h-7 sm:w-8 sm:h-8 rounded-md flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)] cursor-pointer transition-colors">
                  <Undo2 size={14} />
                </button>
              )}

              {/* Clear All */}
              {drawingsCount > 0 && (
                <button onClick={onClearDrawings} title="Hapus Semua" style={{ color: palette.bear }} className="w-7 h-7 sm:w-8 sm:h-8 rounded-md flex items-center justify-center hover:bg-[var(--color-hover)] cursor-pointer transition-colors">
                  <Trash2 size={14} />
                </button>
              )}

              <div className="w-full h-px bg-[var(--color-border)] my-0.5" />

              {/* Snapshot */}
              <button onClick={onTakeSnapshot} title="Screenshot" style={{ color: palette.poc }} className="w-7 h-7 sm:w-8 sm:h-8 rounded-md flex items-center justify-center hover:bg-[var(--color-hover)] cursor-pointer transition-colors">
                <Camera size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP POPOVERS (unchanged) */}
      {showPinManager && !isMinimized && (
        <div
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-panel)' }}
          className="border rounded-xl shadow-2xl backdrop-blur-xl p-3 flex flex-col gap-2 w-72 max-h-[75vh] animate-in fade-in slide-in-from-left-2 duration-150 text-xs text-[var(--color-text)] select-none overflow-hidden"
        >
          <div className="flex items-center justify-between pb-1.5 border-b border-[var(--color-border)]">
            <div className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: palette.bull }}>
              <Pin size={13} style={{ fill: palette.bull, color: palette.bull }} />
              <span>Kelola Pin Toolbar</span>
            </div>
            <button onClick={() => setShowPinManager(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-0.5 rounded hover:bg-[var(--color-hover)]">
              <X size={13} />
            </button>
          </div>
          <div className="text-[10px] text-[var(--color-text-muted)] leading-snug">
            Klik tombol pin pada alat untuk memunculkan atau menghapus dari toolbar melayang:
          </div>
          <div className="relative">
            <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="text"
              value={pinSearchQuery ?? ''}
              onChange={(e) => setPinSearchQuery(e.target.value)}
              placeholder="Cari alat gambar..."
              className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-lg pl-7 pr-2.5 py-1 text-[11px] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-bull)]"
            />
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 max-h-[260px] pr-0.5 divide-y divide-[var(--color-border)]">
            {DRAWING_TOOL_GROUPS.map((group) => {
              const matchingTools = group.tools.filter((t) => 
                !pinSearchQuery || 
                t.name.toLowerCase().includes(pinSearchQuery.toLowerCase()) ||
                (t.description && t.description.toLowerCase().includes(pinSearchQuery.toLowerCase()))
              );
              if (matchingTools.length === 0) return null;
              return (
                <div key={`pin-mgr-${group.id}`} className="pt-1.5 first:pt-0 flex flex-col gap-1">
                  <span className="text-[9.5px] font-bold uppercase tracking-wider px-1" style={{ color: palette.bull }}>{group.title}</span>
                  <div className="flex flex-col gap-1">
                    {matchingTools.map((tool) => {
                      const ToolIcon = tool.icon;
                      const isPinned = pinnedTools.includes(tool.id);
                      return (
                        <div key={`mgr-tool-${tool.id}`} className="flex items-center justify-between px-2 py-1 rounded-lg hover:bg-[var(--color-hover)] text-[var(--color-text)] transition-colors">
                          <div className="flex items-center gap-2 min-w-0">
                            <ToolIcon size={13} className="text-[var(--color-text-muted)] shrink-0" />
                            <span className="text-[11px] truncate">{tool.name}</span>
                          </div>
                          <button
                            onClick={() => handleTogglePin(tool.id)}
                            style={isPinned ? { backgroundColor: `${palette.bull}20`, color: palette.bull, borderColor: `${palette.bull}50` } : {}}
                            className={`px-2 py-0.5 rounded text-[9.5px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                              isPinned
                                ? 'border'
                                : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] border border-[var(--color-border)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)]'
                            }`}
                          >
                            <Pin size={10} style={isPinned ? { fill: palette.bull, color: palette.bull } : {}} className={isPinned ? 'rotate-45' : ''} />
                            <span>{isPinned ? 'Terpasang' : 'Pin'}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="pt-1.5 border-t border-[var(--color-border)] flex items-center justify-between text-[10px] text-[var(--color-text-muted)]">
            <span>{pinnedTools.length} alat terpasang</span>
            <button
              onClick={() => { if (onSetPinnedTools) onSetPinnedTools(['trendline', 'ray', 'horizontal', 'rectangle', 'fibonacci', 'position_long']); }}
              style={{ color: palette.bull }}
              className="hover:brightness-125 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={10} />
              <span>Reset Default</span>
            </button>
          </div>
        </div>
      )}

      {showMagnetMenu && !isMinimized && (
        <div
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-panel)' }}
          className="border rounded-xl shadow-2xl backdrop-blur-xl p-3 flex flex-col gap-2.5 w-60 animate-in fade-in slide-in-from-left-2 duration-150 text-xs text-[var(--color-text)] select-none"
        >
          <div className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-[var(--color-border)]" style={{ color: palette.bull }}>
            <Magnet size={13} />
            <span>Snapping & Penyelarasan Cerdas</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-[var(--color-text)] font-medium">Magnet Snapping</span>
            <button 
              onClick={onToggleMagnet} 
              style={magnetMode ? { backgroundColor: `${palette.bull}20`, color: palette.bull, borderColor: `${palette.bull}50` } : {}}
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${magnetMode ? 'border font-bold' : 'bg-[var(--color-hover)] text-[var(--color-text-muted)] border border-[var(--color-border)] hover:text-[var(--color-text)]'}`}
            >
              {magnetMode ? 'AKTIF' : 'OFF'}
            </button>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-[var(--color-text-muted)] font-mono">KEKUATAN DAYA TARIK:</span>
            <div className="grid grid-cols-2 gap-1.5">
              <button 
                onClick={() => onSetMagnetStrength && onSetMagnetStrength('weak')} 
                style={magnetStrength === 'weak' ? { backgroundColor: `${palette.bull}25`, color: palette.bull, borderColor: `${palette.bull}50` } : {}}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer text-center ${magnetStrength === 'weak' ? 'border font-bold' : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] border border-[var(--color-border)]'}`}
              >
                Lemah (14px)
              </button>
              <button 
                onClick={() => onSetMagnetStrength && onSetMagnetStrength('strong')} 
                style={magnetStrength === 'strong' ? { backgroundColor: `${palette.bull}25`, color: palette.bull, borderColor: `${palette.bull}50` } : {}}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer text-center ${magnetStrength === 'strong' ? 'border font-bold' : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] border border-[var(--color-border)]'}`}
              >
                Kuat (28px)
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between py-1 border-t border-[var(--color-border)] pt-2">
            <div className="flex items-center gap-1.5">
              <Compass size={13} className="text-purple-500" />
              <span className="text-[var(--color-text)] text-[11px]">Kunci Sudut (0°/45°/90°)</span>
            </div>
            <button onClick={onToggleSmartAngleSnap} className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${smartAngleSnap ? '`bg-[${palette.poc}20]` text-purple-500 border border-purple-500/40' : 'bg-[var(--color-hover)] text-[var(--color-text-muted)] border border-[var(--color-border)]'}`}>
              {smartAngleSnap ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-pink-500" />
              <span className="text-[var(--color-text)] text-[11px]">Selaraskan Antar Gambar</span>
            </div>
            <button onClick={onToggleAlignToExistingDrawings} className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${alignToExistingDrawings ? 'bg-pink-500/20 text-pink-500 border border-pink-500/40' : 'bg-[var(--color-hover)] text-[var(--color-text-muted)] border border-[var(--color-border)]'}`}>
              {alignToExistingDrawings ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="mt-1 p-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-[9.5px] text-[var(--color-text-muted)] flex flex-col gap-1 leading-relaxed">
            <div><span className="text-purple-500 font-bold font-mono">Shift</span> : Paksa sudut 0°, 45°, 90° saat menarik garis.</div>
            <div><span className="text-cyan-500 font-bold font-mono">Ctrl / Cmd</span> : Toggle magnet snap instan.</div>
          </div>
        </div>
      )}

      {showColorPalette && !isMinimized && (
        <div
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-panel)' }}
          className="border rounded-xl shadow-2xl backdrop-blur-xl p-2.5 flex flex-col gap-2 animate-in fade-in slide-in-from-left-2 duration-150"
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center justify-between">
            <span>Warna Garis & Anotasi</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {activePresetColors.map((c, idx) => (
              <button
                key={`preset-color-${c}-${idx}`}
                onClick={() => { onChangeColor(c); setShowColorPalette(false); }}
                title={c}
                className={`w-6 h-6 rounded-md border flex items-center justify-center transition-transform cursor-pointer ${
                  drawingColor === c ? 'scale-110 border-[var(--color-text)] ring-2 ring-[var(--color-text)]/40' : 'border-[var(--color-border)] hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
              >
                {drawingColor === c && <Check size={12} className="text-black drop-shadow" />}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 pt-1 border-t border-[var(--color-border)]">
            <input type="color" value={drawingColor || '#38bdf8'} onChange={(e) => onChangeColor(e.target.value)} className="w-5 h-5 rounded cursor-pointer bg-transparent border-0" title="Pilih warna custom" />
            <span className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase">{drawingColor}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────
// MOBILE POPOVER SUB-COMPONENTS
// ──────────────────────────────────────────

function MobilePinManagerPopover({
  pinnedTools, onTogglePin, onSetPinnedTools, onClose, pinSearchQuery, setPinSearchQuery
}: {
  pinnedTools: DrawingToolType[];
  onTogglePin: (id: DrawingToolType) => void;
  onSetPinnedTools?: React.Dispatch<React.SetStateAction<DrawingToolType[]>> | ((tools: DrawingToolType[] | ((prev: DrawingToolType[]) => DrawingToolType[])) => void);
  onClose: () => void;
  pinSearchQuery: string;
  setPinSearchQuery: (v: string) => void;
}) {
  const { palette } = useTheme();
  return (
    <div
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-panel)' }}
      className="rounded-xl border shadow-2xl backdrop-blur-xl p-3 flex flex-col gap-2 max-h-[50vh] overflow-hidden"
    >
      <div className="flex items-center justify-between pb-1.5 border-b border-[var(--color-border)]">
        <div className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: palette.bull }}>
          <Pin size={13} style={{ fill: palette.bull, color: palette.bull }} />
          <span>Kelola Pin Alat</span>
        </div>
        <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-1 rounded min-w-[32px] min-h-[32px] flex items-center justify-center">
          <X size={14} />
        </button>
      </div>
      <div className="relative">
        <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
        <input
          type="text"
          value={pinSearchQuery ?? ''}
          onChange={(e) => setPinSearchQuery(e.target.value)}
          placeholder="Cari alat..."
          className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-lg pl-7 pr-2.5 py-2 text-[12px] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-bull)]"
        />
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 max-h-[200px] divide-y divide-[var(--color-border)]">
        {DRAWING_TOOL_GROUPS.map((group) => {
          const matchingTools = group.tools.filter((t) => 
            !pinSearchQuery || t.name.toLowerCase().includes(pinSearchQuery.toLowerCase())
          );
          if (matchingTools.length === 0) return null;
          return (
            <div key={`mob-pin-${group.id}`} className="pt-1.5 first:pt-0 flex flex-col gap-1">
              <span className="text-[9.5px] font-bold uppercase tracking-wider px-1" style={{ color: palette.bull }}>{group.title}</span>
              <div className="flex flex-col gap-0.5">
                {matchingTools.map((tool) => {
                  const ToolIcon = tool.icon;
                  const isPinned = pinnedTools.includes(tool.id);
                  return (
                    <div key={`mob-mgr-${tool.id}`} className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-[var(--color-hover)] transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <ToolIcon size={14} className="text-[var(--color-text-muted)] shrink-0" />
                        <span className="text-[11px] truncate">{tool.name}</span>
                      </div>
                      <button
                        onClick={() => onTogglePin(tool.id)}
                        style={isPinned ? { backgroundColor: `${palette.bull}20`, color: palette.bull, borderColor: `${palette.bull}50` } : {}}
                        className={`min-w-[36px] min-h-[28px] px-2 py-1 rounded text-[10px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                          isPinned ? 'border' : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
                        }`}
                      >
                        <Pin size={10} style={isPinned ? { fill: palette.bull, color: palette.bull } : {}} className={isPinned ? 'rotate-45' : ''} />
                        <span>{isPinned ? 'Lepas' : 'Pin'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="pt-1.5 border-t border-[var(--color-border)] flex items-center justify-between text-[10px] text-[var(--color-text-muted)]">
        <span>{pinnedTools.length} alat terpasang</span>
        <button
          onClick={() => { if (onSetPinnedTools) onSetPinnedTools(['trendline', 'ray', 'horizontal', 'rectangle', 'fibonacci', 'position_long']); }}
          style={{ color: palette.bull }}
          className="hover:brightness-125 flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw size={10} />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
}

function MobileMagnetMenuPopover({
  magnetMode, onToggleMagnet, magnetStrength, onSetMagnetStrength,
  smartAngleSnap, onToggleSmartAngleSnap,
  alignToExistingDrawings, onToggleAlignToExistingDrawings, onClose
}: {
  magnetMode: boolean;
  onToggleMagnet: () => void;
  magnetStrength: 'weak' | 'strong';
  onSetMagnetStrength?: (s: 'weak' | 'strong') => void;
  smartAngleSnap: boolean;
  onToggleSmartAngleSnap?: () => void;
  alignToExistingDrawings: boolean;
  onToggleAlignToExistingDrawings?: () => void;
  onClose: () => void;
}) {
  const { palette } = useTheme();
  return (
    <div
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-panel)' }}
      className="rounded-xl border shadow-2xl backdrop-blur-xl p-3 flex flex-col gap-2.5 max-h-[45vh] overflow-y-auto custom-scrollbar"
    >
      <div className="flex items-center justify-between pb-1.5 border-b border-[var(--color-border)]">
        <div className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: palette.bull }}>
          <Magnet size={13} />
          <span>Snapping & Penyelarasan</span>
        </div>
        <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-1 rounded min-w-[32px] min-h-[32px] flex items-center justify-center">
          <X size={14} />
        </button>
      </div>
      <div className="flex items-center justify-between py-1">
        <span className="text-[var(--color-text)] font-medium text-[12px]">Magnet Snapping</span>
        <button 
          onClick={onToggleMagnet} 
          style={magnetMode ? { backgroundColor: `${palette.bull}20`, color: palette.bull, borderColor: `${palette.bull}50` } : {}}
          className={`min-w-[52px] px-2 py-1.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${magnetMode ? 'border font-bold' : 'bg-[var(--color-hover)] text-[var(--color-text-muted)] border border-[var(--color-border)]'}`}
        >
          {magnetMode ? 'AKTIF' : 'OFF'}
        </button>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-[var(--color-text-muted)] font-mono">KEKUATAN:</span>
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => onSetMagnetStrength?.('weak')} 
            style={magnetStrength === 'weak' ? { backgroundColor: `${palette.bull}25`, color: palette.bull, borderColor: `${palette.bull}50` } : {}}
            className={`min-h-[36px] px-2 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer text-center ${magnetStrength === 'weak' ? 'border font-bold' : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] border border-[var(--color-border)]'}`}
          >
            Lemah
          </button>
          <button 
            onClick={() => onSetMagnetStrength?.('strong')} 
            style={magnetStrength === 'strong' ? { backgroundColor: `${palette.bull}25`, color: palette.bull, borderColor: `${palette.bull}50` } : {}}
            className={`min-h-[36px] px-2 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer text-center ${magnetStrength === 'strong' ? 'border font-bold' : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] border border-[var(--color-border)]'}`}
          >
            Kuat
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between py-1 border-t border-[var(--color-border)] pt-2">
        <span className="text-[var(--color-text)] text-[12px]">Kunci Sudut (0°/45°/90°)</span>
        <button onClick={onToggleSmartAngleSnap} className={`min-w-[48px] px-2 py-1.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${smartAngleSnap ? '`bg-[${palette.poc}20]` text-purple-500 border border-purple-500/40' : 'bg-[var(--color-hover)] text-[var(--color-text-muted)] border border-[var(--color-border)]'}`}>
          {smartAngleSnap ? 'ON' : 'OFF'}
        </button>
      </div>
      <div className="flex items-center justify-between py-1">
        <span className="text-[var(--color-text)] text-[12px]">Selaraskan Antar Gambar</span>
        <button onClick={onToggleAlignToExistingDrawings} className={`min-w-[48px] px-2 py-1.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${alignToExistingDrawings ? 'bg-pink-500/20 text-pink-500 border border-pink-500/40' : 'bg-[var(--color-hover)] text-[var(--color-text-muted)] border border-[var(--color-border)]'}`}>
          {alignToExistingDrawings ? 'ON' : 'OFF'}
        </button>
      </div>
    </div>
  );
}

function MobileColorPalettePopover({
  drawingColor, onChangeColor, onClose, activePresetColors = presetColors
}: {
  drawingColor: string;
  onChangeColor: (c: string) => void;
  onClose: () => void;
  activePresetColors?: string[];
}) {
  return (
    <div
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-panel)' }}
      className="rounded-xl border shadow-2xl backdrop-blur-xl p-3 flex flex-col gap-2"
    >
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
        <span>Warna Garis & Anotasi</span>
        <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-1 rounded min-w-[32px] min-h-[32px] flex items-center justify-center">
          <X size={14} />
        </button>
      </div>
      <div className="grid grid-cols-8 gap-1.5">
        {activePresetColors.map((c, idx) => (
          <button
            key={`mob-color-${c}-${idx}`}
            onClick={() => onChangeColor(c)}
            title={c}
            className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-transform cursor-pointer ${
              drawingColor === c ? 'scale-110 border-white ring-2 ring-white/40' : 'border-[var(--color-border)] hover:scale-105'
            }`}
            style={{ backgroundColor: c }}
          >
            {drawingColor === c && <Check size={14} className="text-black drop-shadow" />}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 pt-1 border-t border-[var(--color-border)]">
        <input type="color" value={drawingColor || '#38bdf8'} onChange={(e) => onChangeColor(e.target.value)} className="w-7 h-7 rounded cursor-pointer bg-transparent border-0" title="Custom color" />
        <span className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase">{drawingColor}</span>
      </div>
    </div>
  );
}
