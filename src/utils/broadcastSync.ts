export const SYNC_CHANNEL_NAME = 'mountalgo_multi_window_sync';

export interface SyncMessage {
  type: 'SYNC_SYMBOL' | 'SYNC_TIMEFRAME' | 'SYNC_CROSSHAIR' | 'SYNC_ORDER' | 'SYNC_HOTKEY_ACTION';
  payload: any;
  timestamp: number;
}

class BroadcastSyncService {
  private channel: BroadcastChannel | null = null;
  private listeners: Map<string, Set<(payload: any) => void>> = new Map();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
      this.channel.onmessage = (event: MessageEvent<SyncMessage>) => {
        const { type, payload } = event.data;
        if (this.listeners.has(type)) {
          this.listeners.get(type)!.forEach(fn => fn(payload));
        }
      };
    }
  }

  public subscribe(type: SyncMessage['type'], callback: (payload: any) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);
    return () => this.unsubscribe(type, callback);
  }

  public unsubscribe(type: SyncMessage['type'], callback: (payload: any) => void) {
    if (this.listeners.has(type)) {
      this.listeners.get(type)!.delete(callback);
    }
  }

  public broadcast(type: SyncMessage['type'], payload: any) {
    if (this.channel) {
      this.channel.postMessage({ type, payload, timestamp: Date.now() });
    }
  }
}

export const broadcastSync = new BroadcastSyncService();
