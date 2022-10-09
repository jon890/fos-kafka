import { Module } from '@nestjs/common';
import { Metaverse2ApiClient } from 'src/client/metaverse2-api.client';
import { Metaverse2ClientModule } from 'src/client/metaverse2-client.module';
import { NodeRedisProvivderFacatory } from 'src/redis/node-redis.provider';
import { RedisModule } from 'src/redis/redis.module';
import { TradingSubController } from './trading-sub.controller';
import { TradingSubRepository } from './trading-sub.repository';
import { TradingSubService } from './trading-sub.service';

@Module({
  imports: [Metaverse2ClientModule, RedisModule],
  controllers: [TradingSubController],
  providers: [
    TradingSubService,
    TradingSubRepository,
    NodeRedisProvivderFacatory,
    Metaverse2ApiClient,
  ],
})
export class TradingSubModule {}
