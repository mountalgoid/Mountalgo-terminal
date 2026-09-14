/**
 * LOD (Level of Detail) Manager for Liquidity Heatmap & Whale Bubbles
 * Dynamically scales rendering complexity based on Zoom Level, Device Capability,
 * and Real-Time Frame Rate Performance.
 */

import { WhaleVolumeCluster } from './liquidityHeatmapEngine';
import { QuadTree, BoundingBox } from './spatialQuadTree';

export type DeviceTier = 'tier0_low' | 'tier1_mid' | 'tier2_high';

export type ZoomCategory = 'deep_out' | 'standard' | 'detailed' | 'ultra_in';

export interface HeatmapLODConfig {
  columnStride: number;          // Horizontal column stride (1 = every column, 2 = 1-in-2, 3 = 1-in-3)
  binAggregationFactor: number;  // Vertical bin merging factor (1 = full depth, 2 = 2-bin merge, etc.)
  quantizationLevels: number;    // Color quantization step count for fast batching
  minDensityThreshold: number;   // Minimum liquidity density floor
  maxColumnsCap: number;         // Hard cap on visible heatmap columns per frame
  enableGlintEffects: boolean;   // High-intensity core glint/glow effects
}

export interface WhaleBubbleLODConfig {
  minNotionalUsd: number;        // Dynamic minimum USD notional filter threshold
  maxRenderedBubbles: number;    // Hard cap on total rendered whale bubbles
  enableSpatialClustering: boolean; // Spatial proximity cluster merging on zoom-out
  clusteringRadiusPx: number;    // Proximity merge radius in screen pixels
  render3DGloss: boolean;        // 3D glossy pearl radial highlight
  renderSecondaryHalos: boolean; // Double target halo rings & radar pulses
  renderHorizontalRays: boolean; // Institutional execution level rays
  maxHorizontalRays: number;     // Maximum active level rays to draw
  renderBadgesAndLabels: boolean;// Institutional badges ($2.5M MEGA) and scale labels
}

export interface LODProfile {
  deviceTier: DeviceTier;
  zoomCategory: ZoomCategory;
  visibleCandleCount: number;
  candleWidth: number;
  avgFrameTimeMs: number;
  isEcoModeActive: boolean;
  heatmap: HeatmapLODConfig;
  whaleBubbles: WhaleBubbleLODConfig;
}

class LODManagerImpl {
  private frameTimes: number[] = [];
  private maxFrameHistory = 30;
  private currentDeviceTier: DeviceTier | null = null;
  private slowFrameCounter = 0;
  private fastFrameCounter = 0;

  constructor() {
    this.currentDeviceTier = this.detectHardwareTier();
  }

  /**
   * Detect initial hardware capability tier based on hardware specifications
   */
  public detectHardwareTier(): DeviceTier {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return 'tier1_mid';
    }

    const concurrency = navigator.hardwareConcurrency || 4;
    const memory = (navigator as any).deviceMemory || 4;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    const screenPixels = window.innerWidth * window.innerHeight * (window.devicePixelRatio || 1);

    if (isMobile || concurrency <= 2 || memory <= 2) {
      return 'tier0_low';
    }

    if (concurrency >= 8 && memory >= 8 && screenPixels < 9000000) {
      return 'tier2_high';
    }

    if (concurrency >= 4 && memory >= 4) {
      return 'tier1_mid';
    }

