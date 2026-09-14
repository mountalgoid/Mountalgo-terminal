import { DrawingItem, DrawingToolType, FibLevelConfig } from './drawingTools';

export interface DrawingTemplateStyle {
  color?: string;
  lineWidth?: number;
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  fillColor?: string;
  fillOpacity?: number;
  extendLeft?: boolean;
  extendRight?: boolean;
  midline?: boolean;
  label?: string;
  text?: string;
  fontSize?: number;
  textColor?: string;
  showPrices?: boolean;
  showStats?: boolean;
  showAngles?: boolean;
  fibLevels?: FibLevelConfig[];
  fibExtensionLevels?: FibLevelConfig[];
  riskReward?: {
    takeProfit?: number;
    stopLoss?: number;
    accountSize?: number;
    riskPercent?: number;
  };
}

export interface DrawingTemplate {
  id: string;
  name: string;
  description: string;
  toolType: DrawingToolType | 'any';
  category: 'Fibonacci' | 'Zones & Blocks' | 'Trend & Rays' | 'Position Risk' | 'Custom';
  style: DrawingTemplateStyle;
  isBuiltIn?: boolean;
  createdAt?: number;
}

export const TEMPLATE_STORAGE_KEY = 'mountalgo_drawing_templates';

export const DEFAULT_DRAWING_TEMPLATES: DrawingTemplate[] = [
  {
    id: 'tmpl_fib_golden_pocket',
    name: '61.8% Golden Pocket Fib',
    description: 'Level Fib Retracement presisi dengan Golden Pocket 61.8% hijau mulus & 50% Equilibrium',
    toolType: 'fibonacci',
    category: 'Fibonacci',
    isBuiltIn: true,
    style: {
      color: '#089981',
      lineWidth: 1.5,
      showPrices: true,
      fibLevels: [
        { level: 0, enabled: true, color: '#787b86', label: '0.0%' },
        { level: 0.236, enabled: true, color: '#f23645', label: '23.6%' },
        { level: 0.382, enabled: true, color: '#ff9800', label: '38.2%' },
        { level: 0.5, enabled: true, color: '#4caf50', label: '50.0% Equilibrium' },
        { level: 0.618, enabled: true, color: '#089981', label: '61.8% Golden Pocket' },
        { level: 0.786, enabled: true, color: '#2962ff', label: '78.6% Deep Retrace' },
        { level: 1.0, enabled: true, color: '#787b86', label: '100.0%' },
        { level: 1.618, enabled: true, color: '#ab47bc', label: '161.8% Target' },
      ],
    },
  },
  {
    id: 'tmpl_ict_order_block',
    name: 'ICT Order Block (OB)',
    description: 'Kotak zona institusional OB Emerald dengan 50% Mean Threshold Midline aktif',
    toolType: 'rectangle',
    category: 'Zones & Blocks',
    isBuiltIn: true,
    style: {
      color: '#10b981',
      fillColor: '#10b981',
      fillOpacity: 0.18,
      lineWidth: 2,
      lineStyle: 'solid',
      midline: true,
      showPrices: true,
    },
  },
  {
    id: 'tmpl_fvg_imbalance',
    name: 'Fair Value Gap (FVG)',
    description: 'Zona Imbalance FVG Amber putus-putus dengan garis tengah Mean 50%',
    toolType: 'rectangle',
    category: 'Zones & Blocks',
    isBuiltIn: true,
    style: {
      color: '#f59e0b',
      fillColor: '#f59e0b',
      fillOpacity: 0.2,
      lineWidth: 1.5,
      lineStyle: 'dashed',
      midline: true,
      showPrices: true,
    },
  },
  {
    id: 'tmpl_breakout_trendline',
    name: 'Institutional Trendline',
    description: 'Garis Tren cyan tebal dengan indikator Angle HUD (°), statistik, dan perpanjangan kanan',
    toolType: 'trendline',
    category: 'Trend & Rays',
    isBuiltIn: true,
    style: {
      color: '#06b6d4',
      lineWidth: 2.5,
      lineStyle: 'solid',
      showAngles: true,
      showStats: true,
      extendRight: true,
    },
  },
  {
    id: 'tmpl_liquidity_sweep_ray',
    name: 'Liquidity Sweep Ray',
    description: 'Sinar horisontal merah putus-putus untuk menargetkan Sweep High/Low',
    toolType: 'ray',
    category: 'Trend & Rays',
    isBuiltIn: true,
    style: {
      color: '#f43f5e',
      lineWidth: 2,
      lineStyle: 'dashed',
      showPrices: true,
    },
  },
  {
    id: 'tmpl_key_support',
    name: 'Major Key Support',
    description: 'Garis horisontal hijau tebal penanda zona Support Kunci',
    toolType: 'horizontal',
    category: 'Zones & Blocks',
    isBuiltIn: true,
    style: {
      color: '#10b981',
      lineWidth: 2.5,
      lineStyle: 'solid',
      showPrices: true,
    },
  },
  {
    id: 'tmpl_key_resistance',
    name: 'Major Key Resistance',
    description: 'Garis horisontal merah tebal penanda zona Resistansi Kunci',
    toolType: 'horizontal',
    category: 'Zones & Blocks',
    isBuiltIn: true,
    style: {
      color: '#ef4444',
      lineWidth: 2.5,
      lineStyle: 'solid',
      showPrices: true,
    },
  },
  {
    id: 'tmpl_position_long_rr3',
    name: 'Position Long (1:3 R:R)',
    description: 'Kalkulator Risiko Long dengan preset Take Profit 1:3 & SL presisi',
    toolType: 'position_long',
    category: 'Position Risk',
    isBuiltIn: true,
    style: {
      color: '#089981',
      fillColor: '#089981',
      lineWidth: 2,
      riskReward: { accountSize: 10000, riskPercent: 1.0 },
    },
  },
  {
    id: 'tmpl_position_short_rr3',
    name: 'Position Short (1:3 R:R)',
    description: 'Kalkulator Risiko Short dengan preset Take Profit 1:3 & SL presisi',
    toolType: 'position_short',
    category: 'Position Risk',
    isBuiltIn: true,
    style: {
      color: '#f23645',
      fillColor: '#089981',
      lineWidth: 2,
      riskReward: { accountSize: 10000, riskPercent: 1.0 },
    },
  },
];

