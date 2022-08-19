import { ApiProperty } from '@nestjs/swagger';
import { TradingType } from 'src/constants/trading-type.const';

export class BaseCreateTradingDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  tradingType: TradingType;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  salePrice: number;

  constructor(partial: Partial<BaseCreateTradingDto>) {
    Object.assign(this, partial);
  }
}
