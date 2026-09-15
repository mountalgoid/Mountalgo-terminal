import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Crosshair, ChevronDown, Check, Pin, Search, Sparkles, RotateCcw, PenTool, Eye, EyeOff } from 'lucide-react';
import { DRAWING_TOOL_GROUPS, ToolItem } from '../utils/drawingToolbarGroups';
import { DrawingToolType } from '../utils/drawingTools';

interface TopDrawingMenuProps {
  activeTool: DrawingToolType;
  onSelectTool: (tool: DrawingToolType) => void;
  pinnedTools: DrawingToolType[];
  setPinnedTools: React.Dispatch<React.SetStateAction<DrawingToolType[]>> | ((tools: DrawingToolType[] | ((prev: DrawingToolType[]) => DrawingToolType[])) => void);
  currentPalette: { bull: string; bear: string; poc: string; bg: string };
  showFloatingDrawingBar?: boolean;
  onToggleFloatingDrawingBar?: () => void;
}

const DEFAULT_PINNED: DrawingToolType[] = ['trendline', 'ray', 'horizontal', 'rectangle', 'fibonacci', 'position_long'];

export default function TopDrawingMenu({
  activeTool,
  onSelectTool,
  pinnedTools,
  setPinnedTools,
  currentPalette,
  showFloatingDrawingBar = true,
  onToggleFloatingDrawingBar,
}: TopDrawingMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'pinned'>('all');
  const btnRef = useRef<HTMLButtonElement>(null);

  const togglePin = (toolId: DrawingToolType, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinnedTools((prev) => {
      if (prev.includes(toolId)) return prev.filter((id) => id !== toolId);
      return [...prev, toolId];
    });
  };

  const handleResetPinned = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPinnedTools(DEFAULT_PINNED);
  };

  const filteredGroups = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return DRAWING_TOOL_GROUPS.map((group) => {
      const filteredTools = group.tools.filter((tool) => {
        const matchesQuery = !q || tool.name.toLowerCase().includes(q) || (tool.description && tool.description.toLowerCase().includes(q)) || (tool.shortcut && tool.shortcut.toLowerCase().includes(q));
        const matchesFilter = filterMode === 'all' || (filterMode === 'pinned' && pinnedTools.includes(tool.id));
        return matchesQuery && matchesFilter;
      });
      return {
        ...group,
        tools: filteredTools,
      };
    }).filter((group) => group.tools.length > 0);
  }, [searchQuery, filterMode, pinnedTools]);

  return (
    <div className="relative shrink-0">
      <button
        ref={btnRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 bg-[var(--color-panel)] hover:bg-[var(--color-panel)] border border-[var(--color-border)] rounded-md px-2 py-1 text-xs text-[var(--color-text)] cursor-pointer min-h-[32px] sm:min-h-[28px] font-bold transition-all shadow-sm hover:border-white/30 touch-target tap-fix"
        style={activeTool !== 'cursor' ? { color: currentPalette.bull, borderColor: currentPalette.bull } : { color: '#94a3b8' }}
        title="Buka Menu Alat Gambar & Pin Favorit"
      >
        <Crosshair size={14} style={activeTool !== 'cursor' ? { color: currentPalette.bull } : {}} />
        <span className="hidden lg:inline">Alat Gambar</span>
        {pinnedTools.length > 0 && (
          <span 
            style={{ backgroundColor: `${currentPalette.bull}25`, color: currentPalette.bull, borderColor: `${currentPalette.bull}60` }}
            className="hidden sm:inline-flex text-[9px] px-1 rounded-full border font-mono font-bold leading-tight"
          >
            {pinnedTools.length}
          </span>
        )}
        <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <>
          <div 
            className="fixed inset-0 z-[99998] bg-black/30 backdrop-blur-[2px]"
            onClick={() => setIsOpen(false)}
          />
          <div 
            style={{ 
              borderColor: `${currentPalette.bull}70`,
              backgroundColor: currentPalette.bg && currentPalette.bg !== '#000000' ? `${currentPalette.bg}f2` : 'rgba(8, 12, 24, 0.96)',
              top: btnRef.current 
                ? Math.min(window.innerHeight - 480, Math.max(10, btnRef.current.getBoundingClientRect().bottom + 4)) 
                : '60px',
              left: btnRef.current 
                ? Math.min(Math.max(10, btnRef.current.getBoundingClientRect().left), window.innerWidth - 320) 
                : '16px',
              boxShadow: `0 25px 50px -12px rgba(0,0,0,0.85), 0 0 24px -4px ${currentPalette.bull}20, 0 0 0 1px rgba(255,255,255,0.08)`
            }}
            className="fixed z-[99999] w-[calc(100vw-16px)] sm:w-80 max-h-[70vh] sm:max-h-[82vh] rounded-2xl border shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col overflow-hidden text-gray-200"
          >
            {/* Header & Pin Guide Banner */}
            <div className="p-2.5 sm:p-3 border-b border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Pin size={13} style={{ color: currentPalette.bull, fill: currentPalette.bull }} />
                  <span>Katalog Alat & Pin Favorit</span>
                </div>
                <div className="flex items-center gap-1">
                  <span 
                    style={{ backgroundColor: `${currentPalette.bull}25`, color: currentPalette.bull, borderColor: `${currentPalette.bull}50` }}
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded-full border font-bold"
                  >
                    {pinnedTools.length} Terpasang
                  </span>
                  <button
                    onClick={handleResetPinned}
                    title="Reset ke pin default (Trendline, Ray, Horizontal, Fibonacci, Rectangle, Long)"
                    className="text-[10px] text-gray-400 hover:text-cyan-300 p-1 rounded hover:bg-white/10 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <RotateCcw size={10} />
                    <span className="text-[9px]">Reset</span>
                  </button>
                </div>
              </div>

              {/* Explanatory Pin Instructions */}
              <div className="text-[10.5px] text-gray-300 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 mb-2 leading-relaxed flex items-center gap-1.5">
                <span className="text-cyan-300 font-bold">📌 Petunjuk:</span>
                <span>Klik ikon pin <strong className="text-white">Pin</strong> di kanan alat untuk pasang/lepas dari Toolbar Melayang.</span>
              </div>

              {/* Floating Drawing Bar Toggle Row */}
              {onToggleFloatingDrawingBar !== undefined && (
                <button
                  type="button"
                  onClick={onToggleFloatingDrawingBar}
                  style={showFloatingDrawingBar ? {
                    backgroundColor: `${currentPalette.bull}18`,
                    borderColor: `${currentPalette.bull}50`,
                    color: currentPalette.bull
                  } : {}}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 mb-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    showFloatingDrawingBar
                      ? 'hover:brightness-125'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                  title={showFloatingDrawingBar ? 'Sembunyikan Bar Drawing Melayang pada Canvas' : 'Tampilkan Bar Drawing Melayang pada Canvas'}
                >
                  <div className="flex items-center gap-2">
                    <PenTool size={13} style={{ color: showFloatingDrawingBar ? currentPalette.bull : '#9ca3af' }} />
                    <span>Bar Drawing Melayang</span>
                  </div>
                  <div 
                    style={showFloatingDrawingBar ? {
                      backgroundColor: `${currentPalette.bull}25`,
                      color: currentPalette.bull,
                      borderColor: `${currentPalette.bull}60`
                    } : {}}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 ${
                      showFloatingDrawingBar ? 'border' : 'bg-gray-800 text-gray-400 border border-white/10'
                    }`}
                  >
                    {showFloatingDrawingBar ? <Eye size={11} /> : <EyeOff size={11} />}
                    <span>{showFloatingDrawingBar ? 'TAMPIL' : 'SEMBUNYI'}</span>
                  </div>
                </button>
              )}

              {/* Search Bar & Filter Tabs */}
              <div className="flex flex-col gap-1.5">
                <div className="relative">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery ?? ''}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari alat..."
                    className="w-full bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg pl-7 pr-2.5 py-2 sm:py-1 text-xs text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-cyan-400"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs px-1"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setFilterMode('all')}
                    style={filterMode === 'all' ? { backgroundColor: `${currentPalette.bull}20`, color: currentPalette.bull, borderColor: `${currentPalette.bull}50` } : {}}
                    className={`flex-1 text-[10px] py-0.5 rounded text-center font-medium transition-colors cursor-pointer ${
                      filterMode === 'all'
                        ? 'border font-bold'
                        : 'bg-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    Semua Alat
                  </button>
                  <button
                    onClick={() => setFilterMode('pinned')}
                    style={filterMode === 'pinned' ? { backgroundColor: `${currentPalette.bull}20`, color: currentPalette.bull, borderColor: `${currentPalette.bull}50` } : {}}
                    className={`flex-1 text-[10px] py-0.5 rounded text-center font-medium transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                      filterMode === 'pinned'
                        ? 'border font-bold'
                        : 'bg-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    <Pin size={10} style={filterMode === 'pinned' ? { fill: currentPalette.bull } : {}} />
                    <span>Hanya Di-Pin ({pinnedTools.length})</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tool List with Enhanced Clear Pin Buttons */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5 divide-y divide-white/5">
              {filteredGroups.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-400">
                  Tidak ada alat gambar yang cocok dengan pencarian "{searchQuery}".
                </div>
              ) : (
                filteredGroups.map((group) => (
                  <div key={group.id} className="py-1.5 first:pt-0 last:pb-0">
                    <div className="px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-wider text-cyan-400/90 flex items-center justify-between">
                      <span>{group.title}</span>
                      <span className="text-[9px] text-gray-500 lowercase font-normal">{group.tools.length} alat</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {group.tools.map((tool) => {
                        const ToolIcon = tool.icon;
                        const isSelected = activeTool === tool.id;
                        const isPinned = pinnedTools.includes(tool.id);
                        return (
                          <div 
                            key={tool.id}
                            className={`flex items-center justify-between px-2 py-1.5 rounded-lg group transition-all ${
                              isSelected
                                ? 'bg-cyan-500/15 border border-cyan-500/30'
                                : 'hover:bg-white/[0.06] border border-transparent'
                            }`}
                          >
                            <button
                              onClick={() => {
                                onSelectTool(tool.id);
                                setIsOpen(false);
                              }}
                              className="flex-1 flex items-center gap-2.5 text-left cursor-pointer min-w-0 pr-2"
                              title={`Aktifkan alat ${tool.name} ${tool.shortcut ? `(${tool.shortcut})` : ''}`}
                            >
                              <div 
                                style={isSelected ? { color: currentPalette.bull, backgroundColor: `${currentPalette.bull}20` } : {}}
                                className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center shrink-0 text-gray-300 group-hover:text-white"
                              >
                                <ToolIcon size={14} />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-xs truncate ${isSelected ? 'text-white font-bold' : 'text-gray-200 group-hover:text-white'}`}>
                                    {tool.name}
                                  </span>
                                  {tool.shortcut && (
                                    <span className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-gray-400 font-mono">
                                      {tool.shortcut}
                                    </span>
                                  )}
                                </div>
                                {tool.description && (
                                  <span className="text-[9.5px] text-gray-400 truncate font-normal">
                                    {tool.description}
                                  </span>
                                )}
                              </div>
                            </button>

                            {/* Clear, Prominent Pin Button */}
                            <button
                              onClick={(e) => togglePin(tool.id, e)}
                              style={isPinned ? {
                                backgroundColor: `${currentPalette.bull}20`,
                                color: currentPalette.bull,
                                borderColor: `${currentPalette.bull}50`,
                                boxShadow: `0 0 8px ${currentPalette.bull}20`
                              } : {}}
                              className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium border transition-all cursor-pointer ${
                                isPinned
                                  ? 'font-bold'
                                  : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/15 hover:text-white hover:border-white/30'
                              }`}
                              title={isPinned ? `Lepas sematan (Unpin) "${tool.name}" dari Toolbar Melayang` : `Sematkan (Pin) "${tool.name}" ke Toolbar Melayang`}
                            >
                              <Pin 
                                size={11} 
                                style={isPinned ? { color: currentPalette.bull, fill: currentPalette.bull } : {}}
                                className={`transition-transform ${isPinned ? 'rotate-45' : 'text-gray-400 group-hover:text-gray-200'}`} 
                              />
                              <span className="text-[9.5px] hidden sm:inline">
                                {isPinned ? 'Ter-Pin' : 'Pin'}
                              </span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Summary */}
            <div className="p-2 border-t border-[var(--color-border)] bg-[var(--color-panel)] text-[10px] text-[var(--color-text-muted)] flex items-center justify-between">
              <span>{pinnedTools.length} alat aktif di Toolbar Melayang</span>
              <button
                onClick={() => setIsOpen(false)}
                className="px-2 py-0.5 rounded bg-white/10 text-white hover:bg-white/20 text-[10px] font-medium cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
