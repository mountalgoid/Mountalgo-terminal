/**
 * Tick Count Candlestick Engine & Delta Volume Divergence / Absorption Detector
 * 
 * Implements:
 * 1. True Transaction-Count & Volume-Weighted Tick Bars (e.g. 1T, 10T, 50T, 100T)
 * 2. Real-Time Cumulative Volume Delta (CVD) tracking per tick
 * 3. Institutional Absorption Detection (Passive Whale Absorption vs Aggressive Market Flow)
 * 4. CVD Divergence Signal Generation
 */

import { Candle } from '../components/CustomChartWidget';
import { RawTickTrade } from './tickRingBuffer';

export type TickModeType = '1T' | '10T' | '50T' | '100T' | 'tick' | 'volume_weighted';

export interface TickBarState extends Candle {
  tradeCount: number;
  buyVolume: number;
  sellVolume: number;
  delta: number;
  cvd: number;
  vwap: number;
  pocPrice: number;
  isClosed: boolean;
  absorption?: TickAbsorptionSignal;
}

export interface TickAbsorptionSignal {
  type: 'BULLISH_ABSORPTION' | 'BEARISH_ABSORPTION';
  price: number;
  barIndex: number;
  delta: number;
  totalVolume: number;
  absorptionStrength: number; // 0.0 - 1.0
  description: string;
}

export interface TickCvdDivergence {
  type: 'BULLISH_CVD_DIV' | 'BEARISH_CVD_DIV';
  startIndex: number;
  endIndex: number;
  priceStart: number;
  priceEnd: number;
  cvdStart: number;
  cvdEnd: number;
  description: string;
}

export class TickCountEngine {
  private mode: TickModeType;
  private targetTradesPerBar: number;
  private volumeThreshold: number;
  private currentBar: TickBarState | null = null;
  private completedBars: TickBarState[] = [];
  private currentCvd: number = 0;
  private priceBuckets: Map<number, number> = new Map(); // For POC price calculation
  private sumPv: number = 0; // price * volume for VWAP
  private sumV: number = 0;

  constructor(mode: TickModeType = '10T', volumeThreshold: number = 10.0) {
    this.mode = mode;
    this.volumeThreshold = volumeThreshold;
    this.targetTradesPerBar = this.getTradesCountForMode(mode);
  }

  public setMode(mode: TickModeType, volumeThreshold?: number) {
    this.mode = mode;
    this.targetTradesPerBar = this.getTradesCountForMode(mode);
    if (volumeThreshold !== undefined) {
      this.volumeThreshold = volumeThreshold;
    }
  }

  private getTradesCountForMode(mode: TickModeType): number {
    switch (mode) {
      case '1T':
      case 'tick':
        return 1;
      case '10T':
        return 10;
      case '50T':
        return 50;
      case '100T':
        return 100;
      default:
        return 10;
    }
  }

  /**
   * Seed the engine from historical candles (interpolates or converts existing candles)
   */
  public seedFromCandles(candles: Candle[]) {
    this.completedBars = [];
    this.currentCvd = 0;

    let rollingCvd = 0;
    candles.forEach((c) => {
      const isBull = c.close >= c.open;
      const buyVol = isBull ? c.volume * 0.62 : c.volume * 0.38;
      const sellVol = c.volume - buyVol;
      const delta = buyVol - sellVol;
      rollingCvd += delta;

      const bar: TickBarState = {
        time: c.time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
        tradeCount: this.targetTradesPerBar,
        buyVolume: buyVol,
        sellVolume: sellVol,
        delta,
        cvd: rollingCvd,
        vwap: (c.high + c.low + c.close) / 3,
        pocPrice: (c.high + c.low) / 2,
        isClosed: true,
      };

      // Detect historical absorption
      const absSignal = this.evaluateAbsorption(bar, this.completedBars.length);
      if (absSignal) {
        bar.absorption = absSignal;
      }

      this.completedBars.push(bar);
    });

    this.currentCvd = rollingCvd;
  }

