import React, { useState, useEffect } from 'react';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  Bell, 
  Target, 
  ShieldAlert, 
  Zap, 
  Check, 
  Sliders, 
  ArrowUpRight, 
  ArrowDownRight,
  Layers,
  Sparkles,
  Volume2
} from 'lucide-react';
import { useTrade } from '../context/TradeContext';
import { useTheme } from '../context/ThemeContext';
import { PriceAlert } from './PriceAlerts';

export interface HoldPriceTraderProps {
  isOpen: boolean;
  onClose: () => void;
  price: number;
  currentPrice: number;
  symbol: string;
  isForex: boolean;
  positionX?: number;
  positionY?: number;
  onAddDrawing?: (type: 'horizontal' | 'horizontal_ray' | 'position_long' | 'position_short', price: number, riskReward?: any) => void;
}

export default function HoldPriceTraderMenu({
  isOpen,
  onClose,
  price,
  currentPrice,
  symbol,
  isForex,
  positionX,
  positionY,
  onAddDrawing
}: HoldPriceTraderProps) {
  const { palette } = useTheme();
  const {
    executeOrder,
    volumePresets,
    activePresetIndex,
    setActivePresetIndex,
    hotkeyMode
  } = useTrade();

  const [activeTab, setActiveTab] = useState<'quick' | 'bracket' | 'alert' | 'levels'>('quick');
  const presets = isForex ? volumePresets.forex : volumePresets.crypto;
  const [customSize, setCustomSize] = useState<string>(
    (presets[activePresetIndex] ?? (isForex ? 0.1 : 100)).toString()
  );
  const [leverage, setLeverage] = useState<number>(10);
  const [autoBE, setAutoBE] = useState<boolean>(true);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  // TP and SL for bracket setup
  const isBelowCurrent = price < currentPrice;
  const defaultTp = isBelowCurrent 
    ? price + (currentPrice - price) * 2
    : price - (price - currentPrice) * 2;
  const defaultSl = isBelowCurrent
    ? price - (currentPrice - price) * 0.8
    : price + (price - currentPrice) * 0.8;

  const [tpPrice, setTpPrice] = useState<string>(defaultTp?.toFixed(isForex ? 5 : 2));
  const [slPrice, setSlPrice] = useState<string>(defaultSl?.toFixed(isForex ? 5 : 2));
  const [alertNote, setAlertNote] = useState<string>(`Target Price Hit: ${symbol}`);

  useEffect(() => {
    const defaultVal = presets[activePresetIndex] ?? (isForex ? 0.1 : 100);
    setCustomSize(defaultVal.toString());
  }, [activePresetIndex, isForex, presets]);

  useEffect(() => {
    if (!isOpen) return;
    const isBelow = price < currentPrice;
    const diff = Math.abs(currentPrice - price) || (currentPrice * 0.01);
    const tp = isBelow ? price + diff * 2 : price - diff * 2;
    const sl = isBelow ? price - diff * 0.8 : price + diff * 0.8;
    setTpPrice(tp?.toFixed(isForex ? 5 : 2));
    setSlPrice(sl?.toFixed(isForex ? 5 : 2));
  }, [price, isOpen, isForex]);

  if (!isOpen) return null;

  const formatPrice = (p: number) => {
    if (!p) return '0.00';
    return isForex ? p?.toFixed(5) : p > 500 ? p?.toFixed(2) : p?.toFixed(4);
  };

  const parsedSize = Math.max(isForex ? 0.01 : 1, parseFloat(customSize) || (isForex ? 0.1 : 100));

  // Determine smart order types
  // If price < currentPrice: Buy Limit (buy cheaper) OR Sell Stop (breakdown sell)
  // If price > currentPrice: Buy Stop (breakout buy) OR Sell Limit (sell higher)
  const isPriceBelow = price < currentPrice;
  const priceDiffPct = currentPrice > 0 ? (((price - currentPrice) / currentPrice) * 100) : 0;

  const handleExecuteMarket = (side: 'BUY' | 'SELL') => {
    executeOrder({
      symbol,
      type: side,
      orderType: 'MARKET',
      size: parsedSize,
      price: currentPrice,
      leverage,
      autoBE
    });

    setOrderSuccess(`MARKET ${side} @ ${formatPrice(currentPrice)} Berhasil!`);
    setTimeout(() => {
      setOrderSuccess(null);
      onClose();
    }, 1200);
  };

  const handleExecuteLimit = (side: 'BUY' | 'SELL') => {
    const orderType = side === 'BUY' 
      ? (isPriceBelow ? 'LIMIT' : 'STOP')
      : (isPriceBelow ? 'STOP' : 'LIMIT');

    executeOrder({
      symbol,
      type: side,
      orderType: orderType as any,
      size: parsedSize,
      price: price,
      leverage,
      autoBE
    });

    setOrderSuccess(`${side} ${orderType} @ ${formatPrice(price)} Berhasil!`);
    setTimeout(() => {
      setOrderSuccess(null);
      onClose();
    }, 1200);
  };

  const handleExecuteBracket = (side: 'BUY' | 'SELL') => {
    const orderType = side === 'BUY' 
      ? (isPriceBelow ? 'LIMIT' : 'STOP')
      : (isPriceBelow ? 'STOP' : 'LIMIT');

    const tp = parseFloat(tpPrice) || undefined;
    const sl = parseFloat(slPrice) || undefined;

    executeOrder({
      symbol,
      type: side,
      orderType: orderType as any,
      size: parsedSize,
      price: price,
      takeProfit: tp,
      stopLoss: sl,
      leverage,
      autoBE
    });

    if (onAddDrawing) {
      onAddDrawing(
        side === 'BUY' ? 'position_long' : 'position_short',
        price,
        { takeProfit: tp, stopLoss: sl }
      );
    }

    setOrderSuccess(`Order Bracket ${side} @ ${formatPrice(price)} Dipasang!`);
    setTimeout(() => {
      setOrderSuccess(null);
      onClose();
    }, 1200);
  };

  const handleCreateAlert = () => {
    try {
      const LOCAL_STORAGE_ALERTS_KEY = 'mountalgo_price_alerts_v1';
      const stored = localStorage.getItem(LOCAL_STORAGE_ALERTS_KEY);
      const alerts: PriceAlert[] = stored ? JSON.parse(stored) : [];

      const newAlert: PriceAlert = {
        id: 'alert_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        symbol,
        targetPrice: price,
        condition: price >= currentPrice ? 'above' : 'below',
        label: alertNote || `Price Alert @ ${formatPrice(price)}`,
        isActive: true,
        soundAlert: true,
        createdAt: Date.now(),
        initialPrice: currentPrice
      };

      const updated = [newAlert, ...alerts];
      localStorage.setItem(LOCAL_STORAGE_ALERTS_KEY, JSON.stringify(updated));

      // Trigger custom event so PriceAlerts component updates in real time
      window.dispatchEvent(new CustomEvent('mountalgo_alert_created', { detail: newAlert }));

      setOrderSuccess(`Alarm Harga @ ${formatPrice(price)} Aktif!`);
      setTimeout(() => {
        setOrderSuccess(null);
        onClose();
      }, 1200);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddChartLevel = (type: 'horizontal' | 'horizontal_ray') => {
    if (onAddDrawing) {
      onAddDrawing(type, price);
    }
    setOrderSuccess(`Garis Level @ ${formatPrice(price)} Ditambahkan!`);
    setTimeout(() => {
      setOrderSuccess(null);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 animate-in fade-in duration-150 select-none">
      <div 
        style={{
          borderColor: `${palette.bull}80`,
          boxShadow: `0 0 35px -5px ${palette.bull}30, 0 20px 40px rgba(0,0,0,0.8)`
        }}
        className="bg-[var(--color-panel)] border-2 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-4 py-3 bg-[var(--color-panel-header)] border-b border-[var(--color-border)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div 
              style={{ backgroundColor: `${palette.bull}20`, borderColor: `${palette.bull}60` }}
              className="p-1.5 rounded-xl border flex items-center justify-center"
            >
              <Zap size={16} style={{ color: palette.bull }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm tracking-wide">
                  Trader Hold Harga
                </span>
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-cyan-300 font-semibold">
                  {symbol}
                </span>
              </div>
              <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
                <span>Level Terpilih:</span>
                <strong className="text-white font-mono text-xs">{formatPrice(price)}</strong>
                <span className={`text-[10px] font-mono font-bold ${priceDiffPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ({priceDiffPct >= 0 ? '+' : ''}{priceDiffPct?.toFixed(2)}% vs Pasar)
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-4 bg-[var(--color-panel)] border-b border-[var(--color-border)] text-[11px] font-semibold">
          {[
            { id: 'quick', label: 'Order Cepat', icon: Zap },
            { id: 'bracket', label: 'TP / SL Bracket', icon: Target },
            { id: 'alert', label: 'Set Alarm', icon: Bell },
            { id: 'levels', label: 'Garis Level', icon: Layers },
          ].map(tab => {
            const Icon = tab.icon;
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={isSel ? { borderColor: palette.bull, color: palette.bull, backgroundColor: `${palette.bull}15` } : {}}
                className={`py-2 px-1 flex flex-col items-center gap-1 border-b-2 transition-all cursor-pointer ${
                  isSel ? 'border-b-2 font-bold' : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                <Icon size={14} />
                <span className="text-[10px] leading-tight">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-3.5 text-xs text-[var(--color-text)] overflow-y-auto flex-1 scrollbar-thin max-h-[70vh]">
          {/* Order Success Feedback Banner */}
          {orderSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-bold flex items-center justify-center gap-2 text-xs animate-in zoom-in-95">
              <Check size={16} />
              <span>{orderSuccess}</span>
            </div>
          )}

          {/* Volume Preset Selector (Shared between Quick & Bracket) */}
          {(activeTab === 'quick' || activeTab === 'bracket') && (
            <div className="space-y-1.5 bg-[var(--color-card)] p-2.5 rounded-xl border border-[var(--color-border)]">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[var(--color-text-muted)]">Ukuran Order ({isForex ? 'Lot' : 'Kontrak / USD'})</span>
                <span className="text-[var(--color-text-muted)] font-mono">Preset [1-5]</span>
              </div>

              {/* Presets Pills */}
              <div className="grid grid-cols-5 gap-1">
                {presets.map((vol, idx) => {
                  const isSel = activePresetIndex === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setActivePresetIndex(idx);
                        setCustomSize(vol.toString());
                      }}
                      style={isSel ? { backgroundColor: palette.poc, color: '#000000', borderColor: `${palette.poc}90` } : {}}
                      className={`py-1 rounded text-center font-mono text-xs font-bold border cursor-pointer transition-all ${
                        isSel 
                          ? 'shadow-[0_0_8px_rgba(168,85,247,0.4)]' 
                          : 'bg-[var(--color-input-bg)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)]'
                      }`}
                    >
                      {vol}
                    </button>
                  );
                })}
              </div>

              {/* Custom Input */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] text-[var(--color-text-muted)] font-mono">Custom:</span>
                <input
                  type="number"
                  step={isForex ? "0.01" : "10"}
                  min={isForex ? "0.01" : "1"}
                  value={customSize ?? ''}
                  onChange={(e) => setCustomSize(e.target.value)}
                  className="flex-1 bg-[var(--color-input-bg)] border border-[var(--color-input-border)] focus:border-cyan-400 rounded px-2 py-1 font-mono text-xs text-[var(--color-text)] focus:outline-none"
                />
                <span className="text-[10px] text-[var(--color-text-muted)] font-mono">{isForex ? 'Lots' : 'USD'}</span>
              </div>
            </div>
          )}

          {/* TAB 1: QUICK ORDER AT PRICE */}
          {activeTab === 'quick' && (
            <div className="space-y-3">
              {/* INSTANT MARKET ORDERS */}
              <div>
                <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider block mb-1">
                  ⚡ Market Order (Harga Pasaran Instan @ {formatPrice(currentPrice)}):
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleExecuteMarket('BUY')}
                    style={{ backgroundColor: `${palette.bull}25`, borderColor: palette.bull, color: palette.bull }}
                    className="p-2.5 rounded-xl border flex items-center justify-between hover:brightness-125 transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <div className="flex items-center gap-1.5 font-extrabold text-xs">
                      <ArrowUpRight size={15} />
                      <span>MARKET BUY</span>
                    </div>
                    <span className="text-[9px] font-mono font-bold bg-black/40 px-1.5 py-0.5 rounded text-emerald-300">
                      Instan
                    </span>
                  </button>

                  <button
                    onClick={() => handleExecuteMarket('SELL')}
                    style={{ backgroundColor: `${palette.bear}25`, borderColor: palette.bear, color: palette.bear }}
                    className="p-2.5 rounded-xl border flex items-center justify-between hover:brightness-125 transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <div className="flex items-center gap-1.5 font-extrabold text-xs">
                      <ArrowDownRight size={15} />
                      <span>MARKET SELL</span>
                    </div>
                    <span className="text-[9px] font-mono font-bold bg-black/40 px-1.5 py-0.5 rounded text-rose-300">
                      Instan
                    </span>
                  </button>
                </div>
              </div>

              {/* PENDING ORDERS AT SELECTED LEVEL */}
              <div>
                <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider block mb-1">
                  ⏳ Pending Order (Target Level @ {formatPrice(price)}):
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  {/* BUY BUTTON */}
                  <button
                    onClick={() => handleExecuteLimit('BUY')}
                    style={{
                      backgroundColor: `${palette.bull}15`,
                      borderColor: `${palette.bull}80`,
                      color: palette.bull
                    }}
                    className="p-2.5 rounded-xl border flex flex-col items-center gap-1 hover:brightness-125 transition-all cursor-pointer shadow-md active:scale-95 group"
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <ArrowUpRight size={15} />
                      <span>{isPriceBelow ? 'LIMIT BUY' : 'STOP BUY'}</span>
                    </div>
                    <span className="text-[10px] text-[var(--color-text-muted)] font-mono opacity-80 group-hover:opacity-100">
                      @ {formatPrice(price)}
                    </span>
                  </button>

                  {/* SELL BUTTON */}
                  <button
                    onClick={() => handleExecuteLimit('SELL')}
                    style={{
                      backgroundColor: `${palette.bear}15`,
                      borderColor: `${palette.bear}80`,
                      color: palette.bear
                    }}
                    className="p-2.5 rounded-xl border flex flex-col items-center gap-1 hover:brightness-125 transition-all cursor-pointer shadow-md active:scale-95 group"
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <ArrowDownRight size={15} />
                      <span>{isPriceBelow ? 'STOP SELL' : 'LIMIT SELL'}</span>
                    </div>
                    <span className="text-[10px] text-[var(--color-text-muted)] font-mono opacity-80 group-hover:opacity-100">
                      @ {formatPrice(price)}
                    </span>
                  </button>
                </div>
              </div>

              {/* Auto BE Checkbox */}
              <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] text-[11px]">
                <span className="text-[var(--color-text)]">Aktifkan Auto Break-Even (+1% Profit)</span>
                <input
                  type="checkbox"
                  checked={Boolean(autoBE)}
                  onChange={(e) => setAutoBE(e.target.checked)}
                  className="rounded border-[var(--color-border)] text-emerald-500 focus:ring-0 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB 2: BRACKET ORDER (TP & SL) */}
          {activeTab === 'bracket' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 bg-[var(--color-card)] p-2.5 rounded-xl border border-[var(--color-border)]">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                    <Target size={11} /> Take Profit (TP)
                  </span>
                  <input
                    type="number"
                    step={isForex ? "0.0001" : "1"}
                    value={tpPrice ?? ''}
                    onChange={(e) => setTpPrice(e.target.value)}
                    className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] focus:border-emerald-400 rounded px-2 py-1 font-mono text-xs text-[var(--color-text)] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
                    <ShieldAlert size={11} /> Stop Loss (SL)
                  </span>
                  <input
                    type="number"
                    step={isForex ? "0.0001" : "1"}
                    value={slPrice ?? ''}
                    onChange={(e) => setSlPrice(e.target.value)}
                    className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] focus:border-rose-400 rounded px-2 py-1 font-mono text-xs text-[var(--color-text)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => handleExecuteBracket('BUY')}
                  style={{
                    backgroundColor: `${palette.bull}20`,
                    borderColor: palette.bull,
                    color: palette.bull
                  }}
                  className="py-2.5 px-3 rounded-xl border font-bold text-xs hover:brightness-125 transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                >
                  <ArrowUpRight size={14} />
                  <span>Pasang Bracket BUY</span>
                </button>

                <button
                  onClick={() => handleExecuteBracket('SELL')}
                  style={{
                    backgroundColor: `${palette.bear}20`,
                    borderColor: palette.bear,
                    color: palette.bear
                  }}
                  className="py-2.5 px-3 rounded-xl border font-bold text-xs hover:brightness-125 transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                >
                  <ArrowDownRight size={14} />
                  <span>Pasang Bracket SELL</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PRICE ALARM */}
          {activeTab === 'alert' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--color-text)] flex items-center gap-1.5">
                    <Bell size={13} style={{ color: palette.bull }} /> Pasang Alarm Suara
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-cyan-300">
                    {price >= currentPrice ? 'Trigger: Naik Ke Atas' : 'Trigger: Turun Ke Bawah'}
                  </span>
                </div>

                <input
                  type="text"
                  value={alertNote ?? ''}
                  onChange={(e) => setAlertNote(e.target.value)}
                  placeholder="Catatan / Label Alarm..."
                  className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] focus:border-cyan-400 rounded-lg px-2.5 py-1.5 font-sans text-xs text-[var(--color-text)] focus:outline-none"
                />

                <p className="text-[11px] text-[var(--color-text-muted)]">
                  Sistem MountAlgo akan membunyikan alarm audio seketika harga pasar menyentuh atau melintasi level <strong className="text-[var(--color-text)] font-mono">{formatPrice(price)}</strong>.
                </p>
              </div>

              <button
                onClick={handleCreateAlert}
                style={{ backgroundColor: palette.bull, color: '#000000' }}
                className="w-full py-2.5 rounded-xl font-extrabold text-xs hover:opacity-90 transition-opacity cursor-pointer shadow-lg flex items-center justify-center gap-2"
              >
                <Bell size={14} />
                <span>Simpan Alarm Harga @ {formatPrice(price)}</span>
              </button>
            </div>
          )}

          {/* TAB 4: CHART LEVEL LINE */}
          {activeTab === 'levels' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] space-y-2">
                <div className="font-bold text-xs text-[var(--color-text)] flex items-center gap-1.5">
                  <Layers size={13} style={{ color: palette.poc }} /> Tandai Level Support / Resistance
                </div>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  Gambarkan garis horizontal statis atau ray tak hingga pada harga <strong className="text-[var(--color-text)] font-mono">{formatPrice(price)}</strong> untuk memantau reaksi harga di masa depan.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => handleAddChartLevel('horizontal')}
                  className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-hover)] text-[var(--color-text)] text-xs font-bold transition-all cursor-pointer"
                >
                  Garis Penuh (Line)
                </button>
                <button
                  onClick={() => handleAddChartLevel('horizontal_ray')}
                  className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-hover)] text-[var(--color-text)] text-xs font-bold transition-all cursor-pointer"
                >
                  Sinar Kanan (Ray)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-[var(--color-panel-header)] border-t border-[var(--color-border)] flex items-center justify-between text-[10px] text-[var(--color-text-muted)] font-mono">
          <span>HOLD PRICE TRADER CORE</span>
          <button
            onClick={onClose}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer px-2 py-0.5 rounded hover:bg-[var(--color-hover)]"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
