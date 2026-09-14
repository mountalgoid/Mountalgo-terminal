export type ColorThemeName =
  | 'DEX Deep'
  | 'Spartan Edge Theme'
  | 'MountAlgo Themes'
  | 'MountAlgo Neon'
  | 'MountAlgo Frost'
  | 'MountAlgo Cyber'
  | 'Standard Spartan Edge Theme'
  | 'Dark ICT Theme'
  | 'Garuda Gold'
  | 'MountAlgo Super Premium Theme'
  | 'Deep Sea'
  | 'Gear Protocol';

export interface ThemeColors {
  bull: string;
  bear: string;
  poc: string;
  dark: string;
  white: string;
  boxBull: string;
  boxBear: string;
  bg?: string;
  vahVal?: string;
  grid?: string;
  [key: string]: string | undefined;
}

export const THEME_PALETTES: Record<ColorThemeName, ThemeColors> = {
  'DEX Deep': {
    bull: '#a1ff3b',
    bear: '#ff009a',
    poc: '#ffffff',
    dark: '#000000',
    white: '#c4d3ff',
    boxBull: 'rgba(161, 255, 59, 0.25)',
    boxBear: 'rgba(255, 0, 154, 0.25)',
  },
  'MountAlgo Themes': {
    bull: '#5134ff',
    bear: '#179c74',
    poc: '#ffffff',
    dark: '#000000',
    white: '#c4d3ff',
    boxBull: 'rgba(81, 52, 255, 0.25)',
    boxBear: 'rgba(23, 156, 116, 0.25)',
  },
  'MountAlgo Neon': {
    bull: '#5134ff',
    bear: '#ff009a',
    poc: '#ffffff',
    dark: '#000000',
    white: '#c4d3ff',
    boxBull: 'rgba(81, 52, 255, 0.25)',
    boxBear: 'rgba(255, 0, 154, 0.25)',
  },
  'MountAlgo Frost': {
    bull: '#5134ff',
    bear: '#00e5ff',
    poc: '#ffffff',
    dark: '#000000',
    white: '#c4d3ff',
    boxBull: 'rgba(81, 52, 255, 0.25)',
    boxBear: 'rgba(0, 229, 255, 0.25)',
  },
  'MountAlgo Cyber': {
    bull: '#1848cc',
    bear: '#ff009a',
    poc: '#ffffff',
    dark: '#000000',
    white: '#c4d3ff',
    boxBull: 'rgba(24, 72, 204, 0.25)',
    boxBear: 'rgba(255, 0, 154, 0.25)',
  },
  'Spartan Edge Theme': {
    bull: '#f23645',
    bear: '#62647a',
    poc: '#ffffff',
    dark: '#000000',
    white: '#c4d3ff',
    boxBull: 'rgba(242, 54, 69, 0.25)',
    boxBear: 'rgba(98, 100, 122, 0.25)',
  },
  'Standard Spartan Edge Theme': {
    bull: '#179c74',
    bear: '#f23645',
    poc: '#ffffff',
    dark: '#000000',
    white: '#c4d3ff',
    boxBull: 'rgba(23, 156, 116, 0.25)',
    boxBear: 'rgba(242, 54, 69, 0.25)',
  },
  'Dark ICT Theme': {
    bull: '#179c74',
    bear: '#62647a',
    poc: '#ffffff',
    dark: '#000000',
    white: '#c4d3ff',
    boxBull: 'rgba(23, 156, 116, 0.25)',
    boxBear: 'rgba(98, 100, 122, 0.25)',
  },
  'Garuda Gold': {
    bull: '#f3ba2f',
    bear: '#62647a',
    poc: '#ffffff',
    dark: '#000000',
    white: '#c4d3ff',
    boxBull: 'rgba(243, 186, 47, 0.25)',
    boxBear: 'rgba(98, 100, 122, 0.25)',
  },
  'MountAlgo Super Premium Theme': {
    bull: '#5134ff',
    bear: '#f3ba2f',
    poc: '#ffffff',
    dark: '#000000',
    white: '#c4d3ff',
    boxBull: 'rgba(81, 52, 255, 0.25)',
    boxBear: 'rgba(243, 186, 47, 0.25)',
  },
  'Deep Sea': {
    bull: '#1848cc',
    bear: '#62647a',
    poc: '#ffffff',
    dark: '#000000',
    white: '#c4d3ff',
    boxBull: 'rgba(24, 72, 204, 0.25)',
    boxBear: 'rgba(98, 100, 122, 0.25)',
  },
  'Gear Protocol': {
    bull: '#ff7a00',
    bear: '#62647a',
    poc: '#ffffff',
    dark: '#000000',
    white: '#c4d3ff',
    boxBull: 'rgba(255, 122, 0, 0.25)',
    boxBear: 'rgba(98, 100, 122, 0.25)',
  },
};

