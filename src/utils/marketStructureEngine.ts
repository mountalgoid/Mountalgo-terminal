import { Candle } from '../components/CustomChartWidget';

export interface FairValueGap {
  id: string;
  type: 'BULLISH' | 'BEARISH';
  topPrice: number;
  bottomPrice: number;
  startIndex: number;
  startTime: number;
  endIndex: number;
  endTime?: number;
  isMitigated: boolean;
  mitigatedIndex?: number;
  mitigatedTime?: number;
  volumeWeight: number;
}

export interface MarketStructurePivot {
  index: number;
  time: number;
  price: number;
  type: 'HH' | 'HL' | 'LH' | 'LL';
  label: string;
  isBreakout?: boolean;
}

export interface MarketStructureResult {
  fvgs: FairValueGap[];
  pivots: MarketStructurePivot[];
  bosLines: {
    fromTime: number;
    toTime: number;
    price: number;
    type: 'BOS_BULL' | 'BOS_BEAR' | 'CHOCH_BULL' | 'CHOCH_BEAR';
    label: string;
  }[];
}

/**
 * High-performance institutional Fair Value Gap & Market Structure calculation
 */
export function calculateMarketStructure(
  candles: Candle[],
  options: {
    minGapPercent?: number; // Minimum gap percentage to filter noise (default 0.05%)
    maxLookback?: number;
    pivotPeriod?: number; // Swing detection lookback (default 5)
  } = {}
): MarketStructureResult {
  if (!candles || candles.length < 5) {
    return { fvgs: [], pivots: [], bosLines: [] };
  }

  const { minGapPercent = 0.03, maxLookback = 150, pivotPeriod = 4 } = options;
  const targetCandles = candles.slice(-maxLookback);
  const offset = Math.max(0, candles.length - maxLookback);

  const fvgs: FairValueGap[] = [];

  // 1. Compute Fair Value Gaps (3-Candle Pattern)
  for (let i = 2; i < targetCandles.length; i++) {
    const cPrev2 = targetCandles[i - 2];
    const cMid = targetCandles[i - 1];
    const cCurr = targetCandles[i];

    // Bullish FVG: Candle[i-2] High is lower than Candle[i] Low (with mid candle being strong green)
    if (cCurr.low > cPrev2.high) {
      const gapHeight = cCurr.low - cPrev2.high;
      const gapPct = (gapHeight / cMid.close) * 100;

      if (gapPct >= minGapPercent) {
        const fvg: FairValueGap = {
          id: `fvg_bull_${offset + i}`,
          type: 'BULLISH',
          topPrice: cCurr.low,
          bottomPrice: cPrev2.high,
          startIndex: offset + i - 1,
          startTime: cMid.time,
          endIndex: candles.length - 1,
          isMitigated: false,
          volumeWeight: cMid.volume || 1,
        };

        // Check if subsequent candles mitigated the gap
        for (let j = i + 1; j < targetCandles.length; j++) {
          if (targetCandles[j].low <= fvg.topPrice) {
            fvg.isMitigated = true;
            fvg.mitigatedIndex = offset + j;
            fvg.mitigatedTime = targetCandles[j].time;
            fvg.endIndex = offset + j;
            break;
          }
        }
        fvgs.push(fvg);
      }
    }

    // Bearish FVG: Candle[i-2] Low is higher than Candle[i] High (with mid candle being strong red)
    if (cCurr.high < cPrev2.low) {
      const gapHeight = cPrev2.low - cCurr.high;
      const gapPct = (gapHeight / cMid.close) * 100;

      if (gapPct >= minGapPercent) {
        const fvg: FairValueGap = {
          id: `fvg_bear_${offset + i}`,
          type: 'BEARISH',
          topPrice: cPrev2.low,
          bottomPrice: cCurr.high,
          startIndex: offset + i - 1,
          startTime: cMid.time,
          endIndex: candles.length - 1,
          isMitigated: false,
          volumeWeight: cMid.volume || 1,
        };

        // Check if subsequent candles mitigated the gap
        for (let j = i + 1; j < targetCandles.length; j++) {
          if (targetCandles[j].high >= fvg.bottomPrice) {
            fvg.isMitigated = true;
            fvg.mitigatedIndex = offset + j;
            fvg.mitigatedTime = targetCandles[j].time;
            fvg.endIndex = offset + j;
            break;
          }
        }
        fvgs.push(fvg);
      }
    }
  }

  // 2. Compute Swing Highs & Swing Lows (Pivots)
  const pivots: MarketStructurePivot[] = [];
  for (let i = pivotPeriod; i < targetCandles.length - pivotPeriod; i++) {
    const curr = targetCandles[i];
    let isSwingHigh = true;
    let isSwingLow = true;

    for (let j = 1; j <= pivotPeriod; j++) {
      if (targetCandles[i - j].high >= curr.high || targetCandles[i + j].high > curr.high) {
        isSwingHigh = false;
      }
      if (targetCandles[i - j].low <= curr.low || targetCandles[i + j].low < curr.low) {
        isSwingLow = false;
      }
    }

    if (isSwingHigh) {
      const prevHigh = pivots.filter(p => p.type === 'HH' || p.type === 'LH').slice(-1)[0];
      const type = (!prevHigh || curr.high > prevHigh.price) ? 'HH' : 'LH';
      pivots.push({
        index: offset + i,
        time: curr.time,
        price: curr.high,
        type,
        label: type,
      });
    } else if (isSwingLow) {
      const prevLow = pivots.filter(p => p.type === 'HL' || p.type === 'LL').slice(-1)[0];
      const type = (!prevLow || curr.low > prevLow.price) ? 'HL' : 'LL';
      pivots.push({
        index: offset + i,
        time: curr.time,
        price: curr.low,
        type,
        label: type,
      });
    }
  }

  // 3. Compute Break of Structure (BOS) Lines
  const bosLines: MarketStructureResult['bosLines'] = [];
  const recentHighs = pivots.filter(p => p.type === 'HH' || p.type === 'LH');
  const recentLows = pivots.filter(p => p.type === 'HL' || p.type === 'LL');

  if (recentHighs.length > 0) {
    const lastHigh = recentHighs[recentHighs.length - 1];
    const latestCandle = targetCandles[targetCandles.length - 1];
    if (latestCandle.close > lastHigh.price) {
      bosLines.push({
        fromTime: lastHigh.time,
        toTime: latestCandle.time,
        price: lastHigh.price,
        type: 'BOS_BULL',
        label: 'Bullish BOS',
      });
    }
  }

  if (recentLows.length > 0) {
    const lastLow = recentLows[recentLows.length - 1];
    const latestCandle = targetCandles[targetCandles.length - 1];
    if (latestCandle.close < lastLow.price) {
      bosLines.push({
        fromTime: lastLow.time,
        toTime: latestCandle.time,
        price: lastLow.price,
        type: 'BOS_BEAR',
        label: 'Bearish BOS',
      });
    }
  }

  return { fvgs, pivots, bosLines };
}
