import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import got, { Got } from 'got/dist/source';
import { CONFIG_KEY } from 'src/constants/config.const';
import {
  TRADING_KEYPAIR_MTK,
  TRADING_KEYPAIR_RARE,
  TRADING_KEYPAIR_RESOURCE,
} from 'src/constants/redis-key.const';
import { MatchingRequesDto } from 'src/dto/matching-request.dto';
import { TradingPendingCancelItem } from 'src/dto/trading-pending-cancel.item';

@Injectable()
export class Metaverse2ApiClient {
  private logger = new Logger(Metaverse2ApiClient.name);
  private got: Got;

  constructor(private readonly configService: ConfigService) {
    const baseUrl = this.configService.get<string>(
      CONFIG_KEY.METAVERSE2_API_BASE_URL,
    );

    this.got = got.extend({
      prefixUrl: baseUrl,
      headers: {
        accept: 'application/json',
      },
      responseType: 'json',
    });
  }

  requestWriteMatchings(dto: MatchingRequesDto, category: string) {
    if (category === TRADING_KEYPAIR_MTK.NAME) {
      return this.got
        .post('api/v2/p2p/mtk/matched', {
          json: dto,
        })
        .json();
    } else if (category === TRADING_KEYPAIR_RESOURCE.NAME) {
      return this.got
        .post('api/v2/p2p/resource/matched', {
          json: dto,
        })
        .json();
    } else if (category === TRADING_KEYPAIR_RARE.NAME) {
      return this.got
        .post('api/v2/p2p/rare/matched', {
          json: dto,
        })
        .json();
    }
  }

  requestTransactionCancelRedis(dto: TradingPendingCancelItem) {
    const { userId, tradingType, amount, category, type } = dto;
    if (category === TRADING_KEYPAIR_MTK.NAME) {
      return this.got
        .delete('api/v2/p2p/mtk/canceled', {
          json: {
            userId,
            tradingType,
            amount,
          },
        })
        .json();
    } else if (category === TRADING_KEYPAIR_RESOURCE.NAME) {
      return this.got.delete('api/v2/p2p/resource/canceled', {
        json: {
          userId,
          tradingType,
          amount,
          type,
        },
      });
    } else if (category === TRADING_KEYPAIR_RARE.NAME) {
      return this.got.delete('api/v2/p2p/rare/canceled', {
        json: {
          userId,
          tradingType,
          amount,
          type,
        },
      });
    } else {
      return;
    }
  }
}
