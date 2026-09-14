import { DrawingItem, Point } from './drawingTools';
import { CoordinateUtils } from './drawingRenderers';

export interface DrawingHitResult {
  id: string;
  part: 'body' | 'point0' | 'point1' | 'point2' | 'point3' | 'point4' | 'point5' | 'tp' | 'sl' | 'left' | 'right';
  drawing: DrawingItem;
}

export function getDrawingHitTest(
  mouseX: number,
  mouseY: number,
  drawings: DrawingItem[],
  utils: CoordinateUtils,
  hideDrawings?: boolean
): DrawingHitResult | null {
  if (!utils || hideDrawings) return null;
  const { getY, getXFromTime, chartWidth, fullHeight } = utils;

  const distToSegment = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
    const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  };

  const isPointInPoly = (px: number, py: number, poly: { x: number; y: number }[]) => {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i].x, yi = poly[i].y;
      const xj = poly[j].x, yj = poly[j].y;
      const intersect = ((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  for (let i = drawings.length - 1; i >= 0; i--) {
    const item = drawings[i];
    if (!item.points || item.points.length === 0) continue;

    if (item.type === 'horizontal') {
      const p1 = item.points[0];
      const y = getY(p1.price);
      const x1 = getXFromTime(p1.time);
      if (Math.hypot(mouseX - x1, mouseY - y) <= 16 || Math.hypot(mouseX - chartWidth / 2, mouseY - y) <= 16) {
        return { id: item.id, part: 'point0', drawing: item };
      }
      if (Math.abs(mouseY - y) <= 12 && mouseX <= chartWidth + 60) {
        return { id: item.id, part: 'body', drawing: item };
      }
    } else if (item.type === 'horizontal_ray') {
      const p1 = item.points[0];
      const y = getY(p1.price);
      const x1 = getXFromTime(p1.time);
      if (Math.hypot(mouseX - x1, mouseY - y) <= 16) {
        return { id: item.id, part: 'point0', drawing: item };
      }
      if (Math.abs(mouseY - y) <= 12 && mouseX >= x1 - 10 && mouseX <= chartWidth + 60) {
        return { id: item.id, part: 'body', drawing: item };
      }
    } else if (item.type === 'vertical') {
      const p1 = item.points[0];
      const x = getXFromTime(p1.time);
      if (Math.hypot(mouseX - x, mouseY - fullHeight / 2) <= 16) {
        return { id: item.id, part: 'point0', drawing: item };
      }
      if (Math.abs(mouseX - x) <= 12 && mouseY <= fullHeight) {
        return { id: item.id, part: 'body', drawing: item };
      }
    } else if (item.type === 'cross_line') {
      const p1 = item.points[0];
      const x = getXFromTime(p1.time);
      const y = getY(p1.price);
      if (Math.hypot(mouseX - x, mouseY - y) <= 16) {
        return { id: item.id, part: 'point0', drawing: item };
      }
      if (Math.abs(mouseY - y) <= 12 || Math.abs(mouseX - x) <= 12) {
        return { id: item.id, part: 'body', drawing: item };
      }
    } else if (
      item.type === 'trendline' ||
      item.type === 'ray' ||
      item.type === 'extended_line' ||
      item.type === 'arrow'
    ) {
      if (item.points.length >= 2) {
        const [p1, p2] = item.points;
        const x1 = getXFromTime(p1.time);
        const x2 = getXFromTime(p2.time);
        const y1 = getY(p1.price);
        const y2 = getY(p2.price);

        if (Math.hypot(mouseX - x1, mouseY - y1) <= 16) {
          return { id: item.id, part: 'point0', drawing: item };
        }
        if (Math.hypot(mouseX - x2, mouseY - y2) <= 16) {
          return { id: item.id, part: 'point1', drawing: item };
        }
        if (Math.hypot(mouseX - (x1 + x2) / 2, mouseY - (y1 + y2) / 2) <= 14) {
          return { id: item.id, part: 'body', drawing: item };
        }

        if (item.type === 'ray') {
          const slope = (y2 - y1) / ((x2 - x1) || 0.0001);
          const targetX = chartWidth + 50;
          const targetY = y1 + slope * (targetX - x1);
          if (distToSegment(mouseX, mouseY, x1, y1, targetX, targetY) <= 12) {
            return { id: item.id, part: 'body', drawing: item };
          }
        } else if (item.type === 'extended_line') {
          const slope = (y2 - y1) / ((x2 - x1) || 0.0001);
          const yStart = y1 - slope * x1;
          const yEnd = y1 + slope * (chartWidth - x1);
          if (distToSegment(mouseX, mouseY, 0, yStart, chartWidth, yEnd) <= 12) {
            return { id: item.id, part: 'body', drawing: item };
          }
        } else {
          if (distToSegment(mouseX, mouseY, x1, y1, x2, y2) <= 12) {
            return { id: item.id, part: 'body', drawing: item };
          }
        }
      }
    } else if (item.type === 'parallel_channel') {
      if (item.points.length >= 2) {
        const [p1, p2] = item.points;
        const x1 = getXFromTime(p1.time);
        const x2 = getXFromTime(p2.time);
        const y1 = getY(p1.price);
        const y2 = getY(p2.price);
        const defaultOffset = (p2.price - p1.price) * 0.4 || 35;
        const p3 = item.points[2] || { price: p1.price - defaultOffset, time: p1.time };
        const y3 = getY(p3.price);
        const offset = y3 - y1;

        if (Math.hypot(mouseX - x1, mouseY - y1) <= 16) {
          return { id: item.id, part: 'point0', drawing: item };
        }
        if (Math.hypot(mouseX - x2, mouseY - y2) <= 16) {
          return { id: item.id, part: 'point1', drawing: item };
        }
        if (
          Math.hypot(mouseX - x1, mouseY - (y1 + offset)) <= 16 ||
          Math.hypot(mouseX - (x1 + x2) / 2, mouseY - ((y1 + y2) / 2 + offset)) <= 16
        ) {
          return { id: item.id, part: 'point2', drawing: item };
        }

        const poly = [
          { x: x1, y: y1 },
          { x: x2, y: y2 },
          { x: x2, y: y2 + offset },
          { x: x1, y: y1 + offset },
        ];

        if (
          distToSegment(mouseX, mouseY, x1, y1, x2, y2) <= 12 ||
          distToSegment(mouseX, mouseY, x1, y1 + offset, x2, y2 + offset) <= 12 ||
          isPointInPoly(mouseX, mouseY, poly)
        ) {
          return { id: item.id, part: 'body', drawing: item };
        }
      }
    } else if (item.type === 'rectangle' || item.type === 'ruler') {
      if (item.points.length >= 2) {
        const [p1, p2] = item.points;
        const x1 = getXFromTime(p1.time);
        const x2 = getXFromTime(p2.time);
        const y1 = getY(p1.price);
        const y2 = getY(p2.price);

        if (Math.hypot(mouseX - x1, mouseY - y1) <= 16) {
          return { id: item.id, part: 'point0', drawing: item };
        }
        if (Math.hypot(mouseX - x2, mouseY - y2) <= 16) {
          return { id: item.id, part: 'point1', drawing: item };
        }
        if (Math.hypot(mouseX - x1, mouseY - y2) <= 14 || Math.hypot(mouseX - x2, mouseY - y1) <= 14) {
          return { id: item.id, part: 'point1', drawing: item };
        }

        const minX = Math.min(x1, x2) - 8;
        const maxX = Math.max(x1, x2) + 8;
        const minY = Math.min(y1, y2) - 8;
        const maxY = Math.max(y1, y2) + 8;
        if (mouseX >= minX && mouseX <= maxX && mouseY >= minY && mouseY <= maxY) {
          return { id: item.id, part: 'body', drawing: item };
        }
      }
    } else if (item.type === 'ellipse') {
      if (item.points.length >= 2) {
        const [p1, p2] = item.points;
        const x1 = getXFromTime(p1.time);
        const x2 = getXFromTime(p2.time);
        const y1 = getY(p1.price);
        const y2 = getY(p2.price);
        const cx = (x1 + x2) / 2;
        const cy = (y1 + y2) / 2;
        const rx = Math.max(8, Math.abs(x2 - x1) / 2);
        const ry = Math.max(8, Math.abs(y2 - y1) / 2);

        if (Math.hypot(mouseX - x1, mouseY - y1) <= 16) {
          return { id: item.id, part: 'point0', drawing: item };
        }
        if (Math.hypot(mouseX - x2, mouseY - y2) <= 16) {
          return { id: item.id, part: 'point1', drawing: item };
        }

        const normalizedDist = ((mouseX - cx) / rx) ** 2 + ((mouseY - cy) / ry) ** 2;
        if (normalizedDist <= 1.25) {
          return { id: item.id, part: 'body', drawing: item };
        }
      }
    } else if (item.type === 'triangle' || item.type === 'pitchfork' || item.type === 'fib_extension') {
      if (item.points.length >= 2) {
        const [p1, p2] = item.points;
        const x1 = getXFromTime(p1.time);
        const x2 = getXFromTime(p2.time);
        const y1 = getY(p1.price);
        const y2 = getY(p2.price);
        const p3 = item.points[2] || { price: p1.price + (p2.price - p1.price) * 0.5, time: (p1.time + p2.time) / 2 };
        const x3 = getXFromTime(p3.time);
        const y3 = getY(p3.price);

        if (Math.hypot(mouseX - x1, mouseY - y1) <= 16) {
          return { id: item.id, part: 'point0', drawing: item };
        }
        if (Math.hypot(mouseX - x2, mouseY - y2) <= 16) {
          return { id: item.id, part: 'point1', drawing: item };
        }
        if (Math.hypot(mouseX - x3, mouseY - y3) <= 16) {
          return { id: item.id, part: 'point2', drawing: item };
        }

        const tri = [{ x: x1, y: y1 }, { x: x2, y: y2 }, { x: x3, y: y3 }];
        if (
          distToSegment(mouseX, mouseY, x1, y1, x2, y2) <= 12 ||
          distToSegment(mouseX, mouseY, x2, y2, x3, y3) <= 12 ||
          distToSegment(mouseX, mouseY, x3, y3, x1, y1) <= 12 ||
          isPointInPoly(mouseX, mouseY, tri)
        ) {
          return { id: item.id, part: 'body', drawing: item };
        }
      }
    } else if (
      item.type === 'polyline' ||
      item.type === 'head_and_shoulders' ||
      item.type === 'elliott_wave'
    ) {
      // Check handles
      for (let k = 0; k < item.points.length; k++) {
        const pt = item.points[k];
        const hx = getXFromTime(pt.time);
        const hy = getY(pt.price);
        if (Math.hypot(mouseX - hx, mouseY - hy) <= 16) {
          const partName = (`point${k}` as any) || 'point0';
          return { id: item.id, part: partName, drawing: item };
        }
      }
      // Check segments
      for (let k = 0; k < item.points.length - 1; k++) {
        const pA = item.points[k];
        const pB = item.points[k + 1];
        if (distToSegment(mouseX, mouseY, getXFromTime(pA.time), getY(pA.price), getXFromTime(pB.time), getY(pB.price)) <= 12) {
          return { id: item.id, part: 'body', drawing: item };
        }
      }
    } else if (item.type === 'brush' || item.type === 'highlighter') {
      if (item.points.length === 1) {
        const pA = item.points[0];
        if (Math.hypot(mouseX - getXFromTime(pA.time), mouseY - getY(pA.price)) <= 16) {
          return { id: item.id, part: 'body', drawing: item };
        }
      } else {
        for (let k = 0; k < item.points.length - 1; k++) {
          const pA = item.points[k];
          const pB = item.points[k + 1];
          const dist = distToSegment(mouseX, mouseY, getXFromTime(pA.time), getY(pA.price), getXFromTime(pB.time), getY(pB.price));
          if (dist <= 16) {
            return { id: item.id, part: 'body', drawing: item };
          }
        }
      }
    } else if (item.type === 'fibonacci' || item.type === 'fib_fan') {
      if (item.points.length >= 2) {
        const [p1, p2] = item.points;
        const x1 = getXFromTime(p1.time);
        const x2 = getXFromTime(p2.time);
        const y1 = getY(p1.price);
        const y2 = getY(p2.price);

        if (Math.hypot(mouseX - x1, mouseY - y1) <= 16) {
          return { id: item.id, part: 'point0', drawing: item };
        }
        if (Math.hypot(mouseX - x2, mouseY - y2) <= 16) {
          return { id: item.id, part: 'point1', drawing: item };
        }

        const minX = Math.min(x1, x2) - 10;
        const minY = Math.min(y1, y2) - 10;
        const maxY = Math.max(y1, y2) + 10;
        if (mouseX >= minX && mouseX <= chartWidth && mouseY >= minY && mouseY <= maxY) {
          return { id: item.id, part: 'body', drawing: item };
        }
      }
    } else if (item.type === 'position_long' || item.type === 'position_short') {
      const p1 = item.points[0];
      const x1 = getXFromTime(p1.time);
      const p2 = item.points[1];
      const x2 = p2 ? Math.max(x1 + 24, getXFromTime(p2.time)) : x1 + (item.lineWidth ? item.lineWidth * 90 : 180);
      const handleX = (x1 + x2) / 2;
      const entryPrice = p1.price;
      const isLong = item.type === 'position_long';

      const fallbackSpan = utils.priceRange > 0 ? Math.min(entryPrice * 0.015, utils.priceRange * 0.1) : entryPrice * 0.01;
      let tpPrice = item.riskReward?.takeProfit;
      let slPrice = item.riskReward?.stopLoss;

      if (tpPrice === undefined || tpPrice === null || isNaN(tpPrice)) {
        tpPrice = isLong ? entryPrice + fallbackSpan * 2 : entryPrice - fallbackSpan * 2;
      }
      if (slPrice === undefined || slPrice === null || isNaN(slPrice)) {
        slPrice = isLong ? entryPrice - fallbackSpan : entryPrice + fallbackSpan;
      }
      const entryY = getY(entryPrice);
      const tpY = getY(tpPrice);
      const slY = getY(slPrice);
      const minY = Math.min(tpY, slY, entryY);
      const maxY = Math.max(tpY, slY, entryY);

      // 1. Check TP handle (circular touch node at top center)
      if (Math.hypot(mouseX - handleX, mouseY - tpY) <= 26) {
        return { id: item.id, part: 'tp', drawing: item };
      }

      // 2. Check SL handle (circular touch node at bottom center)
      if (Math.hypot(mouseX - handleX, mouseY - slY) <= 26) {
        return { id: item.id, part: 'sl', drawing: item };
      }

      // 3. Check Left handle (circular touch node at left entry edge)
      if (Math.hypot(mouseX - x1, mouseY - entryY) <= 22) {
        return { id: item.id, part: 'left', drawing: item };
      }

      // 4. Check Right handle (circular touch node at right entry edge)
      if (Math.hypot(mouseX - x2, mouseY - entryY) <= 22) {
        return { id: item.id, part: 'right', drawing: item };
      }

      // 5. Check Center Entry handle (circular touch node at center entry dot)
      if (Math.hypot(mouseX - handleX, mouseY - entryY) <= 20) {
        return { id: item.id, part: 'point0', drawing: item };
      }

      // 6. Body Zone (Entire green/red box interior & margins for effortless 1:1 finger tracking)
      if (
        mouseX >= Math.min(x1, x2) - 10 &&
        mouseX <= Math.max(x1, x2) + 10 &&
        mouseY >= minY - 10 &&
        mouseY <= maxY + 10
      ) {
        return { id: item.id, part: 'body', drawing: item };
      }
    } else if (item.type === 'text' || item.type === 'callout') {
      const p1 = item.points[0];
      const x = getXFromTime(p1.time);
      const y = getY(p1.price);
      if (Math.hypot(mouseX - x, mouseY - y) <= 24) {
        return { id: item.id, part: 'point0', drawing: item };
      }
      if (Math.abs(mouseX - x) <= 70 && Math.abs(mouseY - y) <= 24) {
        return { id: item.id, part: 'body', drawing: item };
      }
    } else if (item.type === 'price_label') {
      const p1 = item.points[0];
      const x = getXFromTime(p1.time);
      const y = getY(p1.price);
      if (Math.hypot(mouseX - x, mouseY - y) <= 20) {
        return { id: item.id, part: 'point0', drawing: item };
      }
      if (Math.abs(mouseX - x) <= 50 && Math.abs(mouseY - y) <= 18) {
        return { id: item.id, part: 'body', drawing: item };
      }
    } else if (item.type === 'alert') {
      const p1 = item.points[0];
      const x = getXFromTime(p1.time);
      const y = getY(p1.price);
      if (Math.hypot(mouseX - x, mouseY - y) <= 20) {
        return { id: item.id, part: 'point0', drawing: item };
      }
      if (Math.abs(mouseX - x) <= 60 && Math.abs(mouseY - y) <= 20) {
        return { id: item.id, part: 'body', drawing: item };
      }
    }
  }

  return null;
}