  /**
   * Ingest a batch of live raw trades from the Zero-Copy TickRingBuffer (Float64Array slice)
   * Layout per trade: [price, qty, time, isBuyerMaker]
   */
  public processTradeBatch(trades: Float64Array): {
    completed: TickBarState[];
    activeBar: TickBarState | null;
  } {
    const newlyCompleted: TickBarState[] = [];
    const numTrades = trades.length / 4;

    for (let i = 0; i < numTrades; i++) {
      const offset = i * 4;
      const tPrice = trades[offset];
      const tQty = trades[offset + 1];
      const tTime = trades[offset + 2];
      const tIsBuyerMaker = trades[offset + 3] === 1.0;

      const isAggressiveBuy = !tIsBuyerMaker; // When buyer is NOT maker, buyer used aggressive market order
      const buyQty = isAggressiveBuy ? tQty : 0;
      const sellQty = !isAggressiveBuy ? tQty : 0;
      const delta = buyQty - sellQty;

      this.currentCvd += delta;

      if (!this.currentBar) {
        this.currentBar = {
          time: tTime,
          open: tPrice,
          high: tPrice,
          low: tPrice,
          close: tPrice,
          volume: tQty,
          tradeCount: 1,
          buyVolume: buyQty,
          sellVolume: sellQty,
          delta,
          cvd: this.currentCvd,
          vwap: tPrice,
          pocPrice: tPrice,
          isClosed: false,
        };
        this.priceBuckets.clear();
        this.priceBuckets.set(tPrice, tQty);
        this.sumPv = tPrice * tQty;
        this.sumV = tQty;
      } else {
        // Update in-flight bar
        this.currentBar.high = Math.max(this.currentBar.high, tPrice);
        this.currentBar.low = Math.min(this.currentBar.low, tPrice);
        this.currentBar.close = tPrice;
        this.currentBar.volume += tQty;
        this.currentBar.tradeCount += 1;
        this.currentBar.buyVolume += buyQty;
        this.currentBar.sellVolume += sellQty;
        this.currentBar.delta += delta;
        this.currentBar.cvd = this.currentCvd;

        // VWAP update
        this.sumPv += tPrice * tQty;
        this.sumV += tQty;
        this.currentBar.vwap = this.sumV > 0 ? this.sumPv / this.sumV : tPrice;

        // POC update
        const curPriceVol = (this.priceBuckets.get(tPrice) || 0) + tQty;
        this.priceBuckets.set(tPrice, curPriceVol);
        let maxVol = 0;
        let bestPrice = this.currentBar.pocPrice;
        for (const [p, v] of this.priceBuckets.entries()) {
          if (v > maxVol) {
            maxVol = v;
            bestPrice = p;
          }
        }
        this.currentBar.pocPrice = bestPrice;
      }

      // Check bar closure criteria: either Trade Count target OR Volume target reached
      const isTradeCountReached = this.currentBar.tradeCount >= this.targetTradesPerBar;
      const isVolumeReached = this.mode === 'volume_weighted' && this.currentBar.volume >= this.volumeThreshold;

      if (isTradeCountReached || isVolumeReached) {
        this.currentBar.isClosed = true;
        const absSignal = this.evaluateAbsorption(this.currentBar, this.completedBars.length);
        if (absSignal) {
          this.currentBar.absorption = absSignal;
        }

        this.completedBars.push(this.currentBar);
        newlyCompleted.push(this.currentBar);

        // Keep buffer bounded
        if (this.completedBars.length > 2000) {
          this.completedBars.shift();
        }

        this.currentBar = null;
        this.priceBuckets.clear();
        this.sumPv = 0;
        this.sumV = 0;
      }
    }

    return {
      completed: newlyCompleted,
      activeBar: this.currentBar,
    };
  }

