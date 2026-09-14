export interface ServerTrailingStopOrder {
  id: string;
  broker: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  entryPrice: number;
  highWaterMark: number;
  callbackRate: number;
  trailAmount?: number;
  activationPrice?: number;
  status: 'ACTIVE' | 'TRIGGERED' | 'CANCELLED';
  createdAt: number;
  triggerPrice?: number;
  lastPrice?: number;
}

export interface ServerOCOOrder {
  id: string;
  broker: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  entryPrice: number;
  takeProfitPrice: number;
  stopLossPrice: number;
  status: 'ACTIVE' | 'TP_FILLED' | 'SL_FILLED' | 'CANCELLED';
  createdAt: number;
  lastPrice?: number;
}

type MessageCallback = (data: any) => void;

class BrokerWebSocketManager {
  private ws: WebSocket | null = null;
  private listeners: Set<MessageCallback> = new Set();
  private reconnectTimer: any = null;
  private pollTimer: any = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;

  constructor() {
    this.connect();
    // Background polling fallback in case WebSocket is blocked in certain sandbox environments
    this.startHttpPollingFallback();
  }

  public connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
      const protocol = isHttps ? 'wss:' : 'ws:';
      const host = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';
      const wsUrl = `${protocol}//${host}/ws/broker`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.notifyListeners({ type: 'WS_STATUS', status: 'CONNECTED' });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.notifyListeners(data);
        } catch (e) {
          // Gracefully ignore parse issues
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        // Keep connected if fallback HTTP works, else DISCONNECTED
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        try {
          this.ws?.close();
        } catch {}
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    const backoffMs = Math.min(1500 * Math.pow(1.25, Math.min(this.reconnectAttempts, 8)), 10000);
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, backoffMs);
  }

  private startHttpPollingFallback() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = setInterval(async () => {
      if (!this.isConnected) {
        try {
          const data = await this.fetchServerOrders();
          if (data && data.success) {
            this.isConnected = true;
            this.notifyListeners({ type: 'WS_STATUS', status: 'CONNECTED' });
            this.notifyListeners({
              type: 'SERVER_ORDERS_INIT',
              trailingStops: data.trailingStops || [],
              ocoOrders: data.ocoOrders || [],
              timestamp: Date.now(),
            });
          }
        } catch {
          // Silent catch
        }
      }
    }, 4000);
  }

  public subscribe(callback: MessageCallback) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(data: any) {
    this.listeners.forEach((cb) => {
      try {
        cb(data);
      } catch (err) {
        console.error('[BrokerWS] Listener callback error:', err);
      }
    });
  }

  public getStatus() {
    return this.isConnected ? 'CONNECTED' : 'DISCONNECTED';
  }

  // API Call Helpers for Server Orders
  public async createTrailingStop(params: {
    broker: string;
    apiKey?: string;
    secret?: string;
    symbol: string;
    side: 'BUY' | 'SELL';
    quantity: number;
    entryPrice: number;
    callbackRate?: number;
    trailAmount?: number;
    activationPrice?: number;
    accountType?: string;
    isTestnet?: boolean;
  }): Promise<{ success: boolean; order?: ServerTrailingStopOrder; error?: string }> {
    try {
      const res = await fetch('/api/server-orders/trailing-stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  public async createOCO(params: {
    broker: string;
    apiKey?: string;
    secret?: string;
    symbol: string;
    side: 'BUY' | 'SELL';
    quantity: number;
    entryPrice: number;
    takeProfitPrice: number;
    stopLossPrice: number;
    accountType?: string;
    isTestnet?: boolean;
  }): Promise<{ success: boolean; order?: ServerOCOOrder; error?: string }> {
    try {
      const res = await fetch('/api/server-orders/oco', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  public async cancelServerOrder(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/server-orders/${id}`, {
        method: 'DELETE',
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  public async fetchServerOrders(): Promise<{ success: boolean; trailingStops: ServerTrailingStopOrder[]; ocoOrders: ServerOCOOrder[] }> {
    try {
      const res = await fetch('/api/server-orders');
      return await res.json();
    } catch (err: any) {
      return { success: false, trailingStops: [], ocoOrders: [] };
    }
  }
}

export const brokerWS = new BrokerWebSocketManager();