import { BrokerAccount } from '../types';

export const STORAGE_KEYS = {
  THEME: 'mountalgo_terminal_theme',
  WIDGET_ORDER: 'mountalgo_widget_order',
  ORIENTATION: 'mountalgo_orientation_override',
  LANDSCAPE_SPLITS: 'mountalgo_layout_landscape_proportions',
  PORTRAIT_SPLITS: 'mountalgo_layout_portrait_proportions',
  BROKER_STATE: 'mountalgo_broker_persistent_state',
  BROKER_ACCOUNTS: 'mountalgo_broker_accounts',
  ACTIVE_ACCOUNT_ID: 'mountalgo_active_account_id',
  AUTO_OS_THEME: 'mountalgo_auto_os_theme',
  HIGH_CONTRAST: 'mountalgo_high_contrast',
  CUSTOM_DARK_BG: 'mountalgo_custom_dark_bg',
  CUSTOM_ACCENT: 'mountalgo_custom_accent_color',
  CUSTOM_POC: 'mountalgo_custom_poc_color',
  WORKSPACE_PRESETS: 'mountalgo_workspace_presets',
  ACTIVE_PRESET_ID: 'mountalgo_active_workspace_preset_id',
  BROKER_SYMBOLS_CACHE: 'mountalgo_broker_symbols_cache',
  POSITIONS_CACHE: 'mountalgo_positions_cache',
  BROKER_POSITIONS_CACHE: 'mountalgo_broker_positions_cache',
} as const;

export interface WorkspacePreset {
  id: string;
  name: string;
  category: 'Scalping' | 'Swing' | 'Analysis' | 'Custom';
  description: string;
  widgetOrder: string[];
  orientation: 'auto' | 'landscape' | 'portrait';
  theme?: ColorThemeName;
  isCustom?: boolean;
  iconName?: string;
  createdAt?: number;
}

export const DEFAULT_WORKSPACE_PRESETS: WorkspacePreset[] = [
  {
    id: 'preset_scalping',
    name: 'Scalping Master',
    category: 'Scalping',
    description: 'Dual Order Flow & Bookmap Terminal (Crypto BTC + Forex EUR high-speed execution)',
    widgetOrder: ['tv1', 'tv2'],
    orientation: 'landscape',
    theme: 'MountAlgo Themes',
    iconName: 'Zap',
  },
  {
    id: 'preset_swing',
    name: 'Swing Trading',
    category: 'Swing',
    description: 'Triple Multi-Timeframe analysis with trend liquidity and breakout tracking',
    widgetOrder: ['tv1', 'tv2', 'chart3'],
    orientation: 'auto',
    theme: 'MountAlgo Themes',
    iconName: 'TrendingUp',
  },
  {
    id: 'preset_analysis',
    name: 'Macro Analysis',
    category: 'Analysis',
    description: 'Single high-definition focus chart for deep market structure & volume profile',
    widgetOrder: ['tv1'],
    orientation: 'landscape',
    theme: 'Spartan Edge Theme',
    iconName: 'LineChart',
  },
  {
    id: 'preset_quad',
    name: 'Institutional 4-Grid',
    category: 'Scalping',
    description: '4-Widget Quad Matrix for multi-asset simultaneous monitoring & correlation',
    widgetOrder: ['tv1', 'tv2', 'chart3', 'chart4'],
    orientation: 'landscape',
    theme: 'MountAlgo Cyber',
    iconName: 'LayoutGrid',
  },
];

export const DEFAULT_BROKER_ACCOUNTS: BrokerAccount[] = [
  {
    id: 'account_demo_default',
    name: 'MountAlgo Paper Demo Account',
    broker: 'DEMO',
    accountType: 'FUTURES',
    isReal: false,
    status: 'CONNECTED',
    balance: 10000.0,
    equity: 10000.0,
    currency: 'USDT',
    leverage: 20,
    pingMs: 14,
    createdAt: 1700000000000,
    lastSyncedAt: Date.now(),
    notes: 'Default Paper Trading Simulator for risk-free strategy execution',
  },
];


export const DEFAULT_WIDGET_ORDER: string[] = ['tv1'];
export const DEFAULT_THEME: ColorThemeName = 'MountAlgo Themes';
export const DEFAULT_ORIENTATION: 'auto' | 'landscape' | 'portrait' = 'auto';
export const DEFAULT_LANDSCAPE_SPLITS = { topSplit: 50, rowSplit: 58 };
export const DEFAULT_PORTRAIT_SPLITS: [number, number, number] = [36, 36, 28];

