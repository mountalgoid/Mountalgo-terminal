import { formatValueShorthand } from "./numberFormatters";
import { Candle } from '../components/CustomChartWidget';


export type FootprintType = 'Split Bid/Ask Profile' | 'Delta Profile' | 'Total Volume Profile';
export type ImbalanceMode = 'Diagonal' | 'Horizontal';
export type SRSourceType = 'Imbalances' | 'Large Volume' | 'Both';
export type MitigationType = 'HTF Wick' | 'HTF Body Close';
export type LTFPlotType = 'Regular Candles' | 'Custom Candles';
export type LTFColorType = 'Regular Color Candles' | 'Based Stochastic RSI' | 'Based Delta' | 'Based EMA';
export type CellStyleMode = 'Heatmap Gradient' | 'Solid Tint' | 'Minimalist';
export type SummaryRowMode = '4-Tier (Vol, Delta, Range, CVD)' | '5-Tier (+Delta %)' | 'Compact (Vol, Delta)' | 'Off';

export interface SRLevelItem {
  id: string;
  price: number;
  isSupport: boolean;
  active: boolean;
  barIdx: number;
  startIdx: number;
  endIdx: number;
  pendingMitigation: boolean;
  mitigatedAtIdx?: number;
  vol: number;
}

export interface FootprintSettings {
  // Global & Visual Theme
  cellStyle: CellStyleMode;
  summaryRows: SummaryRowMode;
  typeLtfPlotCandle: LTFPlotType;
  typeLtfColorCandle: LTFColorType;
  showLtfPlotCandle: boolean;
  showHtfPlotCandle: boolean;
  emaLength: number;

  // HTF Settings
  autoHtfMode: boolean;
  manualHtfTimeframe: string; // e.g. "60", "240", "D"

  // Profile & Auction Market Theory Components
  showVolumeProfile: boolean;
  showPoc: boolean;
  showValueArea: boolean; // VAH / VAL 70%
  showDelta: boolean;
  showBuySellVolume: boolean; // Info table top-right & text labels
  showProfileShape: boolean; // P-Shape / b-Shape / D-Shape
  showUnfinishedAuction: boolean; // High / Low unfinished business
  showAbsorptionBadges: boolean; // Institutional Absorption & Trapped Traders
  boxWidth: number; // 0.1 to 10.0, defval 0.5
  levelsCount: number; // 5 to 100, defval 10
  valueAreaPct: number; // defval 70
  profileGap: number; // 0 to 10, defval 2
  showLargeVol: boolean;
  largeVolMult: number; // defval 1.5
  showLvn: boolean;
  lvnThreshold: number; // defval 15%
  showHvn: boolean;
  hvnThreshold: number; // defval 70%
  showLogo: boolean;
  logoOffset: number; // defval 85

  // Footprint & Imbalance Settings
  footprintType: FootprintType;
  showImbalance: boolean;
  imbalanceMode: ImbalanceMode;
  imbalanceRatio: number; // defval 3.0
  stackedThreshold: number; // defval 3 levels
  imbalanceMinVol: number; // defval 3.0
  imbalanceMarginPct: number; // defval 25.0%
  imbalanceLineWidth: number; // defval 2

  // Advanced Support & Resistance
  showSrFootprints: boolean;
  srSource: SRSourceType;
  maxSrLevels: number; // defval 4
  keepMitigatedSr: boolean;
  mitigationType: MitigationType;
  mitigatedSrColor: string; // defval #8b4513
  mitigatedSrWidth: number; // defval 2
}

export const DEFAULT_MTF_FOOTPRINT_SETTINGS: FootprintSettings = {
  cellStyle: 'Heatmap Gradient',
  summaryRows: '4-Tier (Vol, Delta, Range, CVD)',
  typeLtfPlotCandle: 'Regular Candles',
  typeLtfColorCandle: 'Based Stochastic RSI',
  showLtfPlotCandle: false,
  showHtfPlotCandle: true,
  emaLength: 200,

  autoHtfMode: true,
  manualHtfTimeframe: '60',

  showVolumeProfile: true,
  showPoc: true,
  showValueArea: true,
  showDelta: true,
  showBuySellVolume: true,
  showProfileShape: true,
  showUnfinishedAuction: true,
  showAbsorptionBadges: true,
  boxWidth: 0.5,
  levelsCount: 10,
  valueAreaPct: 70,
  profileGap: 2,
  showLargeVol: true,
  largeVolMult: 1.5,
  showLvn: true,
  lvnThreshold: 15,
  showHvn: true,
  hvnThreshold: 70,
  showLogo: true,
  logoOffset: 85,

  footprintType: 'Split Bid/Ask Profile',
  showImbalance: true,
  imbalanceMode: 'Diagonal',
  imbalanceRatio: 3.0,
  stackedThreshold: 3,
  imbalanceMinVol: 3.0,
  imbalanceMarginPct: 25.0,
  imbalanceLineWidth: 2,

  showSrFootprints: true,
  srSource: 'Imbalances',
  maxSrLevels: 3,
  keepMitigatedSr: false,
  mitigationType: 'HTF Body Close',
  mitigatedSrColor: '#8b4513',
  mitigatedSrWidth: 2,
};



