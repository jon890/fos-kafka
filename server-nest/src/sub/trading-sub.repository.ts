import { Inject, Injectable, Logger } from '@nestjs/common';
import Decimal from 'decimal.js';
import { mkdir, writeFile } from 'fs/promises';
import { INJECT_TOKEN } from 'src/constants/inject.token';
import { LATEST_CONFIRMED_PRICE } from 'src/constants/memory-cache.const';
import {
  MTKStackName,
  STREAM_SIZE_MAX_THRESHOLD,
  STREAM_TRIM_CHUNK_SIZE,
  REDIS_TRADING_KEY_PAIR,
  ENTIRE_KEYPAIR_LIST,
  ENTIRE_KEYPAIR_MAP,
} from 'src/constants/redis-key.const';
import { TradingType, TradingTypeUtil } from 'src/constants/trading-type.const';
import { TradingPendingCancelItem } from 'src/dto/trading-pending-cancel.item';
import { TradingPendingItem } from 'src/dto/trading-pending.item';
import { TradingStackDto } from 'src/dto/trading-stack.dto';
import { RedisClientType } from 'src/redis/node-redis.provider';
@Injectable()
export class TradingSubRepository {
  private logger = new Logger(TradingSubRepository.name);

  constructor(
    @Inject(INJECT_TOKEN.NODE_REDIS_PROVIDER)
    private readonly redis: RedisClientType,
  ) {
    mkdir(`${__dirname}/../../logs`, {
      recursive: true,
    });
  }

  /**
   * 읽었던 거래 스트림 다음 데이터부터 읽어온다
   */
  async readTradingStream(
    keypair: REDIS_TRADING_KEY_PAIR,
  ): Promise<TradingPendingItem[]> {
    const streams = await this.redis.xReadGroup(
      // @ts-ignore
      keypair.GROUP_KEY,
      keypair.CONSUMER_KEY,
      {
        id: '>',
        key: keypair.STREAM_KEY,
      },
    );

    if (!streams) return [];

    const [{ name: _streamName, messages }] = streams;

    return messages.map(({ id, message }) => {
      if (message.tradingType === TradingType.BUYING || TradingType.SELLING) {
        return new TradingPendingItem(id, keypair.NAME, message);
      } else {
        return new TradingPendingCancelItem(id, keypair.NAME, message);
      }
    });
  }

  /**
   * 거래 체결을 기다리는 리스트로 추가
   */
  addInPending(pendingName: string, item: TradingPendingItem) {
    return this.redis.lPush(pendingName, JSON.stringify(item));
  }

  /**
   * 체결을 시작할 아이템을 뽑아낸다
   * @returns
   */
  async popPendingItem(
    pendingName: string,
  ): Promise<TradingPendingItem | null> {
    const jsonStr = await this.redis.rPop(pendingName);

    if (!jsonStr) {
      return null;
    }

    const obj = JSON.parse(jsonStr);
    return new TradingPendingItem(obj.id, obj.category, obj);
  }

  /**
   * 거래 체결 시작 여부 변수를 초기화 한다
   */
  async initReadyFlag(nextContractReady: string) {
    if (!(await this.redis.exists(nextContractReady))) {
      await this.redis.set(nextContractReady, 1);
    }
  }

  /**
   * 다음 데이터를 체결 시작해도 될지 확인
   */
  async isReadyForNextPendingData(nextContractReady: string) {
    return !!parseInt(await this.redis.get(nextContractReady));
  }

  /**
   * 체결 중 상태로 변경한다
   */
  waitContractProcessor(nextReadyFlag: string) {
    return this.redis.set(nextReadyFlag, 0);
  }

  /**
   * 체결을 기다리는 상태로 변경한다
   */
  restartContractProcessor(nextReadyFlag: string) {
    return this.redis.set(nextReadyFlag, 1);
  }

  /**
   * 최신 거래가 (시장 가격)을 업데이트한다.
   */
  updateLatestConfirmedPrice(
    latestPrice: number,
    category: string,
    type?: number,
  ) {
    return this.redis.set(
      `${LATEST_CONFIRMED_PRICE[category]}${!!type ? `_${type}` : ''}`,
      latestPrice,
    );
  }

  /**
   * 거래 스택의 JSON 데이터를 조회한다
   * @param tradingType
   * @param targetPrice
   * @returns
   */
  private async findJSON_TradingStack(
    searchIndex: string,
    tradingType: TradingType,
    item: TradingPendingItem,
  ): Promise<TradingStackDto[]> {
    TradingTypeUtil.assertInTradingStack(tradingType);

    // todo 코드 읽기가 어려움 수정좀..
    const filters = [];

    const tradingTypeFilter = ['@tradingType', `${tradingType}`];
    filters.push(tradingTypeFilter);

    if (item.type) {
      filters.push(['@type', `${item.type}`]);
    }

    const priceFilter = ['@price'];
    filters.push(priceFilter);

    let sortDirection = '';

    if (tradingType === TradingType.BUYING) {
      priceFilter.push(`[${item.price}, inf]`);
      sortDirection = 'ASC';
    } else if (tradingType === TradingType.SELLING) {
      priceFilter.push(`[0 ${item.price}]`);
      sortDirection = 'DESC';
    }

    const data = await this.redis.ft.search(
      // @ts-ignore
      searchIndex,
      filters.map((filter) => filter.join(':')).join(' '),
      {
        SORTBY: {
          BY: 'price',
          DIRECTION: sortDirection,
        },
        LIMIT: {
          from: 0,
          size: 99999,
        },
      },
    );

    const { documents } = data;
    return documents.map(({ value: { $ } }) => {
      const obj = JSON.parse($ as string);
      return new TradingStackDto(obj);
    });
  }

