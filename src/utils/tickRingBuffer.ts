/**
 * High-Performance Sub-Second WebSocket Ring Buffer (Zero-Copy Architecture)
 * 
 * Utilizes pre-allocated Float64Array for memory-contiguous, zero-GC allocation
 * during extreme High-Frequency Trading bursts (e.g., flash crashes).
 * Prevents V8 Garbage Collection pauses which normally cause micro-stuttering.
 */

export interface RawTickTrade {
  price: number;
  qty: number;
  time: number;
  isBuyerMaker: boolean; // true = seller is maker (aggressive buy), false = buyer maker (aggressive sell)
  tradeId?: number | string;
}

export class TickRingBuffer {
  private capacity: number;
  // Layout per tick: [price, qty, time, isBuyerMaker]
  private buffer: Float64Array;
  private head: number = 0;
  private tail: number = 0;
  private count: number = 0;
  private totalReceived: number = 0;
  private lastTpsTimestamp: number = Date.now();
  private tradesInCurrentWindow: number = 0;
  private currentTps: number = 0;
  private reusableDrainBuffer: Float64Array;

  constructor(capacity: number = 16384) {
    this.capacity = capacity;
    this.buffer = new Float64Array(capacity * 4);
    this.reusableDrainBuffer = new Float64Array(capacity * 4);
  }

  /**
   * O(1) Push trade into the Float64Array ring buffer without object allocations (Zero GC)
   */
  public push(price: number, qty: number, time: number, isBuyerMaker: boolean): boolean {
    const offset = this.head * 4;
    this.buffer[offset] = price;
    this.buffer[offset + 1] = qty;
    this.buffer[offset + 2] = time;
    this.buffer[offset + 3] = isBuyerMaker ? 1.0 : 0.0;

    this.head = (this.head + 1) % this.capacity;

    if (this.count < this.capacity) {
      this.count++;
    } else {
      // Overwrite oldest entry if capacity exceeded
      this.tail = (this.tail + 1) % this.capacity;
    }

    this.totalReceived++;
    this.tradesInCurrentWindow++;

    // Compute rolling TPS
    const now = Date.now();
    if (now - this.lastTpsTimestamp >= 1000) {
      this.currentTps = Math.round((this.tradesInCurrentWindow * 1000) / (now - this.lastTpsTimestamp));
      this.tradesInCurrentWindow = 0;
      this.lastTpsTimestamp = now;
    }

    return true;
  }

  /**
   * Zero-Allocation Drain into reusable Float64Array view to prevent Garbage Collection micro-stutter
   */
  public drainAllReuse(): { data: Float64Array; length: number } {
    const totalItems = this.count * 4;
    if (this.count === 0) return { data: this.reusableDrainBuffer, length: 0 };

    let outIdx = 0;
    while (this.count > 0) {
      const inIdx = this.tail * 4;
      this.reusableDrainBuffer[outIdx++] = this.buffer[inIdx];
      this.reusableDrainBuffer[outIdx++] = this.buffer[inIdx + 1];
      this.reusableDrainBuffer[outIdx++] = this.buffer[inIdx + 2];
      this.reusableDrainBuffer[outIdx++] = this.buffer[inIdx + 3];

      this.tail = (this.tail + 1) % this.capacity;
      this.count--;
    }

    this.head = 0;
    this.tail = 0;
    return { data: this.reusableDrainBuffer, length: totalItems };
  }

  /**
   * Legacy Drain method for backwards compatibility
   */
  public drainAll(): Float64Array {
    const { data, length } = this.drainAllReuse();
    if (length === 0) return new Float64Array(0);
    return data.slice(0, length);
  }

  /**
   * Peek at pending count
   */
  public size(): number {
    return this.count;
  }

  public isEmpty(): boolean {
    return this.count === 0;
  }

  public getTps(): number {
    return this.currentTps;
  }

  public getTotalTradesCount(): number {
    return this.totalReceived;
  }

  public clear(): void {
    this.head = 0;
    this.tail = 0;
    this.count = 0;
  }
}
