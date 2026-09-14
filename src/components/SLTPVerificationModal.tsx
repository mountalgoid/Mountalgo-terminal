import React from 'react';
import { ShieldCheck, AlertTriangle, ArrowRight, X, Check, Lock, Unlock } from 'lucide-react';

export interface SLTPVerificationData {
  isOpen: boolean;
  kind: 'POSITION_TP' | 'POSITION_SL' | 'PENDING_TP' | 'PENDING_SL' | 'PENDING_ORDER';
  symbol: string;
  posId?: string;
  pendingId?: string;
  side: 'BUY' | 'SELL';
  entryPrice: number;
  oldPrice?: number;
  newPrice: number;
  size: number;
  isForex: boolean;
  onConfirm: () => void;
  onClose: () => void;
  requireVerification: boolean;
  onToggleRequireVerification: (val: boolean) => void;
}

export default function SLTPVerificationModal({
  isOpen,
  kind,
  symbol,
  side,
  entryPrice,
  oldPrice,
  newPrice,
  size,
  isForex,
  onConfirm,
  onClose,
  requireVerification,
  onToggleRequireVerification,
}: SLTPVerificationData) {
  if (!isOpen) return null;

  const isTP = kind === 'POSITION_TP' || kind === 'PENDING_TP';
  const isSL = kind === 'POSITION_SL' || kind === 'PENDING_SL';
  const isPendingOrder = kind === 'PENDING_ORDER';

  const isNewOrder = isPendingOrder && oldPrice === undefined;

  const labelTitle = isNewOrder
    ? 'Penempatan Order Baru'
    : isTP
    ? 'Take Profit (TP)'
    : isSL
    ? 'Stop Loss (SL)'
    : 'Harga Order Pending';

  const isBuy = side === 'BUY';

  // Format Helper
  const formatPrice = (val?: number) => {
    if (!val || val <= 0) return 'Belum Diatur';
    if (val < 1) return val.toFixed(5);
    if (val < 100) return val.toFixed(4);
    return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Calculate Distance & Estimated PnL
  const priceDiff = Math.abs(newPrice - entryPrice);
  const pipMultiplier = isForex ? (symbol.includes('JPY') ? 100 : 10000) : 1;
  const pips = priceDiff * pipMultiplier;

  // Rough PnL calculation
  let estimatedPnL = 0;
  if (isTP) {
    estimatedPnL = isBuy ? (newPrice - entryPrice) : (entryPrice - newPrice);
  } else if (isSL) {
    estimatedPnL = isBuy ? (newPrice - entryPrice) : (entryPrice - newPrice);
  } else {
    estimatedPnL = (newPrice - entryPrice) * (isBuy ? 1 : -1);
  }

  // Adjust for Forex contract size (100k) vs Crypto/Stock
  const contractFactor = isForex ? 100000 : 1;
  const finalEstPnLVal = estimatedPnL * size * contractFactor;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[var(--color-panel)] border border-[var(--color-border)] rounded-2xl max-w-md w-full shadow-2xl overflow-hidden font-sans text-[var(--color-text)] flex flex-col">
        {/* Modal Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isTP 
            ? 'bg-emerald-950/40 border-emerald-500/30' 
            : isSL 
            ? 'bg-rose-950/40 border-rose-500/30' 
            : 'bg-indigo-950/40 border-indigo-500/30'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${
              isTP 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                : isSL 
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' 
                : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
            }`}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[var(--color-text)] flex items-center gap-2">
                <span>{isNewOrder ? 'Verifikasi Penempatan Order Baru' : `Verifikasi Perubahan ${labelTitle}`}</span>
              </h3>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                Konfirmasi untuk mencegah kesalahan pergeseran garis di chart
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Position Tag & Symbol */}
          <div className="flex items-center justify-between bg-[var(--color-card)] p-2.5 rounded-xl border border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded font-bold text-[10px] tracking-wider uppercase ${
                isBuy ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
              }`}>
                {side}
              </span>
              <span className="font-bold text-[var(--color-text)] text-sm font-mono">{symbol}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[var(--color-text-muted)] block">Ukuran Posisi</span>
              <span className="font-mono font-bold text-[var(--color-text)]">{size} {isForex ? 'Lot' : 'Unit'}</span>
            </div>
          </div>

          {/* Price Change Comparison Card */}
          <div className="bg-[var(--color-card)] p-3.5 rounded-xl border border-[var(--color-border)] space-y-3 font-mono">
            <div className="flex items-center justify-between text-[var(--color-text-muted)] text-[11px] pb-2 border-b border-[var(--color-border)]">
              <span>{isNewOrder ? 'Harga Pasar (Acuan)' : 'Harga Entry (Acuan)'}</span>
              <span className="text-[var(--color-text)] font-bold">{formatPrice(entryPrice)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="bg-[var(--color-input-bg)] p-2.5 rounded-lg border border-[var(--color-input-border)]">
                <span className="text-[10px] text-[var(--color-text-muted)] block uppercase font-sans font-medium">
                  {isNewOrder ? 'Harga Pasar' : 'Harga Sebelumnya'}
                </span>
                <span className="text-[var(--color-text-muted)] text-xs font-semibold block mt-0.5">
                  {isNewOrder ? formatPrice(entryPrice) : formatPrice(oldPrice)}
                </span>
              </div>
              <div className={`p-2.5 rounded-lg border ${
                isTP 
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' 
                  : isSL 
                  ? 'bg-rose-950/30 border-rose-500/40 text-rose-300' 
                  : 'bg-indigo-950/30 border-indigo-500/40 text-indigo-300'
              }`}>
                <span className="text-[10px] text-slate-400 block uppercase font-sans font-medium">Harga Baru</span>
                <span className="text-sm font-bold block mt-0.5 flex items-center justify-between">
                  <span>{formatPrice(newPrice)}</span>
                  <ArrowRight size={13} className="opacity-70" />
                </span>
              </div>
            </div>

            {/* Distance & PnL Estimate */}
            <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)] text-[11px]">
              <span className="text-[var(--color-text-muted)] font-sans">{isNewOrder ? 'Jarak ke Harga Pasar:' : 'Jarak Perubahan:'}</span>
              <span className="font-bold text-[var(--color-text)]">
                {isForex ? `${pips.toFixed(1)} Pips` : `${priceDiff.toFixed(2)} Points`}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px]">
              <span className="text-[var(--color-text-muted)] font-sans">
                {isNewOrder ? 'Proyeksi PnL jika Tereksekusi:' : 'Estimasi PnL pada Target:'}
              </span>
              <span className={`font-bold ${finalEstPnLVal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {finalEstPnLVal >= 0 ? '+' : ''}${finalEstPnLVal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Toggle Verification Checkbox */}
          <div className="pt-1">
            <label className="flex items-center gap-2.5 text-[11px] text-[var(--color-text-muted)] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={Boolean(requireVerification)}
                onChange={(e) => onToggleRequireVerification(e.target.checked)}
                className="w-4 h-4 rounded bg-[var(--color-input-bg)] border-[var(--color-input-border)] text-emerald-500 focus:ring-emerald-500/30 cursor-pointer"
              />
              <span>Selalu minta konfirmasi saat menggeser line SL / TP</span>
            </label>
          </div>
        </div>

        {/* Modal Footer / Actions */}
        <div className="p-4 bg-[var(--color-panel-header)] border-t border-[var(--color-border)] flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[var(--color-hover)] hover:bg-[var(--color-card)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] font-bold text-xs transition-all cursor-pointer border border-[var(--color-border)] text-center active:scale-95"
          >
            Batal
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs text-white shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 border ${
              isTP 
                ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400/40 shadow-emerald-950/50' 
                : isSL 
                ? 'bg-rose-600 hover:bg-rose-500 border-rose-400/40 shadow-rose-950/50' 
                : 'bg-indigo-600 hover:bg-indigo-500 border-indigo-400/40 shadow-indigo-950/50'
            }`}
          >
            <Check size={15} />
            <span>{isNewOrder ? 'Konfirmasi Buka Order' : 'Konfirmasi Perubahan'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
