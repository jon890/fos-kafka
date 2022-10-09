import { Injectable, Logger } from '@nestjs/common';
import Decimal from 'decimal.js';
import { Metaverse2ApiClient } from 'src/client/metaverse2-api.client';
import {
  ENTIRE_KEYPAIR_LIST,
  ENTIRE_KEYPAIR_MAP,
  REDIS_TRADING_KEY_PAIR,
} from 'src/constants/redis-key.const';
import { TradingType } from 'src/constants/trading-type.const';
import { ResourceTrader, Trader } from 'src/dto/matching-request.dto';
import { TradingPendingCancelItem } from 'src/dto/trading-pending-cancel.item';
import { TradingPendingItem } from 'src/dto/trading-pending.item';
import { TradingStackDto } from 'src/dto/trading-stack.dto';
import { TradingSubRepository } from './trading-sub.repository';

@Injectable()
export class TradingSubService {
  private logger = new Logger(TradingSubService.name);

  constructor(
    private readonly repository: TradingSubRepository,
    private readonly mv2ApiClient: Metaverse2ApiClient,
  ) {
    for (const keypair of ENTIRE_KEYPAIR_LIST) {
      this.subscribeTradingEventStream(keypair);
      this.watchPending(keypair);
    }
    // this.subscribeHandlingStreamSize();
  }

  sleep(millisec: number) {
    return new Promise((resolve) => setTimeout(resolve, millisec));
  }

  /**
   * Subscribe Trading Event Steam
   */
  async subscribeTradingEventStream(keypair: REDIS_TRADING_KEY_PAIR) {
    this.logger.debug('MTK 거래 스트림 구독을 시작합니다');

    while (true) {
      const streams = await this.repository.readTradingStream(keypair);

      if (streams.length === 0) {
        await this.sleep(1000);
        continue;
      }

      for (const item of streams) {
        await this.repository.addInPending(keypair.PENDING_DATA, item);
      }
      await this.sleep(1000);
    }
  }

  /**
   * 거래가 체결될 데이터를 주기적으로 확인한다
   */
  async watchPending(keypair: REDIS_TRADING_KEY_PAIR) {
    await this.repository.initReadyFlag(keypair.NEXT_CONTRACT_READY);

    while (true) {
      const isReady = await this.repository.isReadyForNextPendingData(
        keypair.NEXT_CONTRACT_READY,
      );
      if (!isReady) {
        await this.sleep(10);
        continue;
      }

      const trading = await this.repository.popPendingItem(
        keypair.PENDING_DATA,
      );
      if (!trading) {
        await this.sleep(10);
        continue;
      }

      this.logger.debug('Send Pending Data');
      this.logger.debug(JSON.stringify(trading));
      await this.repository.waitContractProcessor(keypair.NEXT_CONTRACT_READY);
      await this.handleContractProcessing(trading);
      await this.repository.restartContractProcessor(
        keypair.NEXT_CONTRACT_READY,
      );
    }
  }

  /**
   * 체결 로직 수행
   * @param item
   */
  private async handleContractProcessing(
    item: TradingPendingItem | TradingPendingCancelItem,
  ) {
    this.logger.debug('Trading Contract Processing!');
    this.logger.debug(`Trading Type ===> ${item.tradingType}`);

    switch (item.tradingType) {
      case TradingType.BUYING:
        await this.handleBuying(item);
        break;
      case TradingType.SELLING:
        await this.handleSelling(item);
        break;
      case TradingType.CANCEL_BUYING:
        await this.handleCancelBuying(item);
        break;
      case TradingType.CANCEL_SELLING:
        await this.handleCancelSelling(item);
        break;
    }
  }

  /**
   * 구매 처리
   * @param item
   */
  private async handleBuying(item: TradingPendingItem) {
    const sellingOffers = (
      await this.repository.findSellingOffers(item)
    ).reverse();

    const completes: TradingStackDto[] = []; // 완전히 거래한 물품
    let partial: TradingStackDto | null = null; // 부분적으로 거래한 물품
    let partialAmount: number | null; // 부분적으로 거래한 물량
    let latestPriceTracker: number | null = null; // 최근 거래가 반영 기록
    let remainAmount = new Decimal(item.amount); // 내 물량 중 더 처리해야할 물량

    while (sellingOffers.length) {
      const selling = sellingOffers.pop();

      if (remainAmount.minus(selling.amount).toNumber() >= 0) {
        completes.push(selling);
        remainAmount = remainAmount.minus(selling.amount);
      } else {
        partial = selling;
        partialAmount = remainAmount.toNumber();
        remainAmount = new Decimal(0);
      }

      latestPriceTracker = selling.price;
      if (remainAmount.toNumber() === 0) {
        break;
      }
    }
    const targetCategory = ENTIRE_KEYPAIR_MAP[item.category];

    try {
      await Promise.all([
        ...completes.map(({ id }) =>
          this.repository.deleteTradingStackItem(
            targetCategory.STACK.SELL_STACK,
            id,
          ),
        ),
        partial
          ? this.repository.updateTradingStackItemAmount(
              targetCategory.STACK.SELL_STACK,
              partial.id,
              new Decimal(partial.amount).minus(partialAmount).toNumber(),
            )
          : null,
        remainAmount.toNumber() > 0
          ? this.repository.addTradingStackItem(
              targetCategory.STACK.BUY_STACK,
              {
                ...(item as any),
                amount: remainAmount.toNumber(),
              },
            )
          : null,
        latestPriceTracker
          ? this.repository.updateLatestConfirmedPrice(
              latestPriceTracker,
              item.category,
              item.type,
            )
          : null,
      ]);

      // 서비스의 체결 API 호출
      const sellers: Trader[] | ResourceTrader[] = completes.map((it) =>
        it.toTrader(),
      );

      if (partial) {
        sellers.push({
          ...partial.toTrader(),
          amount: partialAmount,
        });
      }

      if (sellers.length) {
        await this.mv2ApiClient.requestWriteMatchings(
          {
            tradingType: TradingType.BUYING,
            type: Number(item.type),
            buyers: [
              {
                ...item.toTrader(),
                amount: new Decimal(item.amount).minus(remainAmount).toNumber(),
              },
            ],
            sellers,
          },
          item.category,
        );
      }
    } catch (e) {
      this.logger.error('에러가 발생했습니다');
      this.logger.error(JSON.stringify(e));
      console.log(e);
      return;
    }
  }

