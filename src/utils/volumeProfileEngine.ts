import { VolumeProfileDetailConfig, DEFAULT_VOLUME_PROFILE_CONFIG } from './indicators';

export interface CandleLike {
  time?: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface VolumeProfileNode {
  index: number;
  priceTop: number;
  priceBottom: number;
  priceCenter: number;
  totalVol: number;
  buyVol: number;
  sellVol: number;
  delta: number;
  isPoc: boolean;
  isVah: boolean;
  isVal: boolean;
  isHvn: boolean;
  isLvn: boolean;
  inValueArea: boolean;
}

export interface VolumeProfileResult {
  nodes: VolumeProfileNode[];
  maxVol: number;
  totalVol: number;
  pocPrice: number;
  pocNode: VolumeProfileNode | null;
  vahPrice: number;
  valPrice: number;
  hvnNodes: VolumeProfileNode[];
  lvnNodes: VolumeProfileNode[];
}

export function getContrastTextColor(hexColor: string): '#000000' | '#ffffff' {
  if (!hexColor) return '#ffffff';
  let hex = hexColor.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  if (hex.length < 6) return '#ffffff';
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 135 ? '#000000' : '#ffffff';
}

export function hexToRgbAlpha(hex: string, alpha: number): string {
  if (!hex || typeof hex !== 'string') return `rgba(56, 189, 248, ${alpha})`;
  const aRounded = Math.round(Math.max(0, Math.min(1, alpha)) * 100) / 100;
  const clean = hex.replace('#', '');
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${aRounded})`;
  }
  return `rgba(56, 189, 248, ${aRounded})`;
}

/**
 * High-performance, institutional Visible Range Volume Profile (VPVR) Engine
 * Dynamically partitions the visible vertical price space into discrete volume nodes.
 */
export function computeVolumeProfile(
  candles: CandleLike[],
  priceMin: number,
  priceMax: number,
  numRows: number = 54,
  valueAreaPct: number = 0.70
): VolumeProfileResult {
  if (!candles || candles.length === 0 || priceMax <= priceMin) {
    return {
      nodes: [],
      maxVol: 0,
      totalVol: 0,
      pocPrice: 0,
      pocNode: null,
      vahPrice: 0,
      valPrice: 0,
      hvnNodes: [],
      lvnNodes: [],
    };
  }

  const clampedRows = Math.max(20, Math.min(100, numRows));
  const rowHeight = (priceMax - priceMin) / clampedRows;
  const nodes: VolumeProfileNode[] = [];

  for (let r = 0; r < clampedRows; r++) {
    const pBot = priceMin + r * rowHeight;
    const pTop = pBot + rowHeight;
    nodes.push({
      index: r,
      priceBottom: pBot,
      priceTop: pTop,
      priceCenter: (pBot + pTop) / 2,
      totalVol: 0,
      buyVol: 0,
      sellVol: 0,
      delta: 0,
      isPoc: false,
      isVah: false,
      isVal: false,
      isHvn: false,
      isLvn: false,
      inValueArea: false,
    });
  }

  let totalVol = 0;

  // Distribute volume into overlapping price rows
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const vol = c.volume || 0;
    if (vol <= 0) continue;

    const high = c.high;
    const low = c.low;
    const range = high - low;

    if (range <= 0.000001) {
      const rIdx = Math.max(0, Math.min(clampedRows - 1, Math.floor((c.close - priceMin) / rowHeight)));
      nodes[rIdx].totalVol += vol;
      const isBull = c.close >= c.open;
      const rBuy = isBull ? vol * 0.75 : vol * 0.25;
      const rSell = vol - rBuy;
      nodes[rIdx].buyVol += rBuy;
      nodes[rIdx].sellVol += rSell;
      nodes[rIdx].delta = nodes[rIdx].buyVol - nodes[rIdx].sellVol;
      totalVol += vol;
      continue;
    }

    const minRow = Math.max(0, Math.min(clampedRows - 1, Math.floor((Math.max(low, priceMin) - priceMin) / rowHeight)));
    const maxRow = Math.max(0, Math.min(clampedRows - 1, Math.floor((Math.min(high, priceMax) - priceMin) / rowHeight)));

    const weights: number[] = [];
    const buyWeights: number[] = [];
    const sellWeights: number[] = [];
    let sumW = 0;

    for (let r = minRow; r <= maxRow; r++) {
      const node = nodes[r];
      const overlap = Math.max(0, Math.min(high, node.priceTop) - Math.max(low, node.priceBottom));
      const w = overlap / range;
      weights.push(w);
      sumW += w;

      const pos = Math.max(0, Math.min(1, (node.priceCenter - low) / range));
      if (c.close >= c.open) {
        buyWeights.push(w * (0.35 + 0.65 * pos));
        sellWeights.push(w * (0.65 - 0.35 * pos));
      } else {
        buyWeights.push(w * (0.35 * pos));
        sellWeights.push(w * (1.0 - 0.35 * pos));
      }
    }

    if (sumW <= 0) continue;

    const sumWeights = sumW || 1;
    let idx = 0;
    for (let r = minRow; r <= maxRow; r++) {
      const normW = weights[idx] / sumWeights;
      const rVol = vol * normW;
      const bW = buyWeights[idx] || 0;
      const sW = sellWeights[idx] || 0;
      const bRatio = (bW + sW) > 0 ? (bW / (bW + sW)) : (c.close >= c.open ? 0.75 : 0.25);
      const rBuy = rVol * bRatio;
      const rSell = rVol * (1 - bRatio);

      nodes[r].totalVol += rVol;
      nodes[r].buyVol += rBuy;
      nodes[r].sellVol += rSell;
      nodes[r].delta = nodes[r].buyVol - nodes[r].sellVol;

      totalVol += rVol;
      idx++;
    }
  }

  if (totalVol <= 0 || nodes.length === 0) {
    return {
      nodes,
      maxVol: 0,
      totalVol: 0,
      pocPrice: (priceMin + priceMax) / 2,
      pocNode: null,
      vahPrice: priceMax,
      valPrice: priceMin,
      hvnNodes: [],
      lvnNodes: [],
    };
  }

  // Find POC (Point of Control)
  let maxVol = 0;
  let pocIdx = 0;
  for (let r = 0; r < nodes.length; r++) {
    if (nodes[r].totalVol > maxVol) {
      maxVol = nodes[r].totalVol;
      pocIdx = r;
    }
  }

  nodes[pocIdx].isPoc = true;
  const pocNode = nodes[pocIdx];
  const pocPrice = pocNode.priceCenter;

  // Calculate 70% Value Area (VAH / VAL) expanding from POC
  const targetAreaVol = totalVol * valueAreaPct;
  let currentAreaVol = nodes[pocIdx].totalVol;
  nodes[pocIdx].inValueArea = true;

  let upIdx = pocIdx + 1;
  let downIdx = pocIdx - 1;

  while (currentAreaVol < targetAreaVol && (upIdx < nodes.length || downIdx >= 0)) {
    const nextUpVol = upIdx < nodes.length ? nodes[upIdx].totalVol : -1;
    const nextDownVol = downIdx >= 0 ? nodes[downIdx].totalVol : -1;

    if (nextUpVol >= nextDownVol && upIdx < nodes.length) {
      nodes[upIdx].inValueArea = true;
      currentAreaVol += nodes[upIdx].totalVol;
      upIdx++;
    } else if (downIdx >= 0) {
      nodes[downIdx].inValueArea = true;
      currentAreaVol += nodes[downIdx].totalVol;
      downIdx--;
    } else if (upIdx < nodes.length) {
      nodes[upIdx].inValueArea = true;
      currentAreaVol += nodes[upIdx].totalVol;
      upIdx++;
    } else {
      break;
    }
  }

  const valIdx = Math.max(0, downIdx + 1);
  const vahIdx = Math.min(nodes.length - 1, upIdx - 1);

  nodes[vahIdx].isVah = true;
  nodes[valIdx].isVal = true;
  const vahPrice = nodes[vahIdx].priceTop;
  const valPrice = nodes[valIdx].priceBottom;

  // Detect High Volume Nodes (HVN) & Low Volume Nodes (LVN)
  const avgVol = totalVol / nodes.length;
  const hvnNodes: VolumeProfileNode[] = [];
  const lvnNodes: VolumeProfileNode[] = [];

  for (let r = 0; r < nodes.length; r++) {
    const node = nodes[r];
    if (node.totalVol > avgVol * 1.35) {
      node.isHvn = true;
      hvnNodes.push(node);
    } else if (node.totalVol < avgVol * 0.45 && r > 0 && r < nodes.length - 1) {
      node.isLvn = true;
      lvnNodes.push(node);
    }
  }

  return {
    nodes,
    maxVol,
    totalVol,
    pocPrice,
    pocNode,
    vahPrice,
    valPrice,
    hvnNodes,
    lvnNodes,
  };
}

export interface VolumeProfileRenderContext {
  ctx: CanvasRenderingContext2D;
  chartWidth: number;
  fullHeight: number;
  mainChartHeight: number;
  rightScaleWidth: number;
  getY: (price: number) => number;
  palette: {
    bull: string;
    bear: string;
    poc?: string;
    dark?: string;
  };
  config: VolumeProfileDetailConfig;
  data: VolumeProfileResult;
  isCleanChartMode?: boolean;
  showDomRibbonOffset?: boolean;
  customStartX?: number;
  customWidth?: number;
  crosshairY?: number | null;
}

/**
 * Formats volume numbers cleanly (e.g. 1.2K, 350K, 2.4M)
 */
function formatVpVol(vol: number): string {
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(1)}K`;
  return vol.toFixed(0);
}