    return 'tier0_low';
  }

  /**
   * Record frame duration from canvas render loop to dynamically adapt LOD
   */
  public recordFrameTime(durationMs: number): void {
    this.frameTimes.push(durationMs);
    if (this.frameTimes.length > this.maxFrameHistory) {
      this.frameTimes.shift();
    }

    // Dynamic tier adjustment based on runtime frame budget
    if (durationMs > 16.6) {
      this.slowFrameCounter++;
      this.fastFrameCounter = 0;
      if (this.slowFrameCounter >= 4) {
        if (this.currentDeviceTier === 'tier2_high') this.currentDeviceTier = 'tier1_mid';
        else if (this.currentDeviceTier === 'tier1_mid') this.currentDeviceTier = 'tier0_low';
      }
    } else if (durationMs < 9.0) {
      this.fastFrameCounter++;
      this.slowFrameCounter = 0;
      if (this.fastFrameCounter >= 20) {
        if (this.currentDeviceTier === 'tier0_low') this.currentDeviceTier = 'tier1_mid';
        else if (this.currentDeviceTier === 'tier1_mid' && (navigator.hardwareConcurrency || 4) >= 8) {
          this.currentDeviceTier = 'tier2_high';
        }
      }
    }
  }

  /**
   * Get current average frame render time in milliseconds
   */
  public getAverageFrameTime(): number {
    if (this.frameTimes.length === 0) return 8.0;
    const sum = this.frameTimes.reduce((acc, val) => acc + val, 0);
    return sum / this.frameTimes.length;
  }

  /**
   * Evaluate zoom level category based on visible candle count and bar spacing
   */
  public evaluateZoomLevel(visibleCandleCount: number, candleWidth: number): ZoomCategory {
    if (visibleCandleCount >= 260 || candleWidth <= 2.2) {
      return 'deep_out';
    }
    if (visibleCandleCount >= 110 || candleWidth <= 5.5) {
      return 'standard';
    }
    if (visibleCandleCount >= 35 || candleWidth <= 14.0) {
      return 'detailed';
    }
    return 'ultra_in';
  }

  /**
   * Calculate complete Level of Detail (LOD) Profile
   */
  public getLODProfile(
    visibleCandleCount: number,
    candleWidth: number,
    manualEcoMode: boolean = false,
    userBaseMinNotionalUsd: number = 100000
  ): LODProfile {
    const tier = this.currentDeviceTier || 'tier1_mid';
    const zoom = this.evaluateZoomLevel(visibleCandleCount, candleWidth);
    const avgFrameTime = this.getAverageFrameTime();
    const isEcoMode = manualEcoMode || tier === 'tier0_low' || avgFrameTime > 14.0;

    // --- Heatmap LOD Parameters Matrix ---
    let columnStride = 1;
    let binAggregationFactor = 1;
    let quantizationLevels = 36;
    let minDensityThreshold = 0.02;
    let maxColumnsCap = 1200;
    let enableGlintEffects = true;

    if (zoom === 'deep_out') {
      columnStride = tier === 'tier0_low' ? 3 : tier === 'tier1_mid' ? 2 : 1;
      binAggregationFactor = tier === 'tier0_low' ? 3 : 2;
      quantizationLevels = isEcoMode ? 12 : 20;
      minDensityThreshold = tier === 'tier0_low' ? 0.12 : 0.06;
      maxColumnsCap = 600;
      enableGlintEffects = tier === 'tier2_high' && !isEcoMode;
    } else if (zoom === 'standard') {
      columnStride = tier === 'tier0_low' ? 2 : 1;
      binAggregationFactor = tier === 'tier0_low' ? 2 : 1;
      quantizationLevels = isEcoMode ? 18 : 28;
      minDensityThreshold = isEcoMode ? 0.05 : 0.03;
      maxColumnsCap = 900;
      enableGlintEffects = !isEcoMode;
    } else if (zoom === 'detailed') {
      columnStride = 1;
      binAggregationFactor = 1;
      quantizationLevels = isEcoMode ? 24 : 36;
      minDensityThreshold = 0.02;
      maxColumnsCap = 1200;
      enableGlintEffects = true;
    } else {
      // ultra_in
      columnStride = 1;
      binAggregationFactor = 1;
      quantizationLevels = 48;
      minDensityThreshold = 0.01;
      maxColumnsCap = 1500;
      enableGlintEffects = true;
    }

    // --- Whale Bubbles LOD Parameters Matrix ---
    let notionalMultiplier = 1.0;
    let maxRenderedBubbles = 50;
    let enableSpatialClustering = false;
    let clusteringRadiusPx = 18;
    let render3DGloss = true;
    let renderSecondaryHalos = true;
    let renderHorizontalRays = true;
    let maxHorizontalRays = 15;
    let renderBadgesAndLabels = true;

    if (zoom === 'deep_out') {
      notionalMultiplier = tier === 'tier0_low' ? 3.0 : tier === 'tier1_mid' ? 2.0 : 1.5;
      maxRenderedBubbles = tier === 'tier0_low' ? 12 : tier === 'tier1_mid' ? 22 : 35;
      enableSpatialClustering = true;
      clusteringRadiusPx = tier === 'tier0_low' ? 32 : 24;
      renderSecondaryHalos = tier === 'tier2_high' && !isEcoMode;
      maxHorizontalRays = tier === 'tier0_low' ? 4 : 8;
      renderBadgesAndLabels = candleWidth >= 3.0 && !isEcoMode;
    } else if (zoom === 'standard') {
      notionalMultiplier = tier === 'tier0_low' ? 1.8 : 1.2;
      maxRenderedBubbles = tier === 'tier0_low' ? 20 : tier === 'tier1_mid' ? 35 : 55;
      enableSpatialClustering = tier === 'tier0_low';
      clusteringRadiusPx = 18;
      renderSecondaryHalos = !isEcoMode;
      maxHorizontalRays = tier === 'tier0_low' ? 8 : 15;
      renderBadgesAndLabels = true;
    } else if (zoom === 'detailed') {
      notionalMultiplier = 1.0;
      maxRenderedBubbles = tier === 'tier0_low' ? 35 : 75;
      enableSpatialClustering = false;
      renderSecondaryHalos = true;
      maxHorizontalRays = 25;
      renderBadgesAndLabels = true;
    } else {
      // ultra_in
      notionalMultiplier = 0.8; // Show micro whale entries
      maxRenderedBubbles = 120;
      enableSpatialClustering = false;
      renderSecondaryHalos = true;
      maxHorizontalRays = 40;
      renderBadgesAndLabels = true;
    }

    const calculatedMinNotionalUsd = Math.max(25000, userBaseMinNotionalUsd * notionalMultiplier);

    return {
      deviceTier: tier,
      zoomCategory: zoom,
      visibleCandleCount,
      candleWidth,
      avgFrameTimeMs: avgFrameTime,
      isEcoModeActive: isEcoMode,
      heatmap: {
        columnStride,
        binAggregationFactor,
        quantizationLevels,
        minDensityThreshold,
        maxColumnsCap,
        enableGlintEffects,
      },
      whaleBubbles: {
        minNotionalUsd: calculatedMinNotionalUsd,
        maxRenderedBubbles,
        enableSpatialClustering,
        clusteringRadiusPx,
        render3DGloss,
        renderSecondaryHalos,
        renderHorizontalRays,
        maxHorizontalRays,
        renderBadgesAndLabels,
      },
    };
  }

  /**
   * Spatial & Importance-Based Whale Cluster Filtering / Clustering LOD Engine
   */
  public filterAndClusterWhalesLOD(
    clusters: WhaleVolumeCluster[],
    lodProfile: LODProfile,
    startIndex: number,
    endIndex: number,
    getX: (index: number) => number,
    getY: (price: number) => number,
    chartWidth: number,
    chartHeight: number
  ): WhaleVolumeCluster[] {
    if (!clusters || clusters.length === 0) return [];

    const { whaleBubbles } = lodProfile;
    const { minNotionalUsd, maxRenderedBubbles, enableSpatialClustering, clusteringRadiusPx } =
      whaleBubbles;

    // 1. Initial Range & USD Notional Filter
    const visibleInBounds = clusters.filter((c) => {
      if (c.barIndex < startIndex - 2 || c.barIndex > endIndex + 2) return false;
      const x = getX(c.barIndex);
      const y = getY(c.price);
      if (x < -50 || x > chartWidth + 50 || y < -50 || y > chartHeight + 50) return false;
      return c.notionalUsd >= minNotionalUsd;
    });

    if (visibleInBounds.length === 0) return [];

    // Sort by importance (notionalUsd descending, unmitigated absorption prioritized)
    visibleInBounds.sort((a, b) => {
      const scoreA = a.notionalUsd * (a.isAbsorption ? 1.5 : 1.0) * (a.isMitigated ? 0.6 : 1.0);
      const scoreB = b.notionalUsd * (b.isAbsorption ? 1.5 : 1.0) * (b.isMitigated ? 0.6 : 1.0);
      return scoreB - scoreA;
    });

    let processedClusters = visibleInBounds;

    // 2. O(log N) Spatial QuadTree Clustered Node Reduction (Merge overlapping nodes on zoom-out)
    if (enableSpatialClustering && processedClusters.length > 1) {
      const quadTreeBounds: BoundingBox = {
        x: -100,
        y: -100,
        width: chartWidth + 200,
        height: chartHeight + 200,
      };

      const qtree = new QuadTree<WhaleVolumeCluster>(quadTreeBounds, 12);
      for (const c of processedClusters) {
        qtree.insert({
          x: getX(c.barIndex),
          y: getY(c.price),
          data: c,
        });
      }

      const merged: WhaleVolumeCluster[] = [];
      const visited = new Set<string>();

      for (let i = 0; i < processedClusters.length; i++) {
        const c1 = processedClusters[i];
        if (visited.has(c1.id)) continue;
        visited.add(c1.id);

        const x1 = getX(c1.barIndex);
        const y1 = getY(c1.price);

        // O(log N) Spatial QuadTree Range Query around c1
        const rangeBox: BoundingBox = {
          x: x1 - clusteringRadiusPx,
          y: y1 - clusteringRadiusPx,
          width: clusteringRadiusPx * 2,
          height: clusteringRadiusPx * 2,
        };

        const candidates = qtree.query(rangeBox);
        const neighbors: WhaleVolumeCluster[] = [c1];

        for (const c2 of candidates) {
          if (c2.id === c1.id || visited.has(c2.id)) continue;
          const x2 = getX(c2.barIndex);
          const y2 = getY(c2.price);
          const dist = Math.hypot(x2 - x1, y2 - y1);

          if (dist <= clusteringRadiusPx) {
            visited.add(c2.id);
            neighbors.push(c2);
          }
        }

        if (neighbors.length === 1) {
          merged.push(c1);
        } else {
          // Merge neighbors into single composite super-cluster node
          let totalVol = 0;
          let totalBuy = 0;
          let totalSell = 0;
          let totalNotional = 0;
          let weightedPriceSum = 0;

          neighbors.forEach((n) => {
            totalVol += n.totalVolume;
            totalBuy += n.buyVolume;
            totalSell += n.sellVolume;
            totalNotional += n.notionalUsd;
            weightedPriceSum += n.price * n.totalVolume;
          });

          const vwapPrice = totalVol > 0 ? weightedPriceSum / totalVol : c1.price;
          const buyRatio = totalVol > 0 ? totalBuy / totalVol : c1.buyRatio;

          merged.push({
            ...c1,
            id: `lod_super_${c1.id}`,
            price: vwapPrice,
            totalVolume: totalVol,
            buyVolume: totalBuy,
            sellVolume: totalSell,
            buyRatio,
            delta: totalBuy - totalSell,
            notionalUsd: totalNotional,
            baseRadius: Math.min(24, c1.baseRadius * (1 + Math.log10(neighbors.length) * 0.45)),
            labelText: `🐋 MACRO $${(totalNotional / 1000000).toFixed(1)}M (${neighbors.length}x)`,
          });
        }
      }
      processedClusters = merged;
    }

    // 3. Final Hard Cap Reduction
    if (processedClusters.length > maxRenderedBubbles) {
      processedClusters = processedClusters.slice(0, maxRenderedBubbles);
    }

    return processedClusters;
  }
}

export const LODManager = new LODManagerImpl();
