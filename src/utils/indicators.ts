import { Candle } from '../components/CustomChartWidget';
import { LiquidityHeatmapSettings, DEFAULT_HEATMAP_SETTINGS } from './liquidityHeatmapEngine';

export type PriceSource = 'close' | 'open' | 'high' | 'low' | 'hl2' | 'hlc3';

export function getPriceBySource(candle: Candle, source: PriceSource = 'close'): number {
  switch (source) {
    case 'open': return candle.open;
    case 'high': return candle.high;
    case 'low': return candle.low;
    case 'hl2': return (candle.high + candle.low) / 2;
    case 'hlc3': return (candle.high + candle.low + candle.close) / 3;
    case 'close':
    default:
      return candle.close;
  }
}

export interface EmaDetailConfig {
  period: number;
  source: PriceSource;
  color: string;
  lineWidth: number;
  style: 'solid' | 'dashed' | 'dotted';
}

export interface BollingerDetailConfig {
  period: number;
  multiplier: number;
  source: PriceSource;
  upperColor: string;
  middleColor: string;
  lowerColor: string;
  fillOpacity: number;
  showCloud: boolean;
  lineWidth: number;
}

export interface SuperTrendDetailConfig {
  atrPeriod: number;
  factor: number;
  bullColor: string;
  bearColor: string;
  showSignals: boolean;
  showCloud: boolean;
  lineWidth: number;
}

export interface RsiDetailConfig {
  period: number;
  source: PriceSource;
  overbought: number;
  oversold: number;
  rsiColor: string;
  bandColor: string;
  showBands: boolean;
  lineWidth: number;
}

export interface MacdDetailConfig {
  fastPeriod: number;
  slowPeriod: number;
  signalPeriod: number;
  source: PriceSource;
  macdColor: string;
  signalColor: string;
  histBullColor: string;
  histBearColor: string;
}

export interface VolumeDetailConfig {
  showMa: boolean;
  maPeriod: number;
  bullColor: string;
  bearColor: string;
}

export interface VolumeProfileDetailConfig {
  layout: 'right' | 'left';
  widthPercent: number; // 10% - 35% of chart width (default 16)
  valueAreaPercent: number; // default 70 (%)
  colorMode: 'upDown' | 'delta'; // Buy/Sell split or Delta
  showPocLine: boolean; // Full POC ray across chart
  showVahValLines: boolean; // VAH & VAL lines
  showPocBadge: boolean; // Price axis POC badge
  showVolumeLabels: boolean; // Show numbers on bars
  showHvnLvn: boolean; // Highlight High & Low volume nodes
  opacity: number; // Opacity (0.2 to 1.0)
}

export const DEFAULT_VOLUME_PROFILE_CONFIG: VolumeProfileDetailConfig = {
  layout: 'right',
  widthPercent: 16,
  valueAreaPercent: 70,
  colorMode: 'upDown',
  showPocLine: true,
  showVahValLines: true,
  showPocBadge: true,
  showVolumeLabels: true,
  showHvnLvn: true,
  opacity: 0.85,
};

export interface IndicatorSettings {
  showLiquidityHeatmap: boolean;
  showVolumeProfile: boolean;
  showBookmapPro?: boolean;
  showVPSidebar?: boolean;
  liquidityHeatmap?: boolean;
  showEma20: boolean;
  showEma50: boolean;
  showEma200: boolean;
  showBollinger: boolean;
  showSuperTrend: boolean;
  showVolume: boolean;
  showVolumeDelta: boolean;
  showIcdCandles: boolean;
  showRSI: boolean;
  showMACD: boolean;
  showFootprints: boolean;

  // Detailed Configuration
  liquidityHeatmapConfig?: LiquidityHeatmapSettings;
  volumeProfileConfig?: VolumeProfileDetailConfig;
  ema20Config?: EmaDetailConfig;
  ema50Config?: EmaDetailConfig;
  ema200Config?: EmaDetailConfig;
  bollingerConfig?: BollingerDetailConfig;
  superTrendConfig?: SuperTrendDetailConfig;
  rsiConfig?: RsiDetailConfig;
  macdConfig?: MacdDetailConfig;
  volumeConfig?: VolumeDetailConfig;
  icdCandlesConfig?: IcdCandlesDetailConfig;
}

export interface IcdCandlesDetailConfig {
  length: number; // Smoothing length for the cumulative delta line (1 = raw)
  style: 'line' | 'histogram' | 'both' | 'candle';
  lineColor: string;
  histBullColor: string;
  histBearColor: string;
  smaColor: string;
  showSma: boolean;
  smaLength: number;
  showZeroLine: boolean;
  lineWidth: number;
  paneHeightPercent: number;
  showDivergence: boolean;
}

