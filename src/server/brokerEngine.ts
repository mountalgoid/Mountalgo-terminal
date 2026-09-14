import { WebSocket } from 'ws';
import ccxt from 'ccxt';

export interface ServerTrailingStopOrder {
  id: string;
  broker: string;
  apiKey?: string;
  secret?: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  entryPrice: number;
  highWaterMark: number;
  callbackRate: number; // e.g. 1.0 for 1%
  trailAmount?: number; // e.g. $5.00
  activationPrice?: number;
  accountType?: string;
  isTestnet?: boolean;
  status: 'ACTIVE' | 'TRIGGERED' | 'CANCELLED';
  createdAt: number;
  triggerPrice?: number;
  lastPrice?: number;
}

export interface ServerOCOOrder {
  id: string;
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
  status: 'ACTIVE' | 'TP_FILLED' | 'SL_FILLED' | 'CANCELLED';
  createdAt: number;
  lastPrice?: number;
}

// In-Memory High-Speed Engine
const trailingStops = new Map<string, ServerTrailingStopOrder>();
const ocoOrders = new Map<string, ServerOCOOrder>();
const wsClients = new Set<WebSocket>();

// Price ticker memory to evaluate triggers
const lastPrices = new Map<string, number>();

export function registerWSClient(client: WebSocket) {
  wsClients.add(client);
  
  // Send current active server orders on connect
  const initialData = {
    type: 'SERVER_ORDERS_INIT',
    trailingStops: Array.from(trailingStops.values()).filter(o => o.status === 'ACTIVE'),
    ocoOrders: Array.from(ocoOrders.values()).filter(o => o.status === 'ACTIVE'),
    timestamp: Date.now(),
  };
  client.send(JSON.stringify(initialData));

  client.on('close', () => {
    wsClients.delete(client);
  });
}

export function broadcastWS(data: any) {
  const payload = JSON.stringify(data);
  wsClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(payload);
      } catch (err) {
        console.error('Error sending WS broadcast:', err);
      }
    }
  });
}

export function getCcxtOptions(broker: string, accountType?: string) {
  const b = (broker || '').toLowerCase();
  const options: Record<string, any> = {
    adjustForTimeDifference: true,
    recvWindow: 60000,
  };

  if (accountType === 'SPOT') {
    options['defaultType'] = 'spot';
  } else {
    // FUTURES / SWAP / Default
    if (b === 'mexc') {
      options['defaultType'] = 'swap';
    } else if (b === 'bybit') {
      options['defaultType'] = 'swap';
    } else if (b === 'binance') {
      options['defaultType'] = 'future';
    } else {
      options['defaultType'] = 'swap';
    }
  }

  return options;
}

/**
 * Robust CCXT Exchange Client Factory
 * Configures timeouts, sandbox mode, default types, and pre-populates empty markets map
 * to prevent blocking synchronous loadMarkets() calls that can time out on Akamai/Cloudflare CDNs.
 */
export function initExchangeClient(
  broker: string,
  apiKey?: string,
  secret?: string,
  accountType?: string,
  isTestnet?: boolean,
  timeoutMs: number = 20000
) {
  const b = (broker || '').toLowerCase();
  const exchangeClass = ccxt[b as keyof typeof ccxt];
  if (!exchangeClass) {
    throw new Error(`Broker ${broker} is not supported by CCXT gateway`);
  }

  const config: any = {
    apiKey: apiKey || undefined,
    secret: secret || undefined,
    enableRateLimit: true,
    timeout: timeoutMs,
    options: getCcxtOptions(broker, accountType),
  };

  if (b === 'binance' && isTestnet) {
    config.urls = {
      api: {
        public: 'https://testnet.binancefuture.com/fapi/v1',
        private: 'https://testnet.binancefuture.com/fapi/v1',
      },
    };
  }

  // @ts-ignore
  const exchange = new exchangeClass(config);

  // Pre-initialize empty markets map to avoid slow network loadMarkets() on every private request
  exchange.markets = {};

  if (isTestnet && typeof exchange.setSandboxMode === 'function') {
    try {
      exchange.setSandboxMode(true);
    } catch {}
  }

  return exchange;
}

/**
 * Synchronize server and exchange clock drift with a short race-timeout guard
 */
export async function syncExchangeTime(exchange: any, maxWaitMs: number = 2500) {
  if (exchange && typeof exchange.loadTimeDifference === 'function') {
    try {
      await Promise.race([
        exchange.loadTimeDifference(),
        new Promise((_, r) => setTimeout(() => r(new Error('timeout')), maxWaitMs)),
      ]);
    } catch {
      // Ignore time sync timeout, proceed with request
    }
  }
}

/**
 * Robust balance fetching with automatic swap <-> spot fallback and clean error diagnosis
 */
