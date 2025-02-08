import { BaseCreateTradingDto } from './base-create-trading.dto';

export class CreateSellDto extends BaseCreateTradingDto {
  constructor(partial: Partial<CreateSellDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}
