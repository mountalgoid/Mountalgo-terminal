import { useState, useCallback, useEffect } from 'react';
import { RiskSettings, TradeOrder, OrderStatus } from '../../types/trading';

const DEFAULT_RISK_SETTINGS: RiskSettings = {
  maxDailyDrawdown: 5, // 5%
  maxLeverage: 10,
  maxPositionSize: 100000, // $100k
  autoLiquidateEnabled: false,
  stopLossDefaultPips: 20,
  takeProfitDefaultPips: 60,
};

export function useRiskManager(balance: number, equity: number, orders?: TradeOrder[]) {
  const [settings, setSettings] = useState<RiskSettings>(DEFAULT_RISK_SETTINGS);

  const currentDrawdown = balance > 0 ? Math.max(0, ((balance - equity) / balance) * 100) : 0;
  const isRiskExceeded = settings.maxDailyDrawdown > 0 && currentDrawdown >= settings.maxDailyDrawdown;

  const validateOrder = useCallback((order: Partial<TradeOrder>): { valid: boolean; reason?: string } => {
    if (isRiskExceeded && settings.autoLiquidateEnabled) {
      return { valid: false, reason: 'Risk limit exceeded: Daily Max Drawdown reached.' };
    }

    if (order.amount && order.price) {
      const totalValue = order.amount * order.price;
      if (totalValue > settings.maxPositionSize) {
        return { valid: false, reason: `Order size $${totalValue.toLocaleString()} exceeds max position size $${settings.maxPositionSize.toLocaleString()}.` };
      }
    }

    return { valid: true };
  }, [isRiskExceeded, settings]);

  return {
    settings,
    setSettings,
    currentDrawdown,
    isRiskExceeded,
    validateOrder,
  };
}
