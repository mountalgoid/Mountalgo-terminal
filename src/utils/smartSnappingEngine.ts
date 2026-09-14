import { Point, DrawingItem, DrawingToolType } from './drawingTools';

export interface CandleOHLC {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export type SnapTargetType =
  | 'HIGH'
  | 'LOW'
  | 'OPEN'
  | 'CLOSE'
  | 'BODY_MID'
  | 'SWING_HIGH'
  | 'SWING_LOW'
  | 'DRAWING_ANCHOR'
  | 'HORIZONTAL_ALIGN'
  | 'VERTICAL_ALIGN'
  | 'ANGLE_SNAP'
  | 'FIB_SWING';

export interface SmartSnapResult {
  price: number;
  time: number;
  x: number;
  y: number;
  isSnapped: boolean;
  snapType?: SnapTargetType;
  label?: string;
  subLabel?: string;
  badgeColor?: string;
  sourceCandle?: CandleOHLC;
  guidelines?: SmartGuideline[];
  angleInfo?: {
    angleDegrees: number;
    isAngleSnapped: boolean;
    snapAngleText?: string;
    lengthPx: number;
    barsCount: number;
    priceDelta: number;
    percentDelta: number;
  };
}

export interface SmartGuideline {
  type: 'horizontal' | 'vertical' | 'angle' | 'fib_level';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  label?: string;
}

export interface SmartSnappingOptions {
  magnetMode: boolean;
  magnetStrength?: 'weak' | 'strong'; // weak: 14px, strong: 30px
  smartAngleSnap?: boolean; // 0°, 45°, 90° angle snapping
  alignToExistingDrawings?: boolean;
  isShiftPressed?: boolean;
  activeTool?: DrawingToolType;
  currentDrawing?: DrawingItem | null;
  drawings?: DrawingItem[];
}

export interface CoordinateUtils {
  chartWidth: number;
  fullHeight: number;
  mainChartHeight: number;
  priceRange: number;
  minPrice?: number;
  maxPrice?: number;
  candleWidth: number;
  candleSpacing?: number;
  totalCandleSlot: number;
  safeOffset: number;
  getY: (price: number) => number;
  getPriceFromY: (y: number) => number;
  getXFromTime: (time: number) => number;
  getTimeFromX: (x: number) => number;
}

/**
 * Finds Swing Highs and Swing Lows within visible candles
 */
export function findSwingPoints(
  candles: CandleOHLC[],
  lookback = 3
): { swingHighs: { candle: CandleOHLC; index: number }[]; swingLows: { candle: CandleOHLC; index: number }[] } {
  const swingHighs: { candle: CandleOHLC; index: number }[] = [];
  const swingLows: { candle: CandleOHLC; index: number }[] = [];

  if (candles.length < lookback * 2 + 1) return { swingHighs, swingLows };

  for (let i = lookback; i < candles.length - lookback; i++) {
    const current = candles[i];
    let isHigh = true;
    let isLow = true;

    for (let j = 1; j <= lookback; j++) {
      if (candles[i - j].high >= current.high || candles[i + j].high >= current.high) {
        isHigh = false;
      }
      if (candles[i - j].low <= current.low || candles[i + j].low <= current.low) {
        isLow = false;
      }
    }

    if (isHigh) {
      swingHighs.push({ candle: current, index: i });
    }
    if (isLow) {
      swingLows.push({ candle: current, index: i });
    }
  }

  return { swingHighs, swingLows };
}

/**
 * Calculates smart snapped price, time, coordinates, alignment guidelines and angle locks
 */
export function calculateSmartSnap(
  rawX: number,
  rawY: number,
  candles: CandleOHLC[],
  utils: CoordinateUtils,
  options: SmartSnappingOptions
): SmartSnapResult {
  const {
    magnetMode,
    magnetStrength = 'strong',
    smartAngleSnap = true,
    alignToExistingDrawings = true,
    isShiftPressed = false,
    activeTool = 'cursor',
    currentDrawing = null,
    drawings = [],
  } = options;

  const { getY, getPriceFromY, getXFromTime, getTimeFromX, chartWidth, fullHeight } = utils;

  const rawPrice = getPriceFromY(rawY);
  const rawTime = getTimeFromX(rawX);

  const result: SmartSnapResult = {
    price: rawPrice,
    time: rawTime,
    x: rawX,
    y: rawY,
    isSnapped: false,
    guidelines: [],
  };

  if (candles.length === 0 || activeTool === 'brush') return result;

  const snapPixelThreshold = magnetStrength === 'strong' ? 28 : 14;
  const alignmentPixelThreshold = 8;

  // 1. Check Angle Snapping if we have a start point from in-progress drawing (e.g. Trendline, Ray, Fibonacci, Ruler, Arrow, etc.)
  const startPoint = currentDrawing && currentDrawing.points.length > 0 ? currentDrawing.points[0] : null;
  const isMultiPointTool = [
    'trendline',
    'ray',
    'extended_line',
    'arrow',
    'parallel_channel',
    'fibonacci',
    'fib_fan',
    'pitchfork',
    'ruler',
    'rectangle',
  ].includes(activeTool);

  let angleSnapped = false;
  let snappedAngleDeg = 0;
  let angleSnapLabel = '';

  if (startPoint && (smartAngleSnap || isShiftPressed) && isMultiPointTool) {
    const startX = getXFromTime(startPoint.time);
    const startY = getY(startPoint.price);
    const dx = rawX - startX;
    const dy = rawY - startY;

    if (Math.hypot(dx, dy) > 8) {
      // Calculate angle in degrees from -180 to 180 (0 is horizontal right, 90 is straight down on screen)
      const rawAngleRad = Math.atan2(dy, dx);
      let rawAngleDeg = (rawAngleRad * 180) / Math.PI;

      // Define standard snap angles
      const snapAngles = isShiftPressed
        ? [0, 45, 90, 135, 180, -45, -90, -135, -180]
        : [0, 45, 90, 135, 180, -45, -90, -135, -180];

      const angleTolerance = isShiftPressed ? 22.5 : 4.5; // High tolerance when Shift is held

      let closestSnap = null;
      let minAngleDiff = Infinity;

      for (const targetAngle of snapAngles) {
        let diff = Math.abs(rawAngleDeg - targetAngle);
        if (diff > 180) diff = 360 - diff;
        if (diff < minAngleDiff && diff <= angleTolerance) {
          minAngleDiff = diff;
          closestSnap = targetAngle;
        }
      }

      if (closestSnap !== null) {
        angleSnapped = true;
        snappedAngleDeg = closestSnap;

        const dist = Math.hypot(dx, dy);
        const snappedRad = (closestSnap * Math.PI) / 180;
        let newX = startX + Math.cos(snappedRad) * dist;
        let newY = startY + Math.sin(snappedRad) * dist;

        // Exact snaps for horizontal & vertical
        if (Math.abs(closestSnap) === 0 || Math.abs(closestSnap) === 180) {
          newY = startY;
          angleSnapLabel = '0.0° Horizontal Lock';
        } else if (Math.abs(closestSnap) === 90) {
          newX = startX;
          angleSnapLabel = '90.0° Vertical Lock';
        } else if (Math.abs(closestSnap) === 45 || Math.abs(closestSnap) === 135) {
          angleSnapLabel = `${closestSnap}° Diagonal Lock`;
        }

        result.x = newX;
        result.y = newY;
        result.price = getPriceFromY(newY);
        result.time = getTimeFromX(newX);
        result.isSnapped = true;
        result.snapType = 'ANGLE_SNAP';
        result.label = angleSnapLabel;
        result.badgeColor = '#a855f7';

        // Add visual alignment guideline
        if (Math.abs(closestSnap) === 0 || Math.abs(closestSnap) === 180) {
          result.guidelines?.push({
            type: 'horizontal',
            x1: 0,
            y1: startY,
            x2: chartWidth,
            y2: startY,
            color: '#a855f7',
            label: '0° Horizontal Axis',
          });
        } else if (Math.abs(closestSnap) === 90) {
          result.guidelines?.push({
            type: 'vertical',
            x1: startX,
            y1: 0,
            x2: startX,
            y2: fullHeight,
            color: '#a855f7',
            label: '90° Vertical Axis',
          });
        }
      }

      // Calculate angle HUD metadata
      const bars = Math.max(1, Math.round(Math.abs(dx) / utils.totalCandleSlot));
      const pDiff = result.price - startPoint.price;
      const pct = (pDiff / (startPoint.price || 1)) * 100;

      result.angleInfo = {
        angleDegrees: parseFloat((-rawAngleDeg)?.toFixed(1)), // Invert for cartesian standard (up is positive)
        isAngleSnapped: angleSnapped,
        snapAngleText: angleSnapLabel || undefined,
        lengthPx: Math.round(dist(startX, startY, result.x, result.y)),
        barsCount: bars,
        priceDelta: pDiff,
        percentDelta: pct,
      };
    }
  }

  // 2. If not angle-locked or if magnet mode is enabled, check Candle OHLC and Swing Point Snapping
  if (magnetMode || activeTool === 'fibonacci' || activeTool === 'fib_fan' || activeTool === 'pitchfork') {
    const floatIndex =
      candles.length - 1 - utils.safeOffset - (chartWidth - rawX - utils.candleWidth / 2) / utils.totalCandleSlot;
    const closestIdx = Math.max(0, Math.min(candles.length - 1, Math.round(floatIndex)));

    // Look at immediate neighborhood of candles (±4 bars)
    let bestDist = snapPixelThreshold;
    let bestCandle: CandleOHLC | null = null;
    let bestSnapPrice: number | null = null;
    let bestSnapType: SnapTargetType | null = null;
    let bestSnapLabel = '';

    const scanRadius = magnetStrength === 'strong' ? 5 : 3;
    const startIdx = Math.max(0, closestIdx - scanRadius);
    const endIdx = Math.min(candles.length - 1, closestIdx + scanRadius);

    // Compute swings for visible window
    const { swingHighs, swingLows } = findSwingPoints(candles.slice(Math.max(0, closestIdx - 30), Math.min(candles.length, closestIdx + 30)), 2);

    for (let i = startIdx; i <= endIdx; i++) {
      const c = candles[i];
      const candleX = getXFromTime(c.time);
      const xDist = Math.abs(rawX - candleX);

      if (xDist > utils.totalCandleSlot * 1.8) continue;

      const yHigh = getY(c.high);
      const yLow = getY(c.low);
      const yOpen = getY(c.open);
      const yClose = getY(c.close);
      const yMid = (yHigh + yLow) / 2;

      const isSwingH = swingHighs.some((sh) => sh.candle.time === c.time);
      const isSwingL = swingLows.some((sl) => sl.candle.time === c.time);

      // Candlestick snap targets with priority: Swing High/Low > Extreme Wick (High/Low) > Open/Close > Mid
      const targets: { y: number; price: number; type: SnapTargetType; label: string; priorityBonus: number }[] = [
        {
          y: yHigh,
          price: c.high,
          type: isSwingH ? 'SWING_HIGH' : 'HIGH',
          label: isSwingH ? `Swing High: $${c.high?.toFixed(2)}` : `High: $${c.high?.toFixed(2)}`,
          priorityBonus: isSwingH ? 6 : 2,
        },
        {
          y: yLow,
          price: c.low,
          type: isSwingL ? 'SWING_LOW' : 'LOW',
          label: isSwingL ? `Swing Low: $${c.low?.toFixed(2)}` : `Low: $${c.low?.toFixed(2)}`,
          priorityBonus: isSwingL ? 6 : 2,
        },
        {
          y: yClose,
          price: c.close,
          type: 'CLOSE',
          label: `Close: $${c.close?.toFixed(2)}`,
          priorityBonus: 0,
        },
        {
          y: yOpen,
          price: c.open,
          type: 'OPEN',
          label: `Open: $${c.open?.toFixed(2)}`,
          priorityBonus: 0,
        },
        {
          y: yMid,
          price: (c.high + c.low) / 2,
          type: 'BODY_MID',
          label: `50% Candle Mid: $${((c.high + c.low) / 2)?.toFixed(2)}`,
          priorityBonus: -2,
        },
      ];

      for (const t of targets) {
        const d = Math.hypot(rawX - candleX, rawY - t.y) - t.priorityBonus;
        if (d < bestDist) {
          bestDist = d;
          bestCandle = c;
          bestSnapPrice = t.price;
          bestSnapType = t.type;
          bestSnapLabel = t.label;
        }
      }
    }

    if (bestCandle && bestSnapPrice !== null && bestSnapType !== null) {
      const snapX = getXFromTime(bestCandle.time);
      const snapY = getY(bestSnapPrice);

      result.price = bestSnapPrice;
      result.time = bestCandle.time;
      result.x = snapX;
      result.y = snapY;
      result.isSnapped = true;
      result.snapType = bestSnapType;
      result.label = bestSnapLabel;
      result.sourceCandle = bestCandle;

      if (bestSnapType === 'SWING_HIGH' || bestSnapType === 'HIGH') {
        result.badgeColor = '#10b981'; // Green
      } else if (bestSnapType === 'SWING_LOW' || bestSnapType === 'LOW') {
        result.badgeColor = '#f43f5e'; // Red
      } else {
        result.badgeColor = '#38bdf8'; // Cyan
      }

      // Add horizontal snapping line across local chart width
      result.guidelines?.push({
        type: 'horizontal',
        x1: Math.max(0, snapX - utils.totalCandleSlot * 6),
        y1: snapY,
        x2: Math.min(chartWidth, snapX + utils.totalCandleSlot * 6),
        y2: snapY,
        color: result.badgeColor || '#38bdf8',
        label: bestSnapLabel,
      });

      // Fibonacci specialized snap description
      if (activeTool === 'fibonacci') {
        if (!startPoint) {
          result.subLabel = 'Fibonacci Start Point (0.000)';
        } else {
          const diff = bestSnapPrice - startPoint.price;
          result.subLabel = `Fib Range: $${Math.abs(diff)?.toFixed(2)} (1.000)`;
        }
      }
    }
  }

  // 3. Point-to-Point Alignment with Existing Drawings (Horizontal / Vertical Alignments)
  if (alignToExistingDrawings && !result.isSnapped && drawings.length > 0) {
    let closestAlignY: number | null = null;
    let closestAlignPrice: number | null = null;
    let minAlignDistY = alignmentPixelThreshold;
    let alignLabel = '';

    for (const d of drawings) {
      for (const p of d.points) {
        const py = getY(p.price);
        const distY = Math.abs(rawY - py);
        if (distY < minAlignDistY) {
          minAlignDistY = distY;
          closestAlignY = py;
          closestAlignPrice = p.price;
          alignLabel = `Align: $${p.price?.toFixed(2)}`;
        }
      }
    }

    if (closestAlignY !== null && closestAlignPrice !== null) {
      result.y = closestAlignY;
      result.price = closestAlignPrice;
      result.isSnapped = true;
      result.snapType = 'HORIZONTAL_ALIGN';
      result.label = alignLabel;
      result.badgeColor = '#ec4899'; // Pink alignment guideline

      result.guidelines?.push({
        type: 'horizontal',
        x1: 0,
        y1: closestAlignY,
        x2: chartWidth,
        y2: closestAlignY,
        color: '#ec4899',
        label: alignLabel,
      });
    }
  }

  return result;
}

function dist(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1);
}