export async function fetchExchangeBalance(exchange: any, defaultType?: string) {
  if (!exchange.markets) {
    exchange.markets = {};
  }

  try {
    return await exchange.fetchBalance();
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    const isTimeoutOrNetwork = /timeout|connect|econnreset|fetch failed|networkerror/i.test(errMsg);

    // Fallback: Swap <-> Spot
    const currentType = exchange.options?.defaultType || defaultType || 'swap';
    const fallbackType = currentType === 'spot' ? 'swap' : 'spot';
    exchange.options = exchange.options || {};
    exchange.options['defaultType'] = fallbackType;
    exchange.markets = {};

    try {
      return await exchange.fetchBalance({ type: fallbackType });
    } catch (retryErr: any) {
      const retryErrMsg = retryErr?.message || String(retryErr);

      const isAuthOrPerm = /api key|signature|10072|602|401|unauthorized|permission|whitelist|ip/i.test(
        errMsg + ' ' + retryErrMsg
      );
      if (isAuthOrPerm) {
        throw new Error(
          `Otorisasi ${exchange.id?.toUpperCase() || 'BROKER'} gagal: Pastikan API Key & Secret tepat, izin Futures/Spot aktif di pengaturan API bursa, dan IP server tidak dibatasi.`
        );
      }

      if (isTimeoutOrNetwork || /timeout|connect|fetch failed/i.test(retryErrMsg)) {
        throw new Error(
          `Koneksi ke gateway ${exchange.id?.toUpperCase() || 'BROKER'} mengalami batas waktu (timeout). Silakan periksa koneksi atau coba sesaat lagi.`
        );
      }

      throw new Error(
        `Gagal membaca saldo ${exchange.id?.toUpperCase() || 'BROKER'}: ${retryErrMsg || errMsg}`
      );
    }
  }
}

// Execute Real Market Order via CCXT Gateway
async function executeBrokerOrder(
  broker: string,
  apiKey: string | undefined,
  secret: string | undefined,
  symbol: string,
  side: 'BUY' | 'SELL',
  amount: number,
  accountType?: string,
  isTestnet?: boolean
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const exchange = initExchangeClient(broker, apiKey, secret, accountType, isTestnet, 25000);
    await syncExchangeTime(exchange, 2500);

    const ccxtSide = side.toLowerCase() as 'buy' | 'sell';
    const order = await exchange.createOrder(symbol, 'market', ccxtSide, amount);
    return { success: true, id: order.id };
  } catch (err: any) {
    console.error(`[BrokerEngine] Failed executing ${side} market order for ${symbol}:`, err.message);
    return { success: false, error: err.message };
  }
}

// Evaluate Tick for Trailing Stop & OCO Orders
export async function processTick(symbol: string, currentPrice: number) {
  if (!currentPrice || currentPrice <= 0) return;
  lastPrices.set(symbol, currentPrice);

  // Broadcast tick to subscribers
  broadcastWS({
    type: 'TICK',
    symbol,
    price: currentPrice,
    timestamp: Date.now(),
  });

  // 1. Process Trailing Stop Loss Orders
  for (const [id, ts] of trailingStops.entries()) {
    if (ts.status !== 'ACTIVE' || ts.symbol !== symbol) continue;

    let triggered = false;
    let triggerPrice = ts.triggerPrice;

    if (ts.side === 'BUY') { // LONG Position (Closing with SELL order)
      // Update High Water Mark
      if (currentPrice > ts.highWaterMark) {
        ts.highWaterMark = currentPrice;
      }

      // Check if Activation Price was reached
      if (ts.activationPrice && ts.highWaterMark < ts.activationPrice) {
        continue;
      }

      // Calculate trailing stop price
      if (ts.callbackRate) {
        triggerPrice = ts.highWaterMark * (1 - ts.callbackRate / 100);
      } else if (ts.trailAmount) {
        triggerPrice = ts.highWaterMark - ts.trailAmount;
      }

      ts.triggerPrice = triggerPrice;
      ts.lastPrice = currentPrice;

      if (triggerPrice && currentPrice <= triggerPrice) {
        triggered = true;
      }
    } else { // SHORT Position (Closing with BUY order)
      if (currentPrice < ts.highWaterMark || ts.highWaterMark === 0) {
        ts.highWaterMark = currentPrice;
      }

      if (ts.activationPrice && ts.highWaterMark > ts.activationPrice) {
        continue;
      }

      if (ts.callbackRate) {
        triggerPrice = ts.highWaterMark * (1 + ts.callbackRate / 100);
      } else if (ts.trailAmount) {
        triggerPrice = ts.highWaterMark + ts.trailAmount;
      }

      ts.triggerPrice = triggerPrice;
      ts.lastPrice = currentPrice;

      if (triggerPrice && currentPrice >= triggerPrice) {
        triggered = true;
      }
    }

    if (triggered) {
      ts.status = 'TRIGGERED';
      const closeSide = ts.side === 'BUY' ? 'SELL' : 'BUY';

      console.log(`[BrokerEngine] 🚀 Trailing Stop Triggered for ${ts.symbol} at $${currentPrice} (Trigger: $${triggerPrice?.toFixed(2)})`);

      // Execute market close on real broker
      const res = await executeBrokerOrder(
        ts.broker,
        ts.apiKey,
        ts.secret,
        ts.symbol,
        closeSide,
        ts.quantity,
        ts.accountType,
        ts.isTestnet
      );

      broadcastWS({
        type: 'TRAILING_STOP_TRIGGERED',
        order: ts,
        execution: res,
        closePrice: currentPrice,
        timestamp: Date.now(),
      });
    }
  }

  // 2. Process OCO Bracket Orders
  for (const [id, oco] of ocoOrders.entries()) {
    if (oco.status !== 'ACTIVE' || oco.symbol !== symbol) continue;

    oco.lastPrice = currentPrice;
    let filledType: 'TP_FILLED' | 'SL_FILLED' | null = null;
    let closeSide: 'BUY' | 'SELL' = oco.side === 'BUY' ? 'SELL' : 'BUY';

    if (oco.side === 'BUY') { // LONG Position
      if (currentPrice >= oco.takeProfitPrice) {
        filledType = 'TP_FILLED';
      } else if (currentPrice <= oco.stopLossPrice) {
        filledType = 'SL_FILLED';
      }
    } else { // SHORT Position
      if (currentPrice <= oco.takeProfitPrice) {
        filledType = 'TP_FILLED';
      } else if (currentPrice >= oco.stopLossPrice) {
        filledType = 'SL_FILLED';
      }
    }

    if (filledType) {
      oco.status = filledType;
      console.log(`[BrokerEngine] 🎯 OCO Bracket ${filledType} for ${oco.symbol} at $${currentPrice}`);

      const res = await executeBrokerOrder(
        oco.broker,
        oco.apiKey,
        oco.secret,
        oco.symbol,
        closeSide,
        oco.quantity,
        oco.accountType,
        oco.isTestnet
      );

      broadcastWS({
        type: 'OCO_ORDER_TRIGGERED',
        order: oco,
        filledType,
        execution: res,
        closePrice: currentPrice,
        timestamp: Date.now(),
      });
    }
  }
}

