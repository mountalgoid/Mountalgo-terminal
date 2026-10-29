import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { 
  getStoredTheme, 
  saveTheme, 
  getStoredAutoOsTheme, 
  saveAutoOsTheme, 
  getStoredHighContrast, 
  saveHighContrast,
  getStoredCustomDarkBg,
  saveCustomDarkBg,
  getStoredCustomAccentColor,
  saveCustomAccentColor,
  getStoredCustomPocColor,
  saveCustomPocColor,
  saveThemeConfigToIDB,
  loadThemeConfigFromIDB,
  triggerWorkspaceSaveToast,
  ColorThemeName,
  ThemeColors,
  THEME_PALETTES
} from '../utils/terminalPersistence';

export type { ColorThemeName, ThemeColors };
export { THEME_PALETTES };

interface ThemeContextType {
  theme: ColorThemeName;
  setTheme: (theme: ColorThemeName) => void;
  palette: ThemeColors;
  availableThemes: ColorThemeName[];
  isAutoOsTheme: boolean;
  setIsAutoOsTheme: (enabled: boolean) => void;
  isHighContrast: boolean;
  setIsHighContrast: (enabled: boolean) => void;
  isCustomDarkBg: boolean;
  setIsCustomDarkBg: (enabled: boolean) => void;
  customAccentColor: string | null;
  setCustomAccentColor: (color: string | null) => void;
  customPocColor: string | null;
  setCustomPocColor: (color: string | null) => void;
  isSystemDark: boolean;
  isLight: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const THEME_LIST: ColorThemeName[] = [
  'MountAlgo Themes',
  'MountAlgo Themes',
  'MountAlgo Neon',
  'MountAlgo Frost',
  'MountAlgo Cyber',
  'Spartan Edge Theme',
  'Standard Spartan Edge Theme',
  'Dark ICT Theme',
  'Garuda Gold',
  'MountAlgo Super Premium Theme',
  'Deep Sea',
  'Gear Protocol',
];

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ColorThemeName>(() => getStoredTheme());
  const [isAutoOsTheme, setIsAutoOsThemeState] = useState<boolean>(() => getStoredAutoOsTheme());
  const [isHighContrast, setIsHighContrastState] = useState<boolean>(() => getStoredHighContrast());
  const [isCustomDarkBg, setIsCustomDarkBgState] = useState<boolean>(() => getStoredCustomDarkBg());
  const [customAccentColor, setCustomAccentColorState] = useState<string | null>(() => getStoredCustomAccentColor());
  const [customPocColor, setCustomPocColorState] = useState<string | null>(() => getStoredCustomPocColor());
  const [isSystemDark, setIsSystemDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  // Load theme configuration from IndexedDB on initial mount for robust persistence across reloads
  useEffect(() => {
    loadThemeConfigFromIDB().then((idbConfig) => {
      if (idbConfig && typeof idbConfig === 'object') {
        if (idbConfig.theme && idbConfig.theme !== theme) {
          setThemeState(idbConfig.theme);
        }
        if (idbConfig.customPocColor !== undefined && idbConfig.customPocColor !== customPocColor) {
          setCustomPocColorState(idbConfig.customPocColor);
        }
        if (idbConfig.customAccentColor !== undefined && idbConfig.customAccentColor !== customAccentColor) {
          setCustomAccentColorState(idbConfig.customAccentColor);
        }
        if (idbConfig.isHighContrast !== undefined && idbConfig.isHighContrast !== isHighContrast) {
          setIsHighContrastState(idbConfig.isHighContrast);
        }
        if (idbConfig.isCustomDarkBg !== undefined && idbConfig.isCustomDarkBg !== isCustomDarkBg) {
          setIsCustomDarkBgState(idbConfig.isCustomDarkBg);
        }
      }
    }).catch(() => {});
  }, []);

  // Listen to OS color scheme changes in real-time
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsSystemDark(e.matches);
      if (isAutoOsTheme) {
        const targetTheme: ColorThemeName = 'MountAlgo Themes';
        setThemeState(targetTheme);
        saveTheme(targetTheme);
      }
    };

