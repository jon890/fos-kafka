import { CacheModule, Logger, Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Metaverse2ClientModule } from './client/metaverse2-client.module';
import { TradingPubModule } from './pub/trading-pub.module';
import { RedisModule } from './redis/redis.module';
import { TradingRestModule } from './rest/trading-rest.module';
import { TradingSubModule } from './sub/trading-sub.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['./env/.prod.env', './env/.dev.env', './env/.local.env'],
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 0,
    }),
    RedisModule,
    TradingPubModule,
    TradingSubModule,
    TradingRestModule,
    Metaverse2ClientModule,
  ],
})
export class AppModule implements OnModuleInit {
  onModuleInit() {
    Logger.debug('App Init');
  }
}
