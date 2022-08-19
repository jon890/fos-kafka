import { throwStatement } from '@babel/types';
import { Controller, Logger } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { EVENT_NAME } from 'src/constants/event-name.const';
import { TradingSubService } from './trading-sub.service';

@Controller()
export class TradingSubController {
  private logger = new Logger(TradingSubController.name);

  constructor(private readonly service: TradingSubService) {}

  // @EventPattern(EVENT_NAME.TRADING)
  // handleTradingEvent(data: Record<string, any>) {
  //   this.logger.debug('Event Received');
  //   this.logger.debug(data);
  // }
}
