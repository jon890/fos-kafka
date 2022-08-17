import { Controller } from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  Payload,
  RedisContext,
} from '@nestjs/microservices';
import { TRADING_EVENT } from 'src/constants/trading-event.const';
import { TradingService } from './trading.service';

@Controller()
export class TradingHandler {
  constructor(private readonly tradingService: TradingService) {}

  @MessagePattern({ cmd: TRADING_EVENT.USER_BUYING })
  async getTrading(@Payload() data: any, @Ctx() context: RedisContext) {
    console.log(`data: ${JSON.stringify(data)}`);
    console.log(`Channel: ${context.getChannel()}`);
  }

  // @EventPattern(TRADING_EVENT.USER_BUYING)
  // async handldUserBuying(data: Record<string, any>) {
  //   console.log(`Handle User Buying`, data);
  // }
}