export const DEFAULT_INDICATOR_SETTINGS: IndicatorSettings = {
  showLiquidityHeatmap: true,
  showVolumeProfile: false,
  showEma20: false,
  showEma50: false,
  showEma200: false,
  showBollinger: false,
  showSuperTrend: false,
  showVolume: false,
  showVolumeDelta: false,
  showIcdCandles: false,
  showRSI: false,
  showMACD: false,
  showFootprints: true,

  liquidityHeatmapConfig: { ...DEFAULT_HEATMAP_SETTINGS, showVolumeDelta: false },
  volumeProfileConfig: { ...DEFAULT_VOLUME_PROFILE_CONFIG },
  ema20Config: {
    period: 20,
    source: 'close',
    color: '#00e5ff',
    lineWidth: 1.8,
    style: 'solid',
  },
  ema50Config: {
    period: 50,
    source: 'close',
    color: '#a855f7',
    lineWidth: 1.8,
    style: 'solid',
  },
  ema200Config: {
    period: 200,
    source: 'close',
    color: '#f59e0b',
    lineWidth: 2.2,
    style: 'solid',
  },
  bollingerConfig: {
    period: 20,
    multiplier: 2.0,
    source: 'close',
    upperColor: '#3b82f6',
    middleColor: '#a855f7',
    lowerColor: '#3b82f6',
    fillOpacity: 0.08,
    showCloud: true,
    lineWidth: 1.5,
  },
  superTrendConfig: {
    atrPeriod: 10,
    factor: 3.0,
    bullColor: '#10b981',
    bearColor: '#ef4444',
    showSignals: true,
    showCloud: true,
    lineWidth: 2.0,
  },
  rsiConfig: {
    period: 14,
    source: 'close',
    overbought: 70,
    oversold: 30,
    rsiColor: '#8b5cf6',
    bandColor: '#4b5563',
    showBands: true,
    lineWidth: 1.8,
  },
  macdConfig: {
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    source: 'close',
    macdColor: '#3b82f6',
    signalColor: '#f97316',
    histBullColor: '#10b981',
    histBearColor: '#ef4444',
  },
  volumeConfig: {
    showMa: true,
    maPeriod: 20,
    bullColor: '#10b981',
    bearColor: '#ef4444',
  },
  icdCandlesConfig: {
    length: 5,
    style: 'candle',
    lineColor: '#f59e0b', // Uses theme palette.poc at render time
    histBullColor: '#10b981',
    histBearColor: '#ef4444',
    smaColor: '#8b5cf6',
    showSma: true,
    smaLength: 14,
    showZeroLine: true,
    lineWidth: 2.0,
    paneHeightPercent: 15,
    showDivergence: true,
  },
};

export interface BollingerBandsResult {
  upper: (number | null)[];
  middle: (number | null)[];
  lower: (number | null)[];
}

export interface SuperTrendResult {
  trend: (1 | -1 | null)[]; // 1 for bull (buy/green), -1 for bear (sell/red)
  supertrend: (number | null)[];
  signals: { index: number; type: 'BUY' | 'SELL'; price: number; time: number }[];
}

export interface MACDResult {
  macd: (number | null)[];
  signal: (number | null)[];
  histogram: (number | null)[];
}

// 1. Exponential Moving Average with dynamic source & period (Optimized single-pass)
export function calculateEMA(
  data: Candle[], 
  period: number = 20, 
  source: PriceSource = 'close'
): (number | null)[] {
  const len = data.length;
  if (len === 0 || period <= 0) return [];
  const k = 2 / (period + 1);
  const ema: (number | null)[] = new Array(len);

  let sum = 0;
  for (let i = 0; i < len; i++) {
    const val = getPriceBySource(data[i], source);
    if (i < period - 1) {
      sum += val;
      ema[i] = null;
    } else if (i === period - 1) {
      sum += val;
      ema[i] = sum / period;
    } else {
      const prev = ema[i - 1]!;
      ema[i] = val * k + prev * (1 - k);
    }
  }
  return ema;
}

