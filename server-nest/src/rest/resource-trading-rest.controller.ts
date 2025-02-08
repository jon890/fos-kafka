import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TRADING_KEYPAIR_RESOURCE } from 'src/constants/redis-key.const';
import { TradingPendingResponseDto } from './dtos/trading-pending-list-response.dto';
import { TradingRestService } from './trading-rest.service';

@ApiTags('Resource Trading Info')
@Controller('tradings/resource')
export class ResourceTradingRestController {
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
      TRADING_KEYPAIR_RESOURCE.SEARCH_INDEX,
    );

    const resourceTypeMap = new Map<number, TradingPendingResponseDto[]>();
    result.documents
      .map(({ value: $ }) => new TradingPendingResponseDto($))
      .forEach((item) => {
        if (!resourceTypeMap.has(item.type)) {
          resourceTypeMap.set(item.type, [item]);
        } else {
          resourceTypeMap.set(item.type, [
            ...resourceTypeMap.get(item.type),
            item,
          ]);
        }
      });

    const data = [];
    for (const [type, array] of resourceTypeMap.entries()) {
      data.push({ type, array });
    }

    return {
      total: result.total,
      data,
    };
  }

  /**
   * 호가 목록 조회
   */
  @Get()
  @ApiOperation({ summary: '호가 목록 조회' })
  async getTradingList(@Query('resourceType') type: number) {
    const result = await this.service.getTradingsFromCache(
      TRADING_KEYPAIR_RESOURCE,
      type,
    );
    return result;
  }
}