export interface ProfileLevelData {
  levelIdx: number;
  levelLow: number;
  levelHigh: number;
  levelMid: number;
  volVal: number;
  buyVal: number;
  sellVal: number;
  activeBuyVal: number;
  activeSellVal: number;
  activeBuyRatio: number;
  activeSellRatio: number;
  isBuyImbalance: boolean;
  isSellImbalance: boolean;
  isPoc: boolean;
  isLvn: boolean;
  isHvn: boolean;
  isLargeVolBuy: boolean;
  isLargeVolSell: boolean;
  inValueArea: boolean;
}

export interface HTFProfileBlock {
  startIdx: number;
  endIdx: number;
  isFuture: boolean;
  high: number;
  low: number;
  open: number;
  close: number;
  totalVolume: number;
  buyVolume: number;
  sellVolume: number;
  delta: number;
  deltaPct: number;
  pocIdx: number;
  pocPrice: number;
  vahPrice: number;
  valPrice: number;
  maxVol: number;
  levels: ProfileLevelData[];
}

export interface MTFFootprintResult {
  htfBlocks: HTFProfileBlock[];
  activeSrLevels: SRLevelItem[];
  mitigatedSrLevels: SRLevelItem[];
  realtimeInfo: {
    htfTimeframe: string;
    countdownStr: string;
    buyVol: number;
    sellVol: number;
    delta: number;
    totalVol: number;
  };
  customEma: number[];
}

/**
 * Format Volume Helper (Pine Script format_vol replica)
 */
export function formatVol(v: number): string {
  return formatValueShorthand(v, false);
}

/**
 * Exact Pine Script get_buy_sell_vol calculation
 */
export function getBuySellVol(
  v: number,
  o: number,
  h: number,
  l: number,
  c: number
): [number, number] {
  const rangeSize = h - l;
  if (rangeSize <= 0) {
    return [v * 0.5, v * 0.5];
  }

  const bHigh = Math.max(o, c);
  const bLow = Math.min(o, c);
  const bodySize = bHigh - bLow;
  const upperWick = h - bHigh;
  const lowerWick = bLow - l;

  const wBody = bodySize / rangeSize;
  const wUpper = upperWick / rangeSize;
  const wLower = lowerWick / rangeSize;

  const bCenter = (o + c) / 2;
  const bodyPos = (bCenter - l) / rangeSize;
  const brB =
    c > o
      ? Math.min(0.9, 0.6 + bodyPos * 0.3)
      : c < o
      ? Math.max(0.1, 0.4 - (1.0 - bodyPos) * 0.3)
      : 0.5;

  const bVol = v * (wBody * brB + wLower * 0.9 + wUpper * 0.1);
  const sVol = v * (wBody * (1.0 - brB) + wUpper * 0.9 + wLower * 0.1);
  return [bVol, sVol];
}

/**
 * Exact Pine Script distribute_vol calculation across price profile rows
 */
function distributeVol(
  rows: number,
  lowestP: number,
  invRowH: number,
  o: number,
  h: number,
  l: number,
  c: number,
  vTotal: number,
  bucketTotal: number[],
  bucketBuy: number[]
) {
  const bHigh = Math.max(o, c);
  const bLow = Math.min(o, c);
  const rangeVal = h - l;
  const maxIdx = rows - 1;

  if (maxIdx < 0) return;

  if (rangeVal <= 0) {
    const idx = Math.min(maxIdx, Math.max(0, Math.floor((c - lowestP) * invRowH)));
    bucketTotal[idx] += vTotal;
    bucketBuy[idx] += vTotal * 0.5;
    return;
  }

  const invRange = 1.0 / rangeVal;
  const wL = (bLow - l) * invRange;
  const wB = (bHigh - bLow) * invRange;
  const wU = (h - bHigh) * invRange;

  const vL = vTotal * wL;
  const vB = vTotal * wB;
  const vU = vTotal * wU;

  const bCenter = (o + c) * 0.5;
  const bodyPos = (bCenter - l) * invRange;
  const brB =
    c > o
      ? Math.min(0.9, 0.6 + bodyPos * 0.3)
      : c < o
      ? Math.max(0.1, 0.4 - (1.0 - bodyPos) * 0.3)
      : 0.5;

  if (vL > 0) {
    const idxL = Math.min(maxIdx, Math.max(0, Math.floor((l - lowestP) * invRowH)));
    const idxH = Math.min(maxIdx, Math.max(0, Math.floor((bLow - lowestP) * invRowH)));
    if (idxL <= idxH) {
      const vJ = vL / (idxH - idxL + 1);
      const vJBuy = vJ * 0.9;
      for (let j = idxL; j <= idxH; j++) {
        bucketTotal[j] += vJ;
        bucketBuy[j] += vJBuy;
      }
    }
  }

  if (vB > 0) {
    const idxL = Math.min(maxIdx, Math.max(0, Math.floor((bLow - lowestP) * invRowH)));
    const idxH = Math.min(maxIdx, Math.max(0, Math.floor((bHigh - lowestP) * invRowH)));
    if (idxL <= idxH) {
      const vJ = vB / (idxH - idxL + 1);
      const vJBuy = vJ * brB;
      for (let j = idxL; j <= idxH; j++) {
        bucketTotal[j] += vJ;
        bucketBuy[j] += vJBuy;
      }
    }
  }

  if (vU > 0) {
    const idxL = Math.min(maxIdx, Math.max(0, Math.floor((bHigh - lowestP) * invRowH)));
    const idxH = Math.min(maxIdx, Math.max(0, Math.floor((h - lowestP) * invRowH)));
    if (idxL <= idxH) {
      const vJ = vU / (idxH - idxL + 1);
      const vJBuy = vJ * 0.1;
      for (let j = idxL; j <= idxH; j++) {
        bucketTotal[j] += vJ;
        bucketBuy[j] += vJBuy;
      }
    }
  }
}

