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
  symbol?: string;
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

export interface DrawingToolMetadata {
  id: DrawingToolType;
  label: string;
  shortcut?: string;
  category: string;
  requiredPoints: number; // 1, 2, 3, 5, 6, or -1 (variable/freehand)
  steps: string[];
}

export const DRAWING_TOOLS: DrawingToolMetadata[] = [
  { id: 'cursor', label: 'Kursor Standar', shortcut: 'Esc', category: 'Kursor', requiredPoints: 0, steps: [] },
  { id: 'trendline', label: 'Trend Line', shortcut: 'Alt+T', category: 'Garis Tren', requiredPoints: 2, steps: ['Sentuh / klik titik awal garis', 'Sentuh / klik titik akhir garis'] },
  { id: 'ray', label: 'Ray (Sinar)', shortcut: 'Alt+R', category: 'Garis Tren', requiredPoints: 2, steps: ['Sentuh titik pangkal sinar', 'Sentuh arah pancaran sinar'] },
  { id: 'extended_line', label: 'Extended Line', category: 'Garis Tren', requiredPoints: 2, steps: ['Sentuh titik awal garis tak terhingga', 'Sentuh titik kedua untuk menentukan sudut'] },
  { id: 'arrow', label: 'Arrow (Panah)', category: 'Garis Tren', requiredPoints: 2, steps: ['Sentuh pangkal panah', 'Sentuh ujung kepala panah'] },
  { id: 'horizontal', label: 'Horizontal Line', shortcut: 'Alt+H', category: 'Garis Tren', requiredPoints: 1, steps: ['Sentuh level harga horizontal'] },
  { id: 'horizontal_ray', label: 'Horizontal Ray', category: 'Garis Tren', requiredPoints: 1, steps: ['Sentuh level harga horizontal ray ke kanan'] },
  { id: 'vertical', label: 'Vertical Line', shortcut: 'Alt+V', category: 'Garis Tren', requiredPoints: 1, steps: ['Sentuh waktu / bar vertikal'] },
  { id: 'cross_line', label: 'Cross Line', category: 'Garis Tren', requiredPoints: 1, steps: ['Sentuh titik persilangan horizontal & vertikal'] },
  { id: 'parallel_channel', label: 'Parallel Channel', category: 'Garis Tren', requiredPoints: 3, steps: ['Sentuh titik awal garis dasar', 'Sentuh titik akhir garis dasar', 'Sentuh jarak lebar kanal paralel'] },
  { id: 'pitchfork', label: "Andrews' Pitchfork", category: 'Garis Tren', requiredPoints: 3, steps: ['Sentuh titik pivot tengah (Median)', 'Sentuh titik puncak swing 1', 'Sentuh titik lembah swing 2'] },
  { id: 'fibonacci', label: 'Fibonacci Retracement', shortcut: 'Alt+F', category: 'Fibonacci', requiredPoints: 2, steps: ['Sentuh titik awal swing (0% / 100%)', 'Sentuh titik akhir swing'] },
  { id: 'fib_fan', label: 'Fibonacci Fan', category: 'Fibonacci', requiredPoints: 2, steps: ['Sentuh titik awal sudut kipas Fib', 'Sentuh titik akhir kipas'] },
  { id: 'fib_extension', label: 'Trend-Based Fib Extension', category: 'Fibonacci', requiredPoints: 3, steps: ['Sentuh awal swing asal (0%)', 'Sentuh puncak swing (100%)', 'Sentuh titik pullback retracement'] },
  { id: 'rectangle', label: 'Rectangle / Order Block', category: 'Bentuk & Pola', requiredPoints: 2, steps: ['Sentuh sudut pertama zona/box', 'Sentuh sudut diagonal berlawanan'] },
  { id: 'ellipse', label: 'Ellipse (Lingkaran)', category: 'Bentuk & Pola', requiredPoints: 2, steps: ['Sentuh titik pusat/tepi pertama', 'Sentuh tepi diagonal lingkaran'] },
  { id: 'triangle', label: 'Triangle (Segitiga)', category: 'Bentuk & Pola', requiredPoints: 3, steps: ['Sentuh sudut segitiga 1', 'Sentuh sudut segitiga 2', 'Sentuh sudut segitiga 3'] },
  { id: 'brush', label: 'Brush (Kuas)', category: 'Bentuk & Pola', requiredPoints: -1, steps: ['Usap/seret jari atau mouse untuk menggambar bebas'] },
  { id: 'highlighter', label: 'Highlighter (Stabilo)', category: 'Bentuk & Pola', requiredPoints: -1, steps: ['Usap/seret untuk menandai area stabilo'] },
  { id: 'polyline', label: 'Polyline (Path)', category: 'Bentuk & Pola', requiredPoints: -1, steps: ['Sentuh titik-titik berurutan. Klik Selesai saat selesai.'] },
  { id: 'head_and_shoulders', label: 'Head and Shoulders (H&S)', category: 'Pola Chart', requiredPoints: 5, steps: ['1. Bahu Kiri (Left Shoulder)', '2. Neckline Kiri', '3. Kepala (Head Peak)', '4. Neckline Kanan', '5. Bahu Kanan (Right Shoulder)'] },
  { id: 'elliott_wave', label: 'Elliott Wave (1-2-3-4-5)', category: 'Pola Chart', requiredPoints: 6, steps: ['Titik Asal Wave', 'Puncak Wave 1', 'Dasar Wave 2', 'Puncak Wave 3', 'Dasar Wave 4', 'Puncak Wave 5'] },
  { id: 'ruler', label: 'Ruler (Penggaris Multi-Metrik)', category: 'Pengukuran', requiredPoints: 2, steps: ['Sentuh titik awal pengukuran', 'Sentuh titik akhir pengukuran'] },
  { id: 'position_long', label: 'Posisi Long (Buy R:R)', category: 'Manajemen Risiko', requiredPoints: 1, steps: ['Sentuh harga entry posisi Long'] },
  { id: 'position_short', label: 'Posisi Short (Sell R:R)', category: 'Manajemen Risiko', requiredPoints: 1, steps: ['Sentuh harga entry posisi Short'] },
  { id: 'text', label: 'Text Note', category: 'Anotasi', requiredPoints: 1, steps: ['Sentuh posisi untuk menempel catatan teks'] },
  { id: 'callout', label: 'Callout Bubble', category: 'Anotasi', requiredPoints: 1, steps: ['Sentuh posisi untuk menempel bubble callout'] },
  { id: 'price_label', label: 'Price Label Badge', category: 'Anotasi', requiredPoints: 1, steps: ['Sentuh posisi untuk menempel badge harga'] },
];

export function getToolRequiredPoints(tool: DrawingToolType): number {
  const def = DRAWING_TOOLS.find((t) => t.id === tool);
  return def ? def.requiredPoints : 2;
}

export function getToolInstruction(tool: DrawingToolType, currentPointsCount: number): string {
  const def = DRAWING_TOOLS.find((t) => t.id === tool);
  if (!def || def.steps.length === 0) return '';
  const idx = Math.min(currentPointsCount, def.steps.length - 1);
  return def.steps[idx] || '';
}

export const DRAWING_TOOLS_METADATA: Record<string, DrawingToolMetadata> = Object.fromEntries(
  DRAWING_TOOLS.map((t) => [t.id, t])
);

