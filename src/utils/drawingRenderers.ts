import { DrawingItem, Point, FIBONACCI_LEVELS, DEFAULT_FIB_EXTENSION_LEVELS } from './drawingTools';

export interface CoordinateUtils {
  getY: (price: number) => number;
  getXFromTime: (time: number) => number;
  getPriceFromY: (y: number) => number;
  getTimeFromX: (x: number) => number;
  chartWidth: number;
  fullHeight: number;
  mainChartHeight: number;
  rightScaleWidth: number;
  totalCandleSlot: number;
  priceRange: number;
}

export interface DrawingRenderContext {
  ctx: CanvasRenderingContext2D;
  utils: CoordinateUtils;
  palette: {
    bull: string;
    bear: string;
    poc: string;
    [key: string]: string;
  };
  timeframe?: string;
  useLocalTime?: boolean;
  formatTime?: (time: number) => string;
}

function hexToRgba(hex: string, alpha: number): string {
  if (!hex) return `rgba(56, 189, 248, ${alpha})`;
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((char) => char + char).join('');
  }
  if (c.length === 6) {
    const num = parseInt(c, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  if (hex.startsWith('rgba')) {
    return hex.replace(/[\d\.]+\)$/g, `${alpha})`);
  }
  return `rgba(56, 189, 248, ${alpha})`;
}

/**
 * Main Drawing Dispatcher: Renders any DrawingItem with pixel-perfect visual styling
 */
