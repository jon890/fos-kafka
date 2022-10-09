import { TRADING_KEYPAIR_MTK } from 'src/constants/redis-key.const';
import { TradingType } from 'src/constants/trading-type.const';
import { ResourceTrader, Trader } from './matching-request.dto';

export class TradingPendingItem {
  id: string;

  userId: string;

  tradingType: TradingType;

  amount: number;

  price: number;

  category: string;

  type?: number;

  constructor(
    id: string,
    category: string,
    partial: Partial<TradingPendingItem>,
  ) {
    Object.assign(this, partial);
    this.id = id;
    this.category = category;
    this.amount = Number(this.amount);
    this.price = Number(this.price);
  }

  toTrader(): Trader | ResourceTrader {
    if (this.category === TRADING_KEYPAIR_MTK.NAME) {
      return {
        id: this.id,
        userId: this.userId,
        amount: this.amount,
        price: this.price,
      };
    } else {
      return {
        id: this.id,
        userId: this.userId,
        amount: this.amount,
        price: this.price,
      };
    }
  }
}
