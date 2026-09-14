/**
 * MountAlgo Terminal - High Performance 60FPS RAF Real-Time Tick Batcher
 * 
 * Batches high-frequency market ticks (from MEXC/Binance/Forex WebSockets)
 * into smooth 60fps frame flushes to prevent React render-cycle thrashing.
 */

type TickBatchListener = (prices: Record<string, number>) => void;

class RealTimeTickBatcher {
  private latestPrices: Map<string, number> = new Map();
  private pendingUpdates: Map<string, number> = new Map();
  private listeners: Set<TickBatchListener> = new Set();
  private rafId: number | null = null;
  private isThrottled: boolean = false;

  /**
   * Feed a live tick into the batch queue.
   */
  public feedTick(symbol: string, price: number): void {
    if (typeof price !== 'number' || isNaN(price) || price <= 0) return;

    const prev = this.latestPrices.get(symbol);
    if (prev === price) return;

    this.latestPrices.set(symbol, price);
    this.pendingUpdates.set(symbol, price);

    this.scheduleFlush();
  }

  /**
   * Feed multiple ticks at once (e.g. from ticker array).
   */
  public feedMultipleTicks(ticks: Record<string, number>): void {
    let hasChange = false;
    for (const [sym, price] of Object.entries(ticks)) {
      if (typeof price === 'number' && !isNaN(price) && price > 0) {
        const prev = this.latestPrices.get(sym);
        if (prev !== price) {
          this.latestPrices.set(sym, price);
          this.pendingUpdates.set(sym, price);
          hasChange = true;
        }
      }
    }
    if (hasChange) {
      this.scheduleFlush();
    }
  }

  /**
   * Instant non-blocking synchronous getter for live price.
   */
  public getLivePrice(symbol: string): number | undefined {
    return this.latestPrices.get(symbol) || this.latestPrices.get(symbol.toUpperCase());
  }

  /**
   * Schedule a batch flush using requestAnimationFrame for optimal 60 FPS performance.
   */
  private scheduleFlush(): void {
    if (this.rafId !== null) return;

    const flush = () => {
      this.rafId = null;
      if (this.pendingUpdates.size === 0) return;

      const batch: Record<string, number> = {};
      this.pendingUpdates.forEach((val, key) => {
        batch[key] = val;
      });
      this.pendingUpdates.clear();

      this.listeners.forEach((listener) => {
        try {
          listener(batch);
        } catch (err) {
          console.error('Tick batch listener error:', err);
        }
      });
    };

    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      this.rafId = window.requestAnimationFrame(flush);
    } else {
      this.rafId = setTimeout(flush, 16) as unknown as number;
    }
  }

  /**
   * Subscribe to batched price updates.
   */
  public subscribe(listener: TickBatchListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get all latest cached prices.
   */
  public getAllPrices(): Record<string, number> {
    const res: Record<string, number> = {};
    this.latestPrices.forEach((val, key) => {
      res[key] = val;
    });
    return res;
  }
}

export const tickBatcher = new RealTimeTickBatcher();