/**
 * Safely parse JSON from localStorage with a fallback value.
 */
function safeJsonParse<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (error) {
    console.warn(`Error reading localStorage key "${key}":`, error);
    return fallback;
  }
}

/**
 * Get saved widget layout order from localStorage.
 */
export function getStoredWidgetOrder(): string[] {
  const saved = safeJsonParse<string[]>(STORAGE_KEYS.WIDGET_ORDER, DEFAULT_WIDGET_ORDER);
  if (!Array.isArray(saved) || saved.length === 0) {
    return DEFAULT_WIDGET_ORDER;
  }
  const validWidgets = new Set(['tv1', 'tv2', 'chart1', 'chart2', 'chart3', 'chart4', 'chart5', 'chart6']);
  const isValid = saved.every((id) => validWidgets.has(id));
  return isValid ? saved : DEFAULT_WIDGET_ORDER;
}

/**
 * Persist widget layout order to localStorage.
 */
export function saveWidgetOrder(order: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.WIDGET_ORDER, JSON.stringify(order));
  } catch (error) {
    console.warn('Error saving widget order to localStorage:', error);
  }
}

/**
 * Get saved orientation override mode.
 */
export function getStoredOrientation(): 'auto' | 'landscape' | 'portrait' {
  const saved = localStorage.getItem(STORAGE_KEYS.ORIENTATION);
  if (saved === 'auto' || saved === 'landscape' || saved === 'portrait') {
    return saved;
  }
  return DEFAULT_ORIENTATION;
}

/**
 * Persist orientation override mode to localStorage.
 */
export function saveOrientation(mode: 'auto' | 'landscape' | 'portrait'): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ORIENTATION, mode);
  } catch (error) {
    console.warn('Error saving orientation mode to localStorage:', error);
  }
}

/**
 * Get saved theme setting.
 */
export function getStoredTheme(): ColorThemeName {
  const saved = localStorage.getItem(STORAGE_KEYS.THEME) as ColorThemeName;
  if (saved && THEME_PALETTES[saved]) {
    return saved;
  }
  return DEFAULT_THEME;
}

/**
 * Persist theme setting to localStorage.
 */
export function saveTheme(theme: ColorThemeName): void {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch (error) {
    console.warn('Error saving theme to localStorage:', error);
  }
}

/**
 * Get saved landscape proportions.
 */
export function getStoredLandscapeSplits(): { topSplit: number; rowSplit: number } {
  const saved = safeJsonParse<{ topSplit?: number; rowSplit?: number }>(
    STORAGE_KEYS.LANDSCAPE_SPLITS,
    DEFAULT_LANDSCAPE_SPLITS
  );
  return {
    topSplit: typeof saved.topSplit === 'number' ? saved.topSplit : DEFAULT_LANDSCAPE_SPLITS.topSplit,
    rowSplit: typeof saved.rowSplit === 'number' ? saved.rowSplit : DEFAULT_LANDSCAPE_SPLITS.rowSplit,
  };
}

/**
 * Persist landscape split proportions to localStorage.
 */
export function saveLandscapeSplits(splits: { topSplit: number; rowSplit: number }): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LANDSCAPE_SPLITS, JSON.stringify(splits));
  } catch (error) {
    console.warn('Error saving landscape splits to localStorage:', error);
  }
}

/**
 * Get saved portrait proportions.
 */
export function getStoredPortraitSplits(): [number, number, number] {
  const saved = safeJsonParse<number[]>(STORAGE_KEYS.PORTRAIT_SPLITS, DEFAULT_PORTRAIT_SPLITS);
  if (Array.isArray(saved) && saved.length === 3 && saved.every((n) => typeof n === 'number')) {
    return saved as [number, number, number];
  }
  return DEFAULT_PORTRAIT_SPLITS;
}

/**
 * Persist portrait split proportions to localStorage.
 */
export function savePortraitSplits(splits: [number, number, number]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PORTRAIT_SPLITS, JSON.stringify(splits));
  } catch (error) {
    console.warn('Error saving portrait splits to localStorage:', error);
  }
}

/**
 * Get saved broker session state from localStorage.
 */
export function getStoredBrokerState(): {
  isConnected: boolean;
  broker: string;
  balance: number;
  positions: any[];
  pendingOrders?: any[];
  tradeHistory: any[];
  mtServer: string;
  mtLogin: string;
} | null {
  return safeJsonParse<{
    isConnected: boolean;
    broker: string;
    balance: number;
    positions: any[];
    pendingOrders?: any[];
    tradeHistory: any[];
    mtServer: string;
    mtLogin: string;
  } | null>(STORAGE_KEYS.BROKER_STATE, null);
}

