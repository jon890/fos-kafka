import { Controller, Logger } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { TRADING_EVENT } from 'src/constants/trading-event.const';

@Controller()
export class TradingSubController {
  private logger = new Logger(TradingSubController.name);

  @EventPattern(TRADING_EVENT.USER_BUYING)
  handldUserBuying(data: Record<string, any>) {
    this.logger.debug('Event Received');
  }
}