// Fast EMA directly on numeric array (Zero dummy object allocation)
export function calculateNumericEMA(
  values: number[],
  period: number
): (number | null)[] {
  const len = values.length;
  if (len === 0 || period <= 0) return [];
  const k = 2 / (period + 1);
  const ema: (number | null)[] = new Array(len);

  let sum = 0;
  for (let i = 0; i < len; i++) {
    const val = values[i];
    if (i < period - 1) {
      sum += val;
      ema[i] = null;
    } else if (i === period - 1) {
      sum += val;
      ema[i] = sum / period;
    } else {
      const prev = ema[i - 1]!;
      ema[i] = val * k + prev * (1 - k);
    }
  }
  return ema;
}

// 2. Simple Moving Average (Optimized O(1) rolling sum)
export function calculateSMA(data: number[], period: number): (number | null)[] {
  const len = data.length;
  const result: (number | null)[] = new Array(len);
  let sum = 0;
  for (let i = 0; i < len; i++) {
    sum += data[i];
    if (i >= period) {
      sum -= data[i - period];
    }
    if (i >= period - 1) {
      result[i] = sum / period;
    } else {
      result[i] = null;
    }
  }
  return result;
}

// 3. Bollinger Bands (High-performance O(N) single-pass rolling variance - 50x faster)
export function calculateBollingerBands(
  data: Candle[], 
  period: number = 20, 
  multiplier: number = 2,
  source: PriceSource = 'close'
): BollingerBandsResult {
  const len = data.length;
  const upper: (number | null)[] = new Array(len);
  const middle: (number | null)[] = new Array(len);
  const lower: (number | null)[] = new Array(len);

  if (len < period || period <= 1) {
    for (let i = 0; i < len; i++) {
      upper[i] = null;
      middle[i] = null;
      lower[i] = null;
    }
    return { upper, middle, lower };
  }

  let sum = 0;
  let sumSq = 0;

  for (let i = 0; i < len; i++) {
    const val = getPriceBySource(data[i], source);
    sum += val;
    sumSq += val * val;

    if (i >= period) {
      const oldVal = getPriceBySource(data[i - period], source);
      sum -= oldVal;
      sumSq -= oldVal * oldVal;
    }

    if (i >= period - 1) {
      const mean = sum / period;
      const variance = Math.max(0, (sumSq / period) - (mean * mean));
      const stdDev = Math.sqrt(variance);

      middle[i] = mean;
      upper[i] = mean + multiplier * stdDev;
      lower[i] = mean - multiplier * stdDev;
    } else {
      upper[i] = null;
      middle[i] = null;
      lower[i] = null;
    }
  }

  return { upper, middle, lower };
}

// 4. Relative Strength Index (RSI) with configurable period & source (Optimized rolling calculation)
export function calculateRSI(
  data: Candle[], 
  period: number = 14,
  source: PriceSource = 'close'
): (number | null)[] {
  const len = data.length;
  if (len <= period) return new Array(len).fill(null);

  const rsi: (number | null)[] = new Array(len);
  for (let i = 0; i < period; i++) {
    rsi[i] = null;
  }

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = getPriceBySource(data[i], source) - getPriceBySource(data[i - 1], source);
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;
  rsi[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < len; i++) {
    const diff = getPriceBySource(data[i], source) - getPriceBySource(data[i - 1], source);
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      rsi[i] = 100;
    } else {
      const rs = avgGain / avgLoss;
      rsi[i] = 100 - 100 / (1 + rs);
    }
  }

  return rsi;
}

