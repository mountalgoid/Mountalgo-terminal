import { formatValueShorthand, formatPriceShorthand } from "./numberFormatters";
// Order Flow DOM Ladder Engine (High Precision Auction Theory & Market Depth)
import { Candle } from '../components/CustomChartWidget';
import { FootprintCandleData } from './footprints';

export interface DomColumnConfig {
  showBuySellSentiment: boolean;
  showImbalancePct: boolean;
  showBids: boolean;
  showPrice: boolean;
  showAsks: boolean;
  showBuySellVolume: boolean;
  showTrades: boolean;
  showDelta: boolean;
  showCumulativeDelta: boolean;
  showLastTradeSize: boolean;
  showBidsLiquidityChanges: boolean;
  showAsksLiquidityChanges: boolean;
}

export const DEFAULT_DOM_COLUMNS: DomColumnConfig = {
  showBuySellSentiment: true,
  showImbalancePct: true,
  showBids: true,
  showPrice: true,
  showAsks: true,
  showBuySellVolume: true,
  showTrades: true,
  showDelta: true,
  showCumulativeDelta: false,
  showLastTradeSize: false,
  showBidsLiquidityChanges: false,
  showAsksLiquidityChanges: false,
};

export interface DomLadderRow {
  price: number;
  formattedPrice: string;
  bidDepth: number | null;
  askDepth: number | null;
  isHighBidLiquidity: boolean;
  isHighAskLiquidity: boolean;
  isMaxBidWall: boolean;
  isMaxAskWall: boolean;
  isBestBid: boolean;
  isBestAsk: boolean;
  isPoc: boolean;
  isCurrentPrice: boolean;
  buyVolume: number;
  sellVolume: number;
  totalVolume: number;
  trades: number;
  delta: number;
  cumulativeDelta: number;
  imbalancePct: number;
  isPeakVolume: boolean;
  isPeakTrades: boolean;
  isPeakDeltaImbalance: boolean;
  lastTradeSize: number;
}

export interface DomKeyLevel {
  price: number;
  type: 'poc' | 'bid_wall' | 'ask_wall' | 'peak_vol' | 'peak_delta' | 'spread';
  label: string;
  volumeOrSize: number;
  formattedPrice: string;
  color?: string;
}

export interface DomLadderState {
  rows: DomLadderRow[];
  pocPrice: number;
  maxVolume: number;
  maxTrades: number;
  maxDelta: number;
  totalBuyVol: number;
  totalSellVol: number;
  currentPrice: number;
  previousPrice: number;
  priceDirection: 'up' | 'down' | 'flat';
  priceStep: number;
  bestBidPrice: number;
  bestAskPrice: number;
  spread: number;
  keyLevels: DomKeyLevel[];
  highBidWall: { price: number; size: number } | null;
  highAskWall: { price: number; size: number } | null;
}

/**
 * Calculates high-precision tick step based on asset price level
 */
export function getSmartPriceStep(price: number): number {
  if (price >= 50000) return 1.0;
  if (price >= 10000) return 0.5;
  if (price >= 1000) return 0.25;
  if (price >= 100) return 0.1;
  if (price >= 10) return 0.05;
  if (price >= 1) return 0.01;
  if (price >= 0.01) return 0.0005;
  return 0.00001;
}

/**
 * High-precision order flow DOM ladder generator
 */
