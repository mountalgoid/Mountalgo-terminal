// High-Performance Web Worker Dispatcher for Macro Calendar & News Engine
// Offloads heavy parsing, sorting, impact scoring, and countdown calculation
// to background thread when item count is large (>100 items), preventing main thread UI frame drops.

export interface RawCalendarEvent {
  id: string;
  event: string;
  country: string;
  currency: string;
  flag: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: number;
  timeFormatted: string;
  dateFormatted?: string;
  countdownMs?: number;
  countdownStr?: string;
  isPast?: boolean;
  isJustReleased?: boolean;
  unit?: string;
  forecast?: string;
  previous?: string;
  actual?: string | null;
  deviation?: string | null;
  deviationStatus?: 'BEAT' | 'MISS' | 'IN_LINE' | null;
  marketReaction?: string | null;
  volatilityRisk?: 'EXTREME' | 'HIGH' | 'MODERATE' | 'LOW';
  description?: string;
}

export interface ProcessedCalendarData {
  events: RawCalendarEvent[];
  imminentHighImpact: RawCalendarEvent | null;
  nextHighImpact?: RawCalendarEvent | null;
  eventsByCurrency: Record<string, RawCalendarEvent[]>;
  totalHighImpactCount: number;
  activeCountdowns: Record<string, { mins: number; secs: number; isPast: boolean; formatted: string }>;
  computationTimeMs: number;
}

// Web Worker code as self-contained string for safe iframe execution
const WORKER_CODE = `
self.onmessage = function(e) {
  const start = performance.now();
  const { events, nowTimestamp, filterCurrency, filterImpact } = e.data;
  
  if (!Array.isArray(events)) {
    self.postMessage({ error: 'Invalid data format' });
    return;
  }

  let processed = events.slice();

  // 1. Filtering
  if (filterImpact && filterImpact !== 'ALL') {
    processed = processed.filter(item => {
      if (filterImpact === 'HIGH') return item.impact === 'HIGH';
      if (filterImpact === 'MEDIUM') return item.impact === 'HIGH' || item.impact === 'MEDIUM';
      return true;
    });
  }

  if (filterCurrency && filterCurrency !== 'ALL') {
    processed = processed.filter(item => item.currency === filterCurrency);
  }

  // 2. High-speed timestamp sorting
  processed.sort((a, b) => a.timestamp - b.timestamp);

  // 3. Countdowns & Status Mapping
  const activeCountdowns = {};
  const eventsByCurrency = {};
  let imminentHighImpact = null;
  let totalHighImpact = 0;

  for (let i = 0; i < processed.length; i++) {
    const item = processed[i];
    const diff = item.timestamp - nowTimestamp;
    const isPast = diff <= 0;
    const absDiff = Math.abs(diff);

    const mins = Math.floor(absDiff / 60000);
    const secs = Math.floor((absDiff % 60000) / 1000);
    const hours = Math.floor(absDiff / 3600000);

    const formatted = isPast
      ? 'Rilis (' + mins + 'm lalu)'
      : hours > 0
      ? hours + 'j : ' + (mins % 60) + 'm'
      : mins + 'm : ' + (secs < 10 ? '0' + secs : secs) + 's';

    activeCountdowns[item.id] = { mins, secs, isPast, formatted };

    if (item.impact === 'HIGH') {
      totalHighImpact++;
      if (!imminentHighImpact && diff >= -(10 * 60 * 1000) && diff <= (60 * 60 * 1000)) {
        imminentHighImpact = item;
      }
    }

    if (!eventsByCurrency[item.currency]) {
      eventsByCurrency[item.currency] = [];
    }
    eventsByCurrency[item.currency].push(item);
  }

  const computationTimeMs = performance.now() - start;

  self.postMessage({
    events: processed,
    imminentHighImpact,
    nextHighImpact: imminentHighImpact,
    eventsByCurrency,
    totalHighImpactCount: totalHighImpact,
    activeCountdowns,
    computationTimeMs
  });
};
`;

