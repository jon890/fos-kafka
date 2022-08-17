import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { RedisProvider } from './redis.provider';

@Injectable()
export class TradingRepository {
  private logger = new Logger(TradingRepository.name);
  private redis: Redis;

  constructor(private readonly redisProvider: RedisProvider) {
    this.redis = redisProvider.get();
  }

  pushEvent(data: any) {
    this.redis.set('TRADING_QUEUE', JSON.stringify(data));
  }
}
