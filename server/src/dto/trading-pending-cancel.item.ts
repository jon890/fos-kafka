import { TradingPendingItem } from './trading-pending.item';

export class TradingPendingCancelItem extends TradingPendingItem {
  timestamp?: string;

  constructor(
    id: string,
    category: string,
    partial: Partial<TradingPendingCancelItem>,
  ) {
    super(id, category, partial);
  }
}
