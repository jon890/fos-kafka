import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { TradingType } from 'src/constants/trading-type.const';
import { CancelTradingEventParam } from 'src/dto/cancel-trading-event-param';
import { CreateBuyDto } from 'src/dto/create-buy.dto';
import { CreateSellDto } from 'src/dto/create-sell.dto';
import { TradingPubService } from './trading-pub.service';

@Controller('/trading')
export class TradingPubController {
  constructor(private readonly service: TradingPubService) {}

  @Post('/buy')
  emitBuyEvent(@Body() dto: CreateBuyDto) {
    dto.tradingType = TradingType.BUYING;
    this.service.emitEvent(dto);
    return 'emit buy event';
  }

  @Post('/sell')
  emitSellEvent(@Body() dto: CreateSellDto) {
    dto.tradingType = TradingType.SELLING;
    this.service.emitEvent(dto);
    return 'emit sell event';
  }

  @Delete('/buy/:key/:userId')
  emitCancelBuyEvent(
    @Param('key') key: string,
    @Param('userId') userId: string,
  ) {
    const param: CancelTradingEventParam = {
      userId, // todo from access token
      timestamp: key,
      tradingType: TradingType.CANCEL_BUYING,
    };
    this.service.emitEvent(param);
    return 'emit cancel buy event';
  }

  @Delete('/sell/:key/:userId')
  emitCancelSellEvent(
    @Param('key') key: string,
    @Param('userId') userId: string,
  ) {
    const param: CancelTradingEventParam = {
      userId, // todo from access token
      timestamp: key,
      tradingType: TradingType.CANCEL_SELLING,
    };
    this.service.emitEvent(param);
    return 'emit cancel sell event';
  }
}