    // Initial check if auto OS theme is enabled
    if (isAutoOsTheme) {
      const targetTheme: ColorThemeName = 'MountAlgo Themes';
      setThemeState(targetTheme);
      saveTheme(targetTheme);
    }

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [isAutoOsTheme]);

  const setTheme = (newTheme: ColorThemeName) => {
    setThemeState(newTheme);
    saveTheme(newTheme);
    triggerWorkspaceSaveToast(`Tema "${newTheme}" berhasil disimpan secara lokal & IndexedDB!`);
  };

  const setCustomAccentColor = (color: string | null) => {
    setCustomAccentColorState(color);
    saveCustomAccentColor(color);
    triggerWorkspaceSaveToast(
      color 
        ? `Warna aksen kustom (${color}) berhasil diaktifkan & diharmonisasi!` 
        : 'Warna aksen kustom direset ke default tema!'
    );
  };

  const setCustomPocColor = (color: string | null) => {
    setCustomPocColorState(color);
    saveCustomPocColor(color);
    triggerWorkspaceSaveToast(
      color 
        ? `Warna POC kustom (${color}) berhasil disimpan & diaktifkan!` 
        : 'Warna POC direset ke default tema!'
    );
  };

  const setIsAutoOsTheme = (enabled: boolean) => {
    setIsAutoOsThemeState(enabled);
    saveAutoOsTheme(enabled);
    if (enabled) {
      const targetTheme: ColorThemeName = 'MountAlgo Themes';
      setThemeState(targetTheme);
      saveTheme(targetTheme);
    }
    triggerWorkspaceSaveToast(
      enabled 
        ? "Auto OS Color Scheme diaktifkan & disinkronkan!" 
        : "Auto OS Color Scheme dinonaktifkan!"
    );
  };

  const setIsHighContrast = (enabled: boolean) => {
    setIsHighContrastState(enabled);
    saveHighContrast(enabled);
    triggerWorkspaceSaveToast(
      enabled 
        ? "Mode Kontras Tinggi diaktifkan & disimpan!" 
        : "Mode Kontras Tinggi dinonaktifkan & disimpan!"
    );
  };

  const setIsCustomDarkBg = (enabled: boolean) => {
    setIsCustomDarkBgState(enabled);
    saveCustomDarkBg(enabled);
    triggerWorkspaceSaveToast(
      enabled 
        ? "Background Obsidian #242119 diaktifkan di seluruh aplikasi!" 
        : "Background default dipulihkan!"
    );
  };

  // Compute active base palette
  const basePalette = THEME_PALETTES[theme] || THEME_PALETTES['MountAlgo Themes'];

  // Apply high-contrast, custom POC color, custom dark background enhancements & custom accent harmonizer
  const palette: ThemeColors = useMemo(() => {
    let result = { ...basePalette };
    const isLight = result.dark === '#ffffff';

    if (customPocColor && /^#[0-9A-F]{6}$/i.test(customPocColor)) {
      result.poc = customPocColor;
      result.boxPoc = `${customPocColor}20`;
    }

    if (isCustomDarkBg && !isLight) {
      result.dark = '#242119';
    }

    if (customAccentColor && /^#[0-9A-F]{6}$/i.test(customAccentColor)) {
      result.bull = customAccentColor;
      result.boxBull = `${customAccentColor}40`;
    }

    if (isHighContrast) {
      result = {
        ...result,
        bull: isLight ? '#008800' : (customAccentColor || '#00ff66'),
        bear: isLight ? '#cc0000' : '#ff0044',
        poc: customPocColor || '#ffff00',
        boxBull: isLight ? 'rgba(0, 136, 0, 0.25)' : 'rgba(0, 255, 102, 0.35)',
        boxBear: isLight ? 'rgba(204, 0, 0, 0.25)' : 'rgba(255, 0, 68, 0.35)',
        dark: isLight ? '#ffffff' : (isCustomDarkBg ? '#242119' : '#000000'),
      };
    }

    return result;
  }, [basePalette, isHighContrast, isCustomDarkBg, customAccentColor, customPocColor]);

  // Save the full theme configuration object to IndexedDB whenever theme settings update
  useEffect(() => {
    const configToPersist = {
      theme,
      isAutoOsTheme,
      isHighContrast,
      isCustomDarkBg,
      customAccentColor,
      customPocColor,
      palette,
      savedAt: Date.now(),
    };
    saveThemeConfigToIDB(configToPersist);
  }, [theme, isAutoOsTheme, isHighContrast, isCustomDarkBg, customAccentColor, customPocColor, palette]);

  // Sync CSS variables and document classes on document element
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-bull', palette.bull);
    root.style.setProperty('--color-bear', palette.bear);
    root.style.setProperty('--color-poc', palette.poc);
    root.style.setProperty('--color-accent', palette.bull);
    root.style.setProperty('--color-box-bull', palette.boxBull);
    root.style.setProperty('--color-box-bear', palette.boxBear);
    root.style.setProperty('--color-box-poc', `${palette.poc}20`);

    const isLight = palette.dark === '#ffffff';
    
    if (isLight) {
      root.classList.add('light');
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      document.body.classList.add('light');
      document.body.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
      document.body.classList.add('dark');
      document.body.classList.remove('light');
    }

    if (isCustomDarkBg && !isLight) {
      root.classList.add('custom-dark-bg-active');
    } else {
      root.classList.remove('custom-dark-bg-active');
    }

    if (isHighContrast) {
      root.classList.add('high-contrast-mode');
      root.style.setProperty('--color-bg', isLight ? '#ffffff' : (isCustomDarkBg ? '#242119' : (palette.dark && palette.dark !== '#000000' ? palette.dark : '#020308')));
      root.style.setProperty('--color-panel', isLight ? '#f1f5f9' : (isCustomDarkBg ? '#1d1a13' : 'rgba(6, 9, 20, 0.9)'));
      root.style.setProperty('--color-panel-header', isLight ? '#e2e8f0' : (isCustomDarkBg ? '#2a251b' : 'rgba(12, 17, 34, 0.95)'));
      root.style.setProperty('--color-card', isLight ? '#ffffff' : (isCustomDarkBg ? '#1a1710' : 'rgba(255, 255, 255, 0.05)'));
      root.style.setProperty('--color-border', isLight ? '#94a3b8' : (isCustomDarkBg ? '#443c2c' : 'rgba(255, 255, 255, 0.16)'));
      root.style.setProperty('--color-text', isLight ? '#000000' : '#ffffff');
      root.style.setProperty('--color-text-muted', isLight ? '#334155' : (isCustomDarkBg ? '#c4bcae' : '#cbd5e1'));
      root.style.setProperty('--color-input-bg', isLight ? '#ffffff' : (isCustomDarkBg ? '#2a251b' : 'rgba(255, 255, 255, 0.06)'));
      root.style.setProperty('--color-input-border', isLight ? '#94a3b8' : (isCustomDarkBg ? '#483f2d' : 'rgba(255, 255, 255, 0.18)'));
      root.style.setProperty('--color-hover', isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.1)');
      root.style.setProperty('--color-chart-bg', isLight ? '#ffffff' : (isCustomDarkBg ? '#242119' : (palette.dark && palette.dark !== '#000000' ? palette.dark : '#030408')));
      root.style.setProperty('--color-chart-scale-bg', isLight ? '#f1f5f9' : (isCustomDarkBg ? '#1d1a13' : 'rgba(4, 6, 14, 0.95)'));
      root.style.setProperty('--color-chart-grid', isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.06)');
      root.style.setProperty('--color-chart-text', isLight ? '#000000' : '#ffffff');
    } else {
      root.classList.remove('high-contrast-mode');
      root.style.setProperty('--color-bg', isLight ? '#f8fafc' : (isCustomDarkBg ? '#242119' : (palette.dark && palette.dark !== '#000000' ? palette.dark : '#030408')));
      root.style.setProperty('--color-panel', isLight ? '#ffffff' : (isCustomDarkBg ? '#1d1a13' : 'rgba(6, 9, 20, 0.78)'));
      root.style.setProperty('--color-panel-header', isLight ? '#f1f5f9' : (isCustomDarkBg ? '#28241b' : 'rgba(10, 15, 28, 0.85)'));
      root.style.setProperty('--color-card', isLight ? '#f8fafc' : (isCustomDarkBg ? '#1a1710' : 'rgba(255, 255, 255, 0.035)'));
      root.style.setProperty('--color-border', isLight ? '#cbd5e1' : (isCustomDarkBg ? '#3e3626' : 'rgba(255, 255, 255, 0.08)'));
      root.style.setProperty('--color-text', isLight ? '#0f172a' : '#f8fafc');
      root.style.setProperty('--color-text-muted', isLight ? '#475569' : (isCustomDarkBg ? '#9e9482' : '#94a3b8'));
      root.style.setProperty('--color-input-bg', isLight ? '#f1f5f9' : (isCustomDarkBg ? '#28241b' : 'rgba(255, 255, 255, 0.04)'));
      root.style.setProperty('--color-input-border', isLight ? '#cbd5e1' : (isCustomDarkBg ? '#483f2d' : 'rgba(255, 255, 255, 0.1)'));
      root.style.setProperty('--color-hover', isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.06)');
      root.style.setProperty('--color-chart-bg', isLight ? '#ffffff' : (isCustomDarkBg ? '#242119' : (palette.dark && palette.dark !== '#000000' ? palette.dark : '#030408')));
      root.style.setProperty('--color-chart-scale-bg', isLight ? '#f1f5f9' : (isCustomDarkBg ? '#1d1a13' : 'rgba(4, 6, 14, 0.85)'));
      root.style.setProperty('--color-chart-grid', isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.03)');
      root.style.setProperty('--color-chart-text', isLight ? '#334155' : '#64748b');
    }
  }, [palette, theme, isHighContrast, isCustomDarkBg]);

  const themeContextValue = useMemo(() => ({
    theme,
    setTheme,
    palette,
    availableThemes: THEME_LIST,
    isAutoOsTheme,
    setIsAutoOsTheme,
    isHighContrast,
    setIsHighContrast,
    isCustomDarkBg,
    setIsCustomDarkBg,
    customAccentColor,
    setCustomAccentColor,
    customPocColor,
    setCustomPocColor,
    isSystemDark,
    isLight: palette.dark === '#ffffff',
  }), [
    theme,
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
    customPocColor,
    setCustomPocColor,
    isSystemDark,
  ]);

  return (
    <ThemeContext.Provider value={themeContextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