export function generateOrderFlowDomData(
  candles: Candle[],
  footprintData: FootprintCandleData[] = [],
  currentPriceInput: number | null = null,
  totalRows: number = 36,
  prevPriceInput: number | null = null
): DomLadderState {
  const latestCandle = candles.length > 0 ? candles[candles.length - 1] : null;
  const prevCandle = candles.length > 1 ? candles[candles.length - 2] : null;
  const currentPrice = currentPriceInput || (latestCandle ? latestCandle.close : 4237.0);
  const previousPrice = prevPriceInput || (prevCandle ? prevCandle.close : currentPrice);

  const priceDirection = currentPrice > previousPrice ? 'up' : currentPrice < previousPrice ? 'down' : 'flat';

  const priceStep = getSmartPriceStep(currentPrice);
  const decimals = priceStep >= 1 ? 2 : (priceStep >= 0.01 ? 2 : (priceStep >= 0.001 ? 3 : 5));

  // Center the ladder around current price
  const roundedCurrentPrice = Math.round(currentPrice / priceStep) * priceStep;
  const halfRows = Math.floor(totalRows / 2);
  const startPrice = roundedCurrentPrice + halfRows * priceStep;

  // Aggregate orderflow levels from recent session candles
  const sessionStartIndex = Math.max(0, candles.length - 120);
  const sessionCandles = candles.slice(sessionStartIndex);
  const priceVolumeMap = new Map<string, { buyVol: number; sellVol: number; trades: number }>();

  // 1. Process exact footprint data or intra-candle distribution
  sessionCandles.forEach((c, idx) => {
    const globalIdx = sessionStartIndex + idx;
    const fp = footprintData && globalIdx < footprintData.length ? footprintData[globalIdx] : null;
    if (fp && fp.levels && fp.levels.length > 0) {
      fp.levels.forEach((lvl: any) => {
        const pMid = lvl.levelMid !== undefined ? lvl.levelMid : (lvl.price !== undefined ? lvl.price : c.close);
        const buyV = lvl.askVol !== undefined ? lvl.askVol : (lvl.buyVal !== undefined ? lvl.buyVal : (lvl.buyVolume || 0));
        const sellV = lvl.bidVol !== undefined ? lvl.bidVol : (lvl.sellVal !== undefined ? lvl.sellVal : (lvl.sellVolume || 0));
        const totV = lvl.totalVol !== undefined ? lvl.totalVol : (lvl.volVal !== undefined ? lvl.volVal : (lvl.volume || buyV + sellV));

        const roundedP = (Math.round(pMid / priceStep) * priceStep).toFixed(decimals);
        const existing = priceVolumeMap.get(roundedP) || { buyVol: 0, sellVol: 0, trades: 0 };
        existing.buyVol += buyV;
        existing.sellVol += sellV;
        existing.trades += Math.max(1, Math.round(totV * 0.45));
        priceVolumeMap.set(roundedP, existing);
      });
    } else {
      // Intra-candle volumetric auction theory model
      const isBull = c.close >= c.open;
      const bodyHigh = Math.max(c.open, c.close);
      const bodyLow = Math.min(c.open, c.close);
      const span = Math.max(priceStep, c.high - c.low);
      const stepsInCandle = Math.max(1, Math.floor(span / priceStep));
      const volPerStep = (c.volume || 100) / stepsInCandle;

      for (let p = c.low; p <= c.high; p += priceStep) {
        const roundedP = (Math.round(p / priceStep) * priceStep).toFixed(decimals);
        const existing = priceVolumeMap.get(roundedP) || { buyVol: 0, sellVol: 0, trades: 0 };
        
        let buyRatio = isBull ? 0.58 : 0.42;
        if (p >= bodyLow && p <= bodyHigh) {
          buyRatio = isBull ? 0.64 : 0.36;
        } else if (p > bodyHigh) {
          buyRatio = 0.28; // Upper wick selling rejection
        } else if (p < bodyLow) {
          buyRatio = 0.72; // Lower wick buying absorption
        }

        const b = volPerStep * buyRatio;
        const s = volPerStep * (1 - buyRatio);
        existing.buyVol += b;
        existing.sellVol += s;
        existing.trades += Math.max(1, Math.round(volPerStep * 0.5));
        priceVolumeMap.set(roundedP, existing);
      }
    }
  });

  // 2. Build DOM Ladder Rows from top price down to bottom price
  const rows: DomLadderRow[] = [];
  let maxVolume = 1;
  let maxTrades = 1;
  let maxDelta = 1;
  let totalBuyVol = 0;
  let totalSellVol = 0;

  // Best bid and best ask levels
  const bestBidPrice = roundedCurrentPrice;
  const bestAskPrice = roundedCurrentPrice + priceStep;
  const spread = parseFloat((bestAskPrice - bestBidPrice).toFixed(decimals));

  let pocPrice = roundedCurrentPrice;
  let highestVolAtPoc = 0;
  let maxBidWallSize = 0;
  let maxBidWallPrice = bestBidPrice;
  let maxAskWallSize = 0;
  let maxAskWallPrice = bestAskPrice;

  for (let r = 0; r < totalRows; r++) {
    const rowPrice = startPrice - r * priceStep;
    const formattedPriceKey = rowPrice.toFixed(decimals);
    const formattedDisplay = formatPriceShorthand(rowPrice, true);

    const isAsk = rowPrice >= bestAskPrice;
    const isBid = rowPrice <= bestBidPrice;
    const isBestBid = Math.abs(rowPrice - bestBidPrice) < priceStep * 0.4;
    const isBestAsk = Math.abs(rowPrice - bestAskPrice) < priceStep * 0.4;
    const isCurrentPrice = Math.abs(rowPrice - currentPrice) < priceStep * 0.55 || isBestBid;

    // Simulated high-frequency Limit Order Book depth (Bids and Asks)
    // with realistic clustering and liquidity blocks
    const priceHash = Math.abs(Math.sin(rowPrice * 127.31 + 45.19));
    const isHighLiquidity = priceHash > 0.76;
    const depthSize = Math.floor(priceHash * 85 + (isHighLiquidity ? 45 : 10));

    const bidDepth = isBid ? depthSize : null;
    const askDepth = isAsk ? depthSize : null;

    if (bidDepth && bidDepth > maxBidWallSize && !isBestBid) {
      maxBidWallSize = bidDepth;
      maxBidWallPrice = rowPrice;
    }
    if (askDepth && askDepth > maxAskWallSize && !isBestAsk) {
      maxAskWallSize = askDepth;
      maxAskWallPrice = rowPrice;
    }

    // Retrieve order flow volume metrics
    const orderflow = priceVolumeMap.get(formattedPriceKey) || {
      buyVol: Math.round(priceHash * 2400 + 400),
      sellVol: Math.round((1 - priceHash) * 2100 + 350),
      trades: Math.round(priceHash * 1800 + 500),
    };

    const bVol = Math.round(orderflow.buyVol);
    const sVol = Math.round(orderflow.sellVol);
    const tVol = bVol + sVol;
    const trades = orderflow.trades;
    const delta = bVol - sVol;
    const imbalancePct = tVol > 0 ? Number(((bVol / tVol) * 100).toFixed(2)) : 50.0;

    if (tVol > highestVolAtPoc) {
      highestVolAtPoc = tVol;
      pocPrice = rowPrice;
    }

    if (tVol > maxVolume) maxVolume = tVol;
    if (trades > maxTrades) maxTrades = trades;
    if (Math.abs(delta) > maxDelta) maxDelta = Math.abs(delta);

    totalBuyVol += bVol;
    totalSellVol += sVol;

    rows.push({
      price: rowPrice,
      formattedPrice: formattedDisplay,
      bidDepth,
      askDepth,
      isHighBidLiquidity: isBid && isHighLiquidity,
      isHighAskLiquidity: isAsk && isHighLiquidity,
      isMaxBidWall: false, // Calculated in pass 2
      isMaxAskWall: false, // Calculated in pass 2
      isBestBid,
      isBestAsk,
      isPoc: false, // Calculated in pass 2 below
      isCurrentPrice,
      buyVolume: bVol,
      sellVolume: sVol,
      totalVolume: tVol,
      trades,
      delta,
      cumulativeDelta: 0,
      imbalancePct,
      isPeakVolume: false,
      isPeakTrades: false,
      isPeakDeltaImbalance: Math.abs(delta) > 500,
      lastTradeSize: Math.round(priceHash * 15 + 1),
    });
  }

  // Pass 2: Calculate cumulative delta & assign POC / Peak / Wall tags
  let cumDelta = 0;
  for (let i = rows.length - 1; i >= 0; i--) {
    cumDelta += rows[i].delta;
    rows[i].cumulativeDelta = cumDelta;
    if (Math.abs(rows[i].price - pocPrice) < priceStep * 0.4) {
      rows[i].isPoc = true;
    }
    if (rows[i].totalVolume === maxVolume) {
      rows[i].isPeakVolume = true;
    }
    if (rows[i].trades === maxTrades) {
      rows[i].isPeakTrades = true;
    }
    if (rows[i].bidDepth && rows[i].bidDepth === maxBidWallSize && maxBidWallSize > 0 && !rows[i].isBestBid) {
      rows[i].isMaxBidWall = true;
    }
    if (rows[i].askDepth && rows[i].askDepth === maxAskWallSize && maxAskWallSize > 0 && !rows[i].isBestAsk) {
      rows[i].isMaxAskWall = true;
    }
  }

  // Key levels for chart overlay
  const keyLevels: DomKeyLevel[] = [
    {
      price: pocPrice,
      type: 'poc',
      label: 'DOM (poc)',
      volumeOrSize: highestVolAtPoc,
      formattedPrice: formatPriceShorthand(pocPrice, true),
    },
    {
      price: maxBidWallPrice,
      type: 'bid_wall',
      label: 'DOM BID WALL',
      volumeOrSize: maxBidWallSize,
      formattedPrice: formatPriceShorthand(maxBidWallPrice, true),
    },
    {
      price: maxAskWallPrice,
      type: 'ask_wall',
      label: 'DOM ASK WALL',
      volumeOrSize: maxAskWallSize,
      formattedPrice: formatPriceShorthand(maxAskWallPrice, true),
    }
  ];

  return {
    rows,
    pocPrice,
    maxVolume,
    maxTrades,
    maxDelta,
    totalBuyVol,
    totalSellVol,
    currentPrice,
    previousPrice,
    priceDirection,
    priceStep,
    bestBidPrice,
    bestAskPrice,
    spread,
    keyLevels,
    highBidWall: maxBidWallSize > 0 ? { price: maxBidWallPrice, size: maxBidWallSize } : null,
    highAskWall: maxAskWallSize > 0 ? { price: maxAskWallPrice, size: maxAskWallSize } : null,
  };
}

