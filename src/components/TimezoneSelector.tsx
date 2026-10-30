import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Globe, ChevronDown, Check, Clock } from 'lucide-react';
import { TIMEZONE_OPTIONS, setStoredTimezone, getStoredTimezone, getTimezoneMeta, TimeZoneOption } from '../utils/timezone';
import { tradingAudio } from '../utils/audioSynth';
import { useTheme } from '../context/ThemeContext';
import { hexToRgba, getThemeModalGradient, getThemeCardBorder } from '../utils/themeGradient';

interface TimezoneSelectorProps {
  selectedTz?: string;
  onChange?: (tzId: string) => void;
  variant?: 'compact' | 'full' | 'badge';
  className?: string;
}

export const TimezoneSelector: React.FC<TimezoneSelectorProps> = ({
  selectedTz: propSelectedTz,
  onChange,
  variant = 'compact',
  className = ''
}) => {
  const { palette, isHighContrast, isLight } = useTheme();
  const [currentTz, setCurrentTz] = useState<string>(() => propSelectedTz || getStoredTimezone());
  const [isOpen, setIsOpen] = useState(false);
  const [menuCoords, setMenuCoords] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 320 });
  
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (propSelectedTz) {
      setCurrentTz(propSelectedTz);
    }
  }, [propSelectedTz]);

  useEffect(() => {
    const handleGlobalTzChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail && customEvent.detail !== currentTz) {
        setCurrentTz(customEvent.detail);
      }
    };
    window.addEventListener('mountalgo_timezone_changed', handleGlobalTzChange);
    return () => window.removeEventListener('mountalgo_timezone_changed', handleGlobalTzChange);
  }, [currentTz]);

  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = Math.min(330, window.innerWidth - 20);
      let left = rect.right - menuWidth;
      if (left < 10) left = 10;
      if (left + menuWidth > window.innerWidth - 10) left = window.innerWidth - menuWidth - 10;
      
      let top = rect.bottom + 6;
      // If close to bottom of screen, show above button
      if (top + 320 > window.innerHeight) {
        top = Math.max(10, rect.top - 326);
      }

      setMenuCoords({ top, left, width: menuWidth });
    }
  };

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen(prev => !prev);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleScrollOrResize = () => {
      updatePosition();
    };
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);
    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen]);

  // Click outside listener
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        buttonRef.current && !buttonRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (tz: TimeZoneOption, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentTz(tz.id);
    setStoredTimezone(tz.id);
    if (onChange) onChange(tz.id);
    tradingAudio.play('CLICK');
    setIsOpen(false);
  };

  const meta = getTimezoneMeta(currentTz);

  const portalDropdown = isOpen ? (
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: `${menuCoords.top}px`,
        left: `${menuCoords.left}px`,
        width: `${menuCoords.width}px`,
        borderColor: isHighContrast ? '#ffffff' : getThemeCardBorder(palette, false),
        background: isHighContrast ? '#020308' : getThemeModalGradient(palette, isLight),
        boxShadow: isHighContrast 
          ? '0 0 0 1px #ffffff, 0 20px 50px rgba(0,0,0,0.95)' 
          : `0 20px 50px rgba(0,0,0,0.9), 0 0 25px ${hexToRgba(palette.poc || palette.bull, 0.2)}`
      }}
      className="border rounded-xl z-[100000] overflow-hidden backdrop-blur-3xl animate-in fade-in zoom-in-95 duration-150 font-sans pointer-events-auto shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top Accent Gradient Line */}
      <div 
        className="h-[3px] w-full shrink-0"
        style={{
          background: `linear-gradient(90deg, ${palette.bull} 0%, ${palette.poc || '#6366f1'} 50%, ${palette.bear} 100%)`
        }}
      />
      <div 
        style={{ 
          backgroundColor: `${palette.bull}12`,
          borderBottomColor: `${palette.bull}25`
        }}
        className="px-3.5 py-2 border-b flex items-center justify-between"
      >
        <div className="flex items-center gap-2 text-xs font-mono font-bold" style={{ color: palette.bull }}>
          <Globe size={13} className="animate-pulse" />
          <span>ZONA WAKTU TAMPILAN</span>
        </div>
        <span 
          style={{ 
            color: palette.bull, 
            backgroundColor: `${palette.bull}20`, 
            borderColor: `${palette.bull}40` 
          }}
          className="text-[9px] font-mono px-2 py-0.5 rounded border"
        >
          {meta.abbr} ({meta.offset})
        </span>
      </div>

      <div className="max-h-64 overflow-y-auto p-1.5 space-y-1 divide-y divide-white/5 font-mono text-xs custom-scrollbar">
        {TIMEZONE_OPTIONS.map(tz => {
          const isSelected = currentTz === tz.id;
          const dynamicMeta = getTimezoneMeta(tz.id);
          return (
            <button
              key={tz.id}
              onClick={(e) => handleSelect(tz, e)}
              style={isSelected ? {
                backgroundColor: `${palette.bull}18`,
                borderColor: `${palette.bull}50`,
              } : {}}
              className={`w-full flex items-center justify-between p-2 rounded-lg transition-all text-left cursor-pointer border ${
                isSelected
                  ? 'font-bold shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)] border-transparent'
              }`}
            >
              <div className="flex flex-col pr-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${isSelected ? 'text-white' : ''}`}>
                    {tz.abbr}
                  </span>
                  <span 
                    style={isSelected ? { color: palette.bull, backgroundColor: `${palette.bull}20`, borderColor: `${palette.bull}30` } : {}}
                    className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 border border-white/10 font-semibold"
                  >
                    {dynamicMeta.offset}
                  </span>
                  {tz.session && (
                    <span className="text-[9px] text-amber-400/90 font-semibold">
                      [{tz.session}]
                    </span>
                  )}
                </div>
                <span className="text-[10px] opacity-75 mt-0.5 line-clamp-1">
                  {tz.label}
                </span>
              </div>

              {isSelected && (
                <div 
                  style={{ color: palette.bull, backgroundColor: `${palette.bull}25` }}
                  className="shrink-0 p-1 rounded-full"
                >
                  <Check size={12} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="px-3 py-1.5 bg-black/40 border-t border-white/10 text-[9px] font-mono text-zinc-400 flex items-center justify-between">
        <span>Seluruh berita berkalibrasi otomatis</span>
        <span style={{ color: palette.bull }} className="font-bold">{meta.abbr}</span>
      </div>
    </div>
  ) : null;

  return (
    <div className={`inline-block ${className}`}>
      {/* Selector Trigger Button */}
      {variant === 'badge' ? (
        <button
          ref={buttonRef}
          onClick={toggleDropdown}
          type="button"
          style={isOpen ? {
            backgroundColor: `${palette.bull}20`,
            borderColor: `${palette.bull}60`,
          } : {}}
          className={`h-[22px] px-1.5 py-0 rounded border text-[9px] font-mono flex items-center gap-1 transition-all cursor-pointer shrink-0 ${
            isOpen 
              ? 'text-white font-bold shadow-xs' 
              : 'bg-white/[0.04] hover:bg-white/[0.08] text-white border-white/10'
          }`}
          title="Klik Untuk Ubah Zona Waktu Global"
        >
          <Clock size={11} className="text-zinc-400" />
          <span className="text-white font-medium">{meta.abbr}</span>
          <ChevronDown size={10} className={`text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      ) : variant === 'full' ? (
        <button
          ref={buttonRef}
          onClick={toggleDropdown}
          type="button"
          className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white text-xs font-mono transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2 text-left">
            <Globe size={15} className="text-zinc-400 shrink-0" />
            <div>
              <div className="font-bold flex items-center gap-1.5">
                <span className="text-white">{meta.abbr}</span>
                <span className="text-[10px] text-zinc-400 font-normal">({meta.offset})</span>
              </div>
              <div className="text-[10px] text-zinc-400 line-clamp-1">{meta.label}</div>
            </div>
          </div>
          <ChevronDown size={14} className={`text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      ) : (
        <button
          ref={buttonRef}
          onClick={toggleDropdown}
          type="button"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-mono text-white transition-all cursor-pointer"
        >
          <Clock size={12} className="text-zinc-400" />
          <span className="font-bold text-white">{meta.abbr}</span>
          <span className="text-[10px] text-zinc-400 font-normal hidden sm:inline">({meta.offset})</span>
          <ChevronDown size={11} className={`text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      )}

      {isOpen && createPortal(portalDropdown, document.body)}
    </div>
  );
};

export default TimezoneSelector;
