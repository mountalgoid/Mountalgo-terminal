import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Settings, Palette, Check, Monitor, Smartphone, Volume2, VolumeX,
  ShieldCheck, Layers, RotateCcw, SunMoon, Sun, Moon, Zap, Contrast, Eye,
  Mic, Play, Activity, Sliders, RefreshCw, AlertTriangle, Shield, Lock, Unlock,
  ChevronDown, ChevronUp, Sparkles, Download, Upload, FileText, CheckCircle2
} from 'lucide-react';
import { MountAlgoLogo } from './MountAlgoLogo';
import { useTheme } from '../context/ThemeContext';
import { ColorThemeName, THEME_PALETTES } from '../context/ThemeContext';
import { 
  resetTerminalWorkspace, 
  resetTerminalExceptAccounts,
  exportWorkspaceConfiguration,
  importWorkspaceConfiguration
} from '../utils/terminalPersistence';
import { 
  tradingAudio, 
  AudioProfile, 
  AudioEngineConfig, 
  VoiceGender, 
  MaleTimbre,
  ChimeStyle
} from '../utils/audioSynth';

interface AppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orientationOverride?: 'auto' | 'portrait' | 'landscape';
  onChangeOrientation?: (mode: 'auto' | 'portrait' | 'landscape') => void;
  isWorkspaceLocked?: boolean;
  onToggleWorkspaceLock?: (locked: boolean) => void;
}

const ACCENT_PRESETS = [
  { name: 'Emerald Bull', color: '#10b981' },
  { name: 'Neon Green', color: '#a1ff3b' },
  { name: 'Electric Cyan', color: '#00e5ff' },
  { name: 'Royal Indigo', color: '#5134ff' },
  { name: 'Garuda Amber', color: '#f3ba2f' },
  { name: 'Cyber Rose', color: '#ff007a' },
  { name: 'Crimson Flame', color: '#f23645' },
];