/**
 * Helper to draw a horizontal bar with a rounded outer tip
 */
function drawRoundedBarTip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  isRightLayout: boolean,
  radius: number = 2
): void {
  if (w <= 0 || h <= 0) return;
  const r = Math.min(radius, w / 2, h / 2);
  if (r < 1 || typeof (ctx as any).roundRect !== 'function') {
    ctx.fillRect(x, y, w, h);
    return;
  }
  ctx.beginPath();
  if (isRightLayout) {
    // Left edge is outer tip (rounded on left side)
    ctx.moveTo(x + w, y);
    ctx.lineTo(x + r, y);
    ctx.arcTo(x, y, x, y + r, r);
    ctx.lineTo(x, y + h - r);
    ctx.arcTo(x, y + h, x + r, y + h, r);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
  } else {
    // Right edge is outer tip (rounded on right side)
    ctx.moveTo(x, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y);
    ctx.closePath();
  }
  ctx.fill();
}

/**
 * Institutional Y-Axis Volume Profile Overlay Renderer
 * Projects stepped horizontal volume nodes, Value Area (VAH/VAL), and POC badges along the Y-axis.
 */
export function renderVolumeProfileOverlay(params: VolumeProfileRenderContext): void {
  const {
    ctx,
    chartWidth,
    mainChartHeight,
    rightScaleWidth,
    getY,
    palette,
    config,
    data,
    isCleanChartMode = false,
    showDomRibbonOffset = false,
    customStartX,
    customWidth,
    crosshairY,
  } = params;

  if (!data || !data.nodes || data.nodes.length === 0 || data.maxVol <= 0) return;

  const baseConfig = { ...DEFAULT_VOLUME_PROFILE_CONFIG, ...(config || {}) };
  const widthPct = Math.min(35, Math.max(10, baseConfig.widthPercent || 18)) / 100;
  
  // Strict available width calculation to prevent overflow in split/dual-grid layouts
  const maxAvailableVpWidth = Math.max(30, (chartWidth - rightScaleWidth) * 0.40);
  const baseVpWidth = customWidth !== undefined
    ? customWidth
    : (isCleanChartMode
        ? Math.max(50, Math.min(115, Math.floor(chartWidth * (widthPct * 0.75))))
        : Math.max(65, Math.min(220, Math.floor(chartWidth * widthPct))));
  const vpWidth = Math.min(maxAvailableVpWidth, baseVpWidth);

  const domOffset = showDomRibbonOffset ? 58 : 0;
  const isRightLayout = baseConfig.layout !== 'left';
  const vpStartX = customStartX !== undefined
    ? customStartX
    : (isRightLayout ? Math.max(4, chartWidth - rightScaleWidth - vpWidth - domOffset) : 0);
  const vpEndX = Math.min(chartWidth - rightScaleWidth - 2, vpStartX + vpWidth);

  const pocColor = palette.poc || '#f59e0b';
  const bullColor = palette.bull || '#10b981';
  const bearColor = palette.bear || '#ef4444';
  const opacity = Math.max(0.15, Math.min(1.0, baseConfig.opacity ?? 0.45));

  const isLightBg = palette.dark === '#ffffff';

  ctx.save();
  // Clip strictly to main chart display area to eliminate any visual leak in multi-chart or dual-split grid
  ctx.beginPath();
  ctx.rect(0, 0, Math.max(0, chartWidth - rightScaleWidth), mainChartHeight);
  ctx.clip();
  ctx.globalAlpha = 1.0; // 100% SOLID WARNANYA

  const vahY = getY(data.vahPrice);
  const valY = getY(data.valPrice);
  const vaTop = Math.min(vahY, valY);
  const vaHeight = Math.abs(valY - vahY);

  const barMaxW = Math.max(14, vpWidth - 8);
  const isUpDown = baseConfig.colorMode === 'upDown';
  const isDelta = baseConfig.colorMode === 'delta';

  // 1. Precision Stepped Micro-Histogram Bars (SOLID DI AREA VALUE, 0 OPACITY DI LUAR)
  data.nodes.forEach((node) => {
    const yTop = getY(node.priceTop);
    const yBot = getY(node.priceBottom);
    const midY = (yTop + yBot) / 2;

    if (midY < -5 || midY > mainChartHeight + 5) return;

    const pct = Math.min(1.0, node.totalVol / data.maxVol);
    const barW = Math.max(2.5, barMaxW * pct);
    const inVa = Boolean(node.inValueArea);
    const isPocNode = Boolean(node.isPoc);

    // Hairline micro-gap (jarak tiap volume sangat tipis: 0.6px - 1.0px)
    const stepH = Math.max(1.8, Math.abs(yBot - yTop));
    const gapPx = Math.max(0.6, Math.min(1.0, stepH * 0.10));
    const nodeH = Math.max(1.2, stepH - gapPx);
    const nodeY = Math.round(midY - nodeH / 2);

    const barX = isRightLayout ? (vpEndX - barW) : vpStartX;

    if (isPocNode) {
      ctx.fillStyle = pocColor; // SOLID
      ctx.fillRect(barX, nodeY, barW, nodeH);
    } else if (inVa) {
      // Area Value: SOLID 100% OPAQUE
      if (isUpDown) {
        const buyRatio = node.totalVol > 0 ? Math.max(0, Math.min(1, node.buyVol / node.totalVol)) : 0.5;
        const buyW = Math.round(barW * buyRatio);
        const sellW = barW - buyW;

        if (isRightLayout) {
          if (sellW > 0) {
            ctx.fillStyle = bearColor; // SOLID
            ctx.fillRect(vpEndX - barW, nodeY, sellW, nodeH);
          }
          if (buyW > 0) {
            ctx.fillStyle = bullColor; // SOLID
            ctx.fillRect(vpEndX - buyW, nodeY, buyW, nodeH);
          }
        } else {
          if (buyW > 0) {
            ctx.fillStyle = bullColor; // SOLID
            ctx.fillRect(vpStartX, nodeY, buyW, nodeH);
          }
          if (sellW > 0) {
            ctx.fillStyle = bearColor; // SOLID
            ctx.fillRect(vpStartX + buyW, nodeY, sellW, nodeH);
          }
        }
      } else if (isDelta) {
        const isPos = node.delta >= 0;
        ctx.fillStyle = isPos ? bullColor : bearColor; // SOLID
        ctx.fillRect(barX, nodeY, barW, nodeH);
      } else {
        ctx.fillStyle = bullColor; // SOLID
        ctx.fillRect(barX, nodeY, barW, nodeH);
      }
    } else {
      // Di luar Area Value: Sedikit transparan mengikuti kualitas volume
      const outVaAlpha = Math.max(0.18, Math.min(0.38, 0.16 + pct * 0.22));
      const outBullCol = hexToRgbAlpha(bullColor, outVaAlpha);
      const outBearCol = hexToRgbAlpha(bearColor, outVaAlpha);

      if (isUpDown) {
        const buyRatio = node.totalVol > 0 ? Math.max(0, Math.min(1, node.buyVol / node.totalVol)) : 0.5;
        const buyW = Math.round(barW * buyRatio);
        const sellW = barW - buyW;

        if (isRightLayout) {
          if (sellW > 0) {
            ctx.fillStyle = outBearCol;
            ctx.fillRect(vpEndX - barW, nodeY, sellW, nodeH);
          }
          if (buyW > 0) {
            ctx.fillStyle = outBullCol;
            ctx.fillRect(vpEndX - buyW, nodeY, buyW, nodeH);
          }
        } else {
          if (buyW > 0) {
            ctx.fillStyle = outBullCol;
            ctx.fillRect(vpStartX, nodeY, buyW, nodeH);
          }
          if (sellW > 0) {
            ctx.fillStyle = outBearCol;
            ctx.fillRect(vpStartX + buyW, nodeY, sellW, nodeH);
          }
        }
      } else if (isDelta) {
        const isPos = node.delta >= 0;
        ctx.fillStyle = isPos ? outBullCol : outBearCol;
        ctx.fillRect(barX, nodeY, barW, nodeH);
      } else {
        ctx.fillStyle = outBullCol;
        ctx.fillRect(barX, nodeY, barW, nodeH);
      }
    }
  });

  // 2. Value Area 70% Rail Guide (DASHED LINE)
  if (vaHeight > 4) {
    ctx.save();
    const railX = isRightLayout ? (vpEndX - barMaxW * 0.70) : (vpStartX + barMaxW * 0.70);
    ctx.strokeStyle = hexToRgbAlpha(pocColor, 0.35);
    ctx.lineWidth = 1.0;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(railX, vaTop);
    ctx.lineTo(railX, vaTop + vaHeight);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // 3. Point of Control (POC) Line (SOLID LINE - tanpa badge)
  if (data.pocNode) {
    const pocY = getY(data.pocPrice);
    if (baseConfig.showPocLine && pocY >= 0 && pocY <= mainChartHeight) {
      ctx.save();
      const lineLen = 36;
      const pStart = isRightLayout ? (vpEndX - barMaxW - lineLen) : vpStartX;
      const pEnd = isRightLayout ? vpEndX : (vpStartX + barMaxW + lineLen);

      ctx.strokeStyle = pocColor;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([]); // SOLID LINE
      ctx.beginPath();
      ctx.moveTo(pStart, pocY);
      ctx.lineTo(pEnd, pocY);
      ctx.stroke();
      ctx.restore();
    }
  }

  // 6. Value Area High (VAH) & Value Area Low (VAL) Solid Tebal Lines
  if (baseConfig.showVahValLines) {
    ctx.save();
    const lineLen = 28;

    // VAH Solid Tebal Line
    if (vahY >= 0 && vahY <= mainChartHeight) {
      const vStart = isRightLayout ? (vpEndX - barMaxW - lineLen) : vpStartX;
      const vEnd = isRightLayout ? vpEndX : (vpStartX + barMaxW + lineLen);

      ctx.strokeStyle = bullColor;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([]); // SOLID TEBAL
      ctx.beginPath();
      ctx.moveTo(vStart, vahY);
      ctx.lineTo(vEnd, vahY);
      ctx.stroke();
    }

    // VAL Solid Tebal Line
    if (valY >= 0 && valY <= mainChartHeight) {
      const vStart = isRightLayout ? (vpEndX - barMaxW - lineLen) : vpStartX;
      const vEnd = isRightLayout ? vpEndX : (vpStartX + barMaxW + lineLen);

      ctx.strokeStyle = bearColor;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([]); // SOLID TEBAL
      ctx.beginPath();
      ctx.moveTo(vStart, valY);
      ctx.lineTo(vEnd, valY);
      ctx.stroke();
    }

    // 7. HVN (High Volume Node) & LVN (Low Volume Node) Dashed Tebal Lines
    if (baseConfig.showHvnLvn !== false) {
      const prominentHvns = (data.hvnNodes || []).filter((n) => {
        if (n.isPoc || n.isVah || n.isVal) return false;
        const idx = n.index;
        const prev = data.nodes[idx - 1];
        const next = data.nodes[idx + 1];
        return (!prev || n.totalVol >= prev.totalVol) && (!next || n.totalVol >= next.totalVol);
      }).slice(0, 3);

      const prominentLvns = (data.lvnNodes || []).filter((n) => {
        if (n.isPoc || n.isVah || n.isVal) return false;
        const idx = n.index;
        const prev = data.nodes[idx - 1];
        const next = data.nodes[idx + 1];
        return (!prev || n.totalVol <= prev.totalVol) && (!next || n.totalVol <= next.totalVol);
      }).slice(0, 3);

      const hvnColor = (palette as any).hvn || bullColor;
      const lvnColor = (palette as any).lvn || bearColor;

      prominentHvns.forEach((hNode) => {
        const hy = getY(hNode.priceCenter);
        if (hy >= 0 && hy <= mainChartHeight) {
          const lineLen = 24;
          const hStart = isRightLayout ? (vpEndX - barMaxW - lineLen) : vpStartX;
          const hEnd = isRightLayout ? vpEndX : (vpStartX + barMaxW + lineLen);

          ctx.strokeStyle = hvnColor;
          ctx.lineWidth = 1.6;
          ctx.setLineDash([5, 4]); // DASHED TEBAL
          ctx.beginPath();
          ctx.moveTo(hStart, hy);
          ctx.lineTo(hEnd, hy);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });

      prominentLvns.forEach((lNode) => {
        const ly = getY(lNode.priceCenter);
        if (ly >= 0 && ly <= mainChartHeight) {
          const lineLen = 24;
          const lStart = isRightLayout ? (vpEndX - barMaxW - lineLen) : vpStartX;
          const lEnd = isRightLayout ? vpEndX : (vpStartX + barMaxW + lineLen);

          ctx.strokeStyle = lvnColor;
          ctx.lineWidth = 1.6;
          ctx.setLineDash([5, 4]); // DASHED TEBAL
          ctx.beginPath();
          ctx.moveTo(lStart, ly);
          ctx.lineTo(lEnd, ly);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });
    }

    ctx.restore();
  }

  ctx.restore();
}
