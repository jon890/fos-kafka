import { Module } from '@nestjs/common';
import { RedisProvider } from 'src/redis/redis.provider';
import { TradingSubController } from './trading-sub.controller';
import { TradingSubService } from './trading-sub.service';

@Module({
  imports: [],
  controllers: [TradingSubController],
  providers: [TradingSubService, RedisProvider],
})
export class TradingSubModule {}
