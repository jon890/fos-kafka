import { BaseCreateTradingDto } from './base-create-trading.dto';

export class CreateBuyDto extends BaseCreateTradingDto {
  constructor(partial: Partial<CreateBuyDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}
