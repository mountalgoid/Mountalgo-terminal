export type OrderExecutionType = 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT' | 'OCO' | 'TRAILING_STOP' | 'TWAP' | 'VWAP' | 'ICEBERG';
export type TimeInForce = 'GTC' | 'IOC' | 'FOK' | 'DAY';

export interface MultiBracketTP {
  tp1?: number;
  tp1Ratio?: number; // e.g. 0.5 (50% size close)
  tp1Hit?: boolean;
  tp2?: number;
  tp2Ratio?: number; // e.g. 0.3 (30% size close)
  tp2Hit?: boolean;
  tp3?: number;
  tp3Ratio?: number; // e.g. 0.2 (20% size close)
  tp3Hit?: boolean;
}

export interface TradeExecutionFill {
  id: string;
  positionId?: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  action: 'ENTRY' | 'EXIT' | 'PARTIAL_CLOSE' | 'SCALE_IN';
  price: number;
  size: number;
  pnl?: number;
  timestamp: number;
  snapshotUrl?: string;
  executionLatencyMs?: number;
  closeReason?: 'TAKE_PROFIT' | 'STOP_LOSS' | 'MANUAL_CLOSE' | 'REVERSE' | 'FLATTEN' | 'PARTIAL' | 'ENTRY';
}

export interface Position {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  size: number;
  initialSize?: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  takeProfit?: number;
  stopLoss?: number;
  brackets?: MultiBracketTP;
  autoBE?: boolean;
  autoBeOffsetPips?: number; // pips buffer above entry (e.g. +1.0 pip to cover fee)
  trailingStep?: number;
  leverage?: number;
  marginMode?: 'Cross' | 'Isolated';
  timestamp?: number;
  accountId?: string;
  commissionPaid?: number;
  slippagePips?: number;
  executionLatencyMs?: number;
  entrySnapshotUrl?: string;
}

export interface AlgoExecutionSettings {
  duration: string;
  participationRate: string;
  visibleSize: string;
  randomizeSize: boolean;
  startTime: string;
}

export interface PendingOrder {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  orderType: OrderExecutionType;
  size: number;
  price: number; // For LIMIT/STOP/STOP_LIMIT/OCO trigger or price
  stopLimitPrice?: number; // Secondary limit price for STOP_LIMIT order
  currentPrice?: number;
  takeProfit?: number;
  stopLoss?: number;
  brackets?: MultiBracketTP;
  leverage?: number;
  marginMode?: 'Cross' | 'Isolated';
  autoBE?: boolean;
  autoBeOffsetPips?: number;
  trailingStep?: number;
  timeInForce?: TimeInForce;
  postOnly?: boolean;
  reduceOnly?: boolean;
  ocoLinkedOrderId?: string; // Linked ID for OCO order pair
  algoSettings?: AlgoExecutionSettings;
  timestamp: number;
  status: 'PENDING' | 'FILLED' | 'CANCELLED' | 'EXPIRED';
  accountId?: string;
}

export interface MarketPrice {
  symbol: string;
  price: number;
}

export interface LoginCredentials {
  discord: string;
  tradingview: string;
  broker: string;
  apiKey: string;
}

export type BrokerType = 'BINANCE' | 'MEXC' | 'BYBIT' | 'MT5' | 'MT4' | 'DEMO';
export type BrokerAccountType = 'SPOT' | 'FUTURES' | 'FOREX_STP' | 'FOREX_ECN';

export interface CopyTradeConfig {
  isEnabled: boolean;
  isMasterAccount: boolean;
  copyFromAccountId?: string;
  copyRatio: number; // Multiplier: 1.0 = 100% size, 0.5 = 50%, 2.0 = 200%
  fixedLotSize?: number;
  maxLotLimit?: number;
  mirrorReverse?: boolean; // Flip BUY <-> SELL
}

