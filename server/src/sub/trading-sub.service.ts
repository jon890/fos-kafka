import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import {
  MTK_NEXT_CONTRACT_READY,
  MTK_TRADING_CONSUMER_BUY_PENDING,
  MTK_TRADING_GROUP_BUY,
  MTK_TRADING_PENDING_DATA,
  MTK_TRADING_STREAM_KEY,
} from 'src/constants/redis-key.const';
import { TradingType } from 'src/constants/trading-type.const';
import { RedisProvider } from 'src/redis/redis.provider';

@Injectable()
export class TradingSubService {
  private redis: Redis;

  constructor(private readonly redisProvider: RedisProvider) {
    this.redis = redisProvider.get();
    this.subscribeTradingEventStream();
    this.watchPending();
  }

  sleep(millisec: number) {
    return new Promise((resolve) => setTimeout(resolve, millisec));
  }

  async subscribeTradingEventStream() {
    console.log('Subscribe Trading Event Stream');

    while (true) {
      const streams = (await this.readTradingStream()) as any;

      if (streams) {
        const [[_streamKey, data]] = streams;
        // 길이 2짜리 배열들의 배열
        // [[timestamp, [key,val]]]
        //console.log('key : ', data);
        for (const datum of data) {
          const [timestamp, ...keyvalues] = datum;
          await this.addPendingData(timestamp, keyvalues);
        }
      }

      await this.sleep(1000);
    }
  }

  /**
   * 거래 스트림을 읽어온다
   * @returns
   */
  readTradingStream() {
    return this.redis.xreadgroup(
      'GROUP',
      MTK_TRADING_GROUP_BUY,
      MTK_TRADING_CONSUMER_BUY_PENDING,
      'STREAMS',
      MTK_TRADING_STREAM_KEY,
      '>',
    );
  }

  /**
   * 거래 체결을 기다리는 리스트로 추가
   * @param timestamp
   * @param keyvalues
   * @returns
   */
  addPendingData(timestamp: string, keyvalues: string[]) {
    return this.redis.lpush(
      MTK_TRADING_PENDING_DATA,
      `${timestamp}--${keyvalues.join(',')}`,
    );
  }

  async watchPending() {
    await this.initFlags();

    while (true) {
      const isReady = await this.parseBoolean(MTK_NEXT_CONTRACT_READY);
      if (!isReady) {
        await this.sleep(100);
        continue;
      }

      const trading = await this.redis.rpop(MTK_TRADING_PENDING_DATA);
      if (!trading) {
        await this.sleep(100);
        continue;
      }

      await this.setNextContractReady(false);
      await this.beforeStackPush(trading);
    }
  }

  async initFlags() {
    if (!(await this.redis.exists(MTK_NEXT_CONTRACT_READY))) {
      await this.redis.set(MTK_NEXT_CONTRACT_READY, 1);
    }
  }

  setNextContractReady(state: boolean) {
    return this.redis.set(MTK_NEXT_CONTRACT_READY, state ? 1 : 0);
  }

  private async beforeStackPush(nextItem: string) {
    const [timestamp, jsonString] = nextItem.split('--');

    const jsonKeys = jsonString.split(',').filter((_, idx) => idx % 2 === 0);
    const jsonValues = jsonString.split(',').filter((_, idx) => idx % 2 === 1);

    const finalJson = {
      timestamp,
    } as any;
    jsonKeys.forEach((key, idx) => {
      finalJson[key] = jsonValues[idx];
    });

    if (finalJson.tradingType === TradingType.BUYING) {
      // 체결 가능한지 여부
      // 사는 사람 체결 부분
      const sellResult = (await this.redis.call(
        'FT.SEARCH',
        'matchingIdx',
        '@tradingType:SELLING',
        'SORTBY',
        'salePrice',
        'asc',
      )) as any;

      let mustRemainInStack = false;
      if (sellResult) {
        const [count, ...rows] = sellResult;

        const ids = rows.filter((_, idx) => idx % 2 === 0);
        const rowValues = rows.filter((_, idx) => idx % 2 === 1);

        // console.log(ids);
        // console.log(rowValues);

        const sells = [];
        for (let i = 0; i < count; i++) {
          const sell = rowValues[i][3];
          sells.push(JSON.parse(sell));
        }

        sells.sort((a, b) => {
          const aPrice = Number(a.salePrice);
          const bPrice = Number(b.salePrice);

          const aTimestamp = Number(a.timestamp.split('-').join(''));
          const bTimestamp = Number(b.timestamp.split('-').join(''));

          if (aPrice > bPrice) {
            return 1;
          } else if (aPrice < bPrice) {
            return -1;
          } else {
            return aTimestamp - bTimestamp;
          }
        });

        // 정렬된 결과를 토대로 필요한 amount 만큼 부분 체결 진행
        let totalAmount = Number(finalJson.amount);
        //
        let totalSaleIds = [];
        //
        let updateSellItem = [null, null];

        sells.some((sellItem) => {
          if (totalAmount - sellItem.amount < 0) {
            updateSellItem[0] = sellItem.timestamp;
            updateSellItem[1] = sellItem.amount - totalAmount;
            totalAmount -= sellItem.amount;
          } else if (totalAmount - sellItem.amount >= 0) {
            totalSaleIds.push(sellItem.timestamp);
            totalAmount -= sellItem.amount;
          }

          if (totalAmount <= 0) return true;
        });

        // API 디비상에서 체결 결과 반영

        for (let idx of totalSaleIds) {
          await this.redis.del(`Sell_Stack:${idx}`);
        }

        // 부분 차감 진행

        console.log(updateSellItem);

        if (updateSellItem[0] && updateSellItem[1]) {
          await this.redis.call(
            'JSON.SET',
            `Sell_Stack:${updateSellItem[0]}`,
            '$.amount',
            `"${updateSellItem[1]}"`,
          );
        }

        // 더이상 체결할 판매 물량이 오히려 부족할 떄
        if (totalAmount > 0) {
          mustRemainInStack = true;
          finalJson.amount = `${totalAmount}`;
        }

        console.log(sells);
      }

      if (mustRemainInStack) {
        await this.redis.call(
          // 'JSON.ARRAPPEND',
          'JSON.SET',
          `Buy_Stack:${finalJson.timestamp}`,
          '$',
          JSON.stringify(finalJson),
        );
      }

      await this.redis.set('Buy_Ready', '1');
      await this.redis.set('Sell_Ready', '1');
    } else if (finalJson.tradingType === TradingType.SELLING) {
      await this.redis.set('Sell_Ready', '1');

      await this.redis.call(
        // 'JSON.ARRAPPEND',
        'JSON.SET',
        `Sell_Stack:${finalJson.timestamp}`,
        '$',
        JSON.stringify(finalJson),
      );

      await this.redis.set('Buy_Ready', '1');
    }
  }

  private async parseBoolean(redisKey: string) {
    return !!parseInt(await this.redis.get(redisKey));
  }
}
