import { DrawingItem } from './drawingTools';

export interface DrawingLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  zIndex: number; // Higher number = rendered on top
  color: string; // Layer badge accent color
  isDefault?: boolean;
  createdAt?: number;
}

export const LAYER_STORAGE_KEY = 'mountalgo_drawing_layers';
export const ACTIVE_LAYER_STORAGE_KEY = 'mountalgo_active_layer_id';

export const DEFAULT_DRAWING_LAYERS: DrawingLayer[] = [
  {
    id: 'layer_default',
    name: 'Main Drawing Layer',
    visible: true,
    locked: false,
    zIndex: 0,
    color: '#3b82f6',
    isDefault: true,
    createdAt: 0,
  },
];

export function getStoredDrawingLayers(): DrawingLayer[] {
  if (typeof window === 'undefined') return DEFAULT_DRAWING_LAYERS;
  try {
    const raw = localStorage.getItem(LAYER_STORAGE_KEY);
    if (!raw) return DEFAULT_DRAWING_LAYERS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_DRAWING_LAYERS;

    // Ensure default layer exists
    const hasDefault = parsed.some((l: DrawingLayer) => l.isDefault || l.id === 'layer_default');
    if (!hasDefault) {
      return [DEFAULT_DRAWING_LAYERS[0], ...parsed];
    }
    return parsed;
  } catch (err) {
    console.warn('Error reading drawing layers from localStorage:', err);
    return DEFAULT_DRAWING_LAYERS;
  }
}

export function saveDrawingLayers(layers: DrawingLayer[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LAYER_STORAGE_KEY, JSON.stringify(layers));
  } catch (err) {
    console.warn('Error saving drawing layers to localStorage:', err);
  }
}

export function getStoredActiveLayerId(): string {
  if (typeof window === 'undefined') return 'layer_default';
  return localStorage.getItem(ACTIVE_LAYER_STORAGE_KEY) || 'layer_default';
}

export function saveStoredActiveLayerId(layerId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVE_LAYER_STORAGE_KEY, layerId);
}

export function createNewLayer(name: string, color: string = '#3b82f6', currentLayersCount: number = 1): DrawingLayer {
  const cleanName = name.trim() || `Layer ${currentLayersCount + 1}`;
  return {
    id: `layer_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: cleanName,
    visible: true,
    locked: false,
    zIndex: currentLayersCount,
    color,
    isDefault: false,
    createdAt: Date.now(),
  };
}

export function getEffectiveDrawingVisibility(item: DrawingItem, layersMap: Map<string, DrawingLayer>): boolean {
  if (item.hidden) return false;
  const layerId = item.layerId || 'layer_default';
  const layer = layersMap.get(layerId);
  if (layer && !layer.visible) return false;
  return true;
}

export function getEffectiveDrawingLocked(item: DrawingItem, layersMap: Map<string, DrawingLayer>, isGlobalLocked?: boolean): boolean {
  if (isGlobalLocked) return true;
  if (item.locked) return true;
  const layerId = item.layerId || 'layer_default';
  const layer = layersMap.get(layerId);
  if (layer && layer.locked) return true;
  return false;
}

export function sortDrawingsByZIndex(drawings: DrawingItem[], layers: DrawingLayer[]): DrawingItem[] {
  const layersMap = new Map<string, DrawingLayer>();
  layers.forEach((l) => layersMap.set(l.id, l));

  // Clone array to prevent mutating original state directly
  return [...drawings].sort((a, b) => {
    const layerA = layersMap.get(a.layerId || 'layer_default');
    const layerB = layersMap.get(b.layerId || 'layer_default');

    const zIndexA = layerA ? layerA.zIndex : 0;
    const zIndexB = layerB ? layerB.zIndex : 0;

    if (zIndexA !== zIndexB) {
      return zIndexA - zIndexB; // Lower zIndex rendered first (behind), higher rendered on top
    }

    // Fallback to item level zIndex or original array order
    const itemZIndexA = a.zIndex ?? 0;
    const itemZIndexB = b.zIndex ?? 0;
    return itemZIndexA - itemZIndexB;
  });
}

export function moveLayerZIndex(
  layers: DrawingLayer[],
  layerId: string,
  direction: 'up' | 'down' | 'top' | 'bottom'
): DrawingLayer[] {
  const sorted = [...layers].sort((a, b) => a.zIndex - b.zIndex);
  const index = sorted.findIndex((l) => l.id === layerId);
  if (index === -1) return layers;

  if (direction === 'up' && index < sorted.length - 1) {
    // Swap zIndex with next
    const currentZ = sorted[index].zIndex;
    const nextZ = sorted[index + 1].zIndex;
    sorted[index].zIndex = nextZ === currentZ ? currentZ + 1 : nextZ;
    sorted[index + 1].zIndex = currentZ;
  } else if (direction === 'down' && index > 0) {
    // Swap zIndex with prev
    const currentZ = sorted[index].zIndex;
    const prevZ = sorted[index - 1].zIndex;
    sorted[index].zIndex = prevZ === currentZ ? currentZ - 1 : prevZ;
    sorted[index - 1].zIndex = currentZ;
  } else if (direction === 'top') {
    const maxZ = Math.max(...sorted.map((l) => l.zIndex), 0);
    sorted[index].zIndex = maxZ + 1;
  } else if (direction === 'bottom') {
    const minZ = Math.min(...sorted.map((l) => l.zIndex), 0);
    sorted[index].zIndex = minZ - 1;
  }

  // Normalize zIndexes to 0, 1, 2...
  sorted.sort((a, b) => a.zIndex - b.zIndex);
  return sorted.map((l, idx) => ({ ...l, zIndex: idx }));
}
