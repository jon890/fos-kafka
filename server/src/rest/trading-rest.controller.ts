import { Controller, Post } from '@nestjs/common';
import { TradingService } from '../trading/trading.service';

@Controller('/trading')
export class TradingRestController {
  constructor(private readonly tradingService: TradingService) {}

  @Post('/buy')
  async emitBuy() {
    this.tradingService.emitBuy();
    return 'EMIT BUY EVENT';
  }
}