/**
 * Compute EMA 200 array
 */
function computeEMA(values: number[], length: number): number[] {
  const k = 2 / (length + 1);
  const ema: number[] = [];
  let prevEma = values[0] || 0;
  for (let i = 0; i < values.length; i++) {
    const val = values[i];
    if (i === 0) {
      prevEma = val;
    } else {
      prevEma = val * k + prevEma * (1 - k);
    }
    ema.push(prevEma);
  }
  return ema;
}

// High-Frequency Zero-Allocation Footprint LRU Cache
let globalFootprintCache: {
  key: string;
  result: MTFFootprintResult;
} | null = null;

/**
 * Main MTF Footprints V7.2 Engine (MountAlgo) - Institutional Fast Engine
 */
export function calculateMTFFootprints(
  candles: Candle[],
  settings: Partial<FootprintSettings> = {}
): MTFFootprintResult {
  const cfg: FootprintSettings = { ...DEFAULT_MTF_FOOTPRINT_SETTINGS, ...settings };
  if (!candles || candles.length === 0) {
    return {
      htfBlocks: [],
      activeSrLevels: [],
      mitigatedSrLevels: [],
      realtimeInfo: {
        htfTimeframe: '60',
        countdownStr: '0 minute',
        buyVol: 0,
        sellVol: 0,
        delta: 0,
        totalVol: 0,
      },
      customEma: [],
    };
  }

  const lastCandle = candles[candles.length - 1];
  const firstCandle = candles[0];
  const cacheKey = `${candles.length}_${firstCandle.time}_${lastCandle.time}_${lastCandle.close}_${cfg.levelsCount}_${cfg.autoHtfMode}_${cfg.manualHtfTimeframe}_${cfg.footprintType}_${cfg.valueAreaPct}`;

  if (globalFootprintCache && globalFootprintCache.key === cacheKey) {
    return globalFootprintCache.result;
  }

  // 1. Calculate Custom EMA
  const closePrices = candles.map((c) => c.close);
  const customEma = computeEMA(closePrices, cfg.emaLength);

  // 2. Group into Higher TimeFrame (HTF) sessions
  // Determine grouping size in bars based on timeframe mode
  const htfBarChunkSize = cfg.autoHtfMode ? 14 : 12; // Realistic intra-day chunks (e.g. 14 LTF candles per HTF block)
  const htfTimeframeLabel = cfg.autoHtfMode ? '60' : cfg.manualHtfTimeframe;

  const htfBlocks: HTFProfileBlock[] = [];
  const rawSrLevels: SRLevelItem[] = [];

  const totalCandles = candles.length;
  let startIdx = 0;

  // Reusable typed buffers for level distribution
  const volDist = new Float64Array(cfg.levelsCount);
  const buyDist = new Float64Array(cfg.levelsCount);

  while (startIdx < totalCandles) {
    const endIdx = Math.min(totalCandles - 1, startIdx + htfBarChunkSize - 1);
    const isFuture = endIdx === totalCandles - 1;

    let sHigh = -Infinity;
    let sLow = Infinity;
    let sVol = 0;
    let sBuyVol = 0;
    let sSellVol = 0;

    for (let i = startIdx; i <= endIdx; i++) {
      const c = candles[i];
      if (c.high > sHigh) sHigh = c.high;
      if (c.low < sLow) sLow = c.low;
      sVol += c.volume;
    }

    const sOpen = candles[startIdx].open;
    const sClose = candles[endIdx].close;
    const rangePrice = Math.max(0.0001, sHigh - sLow);
    const step = rangePrice / cfg.levelsCount;
    const invStep = 1.0 / step;

    volDist.fill(0);
    buyDist.fill(0);

    for (let i = startIdx; i <= endIdx; i++) {
      const c = candles[i];
      const [bBuy, bSell] = getBuySellVol(c.volume, c.open, c.high, c.low, c.close);
      sBuyVol += bBuy;
      sSellVol += bSell;
      distributeVol(
        cfg.levelsCount,
        sLow,
        invStep,
        c.open,
        c.high,
        c.low,
        c.close,
        c.volume,
        volDist as any,
        buyDist as any
      );
    }

    // Ensure baseline density
    for (let i = 0; i < cfg.levelsCount; i++) {
      if (volDist[i] <= 0) {
        volDist[i] = 1e-7;
        buyDist[i] = 5e-8;
      }
    }

    // POC
    let maxVol = 0;
    let pocIdx = 0;
    for (let i = 0; i < cfg.levelsCount; i++) {
      if (volDist[i] > maxVol) {
        maxVol = volDist[i];
        pocIdx = i;
      }
    }

    // Value Area Logic (70%)
    const targetVol = sVol * (cfg.valueAreaPct / 100.0);
    let currentVaVol = maxVol;
    let vaUp = pocIdx;
    let vaDown = pocIdx;
    let loopSafe = 0;

    while (currentVaVol < targetVol && loopSafe < cfg.levelsCount) {
      loopSafe++;
      const volUp = vaUp < cfg.levelsCount - 1 ? volDist[vaUp + 1] : 0;
      const volDown = vaDown > 0 ? volDist[vaDown - 1] : 0;
      if (volUp === 0 && volDown === 0) break;
      if (volUp >= volDown) {
        currentVaVol += volUp;
        vaUp = Math.min(vaUp + 1, cfg.levelsCount - 1);
      } else {
        currentVaVol += volDown;
        vaDown = Math.max(vaDown - 1, 0);
      }
    }

    const pocPrice = sLow + step * (pocIdx + 0.5);
    const vahPrice = sLow + step * (vaUp + 1);
    const valPrice = sLow + step * vaDown;

    // Average volume per level for large volume detection
    let totB = 0;
    let totS = 0;
    for (let i = 0; i < cfg.levelsCount; i++) {
      totB += buyDist[i];
      totS += Math.max(0, volDist[i] - buyDist[i]);
    }
    const avgBuyLvlVol = totB / cfg.levelsCount;
    const avgSellLvlVol = totS / cfg.levelsCount;

    // Build level data
    const levels: ProfileLevelData[] = [];
    for (let i = 0; i < cfg.levelsCount; i++) {
      const volVal = volDist[i];
      const buyVal = buyDist[i];
      const sellVal = Math.max(0, volVal - buyVal);
      const levelLow = sLow + step * i;
      const levelHigh = sLow + step * (i + 1);
      const levelMid = (levelLow + levelHigh) / 2;

      let activeBuyVal = buyVal;
      let activeSellVal = sellVal;
      if (cfg.footprintType === 'Delta Profile') {
        activeBuyVal = Math.max(0, buyVal - sellVal);
        activeSellVal = Math.max(0, sellVal - buyVal);
      } else if (cfg.footprintType === 'Total Volume Profile') {
        activeBuyVal = volVal;
        activeSellVal = 0;
      }

      const activeBuyRatio = maxVol > 0 ? activeBuyVal / maxVol : 0;
      const activeSellRatio = maxVol > 0 ? activeSellVal / maxVol : 0;

      // Imbalance calculation (Diagonal / Horizontal)
      let isBuyImbalance = false;
      let isSellImbalance = false;

      if (cfg.showImbalance) {
        if (cfg.imbalanceMode === 'Horizontal') {
          if (
            (sellVal > 0 && buyVal >= sellVal * cfg.imbalanceRatio && buyVal >= cfg.imbalanceMinVol) ||
            (sellVal === 0 && buyVal >= cfg.imbalanceMinVol && buyVal > 5)
          ) {
            isBuyImbalance = true;
          }
          if (
            (buyVal > 0 && sellVal >= buyVal * cfg.imbalanceRatio && sellVal >= cfg.imbalanceMinVol) ||
            (buyVal === 0 && sellVal >= cfg.imbalanceMinVol && sellVal > 5)
          ) {
            isSellImbalance = true;
          }
        } else {
          // Diagonal comparison:
          // buyVal at i vs sellVal at i-1
          // sellVal at i vs buyVal at i+1
          const compareSell = i > 0 ? volDist[i - 1] - buyDist[i - 1] : 0;
          const compareBuy = i < cfg.levelsCount - 1 ? buyDist[i + 1] : 0;

          if (
            (compareSell > 0 && buyVal >= compareSell * cfg.imbalanceRatio && buyVal >= cfg.imbalanceMinVol) ||
            (compareSell === 0 && buyVal >= cfg.imbalanceMinVol && buyVal > 5)
          ) {
            isBuyImbalance = true;
          }
          if (
            (compareBuy > 0 && sellVal >= compareBuy * cfg.imbalanceRatio && sellVal >= cfg.imbalanceMinVol) ||
            (compareBuy === 0 && sellVal >= cfg.imbalanceMinVol && sellVal > 5)
          ) {
            isSellImbalance = true;
          }
        }
      }

      // LVN (Low Volume Nodes)
      let isLvn = false;
      if (cfg.showLvn && i > 0 && i < cfg.levelsCount - 1) {
        const vPrev = volDist[i - 1];
        const vNext = volDist[i + 1];
        if (volVal < vPrev && volVal < vNext && volVal < maxVol * (cfg.lvnThreshold / 100.0)) {
          isLvn = true;
        }
      }

      // HVN (High Volume Nodes)
      let isHvn = false;
      if (cfg.showHvn && i > 0 && i < cfg.levelsCount - 1 && i !== pocIdx) {
        const vPrev = volDist[i - 1];
        const vNext = volDist[i + 1];
        if (volVal > vPrev && volVal > vNext && volVal > maxVol * (cfg.hvnThreshold / 100.0)) {
          isHvn = true;
        }
      }

      // Large Volume Identification
      const isLargeVolBuy = cfg.showLargeVol && buyVal > avgBuyLvlVol * cfg.largeVolMult;
      const isLargeVolSell = cfg.showLargeVol && sellVal > avgSellLvlVol * cfg.largeVolMult;
      const inValueArea = i >= vaDown && i <= vaUp;

      levels.push({
        levelIdx: i,
        levelLow,
        levelHigh,
        levelMid,
        volVal,
        buyVal,
        sellVal,
        activeBuyVal,
        activeSellVal,
        activeBuyRatio,
        activeSellRatio,
        isBuyImbalance,
        isSellImbalance,
        isPoc: i === pocIdx,
        isLvn,
        isHvn,
        isLargeVolBuy,
        isLargeVolSell,
        inValueArea,
      });

      // S/R Level Generation
      const isSupportCand =
        ((cfg.srSource === 'Imbalances' && isBuyImbalance) ||
          (cfg.srSource === 'Large Volume' && isLargeVolBuy) ||
          (cfg.srSource === 'Both' && (isBuyImbalance || isLargeVolBuy))) &&
        levelMid < sClose;

      const isResistCand =
        ((cfg.srSource === 'Imbalances' && isSellImbalance) ||
          (cfg.srSource === 'Large Volume' && isLargeVolSell) ||
          (cfg.srSource === 'Both' && (isSellImbalance || isLargeVolSell))) &&
        levelMid > sClose;

      if (cfg.showSrFootprints) {
        if (isSupportCand) {
          rawSrLevels.push({
            id: `sr_sup_${startIdx}_${i}`,
            price: levelMid,
            isSupport: true,
            active: true,
            barIdx: endIdx,
            startIdx,
            endIdx,
            pendingMitigation: false,
            vol: activeBuyVal,
          });
        }
        if (isResistCand) {
          rawSrLevels.push({
            id: `sr_res_${startIdx}_${i}`,
            price: levelMid,
            isSupport: false,
            active: true,
            barIdx: endIdx,
            startIdx,
            endIdx,
            pendingMitigation: false,
            vol: activeSellVal,
          });
        }
      }
    }

    const delta = sBuyVol - sSellVol;
    const deltaPct = sVol > 0 ? (delta / sVol) * 100 : 0;

    htfBlocks.push({
      startIdx,
      endIdx,
      isFuture,
      high: sHigh,
      low: sLow,
      open: sOpen,
      close: sClose,
      totalVolume: sVol,
      buyVolume: sBuyVol,
      sellVolume: sSellVol,
      delta,
      deltaPct,
      pocIdx,
      pocPrice,
      vahPrice,
      valPrice,
      maxVol,
      levels,
    });

    startIdx = endIdx + 1;
  }

  // 3. Process S/R Mitigations across HTF historical bars
  const activeSrLevels: SRLevelItem[] = [];
  const mitigatedSrLevels: SRLevelItem[] = [];

  for (const sr of rawSrLevels) {
    let mitigated = false;
    let mitigatedAt = totalCandles - 1;

    for (let k = sr.endIdx + 1; k < totalCandles; k++) {
      const c = candles[k];
      if (cfg.mitigationType === 'HTF Wick') {
        if (sr.isSupport && c.low <= sr.price) {
          mitigated = true;
          mitigatedAt = k;
          break;
        } else if (!sr.isSupport && c.high >= sr.price) {
          mitigated = true;
          mitigatedAt = k;
          break;
        }
      } else {
        // HTF Body Close mitigation
        if (sr.isSupport && c.close <= sr.price) {
          mitigated = true;
          mitigatedAt = k;
          break;
        } else if (!sr.isSupport && c.close >= sr.price) {
          mitigated = true;
          mitigatedAt = k;
          break;
        }
      }
    }

    if (mitigated) {
      if (cfg.keepMitigatedSr) {
        mitigatedSrLevels.push({
          ...sr,
          active: false,
          mitigatedAtIdx: mitigatedAt,
        });
      }
    } else {
      activeSrLevels.push(sr);
    }
  }

  // Keep only the most recent maxSrLevels
  const trimmedActive = activeSrLevels.slice(-cfg.maxSrLevels);
  const trimmedMitigated = mitigatedSrLevels.slice(-8);

  // 4. Real-time Info calculation
  const lastBlock = htfBlocks[htfBlocks.length - 1];
  const now = Date.now();
  const nextBarMinutes = 60 - (new Date(now).getMinutes() % 60);

  const result: MTFFootprintResult = {
    htfBlocks,
    activeSrLevels: trimmedActive,
    mitigatedSrLevels: trimmedMitigated,
    realtimeInfo: {
      htfTimeframe: htfTimeframeLabel,
      countdownStr: `${nextBarMinutes} minute`,
      buyVol: lastBlock ? lastBlock.buyVolume : 0,
      sellVol: lastBlock ? lastBlock.sellVolume : 0,
      delta: lastBlock ? lastBlock.delta : 0,
      totalVol: lastBlock ? lastBlock.totalVolume : 0,
    },
    customEma,
  };

  globalFootprintCache = { key: cacheKey, result };
  return result;
}

