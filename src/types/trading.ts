
export enum OrderSide {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum OrderType {
  LIMIT = 'LIMIT',
  MARKET = 'MARKET',
  STOP_LOSS = 'STOP_LOSS',
  TAKE_PROFIT = 'TAKE_PROFIT',
  TRAILING_STOP = 'TRAILING_STOP',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  OPEN = 'OPEN',
  FILLED = 'FILLED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
}

export interface TradeOrder {
  id: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  price: number;
  amount: number;
  filled: number;
  remaining: number;
  status: OrderStatus;
  timestamp: number;
  stopPrice?: number;
  takeProfit?: number;
  trailingDistance?: number;
}

export interface RiskSettings {
  maxDailyDrawdown: number;
  maxLeverage: number;
  maxPositionSize: number;
  autoLiquidateEnabled: boolean;
  stopLossDefaultPips: number;
  takeProfitDefaultPips: number;
}

export interface MarketStats {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  bid: number;
  ask: number;
}

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IcebergOrder {
  price: number;
  side: OrderSide;
  visibleAmount: number;
  estimatedTotalAmount: number;
  confidence: number;
  detectedAt: number;
}

export interface TapeEntry {
  id: string;
  timestamp: number;
  price: number;
  amount: number;
  side: OrderSide;
  isAggressive: boolean;
  isLarge: boolean;
}
