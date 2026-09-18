import { useState, useEffect, useMemo } from 'react';
import { Search, TrendingUp, X, DollarSign, Globe, Gem, Zap, RefreshCw, ArrowUpRight, ArrowDownRight, Flame, Layers } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useTrade } from '../context/TradeContext';
import { formatSmartPrice } from '../utils/numberFormatters';
import { 
  hexToRgba, 
  getThemeModalGradient, 
  getThemeCardGradient, 
  getThemeCardBorder 
} from '../utils/themeGradient';

export type AssetClass = 'Crypto' | 'Forex' | 'Commodity';

export interface MarketPair {
  symbol: string;
  base: string;
  quote: string;
  name: string;
  assetClass: AssetClass;
  category: string;
  defaultPrice?: number;
  firstSeenAt?: number;
  exactListedTimeIso?: string;
  listingAgeMinutes?: number;
  listingAgeFormatted?: string;
  isNewListing?: boolean;
  isNew1m?: boolean;
  isNew5m?: boolean;
  isNew1h?: boolean;
  isNew24h?: boolean;
  badge?: string;
  quoteVolume24h?: number;
  volatilityScore?: number;
  liquidityRating?: string;
  spreadPct?: number;
  maxLeverage?: number;
  precision?: number;
}

export const COMPREHENSIVE_MARKET_PAIRS: MarketPair[] = [
  // --- CRYPTO: MAJOR ---
  { symbol: 'BTCUSDT', base: 'BTC', quote: 'USDT', name: 'Bitcoin', assetClass: 'Crypto', category: 'Major' },
  { symbol: 'ETHUSDT', base: 'ETH', quote: 'USDT', name: 'Ethereum', assetClass: 'Crypto', category: 'Major' },
  { symbol: 'SOLUSDT', base: 'SOL', quote: 'USDT', name: 'Solana', assetClass: 'Crypto', category: 'Major' },
  { symbol: 'BNBUSDT', base: 'BNB', quote: 'USDT', name: 'BNB Chain', assetClass: 'Crypto', category: 'Major' },
  { symbol: 'XRPUSDT', base: 'XRP', quote: 'USDT', name: 'Ripple', assetClass: 'Crypto', category: 'Major' },
  { symbol: 'ADAUSDT', base: 'ADA', quote: 'USDT', name: 'Cardano', assetClass: 'Crypto', category: 'Major' },
  { symbol: 'DOGEUSDT', base: 'DOGE', quote: 'USDT', name: 'Dogecoin', assetClass: 'Crypto', category: 'Major' },
  { symbol: 'AVAXUSDT', base: 'AVAX', quote: 'USDT', name: 'Avalanche', assetClass: 'Crypto', category: 'Major' },
  { symbol: 'DOTUSDT', base: 'DOT', quote: 'USDT', name: 'Polkadot', assetClass: 'Crypto', category: 'Major' },
  { symbol: 'LTCUSDT', base: 'LTC', quote: 'USDT', name: 'Litecoin', assetClass: 'Crypto', category: 'Major' },
  { symbol: 'BCHUSDT', base: 'BCH', quote: 'USDT', name: 'Bitcoin Cash', assetClass: 'Crypto', category: 'Major' },

  // --- CRYPTO: LAYER 1 & LAYER 2 ---
  { symbol: 'SUIUSDT', base: 'SUI', quote: 'USDT', name: 'Sui Network', assetClass: 'Crypto', category: 'Layer 1/2' },
  { symbol: 'NEARUSDT', base: 'NEAR', quote: 'USDT', name: 'NEAR Protocol', assetClass: 'Crypto', category: 'Layer 1/2' },
  { symbol: 'APTUSDT', base: 'APT', quote: 'USDT', name: 'Aptos', assetClass: 'Crypto', category: 'Layer 1/2' },
  { symbol: 'ARBUSDT', base: 'ARB', quote: 'USDT', name: 'Arbitrum One', assetClass: 'Crypto', category: 'Layer 1/2' },
  { symbol: 'OPUSDT', base: 'OP', quote: 'USDT', name: 'Optimism', assetClass: 'Crypto', category: 'Layer 1/2' },
  { symbol: 'SEIUSDT', base: 'SEI', quote: 'USDT', name: 'Sei Network', assetClass: 'Crypto', category: 'Layer 1/2' },
  { symbol: 'TONUSDT', base: 'TON', quote: 'USDT', name: 'Toncoin Open Network', assetClass: 'Crypto', category: 'Layer 1/2' },
  { symbol: 'KASUSDT', base: 'KAS', quote: 'USDT', name: 'Kaspa GHOSTDAG', assetClass: 'Crypto', category: 'Layer 1/2' },
  { symbol: 'FTMUSDT', base: 'FTM', quote: 'USDT', name: 'Fantom / Sonic', assetClass: 'Crypto', category: 'Layer 1/2' },
  { symbol: 'INJUSDT', base: 'INJ', quote: 'USDT', name: 'Injective', assetClass: 'Crypto', category: 'Layer 1/2' },
  { symbol: 'TIAUSDT', base: 'TIA', quote: 'USDT', name: 'Celestia DA', assetClass: 'Crypto', category: 'Layer 1/2' },
  { symbol: 'ATOMUSDT', base: 'ATOM', quote: 'USDT', name: 'Cosmos Hub', assetClass: 'Crypto', category: 'Layer 1/2' },

  // --- CRYPTO: DEFI & RWA ---
  { symbol: 'LINKUSDT', base: 'LINK', quote: 'USDT', name: 'Chainlink Oracles', assetClass: 'Crypto', category: 'DeFi' },
  { symbol: 'UNIUSDT', base: 'UNI', quote: 'USDT', name: 'Uniswap Protocol', assetClass: 'Crypto', category: 'DeFi' },
  { symbol: 'AAVEUSDT', base: 'AAVE', quote: 'USDT', name: 'Aave Liquidity', assetClass: 'Crypto', category: 'DeFi' },
  { symbol: 'PENDLEUSDT', base: 'PENDLE', quote: 'USDT', name: 'Pendle Yield Tokenization', assetClass: 'Crypto', category: 'DeFi' },
  { symbol: 'ONDOUSDT', base: 'ONDO', quote: 'USDT', name: 'Ondo US Treasury RWA', assetClass: 'Crypto', category: 'DeFi' },
  { symbol: 'ENAUSDT', base: 'ENA', quote: 'USDT', name: 'Ethena USDe Synthetic', assetClass: 'Crypto', category: 'DeFi' },
  { symbol: 'RUNEUSDT', base: 'RUNE', quote: 'USDT', name: 'THORChain Cross-chain', assetClass: 'Crypto', category: 'DeFi' },
  { symbol: 'JUPUSDT', base: 'JUP', quote: 'USDT', name: 'Jupiter Aggregator', assetClass: 'Crypto', category: 'DeFi' },

  // --- CRYPTO: AI & DEPIN ---
  { symbol: 'RENDERUSDT', base: 'RENDER', quote: 'USDT', name: 'Render GPU Cloud', assetClass: 'Crypto', category: 'AI & DePIN' },
  { symbol: 'TAOUSDT', base: 'TAO', quote: 'USDT', name: 'Bittensor Decentralized AI', assetClass: 'Crypto', category: 'AI & DePIN' },
  { symbol: 'FETUSDT', base: 'FET', quote: 'USDT', name: 'Artificial Superintelligence Alliance', assetClass: 'Crypto', category: 'AI & DePIN' },
  { symbol: 'WLDUSDT', base: 'WLD', quote: 'USDT', name: 'Worldcoin Identity', assetClass: 'Crypto', category: 'AI & DePIN' },
  { symbol: 'FILUSDT', base: 'FIL', quote: 'USDT', name: 'Filecoin Storage', assetClass: 'Crypto', category: 'AI & DePIN' },

  // --- CRYPTO: MEME ---
  { symbol: 'PEPEUSDT', base: 'PEPE', quote: 'USDT', name: 'Pepe The Frog', assetClass: 'Crypto', category: 'Meme' },
  { symbol: 'SHIBUSDT', base: 'SHIB', quote: 'USDT', name: 'Shiba Inu', assetClass: 'Crypto', category: 'Meme' },
  { symbol: 'WIFUSDT', base: 'WIF', quote: 'USDT', name: 'dogwifhat', assetClass: 'Crypto', category: 'Meme' },
  { symbol: 'FLOKIUSDT', base: 'FLOKI', quote: 'USDT', name: 'Floki Ecosystem', assetClass: 'Crypto', category: 'Meme' },
  { symbol: 'BONKUSDT', base: 'BONK', quote: 'USDT', name: 'Bonk Solana Meme', assetClass: 'Crypto', category: 'Meme' },

  // --- CRYPTO: MEXC GEMS & HOT ALTCOINS ---
  { symbol: 'MXUSDT', base: 'MX', quote: 'USDT', name: 'MEXC Token Ecosystem', assetClass: 'Crypto', category: 'MEXC Gems' },
  { symbol: 'NOTUSDT', base: 'NOT', quote: 'USDT', name: 'Notcoin Telegram Web3', assetClass: 'Crypto', category: 'MEXC Gems' },
  { symbol: 'DOGSUSDT', base: 'DOGS', quote: 'USDT', name: 'Dogs Community Meme', assetClass: 'Crypto', category: 'MEXC Gems' },
  { symbol: 'NEIROUSDT', base: 'NEIRO', quote: 'USDT', name: 'First Neiro On Ethereum', assetClass: 'Crypto', category: 'MEXC Gems' },
  { symbol: 'TURBOUSDT', base: 'TURBO', quote: 'USDT', name: 'Turbo AI Revolution', assetClass: 'Crypto', category: 'MEXC Gems' },
  { symbol: 'MOODENGUSDT', base: 'MOODENG', quote: 'USDT', name: 'Moo Deng Hippo Meme', assetClass: 'Crypto', category: 'MEXC Gems' },
  { symbol: 'POPCATUSDT', base: 'POPCAT', quote: 'USDT', name: 'Popcat Solana Meme', assetClass: 'Crypto', category: 'MEXC Gems' },
  { symbol: 'GOATUSDT', base: 'GOAT', quote: 'USDT', name: 'Goatseus Maximus AI', assetClass: 'Crypto', category: 'MEXC Gems' },
  { symbol: 'ACTUSDT', base: 'ACT', quote: 'USDT', name: 'Act I : AI Prophecy', assetClass: 'Crypto', category: 'MEXC Gems' },
  { symbol: 'PNUTUSDT', base: 'PNUT', quote: 'USDT', name: 'Peanut the Squirrel', assetClass: 'Crypto', category: 'MEXC Gems' },
  { symbol: 'BRETTUSDT', base: 'BRETT', quote: 'USDT', name: 'Brett Base Chain', assetClass: 'Crypto', category: 'MEXC Gems' },
  { symbol: 'OMUSDT', base: 'OM', quote: 'USDT', name: 'MANTRA L1 RWA Chain', assetClass: 'Crypto', category: 'MEXC Gems' },
  { symbol: 'COREUSDT', base: 'CORE', quote: 'USDT', name: 'Core DAO BTC Hash', assetClass: 'Crypto', category: 'MEXC Gems' },
  { symbol: 'JASMYUSDT', base: 'JASMY', quote: 'USDT', name: 'JasmyCoin Data IoT', assetClass: 'Crypto', category: 'MEXC Gems' },
  { symbol: 'ORDIUSDT', base: 'ORDI', quote: 'USDT', name: 'Ordinals BRC-20', assetClass: 'Crypto', category: 'MEXC Gems' },
  { symbol: 'SATSUSDT', base: '1000SATS', quote: 'USDT', name: '1000SATS BRC-20', assetClass: 'Crypto', category: 'MEXC Gems' },

  // --- CRYPTO: COMMODITY TOKENIZED ---
  { symbol: 'XAUUSDT', base: 'XAU', quote: 'USDT', name: 'Gold Tokenized (1oz)', assetClass: 'Crypto', category: 'Commodity Token' },
  { symbol: 'XAGUSDT', base: 'XAG', quote: 'USDT', name: 'Silver Tokenized (1oz)', assetClass: 'Crypto', category: 'Commodity Token' },
  { symbol: 'BTCUSDC', base: 'BTC', quote: 'USDC', name: 'Bitcoin / USDC', assetClass: 'Crypto', category: 'Commodity Token' },
  { symbol: 'ETHUSDC', base: 'ETH', quote: 'USDC', name: 'Ethereum / USDC', assetClass: 'Crypto', category: 'Commodity Token' },

  // --- CRYPTO: NEW LAYER 1 ---
  { symbol: 'JUSDT', base: 'J', quote: 'USDT', name: 'Jupiter Perps', assetClass: 'Crypto', category: 'Layer 1/2' },
  { symbol: 'TRXUSDT', base: 'TRX', quote: 'USDT', name: 'Tron Network', assetClass: 'Crypto', category: 'Layer 1/2' },
  { symbol: 'MATICUSDT', base: 'MATIC', quote: 'USDT', name: 'Polygon PoS', assetClass: 'Crypto', category: 'Layer 1/2' },
  { symbol: 'ALGOUSDT', base: 'ALGO', quote: 'USDT', name: 'Algorand', assetClass: 'Crypto', category: 'Layer 1/2' },
  { symbol: 'HBARUSDT', base: 'HBAR', quote: 'USDT', name: 'Hedera Hashgraph', assetClass: 'Crypto', category: 'Layer 1/2' },

  // --- CRYPTO: GAMING & METAVERSE ---
  { symbol: 'IMXUSDT', base: 'IMX', quote: 'USDT', name: 'Immutable X Gaming', assetClass: 'Crypto', category: 'Gaming' },
  { symbol: 'GALAUSDT', base: 'GALA', quote: 'USDT', name: 'Gala Games', assetClass: 'Crypto', category: 'Gaming' },
  { symbol: 'SANDUSDT', base: 'SAND', quote: 'USDT', name: 'Sandbox Metaverse', assetClass: 'Crypto', category: 'Gaming' },
  { symbol: 'MANAUSDT', base: 'MANA', quote: 'USDT', name: 'Decentraland', assetClass: 'Crypto', category: 'Gaming' },
  { symbol: 'AXSUSDT', base: 'AXS', quote: 'USDT', name: 'Axie Infinity', assetClass: 'Crypto', category: 'Gaming' },

  // --- CRYPTO: PRIVACY & INFRASTRUCTURE ---
  { symbol: 'XMRUSDT', base: 'XMR', quote: 'USDT', name: 'Monero Privacy', assetClass: 'Crypto', category: 'Privacy' },
  { symbol: 'ZECUSDT', base: 'ZEC', quote: 'USDT', name: 'Zcash Privacy', assetClass: 'Crypto', category: 'Privacy' },
  { symbol: 'VETUSDT', base: 'VET', quote: 'USDT', name: 'VeChain Supply Chain', assetClass: 'Crypto', category: 'Infrastructure' },
  { symbol: 'ICPUSDT', base: 'ICP', quote: 'USDT', name: 'Internet Computer', assetClass: 'Crypto', category: 'Infrastructure' },

  // --- FOREX: MAJOR & CROSSES ---
  { symbol: 'EURUSDT', base: 'EUR', quote: 'USD', name: 'Euro / US Dollar', assetClass: 'Forex', category: 'Major Forex', defaultPrice: 1.0875 },
  { symbol: 'GBPUSDT', base: 'GBP', quote: 'USD', name: 'British Pound / US Dollar', assetClass: 'Forex', category: 'Major Forex', defaultPrice: 1.2980 },
  { symbol: 'USDJPY', base: 'USD', quote: 'JPY', name: 'US Dollar / Japanese Yen', assetClass: 'Forex', category: 'Major Forex', defaultPrice: 153.40 },
  { symbol: 'AUDUSD', base: 'AUD', quote: 'USD', name: 'Australian Dollar / US Dollar', assetClass: 'Forex', category: 'Major Forex', defaultPrice: 0.6580 },
  { symbol: 'USDCAD', base: 'USD', quote: 'CAD', name: 'US Dollar / Canadian Dollar', assetClass: 'Forex', category: 'Major Forex', defaultPrice: 1.3820 },
  { symbol: 'USDCHF', base: 'USD', quote: 'CHF', name: 'US Dollar / Swiss Franc', assetClass: 'Forex', category: 'Major Forex', defaultPrice: 0.8840 },
  { symbol: 'NZDUSD', base: 'NZD', quote: 'USD', name: 'New Zealand Dollar / US Dollar', assetClass: 'Forex', category: 'Major Forex', defaultPrice: 0.5960 },
  { symbol: 'EURGBP', base: 'EUR', quote: 'GBP', name: 'Euro / British Pound', assetClass: 'Forex', category: 'Cross Forex', defaultPrice: 0.8380 },
  { symbol: 'EURJPY', base: 'EUR', quote: 'JPY', name: 'Euro / Japanese Yen', assetClass: 'Forex', category: 'Cross Forex', defaultPrice: 166.80 },
  { symbol: 'GBPJPY', base: 'GBP', quote: 'JPY', name: 'British Pound / Japanese Yen', assetClass: 'Forex', category: 'Cross Forex', defaultPrice: 199.10 },
  { symbol: 'AUDJPY', base: 'AUD', quote: 'JPY', name: 'Australian Dollar / Japanese Yen', assetClass: 'Forex', category: 'Cross Forex', defaultPrice: 100.90 },
  { symbol: 'USDIDR', base: 'USD', quote: 'IDR', name: 'US Dollar / Indonesian Rupiah', assetClass: 'Forex', category: 'Exotic Forex', defaultPrice: 15850.0 },

  // --- COMMODITIES & PRECIOUS METALS ---
  { symbol: 'PAXGUSDT', base: 'XAU', quote: 'USD', name: 'Spot Gold (PAXG / 1oz Fine Gold)', assetClass: 'Commodity', category: 'Precious Metals', defaultPrice: 2685.50 },
  { symbol: 'XAGUSD', base: 'XAG', quote: 'USD', name: 'Spot Silver (1oz Fine Silver)', assetClass: 'Commodity', category: 'Precious Metals', defaultPrice: 31.45 },
  { symbol: 'USOIL', base: 'WTI', quote: 'USD', name: 'WTI Light Sweet Crude Oil', assetClass: 'Commodity', category: 'Energy', defaultPrice: 71.85 },
  { symbol: 'UKOIL', base: 'BRENT', quote: 'USD', name: 'Brent North Sea Crude Oil', assetClass: 'Commodity', category: 'Energy', defaultPrice: 75.40 },
  { symbol: 'NATGAS', base: 'NGAS', quote: 'USD', name: 'Henry Hub Natural Gas', assetClass: 'Commodity', category: 'Energy', defaultPrice: 2.82 },
  { symbol: 'PLATINUM', base: 'XPT', quote: 'USD', name: 'Platinum Spot Index', assetClass: 'Commodity', category: 'Precious Metals', defaultPrice: 965.0 },
  { symbol: 'PALLADIUM', base: 'XPD', quote: 'USD', name: 'Palladium Spot Index', assetClass: 'Commodity', category: 'Precious Metals', defaultPrice: 1025.0 },
  { symbol: 'COPPER', base: 'HG', quote: 'USD', name: 'High Grade Copper Spot', assetClass: 'Commodity', category: 'Industrial Metals', defaultPrice: 4.18 },
  // --- FOREX: OANDA EXOTICS & MINORS ---
  { symbol: 'USDSEK', base: 'USD', quote: 'SEK', name: 'US Dollar / Swedish Krona (OANDA)', assetClass: 'Forex', category: 'Exotic Forex', defaultPrice: 10.42 },
  { symbol: 'USDNOK', base: 'USD', quote: 'NOK', name: 'US Dollar / Norwegian Krone (OANDA)', assetClass: 'Forex', category: 'Exotic Forex', defaultPrice: 10.85 },
  { symbol: 'USDTRY', base: 'USD', quote: 'TRY', name: 'US Dollar / Turkish Lira (OANDA)', assetClass: 'Forex', category: 'Exotic Forex', defaultPrice: 34.25 },
  { symbol: 'USDMXN', base: 'USD', quote: 'MXN', name: 'US Dollar / Mexican Peso (OANDA)', assetClass: 'Forex', category: 'Exotic Forex', defaultPrice: 20.45 },
  { symbol: 'USDZAR', base: 'USD', quote: 'ZAR', name: 'US Dollar / South African Rand (OANDA)', assetClass: 'Forex', category: 'Exotic Forex', defaultPrice: 18.12 },
  { symbol: 'USDSGD', base: 'USD', quote: 'SGD', name: 'US Dollar / Singapore Dollar (OANDA)', assetClass: 'Forex', category: 'Exotic Forex', defaultPrice: 1.342 },
  { symbol: 'USDHKD', base: 'USD', quote: 'HKD', name: 'US Dollar / Hong Kong Dollar (OANDA)', assetClass: 'Forex', category: 'Exotic Forex', defaultPrice: 7.81 },
  { symbol: 'USDTHB', base: 'USD', quote: 'THB', name: 'US Dollar / Thai Baht (OANDA)', assetClass: 'Forex', category: 'Exotic Forex', defaultPrice: 34.85 },
  { symbol: 'EURAUD', base: 'EUR', quote: 'AUD', name: 'Euro / Australian Dollar (OANDA)', assetClass: 'Forex', category: 'Cross Forex', defaultPrice: 1.6520 },
  { symbol: 'EURCAD', base: 'EUR', quote: 'CAD', name: 'Euro / Canadian Dollar (OANDA)', assetClass: 'Forex', category: 'Cross Forex', defaultPrice: 1.5030 },
  { symbol: 'EURCHF', base: 'EUR', quote: 'CHF', name: 'Euro / Swiss Franc (OANDA)', assetClass: 'Forex', category: 'Cross Forex', defaultPrice: 0.9410 },
  { symbol: 'EURNZD', base: 'EUR', quote: 'NZD', name: 'Euro / New Zealand Dollar (OANDA)', assetClass: 'Forex', category: 'Cross Forex', defaultPrice: 1.8250 },
  { symbol: 'GBPAUD', base: 'GBP', quote: 'AUD', name: 'British Pound / Australian Dollar (OANDA)', assetClass: 'Forex', category: 'Cross Forex', defaultPrice: 2.0240 },
  { symbol: 'GBPCAD', base: 'GBP', quote: 'CAD', name: 'British Pound / Canadian Dollar (OANDA)', assetClass: 'Forex', category: 'Cross Forex', defaultPrice: 1.8620 },
  { symbol: 'GBPCHF', base: 'GBP', quote: 'CHF', name: 'British Pound / Swiss Franc (OANDA)', assetClass: 'Forex', category: 'Cross Forex', defaultPrice: 1.1250 },
  { symbol: 'GBPNZD', base: 'GBP', quote: 'NZD', name: 'British Pound / New Zealand Dollar (OANDA)', assetClass: 'Forex', category: 'Cross Forex', defaultPrice: 2.1780 },
  { symbol: 'AUDCAD', base: 'AUD', quote: 'CAD', name: 'Australian Dollar / Canadian Dollar (OANDA)', assetClass: 'Forex', category: 'Cross Forex', defaultPrice: 0.9120 },
  { symbol: 'AUDCHF', base: 'AUD', quote: 'CHF', name: 'Australian Dollar / Swiss Franc (OANDA)', assetClass: 'Forex', category: 'Cross Forex', defaultPrice: 0.5910 },
  { symbol: 'AUDNZD', base: 'AUD', quote: 'NZD', name: 'Australian Dollar / New Zealand Dollar (OANDA)', assetClass: 'Forex', category: 'Cross Forex', defaultPrice: 1.1040 },
  { symbol: 'CADJPY', base: 'CAD', quote: 'JPY', name: 'Canadian Dollar / Japanese Yen (OANDA)', assetClass: 'Forex', category: 'Cross Forex', defaultPrice: 111.20 },
  { symbol: 'CHFJPY', base: 'CHF', quote: 'JPY', name: 'Swiss Franc / Japanese Yen (OANDA)', assetClass: 'Forex', category: 'Cross Forex', defaultPrice: 163.10 },
  { symbol: 'NZDJPY', base: 'NZD', quote: 'JPY', name: 'New Zealand Dollar / Japanese Yen (OANDA)', assetClass: 'Forex', category: 'Cross Forex', defaultPrice: 89.60 },
  { symbol: 'NZDCAD', base: 'NZD', quote: 'CAD', name: 'New Zealand Dollar / Canadian Dollar (OANDA)', assetClass: 'Forex', category: 'Cross Forex', defaultPrice: 0.8260 },
  { symbol: 'USDPLN', base: 'USD', quote: 'PLN', name: 'US Dollar / Polish Zloty (OANDA)', assetClass: 'Forex', category: 'Exotic Forex', defaultPrice: 4.08 },
  { symbol: 'USDHUF', base: 'USD', quote: 'HUF', name: 'US Dollar / Hungarian Forint (OANDA)', assetClass: 'Forex', category: 'Exotic Forex', defaultPrice: 365.50 },

  // --- COMMODITIES: OANDA & EXTENDED ---
  { symbol: 'XAUUSD', base: 'XAU', quote: 'USD', name: 'Gold Spot (OANDA)', assetClass: 'Commodity', category: 'Precious Metals', defaultPrice: 2685.50 },
  { symbol: 'WHEAT', base: 'WHEAT', quote: 'USD', name: 'Wheat Futures (CBOT)', assetClass: 'Commodity', category: 'Agriculture', defaultPrice: 595.0 },
  { symbol: 'CORN', base: 'CORN', quote: 'USD', name: 'Corn Futures (CBOT)', assetClass: 'Commodity', category: 'Agriculture', defaultPrice: 452.0 },
  { symbol: 'SOYBEAN', base: 'SOY', quote: 'USD', name: 'Soybean Futures (CBOT)', assetClass: 'Commodity', category: 'Agriculture', defaultPrice: 1045.0 },
  { symbol: 'SUGAR', base: 'SUGAR', quote: 'USD', name: 'Sugar #11 Futures (ICE)', assetClass: 'Commodity', category: 'Agriculture', defaultPrice: 21.85 },
  { symbol: 'COFFEE', base: 'COFFEE', quote: 'USD', name: 'Arabica Coffee Futures (ICE)', assetClass: 'Commodity', category: 'Agriculture', defaultPrice: 185.40 },
  { symbol: 'COCOA', base: 'COCOA', quote: 'USD', name: 'Cocoa Futures (ICE)', assetClass: 'Commodity', category: 'Agriculture', defaultPrice: 4250.0 },
  { symbol: 'COTTON', base: 'COTTON', quote: 'USD', name: 'Cotton #2 Futures (ICE)', assetClass: 'Commodity', category: 'Agriculture', defaultPrice: 78.50 },
  { symbol: 'LUMBER', base: 'LUMBER', quote: 'USD', name: 'Lumber Futures (CME)', assetClass: 'Commodity', category: 'Industrial', defaultPrice: 545.0 },
  { symbol: 'URANIUM', base: 'URAN', quote: 'USD', name: 'Uranium Spot (UCIX)', assetClass: 'Commodity', category: 'Energy', defaultPrice: 82.50 },
  { symbol: 'LITHIUM', base: 'LITH', quote: 'USD', name: 'Lithium Carbonate Spot (Fastmarkets)', assetClass: 'Commodity', category: 'Industrial Metals', defaultPrice: 13250.0 },
  { symbol: 'IRONORE', base: 'FE', quote: 'USD', name: 'Iron Ore 62% Fe (SGX)', assetClass: 'Commodity', category: 'Industrial Metals', defaultPrice: 108.50 },

];

