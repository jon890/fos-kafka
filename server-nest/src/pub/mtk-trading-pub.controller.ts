import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TradingCategory, TradingType } from 'src/constants/trading-type.const';
import { CancelTradingEventParam } from 'src/dto/cancel-trading-event-param';
import { CreateTradingDto } from 'src/dto/create-trading.dto';
import { TradingPubService } from './trading-pub.service';

/**
 * 트레이딩 이벤트를 방출하는 컨트롤러
 */
@ApiTags('MTK Trading Event')
@Controller('trading/mtk')
export class MTKTradingPubController {
  constructor(private readonly service: TradingPubService) {}

  @Post('/buy')
  emitBuyEvent(@Body() dto: CreateTradingDto) {
    this.service.emitEvent({
      ...dto,
      tradingType: TradingType.BUYING,
      tradingCategory: TradingCategory.MTK,
    });
    return 'emit buy event';
  }

  @Post('/sell')
  emitSellEvent(@Body() dto: CreateTradingDto) {
    this.service.emitEvent({
      ...dto,
      tradingType: TradingType.SELLING,
      tradingCategory: TradingCategory.MTK,
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
      tradingCategory: TradingCategory.MTK,
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
      tradingCategory: TradingCategory.MTK,
    };
    this.service.emitEvent(param);
    return 'emit cancel sell event';
  }
}
