import { ApiProperty } from '@nestjs/swagger';
import { TradingType } from 'src/constants/trading-type.const';

export class BaseCreateTradingDto {
  @ApiProperty()
  tradingType: TradingType;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  userId: string;

  constructor(partial: Partial<BaseCreateTradingDto>) {
    Object.assign(this, partial);
  }
}