  /**
   * 판매 처리
   * @param item
   */
  async handleSelling(item: TradingPendingItem) {
    const buyingOffers = (
      await this.repository.findBuyingOffers(item)
    ).reverse();

    const completes: TradingStackDto[] = []; // 완전히 거래한 물품
    let partial: TradingStackDto | null = null; // 부분적으로 거래한 물품
    let partialAmount: number | null; // 부분적으로 거래한 물량
    let latestPriceTracker: number | null = null; // 최근 거래가 반영 기록
    let remainAmount = new Decimal(item.amount); // 내 물량 중 더 처리해야할 물량

    while (buyingOffers.length) {
      const buyings = buyingOffers.pop();

      if (remainAmount.minus(buyings.amount).toNumber() >= 0) {
        completes.push(buyings);
        remainAmount = remainAmount.minus(buyings.amount);
      } else {
        partial = buyings;
        partialAmount = remainAmount.toNumber();
        remainAmount = new Decimal(0);
      }

      latestPriceTracker = buyings.price;
      if (remainAmount.toNumber() === 0) {
        break;
      }
    }
    const targetCategory = ENTIRE_KEYPAIR_MAP[item.category];

    try {
      await Promise.all([
        ...completes.map(({ id }) =>
          this.repository.deleteTradingStackItem(
            targetCategory.STACK.BUY_STACK,
            id,
          ),
        ),
        partial
          ? this.repository.updateTradingStackItemAmount(
              targetCategory.STACK.BUY_STACK,
              partial.id,
              new Decimal(partial.amount).minus(partialAmount).toNumber(),
            )
          : null,
        remainAmount.toNumber() > 0
          ? this.repository.addTradingStackItem(
              targetCategory.STACK.SELL_STACK,
              {
                ...(item as any),
                amount: remainAmount.toNumber(),
              },
            )
          : null,
        latestPriceTracker
          ? this.repository.updateLatestConfirmedPrice(
              latestPriceTracker,
              item.category,
              item.type,
            )
          : null,
      ]);

      // 서비스의 체결 API 호출
      const buyers: Trader[] | ResourceTrader[] = completes.map((it) =>
        it.toTrader(),
      );
      if (partial) {
        buyers.push({
          ...partial.toTrader(),
          amount: partialAmount,
        });
      }

      if (buyers.length) {
        await this.mv2ApiClient.requestWriteMatchings(
          {
            tradingType: TradingType.SELLING,
            type: Number(item.type),
            sellers: [
              {
                ...item.toTrader(),
                amount: new Decimal(item.amount).minus(remainAmount).toNumber(),
              },
            ],
            buyers,
          },
          item.category,
        );
      }
    } catch (e) {
      this.logger.error('에러가 발생했습니다');
      this.logger.error(JSON.stringify(e));
      console.log(e);
      return;
    }
  }

  /**
   * 구매 취소 처리
   */
  async handleCancelBuying(trading: TradingPendingCancelItem) {
    await this.repository.executeTradingCancelTemplate(
      trading,
      async (amount, type) => {
        trading.amount = amount;
        if (type) trading.type = type;
        await this.mv2ApiClient.requestTransactionCancelRedis(trading);
      },
    );
  }

  /**
   * 판매 취소 처리
   */
  async handleCancelSelling(trading: TradingPendingCancelItem) {
    await this.repository.executeTradingCancelTemplate(
      trading,
      async (amount, type) => {
        // TODO: tradingpendingcancelitem 은 amount/price 가 존재하지 않음 레디스에서 가져와서 써야함 단순 상속불가
        trading.amount = amount;
        if (type) trading.type = type;
        await this.mv2ApiClient.requestTransactionCancelRedis(trading);
      },
    );
  }

  /**
   * 전체 Stream size trim
   */
  async subscribeHandlingStreamSize() {
    while (true) {
      await this.repository.handleCurrentTradingStreamSize();

      await this.sleep(1000 * 60 * 10);
    }
  }
}
