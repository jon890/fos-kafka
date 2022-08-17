import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { INJECT_TOKEN } from 'src/constants/inject.token';
import { OUTER_SERVICE } from 'src/constants/service.const';
import { TradingHandler } from './trading.handler';
import { TradingService } from './trading.service';

@Module({
  imports: [
    ClientsModule.register([
      // The name property serves as an injection token
      // that can be used to inject an instance of a ClientProxy where needed.
      {
        name: INJECT_TOKEN.TRADING_EVENT_CLIENT,
        transport: Transport.REDIS,
        options: {
          host: OUTER_SERVICE.REDIS_TRADING.name,
          port: OUTER_SERVICE.REDIS_TRADING.port,
        },
      },
    ]),
  ],
  controllers: [TradingHandler],
  providers: [TradingService],
  exports: [ClientsModule, TradingService],
})
export class TradingModule {}
