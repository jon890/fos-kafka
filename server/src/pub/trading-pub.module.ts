import { Module } from '@nestjs/common';
import { NodeRedisProvivderFacatory } from 'src/redis/node-redis.provider';
import { RedisModule } from 'src/redis/redis.module';
import { MTKTradingPubController } from './mtk-trading-pub.controller';
import { RareTradingPubController } from './rare-trading-pub.controller';
import { ResourceTradingPubController } from './resource-trading-pub.controller';
import { TradingPubService } from './trading-pub.service';

@Module({
  imports: [RedisModule],
  controllers: [
    MTKTradingPubController,
    ResourceTradingPubController,
    RareTradingPubController,
  ],
  providers: [TradingPubService, NodeRedisProvivderFacatory],
})
export class TradingPubModule {}