/**
 * Persist broker session state to localStorage.
 */
export function saveBrokerState(state: {
  isConnected: boolean;
  broker: string;
  balance: number;
  positions: any[];
  pendingOrders?: any[];
  tradeHistory: any[];
  mtServer: string;
  mtLogin: string;
}): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BROKER_STATE, JSON.stringify(state));
  } catch (error) {
    console.warn('Error saving broker state to localStorage:', error);
  }
}

const CLIENT_SECRET_PREFIX = 'enc::v1::';
const CLIENT_SECRET_KEY = 'MountAlgoSecuredKey2026';

/**
 * Obfuscate/encrypt sensitive secret before persisting to client-side localStorage.
 */
export function encryptClientSecret(plain?: string): string {
  if (!plain) return '';
  if (plain.startsWith(CLIENT_SECRET_PREFIX)) return plain;
  try {
    let xorStr = '';
    for (let i = 0; i < plain.length; i++) {
      const code = plain.charCodeAt(i) ^ CLIENT_SECRET_KEY.charCodeAt(i % CLIENT_SECRET_KEY.length);
      xorStr += String.fromCharCode(code);
    }
    return CLIENT_SECRET_PREFIX + btoa(xorStr);
  } catch {
    return plain;
  }
}

/**
 * Deobfuscate/decrypt sensitive secret retrieved from client-side localStorage.
 */
export function decryptClientSecret(cipher?: string): string {
  if (!cipher) return '';
  if (!cipher.startsWith(CLIENT_SECRET_PREFIX)) return cipher;
  try {
    const raw = atob(cipher.slice(CLIENT_SECRET_PREFIX.length));
    let plain = '';
    for (let i = 0; i < raw.length; i++) {
      const code = raw.charCodeAt(i) ^ CLIENT_SECRET_KEY.charCodeAt(i % CLIENT_SECRET_KEY.length);
      plain += String.fromCharCode(code);
    }
    return plain;
  } catch {
    return cipher;
  }
}

/**
 * Get stored list of connected broker accounts with transparent secret decryption.
 */
export function getStoredBrokerAccounts(): BrokerAccount[] {
  const saved = safeJsonParse<BrokerAccount[]>(STORAGE_KEYS.BROKER_ACCOUNTS, DEFAULT_BROKER_ACCOUNTS);
  if (!Array.isArray(saved) || saved.length === 0) {
    return DEFAULT_BROKER_ACCOUNTS;
  }
  return saved.map(acc => ({
    ...acc,
    apiSecret: acc.apiSecret ? decryptClientSecret(acc.apiSecret) : undefined,
    password: acc.password ? decryptClientSecret(acc.password) : undefined,
  }));
}

/**
 * Persist broker accounts list to localStorage with encrypted API secrets.
 */
export function saveBrokerAccounts(accounts: BrokerAccount[]): void {
  try {
    const securedAccounts = accounts.map(acc => ({
      ...acc,
      apiSecret: acc.apiSecret ? encryptClientSecret(acc.apiSecret) : undefined,
      password: acc.password ? encryptClientSecret(acc.password) : undefined,
    }));
    localStorage.setItem(STORAGE_KEYS.BROKER_ACCOUNTS, JSON.stringify(securedAccounts));
  } catch (error) {
    console.warn('Error saving broker accounts to localStorage:', error);
  }
}

/**
 * Optimistic UI State Caching for Open Positions
 */
export function getStoredPositionsCache(): any[] {
  return safeJsonParse<any[]>(STORAGE_KEYS.POSITIONS_CACHE, []);
}

export function savePositionsCache(positions: any[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.POSITIONS_CACHE, JSON.stringify(positions));
  } catch (error) {
    console.warn('Error saving positions cache to localStorage:', error);
  }
}

export function getStoredBrokerPositionsCache(): Record<string, any[]> {
  return safeJsonParse<Record<string, any[]>>(STORAGE_KEYS.BROKER_POSITIONS_CACHE, {});
}

export function saveBrokerPositionsCache(brokerPositions: Record<string, any[]>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BROKER_POSITIONS_CACHE, JSON.stringify(brokerPositions));
  } catch (error) {
    console.warn('Error saving broker positions cache to localStorage:', error);
  }
}

/**
 * 12-Hour Cache for Broker Universe Symbols (MEXC, Binance, Forex)
 */
export const SYMBOL_CACHE_TTL_MS = 12 * 60 * 60 * 1000;