export const POPULAR_PAIRS = COMPREHENSIVE_MARKET_PAIRS;

interface SymbolSelectorModalProps {
  currentSymbol: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectSymbol: (symbol: string) => void;
}

// Ultra-fast memoized row component to eliminate lag during search and scroll
const MarketPairRow = ({
  pair,
  live,
  isSelected,
  palette,
  onSelect,
}: {
  pair: MarketPair;
  live?: { 
    price: number; 
    change24h: number; 
    high?: number; 
    low?: number; 
    volume?: number;
    quoteVolume?: number;
    spreadPct?: number;
    volatilityScore?: number;
    liquidityRating?: string;
    openInterest?: number;
    fundingRate?: number;
  };
  isSelected: boolean;
  palette: any;
  onSelect: (sym: string) => void;
}) => {
  const displayPrice = live
    ? live.price
    : pair.defaultPrice || (pair.assetClass === 'Forex' ? 1.0 : 100.0);

  // Super-accurate dynamic decimal precision based on price magnitude & asset class
  const priceFormatted = formatSmartPrice(displayPrice, pair.quote === 'USDT' || pair.quote === 'USD', pair.symbol);

  const quoteVol = live?.quoteVolume || pair.quoteVolume24h;
  const quoteVolFormatted = quoteVol && quoteVol > 0
    ? quoteVol >= 1_000_000_000
      ? `$${(quoteVol / 1_000_000_000).toFixed(2)}B`
      : quoteVol >= 1_000_000
      ? `$${(quoteVol / 1_000_000).toFixed(2)}M`
      : quoteVol >= 1_000
      ? `$${(quoteVol / 1_000).toFixed(0)}K`
      : `$${quoteVol.toFixed(0)}`
    : null;

  const volScore = live?.volatilityScore || pair.volatilityScore;
  const spreadPct = live?.spreadPct || pair.spreadPct;
  const isUp = (live?.change24h ?? 0) >= 0;
  const trendColor = isUp ? palette.bull : palette.bear;
  // Lightweight vector path: 0 trigonometric overhead
  const trendPath = isUp
    ? 'M 2,16 L 14,13 L 26,14 L 38,7 L 48,4'
    : 'M 2,4 L 14,7 L 26,6 L 38,13 L 48,16';

  return (
    <button
      id={`symbol-row-${pair.symbol.toLowerCase()}`}
      onClick={() => onSelect(pair.symbol)}
      style={isSelected ? { borderColor: palette.poc, backgroundColor: `${palette.poc}12`, boxShadow: `0 2px 10px ${palette.poc}20` } : {}}
      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors cursor-pointer ${
        isSelected
          ? 'border'
          : 'hover:bg-[var(--color-bg)] border border-transparent'
      }`}
    >
      <div className="flex items-center gap-2.5 w-7/12 min-w-0">
        <div
          style={
            pair.assetClass === 'Crypto'
              ? { backgroundColor: `${palette.poc}15`, borderColor: `${palette.poc}35`, color: palette.poc }
              : pair.assetClass === 'Forex'
              ? { backgroundColor: `${palette.bull}15`, borderColor: `${palette.bull}35`, color: palette.bull }
              : { backgroundColor: `${palette.bear}15`, borderColor: `${palette.bear}35`, color: palette.bear }
          }
          className="w-8 h-8 rounded-lg flex items-center justify-center font-mono font-extrabold text-[11px] shadow-sm flex-shrink-0 border"
        >
          {pair.base.slice(0, 3)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap truncate">
            <span className="font-bold text-[var(--color-text)] text-xs sm:text-sm font-mono tracking-tight truncate">
              {pair.base}
            </span>
            <span className="text-[10px] text-[var(--color-text-muted)] font-mono">/{pair.quote}</span>
            {pair.maxLeverage && (
              <span className="text-[8px] px-1 py-0.2 rounded font-mono font-bold border border-amber-500/40 bg-amber-500/10 text-amber-400">
                {pair.maxLeverage}x
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="text-[8px] px-1 py-0.2 rounded font-mono font-bold border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-muted)]">
              {pair.assetClass.toUpperCase()}
            </span>
            {pair.isNew1m ? (
              <span className="text-[8px] px-1.5 py-0.2 rounded font-mono font-black border border-emerald-400/80 bg-emerald-500/30 text-emerald-300 animate-pulse shadow-sm flex items-center gap-0.5">
                🚀 BARU &lt;1m
              </span>
            ) : pair.isNew5m ? (
              <span className="text-[8px] px-1.5 py-0.2 rounded font-mono font-bold border border-amber-400/70 bg-amber-500/25 text-amber-300 flex items-center gap-0.5">
                🔥 BARU &lt;5m
              </span>
            ) : pair.isNew1h ? (
              <span className="text-[8px] px-1.5 py-0.2 rounded font-mono font-bold border border-cyan-400/60 bg-cyan-500/20 text-cyan-300 flex items-center gap-0.5">
                ⚡ BARU &lt;1h
              </span>
            ) : pair.listingAgeFormatted ? (
              <span className="text-[8px] px-1.5 py-0.2 rounded font-mono font-bold border border-fuchsia-400/50 bg-fuchsia-500/20 text-fuchsia-300 flex items-center gap-0.5">
                ✨ {pair.listingAgeFormatted}
              </span>
            ) : pair.isNewListing ? (
              <span className="text-[8px] px-1.5 py-0.2 rounded font-mono font-bold border border-fuchsia-400/40 bg-fuchsia-500/20 text-fuchsia-300 flex items-center gap-0.5">
                ✨ NEW
              </span>
            ) : null}

            {quoteVolFormatted && (
              <span className="text-[8px] px-1 py-0.2 rounded font-mono font-semibold border border-purple-500/30 bg-purple-500/10 text-purple-300">
                {quoteVolFormatted} Vol
              </span>
            )}

            {spreadPct !== undefined && spreadPct > 0 && spreadPct <= 0.05 && (
              <span className="text-[8px] px-1 py-0.2 rounded font-mono font-semibold border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hidden xs:inline">
                Spread {spreadPct.toFixed(2)}%
              </span>
            )}

            {pair.quote === 'USDT' ? (
              <span className="text-[8px] px-1 py-0.2 rounded font-mono font-bold border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
                USDT-M
              </span>
            ) : pair.quote === 'USD' ? (
              <span className="text-[8px] px-1 py-0.2 rounded font-mono font-bold border border-amber-500/30 bg-amber-500/10 text-amber-400">
                COIN-M
              </span>
            ) : pair.category.includes('Spot') ? (
              <span className="text-[8px] px-1 py-0.2 rounded font-mono font-bold border border-blue-500/30 bg-blue-500/10 text-blue-400">
                SPOT
              </span>
            ) : null}
            <span className="text-[8px] bg-[var(--color-bg)] text-[var(--color-text-muted)] px-1 py-0.2 rounded border border-[var(--color-border)] truncate">
              {pair.category}
            </span>
          </div>
        </div>
      </div>

      {/* Screener Metrics */}
      <div className="flex items-center justify-end gap-2 w-5/12 flex-shrink-0">
        {/* Volatility Scanner / Breakout Indicator */}
        {((live && Math.abs(live.change24h) >= 5) || (volScore !== undefined && volScore >= 12)) && (
          <div 
            className={`hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8.5px] font-bold border ${
              (live && Math.abs(live.change24h) >= 12) || (volScore !== undefined && volScore >= 20)
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 animate-pulse' 
                : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
            }`}
          >
            <Zap size={9} />
            <span>{volScore ? `${volScore.toFixed(0)}% VOL` : 'VOLATIL'}</span>
          </div>
        )}

        {/* Fast Static Micro Sparkline */}
        <div className="hidden sm:flex items-center w-10 h-5 overflow-hidden flex-shrink-0">
          <svg width="40" height="20" viewBox="0 0 50 20" className="opacity-80">
            <path d={trendPath} fill="none" stroke={trendColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="text-right font-mono flex-shrink-0 min-w-[80px]">
          <div className="text-xs sm:text-sm font-bold text-[var(--color-text)] tracking-tight leading-none mb-0.5">
            {priceFormatted}
          </div>
          {live ? (
            <div
              className="text-[10px] sm:text-[11px] font-bold tracking-tight"
              style={{ color: live.change24h >= 0 ? palette.bull : palette.bear }}
            >
              {live.change24h >= 0 ? '▲ +' : '▼ '}{live.change24h.toFixed(2)}%
            </div>
          ) : (
            <div className="text-[9px] text-[var(--color-text-muted)] font-medium">Live Feed</div>
          )}
        </div>
      </div>
    </button>
  );
};

export default function SymbolSelectorModal({
  currentSymbol,
  isOpen,
  onClose,
  onSelectSymbol,
}: SymbolSelectorModalProps) {
  const { palette, isLight } = useTheme();
  const { 
    activeAccount, 
    brokerSymbols = {} as Record<string, any[]>, 
    refreshAccountData, 
    mexcSyncStatus, 
    refreshBrokerSymbols,
    mexcNewListings = [],
    mexcNewListingStats,
    scanMexcNewListingsNow
  } = useTrade();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedTab, setSelectedTab] = useState<string>('All');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('All');
  const [subTypeFilter, setSubTypeFilter] = useState<'ALL' | 'USDT_M' | 'COIN_M' | 'SPOT'>('ALL');
  const [marketSort, setMarketSort] = useState<'DEFAULT' | 'NEWEST' | 'GAINERS' | 'LOSERS' | 'VOLUME' | 'VOLATILE'>('DEFAULT');
  const [displayLimit, setDisplayLimit] = useState<number>(45);
  const [tickerData, setTickerData] = useState<Record<string, { 
    price: number; 
    change24h: number;
    high?: number;
    low?: number;
    volume?: number;
    quoteVolume?: number;
    spreadPct?: number;
    volatilityScore?: number;
    liquidityRating?: string;
    openInterest?: number;
    fundingRate?: number;
  }>>({});
  const [isInstantScanning, setIsInstantScanning] = useState(false);

  const brokerId = (activeAccount?.broker || 'DEMO').toUpperCase();
  const isCryptoOnly = brokerId === 'MEXC' || brokerId === 'BINANCE' || brokerId === 'BYBIT';
  const isForexOnly = brokerId === 'MT4' || brokerId === 'MT5';

  // Fast 80ms debounce for instant responsive typing feel
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setDisplayLimit(45); // Reset scroll limit on new search
    }, 80);
    return () => clearTimeout(handler);
  }, [search]);

  // Reset tab and filters if broker changes
  useEffect(() => {
    setSelectedTab('All');
    setSelectedSubCategory('All');
    setSubTypeFilter('ALL');
    setMarketSort('DEFAULT');
    setDisplayLimit(45);
  }, [brokerId]);

  // Perfectly tailored market pair universe based on active broker with real-time discovery
  const allPairs = useMemo(() => {
    let basePairs = [...COMPREHENSIVE_MARKET_PAIRS];

    // 1. Filter out impossible assets based on broker type
    if (isCryptoOnly) {
      // MEXC / Binance / Bybit cannot trade EUR/USD, GBP/USD, or Commodities
      basePairs = basePairs.filter(p => p.assetClass === 'Crypto');
    } else if (isForexOnly) {
      // MT4 / MT5 cannot trade Crypto meme coins or shitcoins
      basePairs = basePairs.filter(p => p.assetClass === 'Forex' || p.assetClass === 'Commodity');
    }

    const existingSymbols = new Set(basePairs.map(p => p.symbol.toUpperCase()));

    // 2. Ingest broker-provided symbols
    const brokerPool: any[] = [];
    if (brokerSymbols[activeAccount.broker]) {
      brokerPool.push(...brokerSymbols[activeAccount.broker]);
    } else if (brokerId === 'DEMO' || brokerId.includes('MOUNTALGO')) {
      const mexcList = brokerSymbols['MEXC'] || brokerSymbols['mexc'] || [];
      if (mexcList.length > 0) {
        brokerPool.push(...mexcList);
      }
    }

    // Merge broker pool symbols with rich new listing metadata
    brokerPool.forEach((bs: any) => {
      const cleanSym = (bs.symbol || '').replace(/[^A-Z0-9]/g, '').toUpperCase();
      if (cleanSym && !existingSymbols.has(cleanSym)) {
        const isForex = bs.type === 'forex';
        const isCrypto = bs.base === 'BTC' || bs.base === 'ETH' || bs.base === 'SOL' || bs.quote === 'USDT' || !isForex;
        const assetClass: AssetClass = isForex ? 'Forex' : isCrypto ? 'Crypto' : 'Commodity';

        // Guard: do not add Forex to MEXC/Crypto brokers or Crypto to Forex brokers
        if (isCryptoOnly && assetClass !== 'Crypto') return;
        if (isForexOnly && assetClass === 'Crypto') return;

        basePairs.push({
          symbol: cleanSym,
          base: bs.base || cleanSym.replace('USDT', ''),
          quote: bs.quote || 'USDT',
          name: bs.displayName || `${bs.base || cleanSym.replace('USDT', '')}/${bs.quote || 'USDT'}`,
          assetClass,
          category: bs.type === 'futures' ? 'Futures Perp' : (bs.type === 'spot' ? 'Spot Market' : 'MEXC Gems'),
          firstSeenAt: bs.firstSeenAt,
          isNewListing: bs.isNewListing,
          isNew1m: bs.isNew1m,
          isNew5m: bs.isNew5m,
          isNew1h: bs.isNew1h,
          isNew24h: bs.isNew24h,
          badge: bs.badge,
        });
        existingSymbols.add(cleanSym);
      }
    });

    // 3. Inject any freshly detected new listings from real-time engine
    mexcNewListings.forEach((nl) => {
      const cleanSym = (nl.symbol || '').replace(/[^A-Z0-9]/g, '').toUpperCase();
      if (cleanSym && !existingSymbols.has(cleanSym)) {
        basePairs.unshift({
          symbol: cleanSym,
          base: nl.base,
          quote: nl.quote,
          name: nl.displayName,
          assetClass: 'Crypto',
          category: nl.type === 'futures' ? 'Futures Perp' : 'Spot Market',
          firstSeenAt: nl.firstSeenAt,
          exactListedTimeIso: nl.exactListedTimeIso,
          listingAgeMinutes: nl.listingAgeMinutes,
          listingAgeFormatted: nl.listingAgeFormatted,
          isNewListing: true,
          isNew1m: nl.isNew1m,
          isNew5m: nl.isNew5m,
          isNew1h: nl.isNew1h,
          isNew24h: nl.isNew24h,
          badge: nl.badge,
          quoteVolume24h: nl.quoteVolume24h,
          volatilityScore: nl.volatilityScore,
          liquidityRating: nl.liquidityRating,
          spreadPct: nl.spreadPct,
          maxLeverage: nl.maxLeverage,
          precision: nl.precision,
        });
        existingSymbols.add(cleanSym);
      }
    });

    return basePairs;
  }, [activeAccount, brokerSymbols, mexcNewListings, isCryptoOnly, isForexOnly, brokerId]);

  // Efficient background price fetch on modal open
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    fetch('/api/market/all-tickers')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data && data.success && data.tickers) {
          const map: Record<string, { 
            price: number; 
            change24h: number;
            high?: number;
            low?: number;
            volume?: number;
            quoteVolume?: number;
            spreadPct?: number;
            volatilityScore?: number;
            liquidityRating?: string;
            openInterest?: number;
            fundingRate?: number;
          }> = {};
          Object.entries(data.tickers).forEach(([sym, val]: [string, any]) => {
            map[sym] = {
              price: val.price,
              change24h: val.change24h,
              high: val.high,
              low: val.low,
              volume: val.volume,
              quoteVolume: val.quoteVolume,
              spreadPct: val.spreadPct,
              volatilityScore: val.volatilityScore,
              liquidityRating: val.liquidityRating,
              openInterest: val.openInterest,
              fundingRate: val.fundingRate
            };
          });
          setTickerData(map);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Dynamic Tabs customized for the active broker
  const tabs = useMemo(() => {
    if (isCryptoOnly) {
      return [
        { id: 'All', label: 'All Pairs', icon: Zap },
        { id: 'NewListings', label: '🔥 Rilis Baru (<1m)', icon: Flame },
        { id: 'Futures', label: 'Futures Perp', icon: TrendingUp },
        { id: 'Spot', label: 'Spot Market', icon: DollarSign },
        { id: 'Gems', label: 'Hot Gems', icon: Gem },
      ];
    }
    if (isForexOnly) {
      return [
        { id: 'All', label: 'All FX & Metals', icon: Zap },
        { id: 'Forex', label: 'Forex Pairs', icon: Globe },
        { id: 'Commodity', label: 'Precious Metals & Oil', icon: Gem },
      ];
    }
    return [
      { id: 'All', label: 'All Markets', icon: Zap },
      { id: 'Crypto', label: 'Crypto', icon: DollarSign },
      { id: 'Forex', label: 'Forex FX', icon: Globe },
      { id: 'Commodity', label: 'Commodities', icon: Gem },
    ];
  }, [isCryptoOnly, isForexOnly]);

  // Dynamic Subcategory Pills customized for the active broker
  const subCategories = useMemo(() => {
    if (isCryptoOnly) {
      if (selectedTab === 'NewListings') {
        return ['All', 'Rilis <1 Menit', 'Rilis <5 Menit', 'Rilis <1 Jam', 'Rilis 24 Jam', 'Volume > $1M', 'Volatilitas >15%'];
      }
      if (selectedTab === 'Futures') {
        return ['All', 'Major', 'Layer 1/2', 'MEXC Futures', 'DeFi'];
      }
      if (selectedTab === 'Spot') {
        return ['All', 'Major', 'MEXC Gems', 'Layer 1/2', 'AI & DePIN'];
      }
      if (selectedTab === 'Gems') {
        return ['All', 'MEXC Gems', 'Meme', 'AI & DePIN'];
      }
      return ['All', 'Major', 'Layer 1/2', 'DeFi', 'AI & DePIN', 'Meme', 'MEXC Gems'];
    }

    if (isForexOnly) {
      if (selectedTab === 'Commodity') {
        return ['All', 'Precious Metals', 'Energy', 'Industrial Metals'];
      }
      return ['All', 'Major Forex', 'Cross Forex', 'Exotic Forex'];
    }

    if (selectedTab === 'Crypto') {
      return ['All', 'Major', 'MEXC Gems', 'Layer 1/2', 'DeFi', 'AI & DePIN', 'Meme'];
    }
    if (selectedTab === 'Forex') {
      return ['All', 'Major Forex', 'Cross Forex', 'Exotic Forex'];
    }
    if (selectedTab === 'Commodity') {
      return ['All', 'Precious Metals', 'Energy', 'Industrial Metals'];
    }
    return ['All', 'Crypto', 'Forex', 'Commodity'];
  }, [isCryptoOnly, isForexOnly, selectedTab]);

  // Fast Memoized Filter & Momentum Scanner
  const filtered = useMemo(() => {
    const s = debouncedSearch.toLowerCase().trim();

    const list = allPairs.filter((pair) => {
      // 1. Text Search
      if (s) {
        const matchesSearch =
          pair.symbol.toLowerCase().includes(s) ||
          pair.name.toLowerCase().includes(s) ||
          pair.base.toLowerCase().includes(s) ||
          pair.category.toLowerCase().includes(s);
        if (!matchesSearch) return false;
      }

      // 2. Sub-Type Filter (USDT-M vs Coin-M vs Spot)
      if (subTypeFilter === 'USDT_M') {
        if (pair.quote !== 'USDT') return false;
      } else if (subTypeFilter === 'COIN_M') {
        if (pair.quote !== 'USD' && pair.quote !== 'BTC' && pair.quote !== 'ETH') return false;
      } else if (subTypeFilter === 'SPOT') {
        if (pair.category.includes('Futures') && !pair.category.includes('Spot')) return false;
      }

      // 3. Tab Filter
      if (isCryptoOnly) {
        if (selectedTab === 'NewListings') {
          const isNew = pair.isNew1m || pair.isNew5m || pair.isNew1h || pair.isNewListing || pair.category === 'MEXC Gems';
          if (!isNew) return false;
        } else if (selectedTab === 'Futures') {
          const isPerp = pair.category === 'Futures Perp' || pair.category === 'MEXC Futures' || pair.symbol.endsWith('USDT');
          if (!isPerp) return false;
        } else if (selectedTab === 'Spot') {
          const isSpot = pair.category === 'Spot Market' || pair.category === 'MEXC Spot' || pair.quote === 'USDC';
          if (!isSpot) return false;
        } else if (selectedTab === 'Gems') {
          const isGem = pair.category === 'MEXC Gems' || pair.category === 'Meme' || pair.category === 'AI & DePIN';
          if (!isGem) return false;
        }
      } else if (isForexOnly) {
        if (selectedTab !== 'All' && pair.assetClass !== selectedTab) {
          return false;
        }
      } else {
        if (selectedTab !== 'All' && pair.assetClass !== selectedTab) {
          return false;
        }
      }

      // 4. Subcategory Filter
      if (selectedSubCategory !== 'All') {
        if (selectedTab === 'NewListings') {
          if (selectedSubCategory === 'Rilis <1 Menit' && !pair.isNew1m) return false;
          if (selectedSubCategory === 'Rilis <5 Menit' && !pair.isNew5m && !pair.isNew1m) return false;
          if (selectedSubCategory === 'Rilis <1 Jam' && !pair.isNew1h && !pair.isNew5m && !pair.isNew1m) return false;
          if (selectedSubCategory === 'Rilis 24 Jam' && !pair.isNewListing && !pair.isNew24h) return false;
          if (selectedSubCategory === 'Volume > $1M') {
            const qv = tickerData[pair.symbol]?.quoteVolume || pair.quoteVolume24h || 0;
            if (qv < 1_000_000) return false;
          }
          if (selectedSubCategory === 'Volatilitas >15%') {
            const vs = tickerData[pair.symbol]?.volatilityScore || pair.volatilityScore || Math.abs(tickerData[pair.symbol]?.change24h || 0);
            if (vs < 15) return false;
          }
        } else {
          const matchesSub =
            pair.category === selectedSubCategory ||
            (selectedTab === 'All' && pair.assetClass === selectedSubCategory);
          if (!matchesSub) return false;
        }
      }

      return true;
    });

    // 5. If on NewListings tab or sorting by default, prioritize latest release
    if (marketSort === 'NEWEST' || (selectedTab === 'NewListings' && marketSort === 'DEFAULT')) {
      list.sort((a, b) => {
        const aScore = (a.isNew1m ? 10000 : a.isNew5m ? 5000 : a.isNew1h ? 1000 : a.firstSeenAt ? a.firstSeenAt : 0);
        const bScore = (b.isNew1m ? 10000 : b.isNew5m ? 5000 : b.isNew1h ? 1000 : b.firstSeenAt ? b.firstSeenAt : 0);
        return bScore - aScore;
      });
    } else if (marketSort === 'GAINERS') {
      list.sort((a, b) => {
        const cA = tickerData[a.symbol]?.change24h ?? -999;
        const cB = tickerData[b.symbol]?.change24h ?? -999;
        return cB - cA;
      });
    } else if (marketSort === 'LOSERS') {
      list.sort((a, b) => {
        const cA = tickerData[a.symbol]?.change24h ?? 999;
        const cB = tickerData[b.symbol]?.change24h ?? 999;
        return cA - cB;
      });
    } else if (marketSort === 'VOLUME') {
      list.sort((a, b) => {
        const vA = tickerData[a.symbol]?.quoteVolume ?? a.quoteVolume24h ?? 0;
        const vB = tickerData[b.symbol]?.quoteVolume ?? b.quoteVolume24h ?? 0;
        return vB - vA;
      });
    } else if (marketSort === 'VOLATILE') {
      list.sort((a, b) => {
        const vA = tickerData[a.symbol]?.volatilityScore ?? a.volatilityScore ?? Math.abs(tickerData[a.symbol]?.change24h ?? 0);
        const vB = tickerData[b.symbol]?.volatilityScore ?? b.volatilityScore ?? Math.abs(tickerData[b.symbol]?.change24h ?? 0);
        return vB - vA;
      });
    }

    return list;
  }, [allPairs, debouncedSearch, selectedTab, selectedSubCategory, subTypeFilter, marketSort, tickerData, isCryptoOnly, isForexOnly]);

  if (!isOpen) return null;

  const displayPairs = filtered.slice(0, displayLimit);
  const mexcTotal = mexcSyncStatus?.total || (brokerSymbols['MEXC']?.length || 0);

  const placeholderText = isCryptoOnly
    ? `Cari aset ${brokerId} (contoh: BTC, ETH, SOL, SUI, PEPE, DOGE)...`
    : isForexOnly
    ? `Cari aset Forex & Logam (contoh: EURUSD, GBPUSD, XAUUSD, USOIL)...`
    : `Cari pair (contoh: BTC, ETH, EURUSD, XAUUSD, SOL)...`;

  const headerSubText = isCryptoOnly
    ? `${brokerId} Spot & Futures Pairs (${allPairs.length} Aset Kripto)`
    : isForexOnly
    ? `Forex FX, Precious Metals & Energy (${allPairs.length} Pasangan)`
    : `Multi-Market Universe (${allPairs.length} Pasangan Global)`;

  const handleInstantScan = async () => {
    setIsInstantScanning(true);
    try {
      await scanMexcNewListingsNow();
    } finally {
      setIsInstantScanning(false);
    }
  };

  return (
    <div id="symbol-selector-modal" className="fixed top-[60px] left-4 right-4 sm:left-auto bottom-4 z-modal-ultimate flex flex-col justify-start pointer-events-none animate-fadeIn">
      <div 
        style={{ 
          background: getThemeModalGradient(palette, isLight),
          borderColor: getThemeCardBorder(palette, false),
          boxShadow: `0 20px 50px -10px rgba(0,0,0,0.85), 0 0 30px ${hexToRgba(palette.poc || palette.bull, 0.2)}`
        }} 
        className="backdrop-blur-2xl border rounded-2xl shadow-2xl w-full sm:w-[420px] md:w-[480px] overflow-hidden flex flex-col h-[calc(100vh-80px)] pointer-events-auto"
      >
        {/* Top Accent Gradient Line */}
        <div 
          className="h-[3px] w-full shrink-0"
          style={{
            background: `linear-gradient(90deg, ${palette.bull} 0%, ${palette.poc || '#6366f1'} 50%, ${palette.bear} 100%)`
          }}
        />

        {/* Header */}
        <div 
          className="p-3 sm:p-4 border-b flex items-center justify-between"
          style={{
            background: `linear-gradient(90deg, ${hexToRgba(palette.bull, 0.1)} 0%, rgba(255,255,255,0.02) 50%, ${hexToRgba(palette.bear, 0.1)} 100%)`,
            borderBottomColor: getThemeCardBorder(palette, false)
          }}
        >
          <div className="flex items-center gap-2.5">
            <div>
              <h2 className="font-bold text-[var(--color-text)] text-sm sm:text-base tracking-wide flex items-center gap-2">
                Trading Markets <span>𝙈𝙤𝙪𝙣𝙩𝘼𝙡𝙜𝙤</span>
                <span style={{ backgroundColor: `${palette.poc}20`, color: palette.poc, borderColor: `${palette.poc}40` }} className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border">
                  {filtered.length}
                </span>
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-[var(--color-text-muted)] truncate max-w-[230px]">
                  {headerSubText}
                </span>
                {isCryptoOnly && mexcTotal > 0 && (
                  <span className="text-[10px] text-cyan-400 font-mono bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-500/20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    {mexcTotal.toLocaleString()} Live
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {isCryptoOnly && (
              <button
                id="scan-mexc-instant-btn"
                onClick={handleInstantScan}
                disabled={isInstantScanning}
                title="Scan Koin Baru Rilis MEXC (<1 Menit / Delta Realtime Discovery)"
                className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-1 rounded-lg border border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 transition-all cursor-pointer disabled:opacity-50"
              >
                <Zap size={11} className={isInstantScanning ? "animate-spin text-amber-300" : "text-emerald-400"} />
                <span className="hidden sm:inline">{isInstantScanning ? "Scanning..." : "Scan <1m"}</span>
              </button>
            )}
            <button
              id="refresh-broker-symbols-btn"
              onClick={() => {
                refreshAccountData(activeAccount.id);
                if (isCryptoOnly) refreshBrokerSymbols('mexc', true);
              }}
              disabled={activeAccount.status === 'CONNECTING' || mexcSyncStatus?.isLoading}
              style={{ color: 'var(--color-text-muted)' }}
              className="p-1.5 rounded-lg hover:bg-[var(--color-bg)] cursor-pointer transition-colors disabled:opacity-50"
              onMouseEnter={(e) => (e.currentTarget.style.color = palette.bull)}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
              title={`Sync Saldo & Aset Realtime ${brokerId}`}
            >
              <RefreshCw size={16} className={activeAccount.status === 'CONNECTING' || mexcSyncStatus?.isLoading ? "animate-spin text-amber-400" : ""} />
            </button>
            <button
              id="close-symbol-modal-btn"
              onClick={onClose}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-1.5 rounded-lg hover:bg-[var(--color-bg)] cursor-pointer transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Realtime Discovery Banner for New Releases */}
        {isCryptoOnly && ((mexcNewListingStats?.totalNew || 0) > 0 || (mexcNewListingStats?.new1m || 0) > 0) && (
          <div className="px-3 py-1.5 bg-gradient-to-r from-emerald-950/80 via-teal-950/80 to-zinc-900 border-b border-emerald-500/30 flex items-center justify-between text-[10.5px]">
            <div className="flex items-center gap-1.5 text-emerald-300 font-mono truncate mr-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping flex-shrink-0" />
              <span className="font-bold truncate">
                {(mexcNewListingStats?.new1m || 0) > 0
                  ? `🚀 ${mexcNewListingStats?.new1m} Koin Rilis <1m Terdeteksi!`
                  : `⚡ ${mexcNewListingStats?.totalNew || 0} Aset Baru MEXC Aktif!`}
              </span>
            </div>
            <button
              onClick={() => {
                setSelectedTab('NewListings');
                setSelectedSubCategory('All');
              }}
              className="text-[9.5px] px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 font-bold cursor-pointer transition-colors flex-shrink-0"
            >
              Buka Tab →
            </button>
          </div>
        )}

        {/* Primary Asset Class Tabs */}
        <div className={`grid gap-1.5 p-2 bg-[var(--color-bg)] border-b border-[var(--color-border)] ${tabs.length === 3 ? 'grid-cols-3' : tabs.length === 5 ? 'grid-cols-5' : 'grid-cols-4'}`}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isAct = selectedTab === tab.id;
            return (
              <button
                id={`symbol-tab-${tab.id.toLowerCase()}`}
                key={tab.id}
                onClick={() => {
                  setSelectedTab(tab.id);
                  setSelectedSubCategory('All');
                  setDisplayLimit(45);
                }}
                style={isAct ? { backgroundColor: palette.poc, color: '#000000' } : {}}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  isAct
                    ? 'shadow-lg font-bold'
                    : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-panel)]'
                }`}
              >
                <Icon size={13} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Bar & Subcategory Chips */}
        <div className="p-2.5 border-b border-[var(--color-border)] bg-[var(--color-bg)] space-y-2">
          <div className="relative flex items-center">
            <Search size={15} className="absolute left-3 text-[var(--color-text-muted)]" />
            <input
              id="symbol-search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={placeholderText}
              className="w-full bg-[var(--color-panel)] border border-[var(--color-border)] rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-[var(--color-text)] focus:outline-none placeholder-[var(--color-text-muted)] font-mono transition-colors"
              onFocus={(e) => (e.currentTarget.style.borderColor = palette.poc)}
              onBlur={(e) => (e.currentTarget.style.borderColor = '')}
              autoFocus
            />
            {search && (
              <button
                id="clear-search-btn"
                onClick={() => setSearch('')}
                className="absolute right-2.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Subcategory Filter Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin">
            {subCategories.map((sub) => (
              <button
                id={`subcat-pill-${sub.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                key={sub}
                onClick={() => {
                  setSelectedSubCategory(sub);
                  setDisplayLimit(45);
                }}
                style={selectedSubCategory === sub ? { backgroundColor: `${palette.poc}25`, borderColor: palette.poc, color: palette.poc } : {}}
                className={`text-[10.5px] px-2.5 py-0.5 rounded-md font-medium cursor-pointer transition-colors whitespace-nowrap border ${
                  selectedSubCategory === sub
                    ? 'font-bold'
                    : 'bg-[var(--color-panel)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] border-transparent'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>

          {/* Sub-Type Filter & Realtime Volatility Scanner Toolbar */}
          {isCryptoOnly && (
            <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-[var(--color-border)]/50">
              {/* Sub-Type Pills */}
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                <span className="text-[9.5px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider pr-0.5 shrink-0">
                  Tipe:
                </span>
                {(
                  [
                    { id: 'ALL', label: 'Semua' },
                    { id: 'USDT_M', label: 'USDT-M' },
                    { id: 'COIN_M', label: 'Coin-M' },
                    { id: 'SPOT', label: 'Spot' },
                  ] as const
                ).map((st) => (
                  <button
                    key={st.id}
                    onClick={() => {
                      setSubTypeFilter(st.id);
                      setDisplayLimit(45);
                    }}
                    className={`text-[9.5px] px-1.5 py-0.5 rounded font-mono font-bold transition-all cursor-pointer border ${
                      subTypeFilter === st.id
                        ? 'bg-[var(--color-bull)] text-black border-transparent shadow-sm'
                        : 'bg-[var(--color-panel)] text-[var(--color-text-muted)] hover:text-white border-[var(--color-border)]'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Momentum / Volatility Breakout Sort */}
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[9.5px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider pr-0.5">
                  Scan:
                </span>
                {(
                  [
                    { id: 'DEFAULT', label: 'A-Z' },
                    { id: 'NEWEST', label: '🕒 Baru' },
                    { id: 'GAINERS', label: '▲ Gainer' },
                    { id: 'LOSERS', label: '▼ Loser' },
                    { id: 'VOLUME', label: '💰 Vol' },
                    { id: 'VOLATILE', label: '⚡ Volatil' },
                  ] as const
                ).map((sm) => (
                  <button
                    key={sm.id}
                    onClick={() => {
                      setMarketSort(sm.id);
                      setDisplayLimit(45);
                    }}
                    style={marketSort === sm.id ? { borderColor: palette.poc, color: palette.poc, backgroundColor: `${palette.poc}15` } : {}}
                    className={`text-[9.5px] px-1.5 py-0.5 rounded font-medium transition-all cursor-pointer border ${
                      marketSort === sm.id
                        ? 'font-bold'
                        : 'bg-[var(--color-panel)] text-[var(--color-text-muted)] hover:text-white border-transparent'
                    }`}
                  >
                    {sm.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Markets Pair List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-[var(--color-border)] custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-[var(--color-text-muted)] text-xs sm:text-sm">
              Tidak ada pasangan trading yang cocok dengan "<span className="text-[var(--color-text)]">{search}</span>" pada broker <span className="font-bold text-[var(--color-text)]">{brokerId}</span>.
            </div>
          ) : (
            <>
              {displayPairs.map((pair) => (
                <MarketPairRow
                  key={pair.symbol}
                  pair={pair}
                  live={tickerData[pair.symbol]}
                  isSelected={currentSymbol.toUpperCase() === pair.symbol.toUpperCase()}
                  palette={palette}
                  onSelect={(sym) => {
                    onSelectSymbol(sym);
                    onClose();
                  }}
                />
              ))}

              {filtered.length > displayLimit && (
                <div className="p-2.5 text-center">
                  <button
                    id="load-more-symbols-btn"
                    onClick={() => setDisplayLimit((prev) => prev + 45)}
                    style={{ borderColor: `${palette.poc}40`, color: palette.poc }}
                    className="w-full py-2 rounded-xl text-xs font-bold border bg-[var(--color-bg)] hover:bg-[var(--color-panel)] transition-colors cursor-pointer"
                  >
                    Muat Lebih Banyak ({filtered.length - displayLimit} pasangan lagi)
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="p-2.5 bg-[var(--color-bg)] border-t border-[var(--color-border)] text-[10.5px] text-[var(--color-text-muted)] flex justify-between items-center">
          <span className="truncate">Broker Aktif: <strong className="text-[var(--color-text)]">{activeAccount.name} ({brokerId})</strong></span>
          <span className="font-mono font-semibold flex items-center gap-1 flex-shrink-0">
            <span>⚡ Ultra Fast Screener</span>
          </span>
        </div>
      </div>
    </div>
  );
}

