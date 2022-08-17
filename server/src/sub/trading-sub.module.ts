import { Module } from '@nestjs/common';
import { RedisProvider } from './redis.provider';
import { TradingSubController } from './trading-sub.controller';
import { TradingSubService } from './trading-sub.service';
import { TradingRepository } from './trading.repository';

@Module({
  imports: [],
  controllers: [TradingSubController],
  providers: [TradingSubService, TradingRepository, RedisProvider],
})
export class TradingSubModule {}
