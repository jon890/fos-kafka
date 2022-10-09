import { Inject, Injectable, Logger } from '@nestjs/common';
import { INJECT_TOKEN } from 'src/constants/inject.token';
import {
  TRADING_KEYPAIR_MTK,
  TRADING_KEYPAIR_RARE,
  TRADING_KEYPAIR_RESOURCE,
} from 'src/constants/redis-key.const';
import { TradingCategory } from 'src/constants/trading-type.const';
import { RedisClientType } from 'src/redis/node-redis.provider';

@Injectable()
export class TradingPubService {
  private logger = new Logger(TradingPubService.name);

  constructor(
    @Inject(INJECT_TOKEN.NODE_REDIS_PROVIDER)
    private redis: RedisClientType,
  ) {}

  private valuesToStringInObject(obj: Record<string, any>) {
    return Object.keys(obj).forEach((k) => {
      const v = obj[k];
      if (typeof v !== 'string') {
        obj[k] = String(v);
      }
    });
  }

  emitEvent(obj: Record<string, any>) {
    if (obj.tradingCategory === TradingCategory.MTK) {
      this.valuesToStringInObject(obj);
      return this.redis.xAdd(TRADING_KEYPAIR_MTK.STREAM_KEY, '*', obj);
    } else if (obj.tradingCategory === TradingCategory.RESOURCE) {
      this.valuesToStringInObject(obj);
      return this.redis.xAdd(TRADING_KEYPAIR_RESOURCE.STREAM_KEY, '*', obj);
    } else {
      this.valuesToStringInObject(obj);
      return this.redis.xAdd(TRADING_KEYPAIR_RARE.STREAM_KEY, '*', obj);
    }
  }
}
