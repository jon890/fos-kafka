import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { INJECT_TOKEN } from 'src/constants/inject.token';
import { TRADING_EVENT } from 'src/constants/trading-event.const';

@Injectable()
export class TradingService {
  constructor(
    @Inject(INJECT_TOKEN.TRADING_EVENT_CLIENT)
    private tradingEventClient: ClientProxy,
  ) {}

  emitBuy() {
    return this.tradingEventClient.emit(TRADING_EVENT.USER_BUYING, {
      userId: 1,
      amount: 2000,
    });
  }
}
