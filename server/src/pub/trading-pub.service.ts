import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientRedis } from '@nestjs/microservices';
import { tap } from 'rxjs';
import { EVENT_NAME } from 'src/constants/event-name.const';
import { INJECT_TOKEN } from 'src/constants/inject.token';
import { CreateBuyDto } from 'src/dto/create-buy.dto';
import { CreateSellDto } from 'src/dto/create-sell.dto';

@Injectable()
export class TradingPubService {
  private logger = new Logger(TradingPubService.name);

  constructor(
    @Inject(INJECT_TOKEN.TRADING_EVENT_CLIENT)
    private tradingEventClient: ClientRedis,
  ) {}

  emitBuyEvent(dto: CreateBuyDto) {
    return this.tradingEventClient
      .emit<CreateBuyDto>(EVENT_NAME.TRADING, dto)
      .pipe(tap(() => this.logger.debug('Emit User Buying Event')));
  }

  emitSellEvent(dto: CreateSellDto) {
    return this.tradingEventClient
      .emit<CreateBuyDto>(EVENT_NAME.TRADING, dto)
      .pipe(tap(() => this.logger.debug('Emit User Selling Event')));
  }
}
