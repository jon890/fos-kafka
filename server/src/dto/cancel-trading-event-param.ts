import { TradingType } from 'src/constants/trading-type.const';

export interface CancelTradingEventParam {
  userId: string;
  tradingType: TradingType;
  key: string;
}