export interface FootprintLevel {
  price: number;
  levelMid: number;
  bidVol: number;
  askVol: number;
  totalVol: number;
  delta: number;
  volIntensity: number;
  isImbalanceBuy: boolean;
  isImbalanceSell: boolean;
  isPoc: boolean;
  inValueArea: boolean;
}

export interface StackedZone {
  startIdx: number;
  top: number;
  bottom: number;
  count: number;
  active: boolean;
}

export interface FootprintCandleData {
  time: number;
  totalVolume: number;
  delta: number;
  deltaPct: number;
  maxDelta: number;
  minDelta: number;
  cumulativeDelta: number;
  pocPrice: number;
  pocIdx: number;
  vahPrice: number;
  valPrice: number;
  profileShape: 'P_SHAPE' | 'b_SHAPE' | 'D_SHAPE' | null;
  isUnfinishedHigh: boolean;
  isFinishedAuctionHigh: boolean;
  isUnfinishedLow: boolean;
  divergenceType: 'BUY_ABSORPTION' | 'SELL_ABSORPTION' | null;
  trappedTradersSignal: 'TRAPPED_BUYERS' | 'TRAPPED_SELLERS' | null;
  stackedBuyZones: StackedZone[];
  stackedSellZones: StackedZone[];
  levels: FootprintLevel[];
}

