import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import {
  MTK_NEXT_CONTRACT_READY,
  MTK_TRADING_BUY_STACK,
  MTK_TRADING_CONSUMER_BUY_PENDING,
  MTK_TRADING_GROUP_BUY,
  MTK_TRADING_PENDING_DATA,
  MTK_TRADING_SELL_STACK,
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
      await this.setNextContractReady(true);
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

  deserialize(tradingItem: string) {
    const [timestamp, jsonString] = tradingItem.split('--');

    const jsonKeys = jsonString.split(',').filter((_, idx) => idx % 2 === 0);
    const jsonValues = jsonString.split(',').filter((_, idx) => idx % 2 === 1);

    const trading = {
      timestamp,
    } as any;

    jsonKeys.forEach((key, idx) => {
      trading[key] = jsonValues[idx];
    });

    return trading;
  }

  async findSellingOffers() {
    const searchResult = (await this.redis.call(
      'FT.SEARCH',
      'matchingIdx',
      '@tradingType:SELLING',
      'SORTBY',
      'salePrice',
      'asc',
    )) as any;

    const [count, ...rows] = searchResult;

    const ids = rows.filter((_, idx) => idx % 2 === 0);
    const rowValues = rows.filter((_, idx) => idx % 2 === 1);

    const sellingOffers = [];
    for (let i = 0; i < count; i++) {
      const sell = rowValues[i][3];
      sellingOffers.push(JSON.parse(sell));
    }

    sellingOffers.sort((a, b) => {
      const aPrice = Number(a.salePrice);
      const bPrice = Number(b.salePrice);

      const aTimestamp = Number(a.timestamp.split('-').join(''));
      const bTimestamp = Number(b.timestamp.split('-').join(''));

      if (aPrice - bPrice > Number.EPSILON) {
        return 1;
      } else if (aPrice - bPrice < Number.EPSILON) {
        return -1;
      } else {
        return aTimestamp - bTimestamp;
      }
    });

    Logger.debug(sellingOffers);

    return sellingOffers;
  }
  async findBuyingOffers() {
    const searchResult = (await this.redis.call(
      'FT.SEARCH',
      'matchingIdx',
      '@tradingType:BUYING',
      'SORTBY',
      'salePrice',
      'desc',
    )) as any;

    const [count, ...rows] = searchResult;

    const ids = rows.filter((_, idx) => idx % 2 === 0);
    const rowValues = rows.filter((_, idx) => idx % 2 === 1);

    const buyingOffers = [];
    for (let i = 0; i < count; i++) {
      const sell = rowValues[i][3];
      buyingOffers.push(JSON.parse(sell));
    }

    buyingOffers.sort((a, b) => {
      const aPrice = Number(a.salePrice);
      const bPrice = Number(b.salePrice);

      const aTimestamp = Number(a.timestamp.split('-').join(''));
      const bTimestamp = Number(b.timestamp.split('-').join(''));

      if (aPrice - bPrice < Number.EPSILON) {
        return 1;
      } else if (aPrice - bPrice > Number.EPSILON) {
        return -1;
      } else {
        return aTimestamp - bTimestamp;
      }
    });

    Logger.debug(buyingOffers);

    return buyingOffers;
  }

  private async beforeStackPush(nextItem: string) {
    const trading = this.deserialize(nextItem);

    if (trading.tradingType === TradingType.BUYING) {
      // 체결 가능한지 여부
      // 사는 사람 체결 부분
      const sellingOffers = (await this.findSellingOffers()) as any[];

      // 아직 더 체결해야할 것이 있을지 체크하는 변수
      let mustRemainInStack = true;

      if (sellingOffers.length > 0) {
        // 정렬된 결과를 토대로 필요한 amount 만큼 부분 체결 진행
        let totalAmount = Number(trading.amount);
        //
        const totalSaleIds = [];
        //
        const updateSellItem = [null, null];

        sellingOffers.some((sellItem) => {
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

        for (const idx of totalSaleIds) {
          this.deleteTradingInSellStack(idx);
        }

        // 부분 차감 진행
        console.log(updateSellItem);

        if (updateSellItem[0] && updateSellItem[1]) {
          const [key, newAmount] = updateSellItem;
          this.updateAmountInSellStack(key, newAmount);
        }

        // 더이상 체결할 판매 물량이 오히려 부족할 떄
        if (totalAmount > 0) {
          trading.amount = `${totalAmount}`;
        } else {
          mustRemainInStack = false;
        }
      }

      if (mustRemainInStack) {
        await this.addTradingInBuyStack(trading);
      }
    } else if (trading.tradingType === TradingType.SELLING) {
      // 체결 가능한지 여부
      // 사는 사람 체결 부분
      const buyingOffers = (await this.findBuyingOffers()) as any[];

      // 아직 더 체결해야할 것이 있을지 체크하는 변수
      let mustRemainInStack = true;

      if (buyingOffers.length > 0) {
        // 정렬된 결과를 토대로 필요한 amount 만큼 부분 체결 진행
        let totalAmount = Number(trading.amount);
        //
        const completedOfferIds = [];
        //
        const updateBuyItem = [null, null];

        buyingOffers.some((buyItem) => {
          if (totalAmount - buyItem.amount < 0) {
            updateBuyItem[0] = buyItem.timestamp;
            updateBuyItem[1] = buyItem.amount - totalAmount;
            totalAmount -= buyItem.amount;
          } else if (totalAmount - buyItem.amount >= 0) {
            completedOfferIds.push(buyItem.timestamp);
            totalAmount -= buyItem.amount;
          }

          if (totalAmount <= 0) return true;
        });

        // API 디비상에서 체결 결과 반영

        for (const idx of completedOfferIds) {
          this.deleteTradingInBuyStack(idx);
        }

        // 부분 차감 진행
        console.log(updateBuyItem);

        if (updateBuyItem[0] && updateBuyItem[1]) {
          const [key, newAmount] = updateBuyItem;
          this.updateAmountInBuyStack(key, newAmount);
        }

        // 더이상 체결할 판매 물량이 오히려 부족할 떄
        if (totalAmount > 0) {
          trading.amount = `${totalAmount}`;
        } else {
          mustRemainInStack = false;
        }
      }

      if (mustRemainInStack) {
        await this.addTradingInSellStack(trading);
      }
    } else if (trading.tradingType === TradingType.CANCEL_BUYING) {
      await this.cancelBuying(trading.userId, trading.timestamp);
    } else if (trading.tradingType === TradingType.CANCEL_SELLING) {
      await this.cancelSelling(trading.userId, trading.timestamp);
    }
  }

  updateAmountInSellStack(key: string, newAmount: number) {
    return this.redis.call(
      'JSON.SET',
      `${MTK_TRADING_SELL_STACK}:${key}`,
      '$.amount',
      `"${newAmount}"`,
    );
  }
  updateAmountInBuyStack(key: string, newAmount: number) {
    return this.redis.call(
      'JSON.SET',
      `${MTK_TRADING_BUY_STACK}:${key}`,
      '$.amount',
      `"${newAmount}"`,
    );
  }

  deleteTradingInSellStack(key: string) {
    return this.redis.del(`${MTK_TRADING_SELL_STACK}:${key}`);
  }
  deleteTradingInBuyStack(key: string) {
    return this.redis.del(`${MTK_TRADING_BUY_STACK}:${key}`);
  }

  addTradingInBuyStack(trading: any) {
    return this.redis.call(
      'JSON.SET',
      `${MTK_TRADING_BUY_STACK}:${trading.timestamp}`,
      '$',
      JSON.stringify(trading),
    );
  }
  addTradingInSellStack(trading: any) {
    return this.redis.call(
      'JSON.SET',
      `${MTK_TRADING_SELL_STACK}:${trading.timestamp}`,
      '$',
      JSON.stringify(trading),
    );
  }

  private async parseBoolean(redisKey: string) {
    return !!parseInt(await this.redis.get(redisKey));
  }

  async executeCancelTemplate(
    userId: string,
    key: string,
    tradingType: TradingType,
    callback?: () => Promise<void>,
  ) {
    let prefix;
    if (tradingType === TradingType.CANCEL_BUYING) {
      prefix = MTK_TRADING_BUY_STACK;
    } else if (tradingType === TradingType.CANCEL_SELLING) {
      prefix = MTK_TRADING_SELL_STACK;
    } else {
      throw new Error('지원하지 않는 타입입니다');
    }
    const completeKey = `${prefix}:${key}`;

    const exist = await this.redis.exists(completeKey);

    if (exist === 0) {
      // todo error code
      throw new Error('거래 내역이 존재하지 않습니다');
    }

    const [targetUserId] = JSON.parse(
      (await this.redis.call('JSON.GET', completeKey, '$..userId')) as any,
    );
    console.log(targetUserId);
    // const trading = this.deserialize(value);

    if (targetUserId !== userId) {
      throw new Error('본인만 지울 수 있습니다');
    }

    console.log('ccc');
    await this.redis.del(completeKey);
    if (callback) {
      await callback();
    }
  }

  async cancelBuying(userId: string, key: string) {
    await this.executeCancelTemplate(
      userId,
      key,
      TradingType.CANCEL_BUYING,
      async () => {
        // todo api 환불
        return null;
      },
    );
  }

  async cancelSelling(userId: string, key: string) {
    await this.executeCancelTemplate(userId, key, TradingType.CANCEL_SELLING);
  }
}