export interface CachedBrokerSymbolsPayload {
  timestamp: number;
  data: Record<string, any[]>;
  total: number;
}

export function loadCachedBrokerSymbols(): { data: Record<string, any[]>; total: number; isFresh: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BROKER_SYMBOLS_CACHE);
    if (!raw) return { data: {}, total: 0, isFresh: false };
    const parsed: CachedBrokerSymbolsPayload = JSON.parse(raw);
    if (!parsed || !parsed.data || typeof parsed.data !== 'object') {
      return { data: {}, total: 0, isFresh: false };
    }
    const age = Date.now() - (parsed.timestamp || 0);
    const isFresh = age < SYMBOL_CACHE_TTL_MS;
    return { data: parsed.data, total: parsed.total || 0, isFresh };
  } catch {
    return { data: {}, total: 0, isFresh: false };
  }
}

export function saveCachedBrokerSymbols(symbolsMap: Record<string, any[]>, totalCount?: number): void {
  try {
    const compressedMap: Record<string, any[]> = {};
    let computedTotal = 0;
    
    for (const [key, list] of Object.entries(symbolsMap)) {
      if (Array.isArray(list)) {
        compressedMap[key] = list.slice(0, 3000).map((s: any) => ({
          symbol: s.symbol,
          base: s.base,
          quote: s.quote,
          displayName: s.displayName,
          type: s.type,
          precision: s.precision,
          active: s.active !== false,
          firstSeenAt: s.firstSeenAt,
          isNewListing: s.isNewListing,
          isNew1m: s.isNew1m,
          isNew5m: s.isNew5m,
          isNew1h: s.isNew1h,
          isNew24h: s.isNew24h,
          listingAgeMinutes: s.listingAgeMinutes,
          badge: s.badge,
        }));
        computedTotal += compressedMap[key].length;
      }
    }
    
    const payload: CachedBrokerSymbolsPayload = {
      timestamp: Date.now(),
      data: compressedMap,
      total: totalCount || computedTotal,
    };
    localStorage.setItem(STORAGE_KEYS.BROKER_SYMBOLS_CACHE, JSON.stringify(payload));
  } catch (err) {
    console.warn('Failed to cache broker symbols to localStorage:', err);
  }
}

/**
 * Get stored active account ID.
 */
export function getStoredActiveAccountId(): string {
  const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_ACCOUNT_ID);
  return saved || 'account_demo_default';
}

/**
 * Persist active account ID to localStorage.
 */
export function saveActiveAccountId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ACCOUNT_ID, id);
  } catch (error) {
    console.warn('Error saving active account ID to localStorage:', error);
  }
}

export function getStoredAutoOsTheme(): boolean {
  return localStorage.getItem(STORAGE_KEYS.AUTO_OS_THEME) === 'true';
}

export function saveAutoOsTheme(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEYS.AUTO_OS_THEME, String(enabled));
  } catch (error) {
    console.warn('Error saving auto OS theme:', error);
  }
}

export function getStoredHighContrast(): boolean {
  return localStorage.getItem(STORAGE_KEYS.HIGH_CONTRAST) === 'true';
}

export function saveHighContrast(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HIGH_CONTRAST, String(enabled));
  } catch (error) {
    console.warn('Error saving high contrast mode:', error);
  }
}

export function getStoredCustomDarkBg(): boolean {
  return localStorage.getItem(STORAGE_KEYS.CUSTOM_DARK_BG) === 'true';
}

export function saveCustomDarkBg(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_DARK_BG, String(enabled));
  } catch (error) {
    console.warn('Error saving custom dark background mode:', error);
  }
}

export function getStoredCustomAccentColor(): string | null {
  const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_ACCENT);
  if (saved && /^#[0-9A-F]{6}$/i.test(saved.trim())) {
    return saved.trim();
  }
  return null;
}

export function saveCustomAccentColor(color: string | null): void {
  try {
    if (color && /^#[0-9A-F]{6}$/i.test(color.trim())) {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_ACCENT, color.trim());
    } else {
      localStorage.removeItem(STORAGE_KEYS.CUSTOM_ACCENT);
    }
  } catch (error) {
    console.warn('Error saving custom accent color:', error);
  }
}

export function getStoredCustomPocColor(): string | null {
  const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_POC);
  if (saved && /^#[0-9A-F]{6}$/i.test(saved.trim())) {
    return saved.trim();
  }
  return null;
}

export function saveCustomPocColor(color: string | null): void {
  try {
    if (color && /^#[0-9A-F]{6}$/i.test(color.trim())) {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_POC, color.trim());
    } else {
      localStorage.removeItem(STORAGE_KEYS.CUSTOM_POC);
    }
  } catch (error) {
    console.warn('Error saving custom POC color:', error);
  }
}

