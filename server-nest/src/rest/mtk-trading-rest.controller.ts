import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TRADING_KEYPAIR_MTK } from 'src/constants/redis-key.const';
import { TradingPendingResponseDto } from './dtos/trading-pending-list-response.dto';
import { TradingRestService } from './trading-rest.service';

@ApiTags('MTK Trading Info')
@Controller('tradings/mtk')
export class MTKTradingRestController {
  constructor(private readonly service: TradingRestService) {}

  /**
   * 내 거래 목록 조회
   * @param userId
   */
  @Get('/:userId')
  @ApiOperation({ summary: '현재 체결 대기 중인 나의 거래 목록' })
  async getBuyingList(@Param('userId') userId: string) {
    const result = await this.service.getMyTradings(
      userId,
      TRADING_KEYPAIR_MTK.SEARCH_INDEX,
    );

    return {
      total: result.total,
      data: result.documents.map(
        ({ value: $ }) => new TradingPendingResponseDto($),
      ),
    };
  }

  /**
   * 호가 목록 조회
   */
  @Get()
  @ApiOperation({ summary: '호가 목록 조회' })
  async getTradingList() {
    const result = await this.service.getTradingsFromCache(TRADING_KEYPAIR_MTK);

    return result;
  }
}
