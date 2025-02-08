import { Controller, Logger } from '@nestjs/common';
import { TradingSubService } from './trading-sub.service';

@Controller()
export class TradingSubController {
  private logger = new Logger(TradingSubController.name);

  constructor(private readonly service: TradingSubService) {}
}