/**
 * Institutional Schema Sanitizer & Conflict Resolver for Workspace Presets
 */
export function sanitizeAndRepairPreset(raw: any, fallbackIndex = 0): WorkspacePreset {
  const validWidgets = new Set(['tv1', 'tv2', 'chart1', 'chart2', 'chart3', 'chart4', 'chart5', 'chart6']);
  const validCategories = new Set(['Scalping', 'Swing', 'Analysis', 'Custom']);
  const validOrientations = new Set(['auto', 'landscape', 'portrait']);

  const id = (typeof raw?.id === 'string' && raw.id.trim().length > 0)
    ? raw.id.trim()
    : `preset_custom_${Date.now()}_${fallbackIndex}`;

  const name = (typeof raw?.name === 'string' && raw.name.trim().length > 0)
    ? raw.name.trim()
    : `Custom Layout ${fallbackIndex + 1}`;

  const category = validCategories.has(raw?.category) ? raw.category : 'Custom';
  const description = typeof raw?.description === 'string' ? raw.description : 'Optimized multi-chart trading workspace';

  let widgetOrder: string[] = ['tv1'];
  if (Array.isArray(raw?.widgetOrder) && raw.widgetOrder.length > 0) {
    const filtered = raw.widgetOrder.filter((w: any) => typeof w === 'string' && validWidgets.has(w));
    if (filtered.length > 0) {
      widgetOrder = Array.from(new Set(filtered));
    }
  }

  const orientation = validOrientations.has(raw?.orientation) ? raw.orientation : 'auto';
  const theme = (raw?.theme && THEME_PALETTES[raw.theme as ColorThemeName]) ? (raw.theme as ColorThemeName) : DEFAULT_THEME;
  const isCustom = typeof raw?.isCustom === 'boolean' ? raw.isCustom : (id.startsWith('preset_custom_') || !DEFAULT_WORKSPACE_PRESETS.some(d => d.id === id));
  const iconName = typeof raw?.iconName === 'string' ? raw.iconName : 'LayoutGrid';
  const createdAt = typeof raw?.createdAt === 'number' ? raw.createdAt : Date.now();

  return {
    id,
    name,
    category,
    description,
    widgetOrder,
    orientation,
    theme,
    isCustom,
    iconName,
    createdAt
  };
}

export function getStoredWorkspacePresets(): WorkspacePreset[] {
  const saved = safeJsonParse<any[]>(STORAGE_KEYS.WORKSPACE_PRESETS, DEFAULT_WORKSPACE_PRESETS);
  if (!Array.isArray(saved) || saved.length === 0) {
    return DEFAULT_WORKSPACE_PRESETS;
  }

  // Automatic Conflict Resolution & Schema Auto-Repair
  const seenIds = new Set<string>();
  const repaired: WorkspacePreset[] = [];

  saved.forEach((raw, idx) => {
    let preset = sanitizeAndRepairPreset(raw, idx);
    // Resolve duplicate ID conflicts automatically
    if (seenIds.has(preset.id)) {
      preset = { ...preset, id: `${preset.id}_${idx}_${Date.now().toString(36).slice(-4)}` };
    }
    seenIds.add(preset.id);
    repaired.push(preset);
  });

  // Ensure mandatory default institutional presets always exist in the directory
  DEFAULT_WORKSPACE_PRESETS.forEach(def => {
    if (!repaired.some(p => p.id === def.id)) {
      repaired.unshift(def);
    }
  });

  return repaired;
}

export function saveWorkspacePresets(presets: WorkspacePreset[]): void {
  try {
    const sanitized = (Array.isArray(presets) ? presets : DEFAULT_WORKSPACE_PRESETS).map((p, idx) => sanitizeAndRepairPreset(p, idx));
    localStorage.setItem(STORAGE_KEYS.WORKSPACE_PRESETS, JSON.stringify(sanitized));
  } catch (error) {
    console.warn('Error saving workspace presets:', error);
  }
}

export function getActiveWorkspacePresetId(): string {
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_PRESET_ID) || 'preset_scalping';
}

export function saveActiveWorkspacePresetId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PRESET_ID, id);
  } catch (error) {
    console.warn('Error saving active preset ID:', error);
  }
}

/**
 * Dispatch a custom notification event that App.tsx or other components can listen to.
 */
export function triggerWorkspaceSaveToast(message: string, type: 'success' | 'info' | 'warning' = 'success'): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('mountalgo_save_toast', {
        detail: { message, type },
      })
    );
  }
}