export default function AppSettingsModal({
  isOpen,
  onClose,
  orientationOverride = 'auto',
  onChangeOrientation,
  isWorkspaceLocked = false,
  onToggleWorkspaceLock,
}: AppSettingsModalProps) {
  const { 
    theme: currentTheme, 
    setTheme, 
    palette,
    isAutoOsTheme,
    setIsAutoOsTheme,
    isHighContrast,
    setIsHighContrast,
    isCustomDarkBg,
    setIsCustomDarkBg,
    customAccentColor,
    setCustomAccentColor,
    isSystemDark
  } = useTheme();

  const [audioConfig, setAudioConfig] = useState<AudioEngineConfig>(tradingAudio.getConfig());
  const [showFullResetConfirm, setShowFullResetConfirm] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importJsonText, setImportJsonText] = useState<string>('');
  const [importFeedback, setImportFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState<boolean>(false);
  const themeDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setAudioConfig(tradingAudio.getConfig());
      setShowFullResetConfirm(false);
      setShowImportModal(false);
      setImportJsonText('');
      setImportFeedback(null);
      setIsThemeDropdownOpen(false);
    }
  }, [isOpen]);

  // Click outside to close theme dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(e.target as Node)) {
        setIsThemeDropdownOpen(false);
      }
    }
    if (isThemeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isThemeDropdownOpen]);

  const updateAudio = (updates: Partial<AudioEngineConfig>) => {
    tradingAudio.setConfig(updates);
    setAudioConfig(tradingAudio.getConfig());
  };

  const handleProfileSelect = (profile: AudioProfile) => {
    tradingAudio.setAudioProfile(profile);
    setAudioConfig(tradingAudio.getConfig());
    if (profile !== 'STEALTH') {
      tradingAudio.play('PRESET');
    }
  };

  const handleVoiceGenderSelect = (gender: VoiceGender) => {
    tradingAudio.setVoiceGender(gender);
    setAudioConfig(tradingAudio.getConfig());
    // Immediately preview the selected voice
    setTimeout(() => {
      tradingAudio.speak('Order filled', true);
    }, 50);
  };

  const handleMaleTimbreSelect = (timbre: MaleTimbre) => {
    tradingAudio.setMaleTimbre(timbre);
    setAudioConfig(tradingAudio.getConfig());
    setTimeout(() => {
      tradingAudio.speak('Order filled', true);
    }, 50);
  };

  if (!isOpen) return null;

  const themes: { id: ColorThemeName; name: string; desc: string }[] = [
    { id: 'DEX Deep', name: 'DEX Deep', desc: 'Default institutional dark violet style' },
    { id: 'MountAlgo Themes', name: 'MountAlgo Classic', desc: 'Deep electric blue & sharp green' },
    { id: 'MountAlgo Neon', name: 'MountAlgo Neon', desc: 'Vibrant cyberpunk neon & magenta' },
    { id: 'MountAlgo Frost', name: 'MountAlgo Frost', desc: 'Nordic cyan ice & cool arctic blue' },
    { id: 'MountAlgo Cyber', name: 'MountAlgo Cyber', desc: 'Futuristic terminal matrix & glow' },
    { id: 'Spartan Edge Theme', name: 'Spartan Edge', desc: 'Tactical high-contrast gold & scarlet' },
    { id: 'Standard Spartan Edge Theme', name: 'Spartan Standard', desc: 'Balanced battle-tested palette' },
    { id: 'Dark ICT Theme', name: 'Dark ICT Concept', desc: 'Smart Money / Liquidity dark style' },
    { id: 'Garuda Gold', name: 'Garuda Gold', desc: 'Regal Indonesian gold & obsidian' },
    { id: 'MountAlgo Super Premium Theme', name: 'Super Premium', desc: 'Ultra luxury platinum & deep gold' },
    { id: 'Deep Sea', name: 'Deep Sea Abyss', desc: 'Navy oceanic teal & aqua glow' },
    { id: 'Gear Protocol', name: 'Gear Protocol', desc: 'Industrial amber bronze & slate' },
  ];

  const currentThemeObj = themes.find(t => t.id === currentTheme) || themes[1];
  const activePalette = THEME_PALETTES[currentTheme] || THEME_PALETTES['MountAlgo Themes'];

  return (
    <div className="fixed inset-0 z-modal-ultimate flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-3 md:p-4 animate-in fade-in duration-150 select-none">
      <div 
        className="bg-[var(--color-panel)] rounded-xl sm:rounded-xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        style={{ border: `1px solid ${palette.bull}60` }}
      >
        {/* Modal Header */}
        <div className="px-3 sm:px-5 py-2.5 sm:py-3.5 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-panel)]">
          <div className="flex items-center gap-2.5">
            <MountAlgoLogo size="sm" className="w-7 h-7" />
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[var(--color-text)] tracking-wide flex items-center gap-2">
                Pengaturan <span>𝙈𝙤𝙪𝙣𝙩𝘼𝙡𝙜𝙤</span> <span className="text-xs px-2 py-0.5 rounded font-mono font-bold" style={{ backgroundColor: `${palette.bull}20`, color: palette.bull }}>PRO</span>
              </h2>
              <p className="text-[10px] sm:text-[11px] text-[var(--color-text-muted)] hidden sm:block">Kustomisasi tema terminal universal, orientasi, dan preferensi workspace</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-1 rounded-md hover:bg-[var(--color-hover)] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3 sm:p-5 overflow-y-auto custom-scrollbar space-y-4 sm:space-y-6 text-sm text-[var(--color-text)]">
          
          {/* 1. Dynamic Accessibility, Protection & Theme Automation Controls (2-Column Balanced Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            {/* Auto OS Color Scheme Detection Card */}
            <div 
              style={{ borderColor: isAutoOsTheme ? palette.bull : 'var(--color-border)' }}
              className={`p-3 sm:p-3.5 rounded-xl border transition-all flex flex-col justify-between overflow-hidden ${
                isAutoOsTheme ? 'bg-[var(--color-card)] shadow-md' : 'bg-[var(--color-card)]/60'
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div 
                    style={{ backgroundColor: `${palette.bull}20`, color: palette.bull }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  >
                    <SunMoon size={18} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-[var(--color-text)] truncate">Auto OS Color</h4>
                    <p className="text-[10px] text-[var(--color-text-muted)] truncate">Sinkronisasi otomatis tema OS</p>
                  </div>
                </div>

                {/* Switch Toggle Button - Fixed Coordinates */}
                <button
                  type="button"
                  onClick={() => setIsAutoOsTheme(!isAutoOsTheme)}
                  style={{
                    backgroundColor: isAutoOsTheme ? palette.bull : 'var(--color-hover)',
                  }}
                  className="w-11 h-6 rounded-full relative transition-colors cursor-pointer shrink-0 p-0.5 flex items-center"
                  title={isAutoOsTheme ? "Nonaktifkan Auto OS" : "Aktifkan Auto OS"}
                >
                  <div 
                    className={`w-5 h-5 rounded-full bg-black transform transition-transform duration-200 flex items-center justify-center ${
                      isAutoOsTheme ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  >
                    {isAutoOsTheme ? (
                      isSystemDark ? <Moon size={11} className="text-white" /> : <Sun size={11} className="text-amber-400" />
                    ) : (
                      <span className="text-[8px] font-mono text-gray-400">OFF</span>
                    )}
                  </div>
                </button>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono pt-2 border-t border-[var(--color-border)]/50 text-[var(--color-text-muted)]">
                <span>Status OS: <strong className="text-[var(--color-text)]">{isSystemDark ? '🌙 Dark' : '☀️ Light'}</strong></span>
                <span className={isAutoOsTheme ? 'text-emerald-400 font-bold' : 'text-[var(--color-text-muted)]'}>
                  {isAutoOsTheme ? 'SYNC' : 'OFF'}
                </span>
              </div>
            </div>

            {/* High-Contrast Mode */}
            <div 
              style={{ borderColor: isHighContrast ? palette.bull : 'var(--color-border)' }}
              className={`p-3 sm:p-3.5 rounded-xl border transition-all flex flex-col justify-between overflow-hidden ${
                isHighContrast ? 'bg-[var(--color-card)] shadow-md' : 'bg-[var(--color-card)]/60'
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div 
                    style={{ backgroundColor: isHighContrast ? 'rgba(0,255,102,0.2)' : `${palette.bull}20`, color: isHighContrast ? '#00ff66' : palette.bull }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  >
                    <Contrast size={18} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-[var(--color-text)] truncate">Kontras Tinggi</h4>
                    <p className="text-[10px] text-[var(--color-text-muted)] truncate">Saturasi tajam sesi volatilitas</p>
                  </div>
                </div>

                {/* Switch Toggle Button - Fixed Coordinates */}
                <button
                  type="button"
                  onClick={() => setIsHighContrast(!isHighContrast)}
                  style={{
                    backgroundColor: isHighContrast ? '#00ff66' : 'var(--color-hover)',
                  }}
                  className="w-11 h-6 rounded-full relative transition-colors cursor-pointer shrink-0 p-0.5 flex items-center"
                  title={isHighContrast ? "Nonaktifkan Kontras Tinggi" : "Aktifkan Kontras Tinggi"}
                >
                  <div 
                    className={`w-5 h-5 rounded-full bg-black transform transition-transform duration-200 flex items-center justify-center ${
                      isHighContrast ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  >
                    <Zap size={11} style={{ color: isHighContrast ? '#00ff66' : '#94a3b8' }} />
                  </div>
                </button>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono pt-2 border-t border-[var(--color-border)]/50 text-[var(--color-text-muted)]">
                <span>Visual: <strong className="text-[var(--color-text)]">{isHighContrast ? 'Saturasi Tajam' : 'Standar'}</strong></span>
                <span className={isHighContrast ? 'text-emerald-400 font-bold' : 'text-[var(--color-text-muted)]'}>
                  {isHighContrast ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>

            {/* Custom Obsidian Dark Background #242119 */}
            <div 
              style={{ borderColor: isCustomDarkBg ? '#d4af37' : 'var(--color-border)' }}
              className={`p-3 sm:p-3.5 rounded-xl border transition-all flex flex-col justify-between overflow-hidden ${
                isCustomDarkBg ? 'bg-[var(--color-card)] shadow-md' : 'bg-[var(--color-card)]/60'
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div 
                    style={{ backgroundColor: '#242119', border: '1px solid #d4af37' }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-inner"
                  >
                    <div className="w-3.5 h-3.5 rounded-full bg-[#d4af37]/80" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-[var(--color-text)] truncate">Background #242119</h4>
                    <p className="text-[10px] text-[var(--color-text-muted)] truncate">Obsidian dark global canvas</p>
                  </div>
                </div>

                {/* Switch Toggle Button - Fixed Coordinates */}
                <button
                  type="button"
                  onClick={() => setIsCustomDarkBg(!isCustomDarkBg)}
                  style={{
                    backgroundColor: isCustomDarkBg ? '#d4af37' : 'var(--color-hover)',
                  }}
                  className="w-11 h-6 rounded-full relative transition-colors cursor-pointer shrink-0 p-0.5 flex items-center"
                  title={isCustomDarkBg ? "Gunakan Background Standar" : "Aktifkan Obsidian #242119"}
                >
                  <div 
                    className={`w-5 h-5 rounded-full bg-black transform transition-transform duration-200 flex items-center justify-center ${
                      isCustomDarkBg ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  >
                    <div 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: isCustomDarkBg ? '#d4af37' : '#94a3b8' }} 
                    />
                  </div>
                </button>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono pt-2 border-t border-[var(--color-border)]/50 text-[var(--color-text-muted)]">
                <span>Warna Base: <strong className="text-[#d4af37] font-bold">#242119</strong></span>
                <span className={isCustomDarkBg ? 'text-amber-400 font-bold' : 'text-[var(--color-text-muted)]'}>
                  {isCustomDarkBg ? 'AKTIF' : 'OFF'}
                </span>
              </div>
            </div>

            {/* Lock Workspace Card */}
            <div 
              style={{ borderColor: isWorkspaceLocked ? '#f59e0b' : 'var(--color-border)' }}
              className={`p-3 sm:p-3.5 rounded-xl border transition-all flex flex-col justify-between overflow-hidden ${
                isWorkspaceLocked ? 'bg-[var(--color-card)] shadow-md' : 'bg-[var(--color-card)]/60'
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div 
                    style={{ 
                      backgroundColor: isWorkspaceLocked ? 'rgba(245, 158, 11, 0.2)' : `${palette.bull}20`, 
                      color: isWorkspaceLocked ? '#f59e0b' : palette.bull 
                    }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  >
                    {isWorkspaceLocked ? <Lock size={18} /> : <Unlock size={18} />}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-[var(--color-text)] flex items-center gap-1.5 truncate">
                      <span className="truncate">Lock Workspace</span>
                      {isWorkspaceLocked && (
                        <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 font-bold shrink-0">
                          LOCK
                        </span>
                      )}
                    </h4>
                    <p className="text-[10px] text-[var(--color-text-muted)] truncate">Kunci posisi & penutup widget</p>
                  </div>
                </div>

                {/* Switch Toggle Button - Fixed Coordinates */}
                <button
                  type="button"
                  onClick={() => onToggleWorkspaceLock?.(!isWorkspaceLocked)}
                  style={{
                    backgroundColor: isWorkspaceLocked ? '#f59e0b' : 'var(--color-hover)',
                  }}
                  className="w-11 h-6 rounded-full relative transition-colors cursor-pointer shrink-0 p-0.5 flex items-center"
                  title={isWorkspaceLocked ? "Buka Kunci Workspace" : "Kunci Workspace"}
                >
                  <div 
                    className={`w-5 h-5 rounded-full bg-black transform transition-transform duration-200 flex items-center justify-center ${
                      isWorkspaceLocked ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  >
                    {isWorkspaceLocked ? (
                      <Lock size={11} className="text-amber-400" />
                    ) : (
                      <Unlock size={11} className="text-gray-400" />
                    )}
                  </div>
                </button>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono pt-2 border-t border-[var(--color-border)]/50 text-[var(--color-text-muted)]">
                <span>Proteksi: <strong className="text-[var(--color-text)]">{isWorkspaceLocked ? 'Terkunci' : 'Bebas'}</strong></span>
                <span className={isWorkspaceLocked ? 'text-amber-400 font-bold' : 'text-[var(--color-text-muted)]'}>
                  {isWorkspaceLocked ? 'LOCKED' : 'UNLOCKED'}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Theme Selection Dropdown Section (Clean Institutional Dropdown) */}
          <div className="pt-2">
            <div 
              className="flex items-center justify-between mb-2 font-bold text-xs uppercase tracking-wider"
              style={{ color: palette.bull }}
            >
              <div className="flex items-center gap-2">
                <Palette size={15} /> Pilih Tema Warna Terminal
              </div>
              {isAutoOsTheme && (
                <span className="text-[10px] normal-case text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                  (Auto OS Aktif - Memilih tema akan menonaktifkan Auto OS)
                </span>
              )}
            </div>

            {/* Custom High-Precision Theme Dropdown */}
            <div className="relative" ref={themeDropdownRef}>
              <button
                type="button"
                onClick={() => setIsThemeDropdownOpen(prev => !prev)}
                className="w-full flex items-center justify-between p-3 rounded-xl border bg-[var(--color-card)] hover:bg-[var(--color-hover)] text-left transition-all cursor-pointer shadow-sm"
                style={{
                  borderColor: isThemeDropdownOpen ? palette.bull : 'var(--color-border)',
                  boxShadow: isThemeDropdownOpen ? `0 0 0 2px ${palette.bull}30` : undefined,
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Active Theme Color Swatches */}
                  <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-[var(--color-panel)] border border-[var(--color-border)] shrink-0">
                    <span className="w-3.5 h-3.5 rounded-full border border-black/30 shadow-inner" style={{ backgroundColor: activePalette.bull }} title="Bull / Long" />
                    <span className="w-3.5 h-3.5 rounded-full border border-black/30 shadow-inner" style={{ backgroundColor: activePalette.bear }} title="Bear / Short" />
                    <span className="w-3.5 h-3.5 rounded-full border border-black/30 shadow-inner" style={{ backgroundColor: activePalette.poc }} title="POC Magnet" />
                    <span className="w-3.5 h-3.5 rounded-full border border-black/30 shadow-inner" style={{ backgroundColor: activePalette.dark }} title="Base Canvas" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[var(--color-text)] truncate">{currentThemeObj.name}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold" style={{ backgroundColor: `${activePalette.bull}20`, color: activePalette.bull }}>
                        AKTIF
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--color-text-muted)] truncate">{currentThemeObj.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <ChevronDown 
                    size={16} 
                    className={`text-[var(--color-text-muted)] transition-transform duration-200 ${isThemeDropdownOpen ? 'rotate-180 text-[var(--color-bull)]' : ''}`} 
                  />
                </div>
              </button>

              {/* Dropdown Menu Popover */}
              {isThemeDropdownOpen && (
                <div 
                  className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-72 overflow-y-auto custom-scrollbar rounded-xl border bg-[var(--color-panel)] shadow-2xl p-1.5 space-y-1 animate-in fade-in duration-100"
                  style={{ borderColor: `${palette.bull}60` }}
                >
                  {themes.map((th) => {
                    const itemPalette = THEME_PALETTES[th.id];
                    const isSelected = currentTheme === th.id;
                    return (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => {
                          if (isAutoOsTheme) setIsAutoOsTheme(false);
                          setTheme(th.id);
                          setIsThemeDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[var(--color-card)] text-[var(--color-text)] font-semibold shadow-sm'
                            : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)]'
                        }`}
                        style={isSelected ? { borderColor: itemPalette.bull } : {}}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* 4 Swatches */}
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="w-2.5 h-2.5 rounded-full border border-black/30" style={{ backgroundColor: itemPalette.bull }} />
                            <span className="w-2.5 h-2.5 rounded-full border border-black/30" style={{ backgroundColor: itemPalette.bear }} />
                            <span className="w-2.5 h-2.5 rounded-full border border-black/30" style={{ backgroundColor: itemPalette.poc }} />
                            <span className="w-2.5 h-2.5 rounded-full border border-black/30" style={{ backgroundColor: itemPalette.dark }} />
                          </div>

                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-[var(--color-text)] truncate">{th.name}</div>
                            <div className="text-[10px] text-[var(--color-text-muted)] truncate">{th.desc}</div>
                          </div>
                        </div>

                        {isSelected && (
                          <span 
                            className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 ml-2"
                            style={{ backgroundColor: itemPalette.bull, color: '#000000' }}
                          >
                            <Check size={11} strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Active Theme Color Swatch Bar Preview Card */}
            <div className="mt-2.5 p-3 rounded-xl bg-[var(--color-card)]/70 border border-[var(--color-border)] flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider shrink-0">Palet Hex:</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--color-panel)] border border-[var(--color-border)] font-mono text-[10px]">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: activePalette.bull }} />
                    <span className="text-[var(--color-text)] font-semibold">Bull: {activePalette.bull}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--color-panel)] border border-[var(--color-border)] font-mono text-[10px]">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: activePalette.bear }} />
                    <span className="text-[var(--color-text)] font-semibold">Bear: {activePalette.bear}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--color-panel)] border border-[var(--color-border)] font-mono text-[10px]">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: activePalette.poc }} />
                    <span className="text-[var(--color-text)] font-semibold">POC: {activePalette.poc}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--color-panel)] border border-[var(--color-border)] font-mono text-[10px]">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: activePalette.dark }} />
                    <span className="text-[var(--color-text)] font-semibold">Base: {activePalette.dark}</span>
                  </div>
                </div>
              </div>

              <div className="text-[10px] font-mono text-[var(--color-text-muted)] shrink-0 ml-auto">
                Status: <strong className="text-[var(--color-text)]">{activePalette.dark === '#ffffff' ? '☀️ Light Mode' : '🌙 Dark Mode'}</strong>
              </div>
            </div>

            {/* Custom Accent Color Harmonizer (WCAG AAA) */}
            <div className="mt-3 p-3.5 rounded-xl bg-[var(--color-card)]/80 border border-[var(--color-border)] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} style={{ color: palette.bull }} />
                  <span className="text-xs font-bold text-[var(--color-text)] uppercase tracking-wider">
                    Harmonisasi Warna Aksen Kustom (WCAG AAA)
                  </span>
                </div>
                {customAccentColor && (
                  <button
                    type="button"
                    onClick={() => setCustomAccentColor(null)}
                    className="text-[10px] font-mono text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw size={10} /> Reset Aksen
                  </button>
                )}
              </div>

              <p className="text-[11px] text-[var(--color-text-muted)]">
                Kustomisasi warna utama tombol, chart highlight, order flow bar, dan glow indikator terminal.
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {ACCENT_PRESETS.map((preset) => {
                  const isCurrent = customAccentColor?.toLowerCase() === preset.color.toLowerCase() || (!customAccentColor && palette.bull.toLowerCase() === preset.color.toLowerCase());
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setCustomAccentColor(preset.color)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                        isCurrent
                          ? 'border-[var(--color-text)] bg-[var(--color-panel)] font-bold text-[var(--color-text)] shadow-sm'
                          : 'border-[var(--color-border)] bg-[var(--color-panel)]/50 text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full border border-black/30 shadow-inner shrink-0" style={{ backgroundColor: preset.color }} />
                      <span>{preset.name}</span>
                      {isCurrent && <Check size={11} className="text-emerald-400" />}
                    </button>
                  );
                })}

                {/* Custom Color Input Picker */}
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] text-xs font-mono">
                  <input
                    type="color"
                    value={customAccentColor || palette.bull}
                    onChange={(e) => setCustomAccentColor(e.target.value)}
                    className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
                    title="Pilih Warna Kustom"
                  />
                  <input
                    type="text"
                    value={customAccentColor || palette.bull}
                    onChange={(e) => {
                      if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                        setCustomAccentColor(e.target.value);
                      }
                    }}
                    placeholder="#10b981"
                    className="w-16 bg-transparent text-[11px] text-[var(--color-text)] font-mono outline-none uppercase"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Institutional Audio & Voice Alert Matrix */}
          <div className="pt-4 border-t border-[var(--color-border)] space-y-3">
            <div 
              className="flex items-center justify-between font-bold text-xs uppercase tracking-wider"
              style={{ color: palette.bull }}
            >
              <div className="flex items-center gap-2">
                <Volume2 size={16} /> Audio & Voice Alert Matrix (Hedge-Fund Grade)
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text-muted)]">
                Active: <strong className="text-[var(--color-text)]">{audioConfig.profile}</strong>
              </span>
            </div>

            {/* Audio Profile Dropdown Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider block">
                Pilih Profil Audio Terminal:
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={audioConfig.profile}
                  onChange={(e) => handleProfileSelect(e.target.value as AudioProfile)}
                  className="flex-1 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl px-3 py-2.5 text-xs text-[var(--color-text)] font-semibold outline-none cursor-pointer hover:border-[var(--color-bull)] transition-colors min-w-0"
                  style={{ accentColor: palette.bull }}
                >
                  <option value="INSTITUTIONAL">🏛️ Institutional Profile (Voice Prompts + Harmonic Chimes)</option>
                  <option value="VOICE_ONLY">🗣️ Voice Only (Speech Verbal Alerts Tanpa Chimes)</option>
                  <option value="CHIME_ONLY">🔔 Chimes Only (Harmonic Tones & Akustik Elegan)</option>
                  <option value="SCALPER_TURBO">⚡ Scalper Turbo (Eksekusi Cepat & Reaktif)</option>
                  <option value="STEALTH">🔕 Stealth Mode (Hening Total / All Muted)</option>
                </select>
                <button
                  type="button"
                  onClick={() => {
                    if (audioConfig.profile !== 'STEALTH') {
                      tradingAudio.play('PRESET');
                    }
                  }}
                  className="px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-hover)] text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer text-[var(--color-text)] transition-colors"
                  title="Test Chime Profil"
                >
                  <Play size={12} style={{ color: palette.bull }} />
                  <span>Test Chime</span>
                </button>
              </div>
            </div>

            {/* Voice Gender & Timbre Dropdowns */}
            <div className="p-3.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                    <Mic size={13} style={{ color: palette.bull }} /> Karakter Suara Alert (Voice Engine):
                  </label>
                  <select
                    value={audioConfig.voiceGender}
                    onChange={(e) => handleVoiceGenderSelect(e.target.value as VoiceGender)}
                    className="w-full bg-[var(--color-panel)] border border-[var(--color-border)] rounded-xl px-3 py-2.5 text-xs text-[var(--color-text)] font-semibold outline-none cursor-pointer hover:border-[var(--color-bull)] transition-colors"
                  >
                    <option value="MALE">👨 Suara Laki-Laki (Baritone Tebal & Berwibawa)</option>
                    <option value="FEMALE">👩 Suara Perempuan (Artikulasi Jernih & Presisi Tinggi)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider block mb-1.5">
                    Timbre Suara {audioConfig.voiceGender === 'MALE' ? 'Laki-Laki' : 'Perempuan'}:
                  </label>
                  {audioConfig.voiceGender === 'MALE' ? (
                    <select
                      value={audioConfig.maleTimbre || 'DEEP_BARITONE'}
                      onChange={(e) => handleMaleTimbreSelect(e.target.value as MaleTimbre)}
                      className="w-full bg-[var(--color-panel)] border border-[var(--color-border)] rounded-xl px-3 py-2.5 text-xs text-[var(--color-text)] font-semibold outline-none cursor-pointer hover:border-[var(--color-bull)] transition-colors"
                    >
                      <option value="WALL_STREET_HEAVY">🏛️ Heavy Bass (Sangat Tebal, 0.64x Pitch)</option>
                      <option value="DEEP_BARITONE">🎙️ Deep Baritone (Tebal & Mantap, 0.72x Pitch)</option>
                      <option value="TACTICAL_OFFICER">⚡ Tactical Officer (Tegas Cepat, 0.80x Pitch)</option>
                    </select>
                  ) : (
                    <div className="w-full bg-[var(--color-panel)]/60 border border-[var(--color-border)] rounded-xl px-3 py-2.5 text-xs text-[var(--color-text-muted)] font-mono flex items-center justify-between">
                      <span>Artikulasi Jernih (1.08x)</span>
                      <span className="text-emerald-400 font-bold">Standard Pro</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Volume Sliders Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)]">
              {/* Voice Prompt Volume */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="flex items-center gap-1.5 text-[var(--color-text)] font-semibold">
                    <Mic size={13} style={{ color: palette.bull }} /> Voice Prompt Volume
                  </span>
                  <span className="font-mono text-[11px] text-[var(--color-text-muted)]">
                    {Math.round(audioConfig.voiceVolume * 100)}%
                  </span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={audioConfig.voiceVolume}
                  onChange={(e) => updateAudio({ voiceVolume: parseFloat(e.target.value) })}
                  className="w-full accent-[var(--color-bull)] cursor-pointer h-1.5 bg-[var(--color-border)] rounded-lg"
                />
              </div>

              {/* Harmonic Chimes Volume */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="flex items-center gap-1.5 text-[var(--color-text)] font-semibold">
                    <Volume2 size={13} style={{ color: palette.bull }} /> Chimes & FX Volume
                  </span>
                  <span className="font-mono text-[11px] text-[var(--color-text-muted)]">
                    {Math.round(audioConfig.chimeVolume * 100)}%
                  </span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={audioConfig.chimeVolume}
                  onChange={(e) => updateAudio({ chimeVolume: parseFloat(e.target.value) })}
                  className="w-full accent-[var(--color-bull)] cursor-pointer h-1.5 bg-[var(--color-border)] rounded-lg"
                />
              </div>
            </div>

            {/* Speech Test Bench & Trigger Controls (Clean Aligned Coordinates) */}
            <div className="p-3.5 rounded-xl bg-[var(--color-card)]/60 border border-[var(--color-border)] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <span className="text-[11px] font-semibold text-[var(--color-text-muted)] flex items-center gap-1.5">
                  <Sliders size={13} style={{ color: palette.bull }} /> Uji Coba Suara Alert Prompt:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => tradingAudio.play('ORDER_FILLED')}
                    className="px-2.5 py-1.5 rounded-lg bg-[var(--color-box-bull)] text-[var(--color-bull)] border border-[var(--color-bull)]/40 hover:opacity-90 text-[10px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 whitespace-nowrap"
                  >
                    <Play size={10} /> Order Filled
                  </button>
                  <button
                    type="button"
                    onClick={() => tradingAudio.play('TAKE_PROFIT')}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:opacity-90 text-[10px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 whitespace-nowrap"
                  >
                    <Play size={10} /> Take Profit
                  </button>
                  <button
                    type="button"
                    onClick={() => tradingAudio.play('STOP_LOSS')}
                    className="px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:opacity-90 text-[10px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 whitespace-nowrap"
                  >
                    <Play size={10} /> Stop Loss
                  </button>
                  <button
                    type="button"
                    onClick={() => tradingAudio.play('ORDER_CANCELLED')}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:opacity-90 text-[10px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 whitespace-nowrap"
                  >
                    <Play size={10} /> Cancelled
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2.5 border-t border-[var(--color-border)]/60 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[var(--color-text-muted)] font-mono">Pitch / Ketebalan:</span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="range"
                      min="0.50"
                      max="1.30"
                      step="0.02"
                      value={audioConfig.voicePitch ?? (audioConfig.voiceGender === 'MALE' ? 0.72 : 1.08)}
                      onChange={(e) => updateAudio({ voicePitch: parseFloat(e.target.value) })}
                      className="w-24 accent-[var(--color-bull)] cursor-pointer h-1.5 bg-[var(--color-border)] rounded-lg"
                    />
                    <span className="font-mono text-[11px] text-[var(--color-bull)] font-bold w-10 text-right">
                      {(audioConfig.voicePitch ?? (audioConfig.voiceGender === 'MALE' ? 0.72 : 1.08)).toFixed(2)}x
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[var(--color-text-muted)] font-mono">Cadence (Kecepatan):</span>
                  <select 
                    value={audioConfig.voiceRate}
                    onChange={(e) => updateAudio({ voiceRate: parseFloat(e.target.value) })}
                    className="bg-[var(--color-panel)] border border-[var(--color-border)] rounded-lg px-2.5 py-1 text-[11px] font-mono text-[var(--color-text)] outline-none cursor-pointer"
                  >
                    <option value={0.95}>Deliberate (0.95x)</option>
                    <option value={1.0}>Standard (1.00x)</option>
                    <option value={1.05}>Crisp (1.05x)</option>
                    <option value={1.25}>Rapid Desk (1.25x)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Per-Widget Audio Chime Routing */}
            <div className="p-3.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity size={14} style={{ color: palette.bull }} />
                  <span className="text-xs font-bold text-[var(--color-text)] uppercase tracking-wider">
                    Per-Widget Audio Chime Routing
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
                  Akustik Audio per Modul
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { key: 'orderBook' as const, label: 'Order Book Depth', icon: '📊' },
                  { key: 'heatmap' as const, label: 'Liquidity Heatmap', icon: '🌊' },
                  { key: 'chart' as const, label: 'Price Chart & Candles', icon: '📈' },
                  { key: 'tape' as const, label: 'Time & Sales Tape', icon: '⚡' },
                ].map(({ key, label, icon }) => {
                  const currentStyle = audioConfig.widgetChimes?.[key] || 'CRYSTAL_PING';
                  return (
                    <div 
                      key={key}
                      className="p-2.5 rounded-lg bg-[var(--color-panel)] border border-[var(--color-border)] flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold text-[var(--color-text)] truncate flex items-center gap-1.5">
                          <span>{icon}</span>
                          <span className="truncate">{label}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <select
                          value={currentStyle}
                          onChange={(e) => {
                            const newStyle = e.target.value as ChimeStyle;
                            tradingAudio.setWidgetChime(key, newStyle);
                            setAudioConfig(tradingAudio.getConfig());
                            tradingAudio.playChimeStyle(newStyle);
                          }}
                          className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-md px-2 py-1 text-[10px] font-mono text-[var(--color-text)] outline-none cursor-pointer"
                        >
                          <option value="CRYSTAL_PING">💎 Crystal Ping</option>
                          <option value="DEEP_PULSE">🌊 Deep Pulse</option>
                          <option value="HARMONIC_BELL">🔔 Harmonic Bell</option>
                          <option value="TACTICAL_CLICK">🎯 Tactical Click</option>
                          <option value="SUB_BASS">🔊 Sub Bass</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => tradingAudio.playWidgetChime(key)}
                          className="p-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-hover)] cursor-pointer text-[var(--color-text)]"
                          title="Uji Chime Widget"
                        >
                          <Play size={10} style={{ color: palette.bull }} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 4. Workspace & Layout Orientation (Dropdown Selector) */}
          {onChangeOrientation && (
            <div className="pt-4 border-t border-[var(--color-border)] space-y-2.5">
              <div 
                className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider"
                style={{ color: palette.bull }}
              >
                <Monitor size={15} /> Preferensi Orientasi & Tampilan
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-center">
                <div className="sm:col-span-2">
                  <select
                    value={orientationOverride}
                    onChange={(e) => onChangeOrientation(e.target.value as 'auto' | 'portrait' | 'landscape')}
                    className="w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl px-3 py-2.5 text-xs text-[var(--color-text)] font-semibold outline-none cursor-pointer hover:border-[var(--color-bull)] transition-colors"
                  >
                    <option value="auto">🧭 Auto Detect (Ikuti Orientasi Layar / Perangkat Otomatis)</option>
                    <option value="portrait">📱 Mode Portrait (Layout Vertikal Bertingkat)</option>
                    <option value="landscape">🖥️ Mode Landscape (Layout Horizontal Multi-Grid)</option>
                  </select>
                </div>

                <div className="p-2.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[var(--color-text-muted)]">Mode Aktif:</span>
                  <span className="font-mono font-bold px-2 py-0.5 rounded text-[10px] bg-[var(--color-panel)] text-[var(--color-bull)] border border-[var(--color-border)] uppercase">
                    {orientationOverride}
                  </span>
                </div>
              </div>

              {/* Workspace Lock Info Banner */}
              <div 
                style={{ 
                  backgroundColor: isWorkspaceLocked ? 'rgba(245, 158, 11, 0.1)' : 'var(--color-card)',
                  borderColor: isWorkspaceLocked ? 'rgba(245, 158, 11, 0.4)' : 'var(--color-border)' 
                }}
                className="p-3 rounded-xl border flex items-center justify-between gap-3 overflow-hidden"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-1.5 rounded-lg shrink-0 ${isWorkspaceLocked ? 'bg-amber-500/20 text-amber-400' : 'bg-white/10 text-gray-400'}`}>
                    {isWorkspaceLocked ? <Lock size={15} /> : <Unlock size={15} />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[var(--color-text)] flex items-center gap-1.5">
                      <span>Proteksi Layout: {isWorkspaceLocked ? 'Terkunci (Locked)' : 'Tidak Terkunci'}</span>
                    </div>
                    <div className="text-[10px] text-[var(--color-text-muted)] line-clamp-1">
                      {isWorkspaceLocked 
                        ? 'Penggeseran pembagi & tombol penutup widget dinonaktifkan.'
                        : 'Panel dapat diubah ukurannya dan ditutup secara leluasa.'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleWorkspaceLock?.(!isWorkspaceLocked)}
                  className={`text-[10px] font-mono font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors shrink-0 ${
                    isWorkspaceLocked 
                      ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/40' 
                      : 'bg-[var(--color-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] border border-[var(--color-border)]'
                  }`}
                >
                  {isWorkspaceLocked ? 'Buka Kunci' : 'Kunci Workspace'}
                </button>
              </div>
            </div>
          )}

          {/* 5. Workspace Configuration Backup & Synchronization (JSON Export/Import) */}
          <div className="pt-4 border-t border-[var(--color-border)] space-y-2.5">
            <div 
              className="flex items-center justify-between font-bold text-xs uppercase tracking-wider"
              style={{ color: palette.bull }}
            >
              <div className="flex items-center gap-2">
                <FileText size={15} /> Cadangan & Sinkronisasi Workspace (JSON)
              </div>
              <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
                Portable Workspace State
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-[var(--color-text)]">
                  Ekspor & Impor Profil Terminal
                </div>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  Simpan seluruh tema, tata letak, audio routing, dan preset chart sebagai file JSON untuk dibagikan atau dipindahkan ke perangkat lain.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const jsonStr = exportWorkspaceConfiguration();
                    const blob = new Blob([jsonStr], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `mountalgo-terminal-workspace-${new Date().toISOString().slice(0, 10)}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] hover:bg-[var(--color-hover)] text-xs font-semibold text-[var(--color-text)] flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Download size={13} style={{ color: palette.bull }} />
                  <span>Ekspor JSON</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(true);
                    setImportFeedback(null);
                    setImportJsonText('');
                  }}
                  className="px-3 py-2 rounded-lg border border-[var(--color-bull)]/40 bg-[var(--color-box-bull)] text-[var(--color-bull)] hover:opacity-90 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Upload size={13} />
                  <span>Impor JSON</span>
                </button>
              </div>
            </div>
          </div>

          {/* 6. Terminal Maintenance & Full Reset (Preserving Trading Accounts) */}
          <div className="pt-4 border-t border-[var(--color-border)]">
            <div 
              className="flex items-center gap-2 mb-2 font-bold text-xs uppercase tracking-wider"
              style={{ color: palette.bull }}
            >
              <RefreshCw size={15} /> Pemulihan & Atur Ulang Terminal
            </div>

            <div className="p-3 sm:p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[var(--color-panel)] border border-[var(--color-border)] text-[var(--color-bull)] shrink-0">
                  <ShieldCheck size={20} style={{ color: palette.bull }} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs text-[var(--color-text)]">Atur Ulang Lengkap (Kecuali Akun Trading)</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                      🛡️ Akun Aman
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 leading-relaxed">
                    Kembalikan tema, layout widget, preset chart, gambar indikator, audio synth, dan hotkey ke setelan awal pabrik. 
                    <strong className="text-[var(--color-text)]"> Semua akun trading, saldo, open position, dan histori Anda 100% aman dan tidak dihapus.</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowFullResetConfirm(true)}
                className="px-3.5 py-2 rounded-lg border border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
              >
                <RotateCcw size={14} />
                <span>Atur Ulang Lengkap</span>
              </button>
            </div>
          </div>

          {/* 7. System & Engine Specs */}
          <div className="pt-4 border-t border-[var(--color-border)] flex items-center justify-between text-xs text-[var(--color-text-muted)]">
            <div className="flex items-center gap-2">
              <span>𝙈𝙤𝙪𝙣𝙩𝘼𝙡𝙜𝙤</span> <span>Engine V5.17 Pro Core Active</span>
            </div>
            <span className="font-mono text-[11px] text-gray-500">
              {isHighContrast ? '⚡ High-Contrast Active' : 'Standard Contrast'}
            </span>
          </div>
        </div>

        {/* JSON Import Modal Dialog */}
        {showImportModal && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-[var(--color-panel)] border border-[var(--color-border)] rounded-xl p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--color-text)]">
                  <Upload size={16} style={{ color: palette.bull }} />
                  <span>Impor Konfigurasi Workspace JSON</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="p-1 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-[var(--color-text-muted)]">
                  Tempelkan string JSON hasil ekspor atau unggah file konfigurasi workspace (.json):
                </p>

                {/* File Upload Trigger */}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const content = event.target?.result as string;
                          if (content) {
                            setImportJsonText(content);
                          }
                        };
                        reader.readAsText(file);
                      }
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 px-3 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-hover)] text-xs font-semibold text-[var(--color-text)] flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Upload size={14} style={{ color: palette.bull }} />
                    <span>Pilih File .JSON dari Perangkat</span>
                  </button>
                </div>

                {/* JSON Textarea */}
                <textarea
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder='{"version": 1, "theme": "CYBERPUNK", ...}'
                  rows={6}
                  className="w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-3 text-xs font-mono text-[var(--color-text)] outline-none focus:border-[var(--color-bull)] resize-none"
                />

                {importFeedback && (
                  <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                    importFeedback.success 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-red-500/10 text-red-400 border border-red-500/30'
                  }`}>
                    {importFeedback.success ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                    <span>{importFeedback.message}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-xs font-semibold cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={!importJsonText.trim()}
                  onClick={() => {
                    const result = importWorkspaceConfiguration(importJsonText);
                    if (result.success) {
                      setImportFeedback({ success: true, message: 'Konfigurasi berhasil diterapkan! Memuat ulang terminal...' });
                      setTimeout(() => {
                        setShowImportModal(false);
                        window.location.reload();
                      }, 800);
                    } else {
                      setImportFeedback({ success: false, message: result.message || 'Format JSON tidak valid' });
                    }
                  }}
                  style={{ backgroundColor: palette.bull, color: '#000000' }}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <Check size={13} />
                  <span>Terapkan Konfigurasi</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Full Reset Confirmation Dialog */}
        {showFullResetConfirm && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[var(--color-panel)] border border-red-500/50 rounded-xl p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3 text-red-400 mb-3 font-bold text-sm">
                <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/30">
                  <AlertTriangle size={20} />
                </div>
                <span>Konfirmasi Atur Ulang Lengkap</span>
              </div>

              <div className="space-y-2 text-xs text-[var(--color-text-muted)] mb-4">
                <p className="text-[var(--color-text)] font-semibold">
                  Apakah Anda yakin ingin mengatur ulang seluruh konfigurasi terminal ke setelan default pabrik?
                </p>
                <div className="p-2.5 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-[11px]">
                    <ShieldCheck size={14} />
                    <span>TIDAK DIHAPUS (100% AMAN):</span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] pl-1 text-[var(--color-text)]">
                    <li>Akun Trading Broker & Simulasi Demo</li>
                    <li>Saldo Akun, Equity & Margin</li>
                    <li>Semua Posisi Trading Aktif & Riwayat Transaksi</li>
                  </ul>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold text-[11px]">
                    <RefreshCw size={14} />
                    <span>YANG DIATUR ULANG KE DEFAULT:</span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] pl-1 text-[var(--color-text-muted)]">
                    <li>Tema & Kontras Tampilan</li>
                    <li>Tata Letak Widget & Orientasi Multi-Chart</li>
                    <li>Konfigurasi Karakter Suara & Audio Synth</li>
                    <li>Preset Volume, Hotkey & Sinkronisasi Crosshair</li>
                    <li>Cache Gambar Indikator Chart</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowFullResetConfirm(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-xs font-semibold cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetTerminalExceptAccounts();
                    setShowFullResetConfirm(false);
                    window.location.reload();
                  }}
                  className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer transition-colors shadow-lg flex items-center gap-1.5"
                >
                  <RotateCcw size={13} />
                  <span>Ya, Atur Ulang Sekarang</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-3 sm:px-5 py-2.5 sm:py-3 border-t border-[var(--color-border)] bg-[var(--color-panel)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFullResetConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-mono transition-colors cursor-pointer"
              title="Atur ulang seluruh pengaturan terminal kecuali akun trading"
            >
              <RotateCcw size={13} />
              <span className="hidden sm:inline">Atur Ulang Lengkap (Kecuali Akun)</span>
              <span className="sm:hidden">Reset Lengkap</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ backgroundColor: palette.bull, color: '#000000' }}
            className="px-5 py-1.5 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-md"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
