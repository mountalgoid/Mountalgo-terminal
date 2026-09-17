import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Globe, ChevronDown, Check, Clock } from 'lucide-react';
import { TIMEZONE_OPTIONS, setStoredTimezone, getStoredTimezone, getTimezoneMeta, TimeZoneOption } from '../utils/timezone';
import { tradingAudio } from '../utils/audioSynth';

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
      }}
      className="bg-[#090d16]/98 border border-cyan-500/50 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.95),0_0_25px_rgba(6,182,212,0.3)] z-[100000] overflow-hidden backdrop-blur-3xl animate-in fade-in zoom-in-95 duration-150 font-sans pointer-events-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-3.5 py-2.5 bg-gradient-to-r from-cyan-950/80 to-blue-950/60 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-300">
          <Globe size={14} className="text-cyan-400 animate-pulse" />
          <span>ZONA WAKTU TAMPILAN</span>
        </div>
        <span className="text-[9px] font-mono text-cyan-200 bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-500/30">
          {meta.abbr} ({meta.offset})
        </span>
      </div>

      <div className="max-h-64 overflow-y-auto p-1.5 space-y-1 divide-y divide-white/5 font-mono text-xs">
        {TIMEZONE_OPTIONS.map(tz => {
          const isSelected = currentTz === tz.id;
          const dynamicMeta = getTimezoneMeta(tz.id);
          return (
            <button
              key={tz.id}
              onClick={(e) => handleSelect(tz, e)}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-all text-left cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-r from-cyan-500/25 to-blue-500/25 text-white border border-cyan-500/50 font-bold shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                  : 'text-zinc-300 hover:text-white hover:bg-white/10 border border-transparent'
              }`}
            >
              <div className="flex flex-col pr-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${isSelected ? 'text-cyan-300' : 'text-zinc-200'}`}>
                    {tz.abbr}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950/90 text-cyan-400 border border-cyan-800/50 font-semibold">
                    {dynamicMeta.offset}
                  </span>
                  {tz.session && (
                    <span className="text-[9px] text-amber-400/90 font-semibold">
                      [{tz.session}]
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">
                  {tz.label}
                </span>
              </div>

              {isSelected && (
                <div className="shrink-0 text-cyan-400 bg-cyan-500/20 p-1 rounded-full">
                  <Check size={12} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="px-3 py-2 bg-black/60 border-t border-white/10 text-[9.5px] font-mono text-zinc-400 flex items-center justify-between">
        <span>Seluruh berita & kalender berkalibrasi otomatis</span>
        <span className="text-cyan-400 font-bold">{meta.abbr}</span>
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
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 hover:text-white border border-cyan-500/40 text-xs font-mono font-bold transition-all cursor-pointer shadow-sm hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] active:scale-95"
          title="Klik Untuk Ubah Zona Waktu Global"
        >
          <Globe size={13} className="text-cyan-400 animate-pulse" />
          <span>{meta.abbr}</span>
          <span className="text-[10px] opacity-75">({meta.offset})</span>
          <ChevronDown size={12} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      ) : variant === 'full' ? (
        <button
          ref={buttonRef}
          onClick={toggleDropdown}
          type="button"
          className="w-full flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/40 text-white text-xs font-mono transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2 text-left">
            <Globe size={15} className="text-cyan-400 shrink-0" />
            <div>
              <div className="font-bold flex items-center gap-1.5">
                <span>{meta.abbr}</span>
                <span className="text-[10px] text-cyan-400 font-normal">({meta.offset})</span>
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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-cyan-500/30 text-xs font-mono text-cyan-300 hover:text-white transition-all cursor-pointer"
        >
          <Clock size={13} className="text-cyan-400" />
          <span className="font-bold">{meta.abbr}</span>
          <span className="text-[10px] text-cyan-400/80 font-normal hidden sm:inline">({meta.offset})</span>
          <ChevronDown size={12} className={`text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      )}

      {isOpen && createPortal(portalDropdown, document.body)}
    </div>
  );
};

export default TimezoneSelector;
