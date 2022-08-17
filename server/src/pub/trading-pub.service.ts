import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientRedis } from '@nestjs/microservices';
import { INJECT_TOKEN } from 'src/constants/inject.token';
import { TRADING_EVENT } from 'src/constants/trading-event.const';

@Injectable()
export class TradingPubService {
  private logger = new Logger(TradingPubService.name);

  constructor(
    @Inject(INJECT_TOKEN.TRADING_EVENT_CLIENT)
    private tradingEventClient: ClientRedis,
  ) {}

  emitBuy() {
    this.logger.debug('Emit User Buying Event!');

    const data = {
      userId: 1,
      amount: 2000,
    };
    return this.tradingEventClient.emit(TRADING_EVENT.USER_BUYING, data);
  }
}
