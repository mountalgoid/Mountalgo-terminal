import { formatValueShorthand, formatPriceShorthand } from "../utils/numberFormatters";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Check, 
  Settings2, 
  Minimize2, 
  Maximize2, 
  Crosshair, 
  X, 
  TableProperties,
  ArrowUp,
  ArrowDown,
  Layers,
  Sparkles,
  Flame,
  Zap,
  Activity,
  Info,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';
import { Candle } from './CustomChartWidget';
import { FootprintCandleData } from '../utils/footprints';
import { 
  DomColumnConfig, 
  DEFAULT_DOM_COLUMNS, 
  generateOrderFlowDomData,
  DomLadderRow,
  DomLadderState
} from '../utils/orderFlowDomEngine';
import { useTheme } from '../context/ThemeContext';

interface OrderFlowDomLadderProps {
  candles: Candle[];
  footprintData?: FootprintCandleData[];
  currentPrice: number | null;
  symbol: string;
  isOpen: boolean;
  onClose: () => void;
  showChartOverlay?: boolean;
  onToggleChartOverlay?: (show: boolean) => void;
  domData?: DomLadderState;
}

const OrderFlowDomLadder = React.memo(function OrderFlowDomLadder({
  candles,
  footprintData = [],
  currentPrice,
  symbol,
  isOpen,
  onClose,
  showChartOverlay = true,
  onToggleChartOverlay,
  domData: externalDomData,
}: OrderFlowDomLadderProps) {
  const { palette } = useTheme();

  const [columns, setColumns] = useState<DomColumnConfig>(() => {
    const saved = localStorage.getItem('mountalgo_dom_columns');
    if (saved) {
      try {
        return { ...DEFAULT_DOM_COLUMNS, ...JSON.parse(saved) };
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_DOM_COLUMNS;
  });

  const [isCompact, setIsCompact] = useState<boolean>(false);
  const [showWallGuide, setShowWallGuide] = useState<boolean>(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; visible: boolean } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const lastPriceRef = useRef<number | null>(currentPrice);
  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null);

  // Track price flash animation on price tick
  useEffect(() => {
    if (currentPrice !== null && lastPriceRef.current !== null && currentPrice !== lastPriceRef.current) {
      setPriceFlash(currentPrice > lastPriceRef.current ? 'up' : 'down');
      const timer = setTimeout(() => setPriceFlash(null), 600);
      lastPriceRef.current = currentPrice;
      return () => clearTimeout(timer);
    }
    lastPriceRef.current = currentPrice;
  }, [currentPrice]);

  // Save column configuration
  useEffect(() => {
    localStorage.setItem('mountalgo_dom_columns', JSON.stringify(columns));
  }, [columns]);

  // Generate DOM Data if not provided externally
  const domData: DomLadderState = useMemo(() => {
    if (externalDomData) return externalDomData;
    return generateOrderFlowDomData(candles, footprintData, currentPrice, 38);
  }, [externalDomData, candles, footprintData, currentPrice]);

  // Center scroll on current price row on open or symbol change
  const scrollToCurrentPrice = () => {
    if (!scrollContainerRef.current) return;
    const currentPriceElem = scrollContainerRef.current.querySelector('[data-current-price="true"]');
    if (currentPriceElem) {
      currentPriceElem.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToCurrentPrice, 100);
    }
  }, [isOpen, symbol]);

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    if (contextMenu?.visible) {
      window.addEventListener('mousedown', handleClickOutside);
    }
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [contextMenu]);

  if (!isOpen) return null;

  const toggleColumn = (key: keyof DomColumnConfig) => {
    setColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const bullColor = palette.bull || '#22c55e';
  const bearColor = palette.bear || '#ef4444';
  const pocColor = palette.poc || '#f59e0b';

  return (
    <div 
      className="h-full flex flex-col bg-zinc-950/80 backdrop-blur-xl border-l border-cyan-900/40 select-none text-xs font-mono relative shadow-[0_0_25px_rgba(8,145,178,0.1)] chart-layer-vp-ladder shrink-0 transition-all duration-150"
      style={{ width: isCompact ? 'min(350px, 100vw)' : 'min(520px, 100vw)', maxWidth: '100%' }}
      onContextMenu={(e) => {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        setContextMenu({
          x: Math.min(e.clientX - rect.left, 240),
          y: Math.min(e.clientY - rect.top, 240),
          visible: true,
        });
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
      {/* 1. Header Toolbar */}
      <div className="relative bg-zinc-900/40 backdrop-blur-md px-2 sm:px-3 py-1.5 sm:py-2 border-b border-cyan-900/30 flex items-center justify-between gap-1 shadow-sm">
        <div className="flex items-center gap-1.5 min-w-0">
          <TableProperties size={14} style={{ color: pocColor }} />
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-[var(--color-text)] text-[11.5px] tracking-wide uppercase font-sans">
              DOM LADDER
            </span>
            <span className="bg-[var(--color-panel)] text-[var(--color-text)] font-semibold px-1.5 py-0.5 rounded text-[9.5px] font-sans border border-[var(--color-border)]">
              {symbol.replace('USDT', '')}
            </span>
          </div>

          {/* Real-time Spread Badge */}
          <div className="hidden sm:flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded text-[9.5px] text-[var(--color-text-muted)] border border-cyan-900/30">
            <span className="text-[var(--color-text-muted)]">Spread:</span>
            <span className="`text-[${palette.poc}]` font-bold">{domData.spread.toFixed(domData.priceStep >= 0.01 ? 2 : 4)}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Wall Guide Tooltip Toggle */}
          <button
            onClick={() => setShowWallGuide(!showWallGuide)}
            title="Penjelasan DOM Liquidity Walls"
            className={`p-1 rounded transition-colors cursor-pointer ${
              showWallGuide ? '`bg-[${palette.poc}20]` `text-[${palette.poc}]` border border-amber-500/40' : 'hover:bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:`text-[${palette.poc}]`'
            }`}
          >
            <HelpCircle size={13} />
          </button>

          {/* Toggle On-Chart Projections */}
          {onToggleChartOverlay && (
            <button
              onClick={() => onToggleChartOverlay(!showChartOverlay)}
              title={showChartOverlay ? "Sembunyikan Level DOM pada Chart" : "Tampilkan Level DOM pada Chart"}
              style={{
                borderColor: showChartOverlay ? pocColor : 'var(--color-border)',
                backgroundColor: showChartOverlay ? `${pocColor}30` : 'var(--color-panel)',
                color: showChartOverlay ? pocColor : 'var(--color-text-muted)'
              }}
              className="px-2 py-0.5 rounded text-[10px] font-sans font-bold border flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Layers size={11} />
              <span className="hidden xl:inline">Chart Rays</span>
            </button>
          )}

          {/* Re-Center on Current Price */}
          <button
            onClick={scrollToCurrentPrice}
            title="Pusatkan ke Harga Sekarang"
            className="p-1 hover:bg-[var(--color-bg)] rounded text-[var(--color-text)] hover:`text-[${palette.poc}]` transition-colors cursor-pointer"
          >
            <Crosshair size={13} />
          </button>

          {/* Settings / Context Menu Trigger */}
          <button
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setContextMenu({
                x: Math.max(10, rect.left - 200),
                y: rect.bottom + 5,
                visible: true,
              });
            }}
            title="Pengaturan Kolom DOM"
            className="p-1 hover:bg-[var(--color-bg)] rounded text-[var(--color-text)] hover:`text-[${palette.poc}]` transition-colors cursor-pointer"
          >
            <Settings2 size={13} />
          </button>

          {/* Compact / Expand Toggle */}
          <button
            onClick={() => setIsCompact(!isCompact)}
            title={isCompact ? 'Perluas Tabel DOM' : 'Tampilan Kompak'}
            className="p-1 hover:bg-[var(--color-bg)] rounded text-[var(--color-text)] hover:text-white transition-colors cursor-pointer"
          >
            {isCompact ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
          </button>

          {/* Close Panel Button */}
          <button
            onClick={onClose}
            title="Tutup DOM Ladder"
            className="p-1 `hover:bg-[${palette.bear}15]` rounded text-[var(--color-text-muted)] hover:`text-[${palette.bear}]` transition-colors cursor-pointer"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* 2. Wall Explanation Banner / Summary Bar */}
      <div className="relative bg-zinc-950/40 px-3 py-1.5 border-b border-cyan-900/20 flex items-center justify-between gap-2 text-[10px] font-sans">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {domData.highBidWall && (
            <div 
              className="flex items-center gap-1 px-1.5 py-0.5 rounded border"
              style={{
                borderColor: `${bullColor}60`,
                backgroundColor: `${bullColor}20`,
                color: '#ffffff'
              }}
              title={`Bid Wall: Level antrean beli limit terbesar (${domData.highBidWall.size} limit order) bertindak sebagai zona support likuiditas`}
            >
              <span className="font-black text-[9px] text-black px-1 rounded font-mono" style={{ backgroundColor: bullColor }}>BID WALL</span>
              <span className="font-mono font-bold">${domData.highBidWall.price.toFixed(domData.priceStep >= 0.01 ? 2 : 4)}</span>
              <span className="text-[var(--color-text-muted)] text-[9px]">({domData.highBidWall.size})</span>
            </div>
          )}

          {domData.highAskWall && (
            <div 
              className="flex items-center gap-1 px-1.5 py-0.5 rounded border"
              style={{
                borderColor: `${bearColor}60`,
                backgroundColor: `${bearColor}20`,
                color: '#ffffff'
              }}
              title={`Ask Wall: Level antrean jual limit terbesar (${domData.highAskWall.size} limit order) bertindak sebagai zona resistensi likuiditas`}
            >
              <span className="font-black text-[9px] text-white px-1 rounded font-mono" style={{ backgroundColor: bearColor }}>ASK WALL</span>
              <span className="font-mono font-bold">${domData.highAskWall.price.toFixed(domData.priceStep >= 0.01 ? 2 : 4)}</span>
              <span className="text-[var(--color-text-muted)] text-[9px]">({domData.highAskWall.size})</span>
            </div>
          )}

          {/* POC indicator tag */}
          <div 
            className="flex items-center gap-1 px-1.5 py-0.5 rounded border"
            style={{
              borderColor: `${pocColor}60`,
              backgroundColor: `${pocColor}25`,
              color: pocColor
            }}
            title="Point of Control (poc): Level harga dengan volume transaksi terbanyak di sesi order flow ini"
          >
            <span className="font-black text-[9px] text-black px-1 rounded font-mono" style={{ backgroundColor: pocColor }}>(poc)</span>
            <span className="font-mono font-bold">${domData.pocPrice.toFixed(domData.priceStep >= 0.01 ? 2 : 4)}</span>
          </div>
        </div>
      </div>

      {/* Guide Card Modal / Popover if toggled */}
      {showWallGuide && (
        <div className="bg-[var(--color-panel)] p-3 border-b border-[var(--color-border)] text-[var(--color-text)] text-[11px] font-sans space-y-1.5 shadow-xl animate-fadeIn">
          <div className="flex items-center justify-between font-bold" style={{ color: pocColor }}>
            <span className="flex items-center gap-1"><Info size={13} /> Penjelasan Indikator DOM & Liquidity Walls</span>
            <button onClick={() => setShowWallGuide(false)} className="text-[var(--color-text-muted)] hover:text-white"><X size={12} /></button>
          </div>
          <div className="grid grid-cols-1 gap-1.5 text-[10.5px] leading-relaxed text-[var(--color-text)]">
            <div className="flex items-start gap-1.5 bg-[var(--color-card)] p-1.5 rounded border border-[var(--color-border)]">
              <span className="text-black font-black text-[8.5px] px-1 rounded mt-0.5 shrink-0" style={{ backgroundColor: bullColor }}>BID WALL</span>
              <span><strong>Antrean Beli Tebal:</strong> Kumpulan pesanan beli limit (Bids) berkekuatan besar yang menahan harga agar tidak mudah turun (zona *Support*).</span>
            </div>
            <div className="flex items-start gap-1.5 bg-[var(--color-card)] p-1.5 rounded border border-[var(--color-border)]">
              <span className="text-white font-black text-[8.5px] px-1 rounded mt-0.5 shrink-0" style={{ backgroundColor: bearColor }}>ASK WALL</span>
              <span><strong>Antrean Jual Tebal:</strong> Kumpulan pesanan jual limit (Asks) berkekuatan besar yang menahan laju kenaikan harga (zona *Resistance*).</span>
            </div>
            <div className="flex items-start gap-1.5 bg-[var(--color-card)] p-1.5 rounded border border-[var(--color-border)]">
              <span className="text-black font-black text-[8.5px] px-1 rounded mt-0.5 shrink-0" style={{ backgroundColor: pocColor }}>(poc)</span>
              <span><strong>Point of Control:</strong> Level konsentrasi volume transaksi tereksekusi paling padat di order flow.</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Real-time Live Current Price Bar */}
      {currentPrice !== null && (
        <div 
          className="px-3 py-1.5 flex items-center justify-between border-b text-[10.5px] transition-colors"
          style={
            priceFlash === 'up' 
              ? { backgroundColor: `${bullColor}30`, borderColor: `${bullColor}80`, color: '#ffffff' } 
              : priceFlash === 'down' 
              ? { backgroundColor: `${bearColor}30`, borderColor: `${bearColor}80`, color: '#ffffff' } 
              : { backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }
          }
        >
          <div className="flex items-center gap-2 font-sans">
            <span className="relative flex h-2.5 w-2.5">
              <span 
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ backgroundColor: bullColor }}
              />
              <span 
                className="relative inline-flex rounded-full h-2.5 w-2.5"
                style={{ backgroundColor: bullColor }}
              />
            </span>
            <span className="font-bold tracking-wider text-[10px] uppercase `text-[${palette.poc}]`">Live Price:</span>
            <strong className="text-white font-mono text-[12px] font-black tracking-wide">
              {currentPrice.toFixed(domData.priceStep >= 0.01 ? 2 : 4)}
            </strong>
            {domData.priceDirection === 'up' && (
              <span 
                className="flex items-center font-bold text-[10px] px-1 rounded border"
                style={{ color: bullColor, backgroundColor: `${bullColor}25`, borderColor: `${bullColor}50` }}
              >
                <ArrowUp size={11} className="mr-0.5" /> UP
              </span>
            )}
            {domData.priceDirection === 'down' && (
              <span 
                className="flex items-center font-bold text-[10px] px-1 rounded border"
                style={{ color: bearColor, backgroundColor: `${bearColor}25`, borderColor: `${bearColor}50` }}
              >
                <ArrowDown size={11} className="mr-0.5" /> DOWN
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 text-[10px] font-mono">
            <span>Bid: <strong style={{ color: bullColor }}>{domData.bestBidPrice.toFixed(domData.priceStep >= 0.01 ? 2 : 4)}</strong></span>
            <span>Ask: <strong style={{ color: bearColor }}>{domData.bestAskPrice.toFixed(domData.priceStep >= 0.01 ? 2 : 4)}</strong></span>
          </div>
        </div>
      )}

      {/* 4. Table Column Headers with Expanded Spacing */}
      <div className="bg-zinc-950/60 border-b border-cyan-900/20 grid text-[10px] font-bold text-[var(--color-text-muted)] tracking-wider py-1.5 px-1.5 text-center items-center shadow-xs"
        style={{
          gridTemplateColumns: `
            ${columns.showBuySellSentiment ? '36px ' : ''}
            ${columns.showImbalancePct ? '48px ' : ''}
            ${columns.showBids ? '52px ' : ''}
            ${columns.showPrice ? '76px ' : ''}
            ${columns.showAsks ? '52px ' : ''}
            ${columns.showBuySellVolume ? '114px ' : ''}
            ${columns.showTrades ? '48px ' : ''}
            ${columns.showDelta ? '52px ' : ''}
            ${columns.showCumulativeDelta ? '54px ' : ''}
          `
        }}
      >
        {columns.showBuySellSentiment && <div className="text-[var(--color-text-muted)] font-sans">B/S</div>}
        {columns.showImbalancePct && <div className="text-[var(--color-text-muted)] font-sans">Imb %</div>}
        {columns.showBids && <div style={{ color: bullColor }} className="font-bold">Bids</div>}
        {columns.showPrice && <div className="text-[var(--color-text)] font-bold">Price</div>}
        {columns.showAsks && <div style={{ color: bearColor }} className="font-bold">Asks</div>}
        {columns.showBuySellVolume && <div className="text-[var(--color-text)] font-sans font-bold">DOM Profile</div>}
        {columns.showTrades && <div className="`text-[${palette.poc}]` font-sans">Trades</div>}
        {columns.showDelta && <div className="`text-[${palette.poc}]` font-sans">Delta</div>}
        {columns.showCumulativeDelta && <div className="text-indigo-300 font-sans">Cum.D</div>}
      </div>

      {/* 5. DOM Table Rows with High-Contrast Thick Visual Profiles */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden divide-y divide-cyan-900/10 custom-scrollbar"
      >
        {domData.rows.map((row, idx) => {
          const isPoc = row.isPoc;
          const isBestBid = row.isBestBid;
          const isBestAsk = row.isBestAsk;
          const isCurrentPrice = row.isCurrentPrice;

          // Buy/Sell Volume split bar ratio & Dynamic Opacity based on DOM Values
          const volRatio = domData.maxVolume > 0 ? row.totalVolume / domData.maxVolume : 0;
          const buyRatio = row.totalVolume > 0 ? row.buyVolume / row.totalVolume : 0.5;
          const dynamicVolOpacity = isPoc ? 1.0 : Math.max(0.32, Math.min(0.95, 0.32 + volRatio * 0.68));

          // Trades ratio & opacity
          const tradesRatio = domData.maxTrades > 0 ? row.trades / domData.maxTrades : 0;
          const dynamicTradesOpacity = row.isPeakTrades ? 1.0 : Math.max(0.35, Math.min(0.90, 0.35 + tradesRatio * 0.65));

          // Delta ratio & opacity
          const deltaRatio = domData.maxDelta > 0 ? Math.abs(row.delta) / domData.maxDelta : 0;
          const dynamicDeltaOpacity = Math.max(0.35, Math.min(0.95, 0.35 + deltaRatio * 0.65));
          const isPositiveDelta = row.delta >= 0;

          return (
            <div
              key={idx}
              data-current-price={isCurrentPrice ? 'true' : 'false'}
              className={`grid text-[11px] items-center text-center py-1 px-1.5 min-h-[26px] hover:bg-cyan-900/20 transition-colors relative ${
                isCurrentPrice
                  ? 'bg-cyan-900/30 ring-1 `ring-[${palette.poc}]` shadow-[0_0_10px_rgba(8,145,178,0.3)] z-10 font-bold'
                  : isPoc 
                  ? '`bg-[${palette.poc}15]`' 
                  : idx % 2 === 0 
                  ? 'bg-transparent' 
                  : 'bg-zinc-900/20'
              }`}
              style={{
                gridTemplateColumns: `
                  ${columns.showBuySellSentiment ? '36px ' : ''}
                  ${columns.showImbalancePct ? '48px ' : ''}
                  ${columns.showBids ? '52px ' : ''}
                  ${columns.showPrice ? '76px ' : ''}
                  ${columns.showAsks ? '52px ' : ''}
                  ${columns.showBuySellVolume ? '114px ' : ''}
                  ${columns.showTrades ? '48px ' : ''}
                  ${columns.showDelta ? '52px ' : ''}
                  ${columns.showCumulativeDelta ? '54px ' : ''}
                `
              }}
            >
              {/* 1. Buy/Sell Sentiment Indicator */}
              {columns.showBuySellSentiment && (
                <div className="flex items-center justify-center text-[9.5px]">
                  {row.imbalancePct > 55 ? (
                    <span 
                      className="font-extrabold px-1.5 py-0.5 rounded text-[9px] border"
                      style={{
                        backgroundColor: `${bullColor}25`,
                        color: bullColor,
                        borderColor: `${bullColor}60`
                      }}
                    >
                      B
                    </span>
                  ) : row.imbalancePct < 45 ? (
                    <span 
                      className="font-extrabold px-1.5 py-0.5 rounded text-[9px] border"
                      style={{
                        backgroundColor: `${bearColor}25`,
                        color: bearColor,
                        borderColor: `${bearColor}60`
                      }}
                    >
                      S
                    </span>
                  ) : (
                    <span className="text-[var(--color-text-muted)]/60">-</span>
                  )}
                </div>
              )}

              {/* 2. Imbalance % */}
              {columns.showImbalancePct && (
                <div 
                  className="text-[10px] font-semibold font-mono"
                  style={{ color: row.imbalancePct >= 50 ? bullColor : bearColor }}
                >
                  {row.imbalancePct.toFixed(1)}%
                </div>
              )}

              {/* 3. Bids Liquidity Queue with Explicit WALL Explanatory Tag */}
              {columns.showBids && (
                <div className="relative h-5 flex items-center justify-center px-0.5">
                  {row.bidDepth !== null && (
                    <div 
                      className={`w-full h-full flex items-center justify-center gap-1 rounded text-[10px] font-bold transition-all duration-300 ${
                        row.isMaxBidWall ? 'animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]' : ''
                      }`}
                      style={{
                        backgroundColor: row.isMaxBidWall ? bullColor : row.isHighBidLiquidity ? `${bullColor}50` : `${bullColor}20`,
                        color: row.isMaxBidWall ? '#000000' : '#ffffff',
                        border: `1px solid ${row.isMaxBidWall ? '#ffffff' : `${bullColor}50`}`
                      }}
                      title={
                        row.isMaxBidWall 
                          ? `BID WALL: Level antrean beli tertebal (${row.bidDepth ? formatValueShorthand(row.bidDepth, false) : ""} LMT) bertindak sebagai Support`
                          : row.isHighBidLiquidity
                          ? `High Bid Liquidity (${row.bidDepth ? formatValueShorthand(row.bidDepth, false) : ""} LMT)`
                          : `Bid Depth: ${row.bidDepth ? formatValueShorthand(row.bidDepth, false) : ""} LMT`
                      }
                    >
                      {row.isMaxBidWall && (
                        <span className="text-[7.5px] uppercase tracking-tighter bg-black px-0.5 rounded font-black animate-ping" style={{ color: bullColor }}>
                          WALL
                        </span>
                      )}
                      <span>{row.bidDepth ? formatValueShorthand(row.bidDepth, false) : ""}</span>
                    </div>
                  )}
                </div>
              )}

              {/* 4. Price Column with (poc) and Real-time Markers */}
              {columns.showPrice && (
                <div className="relative flex items-center justify-center py-0.5">
                  {isPoc ? (
                    <div 
                      className="w-full text-black font-black px-1 py-0.5 rounded text-[10.5px] shadow-sm flex items-center justify-center gap-1 border"
                      style={{ backgroundColor: pocColor, borderColor: '#ffffff' }}
                    >
                      <span>{row.formattedPrice}</span>
                      <span className="text-[8px] bg-black px-1 py-0.2 rounded font-black tracking-tight uppercase" style={{ color: pocColor }}>
                        (poc)
                      </span>
                    </div>
                  ) : isCurrentPrice ? (
                    <div 
                      className="w-full border-2 px-1 py-0.5 rounded text-[11px] font-black shadow-sm flex items-center justify-center gap-1"
                      style={{ backgroundColor: `${palette.bull}30`, borderColor: palette.bull, color: '#ffffff' }}
                    >
                      <span className="animate-pulse w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: palette.bull }} />
                      <span>{row.formattedPrice}</span>
                    </div>
                  ) : isBestAsk ? (
                    <div 
                      className="w-full border px-1 py-0.5 rounded text-[10.5px] font-bold"
                      style={{
                        color: '#ffffff',
                        backgroundColor: `${bearColor}35`,
                        borderColor: `${bearColor}80`
                      }}
                    >
                      {row.formattedPrice}
                    </div>
                  ) : isBestBid ? (
                    <div 
                      className="w-full border px-1 py-0.5 rounded text-[10.5px] font-bold"
                      style={{
                        color: '#ffffff',
                        backgroundColor: `${bullColor}35`,
                        borderColor: `${bullColor}80`
                      }}
                    >
                      {row.formattedPrice}
                    </div>
                  ) : (
                    <div className="text-[var(--color-text)] text-[10.5px] font-medium">
                      {row.formattedPrice}
                    </div>
                  )}
                </div>
              )}

              {/* 5. Asks Liquidity Queue with Explicit WALL Explanatory Tag */}
              {columns.showAsks && (
                <div className="relative h-5 flex items-center justify-center px-0.5">
                  {row.askDepth !== null && (
                    <div 
                      className={`w-full h-full flex items-center justify-center gap-1 rounded text-[10px] font-bold transition-all duration-300 ${
                        row.isMaxAskWall ? 'animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.6)]' : ''
                      }`}
                      style={{
                        backgroundColor: row.isMaxAskWall ? bearColor : row.isHighAskLiquidity ? `${bearColor}50` : `${bearColor}20`,
                        color: '#ffffff',
                        border: `1px solid ${row.isMaxAskWall ? '#ffffff' : `${bearColor}50`}`
                      }}
                      title={
                        row.isMaxAskWall 
                          ? `ASK WALL: Level antrean jual tertebal (${row.askDepth ? formatValueShorthand(row.askDepth, false) : ""} LMT) bertindak sebagai Resistance`
                          : row.isHighAskLiquidity
                          ? `High Ask Liquidity (${row.askDepth ? formatValueShorthand(row.askDepth, false) : ""} LMT)`
                          : `Ask Depth: ${row.askDepth ? formatValueShorthand(row.askDepth, false) : ""} LMT`
                      }
                    >
                      {row.isMaxAskWall && (
                        <span className="text-[7.5px] uppercase tracking-tighter bg-black px-0.5 rounded font-black animate-ping" style={{ color: bearColor }}>
                          WALL
                        </span>
                      )}
                      <span>{row.askDepth ? formatValueShorthand(row.askDepth, false) : ""}</span>
                    </div>
                  )}
                </div>
              )}

              {/* 6. DOM Volume Profile Column (Authentic Stepped Horizontal Profile with Value-Scaled Opacity) */}
              {columns.showBuySellVolume && (
                <div className="relative h-5 flex items-center justify-end px-1 overflow-hidden">
                  {/* Subtle Profile Track Background */}
                  <div className="absolute inset-y-1 inset-x-1 rounded-xs border border-[var(--color-border)]/30" style={{ backgroundColor: 'color-mix(in srgb, var(--color-bg) 60%, transparent)' }} />

                  {/* Dynamic Length Horizontal Profile Bar (Panjang-Pendek) */}
                  <div 
                    className={`absolute inset-y-1 right-1 flex rounded-xs overflow-hidden transition-all duration-100 ${
                      isPoc 
                        ? 'ring-1 shadow-sm' 
                        : row.isPeakVolume 
                        ? 'ring-1' 
                        : ''
                    }`}
                    style={{ 
                      width: `${Math.max(4, Math.round(volRatio * 100))}%`,
                      border: isPoc ? `1px solid ${pocColor}` : '1px solid rgba(255, 255, 255, 0.12)',
                      boxShadow: isPoc ? `0 0 8px ${pocColor}50` : undefined
                    }}
                  >
                    {/* Sell Volume Horizontal Portion (Red/Bear with Value-Based Opacity) */}
                    <div 
                      className="h-full transition-all duration-100" 
                      style={{ 
                        width: `${(1 - buyRatio) * 100}%`,
                        backgroundColor: bearColor,
                        opacity: dynamicVolOpacity
                      }} 
                    />
                    {/* Buy Volume Horizontal Portion (Green/Bull with Value-Based Opacity) */}
                    <div 
                      className="h-full transition-all duration-100" 
                      style={{ 
                        width: `${buyRatio * 100}%`,
                        backgroundColor: bullColor,
                        opacity: dynamicVolOpacity
                      }} 
                    />
                  </div>

                  {/* High Contrast Volume Value Label */}
                  <span 
                    className={`relative z-10 text-[9.5px] font-mono font-bold tracking-tight select-none px-1 py-0.2 rounded-xs ${
                      isPoc
                        ? 'text-black font-black shadow-md'
                        : row.isPeakVolume 
                        ? 'text-black font-black' 
                        : 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]'
                    }`}
                    style={isPoc ? { backgroundColor: pocColor } : row.isPeakVolume ? { backgroundColor: `${pocColor}dd` } : undefined}
                  >
                    {formatValueShorthand(row.totalVolume, false)}
                  </span>
                </div>
              )}

              {/* 7. Trades Column with Stepped Length & Value-Based Opacity */}
              {columns.showTrades && (
                <div className="relative h-5 flex items-center justify-end px-1 overflow-hidden">
                  <div className="absolute inset-y-1 inset-x-1 rounded-xs border border-[var(--color-border)]/30" style={{ backgroundColor: 'color-mix(in srgb, var(--color-bg) 40%, transparent)' }} />
                  <div 
                    className="absolute inset-y-1 right-1 rounded-xs transition-all duration-100"
                    style={{ 
                      width: `${Math.max(4, Math.round(tradesRatio * 100))}%`,
                      backgroundColor: row.isPeakTrades ? pocColor : palette.bull,
                      opacity: dynamicTradesOpacity,
                      border: `1px solid ${palette.bull}30`
                    }}
                  />
                  <span 
                    className="relative z-10 text-[9.5px] font-mono font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] px-1"
                    style={row.isPeakTrades ? { backgroundColor: pocColor, color: '#000000', fontWeight: 900, borderRadius: '2px' } : { color: 'var(--color-text)' }}
                  >
                    {formatValueShorthand(row.trades, false)}
                  </span>
                </div>
              )}

              {/* 8. Delta Column with Stepped Horizontal Length & Value-Based Opacity */}
              {columns.showDelta && (
                <div className="relative h-5 flex items-center justify-end px-1 overflow-hidden">
                  <div className="absolute inset-y-1 inset-x-1 rounded-xs border border-[var(--color-border)]/30" style={{ backgroundColor: 'color-mix(in srgb, var(--color-bg) 40%, transparent)' }} />
                  <div 
                    className="absolute inset-y-1 right-1 rounded-xs shadow-xs transition-all duration-100"
                    style={{ 
                      width: `${Math.max(4, Math.round(deltaRatio * 100))}%`,
                      backgroundColor: isPositiveDelta ? bullColor : bearColor,
                      opacity: dynamicDeltaOpacity,
                      border: `1px solid ${isPositiveDelta ? bullColor : bearColor}30`
                    }}
                  />
                  {row.isPeakDeltaImbalance && !isPositiveDelta ? (
                    <span 
                      className="relative z-10 text-black px-1.5 py-0.5 rounded-xs text-[9px] font-black shadow-sm"
                      style={{ backgroundColor: pocColor }}
                    >
                      {row.delta}
                    </span>
                  ) : (
                    <span 
                      className="relative z-10 text-[9.5px] font-mono font-black drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] px-1"
                      style={{ color: isPositiveDelta ? bullColor : bearColor }}
                    >
                      {isPositiveDelta ? '+' : ''}{row.delta}
                    </span>
                  )}
                </div>
              )}

              {/* 9. Cumulative Delta */}
              {columns.showCumulativeDelta && (
                <div 
                  className="text-[9.5px] text-right px-1.5 font-mono font-bold"
                  style={{ color: row.cumulativeDelta >= 0 ? bullColor : bearColor }}
                >
                  {row.cumulativeDelta > 0 ? '+' : ''}{row.cumulativeDelta.toLocaleString()}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 6. Bottom Order Flow Summary Bar */}
      <div className="relative bg-zinc-950/60 border-t border-cyan-900/30 px-3 py-2 flex items-center justify-between text-[10.5px] text-[var(--color-text)] font-sans shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span>(poc): <strong className="font-mono font-bold" style={{ color: pocColor }}>${domData.pocPrice.toFixed(domData.priceStep >= 0.01 ? 2 : 4)}</strong></span>
          <span className="text-[var(--color-text-muted)]">|</span>
          <span>Max V: <strong className="text-[var(--color-text)] font-mono font-semibold">{formatValueShorthand(domData.maxVolume, false)}</strong></span>
        </div>
        <div className="flex items-center gap-1 font-mono text-[10px]">
          <span 
            className="font-bold px-1.5 py-0.5 rounded border"
            style={{ backgroundColor: `${bullColor}20`, color: bullColor, borderColor: `${bullColor}50` }}
          >
            ▲ {formatValueShorthand(domData.totalBuyVol, false)}
          </span>
          <span 
            className="font-bold px-1.5 py-0.5 rounded border"
            style={{ backgroundColor: `${bearColor}20`, color: bearColor, borderColor: `${bearColor}50` }}
          >
            ▼ {formatValueShorthand(domData.totalSellVol, false)}
          </span>
        </div>
      </div>

      {/* 7. Context Menu & Settings Modal */}
      {contextMenu && contextMenu.visible && (
        <div
          ref={menuRef}
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="absolute z-50 w-56 bg-zinc-950/95 backdrop-blur-xl border border-cyan-900/40 rounded-xl shadow-[0_0_20px_rgba(8,145,178,0.2)] py-1 text-xs text-[var(--color-text)] font-sans divide-y divide-cyan-900/20"
        >
          <div className="px-3 py-1.5 font-bold text-[11px] `text-[${palette.poc}]` flex items-center justify-between">
            <span>DOM Column Settings</span>
            <TableProperties size={12} />
          </div>

          <div className="py-1 space-y-0.5">
            <button
              onClick={() => toggleColumn('showBuySellSentiment')}
              className="w-full text-left px-3 py-1 hover:bg-cyan-900/30 flex items-center justify-between cursor-pointer text-white"
            >
              <span>Buy/Sell Sentiment</span>
              {columns.showBuySellSentiment && <Check size={13} className="text-emerald-400" />}
            </button>

            <button
              onClick={() => toggleColumn('showImbalancePct')}
              className="w-full text-left px-3 py-1 hover:bg-cyan-900/30 flex items-center justify-between cursor-pointer text-white"
            >
              <span>Imbalance, %</span>
              {columns.showImbalancePct && <Check size={13} className="text-emerald-400" />}
            </button>

            <button
              onClick={() => toggleColumn('showBids')}
              className="w-full text-left px-3 py-1 hover:bg-cyan-900/30 flex items-center justify-between cursor-pointer text-white"
            >
              <span>Bids Liquidity</span>
              {columns.showBids && <Check size={13} className="text-emerald-400" />}
            </button>

            <button
              onClick={() => toggleColumn('showPrice')}
              className="w-full text-left px-3 py-1 hover:bg-cyan-900/30 flex items-center justify-between cursor-pointer text-white"
            >
              <span>Price Scale</span>
              {columns.showPrice && <Check size={13} className="text-emerald-400" />}
            </button>

            <button
              onClick={() => toggleColumn('showAsks')}
              className="w-full text-left px-3 py-1 hover:bg-cyan-900/30 flex items-center justify-between cursor-pointer text-white"
            >
              <span>Asks Liquidity</span>
              {columns.showAsks && <Check size={13} className="text-emerald-400" />}
            </button>

            <button
              onClick={() => toggleColumn('showBuySellVolume')}
              className="w-full text-left px-3 py-1 hover:bg-cyan-900/30 flex items-center justify-between cursor-pointer text-white"
            >
              <span>Volume Profile</span>
              {columns.showBuySellVolume && <Check size={13} className="text-emerald-400" />}
            </button>

            <button
              onClick={() => toggleColumn('showTrades')}
              className="w-full text-left px-3 py-1 hover:bg-cyan-900/30 flex items-center justify-between cursor-pointer text-white"
            >
              <span>Trades Count</span>
              {columns.showTrades && <Check size={13} className="text-emerald-400" />}
            </button>

            <button
              onClick={() => toggleColumn('showDelta')}
              className="w-full text-left px-3 py-1 hover:bg-cyan-900/30 flex items-center justify-between cursor-pointer text-white"
            >
              <span>Delta Profile</span>
              {columns.showDelta && <Check size={13} className="text-emerald-400" />}
            </button>

            <button
              onClick={() => toggleColumn('showCumulativeDelta')}
              className="w-full text-left px-3 py-1 hover:bg-cyan-900/30 flex items-center justify-between cursor-pointer text-white"
            >
              <span>Cumulative Delta</span>
              {columns.showCumulativeDelta && <Check size={13} className="text-emerald-400" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default OrderFlowDomLadder;
