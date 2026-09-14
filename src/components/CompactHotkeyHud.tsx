import React from 'react';
import { Keyboard } from 'lucide-react';
import { motion } from 'motion/react';
import { useTheme } from '../context/ThemeContext';

const CompactHotkeyHud: React.FC = () => {
  const { palette: currentPalette } = useTheme();

  const hotkeys = [
    { keys: ['Shift', 'B'], label: 'Buy', color: currentPalette.bull },
    { keys: ['Shift', 'S'], label: 'Sell', color: currentPalette.bear },
    { keys: ['C'], label: 'Close', color: currentPalette.bear },
    { keys: ['X'], label: 'Cancel', color: 'var(--color-text-muted)' },
    { keys: ['R'], label: 'Risk', color: '#38bdf8' },
    { keys: ['Space'], label: 'Center', color: 'var(--color-text)' },
  ];

  return (
    <motion.div 
      drag
      dragMomentum={false}
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-2 py-0.5 rounded-full shadow-2xl select-none cursor-grab active:cursor-grabbing border border-white/10 bg-black/40 backdrop-blur-xl group"
      style={{
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      {/* Draggable Handle */}
      <div className="flex flex-col gap-0.5 px-0.5 opacity-30 group-hover:opacity-100 transition-opacity">
        <div className="w-0.5 h-0.5 rounded-full bg-white" />
        <div className="w-0.5 h-0.5 rounded-full bg-white" />
        <div className="w-0.5 h-0.5 rounded-full bg-white" />
      </div>

      <div className="flex items-center gap-2 pr-1">
        {hotkeys.map((hk, i) => (
          <div key={i} className="flex items-center gap-1">
            <span 
              className="px-0.5 py-0.5 rounded text-[7.5px] font-black min-w-[12px] text-center leading-none bg-white/10 border border-white/5 text-gray-300"
            >
              {hk.keys.join('+')}
            </span>
            <span className="text-[7.5px] font-bold uppercase tracking-tighter opacity-60 group-hover:opacity-100 transition-opacity" style={{ color: hk.color }}>
              {hk.label}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default CompactHotkeyHud;
