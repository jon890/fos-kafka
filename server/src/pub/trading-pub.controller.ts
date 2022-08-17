import { Body, Controller, Post } from '@nestjs/common';
import { CreateBuyDto } from 'src/dto/create-buy.dto';
import { CreateSellDto } from 'src/dto/create-sell.dto';
import { TradingPubService } from './trading-pub.service';

@Controller('/trading')
export class TradingPubController {
  constructor(private readonly service: TradingPubService) {}

  @Post('/buy')
  emitBuyEvent(@Body() dto: CreateBuyDto) {
    this.service.emitBuyEvent(dto);
    return 'emit buy event';
  }

  @Post('/sell')
  emitSellEvent(@Body() dto: CreateSellDto) {
    this.service.emitSellEvent(dto);
    return 'emit sell event';
  }
}
