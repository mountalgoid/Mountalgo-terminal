import React from 'react';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  width?: string | number;
  maxHeight?: string | number;
  onClose?: () => void;
  title?: string;
  accent?: string;
}

export const GlassPanel = React.memo(function GlassPanel({
  children,
  className = '',
  width,
  maxHeight,
  onClose,
  title,
  accent = 'from-indigo-500/20 via-purple-500/10 to-transparent',
}: GlassPanelProps) {
  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl
        bg-black/60 backdrop-blur-xl
        border border-white/10
        shadow-2xl shadow-black/50
        ${className}
      `}
      style={{ width, maxHeight }}
    >
      {/* Gradient accent top border */}
      <div className={`absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r ${accent}`} />

      {/* Optional title bar */}
      {title && (
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
          <span className="text-xs font-semibold text-zinc-300 tracking-wide">{title}</span>
          {onClose && (
            <button
              onClick={onClose}
              className="w-5 h-5 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-zinc-500 hover:text-zinc-300 transition-colors text-[10px]"
            >
              ×
            </button>
          )}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
});

export default GlassPanel;
