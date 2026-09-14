export type DrawingToolType = 
  | 'cursor' 
  | 'trendline' 
  | 'ray'
  | 'horizontal' 
  | 'horizontal_ray'
  | 'vertical'
  | 'cross_line'
  | 'extended_line'
  | 'parallel_channel'
  | 'arrow'
  | 'brush'
  | 'highlighter'
  | 'polyline'
  | 'rectangle'
  | 'ellipse'
  | 'triangle'
  | 'head_and_shoulders'
  | 'elliott_wave'
  | 'fibonacci' 
  | 'fib_fan'
  | 'fib_extension'
  | 'pitchfork'
  | 'position_long'
  | 'position_short'
  | 'ruler' 
  | 'text'
  | 'callout'
  | 'price_label'
  | 'alert';

export interface Point {
  time: number;
  price: number;
}

export interface FibLevelConfig {
  level: number;
  enabled: boolean;
  color: string;
  label: string;
}

export interface DrawingItem {
  id: string;
  type: DrawingToolType;
  points: Point[];
  color: string;
  isComplete: boolean;
  label?: string;
  text?: string;
  // Advanced Tool Settings
  lineWidth?: number; // 1, 2, 3, 4, 6
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  fillColor?: string;
  fillOpacity?: number; // 0 to 1
  extendLeft?: boolean;
  extendRight?: boolean;
  midline?: boolean; // 50% equilibrium / median line
  fontSize?: number;
  textColor?: string;
  showPrices?: boolean;
  showStats?: boolean;
  showAngles?: boolean;
  locked?: boolean;
  layerId?: string;
  hidden?: boolean;
  zIndex?: number;
  fibLevels?: FibLevelConfig[];
  fibExtensionLevels?: FibLevelConfig[];
  pathPoints?: Point[]; // For brush/freehand drawing
  riskReward?: {
    stopLoss: number;
    takeProfit: number;
    riskRatio?: number;
    accountSize?: number;
    riskPercent?: number;
  };
}

export const DEFAULT_FIB_LEVELS: FibLevelConfig[] = [
  { level: 0, enabled: true, color: '#787b86', label: '0.0% (0.000)' },
  { level: 0.236, enabled: true, color: '#f23645', label: '23.6% (0.236)' },
  { level: 0.382, enabled: true, color: '#ff9800', label: '38.2% (0.382)' },
  { level: 0.5, enabled: true, color: '#4caf50', label: '50.0% (0.500)' },
  { level: 0.618, enabled: true, color: '#089981', label: '61.8% (0.618) Golden Pocket' },
  { level: 0.786, enabled: true, color: '#2962ff', label: '78.6% (0.786)' },
  { level: 1.0, enabled: true, color: '#787b86', label: '100.0% (1.000)' },
  { level: 1.618, enabled: false, color: '#ab47bc', label: '161.8% (1.618)' },
  { level: 2.618, enabled: false, color: '#26a69a', label: '261.8% (2.618)' },
];

export const DEFAULT_FIB_EXTENSION_LEVELS: FibLevelConfig[] = [
  { level: 0, enabled: true, color: '#787b86', label: '0.0% (Origin)' },
  { level: 0.382, enabled: true, color: '#ff9800', label: '38.2% (0.382)' },
  { level: 0.618, enabled: true, color: '#089981', label: '61.8% (0.618)' },
  { level: 1.0, enabled: true, color: '#2962ff', label: '100.0% (1.000)' },
  { level: 1.272, enabled: true, color: '#a855f7', label: '127.2% (1.272)' },
  { level: 1.618, enabled: true, color: '#ec4899', label: '161.8% (1.618) Golden Ext' },
  { level: 2.0, enabled: false, color: '#f59e0b', label: '200.0% (2.000)' },
  { level: 2.618, enabled: false, color: '#26a69a', label: '261.8% (2.618)' },
];

export const FIBONACCI_LEVELS = DEFAULT_FIB_LEVELS;

export const DRAWING_TOOLS: { id: DrawingToolType; label: string; shortcut?: string; category: string }[] = [
  { id: 'cursor', label: 'Kursor Standar', shortcut: 'Esc', category: 'Kursor' },
  { id: 'trendline', label: 'Trend Line', shortcut: 'Alt+T', category: 'Garis Tren' },
  { id: 'ray', label: 'Ray (Sinar)', shortcut: 'Alt+R', category: 'Garis Tren' },
  { id: 'extended_line', label: 'Extended Line', category: 'Garis Tren' },
  { id: 'arrow', label: 'Arrow (Panah)', category: 'Garis Tren' },
  { id: 'horizontal', label: 'Horizontal Line', shortcut: 'Alt+H', category: 'Garis Tren' },
  { id: 'horizontal_ray', label: 'Horizontal Ray', category: 'Garis Tren' },
  { id: 'vertical', label: 'Vertical Line', shortcut: 'Alt+V', category: 'Garis Tren' },
  { id: 'cross_line', label: 'Cross Line', category: 'Garis Tren' },
  { id: 'parallel_channel', label: 'Parallel Channel', category: 'Garis Tren' },
  { id: 'pitchfork', label: "Andrews' Pitchfork", category: 'Garis Tren' },
  { id: 'fibonacci', label: 'Fibonacci Retracement', shortcut: 'Alt+F', category: 'Fibonacci' },
  { id: 'fib_fan', label: 'Fibonacci Fan', category: 'Fibonacci' },
  { id: 'fib_extension', label: 'Trend-Based Fib Extension', category: 'Fibonacci' },
  { id: 'rectangle', label: 'Rectangle / Order Block', category: 'Bentuk & Pola' },
  { id: 'ellipse', label: 'Ellipse (Lingkaran)', category: 'Bentuk & Pola' },
  { id: 'triangle', label: 'Triangle (Segitiga)', category: 'Bentuk & Pola' },
  { id: 'brush', label: 'Brush (Kuas)', category: 'Bentuk & Pola' },
  { id: 'highlighter', label: 'Highlighter (Stabilo)', category: 'Bentuk & Pola' },
  { id: 'polyline', label: 'Polyline (Path)', category: 'Bentuk & Pola' },
  { id: 'head_and_shoulders', label: 'Head and Shoulders (H&S)', category: 'Pola Chart' },
  { id: 'elliott_wave', label: 'Elliott Wave (1-2-3-4-5)', category: 'Pola Chart' },
  { id: 'ruler', label: 'Ruler (Penggaris Multi-Metrik)', category: 'Pengukuran' },
  { id: 'position_long', label: 'Posisi Long (Buy R:R)', category: 'Manajemen Risiko' },
  { id: 'position_short', label: 'Posisi Short (Sell R:R)', category: 'Manajemen Risiko' },
  { id: 'text', label: 'Text Note', category: 'Anotasi' },
  { id: 'callout', label: 'Callout Bubble', category: 'Anotasi' },
  { id: 'price_label', label: 'Price Label Badge', category: 'Anotasi' },
];
