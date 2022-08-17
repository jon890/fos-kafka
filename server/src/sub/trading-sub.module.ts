import { Module } from '@nestjs/common';
import { TradingSubController } from './trading-sub.controller';

@Module({
  imports: [],
  controllers: [TradingSubController],
  providers: [],
})
export class TradingSubModule {}
