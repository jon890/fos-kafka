import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { OUTER_SERVICE } from 'src/constants/service.const';

@Injectable()
export class RedisProvider {
  private redis: Redis;

  constructor() {
    this.init();
  }

  private init() {
    this.redis = new Redis({
      host: OUTER_SERVICE.REDIS_TRADING.name,
      port: OUTER_SERVICE.REDIS_TRADING.port,
    });
  }

  get(): Redis {
    return this.redis;
  }
}
