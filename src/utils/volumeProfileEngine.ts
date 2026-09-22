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

  ctx.save();
  // Clip strictly to main chart display area to eliminate any visual leak in multi-chart or dual-split grid
  ctx.beginPath();
  ctx.rect(0, 0, Math.max(0, chartWidth - rightScaleWidth), mainChartHeight);
  ctx.clip();
  ctx.globalAlpha = opacity;

  // 1. Value Area 70% Rail Accent (Minimalist)
  const vahY = getY(data.vahPrice);
  const valY = getY(data.valPrice);
  const vaTop = Math.min(vahY, valY);
  const vaHeight = Math.abs(valY - vahY);

  if (vaHeight > 3) {
    ctx.save();
    // Subtle edge rail accent denoting the Value Area boundary
    ctx.strokeStyle = `${pocColor}50`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    const railX = isRightLayout ? (vpEndX - 1) : vpStartX;
    ctx.moveTo(railX, vaTop);
    ctx.lineTo(railX, vaTop + vaHeight);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  const barMaxW = Math.max(14, vpWidth - 8);
  const nodeLinePoints: Array<{
    midY: number;
    tipX: number;
    inVa: boolean;
    isPocNode: boolean;
    node: typeof data.nodes[0];
    nodeY: number;
    nodeH: number;
    barW: number;
  }> = [];

  const isUpDown = baseConfig.colorMode === 'upDown';
  const isDelta = baseConfig.colorMode === 'delta';

  data.nodes.forEach((node) => {
    const yTop = getY(node.priceTop);
    const yBot = getY(node.priceBottom);
    const midY = (yTop + yBot) / 2;

    if (midY < 0 || midY > mainChartHeight) return;

    const pct = Math.min(1.0, node.totalVol / data.maxVol);
    const barW = Math.max(2.5, barMaxW * pct);
    const inVa = Boolean(node.inValueArea);
    const isPocNode = Boolean(node.isPoc);
    const tipX = isRightLayout ? (vpEndX - barW - 2) : (vpStartX + barW);

    const nodeH = Math.max(1.8, Math.abs(yBot - yTop) - 0.5);
    const nodeY = Math.min(yTop, yBot);

    nodeLinePoints.push({ midY, tipX, inVa, isPocNode, node, nodeY, nodeH, barW });
  });

  // 2. Smooth Curved Profile Wave Contour Clipping & Bar/VA Fill Rendering
  if (nodeLinePoints.length > 1) {
    const sortedNodes = [...nodeLinePoints].sort((a, b) => a.midY - b.midY);
    const baseLineX = isRightLayout ? (vpEndX - 2) : vpStartX;

    // Create the smooth quadratic contour path
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(baseLineX, sortedNodes[0].midY);
    ctx.lineTo(sortedNodes[0].tipX, sortedNodes[0].midY);

    for (let i = 0; i < sortedNodes.length - 1; i++) {
      const p0 = sortedNodes[i];
      const p1 = sortedNodes[i + 1];
      const midX = (p0.tipX + p1.tipX) / 2;
      const midY = (p0.midY + p1.midY) / 2;
      ctx.quadraticCurveTo(p0.tipX, p0.midY, midX, midY);
    }
    const lastPt = sortedNodes[sortedNodes.length - 1];
    ctx.lineTo(lastPt.tipX, lastPt.midY);
    ctx.lineTo(baseLineX, lastPt.midY);
    ctx.closePath();

    // STRICT CLIPPING: Ensures every bar box corner is clipped inside the smooth profile curve!
    ctx.clip();

    // Render bar fills inside the smooth clipped contour
    sortedNodes.forEach(({ node, nodeY, nodeH, barW }) => {
      if (isUpDown) {
        // Dual Split: Buy (Bull Green) vs Sell (Bear Red)
        const buyRatio = node.totalVol > 0 ? Math.max(0, Math.min(1, node.buyVol / node.totalVol)) : 0.5;
        const buyW = barW * buyRatio;
        const sellW = barW - buyW;

        if (isRightLayout) {
          if (sellW > 0) {
            ctx.fillStyle = `${bearColor}dd`;
            ctx.fillRect(vpEndX - barW, nodeY, sellW, nodeH);
          }
          if (buyW > 0) {
            ctx.fillStyle = `${bullColor}ee`;
            ctx.fillRect(vpEndX - buyW, nodeY, buyW, nodeH);
          }
        } else {
          if (buyW > 0) {
            ctx.fillStyle = `${bullColor}ee`;
            ctx.fillRect(vpStartX, nodeY, buyW, nodeH);
          }
          if (sellW > 0) {
            ctx.fillStyle = `${bearColor}dd`;
            ctx.fillRect(vpStartX + buyW, nodeY, sellW, nodeH);
          }
        }
      } else if (isDelta) {
        // Net Delta Gradient
        const isPos = node.delta >= 0;
        const barCol = isPos ? bullColor : bearColor;
        ctx.fillStyle = `${barCol}ee`;
        if (isRightLayout) {
          ctx.fillRect(vpEndX - barW, nodeY, barW, nodeH);
        } else {
          ctx.fillRect(vpStartX, nodeY, barW, nodeH);
        }
      } else {
        // Unified Base Fill
        ctx.fillStyle = `${bullColor}ee`;
        if (isRightLayout) {
          ctx.fillRect(vpEndX - barW, nodeY, barW, nodeH);
        } else {
          ctx.fillRect(vpStartX, nodeY, barW, nodeH);
        }
      }
    });

    // Smart 70% Value Area (VA) Highlight Fill Overlay
    const vaNodes = sortedNodes.filter(n => n.inVa);
    if (vaNodes.length > 1) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(baseLineX, vaNodes[0].midY);
      ctx.lineTo(vaNodes[0].tipX, vaNodes[0].midY);
      for (let i = 0; i < vaNodes.length - 1; i++) {
        const p0 = vaNodes[i];
        const p1 = vaNodes[i + 1];
        const midX = (p0.tipX + p1.tipX) / 2;
        const midY = (p0.midY + p1.midY) / 2;
        ctx.quadraticCurveTo(p0.tipX, p0.midY, midX, midY);
      }
      const lastVa = vaNodes[vaNodes.length - 1];
      ctx.lineTo(lastVa.tipX, lastVa.midY);
      ctx.lineTo(baseLineX, lastVa.midY);
      ctx.closePath();

      ctx.fillStyle = pocColor;
      ctx.globalAlpha = 0.35;
      ctx.fill();
      ctx.restore();
    }

    ctx.restore(); // End clipping region

    // Smooth curved black outline line profile using quadratic midpoint interpolation
    ctx.beginPath();
    ctx.moveTo(sortedNodes[0].tipX, sortedNodes[0].midY);
    for (let i = 0; i < sortedNodes.length - 1; i++) {
      const p0 = sortedNodes[i];
      const p1 = sortedNodes[i + 1];
      const midX = (p0.tipX + p1.tipX) / 2;
      const midY = (p0.midY + p1.midY) / 2;
      ctx.quadraticCurveTo(p0.tipX, p0.midY, midX, midY);
    }
    ctx.lineTo(lastPt.tipX, lastPt.midY);
    ctx.strokeStyle = '#000000'; // Crisp solid black line profile as requested
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Optional Volume Text Labels on Bar
    if (baseConfig.showVolumeLabels) {
      sortedNodes.forEach(({ node, nodeY, nodeH, barW }) => {
        if (barW >= 22 && nodeH >= 8) {
          ctx.save();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 7.5px monospace';
          ctx.textAlign = isRightLayout ? 'right' : 'left';
          const labelX = isRightLayout ? vpEndX - 4 : vpStartX + 4;
          ctx.fillText(formatVpVol(node.totalVol), labelX, nodeY + nodeH / 2 + 2.5);
          ctx.restore();
        }
      });
    }
  }

  // 5. Point of Control (POC) Solid Box Bar & Solid Badge
  if (data.pocNode) {
    const pocY = getY(data.pocPrice);

    if (baseConfig.showPocLine && pocY >= 0 && pocY <= mainChartHeight) {
      const isHovered = crosshairY !== null && crosshairY !== undefined && Math.abs(crosshairY - pocY) <= 10;
      ctx.save();
      if (isHovered) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = pocColor;
      }

      const lineLen = isHovered ? 44 : 36;
      const pStart = isRightLayout ? (vpEndX - barMaxW - lineLen) : vpStartX;
      const pEnd = isRightLayout ? vpEndX : (vpStartX + barMaxW + lineLen);

      // Solid Accent Bar
      ctx.fillStyle = pocColor;
      ctx.fillRect(pStart, pocY - 1.5, pEnd - pStart, 3);

      // Solid Box POC Badge
      const pocTagW = isHovered ? 34 : 28;
      const pocTagH = isHovered ? 17 : 14;
      const pocTagX = isRightLayout ? (pStart - pocTagW - 3) : (pEnd + 3);

      ctx.fillStyle = pocColor;
      ctx.beginPath();
      if (typeof (ctx as any).roundRect === 'function') {
        (ctx as any).roundRect(pocTagX, pocY - pocTagH / 2, pocTagW, pocTagH, 3);
      } else {
        ctx.rect(pocTagX, pocY - pocTagH / 2, pocTagW, pocTagH);
      }
      ctx.fill();

      // Sharp solid border
      ctx.strokeStyle = 'rgba(0,0,0,0.45)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = getContrastTextColor(pocColor);
      ctx.font = isHovered ? 'bold 9.5px monospace' : 'bold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('POC', pocTagX + pocTagW / 2, pocY + (isHovered ? 3.5 : 3.0));
      ctx.restore();
    }
  }

  // 6. Value Area High (VAH) & Value Area Low (VAL) Solid Box Bars and Badges
  if (baseConfig.showVahValLines) {
    ctx.save();
    const lineLen = 32;

    // VAH Solid Box Bar & Badge
    if (vahY >= 0 && vahY <= mainChartHeight) {
      const isHovered = crosshairY !== null && crosshairY !== undefined && Math.abs(crosshairY - vahY) <= 10;
      if (isHovered) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = bullColor;
      }

      const vStart = isRightLayout ? (vpEndX - barMaxW - (isHovered ? 40 : lineLen)) : vpStartX;
      const vEnd = isRightLayout ? vpEndX : (vpStartX + barMaxW + (isHovered ? 40 : lineLen));

      // Solid Box Bar for VAH
      ctx.fillStyle = bullColor;
      ctx.fillRect(vStart, vahY - 1.5, vEnd - vStart, 3);

      // Solid Box Badge for VAH
      const vahTagW = isHovered ? 34 : 28;
      const vahTagH = isHovered ? 17 : 14;
      const tagX = isRightLayout ? (vStart - vahTagW - 3) : (vEnd + 3);

      ctx.fillStyle = bullColor;
      ctx.beginPath();
      if (typeof (ctx as any).roundRect === 'function') {
        (ctx as any).roundRect(tagX, vahY - vahTagH / 2, vahTagW, vahTagH, 3);
      } else {
        ctx.rect(tagX, vahY - vahTagH / 2, vahTagW, vahTagH);
      }
      ctx.fill();

      ctx.strokeStyle = 'rgba(0,0,0,0.45)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = getContrastTextColor(bullColor);
      ctx.font = isHovered ? 'bold 9px monospace' : 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('VAH', tagX + vahTagW / 2, vahY + 3.0);
    }

    // VAL Solid Box Bar & Badge
    if (valY >= 0 && valY <= mainChartHeight) {
      const isHovered = crosshairY !== null && crosshairY !== undefined && Math.abs(crosshairY - valY) <= 10;
      if (isHovered) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = bearColor;
      }

      const vStart = isRightLayout ? (vpEndX - barMaxW - (isHovered ? 40 : lineLen)) : vpStartX;
      const vEnd = isRightLayout ? vpEndX : (vpStartX + barMaxW + (isHovered ? 40 : lineLen));

      // Solid Box Bar for VAL
      ctx.fillStyle = bearColor;
      ctx.fillRect(vStart, valY - 1.5, vEnd - vStart, 3);

      // Solid Box Badge for VAL
      const valTagW = isHovered ? 34 : 28;
      const valTagH = isHovered ? 17 : 14;
      const tagX = isRightLayout ? (vStart - valTagW - 3) : (vEnd + 3);

      ctx.fillStyle = bearColor;
      ctx.beginPath();
      if (typeof (ctx as any).roundRect === 'function') {
        (ctx as any).roundRect(tagX, valY - valTagH / 2, valTagW, valTagH, 3);
      } else {
        ctx.rect(tagX, valY - valTagH / 2, valTagW, valTagH);
      }
      ctx.fill();

      ctx.strokeStyle = 'rgba(0,0,0,0.45)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = getContrastTextColor(bearColor);
      ctx.font = isHovered ? 'bold 9px monospace' : 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('VAL', tagX + valTagW / 2, valY + 3.0);
    }

    ctx.restore();
  }

  // 7. High Volume Nodes (HVN) & Low Volume Nodes (LVN) Solid Box Bars & Badges
  if (baseConfig.showHvnLvn) {
    ctx.save();
    const lineLen = 26;

    // Render prominent HVNs (excluding POC)
    if (data.hvnNodes && data.hvnNodes.length > 0) {
      const topHvns = data.hvnNodes.filter(n => !n.isPoc).slice(0, 3);
      topHvns.forEach(node => {
        const y = getY(node.priceCenter);
        if (y < 5 || y > mainChartHeight - 5) return;

        const isHovered = crosshairY !== null && crosshairY !== undefined && Math.abs(crosshairY - y) <= 8;
        const hvnColor = '#06b6d4';
        if (isHovered) {
          ctx.shadowBlur = 8;
          ctx.shadowColor = hvnColor;
        }

        const hStart = isRightLayout ? (vpEndX - barMaxW - (isHovered ? 34 : lineLen)) : vpStartX;
        const hEnd = isRightLayout ? vpEndX : (vpStartX + barMaxW + (isHovered ? 34 : lineLen));

        // Solid Bar for HVN
        ctx.fillStyle = hvnColor;
        ctx.fillRect(hStart, y - 1, hEnd - hStart, 2.5);

        // Solid Box Badge for HVN
        const hvnTagW = isHovered ? 32 : 26;
        const hvnTagH = isHovered ? 15 : 13;
        const tagX = isRightLayout ? (hStart - hvnTagW - 3) : (hEnd + 3);

        ctx.fillStyle = hvnColor;
        ctx.beginPath();
        if (typeof (ctx as any).roundRect === 'function') {
          (ctx as any).roundRect(tagX, y - hvnTagH / 2, hvnTagW, hvnTagH, 2.5);
        } else {
          ctx.rect(tagX, y - hvnTagH / 2, hvnTagW, hvnTagH);
        }
        ctx.fill();

        ctx.strokeStyle = 'rgba(0,0,0,0.45)';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        ctx.fillStyle = getContrastTextColor(hvnColor);
        ctx.font = isHovered ? 'bold 8.5px monospace' : 'bold 7.5px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('HVN', tagX + hvnTagW / 2, y + 2.8);
      });
    }

    // Render prominent LVNs
    if (data.lvnNodes && data.lvnNodes.length > 0) {
      const topLvns = data.lvnNodes.slice(0, 3);
      topLvns.forEach(node => {
        const y = getY(node.priceCenter);
        if (y < 5 || y > mainChartHeight - 5) return;

        const isHovered = crosshairY !== null && crosshairY !== undefined && Math.abs(crosshairY - y) <= 8;
        const lvnColor = '#a855f7';
        if (isHovered) {
          ctx.shadowBlur = 8;
          ctx.shadowColor = lvnColor;
        }

        const lStart = isRightLayout ? (vpEndX - barMaxW - (isHovered ? 34 : lineLen)) : vpStartX;
        const lEnd = isRightLayout ? vpEndX : (vpStartX + barMaxW + (isHovered ? 34 : lineLen));

        // Solid Bar for LVN
        ctx.fillStyle = lvnColor;
        ctx.fillRect(lStart, y - 1, lEnd - lStart, 2.5);

        // Solid Box Badge for LVN
        const lvnTagW = isHovered ? 32 : 26;
        const lvnTagH = isHovered ? 15 : 13;
        const tagX = isRightLayout ? (lStart - lvnTagW - 3) : (lEnd + 3);

        ctx.fillStyle = lvnColor;
        ctx.beginPath();
        if (typeof (ctx as any).roundRect === 'function') {
          (ctx as any).roundRect(tagX, y - lvnTagH / 2, lvnTagW, lvnTagH, 2.5);
        } else {
          ctx.rect(tagX, y - lvnTagH / 2, lvnTagW, lvnTagH);
        }
        ctx.fill();

        ctx.strokeStyle = 'rgba(0,0,0,0.45)';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        ctx.fillStyle = getContrastTextColor(lvnColor);
        ctx.font = isHovered ? 'bold 8.5px monospace' : 'bold 7.5px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('LVN', tagX + lvnTagW / 2, y + 2.8);
      });
    }

    ctx.restore();
  }

  ctx.restore();
}
