import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { AggregateGroupByReducers, AggregateSteps } from 'redis';
import { INJECT_TOKEN } from 'src/constants/inject.token';
import {
  LATEST_CONFIRMED_PRICE,
  TOP_10_BUY_LIST,
  TOP_10_SELL_LIST,
} from 'src/constants/memory-cache.const';
import {
  ENTIRE_KEYPAIR_LIST,
  REDIS_TRADING_KEY_PAIR,
} from 'src/constants/redis-key.const';
import { TradingType, TradingTypeUtil } from 'src/constants/trading-type.const';
import { RedisClientType } from 'src/redis/node-redis.provider';

export type BidAskType = { amount: string; price: string };

@Injectable()
export class TradingRestService {
  constructor(
    @Inject(INJECT_TOKEN.NODE_REDIS_PROVIDER)
    private readonly client: RedisClientType,

    @Inject(CACHE_MANAGER) private cacheManger: Cache,
  ) {
    for (const keypair of ENTIRE_KEYPAIR_LIST) {
      this.init(keypair);
    }
  }

  sleep(milliseconds: number) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  async init(keypair: REDIS_TRADING_KEY_PAIR) {
    while (true) {
      for (const keyType of keypair.TYPE_LIST) {
        const { buy, sell, marketPrice } = await this.getTradingsFromRedis(
          keypair,
          keyType,
        );
        const formattedCacheKey = this._formatCachKey(keyType);

        // copy redis data to memory cache
        await this.cacheManger.set(
          `${TOP_10_BUY_LIST[keypair.NAME]}${formattedCacheKey}`,
          buy,
        );
        await this.cacheManger.set(
          `${TOP_10_SELL_LIST[keypair.NAME]}${formattedCacheKey}`,
          sell.reverse(),
        );
        await this.cacheManger.set(
          `${LATEST_CONFIRMED_PRICE[keypair.NAME]}${formattedCacheKey}`,
          marketPrice,
        );

        await this.sleep(100);
      }
    }
  }
  private _formatCachKey(typeSuffix: number | null) {
    return `${!typeSuffix ? '' : `_${typeSuffix}`}`;
  }

  async getTradingsFromCache(keypair: REDIS_TRADING_KEY_PAIR, type?: number) {
    const formattedCacheKey = this._formatCachKey(type);
    const buy =
      (await this.cacheManger.get<BidAskType[]>(
        `${TOP_10_BUY_LIST[keypair.NAME]}${formattedCacheKey}`,
      )) || [];
    const sell =
      (await this.cacheManger.get<BidAskType[]>(
        `${TOP_10_SELL_LIST[keypair.NAME]}${formattedCacheKey}`,
      )) || [];
    const marketPrice =
      (await this.cacheManger.get<string>(
        `${LATEST_CONFIRMED_PRICE[keypair.NAME]}${formattedCacheKey}`,
      )) || null;

    return {
      buy,
      sell,
      marketPrice,
    };
  }

  /**
   * 내 거래목록 조회
   */
  getMyTradings(userId: string, searchIndex: string) {
    return this.client.ft.search(searchIndex, `@userId:${userId}`, {
      LIMIT: {
        from: 0,
        size: 99999,
      },
    });
  }

  /**
   * 호가 목록 조회
   */
  private async getTradingsFromRedis(
    keypair: REDIS_TRADING_KEY_PAIR,
    keyType: number | null,
  ) {
    const { results: buyingsResult } = await this._getTradingsTradingTypes(
      TradingType.BUYING,
      keypair.SEARCH_INDEX,
      keyType,
    );
    const { results: sellingsResult } = await this._getTradingsTradingTypes(
      TradingType.SELLING,
      keypair.SEARCH_INDEX,
      keyType,
    );

    const marketPrice = await this.client.get(
      `${LATEST_CONFIRMED_PRICE[keypair.NAME]}${
        !!keyType ? `_${keyType}` : ''
      }`,
    );

    return {
      buy: buyingsResult,
      sell: sellingsResult,
      marketPrice,
    };
  }

  private _getTradingsTradingTypes(
    tradingType: TradingType,
    searchIndex: string,
    keyType: number | null,
  ) {
    // FT.AGGREGATE MTK_TRADING_INDEX "@tradingType:BUYING"
    // GROUPBY 1 @price
    // REDUCE SUM 1 @amount as total_amount
    // SORTBY 2 @price DESC

    let filterQuery = TradingTypeUtil.getRedisFilter(tradingType);

    if (keyType !== null) {
      filterQuery = `${filterQuery} @type:${keyType}`;
    }
    return this.client.ft.aggregate(
      // @ts-ignore
      searchIndex,
      filterQuery,
      {
        STEPS: [
          {
            type: AggregateSteps.GROUPBY,
            properties: ['@price'],
            REDUCE: [
              {
                type: AggregateGroupByReducers.SUM,
                property: '@amount',
                AS: 'totalAmount',
              },
            ],
          },
          {
            type: AggregateSteps.SORTBY,
            BY: {
              BY: '@price',
              DIRECTION: tradingType === TradingType.BUYING ? 'DESC' : 'ASC',
            },
            MAX: 10,
          },
        ],
      },
    );
  }
}
