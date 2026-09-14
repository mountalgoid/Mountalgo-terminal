export function formatValueShorthand(val: number | undefined | null, isCurrency = false): string {
  if (val === undefined || val === null) return '';
  const absV = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  const pre = isCurrency ? '$' : '';
  if (absV >= 1e9) {
    const formatted = absV / 1e9;
    const value = formatted >= 100 ? Math.round(formatted) : parseFloat(formatted.toFixed(2));
    return `${sign}${pre}${value}B`;
  }
  if (absV >= 1e6) {
    const formatted = absV / 1e6;
    const value = formatted >= 100 ? Math.round(formatted) : parseFloat(formatted.toFixed(2));
    return `${sign}${pre}${value}M`;
  }
  if (absV >= 1e3) {
    const formatted = absV / 1e3;
    const value = formatted >= 100 ? Math.round(formatted) : parseFloat(formatted.toFixed(2));
    return `${sign}${pre}${value}K`;
  }
  return `${sign}${pre}${parseFloat(absV.toFixed(2))}`;
}

export function formatPriceShorthand(price: number | undefined | null, isCurrency = true): string {
  if (price === undefined || price === null || isNaN(price)) return '';
  return formatSmartPrice(price, isCurrency);
}

/**
 * Super Intelligent Multi-Asset High-Precision Price Formatter
 * Dynamically selects sub-cent, sub-pip, or standard notation without truncating micro-decimals.
 */
export function formatSmartPrice(price: number | undefined | null, isCurrency = true, symbol?: string): string {
  if (price === undefined || price === null || isNaN(price)) return '—';
  if (price === 0) return isCurrency ? '$0.00' : '0.00';

  const absP = Math.abs(price);
  const sign = price < 0 ? '-' : '';
  const pre = isCurrency ? '$' : '';

  const cleanSym = (symbol || '').toUpperCase();
  const isJpyForex = cleanSym.includes('JPY');
  const isForex = cleanSym.includes('EUR') || cleanSym.includes('GBP') || cleanSym.includes('AUD') || 
                  cleanSym.includes('NZD') || cleanSym.includes('CAD') || cleanSym.includes('CHF') || 
                  cleanSym.includes('USD') && (cleanSym.length === 6 && !cleanSym.endsWith('USDT'));

  // Forex Pip & Fractional Pipette formatting
  if (isForex && absP < 500) {
    if (isJpyForex) {
      return `${sign}${pre}${absP.toFixed(3)}`;
    }
    return `${sign}${pre}${absP.toFixed(5)}`;
  }

  // Micro-Cent / Sub-Cent Tokens (e.g. Memecoins PEPE, SHIB, FLOKI, 1000SATS, MEXC new gems)
  if (absP < 0.000001) {
    // 8 decimal precision for nano-tokens
    return `${sign}${pre}${absP.toFixed(8)}`;
  }
  if (absP < 0.0001) {
    // 7 decimal precision
    return `${sign}${pre}${absP.toFixed(7)}`;
  }
  if (absP < 0.01) {
    // 6 decimal precision
    return `${sign}${pre}${absP.toFixed(6)}`;
  }
  if (absP < 1.0) {
    // 4 to 5 decimal precision
    return `${sign}${pre}${absP.toFixed(4)}`;
  }
  if (absP < 10.0) {
    // 3 to 4 decimal precision
    return `${sign}${pre}${absP.toFixed(3)}`;
  }
  if (absP < 1000.0) {
    // 2 decimal standard precision
    return `${sign}${pre}${absP.toFixed(2)}`;
  }

  // Large price assets (BTC, Gold, Indices, Stocks) with thousand separator
  const formattedWithCommas = absP.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return `${sign}${pre}${formattedWithCommas}`;
}

/**
 * Format dynamic pip difference or price spread percentage with high precision
 */
export function formatSpreadOrChange(val: number | undefined | null, isPercent = true): string {
  if (val === undefined || val === null || isNaN(val)) return '0.00%';
  const sign = val > 0 ? '+' : '';
  const formatted = val.toFixed(2);
  return `${sign}${formatted}${isPercent ? '%' : ''}`;
}

export function formatVol(v: number): string {
  return formatValueShorthand(v, false);
}