  /**
   * 판매 오퍼를 찾는다
   * @param item
   * @returns
   */
  async findSellingOffers(
    item: TradingPendingItem,
  ): Promise<TradingStackDto[]> {
    const tradingOffers = await this.findJSON_TradingStack(
      ENTIRE_KEYPAIR_MAP[item.category].SEARCH_INDEX,
      TradingType.SELLING,
      item,
    );

    return tradingOffers
      .filter((t) => t.tradingType === TradingType.SELLING)
      .sort((a, b) => a.compare(b));
  }

  /**
   * 구매 오퍼를 찾는다
   * @param item
   * @returns
   */
  async findBuyingOffers(item: TradingPendingItem): Promise<TradingStackDto[]> {
    const tradingOffers = await this.findJSON_TradingStack(
      ENTIRE_KEYPAIR_MAP[item.category].SEARCH_INDEX,
      TradingType.BUYING,
      item,
    );

    return tradingOffers
      .filter((t) => t.tradingType === TradingType.BUYING)
      .sort((a, b) => a.compare(b));
  }

  /**
   * Trading Stack에 아이템을 추가
   * @param stackName
   * @param trading
   * @returns
   */
  addTradingStackItem(stackName: MTKStackName, trading: TradingPendingItem) {
    trading.amount = Number(trading.amount);
    trading.price = Number(trading.price);

    return this.redis.json.set(`${stackName}:${trading.id}`, '$', {
      ...trading,
    });
  }

  /**
   * Trading Stack의 남은 개수 조절
   * @param stackName
   * @param key
   * @param newAmount
   * @returns
   */
  updateTradingStackItemAmount(
    stackName: MTKStackName,
    key: string,
    newAmount: number,
  ) {
    return this.redis.json.set(`${stackName}:${key}`, '.amount', newAmount);
  }

  /**
   * Trading Stack에 아이템 제거
   * @param stackName
   * @param key
   * @returns
   */
  deleteTradingStackItem(stackName: MTKStackName, key: string) {
    return this.redis.del(`${stackName}:${key}`);
  }

  /**
   * 취소 템플릿을 실행한다
   * @param userId
   * @param key
   * @param tradingType
   * @param callback
   */
  async executeTradingCancelTemplate(
    { userId, tradingType, timestamp, category }: TradingPendingCancelItem,
    callback?: (amount: number, type?: number) => Promise<void>,
  ) {
    TradingTypeUtil.assertInCancelType(tradingType);

    const targetCategory = ENTIRE_KEYPAIR_MAP[category];

    let prefix;
    if (tradingType === TradingType.CANCEL_BUYING) {
      prefix = targetCategory.STACK.BUY_STACK;
    } else if (tradingType === TradingType.CANCEL_SELLING) {
      prefix = targetCategory.STACK.SELL_STACK;
    }

    const completeKey = `${prefix}:${timestamp}`;
    const exist = await this.redis.exists(completeKey);
    if (exist === 0) {
      // todo error code
      // throw new Error('거래 내역이 존재하지 않습니다');
      console.log(`거래 내역이 존재하지 않습니다 ===>> ${timestamp}`);
      return;
    }

    const { userId: targetUserId, amount, price, type } =
      // @ts-ignore
      (await this.redis.json.get(completeKey)) as TradingPendingCancelItem;

    // todo Business Error로 처리
    if (targetUserId !== userId) {
      // throw new Error('본인만 지울 수 있습니다');
      console.log(`본인만 지울 수 있습니다 ===> ${userId}`);
      return;
    }

    await this.redis.del(completeKey);

    if (callback) {
      /**
       * buying의 경우 디비에 실제로 올라가야할 금액을 전달해야함.
       * TODO: 누더기 개선
       */
      await callback(
        tradingType === TradingType.CANCEL_BUYING
          ? new Decimal(amount).mul(price).toNumber()
          : amount,
        Number(type),
      );
    }
  }

  async handleCurrentTradingStreamSize() {
    for (const keypair of ENTIRE_KEYPAIR_LIST) {
      const currentSize = await this.redis.xLen(keypair.STREAM_KEY);
      if (currentSize < STREAM_SIZE_MAX_THRESHOLD) continue;
      const prevLogs = await this.redis.xRange(keypair.STREAM_KEY, '-', '+', {
        COUNT: STREAM_TRIM_CHUNK_SIZE,
      });

      // console.log(currentSize);
      // TODO: prevLogs store in file / s3 etc...

      try {
        await writeFile(
          `${__dirname}/../../logs/${keypair.NAME}-${new Date().getTime()}`,
          JSON.stringify(prevLogs),
          {},
        );
        this.logger.debug('Log successfully archived');
      } catch (error) {
        this.logger.error(error);
      }

      await this.redis.xTrim(
        keypair.STREAM_KEY,
        'MAXLEN',
        currentSize - STREAM_TRIM_CHUNK_SIZE,
      );
    }
  }
}
