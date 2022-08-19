import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientRedis } from '@nestjs/microservices';
import Redis from 'ioredis';
import { INJECT_TOKEN } from 'src/constants/inject.token';
import { MTK_TRADING_STREAM_KEY } from 'src/constants/redis-key.const';
import { RedisProvider } from 'src/redis/redis.provider';

@Injectable()
export class TradingPubService {
  private logger = new Logger(TradingPubService.name);
  private redis: Redis;

  constructor(
    @Inject(INJECT_TOKEN.TRADING_EVENT_CLIENT)
    private tradingEventClient: ClientRedis,
    private redisProvider: RedisProvider,
  ) {
    this.redis = redisProvider.get();
  }

  private dtoToStreamValues(obj: Object) {
    return Object.keys(obj)
      .map((key) => [key, obj[key]])
      .flat();
  }

  emitEvent(obj: Object) {
    return this.redis.xadd(
      MTK_TRADING_STREAM_KEY,
      '*', // auto generated key
      ...this.dtoToStreamValues(obj),
    );
  }

  // emitBuyEvent(dto: CreateBuyDto) {
  //   return this.tradingEventClient
  //     .emit<CreateBuyDto>(EVENT_NAME.TRADING, dto)
  //     .pipe(tap(() => this.logger.debug('Emit User Buying Event')));
  // }

  // emitSellEvent(dto: CreateSellDto) {
  //   return this.tradingEventClient
  //     .emit<CreateBuyDto>(EVENT_NAME.TRADING, dto)
  //     .pipe(tap(() => this.logger.debug('Emit User Selling Event')));
  // }
}
