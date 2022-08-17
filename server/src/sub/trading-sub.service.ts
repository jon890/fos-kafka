import { Injectable } from '@nestjs/common';
import { TradingRepository } from './trading.repository';

@Injectable()
export class TradingSubService {
  constructor(private readonly repository: TradingRepository) {}

  pushEvent(data: any) {
    return this.repository.pushEvent(data);
  }
}
