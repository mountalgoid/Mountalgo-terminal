import React, { useState, useRef, useCallback } from 'react';
import { ArrowUp, ArrowDown, Power, GripHorizontal } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface FloatingTradeBarProps {
  symbol: string;
  onExecute: (side: 'BUY' | 'SELL', size: number) => void;
  currentPrice?: number;
  onClose: () => void;
}

const FloatingTradeBar: React.FC<FloatingTradeBarProps> = ({ symbol, onExecute, currentPrice, onClose }) => {
  const { palette } = useTheme();
  const [size, setSize] = useState<string>('1.00');
  const [sizeType, setSizeType] = useState<'LOT' | 'USD'>('LOT');
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, startX: 0, startY: 0 });

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input')) return;
    
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY, startX: pos.x, startY: pos.y };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    e.preventDefault();
  }, [pos]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPos({ x: dragStart.current.startX + dx, y: dragStart.current.startY + dy });
  }, []);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleExecute = (side: 'BUY' | 'SELL') => {
    const numSize = parseFloat(size);
    if (isNaN(numSize) || numSize <= 0) return;
    onExecute(side, numSize);
  };

  return (
    <div
      ref={dragRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="absolute z-[80] flex items-center gap-1 p-1 backdrop-blur-xl rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.5)] select-none"
      style={{
        backgroundColor: 'var(--color-panel)',
        border: '1px solid var(--color-border)',
        bottom: 34,
        right: 12,
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        cursor: isDragging.current ? 'grabbing' : 'grab',
        touchAction: 'none',
      }}
    >
      {/* Drag Handle */}
      <div className="flex items-center justify-center w-5 h-8 transition-colors shrink-0 cursor-grab" style={{ color: 'var(--color-text-muted)' }}>
        <GripHorizontal size={14} />
      </div>

      <div className="w-[1px] h-6 mx-0.5" style={{ backgroundColor: 'var(--color-border)' }} />

      {/* Symbol & Label */}
      <div className="flex flex-col px-2 py-1">
        <span className="text-[9px] font-black uppercase tracking-widest leading-none" style={{ color: 'var(--color-text-muted)' }}>Market Execution</span>
        <span className="text-[11px] font-bold leading-tight" style={{ color: 'var(--color-text)' }}>{symbol}</span>
      </div>

      <div className="w-[1px] h-6 mx-0.5" style={{ backgroundColor: 'var(--color-border)' }} />

      {/* Sell Button */}
      <button 
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => handleExecute('SELL')}
        className="group relative flex items-center gap-1.5 px-4 py-2 border rounded-full transition-all duration-200 active:scale-95 overflow-hidden"
        style={{
          backgroundColor: `${palette.bear}15`,
          borderColor: `${palette.bear}40`,
        }}
      >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: `${palette.bear}20` }} />
        <ArrowDown size={13} className="group-hover:-translate-y-0.5 transition-transform relative" style={{ color: palette.bear }} />
        <span className="text-[11px] font-black uppercase tracking-wider relative" style={{ color: palette.bear }}>Sell</span>
      </button>

      {/* Center Input Group */}
      <div className="flex items-center rounded-full border px-1 py-1 mx-0.5" onPointerDown={(e) => e.stopPropagation()} style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
        <input 
          type="text" 
          value={size}
          onChange={(e) => setSize(e.target.value)}
          className="w-14 bg-transparent text-center text-[11px] font-bold focus:outline-none"
          style={{ color: 'var(--color-text)' }}
          placeholder="Size"
        />
        <button 
          onClick={() => setSizeType(prev => prev === 'LOT' ? 'USD' : 'LOT')}
          onPointerDown={(e) => e.stopPropagation()}
          className="px-1.5 py-0.5 rounded-full text-[8px] font-black transition-colors uppercase"
          style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text-muted)' }}
        >
          {sizeType}
        </button>
      </div>

      {/* Buy Button */}
      <button 
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => handleExecute('BUY')}
        className="group relative flex items-center gap-1.5 px-4 py-2 border rounded-full transition-all duration-200 active:scale-95 overflow-hidden"
        style={{
          backgroundColor: `${palette.bull}15`,
          borderColor: `${palette.bull}40`,
        }}
      >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: `${palette.bull}20` }} />
        <ArrowUp size={13} className="group-hover:-translate-y-0.5 transition-transform relative" style={{ color: palette.bull }} />
        <span className="text-[11px] font-black uppercase tracking-wider relative" style={{ color: palette.bull }}>Buy</span>
      </button>

      <div className="w-[1px] h-6 mx-0.5" style={{ backgroundColor: 'var(--color-border)' }} />

      <button 
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onClose}
        title="Matikan Instant Trade"
        className="p-2 rounded-full transition-colors shrink-0"
        style={{ color: 'var(--color-text-muted)' }}
      >
        <Power size={13} />
      </button>
    </div>
  );
};

export default FloatingTradeBar;
