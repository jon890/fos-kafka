import { TradingType } from 'src/constants/trading-type.const';

export class TradingPendingResponseDto {
  timestamp: string;
  userId: string;
  amount: number;
  price: number;
  tradingType: TradingType;
  type: number;

  constructor(partial: Partial<TradingPendingResponseDto>) {
    Object.assign(this, partial);
  }
}