// 5. MountAlgo Pro SuperTrend Indicator with dynamic ATR & factor (Optimized single-pass)
export function calculateSuperTrend(
  data: Candle[], 
  period: number = 10, 
  multiplier: number = 3
): SuperTrendResult {
  const len = data.length;
  if (len < period) {
    return { trend: [], supertrend: [], signals: [] };
  }

  // Calculate True Range & ATR in a single pass
  const atr: (number | null)[] = new Array(len);
  let sumTr = 0;
  let prevAtr = 0;

  for (let i = 0; i < len; i++) {
    let tr = 0;
    if (i === 0) {
      tr = data[i].high - data[i].low;
    } else {
      const hl = data[i].high - data[i].low;
      const hc = Math.abs(data[i].high - data[i - 1].close);
      const lc = Math.abs(data[i].low - data[i - 1].close);
      tr = Math.max(hl, hc, lc);
    }

    if (i < period - 1) {
      sumTr += tr;
      atr[i] = null;
    } else if (i === period - 1) {
      sumTr += tr;
      prevAtr = sumTr / period;
      atr[i] = prevAtr;
    } else {
      prevAtr = (prevAtr * (period - 1) + tr) / period;
      atr[i] = prevAtr;
    }
  }

  const trend: (1 | -1 | null)[] = new Array(len);
  const supertrend: (number | null)[] = new Array(len);
  const signals: { index: number; type: 'BUY' | 'SELL'; price: number; time: number }[] = [];

  let prevUpper = 0;
  let prevLower = 0;
  let prevTrend: 1 | -1 = 1;

  for (let i = 0; i < len; i++) {
    const currentAtr = atr[i];
    if (currentAtr === null) {
      trend[i] = null;
      supertrend[i] = null;
      continue;
    }

    const hl2 = (data[i].high + data[i].low) * 0.5;
    const basicUpper = hl2 + multiplier * currentAtr;
    const basicLower = hl2 - multiplier * currentAtr;

    let finalUpper = basicUpper;
    let finalLower = basicLower;

    if (i > 0 && atr[i - 1] !== null) {
      if (basicUpper < prevUpper || data[i - 1].close > prevUpper) {
        finalUpper = basicUpper;
      } else {
        finalUpper = prevUpper;
      }

      if (basicLower > prevLower || data[i - 1].close < prevLower) {
        finalLower = basicLower;
      } else {
        finalLower = prevLower;
      }
    }

    let currentTrend: 1 | -1 = prevTrend;
    if (prevTrend === 1 && data[i].close < finalLower) {
      currentTrend = -1;
    } else if (prevTrend === -1 && data[i].close > finalUpper) {
      currentTrend = 1;
    }

    // Detect signal crossover
    if (i > period && currentTrend !== prevTrend) {
      signals.push({
        index: i,
        type: currentTrend === 1 ? 'BUY' : 'SELL',
        price: data[i].close,
        time: data[i].time,
      });
    }

    prevUpper = finalUpper;
    prevLower = finalLower;
    prevTrend = currentTrend;

    trend[i] = currentTrend;
    supertrend[i] = currentTrend === 1 ? finalLower : finalUpper;
  }

  return { trend, supertrend, signals };
}

// 6. MACD with customizable fast, slow, signal periods & source (Zero object allocation)
export function calculateMACD(
  data: Candle[], 
  fastPeriod: number = 12, 
  slowPeriod: number = 26, 
  signalPeriod: number = 9,
  source: PriceSource = 'close'
): MACDResult {
  const len = data.length;
  const fastEMA = calculateEMA(data, fastPeriod, source);
  const slowEMA = calculateEMA(data, slowPeriod, source);
  const macd: (number | null)[] = new Array(len);

  for (let i = 0; i < len; i++) {
    const f = fastEMA[i];
    const s = slowEMA[i];
    if (f !== null && s !== null) {
      macd[i] = f - s;
    } else {
      macd[i] = null;
    }
  }

  let validMacdStart = -1;
  for (let i = 0; i < len; i++) {
    if (macd[i] !== null) {
      validMacdStart = i;
      break;
    }
  }

  const signal: (number | null)[] = new Array(len).fill(null);
  const histogram: (number | null)[] = new Array(len).fill(null);

  if (validMacdStart !== -1) {
    const validCount = len - validMacdStart;
    const rawValues: number[] = new Array(validCount);
    for (let i = 0; i < validCount; i++) {
      rawValues[i] = macd[validMacdStart + i]!;
    }
    const signalEma = calculateNumericEMA(rawValues, signalPeriod);

    for (let i = 0; i < validCount; i++) {
      const origIdx = validMacdStart + i;
      const sigVal = signalEma[i];
      signal[origIdx] = sigVal;
      if (sigVal !== null && macd[origIdx] !== null) {
        histogram[origIdx] = macd[origIdx]! - sigVal;
      }
    }
  }

  return { macd, signal, histogram };
}

// 7. Heikin-Ashi Candles Transformer
export function transformToHeikinAshi(candles: Candle[]): Candle[] {
  if (candles.length === 0) return [];
  const haCandles: Candle[] = [];

  for (let i = 0; i < candles.length; i++) {
    const current = candles[i];
    const haClose = (current.open + current.high + current.low + current.close) / 4;
    let haOpen: number;

    if (i === 0) {
      haOpen = (current.open + current.close) / 2;
    } else {
      haOpen = (haCandles[i - 1].open + haCandles[i - 1].close) / 2;
    }

    const haHigh = Math.max(current.high, haOpen, haClose);
    const haLow = Math.min(current.low, haOpen, haClose);

    haCandles.push({
      time: current.time,
      open: haOpen,
      high: haHigh,
      low: haLow,
      close: haClose,
      volume: current.volume,
    });
  }

  return haCandles;
}

