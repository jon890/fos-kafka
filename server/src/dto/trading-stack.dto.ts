import { TRADING_KEYPAIR_MTK } from 'src/constants/redis-key.const';
import { TradingType, TradingTypeUtil } from 'src/constants/trading-type.const';
import { ResourceTrader, Trader } from './matching-request.dto';

export class TradingStackDto {
  id: string;

  userId: string;

  tradingType: TradingType;

  amount: number;

  price: number;

  type?: number;

  category: string;

  constructor(partial: Partial<TradingStackDto>) {
    Object.assign(this, partial);
  }

  compare(o: TradingStackDto) {
    TradingTypeUtil.assertInTradingStack(this.tradingType);
    TradingTypeUtil.assertInTradingStack(o.tradingType);

    if (this.tradingType !== o.tradingType) {
      throw new Error(
        `서로 거래 타입이 다릅니다 비교할 수 없습니다! ===> a:${this.tradingType}, b:${o.tradingType}`,
      );
    }

    const aPrice = Number(this.price);
    const bPrice = Number(o.price);

    const aTimestamp = Number(this.id.split('-').join(''));
    const bTimestamp = Number(o.id.split('-').join(''));

    if (this.tradingType === TradingType.BUYING) {
      if (aPrice - bPrice < Number.EPSILON) {
        return 1;
      } else if (aPrice - bPrice > Number.EPSILON) {
        return -1;
      } else {
        return aTimestamp - bTimestamp;
      }
    } else if (this.tradingType === TradingType.SELLING) {
      if (aPrice - bPrice > Number.EPSILON) {
        return 1;
      } else if (aPrice - bPrice < Number.EPSILON) {
        return -1;
      } else {
        return aTimestamp - bTimestamp;
      }
    }
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
