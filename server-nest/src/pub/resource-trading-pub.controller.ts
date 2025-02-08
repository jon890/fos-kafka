import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TradingCategory, TradingType } from 'src/constants/trading-type.const';
import { CancelTradingEventParam } from 'src/dto/cancel-trading-event-param';
import { CreateResourceTradingDto } from 'src/dto/create-trading.dto';
import { TradingPubService } from './trading-pub.service';

/**
 * 트레이딩 이벤트를 방출하는 컨트롤러
 */
@ApiTags('Resource Trading Event')
@Controller('trading/resource')
export class ResourceTradingPubController {
  constructor(private readonly service: TradingPubService) {}

  @Post('/buy')
  emitBuyEvent(@Body() dto: CreateResourceTradingDto) {
    // console.log(dto);
    this.service.emitEvent({
      ...dto,
      tradingType: TradingType.BUYING,
      tradingCategory: TradingCategory.RESOURCE,
    });
    return 'emit buy event';
  }

  @Post('/sell')
  emitSellEvent(@Body() dto: CreateResourceTradingDto) {
    this.service.emitEvent({
      ...dto,
      tradingType: TradingType.SELLING,
      tradingCategory: TradingCategory.RESOURCE,
    });
    return 'emit sell event';
  }

  @Delete('/buy/:key/:userId')
  emitCancelBuyEvent(
    @Param('key') key: string,
    @Param('userId') userId: string,
  ) {
    const param: CancelTradingEventParam = {
      userId,
      timestamp: key,
      tradingType: TradingType.CANCEL_BUYING,
      tradingCategory: TradingCategory.RESOURCE,
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
      userId,
      timestamp: key,
      tradingType: TradingType.CANCEL_SELLING,
      tradingCategory: TradingCategory.RESOURCE,
    };
    this.service.emitEvent(param);
    return 'emit cancel sell event';
  }
}