class CalendarWorkerManager {
  private worker: Worker | null = null;
  private isSupported: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
      try {
        const blob = new Blob([WORKER_CODE], { type: 'application/javascript' });
        this.worker = new Worker(URL.createObjectURL(blob));
        this.isSupported = true;
      } catch (err) {
        console.warn('Web Worker initialization fallback to main thread:', err);
        this.worker = null;
        this.isSupported = false;
      }
    }
  }

  public async processEventsAsync(
    events: RawCalendarEvent[],
    nowTimestamp: number,
    filterCurrency: string = 'ALL',
    filterImpact: string = 'ALL'
  ): Promise<ProcessedCalendarData> {
    // If list is small (< 100) or worker not available, compute synchronously on main thread
    if (!this.isSupported || !this.worker || events.length < 100) {
      return this.processEventsSync(events, nowTimestamp, filterCurrency, filterImpact);
    }

    return new Promise((resolve) => {
      const worker = this.worker!;
      
      const handler = (e: MessageEvent) => {
        worker.removeEventListener('message', handler);
        resolve(e.data as ProcessedCalendarData);
      };

      worker.addEventListener('message', handler);

      worker.postMessage({
        events,
        nowTimestamp,
        filterCurrency,
        filterImpact
      });
    });
  }

  // Fallback sync processing
  private processEventsSync(
    events: RawCalendarEvent[],
    nowTimestamp: number,
    filterCurrency: string = 'ALL',
    filterImpact: string = 'ALL'
  ): ProcessedCalendarData {
    const start = performance.now();
    let processed = events.slice();

    if (filterImpact && filterImpact !== 'ALL') {
      processed = processed.filter(item => {
        if (filterImpact === 'HIGH') return item.impact === 'HIGH';
        if (filterImpact === 'MEDIUM') return item.impact === 'HIGH' || item.impact === 'MEDIUM';
        return true;
      });
    }

    if (filterCurrency && filterCurrency !== 'ALL') {
      processed = processed.filter(item => item.currency === filterCurrency);
    }

    processed.sort((a, b) => a.timestamp - b.timestamp);

    const activeCountdowns: Record<string, { mins: number; secs: number; isPast: boolean; formatted: string }> = {};
    const eventsByCurrency: Record<string, RawCalendarEvent[]> = {};
    let imminentHighImpact: RawCalendarEvent | null = null;
    let totalHighImpact = 0;

    for (let i = 0; i < processed.length; i++) {
      const item = processed[i];
      const diff = item.timestamp - nowTimestamp;
      const isPast = diff <= 0;
      const absDiff = Math.abs(diff);

      const mins = Math.floor(absDiff / 60000);
      const secs = Math.floor((absDiff % 60000) / 1000);
      const hours = Math.floor(absDiff / 3600000);

      const formatted = isPast
        ? `Rilis (${mins}m lalu)`
        : hours > 0
        ? `${hours}j : ${mins % 60}m`
        : `${mins}m : ${secs < 10 ? '0' + secs : secs}s`;

      activeCountdowns[item.id] = { mins, secs, isPast, formatted };

      if (item.impact === 'HIGH') {
        totalHighImpact++;
        if (!imminentHighImpact && diff >= -(10 * 60 * 1000) && diff <= (60 * 60 * 1000)) {
          imminentHighImpact = item;
        }
      }

      if (!eventsByCurrency[item.currency]) {
        eventsByCurrency[item.currency] = [];
      }
      eventsByCurrency[item.currency].push(item);
    }

    return {
      events: processed,
      imminentHighImpact,
      nextHighImpact: imminentHighImpact,
      eventsByCurrency,
      totalHighImpactCount: totalHighImpact,
      activeCountdowns,
      computationTimeMs: performance.now() - start
    };
  }

  public terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

export const calendarWorkerDispatcher = new CalendarWorkerManager();
