import { TradingCategory, TradingType } from 'src/constants/trading-type.const';

export interface CancelTradingEventParam {
  userId: string;
  tradingType: TradingType;
  timestamp: string;
  tradingCategory: TradingCategory;
}