export interface AccountRiskGuard {
  maxDailyLoss: number; // Amount in USD/USDT (e.g. $500)
  maxDrawdownPct: number; // Max total drawdown % (e.g. 5%)
  maxPositionSize: number; // Max lot/contract size limit
  maxOpenPositions: number; // Max concurrent trades
  isTradingLocked: boolean;
  lockUntilTimestamp?: number;
  dailyStartingBalance?: number;
  currentDailyLoss?: number;
}

export interface AccountAnalytics {
  winRate: number; // %
  profitFactor: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgWin: number;
  avgLoss: number;
  maxDrawdown: number;
  netPnL: number;
  totalVolume: number;
  sharpeRatio: number;
}

export interface WebhookConfig {
  isEnabled: boolean;
  secretToken: string;
  webhookUrl: string;
  allowMarketOrders: boolean;
  allowPendingOrders: boolean;
}

export interface BrokerAccount {
  id: string;
  name: string; // e.g. "Binance USD-M Futures Real", "IC Markets Live MT5"
  broker: BrokerType;
  accountType: BrokerAccountType;
  isReal: boolean; // true = Real Account, false = Demo / Paper
  status: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR';
  balance: number;
  equity: number;
  currency: string; // "USDT", "USD", "EUR", "IDR"
  leverage: number;
  apiKey?: string;
  apiSecret?: string;
  passphrase?: string;
  isTestnet?: boolean;
  server?: string; // e.g. "ICMarketsSC-Live02", "Exness-Real15"
  loginId?: string; // e.g. "8839201"
  password?: string;
  pingMs?: number;
  createdAt: number;
  lastSyncedAt?: number;
  lastSyncError?: string;
  autoSyncIntervalSec?: number;
  notes?: string;
  copyTrade?: CopyTradeConfig;
  riskGuard?: AccountRiskGuard;
  analytics?: AccountAnalytics;
  webhook?: WebhookConfig;
}

export interface VolumeFlowMetric {
  buyVolumeRatio: number; // 0.0 - 1.0 (e.g., 0.75 = 75% buy volume)
  volumeAcceleration5m: number; // Relative volume multiplier (e.g. 3.4 = 3.4x spike)
  isSqueezeActive: boolean; // Volatility compression breakout
  pressure: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
  estimatedSpreadPct: number;
}

export interface SniperPreset {
  symbol: string;
  defaultAllocUsd: number;
  maxSlippagePct: number;
  autoTakeProfitPct: number;
  autoStopLossPct: number;
  isAutoSniperEnabled: boolean;
}

export interface SlippageGuardState {
  spreadPct: number;
  maxAllowableSlippagePct: number;
  isHighSpreadWarning: boolean;
  maxOrderCapUsd: number;
  protectionActive: boolean;
  suggestedAction?: 'SAFE_TO_EXECUTE' | 'REDUCE_SIZE' | 'USE_LIMIT_ONLY';
}

export interface MexcNewListingItem {
  symbol: string;
  broker?: 'mexc' | 'binance' | 'bybit';
  base: string;
  quote: string;
  type: 'spot' | 'futures';
  displayName: string;
  active: boolean;
  precision: number;
  firstSeenAt: number;
  exactListedTimeIso?: string;
  listingAgeMinutes: number;
  listingAgeFormatted?: string;
  isNewListing: boolean;
  isNew1m: boolean;
  isNew5m: boolean;
  isNew1h: boolean;
  isNew24h: boolean;
  badge?: string;
  price?: number;
  change24h?: number;
  high24h?: number;
  low24h?: number;
  quoteVolume24h?: number;
  baseVolume24h?: number;
  openInterest?: number;
  fundingRate?: number;
  spreadPct?: number;
  volatilityScore?: number;
  liquidityRating?: 'ULTRA_HIGH' | 'HIGH' | 'MEDIUM' | 'VOLATILE' | 'LOW';
  maxLeverage?: number;
  volumeFlow?: VolumeFlowMetric;
  slippageGuard?: SlippageGuardState;
}

export interface MexcNewListingStats {
  totalNew: number;
  new1m: number;
  new5m: number;
  new1h: number;
  new24h?: number;
  lastDiscovery?: MexcNewListingItem | null;
}