export function renderDrawingItem(
  item: DrawingItem,
  renderContext: DrawingRenderContext
) {
  const { ctx, utils, palette } = renderContext;
  if (!item.points || item.points.length === 0) return;

  const { getY, getXFromTime, chartWidth, fullHeight, rightScaleWidth, totalCandleSlot } = utils;
  const strokeColor = item.color || '#3b82f6';
  const width = item.lineWidth || 2;

  ctx.save();

  // Setup line style
  if (item.lineStyle === 'dashed') {
    ctx.setLineDash([6, 5]);
  } else if (item.lineStyle === 'dotted') {
    ctx.setLineDash([2, 3]);
  } else {
    ctx.setLineDash([]);
  }

  switch (item.type) {
    case 'horizontal': {
      const p1 = item.points[0];
      const y = getY(p1.price);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartWidth, y);
      ctx.stroke();

      // Right Scale Badge
      if (item.showPrices ?? true) {
        ctx.setLineDash([]);
        ctx.fillStyle = strokeColor;
        ctx.beginPath();
        ctx.roundRect(chartWidth + 2, y - 9, rightScaleWidth - 4, 18, 3);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9.5px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`$${p1.price?.toFixed(p1.price > 100 ? 2 : 4)}`, chartWidth + 6, y + 3.5);
      }

      // High-Visibility On-Chart Text Box Label
      const levelLabel = item.label || item.text;
      if (levelLabel && levelLabel.trim()) {
        ctx.save();
        ctx.setLineDash([]);
        ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const labelW = ctx.measureText(levelLabel).width;
        const boxW = labelW + 20;
        const boxH = 22;
        const boxX = 24;
        const boxY = y - boxH / 2;

        // Dark glass background with drop shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
        ctx.shadowBlur = 6;
        ctx.fillStyle = '#0a0e1af2';
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 4);
        ctx.fill();

        // Colored accent border
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Left accent indicator bar
        ctx.fillStyle = strokeColor;
        ctx.beginPath();
        ctx.roundRect(boxX + 2, boxY + 3, 3, boxH - 6, 1.5);
        ctx.fill();

        // Crisp label text
        ctx.fillStyle = item.textColor || '#f8fafc';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(levelLabel, boxX + 9, y);
        ctx.restore();
      }

      // Anchor point
      ctx.setLineDash([]);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(getXFromTime(p1.time), y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'horizontal_ray': {
      const p1 = item.points[0];
      const y = getY(p1.price);
      const x1 = getXFromTime(p1.time);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(chartWidth, y);
      ctx.stroke();

      if (item.showPrices ?? true) {
        ctx.setLineDash([]);
        ctx.fillStyle = strokeColor;
        ctx.beginPath();
        ctx.roundRect(chartWidth + 2, y - 9, rightScaleWidth - 4, 18, 3);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9.5px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`$${p1.price?.toFixed(p1.price > 100 ? 2 : 4)}`, chartWidth + 6, y + 3.5);
      }

      // High-Visibility On-Chart Text Box Label
      const levelLabel = item.label || item.text;
      if (levelLabel && levelLabel.trim()) {
        ctx.save();
        ctx.setLineDash([]);
        ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const labelW = ctx.measureText(levelLabel).width;
        const boxW = labelW + 20;
        const boxH = 22;
        // Position starting from anchor or clamp gracefully if near right edge
        const boxX = Math.min(chartWidth - boxW - 12, Math.max(12, x1 + 8));
        const boxY = y - boxH / 2;

        // Dark glass background with drop shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
        ctx.shadowBlur = 6;
        ctx.fillStyle = '#0a0e1af2';
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 4);
        ctx.fill();

        // Colored accent border
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Left accent indicator bar
        ctx.fillStyle = strokeColor;
        ctx.beginPath();
        ctx.roundRect(boxX + 2, boxY + 3, 3, boxH - 6, 1.5);
        ctx.fill();

        // Crisp label text
        ctx.fillStyle = item.textColor || '#f8fafc';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(levelLabel, boxX + 9, y);
        ctx.restore();
      }

      // Anchor point
      ctx.setLineDash([]);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x1, y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'vertical': {
      const p1 = item.points[0];
      const x = getXFromTime(p1.time);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, fullHeight);
      ctx.stroke();

      // Bottom Time Badge
      ctx.setLineDash([]);
      ctx.fillStyle = strokeColor;
      ctx.beginPath();
      ctx.roundRect(x - 28, fullHeight + 2, 56, 16, 3);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      const timeStr = renderContext.formatTime ? renderContext.formatTime(p1.time) : new Date(p1.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      ctx.fillText(timeStr, x, fullHeight + 13.5);

      // Anchor point
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, getY(p1.price), 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'cross_line': {
      const p1 = item.points[0];
      const x = getXFromTime(p1.time);
      const y = getY(p1.price);

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = width;
      ctx.beginPath();
      // Horizontal bar
      ctx.moveTo(0, y);
      ctx.lineTo(chartWidth, y);
      // Vertical bar
      ctx.moveTo(x, 0);
      ctx.lineTo(x, fullHeight);
      ctx.stroke();

      // Price Badge on right
      ctx.setLineDash([]);
      ctx.fillStyle = strokeColor;
      ctx.beginPath();
      ctx.roundRect(chartWidth + 2, y - 9, rightScaleWidth - 4, 18, 3);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9.5px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`$${p1.price?.toFixed(p1.price > 100 ? 2 : 4)}`, chartWidth + 6, y + 3.5);

      // Time Badge at bottom
      ctx.fillStyle = strokeColor;
      ctx.beginPath();
      ctx.roundRect(x - 28, fullHeight + 2, 56, 16, 3);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      const timeStr = renderContext.formatTime ? renderContext.formatTime(p1.time) : new Date(p1.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      ctx.fillText(timeStr, x, fullHeight + 13.5);

      // Center crosshair ring
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'trendline': {
      if (item.points.length < 2) break;
      const [p1, p2] = item.points;
      const x1 = getXFromTime(p1.time);
      const x2 = getXFromTime(p2.time);
      const y1 = getY(p1.price);
      const y2 = getY(p2.price);

      let startX = x1;
      let startY = y1;
      let endX = x2;
      let endY = y2;

      const slope = (y2 - y1) / ((x2 - x1) || 0.0001);

      if (item.extendLeft) {
        startX = 0;
        startY = y1 - slope * x1;
      }
      if (item.extendRight) {
        endX = chartWidth;
        endY = y1 + slope * (chartWidth - x1);
      }

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Optional Angle & Statistics HUD on line center
      if ((item.showStats ?? true) || (item.showAngles ?? true)) {
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const priceDiff = p2.price - p1.price;
        const pctDiff = ((priceDiff / (p1.price || 1)) * 100);
        const barsCount = Math.max(1, Math.round(Math.abs(x2 - x1) / totalCandleSlot));
        const rad = Math.atan2(y1 - y2, x2 - x1);
        const deg = Math.round((rad * 180) / Math.PI);

        ctx.setLineDash([]);
        const statText = `${priceDiff >= 0 ? '+' : ''}${pctDiff?.toFixed(2)}% | ${barsCount}b${(item.showAngles ?? true) ? ` | ${deg}°` : ''}`;
        ctx.font = 'bold 9px monospace';
        const tw = ctx.measureText(statText).width + 12;

        ctx.fillStyle = '#0f172aee';
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(midX - tw / 2, midY - 18, tw, 16, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = priceDiff >= 0 ? palette.bull : palette.bear;
        ctx.textAlign = 'center';
        ctx.fillText(statText, midX, midY - 6.5);
      }

      // Anchor Points
      ctx.setLineDash([]);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x1, y1, 4, 0, Math.PI * 2);
      ctx.arc(x2, y2, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'ray': {
      if (item.points.length < 2) break;
      const [p1, p2] = item.points;
      const x1 = getXFromTime(p1.time);
      const x2 = getXFromTime(p2.time);
      const y1 = getY(p1.price);
      const y2 = getY(p2.price);

      const slope = (y2 - y1) / ((x2 - x1) || 0.0001);
      const targetX = chartWidth;
      const targetY = y1 + slope * (targetX - x1);

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(targetX, targetY);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x1, y1, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'extended_line': {
      if (item.points.length < 2) break;
      const [p1, p2] = item.points;
      const x1 = getXFromTime(p1.time);
      const x2 = getXFromTime(p2.time);
      const y1 = getY(p1.price);
      const y2 = getY(p2.price);

      const slope = (y2 - y1) / ((x2 - x1) || 0.0001);
      const yStart = y1 - slope * x1;
      const yEnd = y1 + slope * (chartWidth - x1);

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(0, yStart);
      ctx.lineTo(chartWidth, yEnd);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x1, y1, 4, 0, Math.PI * 2);
      ctx.arc(x2, y2, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'arrow': {
      if (item.points.length < 2) break;
      const [p1, p2] = item.points;
      const x1 = getXFromTime(p1.time);
      const x2 = getXFromTime(p2.time);
      const y1 = getY(p1.price);
      const y2 = getY(p2.price);

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Arrow head
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const headLen = 13 + width;
      ctx.fillStyle = strokeColor;
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();

      // Origin dot
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x1, y1, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'parallel_channel': {
      if (item.points.length < 2) break;
      const [p1, p2] = item.points;
      const x1 = getXFromTime(p1.time);
      const x2 = getXFromTime(p2.time);
      const y1 = getY(p1.price);
      const y2 = getY(p2.price);
      const defaultOffset = (p2.price - p1.price) * 0.4 || 35;
      const p3 = item.points[2] || { price: p1.price - defaultOffset, time: p1.time };
      const y3 = getY(p3.price);
      const offset = y3 - y1;

      // Fill Channel Area
      const fillAlpha = item.fillOpacity ?? 0.15;
      ctx.fillStyle = item.fillColor || `${strokeColor}${Math.round(fillAlpha * 255).toString(16).padStart(2, '0')}`;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x2, y2 + offset);
      ctx.lineTo(x1, y1 + offset);
      ctx.closePath();
      ctx.fill();

      // Parallel Boundary Lines
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.moveTo(x1, y1 + offset);
      ctx.lineTo(x2, y2 + offset);
      ctx.stroke();

      // Optional 50% Equilibrium Midline
      if (item.midline) {
        ctx.save();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = Math.max(1, width - 0.5);
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(x1, y1 + offset * 0.5);
        ctx.lineTo(x2, y2 + offset * 0.5);
        ctx.stroke();

        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 8.5px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('0.5 Equilibrium', x1 + 6, y1 + offset * 0.5 - 3);
        ctx.restore();
      }

      // Anchor Points
      ctx.setLineDash([]);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x1, y1, 4, 0, Math.PI * 2);
      ctx.arc(x2, y2, 4, 0, Math.PI * 2);
      ctx.arc(x1, y1 + offset, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'pitchfork': {
      if (item.points.length < 2) break;
      const [p1, p2] = item.points;
      const x1 = getXFromTime(p1.time);
      const x2 = getXFromTime(p2.time);
      const y1 = getY(p1.price);
      const y2 = getY(p2.price);
      const p3 = item.points[2] || { price: p2.price - (p2.price - p1.price) * 0.5, time: p2.time };
      const x3 = getXFromTime(p3.time);
      const y3 = getY(p3.price);

      const midX = (x2 + x3) / 2;
      const midY = (y2 + y3) / 2;
      const slope = (midY - y1) / ((midX - x1) || 0.0001);
      const targetX = chartWidth;
      const targetY = y1 + slope * (targetX - x1);

      // Shading between prongs
      ctx.fillStyle = `${strokeColor}14`;
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(targetX, y2 + slope * (targetX - x2));
      ctx.lineTo(targetX, y3 + slope * (targetX - x3));
      ctx.lineTo(x3, y3);
      ctx.closePath();
      ctx.fill();

      // Connector base line
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x3, y3);
      ctx.stroke();

      // Median Line (Center Handle)
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = width;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(targetX, targetY);
      ctx.stroke();

      // Upper & Lower parallel prongs
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(targetX, y2 + slope * (targetX - x2));
      ctx.moveTo(x3, y3);
      ctx.lineTo(targetX, y3 + slope * (targetX - x3));
      ctx.stroke();

      // Anchor Points
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x1, y1, 4, 0, Math.PI * 2);
      ctx.arc(x2, y2, 4, 0, Math.PI * 2);
      ctx.arc(x3, y3, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'rectangle': {
      if (item.points.length < 2) break;
      const [p1, p2] = item.points;
      const x1 = getXFromTime(p1.time);
      const x2 = getXFromTime(p2.time);
      const y1 = getY(p1.price);
      const y2 = getY(p2.price);

      const minX = Math.min(x1, x2);
      const maxX = Math.max(x1, x2);
      const minY = Math.min(y1, y2);
      const maxY = Math.max(y1, y2);
      const rectW = Math.max(2, maxX - minX);
      const rectH = Math.max(2, maxY - minY);

      const fillAlpha = item.fillOpacity ?? 0.15;
      ctx.fillStyle = item.fillColor || `${strokeColor}${Math.round(fillAlpha * 255).toString(16).padStart(2, '0')}`;
      ctx.fillRect(minX, minY, rectW, rectH);

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = width;
      ctx.strokeRect(minX, minY, rectW, rectH);

      // Optional 50% Mean Threshold Midline
      if (item.midline) {
        const midY = (minY + maxY) / 2;
        ctx.save();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(minX, midY);
        ctx.lineTo(maxX, midY);
        ctx.stroke();

        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 8.5px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('50% Mean', minX + 4, midY - 3);
        ctx.restore();
      }

      // Zone dimensions & Price Difference label
      if (item.showPrices ?? true) {
        const priceDiff = Math.abs(p2.price - p1.price);
        const pctDiff = ((priceDiff / (Math.min(p1.price, p2.price) || 1)) * 100);
        ctx.fillStyle = strokeColor;
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`Zone: $${priceDiff?.toFixed(2)} (${pctDiff?.toFixed(2)}%)`, minX + 4, minY + 12);
      }

      // Custom Text / Header Badge on Rectangle Zone Box
      const boxText = item.text || item.label;
      if (boxText && boxText.trim()) {
        ctx.save();
        ctx.setLineDash([]);
        const txtColor = item.textColor || '#f8fafc';
        const fontSz = item.fontSize || 10.5;
        ctx.font = `bold ${fontSz}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        const textW = ctx.measureText(boxText).width;
        const badgeW = textW + 18;
        const badgeH = 20;
        const badgeX = Math.min(maxX - badgeW - 4, Math.max(minX + 4, minX + 6));
        const badgeY = minY + 4;

        // Glass badge background
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 4;
        ctx.fillStyle = '#0a0e1af2';
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
        ctx.fill();

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = strokeColor;
        ctx.beginPath();
        ctx.roundRect(badgeX + 2, badgeY + 2.5, 2.5, badgeH - 5, 1);
        ctx.fill();

        ctx.fillStyle = txtColor;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(boxText, badgeX + 8, badgeY + badgeH / 2);
        ctx.restore();
      }

      // Corner handles
      ctx.setLineDash([]);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(minX, minY, 3.5, 0, Math.PI * 2);
      ctx.arc(maxX, maxY, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'ellipse': {
      if (item.points.length < 2) break;
      const [p1, p2] = item.points;
      const x1 = getXFromTime(p1.time);
      const x2 = getXFromTime(p2.time);
      const y1 = getY(p1.price);
      const y2 = getY(p2.price);

      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;
      const rx = Math.abs(x2 - x1) / 2 || 10;
      const ry = Math.abs(y2 - y1) / 2 || 10;

      const fillAlpha = item.fillOpacity ?? 0.15;
      ctx.fillStyle = item.fillColor || `${strokeColor}${Math.round(fillAlpha * 255).toString(16).padStart(2, '0')}`;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = width;
      ctx.stroke();
      break;
    }

    case 'triangle': {
      if (item.points.length < 2) break;
      const [p1, p2] = item.points;
      const x1 = getXFromTime(p1.time);
      const x2 = getXFromTime(p2.time);
      const y1 = getY(p1.price);
      const y2 = getY(p2.price);
      const p3 = item.points[2] || { price: (p1.price + p2.price) / 2 + (p2.price - p1.price), time: p2.time };
      const x3 = getXFromTime(p3.time);
      const y3 = getY(p3.price);

      const fillAlpha = item.fillOpacity ?? 0.15;
      ctx.fillStyle = item.fillColor || `${strokeColor}${Math.round(fillAlpha * 255).toString(16).padStart(2, '0')}`;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x3, y3);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = width;
      ctx.stroke();

      // Vertex Labels (A, B, C)
      ctx.fillStyle = strokeColor;
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('A', x1, y1 - 6);
      ctx.fillText('B', x2, y2 - 6);
      ctx.fillText('C', x3, y3 - 6);
      break;
    }

    case 'brush':
    case 'highlighter': {
      if (item.points.length === 0) break;
      const isHighlighter = item.type === 'highlighter';

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = isHighlighter ? (width * 3 + 6) : (width + 1);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = isHighlighter ? (item.fillOpacity ?? 0.35) : 0.9;

      if (item.points.length === 1) {
        const pA = item.points[0];
        const px = getXFromTime(pA.time);
        const py = getY(pA.price);
        ctx.fillStyle = strokeColor;
        ctx.beginPath();
        ctx.arc(px, py, ctx.lineWidth / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (item.points.length === 2) {
        ctx.beginPath();
        ctx.moveTo(getXFromTime(item.points[0].time), getY(item.points[0].price));
        ctx.lineTo(getXFromTime(item.points[1].time), getY(item.points[1].price));
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(getXFromTime(item.points[0].time), getY(item.points[0].price));
        for (let k = 1; k < item.points.length - 1; k++) {
          const pCur = item.points[k];
          const pNext = item.points[k + 1];
          const xc = (getXFromTime(pCur.time) + getXFromTime(pNext.time)) / 2;
          const yc = (getY(pCur.price) + getY(pNext.price)) / 2;
          ctx.quadraticCurveTo(getXFromTime(pCur.time), getY(pCur.price), xc, yc);
        }
        const lastPoint = item.points[item.points.length - 1];
        const prevPoint = item.points[item.points.length - 2];
        ctx.quadraticCurveTo(
          getXFromTime(prevPoint.time),
          getY(prevPoint.price),
          getXFromTime(lastPoint.time),
          getY(lastPoint.price)
        );
        ctx.stroke();
      }
      break;
    }

    case 'polyline': {
      if (item.points.length < 2) break;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(getXFromTime(item.points[0].time), getY(item.points[0].price));
      for (let k = 1; k < item.points.length; k++) {
        ctx.lineTo(getXFromTime(item.points[k].time), getY(item.points[k].price));
      }
      ctx.stroke();

      // Vertex Handles
      item.points.forEach((pt, idx) => {
        const vx = getXFromTime(pt.time);
        const vy = getY(pt.price);
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(vx, vy, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = strokeColor;
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${idx + 1}`, vx, vy - 6);
      });
      break;
    }

    case 'head_and_shoulders': {
      if (item.points.length < 2) break;
      const pts = item.points;
      const coords = pts.map((p) => ({ x: getXFromTime(p.time), y: getY(p.price) }));

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(coords[0].x, coords[0].y);
      for (let k = 1; k < coords.length; k++) {
        ctx.lineTo(coords[k].x, coords[k].y);
      }
      ctx.stroke();

      // Pattern Point Labels
      const labels = ['LS', 'V1', 'HEAD', 'V2', 'RS'];
      coords.forEach((c, idx) => {
        if (labels[idx]) {
          ctx.fillStyle = idx === 2 ? '#ec4899' : strokeColor;
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(labels[idx], c.x, c.y - 8);

          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = idx === 2 ? '#ec4899' : strokeColor;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(c.x, c.y, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      });

      // Neckline between V1 (idx 1) and V2 (idx 3) if available
      if (coords.length >= 4) {
        ctx.save();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(coords[1].x, coords[1].y);
        ctx.lineTo(coords[3].x, coords[3].y);
        ctx.stroke();
        ctx.restore();
      }
      break;
    }

    case 'elliott_wave': {
      if (item.points.length < 2) break;
      const pts = item.points;
      const coords = pts.map((p) => ({ x: getXFromTime(p.time), y: getY(p.price) }));

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(coords[0].x, coords[0].y);
      for (let k = 1; k < coords.length; k++) {
        ctx.lineTo(coords[k].x, coords[k].y);
      }
      ctx.stroke();

      const waveLabels = ['(0)', '(1)', '(2)', '(3)', '(4)', '(5)'];
      coords.forEach((c, idx) => {
        const lbl = waveLabels[idx] || `(${idx})`;
        ctx.fillStyle = idx === 3 ? '#089981' : '#38bdf8';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(lbl, c.x, c.y - 8);

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = idx === 3 ? '#089981' : '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(c.x, c.y, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
      break;
    }

    case 'fibonacci': {
      if (item.points.length < 2) break;
      const [p1, p2] = item.points;
      const diff = p2.price - p1.price;
      const startX = getXFromTime(p1.time);
      const endX = getXFromTime(p2.time);
      const y1 = getY(p1.price);
      const y2 = getY(p2.price);

      const minX = item.extendLeft ? 0 : Math.min(startX, endX);
      const maxX = item.extendRight ? chartWidth : Math.max(startX, endX, minX + 100);

      const rawLevels = item.fibLevels || FIBONACCI_LEVELS;
      const enabledLevels = rawLevels.filter((l) => l.enabled).sort((a, b) => a.level - b.level);

      // 1. Multi-level Translucent Band Fills between adjacent levels
      for (let i = 0; i < enabledLevels.length - 1; i++) {
        const lvlA = enabledLevels[i];
        const lvlB = enabledLevels[i + 1];
        const yA = getY(p1.price + diff * lvlA.level);
        const yB = getY(p1.price + diff * lvlB.level);
        const topY = Math.min(yA, yB);
        const bandH = Math.abs(yB - yA);

        if (bandH > 0.5) {
          ctx.fillStyle = hexToRgba(lvlA.color, item.fillOpacity ?? 0.08);
          ctx.fillRect(minX, topY, maxX - minX, bandH);
        }
      }

      // 2. Golden Pocket Zone Highlight (0.382 - 0.618 or 0.5 - 0.618)
      const y382 = getY(p1.price + diff * 0.382);
      const y50 = getY(p1.price + diff * 0.5);
      const y618 = getY(p1.price + diff * 0.618);
      const gpTop = Math.min(y382, y618);
      const gpHeight = Math.abs(y618 - y382);

      if (gpHeight > 2) {
        // Glowing Golden Pocket Background
        ctx.fillStyle = 'rgba(245, 158, 11, 0.18)';
        ctx.fillRect(minX, gpTop, maxX - minX, gpHeight);

        // Golden Pocket Accent Left Border
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(minX, gpTop, 3, gpHeight);

        // Golden Pocket Label Badge
        const gpLabelY = Math.min(y50, y618) + Math.abs(y618 - y50) / 2;
        ctx.font = 'bold 8.5px monospace';
        const badgeW = ctx.measureText('★ GOLDEN POCKET (61.8%)').width + 12;
        ctx.fillStyle = '#0f172ae8';
        ctx.beginPath();
        ctx.roundRect(minX + 8, gpLabelY - 8, badgeW, 16, 3);
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = '#fbbf24';
        ctx.textAlign = 'left';
        ctx.fillText('★ GOLDEN POCKET (61.8%)', minX + 14, gpLabelY + 3.5);
      }

      // 3. Origin Swing Trend Line (P1 -> P2)
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(startX, y1);
      ctx.lineTo(endX, y2);
      ctx.stroke();

      // Swing labels (0% & 100%)
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = startX < endX ? 'right' : 'left';
      ctx.fillText('0.0% (Start)', startX + (startX < endX ? -6 : 6), y1 - 4);
      ctx.fillText('100.0% (End)', endX + (startX < endX ? 6 : -6), y2 - 4);

      // 4. Level Lines & Price Badges
      rawLevels.forEach((lvl) => {
        if (!lvl.enabled) return;
        const levelPrice = p1.price + diff * lvl.level;
        const y = getY(levelPrice);

        // Level Line
        ctx.strokeStyle = lvl.color;
        ctx.lineWidth = 1.25;
        if (item.lineStyle === 'dashed') {
          ctx.setLineDash([5, 4]);
        } else if (item.lineStyle === 'dotted') {
          ctx.setLineDash([2, 2]);
        } else {
          ctx.setLineDash([3, 3]);
        }
        ctx.beginPath();
        ctx.moveTo(minX, y);
        ctx.lineTo(maxX, y);
        ctx.stroke();

        // Level Price Badge
        if (item.showPrices ?? true) {
          ctx.setLineDash([]);
          const fmtP = levelPrice > 100 ? levelPrice.toFixed(2) : levelPrice.toFixed(4);
          const lblStr = `${lvl.label} | $${fmtP}`;
          ctx.font = 'bold 9px monospace';
          const textW = ctx.measureText(lblStr).width + 12;

          const badgeX = maxX - textW - 4;
          ctx.fillStyle = '#0b0f19f0';
          ctx.beginPath();
          ctx.roundRect(badgeX, y - 8, textW, 16, 3);
          ctx.fill();
          ctx.strokeStyle = lvl.color;
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = lvl.color;
          ctx.textAlign = 'left';
          ctx.fillText(lblStr, badgeX + 6, y + 3.5);
        }
      });

      // 5. Handles at P1 & P2
      ctx.setLineDash([]);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(startX, y1, 4.5, 0, Math.PI * 2);
      ctx.arc(endX, y2, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'fib_fan': {
      if (item.points.length < 2) break;
      const [p1, p2] = item.points;
      const x1 = getXFromTime(p1.time);
      const x2 = getXFromTime(p2.time);
      const y1 = getY(p1.price);
      const y2 = getY(p2.price);

      const ratios = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0];
      const colors = ['#787b86', '#f23645', '#ff9800', '#4caf50', '#089981', '#2962ff', '#787b86'];

      const dx = (x2 - x1) || 0.0001;
      const endX = chartWidth;

      // Calculate rays
      const rayEnds = ratios.map((r) => {
        const targetY = y1 + (y2 - y1) * r;
        const slope = (targetY - y1) / dx;
        const endY = y1 + slope * (endX - x1);
        return { r, slope, endY, targetY };
      });

      // 1. Polygonal Wedge Fills between consecutive rays
      for (let i = 0; i < rayEnds.length - 1; i++) {
        const rA = rayEnds[i];
        const rB = rayEnds[i + 1];
        ctx.fillStyle = hexToRgba(colors[i], item.fillOpacity ?? 0.08);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(endX, rA.endY);
        ctx.lineTo(endX, rB.endY);
        ctx.closePath();
        ctx.fill();
      }

      // 2. Ray Lines & Badges
      rayEnds.forEach((ray, idx) => {
        const col = colors[idx] || strokeColor;
        ctx.strokeStyle = col;
        ctx.lineWidth = 1.25;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(endX, ray.endY);
        ctx.stroke();

        // Badge along ray
        if (item.showPrices ?? true) {
          ctx.setLineDash([]);
          const labelX = Math.min(x2 + 24, chartWidth - 50);
          const labelY = y1 + ray.slope * (labelX - x1);

          if (labelX > x1 && labelY >= 0 && labelY <= fullHeight) {
            const pctStr = `${(ray.r * 100).toFixed(1)}%`;
            ctx.font = 'bold 8.5px monospace';
            const badgeW = ctx.measureText(pctStr).width + 8;
            ctx.fillStyle = '#0b0f19ee';
            ctx.beginPath();
            ctx.roundRect(labelX - 4, labelY - 7, badgeW, 14, 3);
            ctx.fill();
            ctx.strokeStyle = col;
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle = col;
            ctx.textAlign = 'left';
            ctx.fillText(pctStr, labelX, labelY + 3);
          }
        }
      });

      // 3. Main Base Swing Line
      ctx.setLineDash([]);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Anchor Handles
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(x1, y1, 4.5, 0, Math.PI * 2);
      ctx.arc(x2, y2, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'fib_extension': {
      if (item.points.length < 2) break;
      const [p1, p2] = item.points;
      const x1 = getXFromTime(p1.time);
      const x2 = getXFromTime(p2.time);
      const y1 = getY(p1.price);
      const y2 = getY(p2.price);

      const p3 = item.points[2] || { price: p1.price + (p2.price - p1.price) * 0.5, time: p2.time };
      const x3 = getXFromTime(p3.time);
      const y3 = getY(p3.price);

      // 1. Swing Trend Line (P1 -> P2) and Retracement Line (P2 -> P3)
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x3, y3);
      ctx.stroke();

      // Swing Badges A, B, C
      const drawPointBadge = (px: number, py: number, label: string) => {
        ctx.setLineDash([]);
        ctx.fillStyle = '#0b0f19ee';
        ctx.beginPath();
        ctx.arc(px, py, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(label, px, py + 3);
      };
      drawPointBadge(x1, y1, 'A');
      drawPointBadge(x2, y2, 'B');
      drawPointBadge(x3, y3, 'C');

      const swingRange = p2.price - p1.price;
      const rawExtLevels = item.fibExtensionLevels || DEFAULT_FIB_EXTENSION_LEVELS;
      const enabledExt = rawExtLevels.filter((l) => l.enabled).sort((a, b) => a.level - b.level);
      const minX = Math.min(x3, chartWidth - 120);

      // 2. Extension Translucent Band Fills
      for (let i = 0; i < enabledExt.length - 1; i++) {
        const lvlA = enabledExt[i];
        const lvlB = enabledExt[i + 1];
        const targetA = p3.price + swingRange * lvlA.level;
        const targetB = p3.price + swingRange * lvlB.level;
        const yA = getY(targetA);
        const yB = getY(targetB);
        const topY = Math.min(yA, yB);
        const bandH = Math.abs(yB - yA);

        if (bandH > 0.5) {
          ctx.fillStyle = hexToRgba(lvlA.color, item.fillOpacity ?? 0.08);
          ctx.fillRect(minX, topY, chartWidth - minX, bandH);
        }
      }

      // 3. Golden Extension Highlight (1.618)
      const gExtLvl = enabledExt.find((l) => Math.abs(l.level - 1.618) < 0.05);
      if (gExtLvl) {
        const gPrice = p3.price + swingRange * 1.618;
        const gY = getY(gPrice);
        ctx.fillStyle = 'rgba(236, 72, 153, 0.16)';
        ctx.fillRect(minX, gY - 6, chartWidth - minX, 12);
      }

      // 4. Extension Level Lines & Price Badges
      rawExtLevels.forEach((lvl) => {
        if (!lvl.enabled) return;
        const targetPrice = p3.price + swingRange * lvl.level;
        const y = getY(targetPrice);

        ctx.strokeStyle = lvl.color;
        ctx.lineWidth = 1.25;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(minX, y);
        ctx.lineTo(chartWidth, y);
        ctx.stroke();

        if (item.showPrices ?? true) {
          ctx.setLineDash([]);
          const fmtP = targetPrice > 100 ? targetPrice.toFixed(2) : targetPrice.toFixed(4);
          const extStr = `Ext ${lvl.label} | $${fmtP}`;
          ctx.font = 'bold 9px monospace';
          const textW = ctx.measureText(extStr).width + 12;

          const badgeX = chartWidth - textW - 4;
          ctx.fillStyle = '#0b0f19f0';
          ctx.beginPath();
          ctx.roundRect(badgeX, y - 8, textW, 16, 3);
          ctx.fill();
          ctx.strokeStyle = lvl.color;
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = lvl.color;
          ctx.textAlign = 'left';
          ctx.fillText(extStr, badgeX + 6, y + 3.5);
        }
      });
      break;
    }

    case 'position_long': {
      const p1 = item.points[0];
      const entryPrice = p1.price;
      const x1 = getXFromTime(p1.time);
      const p2 = item.points[1];
      const x2 = p2 ? Math.max(x1 + 24, getXFromTime(p2.time)) : x1 + (item.lineWidth ? item.lineWidth * 90 : 180);

      // Smart fallback ONLY if missing or NaN
      const fallbackSpan = utils.priceRange > 0 ? Math.min(entryPrice * 0.015, utils.priceRange * 0.1) : entryPrice * 0.01;

      let tpPrice = item.riskReward?.takeProfit;
      let slPrice = item.riskReward?.stopLoss;

      if (tpPrice === undefined || tpPrice === null || isNaN(tpPrice)) {
        tpPrice = entryPrice + fallbackSpan * 2;
      }
      if (slPrice === undefined || slPrice === null || isNaN(slPrice)) {
        slPrice = entryPrice - fallbackSpan;
      }

      const entryY = getY(entryPrice);
      const tpY = getY(tpPrice);
      const slY = getY(slPrice);

      const tpBoxHeight = Math.abs(entryY - tpY);
      const slBoxHeight = Math.abs(slY - entryY);
      const boxWidth = Math.max(16, x2 - x1);

      const bullColor = palette.bull || '#089981';
      const bearColor = palette.bear || '#f23645';

      // 1. Take Profit Zone (Green) - Above Entry
      const tpTopY = Math.min(entryY, tpY);
      ctx.fillStyle = `${bullColor}26`;
      ctx.beginPath();
      ctx.roundRect(x1, tpTopY, boxWidth, tpBoxHeight, [4, 4, 0, 0]);
      ctx.fill();
      ctx.strokeStyle = bullColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 2. Stop Loss Zone (Red) - Below Entry
      const slTopY = Math.min(entryY, slY);
      ctx.fillStyle = `${bearColor}26`;
      ctx.beginPath();
      ctx.roundRect(x1, slTopY, boxWidth, slBoxHeight, [0, 0, 4, 4]);
      ctx.fill();
      ctx.strokeStyle = bearColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 3. Entry Line
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(x1, entryY);
      ctx.lineTo(x2, entryY);
      ctx.stroke();
      ctx.setLineDash([]);

      // 4. Drag Handles with Glowing Auras for Effortless Grabbing
      const midX = (x1 + x2) / 2;

      // TP Handle (Top center)
      ctx.fillStyle = `${bullColor}40`;
      ctx.beginPath();
      ctx.arc(midX, tpY, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = bullColor;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(midX, tpY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // SL Handle (Bottom center)
      ctx.fillStyle = `${bearColor}40`;
      ctx.beginPath();
      ctx.arc(midX, slY, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = bearColor;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(midX, slY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Left Handle
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.beginPath();
      ctx.arc(x1, entryY, 8.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x1, entryY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Right Handle
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.beginPath();
      ctx.arc(x2, entryY, 8.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x2, entryY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Center Entry Handle
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(midX, entryY, 8.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(midX, entryY, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 5. TradingView Style In-Box Text Overlays & Badges
      const tpDiff = Math.abs(tpPrice - entryPrice);
      const slDiff = Math.abs(entryPrice - slPrice);
      const tpPct = (tpDiff / (entryPrice || 1)) * 100;
      const slPct = (slDiff / (entryPrice || 1)) * 100;
      const rrVal = Math.max(0.01, tpDiff / (slDiff || 0.00001));

      const fmtPrice = (p: number) => (p > 100 ? p.toFixed(2) : p.toFixed(4));
      const fmtDiff = (d: number) => (d > 100 ? d.toFixed(2) : d.toFixed(4));

      // TP Box Overlay Text
      if (tpBoxHeight >= 22 && boxWidth >= 50) {
        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        const tpTextY = tpTopY + Math.min(22, tpBoxHeight / 2);
        ctx.fillText(`Target: +${fmtDiff(tpDiff)} (${tpPct.toFixed(2)}%)`, midX, tpTextY);
        ctx.font = '9px sans-serif';
        ctx.fillStyle = `${bullColor}`;
        ctx.fillText(`Risk/Reward Ratio: ${rrVal.toFixed(2)}`, midX, tpTextY + 12);
      }

      // SL Box Overlay Text
      if (slBoxHeight >= 22 && boxWidth >= 50) {
        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        const slTextY = slTopY + Math.max(14, slBoxHeight - 12);
        ctx.fillText(`Stop: -${fmtDiff(slDiff)} (${slPct.toFixed(2)}%)`, midX, slTextY);
      }

      // Main Floating Summary Badge above Entry Line
      const badgeText = `LONG | R:R ${rrVal.toFixed(2)} | TP +${tpPct.toFixed(2)}% (${fmtPrice(tpPrice)}) | SL -${slPct.toFixed(2)}% (${fmtPrice(slPrice)})`;
      ctx.font = 'bold 9.5px monospace';
      const textWidth = ctx.measureText(badgeText).width + 16;
      const badgeX = Math.max(4, Math.min(x1, chartWidth - textWidth - 10));
      const badgeY = Math.max(20, entryY - 14);

      ctx.fillStyle = '#0b0f19ee';
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY - 2, textWidth, 20, 5);
      ctx.fill();
      ctx.strokeStyle = bullColor;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(badgeText, badgeX + 8, badgeY + 11.5);
      break;
    }

    case 'position_short': {
      const p1 = item.points[0];
      const entryPrice = p1.price;
      const x1 = getXFromTime(p1.time);
      const p2 = item.points[1];
      const x2 = p2 ? Math.max(x1 + 24, getXFromTime(p2.time)) : x1 + (item.lineWidth ? item.lineWidth * 90 : 180);

      // Smart fallback ONLY if missing or NaN
      const fallbackSpan = utils.priceRange > 0 ? Math.min(entryPrice * 0.015, utils.priceRange * 0.1) : entryPrice * 0.01;

      let tpPrice = item.riskReward?.takeProfit;
      let slPrice = item.riskReward?.stopLoss;

      if (tpPrice === undefined || tpPrice === null || isNaN(tpPrice)) {
        tpPrice = entryPrice - fallbackSpan * 2;
      }
      if (slPrice === undefined || slPrice === null || isNaN(slPrice)) {
        slPrice = entryPrice + fallbackSpan;
      }

      const entryY = getY(entryPrice);
      const slY = getY(slPrice);
      const tpY = getY(tpPrice);

      const slBoxHeight = Math.abs(entryY - slY);
      const tpBoxHeight = Math.abs(tpY - entryY);
      const boxWidth = Math.max(16, x2 - x1);

      const bullColor = palette.bull || '#089981';
      const bearColor = palette.bear || '#f23645';

      // 1. Stop Loss Zone (Red) - Above Entry
      const slTopY = Math.min(entryY, slY);
      ctx.fillStyle = `${bearColor}26`;
      ctx.beginPath();
      ctx.roundRect(x1, slTopY, boxWidth, slBoxHeight, [4, 4, 0, 0]);
      ctx.fill();
      ctx.strokeStyle = bearColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 2. Take Profit Zone (Green) - Below Entry
      const tpTopY = Math.min(entryY, tpY);
      ctx.fillStyle = `${bullColor}26`;
      ctx.beginPath();
      ctx.roundRect(x1, tpTopY, boxWidth, tpBoxHeight, [0, 0, 4, 4]);
      ctx.fill();
      ctx.strokeStyle = bullColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 3. Entry Line
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(x1, entryY);
      ctx.lineTo(x2, entryY);
      ctx.stroke();
      ctx.setLineDash([]);

      // 4. Drag Handles with Glowing Auras for Effortless Grabbing
      const midX = (x1 + x2) / 2;

      // SL Handle (Top center)
      ctx.fillStyle = `${bearColor}40`;
      ctx.beginPath();
      ctx.arc(midX, slY, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = bearColor;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(midX, slY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // TP Handle (Bottom center)
      ctx.fillStyle = `${bullColor}40`;
      ctx.beginPath();
      ctx.arc(midX, tpY, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = bullColor;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(midX, tpY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Left Handle
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.beginPath();
      ctx.arc(x1, entryY, 8.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x1, entryY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Right Handle
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.beginPath();
      ctx.arc(x2, entryY, 8.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x2, entryY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Center Entry Handle
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(midX, entryY, 8.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(midX, entryY, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 5. TradingView Style In-Box Text Overlays & Badges
      const tpDiff = Math.abs(entryPrice - tpPrice);
      const slDiff = Math.abs(slPrice - entryPrice);
      const tpPct = (tpDiff / (entryPrice || 1)) * 100;
      const slPct = (slDiff / (entryPrice || 1)) * 100;
      const rrVal = Math.max(0.01, tpDiff / (slDiff || 0.00001));

      const fmtPrice = (p: number) => (p > 100 ? p.toFixed(2) : p.toFixed(4));
      const fmtDiff = (d: number) => (d > 100 ? d.toFixed(2) : d.toFixed(4));

      // SL Box Overlay Text (Top red area)
      if (slBoxHeight >= 22 && boxWidth >= 50) {
        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        const slTextY = slTopY + Math.min(22, slBoxHeight / 2);
        ctx.fillText(`Stop: -${fmtDiff(slDiff)} (${slPct.toFixed(2)}%)`, midX, slTextY);
      }

      // TP Box Overlay Text (Bottom green area)
      if (tpBoxHeight >= 22 && boxWidth >= 50) {
        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        const tpTextY = tpTopY + Math.max(14, tpBoxHeight - 20);
        ctx.fillText(`Target: +${fmtDiff(tpDiff)} (${tpPct.toFixed(2)}%)`, midX, tpTextY);
        ctx.font = '9px sans-serif';
        ctx.fillStyle = `${bullColor}`;
        ctx.fillText(`Risk/Reward Ratio: ${rrVal.toFixed(2)}`, midX, tpTextY + 12);
      }

      // Main Floating Summary Badge above Entry Line
      const badgeText = `SHORT | R:R ${rrVal.toFixed(2)} | TP +${tpPct.toFixed(2)}% (${fmtPrice(tpPrice)}) | SL -${slPct.toFixed(2)}% (${fmtPrice(slPrice)})`;
      ctx.font = 'bold 9.5px monospace';
      const textWidth = ctx.measureText(badgeText).width + 16;
      const badgeX = Math.max(4, Math.min(x1, chartWidth - textWidth - 10));
      const badgeY = Math.max(20, entryY - 14);

      ctx.fillStyle = '#0b0f19ee';
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY - 2, textWidth, 20, 5);
      ctx.fill();
      ctx.strokeStyle = bearColor;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(badgeText, badgeX + 8, badgeY + 11.5);
      break;
    }

    case 'ruler': {
      if (item.points.length < 2) break;
      const [p1, p2] = item.points;
      const x1 = getXFromTime(p1.time);
      const x2 = getXFromTime(p2.time);
      const y1 = getY(p1.price);
      const y2 = getY(p2.price);

      const minX = Math.min(x1, x2);
      const maxX = Math.max(x1, x2);
      const minY = Math.min(y1, y2);
      const maxY = Math.max(y1, y2);

      const barsCount = Math.max(1, Math.round(Math.abs(x2 - x1) / totalCandleSlot));
      const priceDiff = p2.price - p1.price;
      const pctDiff = ((priceDiff / (p1.price || 1)) * 100);

      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);

      // Center Card
      const cardX = (minX + maxX) / 2;
      const cardY = (minY + maxY) / 2;
      ctx.fillStyle = '#0b0f19ee';
      ctx.beginPath();
      ctx.roundRect(cardX - 68, cardY - 19, 136, 38, 5);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.stroke();

      ctx.fillStyle = priceDiff >= 0 ? palette.bull : palette.bear;
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${priceDiff >= 0 ? '+' : ''}${priceDiff?.toFixed(2)} (${pctDiff >= 0 ? '+' : ''}${pctDiff?.toFixed(2)}%)`, cardX, cardY - 4);
      ctx.fillStyle = '#9ca3af';
      ctx.font = '9px monospace';
      ctx.fillText(`${barsCount} bars | Δ ${(Math.abs(p2.time - p1.time) / 3600000)?.toFixed(1)}h`, cardX, cardY + 11);
      break;
    }

    case 'text': {
      const p1 = item.points[0];
      const x = getXFromTime(p1.time);
      const y = getY(p1.price);
      const noteText = item.text || item.label || 'Note';

      ctx.font = `${item.fontSize || 11}px sans-serif`;
      const textW = ctx.measureText(noteText).width + 16;
      ctx.fillStyle = '#1e222dee';
      ctx.beginPath();
      ctx.roundRect(x - textW / 2, y - 13, textW, 26, 4);
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.fillStyle = item.textColor || '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(noteText, x, y + 4);
      break;
    }

    case 'callout': {
      const p1 = item.points[0];
      const x = getXFromTime(p1.time);
      const y = getY(p1.price);
      const msg = item.text || item.label || 'Callout';

      ctx.font = `${item.fontSize || 11}px sans-serif`;
      const textW = ctx.measureText(msg).width + 16;
      ctx.fillStyle = '#1e293bee';
      ctx.beginPath();
      ctx.roundRect(x - textW / 2, y - 35, textW, 24, 6);
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Arrow pointer
      ctx.fillStyle = '#1e293bee';
      ctx.beginPath();
      ctx.moveTo(x - 5, y - 11);
      ctx.lineTo(x, y - 2);
      ctx.lineTo(x + 5, y - 11);
      ctx.fill();

      ctx.fillStyle = item.textColor || '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(msg, x, y - 19);
      break;
    }

    case 'price_label': {
      const p1 = item.points[0];
      const x = getXFromTime(p1.time);
      const y = getY(p1.price);

      ctx.fillStyle = strokeColor;
      ctx.beginPath();
      ctx.roundRect(x - 32, y - 10, 64, 20, 4);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`$${p1.price?.toFixed(p1.price > 100 ? 2 : 4)}`, x, y + 3.5);
      break;
    }

    case 'alert': {
      const p1 = item.points[0];
      const x = getXFromTime(p1.time);
      const y = getY(p1.price);
      
      // Animated Pulsing Halo
      const pulse = (Math.sin(Date.now() / 300) + 1) / 2;
      ctx.fillStyle = `${strokeColor}${Math.round(pulse * 40).toString(16).padStart(2, '0')}`;
      ctx.beginPath();
      ctx.arc(x, y, 12 + pulse * 6, 0, Math.PI * 2);
      ctx.fill();

      // Main Anchor
      ctx.fillStyle = strokeColor;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('PRICE ALERT', x + 10, y - 4);
      ctx.fillStyle = strokeColor;
      ctx.fillText(`Target: $${p1.price?.toFixed(2)}`, x + 10, y + 8);
      break;
    }
  }

  ctx.restore();
}

/**
 * Selection Handles Renderer
 */
export function renderSelectionHandles(
  ctx: CanvasRenderingContext2D,
  item: DrawingItem,
  utils: CoordinateUtils
) {
  const { getY, getXFromTime, chartWidth, fullHeight } = utils;

  const drawHandle = (hx: number, hy: number, color = '#0284c7', radius = 4.5) => {
    ctx.save();
    ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.beginPath();
    ctx.arc(hx, hy, radius + 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(hx, hy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };

  if (!item.points || item.points.length === 0) return;

  const p1 = item.points[0];
  const x1 = getXFromTime(p1.time);
  const y1 = getY(p1.price);

  if (item.type === 'horizontal') {
    drawHandle(x1, y1);
    drawHandle(chartWidth / 2, y1);
  } else if (item.type === 'vertical') {
    drawHandle(x1, y1);
    drawHandle(x1, fullHeight / 2);
  } else if (item.type === 'cross_line') {
    drawHandle(x1, y1);
    drawHandle(x1, fullHeight / 2);
    drawHandle(chartWidth / 2, y1);
  } else if (item.type === 'rectangle' || item.type === 'ruler') {
    if (item.points.length >= 2) {
      const p2 = item.points[1];
      const x2 = getXFromTime(p2.time);
      const y2 = getY(p2.price);
      drawHandle(x1, y1);
      drawHandle(x2, y2);
      drawHandle(x1, y2);
      drawHandle(x2, y1);
      drawHandle((x1 + x2) / 2, (y1 + y2) / 2, '#38bdf8', 3.5);
    }
  } else if (
    item.type === 'triangle' ||
    item.type === 'pitchfork' ||
    item.type === 'fib_extension' ||
    item.type === 'parallel_channel'
  ) {
    drawHandle(x1, y1);
    if (item.points.length >= 2) {
      const p2 = item.points[1];
      drawHandle(getXFromTime(p2.time), getY(p2.price));
    }
    if (item.points[2]) {
      drawHandle(getXFromTime(item.points[2].time), getY(item.points[2].price));
    }
  } else if (item.type === 'head_and_shoulders' || item.type === 'elliott_wave' || item.type === 'polyline') {
    item.points.forEach((p) => {
      drawHandle(getXFromTime(p.time), getY(p.price));
    });
  } else {
    drawHandle(x1, y1);
    if (item.points.length >= 2) {
      const p2 = item.points[1];
      const x2 = getXFromTime(p2.time);
      const y2 = getY(p2.price);
      drawHandle(x2, y2);
      drawHandle((x1 + x2) / 2, (y1 + y2) / 2, '#38bdf8', 3.5);
    }
  }
}
