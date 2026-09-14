import { 
  Crosshair, Slash, Minus, Grid, Ruler, 
  Square, TrendingUp, TrendingDown, Type, 
  ArrowUpRight, SeparatorVertical, Layers,
  Sparkles, Circle, Triangle as TriangleIcon,
  Pencil, ArrowRight, MessageSquare, Tag,
  Highlighter, GitCommit, Activity, Compass,
  Split, Bell
} from 'lucide-react';
import { DrawingToolType } from './drawingTools';

export interface ToolItem {
  id: DrawingToolType;
  name: string;
  shortcut?: string;
  icon: any;
  description?: string;
}

export interface ToolGroup {
  id: string;
  title: string;
  defaultTool: DrawingToolType;
  tools: ToolItem[];
}

export const DRAWING_TOOL_GROUPS: ToolGroup[] = [
    {
      id: 'cursor_group',
      title: 'Cursor & Pan Tools',
      defaultTool: 'cursor',
      tools: [
        { id: 'cursor', name: 'Crosshair / Pan', shortcut: 'Esc', icon: Crosshair, description: 'Default interactive pointer & canvas pan' },
      ],
    },
    {
      id: 'lines_group',
      title: 'Trend & Line Tools',
      defaultTool: 'trendline',
      tools: [
        { id: 'trendline', name: 'Trend Line', shortcut: 'Alt+T', icon: Slash, description: 'Angled trend line with Angle HUD & price delta' },
        { id: 'ray', name: 'Ray Line', shortcut: 'Alt+R', icon: ArrowUpRight, description: 'Infinitely extending projection ray' },
        { id: 'horizontal', name: 'Horizontal Line', shortcut: 'Alt+H', icon: Minus, description: 'Support / Resistance price level with axis badge' },
        { id: 'horizontal_ray', name: 'Horizontal Ray', shortcut: 'HRay', icon: ArrowRight, description: 'Horizontal ray extending from point to right' },
        { id: 'vertical', name: 'Vertical Line', shortcut: 'Alt+V', icon: SeparatorVertical, description: 'Timeline anchor & session divider' },
        { id: 'cross_line', name: 'Cross Line', shortcut: 'Cross', icon: Crosshair, description: 'Dual horizontal & vertical axis cross intersection' },
        { id: 'extended_line', name: 'Extended Line', shortcut: 'Ext', icon: Slash, description: 'Bi-directional infinite line' },
        { id: 'arrow', name: 'Arrow Vector', shortcut: 'Arrow', icon: ArrowRight, description: 'Vector directional arrow line' },
        { id: 'parallel_channel', name: 'Parallel Channel', shortcut: 'Chan', icon: Layers, description: 'Parallel trend channel zone with 50% midline' },
        { id: 'pitchfork', name: "Andrews' Pitchfork", shortcut: 'Fork', icon: Split, description: 'Andrew Pitchfork median channel with 3 points' },
      ],
    },
    {
      id: 'fib_group',
      title: 'Gann & Fibonacci Tools',
      defaultTool: 'fibonacci',
      tools: [
        { id: 'fibonacci', name: 'Fibonacci Retracement', shortcut: 'Alt+F', icon: Grid, description: 'Auto 9-level Fib ratios with Golden Pocket' },
        { id: 'fib_fan', name: 'Fibonacci Fan', shortcut: 'Fan', icon: Sparkles, description: 'Fibonacci angular speed resistance fan' },
        { id: 'fib_extension', name: 'Trend-Based Fib Extension', shortcut: 'ExtFib', icon: Compass, description: '3-point trend expansion targets (1.0, 1.272, 1.618)' },
      ],
    },
    {
      id: 'shapes_group',
      title: 'Shapes & Freehand Tools',
      defaultTool: 'rectangle',
      tools: [
        { id: 'rectangle', name: 'Rectangle / Order Block', shortcut: 'Box', icon: Square, description: 'Supply & Demand zone with 50% midline & extend right' },
        { id: 'ellipse', name: 'Ellipse / Circle', shortcut: 'Circle', icon: Circle, description: 'Circular structural zone highlight' },
        { id: 'triangle', name: 'Triangle Pattern', shortcut: 'Tri', icon: TriangleIcon, description: '3-point pattern wedge triangle' },
        { id: 'brush', name: 'Freehand Brush', shortcut: 'Brush', icon: Pencil, description: 'Freehand annotation drawing with Bézier smoothing' },
        { id: 'highlighter', name: 'Highlighter (Stabilo)', shortcut: 'High', icon: Highlighter, description: 'Wide semi-transparent marker for candle zones' },
        { id: 'polyline', name: 'Polyline (Path)', shortcut: 'Poly', icon: GitCommit, description: 'Connected multi-point structure path' },
      ],
    },
    {
      id: 'patterns_group',
      title: 'Chart & Wave Patterns',
      defaultTool: 'head_and_shoulders',
      tools: [
        { id: 'head_and_shoulders', name: 'Head and Shoulders (H&S)', shortcut: 'H&S', icon: Activity, description: '5-point H&S pattern with neckline & target box' },
        { id: 'elliott_wave', name: 'Elliott Wave (1-2-3-4-5)', shortcut: 'EW', icon: Activity, description: '5-point impulse wave structure with numbered tags' },
      ],
    },
    {
      id: 'text_group',
      title: 'Annotation & Callout Tools',
      defaultTool: 'text',
      tools: [
        { id: 'text', name: 'Text Note', shortcut: 'Txt', icon: Type, description: 'Customized analysis note callout' },
        { id: 'callout', name: 'Pin Callout', shortcut: 'Pin', icon: MessageSquare, description: 'Pointer speech callout with direction tail' },
        { id: 'price_label', name: 'Price Label Badge', shortcut: 'Tag', icon: Tag, description: 'Instant price level badge tag' },
        { id: 'alert', name: 'Price Alert Anchor', shortcut: 'Alt+A', icon: Bell, description: 'Visual anchor for price-triggered alerts' },
      ],
    },
    {
      id: 'prediction_group',
      title: 'Prediction & Measure Tools',
      defaultTool: 'position_long',
      tools: [
        { id: 'position_long', name: 'Long Position (Buy R:R)', shortcut: 'Long', icon: TrendingUp, description: 'Take-Profit & Stop-Loss risk ratio calculator with dynamic drag' },
        { id: 'position_short', name: 'Short Position (Sell R:R)', shortcut: 'Short', icon: TrendingDown, description: 'Short trade Risk-to-Reward setup calculator' },
        { id: 'ruler', name: 'Price & Bar Measure Ruler', shortcut: 'Ruler', icon: Ruler, description: 'Measure delta price ($ & %), pips, bars, time duration & volume' },
      ],
    },
];

export function getToolDef(id: DrawingToolType): ToolItem | undefined {
  for (const group of DRAWING_TOOL_GROUPS) {
    const f = group.tools.find(t => t.id === id);
    if (f) return f;
  }
  return undefined;
}