/**
 * Reset all layout, themes, audio, indicators, drawings, presets, and preferences to factory default,
 * while STRICTLY PRESERVING trading accounts, balances, open positions, and trade history.
 */
export function resetTerminalExceptAccounts(): void {
  try {
    // 1. Reset Workspace & Layouts
    localStorage.removeItem(STORAGE_KEYS.WIDGET_ORDER);
    localStorage.removeItem(STORAGE_KEYS.ORIENTATION);
    localStorage.removeItem(STORAGE_KEYS.THEME);
    localStorage.removeItem(STORAGE_KEYS.LANDSCAPE_SPLITS);
    localStorage.removeItem(STORAGE_KEYS.PORTRAIT_SPLITS);
    localStorage.removeItem(STORAGE_KEYS.AUTO_OS_THEME);
    localStorage.removeItem(STORAGE_KEYS.HIGH_CONTRAST);
    localStorage.removeItem(STORAGE_KEYS.CUSTOM_DARK_BG);
    localStorage.removeItem(STORAGE_KEYS.WORKSPACE_PRESETS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_PRESET_ID);

    // 2. Reset Audio & Sound Configuration
    localStorage.removeItem('mountalgo_audio_config');

    // 3. Reset Terminal & Hotkey Preferences
    localStorage.removeItem('mountalgo_hotkeys_enabled');
    localStorage.removeItem('mountalgo_hotkey_mode');
    localStorage.removeItem('mountalgo_hotkey_audio');
    localStorage.removeItem('instant_trade_enabled');
    localStorage.removeItem('mountalgo_sync_symbol');
    localStorage.removeItem('mountalgo_sync_tf');
    localStorage.removeItem('mountalgo_sync_crosshair');
    localStorage.removeItem('mountalgo_vol_presets');
    localStorage.removeItem('mountalgo_active_preset_idx');
    localStorage.removeItem('mountalgo_focused_symbol');
    localStorage.removeItem('mountalgo_timezone');

    // 4. Reset Drawing Layers & Templates
    localStorage.removeItem('mountalgo_drawing_layers');
    localStorage.removeItem('mountalgo_active_drawing_layer');
    localStorage.removeItem('mountalgo_drawing_templates');

    // 5. Clear IndexedDB cached chart layout states
    if (typeof indexedDB !== 'undefined') {
      try {
        const req = indexedDB.deleteDatabase(DB_NAME);
        req.onerror = () => {};
        req.onsuccess = () => {};
      } catch {}
    }
  } catch (error) {
    console.warn('Error in resetTerminalExceptAccounts:', error);
  }
}

/**
 * Reset all layout and theme settings to system defaults.
 */
export function resetTerminalWorkspace(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.WIDGET_ORDER);
    localStorage.removeItem(STORAGE_KEYS.ORIENTATION);
    localStorage.removeItem(STORAGE_KEYS.THEME);
    localStorage.removeItem(STORAGE_KEYS.LANDSCAPE_SPLITS);
    localStorage.removeItem(STORAGE_KEYS.PORTRAIT_SPLITS);
  } catch (error) {
    console.warn('Error resetting terminal workspace:', error);
  }
}

// IndexedDB Persistence for fast chart state restoration
const DB_NAME = 'MountAlgoTerminalDB';
const STORE_NAME = 'chartStates';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
}

export async function saveChartStateToIDB(chartId: string, state: any): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(state, chartId);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to save chart state to IDB:', err);
  }
}

export async function loadChartStateFromIDB(chartId: string): Promise<any | null> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(chartId);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Failed to load chart state from IDB:', err);
    return null;
  }
}

export async function saveWorkspaceToIDB(key: string, state: any): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(state, key);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to save workspace to IDB:', err);
  }
}

export async function loadWorkspaceFromIDB(key: string): Promise<any | null> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(key);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Failed to load workspace from IDB:', err);
    return null;
  }
}

export async function saveThemeConfigToIDB(themeConfig: any): Promise<void> {
  return saveWorkspaceToIDB('active_theme_config', themeConfig);
}

export async function loadThemeConfigFromIDB(): Promise<any | null> {
  return loadWorkspaceFromIDB('active_theme_config');
}

/**
 * Institutional Workspace Backup & JSON Exporter
 */
