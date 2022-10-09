import { Module } from '@nestjs/common';
import { NodeRedisProvivderFacatory } from 'src/redis/node-redis.provider';
import { RedisModule } from 'src/redis/redis.module';
import { MTKTradingRestController } from './mtk-trading-rest.controller';
import { RareTradingRestController } from './rare-trading-rest.controller';
import { ResourceTradingRestController } from './resource-trading-rest.controller';
import { TradingRestService } from './trading-rest.service';

@Module({
  imports: [RedisModule],
  controllers: [
    MTKTradingRestController,
    ResourceTradingRestController,
    RareTradingRestController,
  ],
  providers: [TradingRestService, NodeRedisProvivderFacatory],
})
export class TradingRestModule {}