/**
 * Renders smart snapping rings, dashed alignment guidelines, and floating angle/delta HUD on canvas
 */
export function renderSmartSnappingOverlay(
  ctx: CanvasRenderingContext2D,
  snapResult: SmartSnapResult | null,
  utils: CoordinateUtils,
  currentPalette: { bull: string; bear: string; poc: string },
  activeTool: DrawingToolType,
  currentDrawing: DrawingItem | null
) {
  if (!snapResult || activeTool === 'brush') return;

  const { x, y, isSnapped, snapType, label, subLabel, badgeColor = '#38bdf8', guidelines = [], angleInfo } = snapResult;

  ctx.save();

  // 1. Draw Smart Alignment Guidelines
  guidelines.forEach((g) => {
    ctx.save();
    ctx.strokeStyle = g.color || '#38bdf8';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);

    ctx.beginPath();
    ctx.moveTo(g.x1, g.y1);
    ctx.lineTo(g.x2, g.y2);
    ctx.stroke();

    // Guideline tag on axis edge
    if (g.type === 'horizontal' && g.label) {
      ctx.fillStyle = g.color || '#38bdf8';
      ctx.font = 'bold 9px monospace';
      const textW = ctx.measureText(g.label).width + 8;
      ctx.fillRect(utils.chartWidth - textW - 2, g.y1 - 8, textW, 16);
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.fillText(g.label, utils.chartWidth - textW / 2 - 2, g.y1 + 3.5);
    }
    ctx.restore();
  });

  // 2. Draw Magnetic Snap Target Ring & Crosshair when snapped
  if (isSnapped && (snapType === 'HIGH' || snapType === 'LOW' || snapType === 'SWING_HIGH' || snapType === 'SWING_LOW' || snapType === 'OPEN' || snapType === 'CLOSE' || snapType === 'DRAWING_ANCHOR')) {
    // Outer Glow Ring
    ctx.save();
    ctx.fillStyle = `${badgeColor}22`;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();

    // Target Crosshair
    ctx.strokeStyle = badgeColor;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(x, y, 6.5, 0, Math.PI * 2);
    ctx.stroke();

    // Center Core Dot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Crosshair ticks
    ctx.strokeStyle = badgeColor;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x - 10, y);
    ctx.lineTo(x - 4, y);
    ctx.moveTo(x + 4, y);
    ctx.lineTo(x + 10, y);
    ctx.moveTo(x, y - 10);
    ctx.lineTo(x, y - 4);
    ctx.moveTo(x, y + 4);
    ctx.lineTo(x, y + 10);
    ctx.stroke();

    // Snap Tag Badge Pill
    if (label) {
      const isTop = y > 35;
      const badgeY = isTop ? y - 18 : y + 20;
      ctx.font = 'bold 9.5px monospace';
      const mainTextW = ctx.measureText(label).width;
      const subTextW = subLabel ? ctx.measureText(subLabel).width : 0;
      const badgeW = Math.max(mainTextW, subTextW) + 14;

      const badgeX = Math.min(Math.max(badgeW / 2 + 4, x), utils.chartWidth - badgeW / 2 - 4);

      ctx.fillStyle = '#0b0f19';
      ctx.beginPath();
      ctx.roundRect(badgeX - badgeW / 2, badgeY - 10, badgeW, subLabel ? 28 : 18, 4);
      ctx.fill();

      ctx.strokeStyle = badgeColor;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.fillStyle = badgeColor;
      ctx.textAlign = 'center';
      ctx.fillText(label, badgeX, badgeY + (subLabel ? -1 : 3));

      if (subLabel) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '8.5px monospace';
        ctx.fillText(subLabel, badgeX, badgeY + 11);
      }
    }
    ctx.restore();
  }

  // 3. Live Angle & Dimension HUD when drawing multi-point tools (Trendline, Fibonacci, Parallel Channel, Ruler)
  if (currentDrawing && angleInfo && currentDrawing.points.length > 0) {
    const p0 = currentDrawing.points[0];
    const startX = utils.getXFromTime(p0.time);
    const startY = utils.getY(p0.price);

    const midX = (startX + x) / 2;
    const midY = (startY + y) / 2;

    const angleTxt = `${angleInfo.angleDegrees >= 0 ? '+' : ''}${angleInfo.angleDegrees}°`;
    const snapTxt = angleInfo.snapAngleText ? ` [${angleInfo.snapAngleText}]` : '';
    const dimTxt = `Δ${angleInfo.barsCount}b | ${angleInfo.priceDelta >= 0 ? '+' : ''}${angleInfo.priceDelta?.toFixed(2)} (${angleInfo.percentDelta >= 0 ? '+' : ''}${angleInfo.percentDelta?.toFixed(2)}%)`;

    ctx.save();
    ctx.font = 'bold 9px monospace';
    const line1 = `${angleTxt}${snapTxt}`;
    const w1 = ctx.measureText(line1).width;
    const w2 = ctx.measureText(dimTxt).width;
    const cardW = Math.max(w1, w2) + 16;
    const cardH = 28;

    const cardX = Math.min(Math.max(cardW / 2 + 6, midX), utils.chartWidth - cardW / 2 - 6);
    const cardY = Math.min(Math.max(cardH / 2 + 6, midY - 24), utils.fullHeight - cardH / 2 - 6);

    ctx.fillStyle = 'rgba(11, 15, 25, 0.92)';
    ctx.beginPath();
    ctx.roundRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH, 5);
    ctx.fill();

    ctx.strokeStyle = angleInfo.isAngleSnapped ? '#a855f7' : '#38bdf8';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Line 1: Angle & Lock
    ctx.fillStyle = angleInfo.isAngleSnapped ? '#c084fc' : '#38bdf8';
    ctx.textAlign = 'center';
    ctx.fillText(line1, cardX, cardY - 2);

    // Line 2: Dimensions
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '8.5px monospace';
    ctx.fillText(dimTxt, cardX, cardY + 9);

    ctx.restore();
  }

  ctx.restore();
}
