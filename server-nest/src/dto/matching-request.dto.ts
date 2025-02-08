import { TradingType } from 'src/constants/trading-type.const';

export class MatchingRequesDto {
  tradingType: TradingType;

  type?: number;

  buyers: Trader[];

  sellers: Trader[];
}

export interface Trader {
  id: string;

  userId: string;

  amount: number;

  price: number;
}

export interface ResourceTrader extends Trader {
  type: number;
}