export function exportWorkspaceConfiguration(): string {
  try {
    const exportData = {
      app: 'MountAlgo Terminal',
      version: '2.5.0',
      exportedAt: new Date().toISOString(),
      timestamp: Date.now(),
      workspacePresets: getStoredWorkspacePresets(),
      activePresetId: getActiveWorkspacePresetId(),
      widgetOrder: getStoredWidgetOrder(),
      orientation: getStoredOrientation(),
      landscapeSplits: getStoredLandscapeSplits(),
      portraitSplits: getStoredPortraitSplits(),
      theme: getStoredTheme(),
      customAccentColor: getStoredCustomAccentColor(),
      isCustomDarkBg: getStoredCustomDarkBg(),
      isHighContrast: getStoredHighContrast(),
      isAutoOsTheme: getStoredAutoOsTheme(),
      audioConfig: safeJsonParse<any>('mountalgo_audio_config', {}),
      indicatorSettings: safeJsonParse<any>('mountalgo_indicators_config', {}),
      drawingTemplates: safeJsonParse<any>('mountalgo_drawing_templates', []),
    };

    return JSON.stringify(exportData, null, 2);
  } catch (err) {
    console.error('Failed to export workspace configuration:', err);
    throw new Error('Gagal mengekspor konfigurasi workspace');
  }
}

/**
 * Institutional Workspace Importer & JSON Validator
 */
export function importWorkspaceConfiguration(jsonContent: string): { success: boolean; message: string; count?: number } {
  try {
    if (!jsonContent || typeof jsonContent !== 'string') {
      return { success: false, message: 'File JSON kosong atau tidak valid.' };
    }

    const data = JSON.parse(jsonContent);

    if (typeof data !== 'object' || data === null) {
      return { success: false, message: 'Format struktur JSON workspace tidak valid.' };
    }

    let importedCount = 0;

    // 1. Presets
    if (Array.isArray(data.workspacePresets) && data.workspacePresets.length > 0) {
      const sanitized = data.workspacePresets.map((p: any, idx: number) => sanitizeAndRepairPreset(p, idx));
      saveWorkspacePresets(sanitized);
      importedCount += sanitized.length;
    }

    if (typeof data.activePresetId === 'string' && data.activePresetId) {
      saveActiveWorkspacePresetId(data.activePresetId);
    }

    // 2. Widget order & layout
    if (Array.isArray(data.widgetOrder) && data.widgetOrder.length > 0) {
      saveWidgetOrder(data.widgetOrder);
    }

    if (data.orientation === 'auto' || data.orientation === 'landscape' || data.orientation === 'portrait') {
      saveOrientation(data.orientation);
    }

    if (data.landscapeSplits && typeof data.landscapeSplits === 'object') {
      saveLandscapeSplits(data.landscapeSplits);
    }

    if (Array.isArray(data.portraitSplits) && data.portraitSplits.length === 3) {
      savePortraitSplits(data.portraitSplits);
    }

    // 3. Theme & Aesthetics
    if (typeof data.theme === 'string' && THEME_PALETTES[data.theme as ColorThemeName]) {
      saveTheme(data.theme as ColorThemeName);
    }

    if (data.customAccentColor && typeof data.customAccentColor === 'string') {
      saveCustomAccentColor(data.customAccentColor);
    } else if (data.customAccentColor === null) {
      saveCustomAccentColor(null);
    }

    if (typeof data.isCustomDarkBg === 'boolean') {
      saveCustomDarkBg(data.isCustomDarkBg);
    }

    if (typeof data.isHighContrast === 'boolean') {
      saveHighContrast(data.isHighContrast);
    }

    if (typeof data.isAutoOsTheme === 'boolean') {
      saveAutoOsTheme(data.isAutoOsTheme);
    }

    // 4. Audio Engine Config
    if (data.audioConfig && typeof data.audioConfig === 'object') {
      localStorage.setItem('mountalgo_audio_config', JSON.stringify(data.audioConfig));
    }

    // 5. Indicator Settings
    if (data.indicatorSettings && typeof data.indicatorSettings === 'object') {
      localStorage.setItem('mountalgo_indicators_config', JSON.stringify(data.indicatorSettings));
    }

    // 6. Drawing templates
    if (Array.isArray(data.drawingTemplates)) {
      localStorage.setItem('mountalgo_drawing_templates', JSON.stringify(data.drawingTemplates));
    }

    triggerWorkspaceSaveToast(`Workspace JSON berhasil diimpor & disinkronkan!`);
    return {
      success: true,
      message: `Konfigurasi workspace & tema berhasil diimpor (${importedCount > 0 ? `${importedCount} preset dipulihkan` : 'Pengaturan dimuat'}).`,
      count: importedCount,
    };
  } catch (err: any) {
    console.error('Failed to import workspace configuration:', err);
    return {
      success: false,
      message: `Gagal membaca file JSON: ${err?.message || 'Format tidak dikenali.'}`,
    };
  }
}