  /**
   * Institutional Absorption Evaluator
   * Detects when large market aggression (high delta) fails to break levels because of limit orders
   */
  private evaluateAbsorption(bar: TickBarState, barIndex: number): TickAbsorptionSignal | undefined {
    const range = bar.high - bar.low;
    if (range <= 0 || bar.volume <= 0) return undefined;

    const deltaRatio = Math.abs(bar.delta) / bar.volume;
    const body = Math.abs(bar.close - bar.open);
    const bodyRatio = body / range;

    // Bearish Absorption: Heavy market buying (high +delta), but price closed weak or left large upper wick
    // Indicates passive institutional limit seller absorbed all market buys!
    if (bar.delta > 0 && deltaRatio > 0.45 && bar.close <= bar.open + range * 0.4) {
      return {
        type: 'BEARISH_ABSORPTION',
        price: bar.high,
        barIndex,
        delta: bar.delta,
        totalVolume: bar.volume,
        absorptionStrength: Math.min(1.0, deltaRatio * 1.2),
        description: `Whale Limit Seller absorbed +${Math.round(bar.delta)} buy delta at ${bar.high.toFixed(2)}`,
      };
    }

    // Bullish Absorption: Heavy market selling (high -delta), but price closed strong or left large lower wick
    // Indicates passive institutional limit buyer absorbed all market sells!
    if (bar.delta < 0 && deltaRatio > 0.45 && bar.close >= bar.close - range * 0.4 && bar.close >= bar.low + range * 0.5) {
      return {
        type: 'BULLISH_ABSORPTION',
        price: bar.low,
        barIndex,
        delta: bar.delta,
        totalVolume: bar.volume,
        absorptionStrength: Math.min(1.0, deltaRatio * 1.2),
        description: `Whale Limit Buyer absorbed ${Math.round(bar.delta)} sell delta at ${bar.low.toFixed(2)}`,
      };
    }

    return undefined;
  }

  /**
   * Scan completed tick bars for Cumulative Volume Delta (CVD) Divergence
   */
  public detectCvdDivergences(lookback: number = 30): TickCvdDivergence[] {
    const divergences: TickCvdDivergence[] = [];
    const bars = this.completedBars;
    if (bars.length < 15) return divergences;

    const startIdx = Math.max(0, bars.length - lookback);

    // Find swing pivots in price & CVD
    for (let i = startIdx + 2; i < bars.length - 2; i++) {
      const prev = bars[i - 1];
      const cur = bars[i];
      const next = bars[i + 1];

      // Bearish Divergence: Price higher high, but CVD lower high
      if (cur.high > prev.high && cur.high > next.high) {
        // Look back for previous swing high
        for (let j = i - 3; j >= Math.max(startIdx, i - 15); j--) {
          const pastBar = bars[j];
          if (pastBar.high > bars[j - 1]?.high && pastBar.high > bars[j + 1]?.high) {
            if (cur.high > pastBar.high && cur.cvd < pastBar.cvd) {
              divergences.push({
                type: 'BEARISH_CVD_DIV',
                startIndex: j,
                endIndex: i,
                priceStart: pastBar.high,
                priceEnd: cur.high,
                cvdStart: pastBar.cvd,
                cvdEnd: cur.cvd,
                description: `Bearish CVD Exhaustion: Price HH with CVD LH`,
              });
              break;
            }
          }
        }
      }

      // Bullish Divergence: Price lower low, but CVD higher low
      if (cur.low < prev.low && cur.low < next.low) {
        for (let j = i - 3; j >= Math.max(startIdx, i - 15); j--) {
          const pastBar = bars[j];
          if (pastBar.low < bars[j - 1]?.low && pastBar.low < bars[j + 1]?.low) {
            if (cur.low < pastBar.low && cur.cvd > pastBar.cvd) {
              divergences.push({
                type: 'BULLISH_CVD_DIV',
                startIndex: j,
                endIndex: i,
                priceStart: pastBar.low,
                priceEnd: cur.low,
                cvdStart: pastBar.cvd,
                cvdEnd: cur.cvd,
                description: `Bullish CVD Absorption: Price LL with CVD HL`,
              });
              break;
            }
          }
        }
      }
    }

    return divergences;
  }

  public getAllBars(): TickBarState[] {
    if (this.currentBar) {
      return [...this.completedBars, this.currentBar];
    }
    return this.completedBars;
  }

  public getCandles(): Candle[] {
    const bars = this.getAllBars();
    return bars.map((b) => ({
      time: b.time,
      open: b.open,
      high: b.high,
      low: b.low,
      close: b.close,
      volume: b.volume,
    }));
  }

  public getCurrentCvd(): number {
    return this.currentCvd;
  }
}
