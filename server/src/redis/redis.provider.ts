import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import {
  MTK_TRADING_CONSUMER_BUY_PENDING,
  MTK_TRADING_CONSUMER_SELL_PENDING,
  MTK_TRADING_GROUP_BUY,
  MTK_TRADING_GROUP_SELL,
  MTK_TRADING_STREAM_KEY,
} from 'src/constants/redis-key.const';
import { OUTER_SERVICE } from 'src/constants/service.const';

interface CreateGroupParam {
  streamKey: string;
  groupName: string;
}

interface CreateConsumerParam extends CreateGroupParam {
  consumerName: string;
}

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

    this.createMtkTradingStream({
      streamKey: MTK_TRADING_STREAM_KEY,
      groupName: MTK_TRADING_GROUP_BUY,
    });
    this.createMtkTradingStream({
      streamKey: MTK_TRADING_STREAM_KEY,
      groupName: MTK_TRADING_GROUP_SELL,
    });
    this.createMtkTradingConsumer({
      streamKey: MTK_TRADING_STREAM_KEY,
      groupName: MTK_TRADING_GROUP_BUY,
      consumerName: MTK_TRADING_CONSUMER_BUY_PENDING,
    });
    this.createMtkTradingConsumer({
      streamKey: MTK_TRADING_STREAM_KEY,
      groupName: MTK_TRADING_GROUP_SELL,
      consumerName: MTK_TRADING_CONSUMER_SELL_PENDING,
    });
  }

  async createMtkTradingStream(param: CreateGroupParam) {
    try {
      await this.redis.xgroup(
        'CREATE',
        param.streamKey,
        param.groupName,
        '$',
        'MKSTREAM',
      );
    } catch (e) {}
  }

  async createMtkTradingConsumer(param: CreateConsumerParam) {
    await this.redis.xgroup(
      'CREATECONSUMER',
      param.streamKey,
      param.groupName,
      param.consumerName,
    );
  }

  get(): Redis {
    return this.redis;
  }
}