// Add Server Trailing Stop
export function createServerTrailingStop(params: {
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
}): ServerTrailingStopOrder {
  const id = `TS_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const highWaterMark = params.entryPrice;

  const order: ServerTrailingStopOrder = {
    id,
    broker: params.broker,
    apiKey: params.apiKey,
    secret: params.secret,
    symbol: params.symbol,
    side: params.side,
    quantity: params.quantity,
    entryPrice: params.entryPrice,
    highWaterMark,
    callbackRate: params.callbackRate || 1.0,
    trailAmount: params.trailAmount,
    activationPrice: params.activationPrice,
    accountType: params.accountType,
    isTestnet: params.isTestnet,
    status: 'ACTIVE',
    createdAt: Date.now(),
  };

  trailingStops.set(id, order);

  broadcastWS({
    type: 'SERVER_ORDER_CREATED',
    orderType: 'TRAILING_STOP',
    order,
    timestamp: Date.now(),
  });

  return order;
}

// Add Server OCO Bracket Order
export function createServerOCO(params: {
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
}): ServerOCOOrder {
  const id = `OCO_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const order: ServerOCOOrder = {
    id,
    broker: params.broker,
    apiKey: params.apiKey,
    secret: params.secret,
    symbol: params.symbol,
    side: params.side,
    quantity: params.quantity,
    entryPrice: params.entryPrice,
    takeProfitPrice: params.takeProfitPrice,
    stopLossPrice: params.stopLossPrice,
    accountType: params.accountType,
    isTestnet: params.isTestnet,
    status: 'ACTIVE',
    createdAt: Date.now(),
  };

  ocoOrders.set(id, order);

  broadcastWS({
    type: 'SERVER_ORDER_CREATED',
    orderType: 'OCO',
    order,
    timestamp: Date.now(),
  });

  return order;
}

// Cancel Active Server Order
export function cancelServerOrder(id: string): boolean {
  if (trailingStops.has(id)) {
    const ts = trailingStops.get(id)!;
    ts.status = 'CANCELLED';
    trailingStops.delete(id);
    broadcastWS({ type: 'SERVER_ORDER_CANCELLED', id, orderType: 'TRAILING_STOP', timestamp: Date.now() });
    return true;
  }

  if (ocoOrders.has(id)) {
    const oco = ocoOrders.get(id)!;
    oco.status = 'CANCELLED';
    ocoOrders.delete(id);
    broadcastWS({ type: 'SERVER_ORDER_CANCELLED', id, orderType: 'OCO', timestamp: Date.now() });
    return true;
  }

  return false;
}

export function getActiveServerOrders() {
  return {
    trailingStops: Array.from(trailingStops.values()).filter(o => o.status === 'ACTIVE'),
    ocoOrders: Array.from(ocoOrders.values()).filter(o => o.status === 'ACTIVE'),
  };
}
