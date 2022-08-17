import { Controller, Post } from '@nestjs/common';
import { TradingPubService } from './trading-pub.service';

@Controller('/trading')
export class TradingPubController {
  constructor(private readonly service: TradingPubService) {}

  @Post('/buy')
  emitBuy() {
    this.service.emitBuy().subscribe();
    return 'emit buy event';
  }
}