export function getStoredDrawingTemplates(): DrawingTemplate[] {
  if (typeof window === 'undefined') return DEFAULT_DRAWING_TEMPLATES;
  try {
    const raw = localStorage.getItem(TEMPLATE_STORAGE_KEY);
    if (!raw) return DEFAULT_DRAWING_TEMPLATES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_DRAWING_TEMPLATES;

    // Merge built-ins with user custom templates
    const customOnly = parsed.filter((t: DrawingTemplate) => !t.isBuiltIn);
    return [...DEFAULT_DRAWING_TEMPLATES, ...customOnly];
  } catch (err) {
    console.warn('Error reading drawing templates from localStorage:', err);
    return DEFAULT_DRAWING_TEMPLATES;
  }
}

export function saveDrawingTemplates(templates: DrawingTemplate[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(templates));
  } catch (err) {
    console.warn('Error saving drawing templates to localStorage:', err);
  }
}

export function createTemplateFromDrawing(
  name: string,
  drawing: DrawingItem,
  category: DrawingTemplate['category'] = 'Custom'
): DrawingTemplate {
  const style: DrawingTemplateStyle = {
    color: drawing.color,
    lineWidth: drawing.lineWidth,
    lineStyle: drawing.lineStyle,
    fillColor: drawing.fillColor,
    fillOpacity: drawing.fillOpacity,
    extendLeft: drawing.extendLeft,
    extendRight: drawing.extendRight,
    midline: drawing.midline,
    fontSize: drawing.fontSize,
    textColor: drawing.textColor,
    showPrices: drawing.showPrices,
    showStats: drawing.showStats,
    showAngles: drawing.showAngles,
    fibLevels: drawing.fibLevels ? JSON.parse(JSON.stringify(drawing.fibLevels)) : undefined,
    fibExtensionLevels: drawing.fibExtensionLevels ? JSON.parse(JSON.stringify(drawing.fibExtensionLevels)) : undefined,
    riskReward: drawing.riskReward ? { ...drawing.riskReward } : undefined,
  };

  return {
    id: `tmpl_custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim() || `Template ${drawing.type}`,
    description: `Template kustom dibuat dari alat ${drawing.type}`,
    toolType: drawing.type,
    category,
    style,
    isBuiltIn: false,
    createdAt: Date.now(),
  };
}

export function applyTemplateToDrawing(drawing: DrawingItem, template: DrawingTemplate): DrawingItem {
  return applyStyleToDrawing(drawing, template.style);
}

export function applyStyleToDrawing(drawing: DrawingItem, style?: DrawingTemplateStyle | null): DrawingItem {
  if (!style) return drawing;
  return {
    ...drawing,
    color: style.color ?? drawing.color,
    lineWidth: style.lineWidth ?? drawing.lineWidth,
    lineStyle: style.lineStyle ?? drawing.lineStyle,
    fillColor: style.fillColor ?? drawing.fillColor,
    fillOpacity: style.fillOpacity ?? drawing.fillOpacity,
    extendLeft: style.extendLeft ?? drawing.extendLeft,
    extendRight: style.extendRight ?? drawing.extendRight,
    midline: style.midline ?? drawing.midline,
    fontSize: style.fontSize ?? drawing.fontSize,
    textColor: style.textColor ?? drawing.textColor,
    showPrices: style.showPrices ?? drawing.showPrices,
    showStats: style.showStats ?? drawing.showStats,
    showAngles: style.showAngles ?? drawing.showAngles,
    fibLevels: style.fibLevels ? JSON.parse(JSON.stringify(style.fibLevels)) : drawing.fibLevels,
    fibExtensionLevels: style.fibExtensionLevels ? JSON.parse(JSON.stringify(style.fibExtensionLevels)) : drawing.fibExtensionLevels,
    riskReward: style.riskReward
      ? {
          ...drawing.riskReward,
          accountSize: style.riskReward.accountSize ?? drawing.riskReward?.accountSize,
          riskPercent: style.riskReward.riskPercent ?? drawing.riskReward?.riskPercent,
        }
      : drawing.riskReward,
  };
}