export interface FootprintGenOptions {
  numTicks?: number;
  imbalanceMultiplier?: number;
  stackedThreshold?: number;
  imbalanceMinVol?: number;
  valueAreaPct?: number;
  showHeatmap?: boolean;
  showStackedRays?: boolean;
  showSummaryTable?: boolean;
  showUnfinishedAuction?: boolean;
  showAbsorptionBadges?: boolean;
}

export function generateFootprintData(
  candles: Candle[],
  options: FootprintGenOptions = {}
): (FootprintCandleData | null)[] {
  if (!candles || candles.length === 0) return [];

  const numTicks = options.numTicks || 10;
  const imbalanceMult = options.imbalanceMultiplier || 3.0;
  const stackedThresh = options.stackedThreshold || 3;
  const minVolFilter = options.imbalanceMinVol || 3.0;
  const vaPct = (options.valueAreaPct || 70) / 100;

  let cumulativeDelta = 0;
  const result: (FootprintCandleData | null)[] = [];

  // ADAPTIVE SUB-SAMPLED FOOTPRINT VOLUME PROFILE
  // Only process the most recent 150 candles to prevent UI thread lockup on huge histories
  const MAX_PROCESSED_CANDLES = 150;
  const startIndex = Math.max(0, candles.length - MAX_PROCESSED_CANDLES);

  for (let i = 0; i < candles.length; i++) {
    if (i < startIndex) {
      result.push(null);
      continue;
    }

    const c = candles[i];
    const range = Math.max(0.0001, c.high - c.low);
    const step = range / numTicks;
    const invStep = 1.0 / step;

    const volBuckets = new Array(numTicks).fill(0);
    const buyBuckets = new Array(numTicks).fill(0);

    distributeVol(
      numTicks,
      c.low,
      invStep,
      c.open,
      c.high,
      c.low,
      c.close,
      c.volume,
      volBuckets,
      buyBuckets
    );

    // Round and Normalize Volume Buckets for perfect accuracy
    const targetTotal = Math.round(c.volume);
    const roundedVols = volBuckets.map(v => Math.round(v || 0));
    const roundedBuys = buyBuckets.map(b => Math.round(b || 0));

    // Ensure sum of roundedVols is exactly targetTotal
    let currentSum = roundedVols.reduce((a, b) => a + b, 0);
    if (targetTotal > 0 && currentSum !== targetTotal) {
      let maxIdx = 0;
      let maxV = -1;
      for (let l = 0; l < numTicks; l++) {
        if (roundedVols[l] > maxV) {
          maxV = roundedVols[l];
          maxIdx = l;
        }
      }
      const diff = targetTotal - currentSum;
      roundedVols[maxIdx] = Math.max(0, roundedVols[maxIdx] + diff);
    }

    // Ensure roundedBuys[l] <= roundedVols[l] and calculate roundedSells
    const roundedSells = new Array(numTicks).fill(0);
    for (let l = 0; l < numTicks; l++) {
      if (roundedBuys[l] > roundedVols[l]) {
        roundedBuys[l] = roundedVols[l];
      }
      if (roundedVols[l] > 0 && roundedBuys[l] === 0 && buyBuckets[l] > 0) {
        roundedBuys[l] = Math.round(roundedVols[l] * (buyBuckets[l] / (volBuckets[l] || 1)));
      }
      roundedSells[l] = Math.max(0, roundedVols[l] - roundedBuys[l]);
    }

    let barTotalVol = 0;
    let barBuyVol = 0;
    let barSellVol = 0;
    let maxLvlVol = -1;
    let pocIdx = 0;

    for (let l = 0; l < numTicks; l++) {
      const v = roundedVols[l];
      const b = roundedBuys[l];
      const s = roundedSells[l];
      barTotalVol += v;
      barBuyVol += b;
      barSellVol += s;
      if (v > maxLvlVol) {
        maxLvlVol = v;
        pocIdx = l;
      }
    }

    const barDelta = barBuyVol - barSellVol;
    const deltaPct = barTotalVol > 0 ? (barDelta / barTotalVol) * 100 : 0;
    cumulativeDelta += barDelta;

    // Value Area Calculation (70% standard) using rounded volume
    const targetVaVol = barTotalVol * vaPct;
    let currentVaVol = roundedVols[pocIdx] || 0;
    let upIdx = pocIdx;
    let downIdx = pocIdx;

    while (currentVaVol < targetVaVol && (upIdx < numTicks - 1 || downIdx > 0)) {
      const nextUpVol = upIdx < numTicks - 1 ? roundedVols[upIdx + 1] : 0;
      const nextDownVol = downIdx > 0 ? roundedVols[downIdx - 1] : 0;

      if (nextUpVol >= nextDownVol && upIdx < numTicks - 1) {
        upIdx++;
        currentVaVol += nextUpVol;
      } else if (downIdx > 0) {
        downIdx--;
        currentVaVol += nextDownVol;
      } else if (upIdx < numTicks - 1) {
        upIdx++;
        currentVaVol += nextUpVol;
      } else {
        break;
      }
    }

    const vahPrice = c.low + step * (upIdx + 1);
    const valPrice = c.low + step * downIdx;
    const pocPrice = c.low + step * (pocIdx + 0.5);

    const levels: FootprintLevel[] = [];
    const stackedBuyZones: StackedZone[] = [];
    const stackedSellZones: StackedZone[] = [];

    let consecutiveBuyImb = 0;
    let consecutiveSellImb = 0;
    let startBuyImbPrice = 0;
    let startSellImbPrice = 0;

    let rollingDelta = 0;
    let runningMaxDelta = 0;
    let runningMinDelta = 0;

    for (let l = 0; l < numTicks; l++) {
      const levelLow = c.low + step * l;
      const levelHigh = c.low + step * (l + 1);
      const levelMid = (levelLow + levelHigh) / 2;

      const v = roundedVols[l];
      const b = roundedBuys[l];
      const s = roundedSells[l];
      const lvlDelta = b - s;
      rollingDelta += lvlDelta;
      if (rollingDelta > runningMaxDelta) runningMaxDelta = rollingDelta;
      if (rollingDelta < runningMinDelta) runningMinDelta = rollingDelta;

      const volIntensity = maxLvlVol > 0 ? Math.min(1, v / maxLvlVol) : 0;
      const inValueArea = l >= downIdx && l <= upIdx;

      // Diagonal Imbalance comparison (Ask/Buy vs Bid/Sell one tick lower or higher)
      const bidBelow = l > 0 ? roundedSells[l - 1] : 0;
      const askAbove = l < numTicks - 1 ? roundedBuys[l + 1] : 0;

      const isImbalanceBuy = b >= minVolFilter && (bidBelow === 0 ? b >= minVolFilter * 1.5 : b >= bidBelow * imbalanceMult);
      const isImbalanceSell = s >= minVolFilter && (askAbove === 0 ? s >= minVolFilter * 1.5 : s >= askAbove * imbalanceMult);

      if (isImbalanceBuy) {
        if (consecutiveBuyImb === 0) startBuyImbPrice = levelLow;
        consecutiveBuyImb++;
      } else {
        if (consecutiveBuyImb >= stackedThresh) {
          stackedBuyZones.push({
            startIdx: i,
            top: levelHigh,
            bottom: startBuyImbPrice,
            count: consecutiveBuyImb,
            active: true,
          });
        }
        consecutiveBuyImb = 0;
      }

      if (isImbalanceSell) {
        if (consecutiveSellImb === 0) startSellImbPrice = levelLow;
        consecutiveSellImb++;
      } else {
        if (consecutiveSellImb >= stackedThresh) {
          stackedSellZones.push({
            startIdx: i,
            top: levelHigh,
            bottom: startSellImbPrice,
            count: consecutiveSellImb,
            active: true,
          });
        }
        consecutiveSellImb = 0;
      }

      levels.push({
        price: levelMid,
        levelMid,
        bidVol: s,
        askVol: b,
        totalVol: v,
        delta: lvlDelta,
        volIntensity,
        isImbalanceBuy,
        isImbalanceSell,
        isPoc: l === pocIdx,
        inValueArea,
      });
    }

    if (consecutiveBuyImb >= stackedThresh) {
      stackedBuyZones.push({
        startIdx: i,
        top: c.high,
        bottom: startBuyImbPrice,
        count: consecutiveBuyImb,
        active: true,
      });
    }

    if (consecutiveSellImb >= stackedThresh) {
      stackedSellZones.push({
        startIdx: i,
        top: c.high,
        bottom: startSellImbPrice,
        count: consecutiveSellImb,
        active: true,
      });
    }

    const topLevel = levels[levels.length - 1];
    const bottomLevel = levels[0];

    const isUnfinishedHigh = topLevel ? topLevel.askVol > 0 : false;
    const isFinishedAuctionHigh = topLevel ? topLevel.askVol === 0 : false;
    const isUnfinishedLow = bottomLevel ? bottomLevel.bidVol > 0 : false;

    // Profile Shape Classification (Market Profile Theory)
    // P-Shape: High volume in upper half, thin stalk at bottom (Short Covering / Bullish Initiative)
    // b-Shape: High volume in lower half, thin stalk at top (Long Liquidation / Bearish Initiative)
    // D-Shape: Normal bell-curve balance near middle
    let profileShape: 'P_SHAPE' | 'b_SHAPE' | 'D_SHAPE' | null = null;
    if (pocIdx >= Math.floor(numTicks * 0.65) && c.close >= c.open) {
      profileShape = 'P_SHAPE';
    } else if (pocIdx <= Math.floor(numTicks * 0.35) && c.close <= c.open) {
      profileShape = 'b_SHAPE';
    } else {
      profileShape = 'D_SHAPE';
    }

    // Divergence / Absorption Detection
    let divergenceType: 'BUY_ABSORPTION' | 'SELL_ABSORPTION' | null = null;
    const isBull = c.close > c.open;
    const isBear = c.close < c.open;
    if (isBear && barDelta > 0 && barTotalVol > minVolFilter * 2) {
      divergenceType = 'BUY_ABSORPTION';
    } else if (isBull && barDelta < 0 && barTotalVol > minVolFilter * 2) {
      divergenceType = 'SELL_ABSORPTION';
    }

    // Trapped Traders Detection
    let trappedTradersSignal: 'TRAPPED_BUYERS' | 'TRAPPED_SELLERS' | null = null;
    if (pocIdx >= numTicks - 2 && isBear) {
      trappedTradersSignal = 'TRAPPED_BUYERS';
    } else if (pocIdx <= 2 && isBull) {
      trappedTradersSignal = 'TRAPPED_SELLERS';
    }

    result.push({
      time: c.time,
      totalVolume: Math.round(barTotalVol),
      delta: Math.round(barDelta),
      deltaPct: Math.round(deltaPct * 10) / 10,
      maxDelta: Math.round(runningMaxDelta || Math.max(0, barDelta)),
      minDelta: Math.round(runningMinDelta || Math.min(0, barDelta)),
      cumulativeDelta: Math.round(cumulativeDelta),
      pocPrice,
      pocIdx,
      vahPrice,
      valPrice,
      profileShape,
      isUnfinishedHigh,
      isFinishedAuctionHigh,
      isUnfinishedLow,
      divergenceType,
      trappedTradersSignal,
      stackedBuyZones,
      stackedSellZones,
      levels,
    });
  }

  return result;
}
